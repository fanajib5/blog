---
title: "Membangun TCP Listener untuk GPS Device di Go"
description: "Cara membuat TCP server di Go untuk menerima koneksi dari ratusan GPS tracker secara concurrent — dari net.Listen, framing paket binary dari stream TCP, read deadline, sampai graceful shutdown."
author: "Faiq Najib Al-Aziz"
date: 2026-09-22
lastmod: 2026-09-22
draft: true
toc: true
comments: true
images:
  - og.png
tags:
  - golang
  - gps
  - tcp
  - networking
pillar: "gps-iot"
series: "gps-backend-series"
series_part: 2
---

Bayangkan 500 GPS tracker terhubung ke server kamu secara bersamaan, masing-masing mengirim data posisi setiap 10–30 detik, dan sebagian hanya kirim _heartbeat_ saat diam. Koneksi itu hidup berjam-jam, kadang putus tanpa pamit, kadang kirim data setengah-setengah.

Kalau kamu datang dari dunia HTTP API — satu _request_ = satu _response_ yang rapi — dunia TCP ini terasa seperti pindah dari mengantar paket kurir ke mengelola pos antrean surat yang tidak pernah sepi.

Di [Part 1](/writing/2026/memahami-gps-protocol/) kita sudah paham cara device berkomunikasi: koneksi TCP persisten dan paket _binary_ dengan aturan main per vendor. Sekarang kita bangun pintu masuknya: _TCP listener_ di Go yang jadi rumah bagi ratusan koneksi device.

Pola yang saya pakai di artikel ini adalah pola yang sama dengan yang menangani ratusan device di sistem produksi — tanpa _framework_, cukup _standard library_.

## Yang Kita Bangun di Artikel Ini

Target akhirnya satu program kecil yang:

1. Menerima banyak koneksi secara _concurrent_ — satu _goroutine_ per koneksi
2. Menyusun ulang **frame GT06** dari _stream_ TCP mentah (ini bagian yang paling sering bikin salah)
3. Memutus koneksi "zombie" yang sudah mati tanpa kabar
4. Mati dengan sopan saat di-_deploy_ ulang (_graceful shutdown_)

Yang **tidak** kita kerjakan dulu: men-_decode_ isi paket (login, posisi, dan cara membalas ACK yang valid butuh CRC-ITU — itu [Part 3](/writing/2026/decode-packet-gt06-teltonika/)), menyimpan ke database, dan antrean pesan. Listener yang baik justru _tidak tahu_ semua itu ada.

## TCP Server Dasar

Mulai dari bentuk paling sederhana:

```go
listener, err := net.Listen("tcp", ":5094")
if err != nil {
    log.Fatal(err)
}
defer listener.Close()

for {
    conn, err := listener.Accept()
    if err != nil {
        log.Printf("accept error: %v", err)
        continue
    }
    go handleConnection(conn)
}
```

`net.Listen` membuka port, lalu kita masuk _loop_ `Accept` — setiap koneksi masuk ditangani di _goroutine_-nya sendiri. Ini keunggulan Go untuk use case ini: **goroutine itu murah** (stack awalnya beberapa kilobyte, bukan megabytes seperti thread OS), jadi pola "satu goroutine per koneksi" tetap ringan di 500, 5.000, bahkan 50.000 koneksi.

Untuk GPS listener, saya tidak merekomendasikan HTTP sama sekali — overhead _header_ per request, koneksi berumur pendek, dan _parsing_ HTTP tidak ada gunanya untuk paket _binary_ mentah. Device kamu tidak akan mengirim `Content-Type`.

## Jebakan Pertama: TCP Itu Stream, Bukan Pesan

Ini pelajaran paling penting di artikel ini, dan ini yang membedakan TCP listener GPS dari HTTP handler.

Kode HTTP terbiasa dengan asumsi: satu request = satu paket utuh. Di TCP **tidak ada jaminan begitu**. `conn.Read(buf)` cuma bilang "berikan aku byte yang ada sekarang", artinya:

- **Satu frame bisa terpotong.** Device kirim frame 70 byte, `Read` pertama dapat 40 byte, sisanya datang 200 ms kemudian.
- **Dua frame bisa nempel jadi satu.** Device kirim dua frame beruntun, `Read` dapat keduanya sekaligus.
- **Byte sampah bisa muncul.** Device yang baru _boot_ kadang menyembur junk sebelum paket pertamanya.

Kalau kamu langsung memperlakukan hasil `Read` sebagai satu paket — decode-nya akan rusak acak, tidak _reproducible_, dan kamu akan mengira device-nya yang rusak. (Saya pernah.)

Solusinya: **framing manual**. Kita baca _stream_ dengan `bufio.Reader`, sinkronisasi ke _start bit_ GT06 (`0x78 0x78`), baca _length_, lalu tarik sisa frame persis sepanjang yang dibutuhkan:

