---
title: "Decode Packet: GT06 & Teltonika Protocol"
description: "Mengurai packet binary GPS tracker di Go: CRC-ITU GT06 yang ternyata bukan CCITT biasa, decode IMEI BCD, ekstraksi koordinat, sampai struktur AVL Teltonika — semua diverifikasi terhadap datasheet."
author: "Faiq Najib Al-Aziz"
date: 2026-10-14
lastmod: 2026-10-14
draft: false
toc: true
comments: true
images:
  - og.png
tags:
  - golang
  - gps
  - protocol
  - binary
pillar: "gps-iot"
series: "gps-backend-series"
series_part: 3
---

Di [Part 2](/writing/2026/tcp-listener-gps-go/) kita sudah punya listener yang merapikan _stream_ TCP menjadi frame utuh. Sekarang kita baca isinya. Byte `0x78 0x78 0x0D 0x01 ...` perlu diterjemahkan menjadi informasi seperti `IMEI 123456789012345, posisi -7.2575, 112.7521, arah 180°`.

Saat menulis artikel ini, saya sempat yakin contoh packet login dari datasheet GT06 adalah `... 6C 00 01 8C ...` dan implementasi CRC-nya cukup memakai CRC-CCITT standar. **Dua-duanya salah.** Saya baru tahu setelah kode saya sendiri menolak contoh datasheet. Pengalaman itu mengingatkan saya bahwa saat menangani protokol binary, lebih baik menguji dengan vektor daripada mengandalkan ingatan.

