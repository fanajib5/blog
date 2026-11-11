---
title: "Membangun TCP Listener untuk GPS Device di Go"
description: "Cara membuat TCP server di Go untuk menerima koneksi dari ratusan GPS tracker secara concurrent: dari net.Listen, framing paket binary dari stream TCP, read deadline, sampai graceful shutdown."
author: "Faiq Najib Al-Aziz"
date: 2026-09-22
lastmod: 2026-09-22
draft: false
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

Bayangkan 500 GPS tracker nyambung ke server bersamaan. Masing-masing kirim posisi tiap 10-30 detik, sementara sebagian cuma kirim _heartbeat_ kalau lagi diam. Koneksinya bisa awet berjam-jam, putus tanpa pamit, atau kirim data dalam potongan-potongan. Ehem, ramai sekali.

Kalau kamu terbiasa dengan HTTP API, ingat bahwa TCP sendiri tidak punya struktur _request-response_. Listener cuma menerima aliran byte, dan aplikasilah yang harus menafsirkannya.

Di [Part 1](/writing/2026/memahami-gps-protocol/) kita sudah membahas cara device berkomunikasi lewat koneksi TCP persisten dan paket _binary_ dengan aturan berbeda di tiap vendor. Nah, di sini kita bikin _TCP listener_ di Go untuk menerima koneksi-koneksi itu.

Polanya sama dengan yang menangani ratusan device di sistem produksi saya. Implementasinya hanya pakai _standard library_ Go, tanpa _framework_.

## Yang Kita Bangun di Artikel Ini

Targetnya satu program kecil yang:

1. Menerima banyak koneksi secara _concurrent_, satu _goroutine_ per koneksi
2. Menyusun ulang **frame GT06** dari _stream_ TCP mentah (bagian ini yang paling sering bikin salah)
3. Memutus koneksi "zombie" yang sudah mati tanpa kabar
4. Mati dengan sopan saat di-_deploy_ ulang (_graceful shutdown_)

Kita belum akan men-_decode_ isi paket, menyimpan data ke database, atau menambah antrean pesan. Paket login, paket posisi, dan balasan ACK yang valid butuh CRC-ITU; itu dibahas di [Part 3](/writing/2026/decode-packet-gt06-teltonika/). Listener cukup menerima dan menyusun frame, urusan setelahnya belakangan.

## TCP Server Dasar

Kita mulai dari server paling sederhana:

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

`net.Listen` membuka port, lalu _loop_ `Accept` menerima koneksi. Setiap koneksi ditangani _goroutine_ sendiri. **Goroutine itu murah**: stack awalnya cuma beberapa kilobyte, bukan megabyte seperti thread OS. Jadi pola "satu goroutine per koneksi" tetap ringan di 500, 5.000, bahkan 50.000 koneksi.

Untuk GPS listener, saya tidak menyarankan HTTP: ada overhead _header_ per request, koneksi berumur pendek, dan _parsing_ HTTP tidak berguna untuk paket _binary_ mentah. Lagipula device kamu tidak kirim `Content-Type` hehe.

## Jebakan Pertama: TCP Itu Stream, Bukan Pesan

Ini beda utama antara TCP listener GPS dan HTTP handler.

Kode HTTP terbiasa dengan asumsi: satu request = satu paket utuh. Di TCP **tidak ada jaminan begitu**. `conn.Read(buf)` cuma bilang "kasih aku byte yang ada sekarang", artinya:

- **Satu frame bisa terpotong.** Device kirim frame 70 byte, `Read` pertama dapat 40 byte, sisanya datang 200 ms kemudian.
- **Dua frame bisa nempel jadi satu.** Device kirim dua frame beruntun, `Read` dapat keduanya sekaligus.
- **Byte sampah bisa muncul.** Device yang baru _boot_ kadang menyembur junk sebelum paket pertamanya.

Kalau hasil `Read` dianggap satu paket utuh, proses decode bisa gagal secara acak, dan masalahnya gampang disangka dari device. (Saya pernah. Lama.)