```go
// readFrame membaca satu frame GT06 dari stream:
//
//	78 78 | len | protocol | data | serial | crc | 0D 0A
func readFrame(r *bufio.Reader) ([]byte, error) {
	// 1. sinkronisasi: buang byte sampai ketemu start bit 78 78
	for {
		b, err := r.ReadByte()
		if err != nil {
			return nil, err
		}
		if b != 0x78 {
			continue // byte sampah — lewati
		}
		b2, err := r.ReadByte()
		if err != nil {
			return nil, err
		}
		if b2 != 0x78 {
			continue // 0x78 tunggal, bukan start bit — lanjut cari
		}
		break
	}

	frame := []byte{0x78, 0x78}

	// 2. baca length (1 byte: jumlah byte protocol sampai CRC, inklusif)
	lenByte, err := r.ReadByte()
	if err != nil {
		return nil, err
	}
	frame = append(frame, lenByte)

	// 3. tarik sisa frame: len + 2 byte (isi + CRC + stop bit 0D 0A)
	rest := make([]byte, int(lenByte)+2)
	if _, err := io.ReadFull(r, rest); err != nil {
		return nil, err
	}
	frame = append(frame, rest...)

	// 4. validasi stop bit
	if frame[len(frame)-2] != 0x0D || frame[len(frame)-1] != 0x0A {
		return nil, fmt.Errorf("stop bit tidak valid: %X", frame[len(frame)-2:])
	}
	return frame, nil
}
```

Kuncinya `io.ReadFull`: dia **memblokir sampai buffer terisi penuh** — otomatis menyusun frame yang datang terpotong-potong. Sementara `bufio.Reader` menyimpan sisa byte yang belum terpakai, jadi dua frame yang nempel tidak "hilang" satu.

Ingat ingar-bingar dari Part 1: angka `len` dihitung dari _protocol number_ sampai CRC inklusif. Itulah kenapa setelah _length byte_ kita tarik `len + 2` byte lagi (isi frame + CRC + _stop bit_).

## handleConnection: Loop Baca Frame

Dengan framing di tempat, handler per koneksi jadi sederhana:

```go
func handleConnection(ctx context.Context, conn net.Conn) {
	defer conn.Close()
	remote := conn.RemoteAddr().String()
	log.Printf("connected: %s", remote)

	reader := bufio.NewReader(conn)
	for {
		conn.SetReadDeadline(time.Now().Add(readTimeout))

		frame, err := readFrame(reader)
		if err != nil {
			if errors.Is(err, io.EOF) {
				log.Printf("disconnected: %s", remote)
			} else if ctx.Err() == nil {
				log.Printf("read error (%s): %v", remote, err)
			}
			return
		}
		log.Printf("frame from %s: %X (%d bytes)", remote, frame, len(frame))
		// TODO part 3: decode payload + balas ACK valid (butuh CRC-ITU)
	}
}
```

Untuk sekarang kita cukup _log_ frame dalam _hex_. Di Part 3, baris `TODO` itu diganti decoder asli.

## Koneksi Zombie dan Read Deadline

Perhatikan baris `conn.SetReadDeadline(...)` di atas — itu bukan hiasan.

Device GPS di jaringan GSM sering "hilang" tanpa mengirim paket penutup TCP (FIN): sinyal putus, baterai dicabut, _carrier_ me-_reset_ koneksi. Akibatnya di sisi server ada koneksi yang **sudah mati tapi masih tercatat hidup** — zombie. Tanpa penanganan, zombie menumpuk dan pelan-pelan memakan _file descriptor_.

`SetReadDeadline` menyelesaikannya: kalau tidak ada byte apa pun datang dalam batas waktu, `Read` akan gagal dengan _timeout error_ → handler keluar → koneksi ditutup.

Satu hal yang harus diperhatikan: **deadline harus lebih besar dari interval heartbeat device**. Ingat Part 1: device yang diam kirim _heartbeat_ tiap 2–5 menit. Kalau deadlinemu 90 detik, kamu akan memutus device sehat yang hanya sedang berdiri diam di parkiran. Karena itu saya set:

```go
// harus LEBIH BESAR dari interval heartbeat device (GT06: 2-5 menit saat idle)
var readTimeout = 10 * time.Minute
```

Deadline di-_reset_ setiap kali frame berhasil dibaca — jadi device yang aktif tidak akan pernah terputus.

## Mati dengan Sopan: Graceful Shutdown

Listener production akan sering di-_restart_ (deploy, _scaling_, pemeliharaan). Saat container atau sistem di-restart, yang terjadi bukan tombol "power off" — OS mengirim sinyal (biasanya `SIGTERM`) dan memberi waktu sebentar sebelum dipaksa mati.

Kita manfaatkan waktu itu: tutup _listener_ supaya tidak ada koneksi baru, tutup semua koneksi aktif, tunggu _goroutine_ selesai, baru keluar.

```go
func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	listener, err := net.Listen("tcp", ":5094")
	if err != nil {
		log.Fatal(err)
	}

	var wg sync.WaitGroup
	conns := newConnTracker()

	// goroutine penutup: saat sinyal datang, tutup listener + semua koneksi aktif
	go func() {
		<-ctx.Done()
		log.Println("shutting down: menutup listener dan koneksi aktif")
		listener.Close()
		conns.CloseAll()
	}()

	log.Println("listening on :5094")
	for {
		conn, err := listener.Accept()
		if err != nil {
			if ctx.Err() != nil {
				break // shutdown: keluar dari accept loop
			}
			log.Printf("accept error: %v", err)
			continue
		}
		wg.Add(1)
		conns.Add(conn)
		go func() {
			defer wg.Done()
			defer conns.Remove(conn)
			handleConnection(ctx, conn)
		}()
	}

	wg.Wait()
	log.Println("bye")
}
```