Kita akan membedah GT06, lalu melihat struktur Teltonika dan perbedaan desainnya. Semua kode di bawah sudah diuji terhadap contoh resmi datasheet Concox GT06 v1.8.1 dan struktur decoder [Traccar](https://www.traccar.org/)[^traccar] yang dipakai di production bertahun-tahun.

## Jebakan #1: "CRC-ITU" GT06 Bukan CRC-CCITT yang Kamu Kirim

Datasheet GT06 cuma bilang: field CRC berisi _CRC-ITU value_. Referensi paling umum tentang CRC-ITU adalah CRC-16/CCITT dengan polynomial 0x1021. Di sinilah jebakannya: ada belasan varian CRC dengan polynomial yang sama, dibedakan oleh nilai awal (_init_), arah pemrosesan (_reflected_), dan XOR akhir.

Saya brute-force semua varian 0x1021 yang umum terhadap contoh resmi datasheet. Packet login `78 78 0D 01 01 23 45 67 89 01 23 45 00 01 8C DD 0D 0A` memiliki CRC `0x8CDD`:

| Varian (poly 0x1021) | Init   | Reflected | XOR out    | Hasil           |
| -------------------- | ------ | --------- | ---------- | --------------- |
| CCITT-FALSE          | 0xFFFF | tidak     | 0x0000     | `0x81F6` ❌     |
| XMODEM               | 0x0000 | tidak     | 0x0000     | `0x55F9` ❌     |
| X25                  | 0xFFFF | **ya**    | **0xFFFF** | **`0x8CDD` ✅** |

Jawabannya: **varian X25**, diproses _reflected_ dan di-XOR `0xFFFF` di akhir. CRC dihitung bukan dari protocol number, melainkan **dari byte _length_ sampai _serial number_ (inklusif)**, sesuai redaksi datasheet WD-209: _"from packet length to information serial number (including)"_.

Implementasinya di Go:

```go
// crcITU = "CRC-ITU" GT06: varian CRC-16/X25
// (poly 0x1021, init 0xFFFF, reflected, xor-out 0xFFFF).
// Scope: byte LENGTH sampai SERIAL (inklusif).
func crcITU(data []byte) uint16 {
    crc := uint16(0xFFFF)
    for _, b := range data {
        crc ^= uint16(b)
        for i := 0; i < 8; i++ {
            if crc&1 != 0 {
                crc = (crc >> 1) ^ 0x8408 // 0x1021 versi reflected
            } else {
                crc >>= 1
            }
        }
    }
    return crc ^ 0xFFFF
}
```

Di sisi produksi, Traccar, server GPS open source yang paling banyak dipakai di dunia, **tidak memvalidasi CRC masukan untuk GT06**. Pasar dipenuhi klon/OEM GT06 dengan perhitungan CRC yang sedikit berbeda. Di artikel ini, kita tetap memvalidasi CRC dan membuang paket yang cacat sesuai anjuran datasheet. Perbedaan implementasi CRC pada perangkat klon bisa membuat sebagian paket ditolak.

## Parser Frame dengan Validasi CRC

Melengkapi `readFrame` dari Part 2, sekarang kita bongkar frame yang sudah utuh:

```go
type GT06Frame struct {
    Protocol byte
    Data     []byte   // isi payload
    Serial   uint16   // untuk pencocokan ACK
}

func parseGT06(frame []byte) (*GT06Frame, error) {
    if len(frame) < 9 || frame[0] != 0x78 || frame[1] != 0x78 {
        return nil, fmt.Errorf("bukan frame GT06")
    }
    length := int(frame[2])
    body := frame[2 : 3+length] // length..crc — scope CRC!

    got := binary.BigEndian.Uint16(body[len(body)-2:])
    want := crcITU(body[:len(body)-2])
    if got != want {
        return nil, fmt.Errorf("CRC beda: packet=0x%04X hitung=0x%04X", got, want)
    }

    return &GT06Frame{
        Protocol: body[1],
        Data:     body[2 : len(body)-4],
        Serial:   binary.BigEndian.Uint16(body[len(body)-4 : len(body)-2]),
    }, nil
}
```

Uji pertama yang wajib lolos: contoh login datasheet tadi harus lolos validasi, dan CRC yang kita hitung ulang harus sama persis dengan `0x8CDD`.

## Login: IMEI BCD dan ACK yang Wajib Dibalas

Packet login (protocol `0x01`) berisi **IMEI dalam format BCD**. Delapan byte menyimpan 16 digit desimal, padahal IMEI hanya 15 digit. Digit pertama adalah padding `0` dan harus dibuang:

```go
// IMEI: 8 byte BCD → 16 digit hex → buang digit pertama → 15 digit
func decodeIMEI(data []byte) string {
    return fmt.Sprintf("%X", data)[1:]
}
```

Contoh datasheet: `01 23 45 67 89 01 23 45` → `"0123456789012345"` → IMEI `123456789012345`.

Setelah IMEI dikenali, wajib membalas. Ingat Part 1: device yang tidak di-ACK akan mengirim ulang terus sampai ngambek. Format balasan login: `78 78 05 <protocol> <serial> <crc> 0D 0A`:

```go
// buildAck: 78 78 05 <protocol> <serial> <crc> 0D 0A
// CRC dihitung dari byte length (05) sampai serial.
func buildAck(f *GT06Frame) []byte {
    body := []byte{0x05, f.Protocol, byte(f.Serial >> 8), byte(f.Serial)}
    crc := crcITU(body)
    out := []byte{0x78, 0x78}
    out = append(out, body...)
    out = append(out, byte(crc>>8), byte(crc), 0x0D, 0x0A)
    return out
}
```

Vektor ujinya: untuk serial `0001`, balasan yang benar adalah `78 78 05 01 00 01 D9 DC 0D 0A`. Implementasi di atas menghasilkan nilai yang sama. (Perhatikan `D9 DC` lahir dari CRC X25 dengan scope `05 01 00 01`, termasuk byte length.)

## Location: Dari Byte Menjadi Koordinat

Packet posisi yang paling umum adalah protocol `0x12`. Isi bagian GPS-nya:

| Offset | Ukuran | Field          | Catatan                              |
| ------ | ------ | -------------- | ------------------------------------ |
| +0     | 6      | Datetime       | BCD: YY MM DD HH MM SS               |
| +6     | 1      | Satelit        | _low nibble_ saja                    |
| +7     | 4      | Latitude       | big-endian, satuan **menit × 30000** |
| +11    | 4      | Longitude      | big-endian, satuan menit × 30000     |
| +15    | 1      | Speed          | km/jam                               |
| +16    | 2      | Course + flags | lihat bawah                          |

Ada dua detail yang perlu diperhatikan:

1. **Koordinatnya bukan derajat.** Nilainya harus dibagi `60 × 30000 = 1.800.000`. Contoh: Surabaya di -7.2575° tersimpan sebagai `7.2575 × 60 × 30000 = 13.063.500` → `00 C7 55 4C`.
2. **Tanda (selatan/barat) tidak tersimpan di angkanya:** semua nilai positif. Tanda ada di bit _flags_ byte course.

Layout _flags_ (2 byte): bit 0–9 = arah (0–359°), bit 10 = arah lintang (**1 = utara/positif, 0 = selatan**), bit 11 = arah bujur (**1 = barat/negatif**), bit 12 = fix GPS valid. (Nomor bit ini mengikuti perilaku decoder Traccar yang teruji production; redaksi datasheet berbeda-beda antar versi. Tetap uji dengan device asli.)

```go
func decodeLocation(data []byte, tz *time.Location) Location {
    t := time.Date(
        bcd(data[0])+2000, time.Month(bcd(data[1])), bcd(data[2]),
        bcd(data[3]), bcd(data[4]), bcd(data[5]), 0, tz)

    sat := int(data[6] & 0x0F)
    lat := float64(binary.BigEndian.Uint32(data[7:11])) / 60.0 / 30000.0
    lng := float64(binary.BigEndian.Uint32(data[11:15])) / 60.0 / 30000.0
    speed := int(data[15])

    flags := binary.BigEndian.Uint16(data[16:18])
    course := int(flags & 0x3FF)
    if flags&(1<<10) == 0 { // bit 10: 0 = selatan
        lat = -lat
    }
    if flags&(1<<11) != 0 { // bit 11: 1 = barat
        lng = -lng
    }
    valid := flags&(1<<12) != 0

    return Location{t, sat, lat, lng, speed, course, valid}
}

func bcd(b byte) int { return int(b>>4)*10 + int(b&0x0F) }
```

Menguji decode tanpa device asli: saya bangun packet 0x12 di kode uji (Surabaya, 12 satelit, 42 km/jam, arah 180°, fix valid), lalu decode kembali. Hasilnya `-7.2575, 112.7521, arah 180, fix valid`. Frame lengkapnya `78 78 17 12 26 09 12 14 30 00 0C 00 C7 55 4C 0C 18 D4 34 2A 10 B4 00 01 00 A2 0D 0A` bisa kamu replay lewat `/dev/tcp` seperti di Part 2.

> Catatan: setelah blok GPS, packet `0x12` asli masih berisi data seluler (LBS) untuk fallback posisi saat GPS mati, plus terminal info. Bagian itu menyusul saat kita butuh — untuk membangun _core tracking_, blok GPS sudah cukup.

## Teltonika: Desain Paket yang Berbeda

Teltonika menangani kebutuhan yang sama dengan format paket dan alur yang berbeda dari GT06. Perbedaannya terlihat pada handshake, pengiriman data, koordinat, dan ACK:

**1. Handshake dulu, data kemudian.** Koneksi baru diawali packet identifikasi: 2 byte panjang (`00 0F`) + IMEI 15 digit ASCII + `\r\n`. Server membalas satu byte: `01` (IMEI dikenal) atau `00` (tolak):

```go
func decodeIMEITeltonika(b []byte) (string, bool) {
    n := int(binary.BigEndian.Uint16(b[0:2]))
    if n != 15 || len(b) < 2+n {
        return "", false
    }
    imei := string(b[2 : 2+n])
    for _, c := range imei {
        if c < '0' || c > '9' {
            return "", false
        }
    }
    return imei, true // balas: 0x01 = terima, 0x00 = tolak
}
```

**2. Batch, bukan kirim-kirim.** Satu packet AVL berisi banyak record sekaligus. Struktur codec 8:

```text
00 00 00 00        preamble (4 byte nol)
00 00 00 39        data length (4 byte — codec sampai num2)
08                 codec ID (0x08 = codec8)
01                 jumlah record
... record AVL ...   (timestamp 8B, prioritas 1B, GPS element, IO element)
01                 jumlah record (ulang, untuk validasi)
00 00 0X XX        CRC-16 (4 byte, nilai 16-bit di byte rendah)
```

**3. Koordinat derajat × 10.000.000:** longitude dan latitude masing-masing 4 byte big-endian bertanda, lalu dibagi 10.000.000 untuk mendapat derajat. GPS element satu record: longitude 4B, latitude 4B, altitude 2B, angle 2B, satelit 1B, speed 2B.

**4. CRC-16 IBM** (poly 0x8005, init 0, reflected; varian CRC-16/ARC), dihitung dari codec ID sampai _number of data 2_:

```go
func crc16IBM(data []byte) uint16 {
    crc := uint16(0x0000)
    for _, b := range data {
        crc ^= uint16(b)
        for i := 0; i < 8; i++ {
            if crc&1 != 0 {
                crc = (crc >> 1) ^ 0xA001
            } else {
                crc >>= 1
            }
        }
    }
    return crc
}
```

Untuk mengonfirmasi penerimaan, server membalas **jumlah record yang diterima** sebagai integer 4 byte. Jika menerima 1 record, server mengirim `00 00 00 01`. Device akan mengirim ulang jika jumlahnya tidak cocok, tanpa memerlukan serial number per paket.

## Hasil Uji

Semua kode di artikel ini lolos 13 asersi[^uji]:

| Skenario                                                         | Hasil |
| ---------------------------------------------------------------- | ----- |
| Login datasheet GT06 (`8C DD`) lolos validasi CRC                | ✓     |
| CRC hitung ulang = `8CDD`; ACK serial 1 = `D9 DC`                | ✓     |
| IMEI BCD → `123456789012345` (15 digit)                          | ✓     |
| Round-trip location 0x12: koordinat, arah, speed, satelit, waktu | ✓     |
| Handshake Teltonika `356307042441013`                            | ✓     |
| AVL codec8: CRC valid, koordinat & speed benar                   | ✓     |

## Hal yang Perlu Diuji

- **Cocokkan varian dan cakupan CRC dengan vektor datasheet.** Untuk GT06, keduanya menentukan apakah validasi berhasil.
- **Uji IMEI dan ACK dari contoh login.** Pastikan hasil BCD dan byte balasan sesuai dengan serial packet.
- **Uji konversi koordinat dengan round-trip.** GT06 memakai menit×30000, sedangkan Teltonika memakai derajat×10⁷.
- **Perhatikan perilaku perangkat saat memvalidasi CRC.** Traccar tidak memvalidasi CRC masukan GT06/Teltonika karena variasi firmware klon; tentukan apakah paket yang tidak cocok akan ditolak atau dicatat.

Langkah berikutnya adalah menyimpan posisi yang sudah didekode. Jika 500 device mengirim posisi tiap 10 detik, jumlahnya mencapai 4,3 juta titik per hari. Tabel PostgreSQL biasa akan kewalahan menangani volume itu tanpa optimasi; Part 4 membahas TimescaleDB untuk kebutuhan tersebut.

## What's Next

Artikel ini bagian dari seri **Membangun GPS Backend dari Nol**.

- Sebelumnya: [Part 2 — Membangun TCP Listener untuk GPS Device di Go](/writing/2026/tcp-listener-gps-go/)
- Selanjutnya: [Part 4 — Menyimpan Data GPS dengan PostgreSQL + TimescaleDB](/writing/2026/gps-data-postgresql-timescaledb/)

## CTA

Jika Anda menemukan hasil berbeda saat menguji packet GT06 atau Teltonika, diskusikan melalui [Contact](/contact/). Ikuti artikel berikutnya dengan subscribe [RSS](/writing/index.xml).

[^traccar]: Source code decoder Traccar untuk [GT06](https://github.com/traccar/traccar/blob/master/src/main/java/org/traccar/protocol/Gt06ProtocolDecoder.java) dan [Teltonika](https://github.com/traccar/traccar/blob/master/src/main/java/org/traccar/protocol/TeltonikaProtocolDecoder.java) adalah referensi perilaku yang teruji production. Saya pakai untuk memverifikasi layout field dan satuan koordinat.

[^uji]: Contoh datasheet Concox GT06 v1.8.1 (login + balasan) dipakai sebagai vektor eksternal; packet location dan AVL diuji lewat round-trip encoding-decoding dengan nilai koordinat Surabaya yang diverifikasi manual.