Solusinya **framing manual**. Kita pakai `bufio.Reader` untuk membaca _stream_, cari _start bit_ GT06 (`0x78 0x78`), baca _length_, lalu ambil sisa frame sesuai panjangnya:

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
			continue // byte sampah, lewati
		}
		b2, err := r.ReadByte()
		if err != nil {
			return nil, err
		}
		if b2 != 0x78 {
			continue // 0x78 tunggal, bukan start bit; lanjut cari
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

`io.ReadFull` **menunggu sampai buffer terisi penuh**, jadi byte yang datang terpotong-potong tetap tersusun jadi satu frame. `bufio.Reader` menyimpan byte yang belum terpakai; kalau dua frame datang berurutan, byte frame kedua tetap tersedia untuk pembacaan berikutnya.

Ingat aturan framing dari Part 1: angka `len` dihitung dari _protocol number_ sampai CRC inklusif. Itulah kenapa setelah _length byte_ kita tarik `len + 2` byte lagi (isi frame + CRC + _stop bit_).

## handleConnection: Loop Baca Frame

Dengan framing tadi, handler tinggal membaca frame dari tiap koneksi:

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

Untuk sekarang, handler cuma mencatat frame dalam format _hex_. Di Part 3, baris `TODO` itu kita ganti dengan decoder.

## Koneksi Zombie dan Read Deadline

Baris `conn.SetReadDeadline(...)` menentukan berapa lama handler menunggu data.

Device GPS di jaringan GSM bisa putus tanpa mengirim paket penutup TCP (FIN), misalnya karena sinyal hilang, baterai dicabut, atau _carrier_ me-_reset_ koneksi. Server lalu masih mencatat koneksi yang **sudah mati tapi dikira hidup**. Kalau dibiarkan, koneksi begini menumpuk dan menghabiskan _file descriptor_.

Dengan `SetReadDeadline`, kalau tidak ada byte yang datang sebelum batas waktu, `Read` gagal dengan _timeout error_. Handler keluar dan koneksi ditutup.

**Deadline harus lebih besar dari interval heartbeat device.** Seperti di Part 1, device yang diam mengirim _heartbeat_ tiap 2-5 menit. Deadline 90 detik akan memutus device sehat yang cuma lagi diam. Makanya nilainya saya set:

```go
// harus LEBIH BESAR dari interval heartbeat device (GT06: 2-5 menit saat idle)
var readTimeout = 10 * time.Minute
```

Deadline di-_reset_ setiap kali frame berhasil dibaca, sehingga device yang aktif tetap terhubung.

## Mati dengan Sopan: Graceful Shutdown

Listener production bisa di-_restart_ saat deploy, _scaling_, atau pemeliharaan. Saat container atau sistem dihentikan, OS biasanya mengirim sinyal `SIGTERM` dan memberi proses waktu untuk menutup diri sebelum dimatikan paksa.

Waktu itu kita pakai untuk menutup _listener_, menutup koneksi aktif, dan menunggu _goroutine_ selesai sebelum program keluar.

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

`connTracker` menyimpan koneksi aktif agar semuanya bisa ditutup sekaligus:

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

`signal.NotifyContext` mengubah `SIGTERM` atau Ctrl+C menjadi `ctx.Done()`. Goroutine penutup menutup _listener_, sehingga `Accept` gagal dan _loop_ utama berhenti, lalu menutup koneksi aktif. `sync.WaitGroup` menunggu semua handler selesai sebelum `main` keluar.

## Menguji Tanpa Device Asli

Kamu bisa mencoba kode ini tanpa tracker fisik. Fitur `/dev/tcp` di Bash cukup untuk mengirim data seolah-olah dari device GT06:

```bash
exec 3<>/dev/tcp/127.0.0.1/5094
printf '\x78\x78\x0d\x01\x01\x23\x45\x67\x89\x01\x23\x45\x00\x01\x8c\xdd\x0d\x0a' >&3
```

Itu frame _login_ GT06 dari datasheet, dengan terminal ID `123456789012345`, yang dibahas di [Part 1](/writing/2026/memahami-gps-protocol/). Saya menguji program di atas melalui loopback di laptop dengan skenario berikut:

| Skenario                                                     | Hasil                                               |
| ------------------------------------------------------------ | --------------------------------------------------- |
| Satu frame utuh                                              | Terbaca satu frame, 18 byte ✓                       |
| Frame dikirim terpotong dua tahap (sisanya 1 detik kemudian) | Tetap tersusun jadi satu frame ✓                    |
| Dua frame dikirim dalam satu write                           | Terpisah jadi dua frame ✓                           |
| Byte sampah (`FF DE AD`) sebelum frame                       | Sampah di-skip, frame tetap terbaca ✓               |
| 20 koneksi konkuren, tiap koneksi kirim frame                | 20 frame terbaca tanpa race ✓                       |
| `SIGTERM` saat ada koneksi aktif                             | Listener + koneksi ditutup, program keluar bersih ✓ |

Berikut output log dari saat server mulai hingga berhenti:

```text
2026/09/12 20:25:31 listening on :5094
2026/09/12 20:25:32 connected: 127.0.0.1:45870
2026/09/12 20:25:32 frame from 127.0.0.1:45870: 78780D01012345678901234500018CDD0D0A (18 bytes)
2026/09/12 20:25:33 shutting down: menutup listener dan koneksi aktif
2026/09/12 20:25:33 bye
```

## Catatan Sebelum Lanjut

- **Goroutine per koneksi** itu pola standar untuk TCP server di Go. Goroutine ringan, ratusan ribu koneksi pun masih sanggup.
- **TCP adalah stream.** Satu `Read` ≠ satu paket. Framing manual (start bit + length + `io.ReadFull`) satu-satunya cara yang benar untuk membaca protokol binary.
- **Deadline > interval heartbeat.** SetReadDeadline membantu membersihkan koneksi yang putus, tapi nilai yang terlalu pendek akan memutus device sehat.
- **Tutup koneksi saat shutdown.** `SIGTERM` memberi kesempatan untuk menutup listener dan koneksi aktif dengan rapi.

Listener ini sudah menerima dan menyusun frame, tapi belum membaca payload atau membalas ACK. Tanpa ACK, device sungguhan mengira server tidak merespons dan terus mengirim ulang paket lama. Dua-duanya butuh CRC-ITU dan pemahaman struktur payload GT06.

## Selanjutnya

Artikel ini bagian dari seri **Membangun GPS Backend dari Nol**.

- Sebelumnya: [Part 1: Memahami GPS Protocol](/writing/2026/memahami-gps-protocol/)
- Selanjutnya: [Part 3: Decode Packet: GT06 & Teltonika Protocol](/writing/2026/decode-packet-gt06-teltonika/). Di sana kita tulis decoder asli: parse login & posisi, hitung CRC, dan balas ACK yang valid.

## Ngobrol

Kalau ada yang mau didiskusikan soal listener GPS ini, hubungi saya lewat [Contact](/contact/). Kamu juga bisa subscribe [RSS](/writing/index.xml) untuk mengikuti artikel berikutnya.