Dan `connTracker` — peta koneksi aktif yang dipakai untuk menutup semuanya sekaligus:

```go
type connTracker struct {
	mu    sync.Mutex
	conns map[net.Conn]struct{}
}

func newConnTracker() *connTracker {
	return &connTracker{conns: make(map[net.Conn]struct{})}
}

func (t *connTracker) Add(c net.Conn) {
	t.mu.Lock()
	t.conns[c] = struct{}{}
	t.mu.Unlock()
}

func (t *connTracker) Remove(c net.Conn) {
	t.mu.Lock()
	delete(t.conns, c)
	t.mu.Unlock()
}

func (t *connTracker) CloseAll() {
	t.mu.Lock()
	defer t.mu.Unlock()
	for c := range t.conns {
		c.Close()
	}
}
```

Alurnya: `signal.NotifyContext` mengubah `SIGTERM`/Ctrl+C menjadi `ctx.Done()`. Goroutine penutup lalu menutup _listener_ (membuat `Accept` gagal dan _loop_ utama berhenti) plus semua koneksi aktif. `sync.WaitGroup` memastikan semua handler selesai sebelum `main` keluar.

## Menguji Tanpa Device Asli

Kamu tidak butuh tracker fisik untuk mencoba kode ini. Bash punya `/dev/tcp` — cukup untuk berperan jadi device GT06 palsu:

```bash
exec 3<>/dev/tcp/127.0.0.1/5094
printf '\x78\x78\x0d\x01\x01\x23\x45\x67\x89\x01\x23\x45\x00\x01\x8c\xdd\x0d\x0a' >&3
```

Itu frame _login_ GT06 dari datasheet (terminal ID `123456789012345`) yang kita bedah di [Part 1](/writing/2026/memahami-gps-protocol/). Program di atas saya uji dengan skenario berikut (loopback, di laptop saya):

| Skenario                                                     | Hasil                                               |
| ------------------------------------------------------------ | --------------------------------------------------- |
| Satu frame utuh                                              | Terbaca satu frame, 18 byte ✓                       |
| Frame dikirim terpotong dua tahap (sisanya 1 detik kemudian) | Tetap tersusun jadi satu frame ✓                    |
| Dua frame dikirim dalam satu write                           | Terpisah jadi dua frame ✓                           |
| Byte sampah (`FF DE AD`) sebelum frame                       | Sampah di-skip, frame tetap terbaca ✓               |
| 20 koneksi konkuren, tiap koneksi kirim frame                | 20 frame terbaca tanpa race ✓                       |
| `SIGTERM` saat ada koneksi aktif                             | Listener + koneksi ditutup, program keluar bersih ✓ |

Dan output log lengkapnya, dari hidup sampai mati:

```text
2026/09/12 20:25:31 listening on :5094
2026/09/12 20:25:32 connected: 127.0.0.1:45870
2026/09/12 20:25:32 frame from 127.0.0.1:45870: 78780D01012345678901234500018CDD0D0A (18 bytes)
2026/09/12 20:25:33 shutting down: menutup listener dan koneksi aktif
2026/09/12 20:25:33 bye
```

## Yang Harus Kamu Pahami Sebelum Lanjut

- **Goroutine per koneksi** adalah pola standar untuk TCP server di Go — murah dan cukup untuk ratusan ribu koneksi.
- **TCP adalah stream.** Satu `Read` ≠ satu paket. Framing manual (start bit + length + `io.ReadFull`) adalah satu-satunya cara yang benar membaca protokol binary.
- **Deadline > interval heartbeat.** SetReadDeadline membasmi koneksi zombie, tapi salah set angka akan memutus device sehat.
- **Jangan mati kasar.** `SIGTERM` adalah kesempatan menutup listener dan koneksi dengan rapi — terutama saat deploy berulang.

Saat ini listener kita bisa menerima dan menata frame, tapi belum mengerti isinya — dan yang sama pentingnya: **belum membalas ACK**, jadi device sungguhan akan menganggap server kita mati dan terus mengirim ulang. Keduanya butuh pemahaman CRC-ITU dan struktur payload GT06.

## What's Next

Artikel ini bagian dari seri **Membangun GPS Backend dari Nol**.

- Sebelumnya: [Part 1 — Memahami GPS Protocol](/writing/2026/memahami-gps-protocol/)
- Selanjutnya: [Part 3 — Decode Packet: GT06 & Teltonika Protocol](/writing/2026/decode-packet-gt06-teltonika/) — kita akan menulis decoder asli: parse login & posisi, hitung CRC, dan balas ACK yang valid.

## CTA

Bagikan artikel ini jika bermanfaat. Untuk diskusi lebih lanjut, kunjungi [Contact](/contact/) atau subscribe [RSS](/writing/index.xml).
