---
title: "Memahami GPS Protocol: Cara Komunikasi Device Tracker"
description: "GPS tracker mengirim data posisi via TCP socket dengan protokol binary yang berbeda per brand. Pelajari cara kerja komunikasi GPS device, format packet Teltonika dan GT06, dan kenapa bukan HTTP."
author: "Faiq Najib Al-Aziz"
date: 2026-09-08
lastmod: 2026-09-13
draft: false
toc: true
comments: true
images:
  - og.png
tags:
  - gps
  - iot
  - tcp
  - networking
pillar: "gps-iot"
series:
  - gps-backend-series
series_part: 1
---

Ketika saya pertama kali dipercaya menangani backend untuk ratusan GPS tracker, saya kira tinggal bikin REST API biasa — device kirim `POST /api/location` dengan JSON, server simpan ke database, selesai.

Saya salah besar. (Kisah lengkapnya — kenapa backend itu akhirnya dimigrasikan dari Laravel ke Go, 370+ endpoint demi endpoint — kutulis sebagai [seri naratif Hijrah Backend](/writing/2026/hijrah-backend-01/). Seri yang sedang kamu baca ini versi tutorialnya: membangun ulang dari nol, dengan kode yang bisa kamu ikuti.)

GPS tracker tidak mengenal HTTP. Tidak ada JSON. Yang ada adalah kumpulan byte mentah yang masuk melalui koneksi TCP — `\x00\x00\x00\x2f\x8e\x01\x04\x01\x03...` — tanpa header, tanpa content-type, tanpa petunjuk apa pun. Dan setiap brand punya cara sendiri untuk menyusun byte-byte itu.

Artikel ini adalah catatan saya memahami bagaimana GPS tracker berkomunikasi dengan server. Bukan tutorial decode (itu untuk [Part 3](/writing/2026/decode-packet-gt06-teltonika/)), tapi fondasi konsep yang harus kamu pahami sebelum menyentuh satu baris kode pun.

## Apa Itu GPS Tracker, Sebenarnya?

GPS tracker adalah embedded device dengan dua modul inti:

1. **GPS module** — menerima sinyal dari satelit untuk menentukan posisi (latitude, longitude, altitude, speed, heading).
2. **GSM/LTE module** — mengirim data posisi itu ke server melalui jaringan seluler.

Selain itu, device biasanya punya:

- **Digital I/O** — sensor pintu terbuka/tutup, ignition (mesin menyala), SOS button
- **Analog input** — sensor bahan bakar, suhu
- **Accelerometer** — deteksi kejutan (tabrakan/rem keras)
- **Internal battery** — backup saat power utama terputus

Data dari semua sensor ini dikemas dalam satu packet dan dikirim ke server secara periodik — biasanya setiap 10-30 detik saat device bergerak, lebih jarang saat diam (untuk hemat kuota).

## Kenapa TCP, Bukan HTTP?

Ini pertanyaan pertama yang muncul di kepala saya. Kenapa device tidak pakai HTTP REST API saja?

Alasannya ada empat:

### 1. Efisiensi Bandwidth

HTTP request punya overhead besar. Headers saja bisa 500+ bytes (`Host`, `Content-Type`, `Accept`, `Authorization`, dll). Sedangkan satu packet GPS binary biasanya hanya 40-60 bytes. Dengan koneksi 2G/3G yang tidak stabil dan kuota SIM card yang berbayar, setiap byte dihitung.

### 2. Persistent Connection

Device tracker perlu maintain koneksi yang **selalu aktif**. Server harus bisa mengirim command ke device kapan saja — misalnya: "matikan mesin" (engine cut), "update interval reporting", atau "request lokasi sekarang". HTTP request-response tidak cocok untuk model ini karena connection-nya berumur singkat.

### 3. Kontrol Penuh atas Format Data

Protokol HTTP memaksa struktur tertentu (method, headers, body, status code). Protokol GPS binary memungkinkan device manufacturer mendesain format seefisien mungkin. Satu byte bisa berarti 3-4 field sekaligus menggunakan bitmask.

### 4. Kompatibilitas Hardware

Banyak GPS tracker menggunakan microcontroller dengan resource terbatas (RAM 64KB, clock 48MHz). HTTP stack (parsing headers, TLS handshake, JSON encoding) memakan terlalu banyak resource. Raw TCP socket jauh lebih ringan.

## Cara Kerja Komunikasi GPS Device

Sederhananya, begini alurnya:

```
Device                          Server
  │                               │
  │──── Connect (TCP) ───────────→│
  │                               │
  │──── Login packet (IMEI) ─────→│
  │                               │
  │←─── ACK / Login response ─────│
  │                               │
  │──── Location data ───────────→│  (loop, setiap N detik)
  │←─── ACK ──────────────────────│
  │                               │
  │←─── Command (optional) ───────│  (server → device)
  │──── Command response ────────→│
  │                               │
  │──── Heartbeat (keep-alive) ──→│  (jika idle)
  │←─── Heartbeat ACK ────────────│
  │                               │
```

### Fase 1: Connection & Login

Device membuka koneksi TCP ke IP:port server. Setelah tersambung, device mengirim **login packet** — biasanya berisi IMEI (International Mobile Equipment Identity), nomor unik 15 digit yang menjadi identitas device.

Server merespons dengan ACK (acknowledge). Kalau IMEI tidak dikenal, server bisa menutup koneksi atau mengabaikan data.

### Fase 2: Data Reporting

Setelah login berhasil, device mulai mengirim location data secara periodik. Beberapa protokol juga mengirim data berdasarkan event:

- Saat device bergerak (motion detected)
- Saat melewati jarak tertentu dari titik sebelumnya (distance-based)
- Saat ignition dinyalakan/dimatikan
- Saat SOS button ditekan
- Saat geofence dilanggar

Setiap location data packet berisi minimal: timestamp, latitude, longitude. Tapi biasanya juga: speed, heading/azimuth, altitude, status I/O (ignition, door, alarm), dan battery level.

### Fase 3: Server Commands

Server bisa mengirim command ke device yang sedang online. Contoh:

- **Reboot device** — useful saat device hang
- **Set reporting interval** — ubah frekuensi kirim data
- **Engine cut** — matikan starter mesin (untuk anti-maling)
- **Listen-in** — aktifkan mikrofon untuk monitoring audio
- **Request current location** — minta posisi sekarang juga

### Fase 4: Heartbeat / Keep-Alive

Saat device idle (tidak bergerak), ia tetap maintain koneksi TCP dengan mengirim packet heartbeat setiap 2-5 menit. Ini mencegah NAT timeout dan memastikan koneksi tetap "hidup".

## Anatomi Packet GPS

Walaupun setiap brand berbeda, sebagian besar protokol GPS binary mengikuti pola umum ini:

```
┌──────────┬──────────┬────────────┬─────────────┬──────────┬──────────┐
│  Start   │  Length  │  Protocol  │   Payload   │   CRC    │   End    │
│  Marker  │  Bytes   │    ID      │   (Data)    │  Check   │  Marker  │
└──────────┴──────────┴────────────┴─────────────┴──────────┴──────────┘
```

- **Start marker** — byte tetap yang menandai awal packet (misal: `\x78\x78` untuk GT06, atau 4 byte nol `\x00\x00\x00\x00` untuk Teltonika)
- **Length** — jumlah byte payload (agar server tahu kapan packet selesai)
- **Protocol ID / Codec ID** — identifier jenis data (location, alarm, heartbeat, response command)
- **Payload** — data sebenarnya (IMEI, koordinat, I/O status, dll)
- **CRC** — checksum untuk validasi integritas data
- **End marker** — byte tetap penanda akhir packet (misal: `\x0d\x0a` untuk GT06)

### Contoh: Struktur Packet GT06 (Concox)

GT06 adalah salah satu protokol paling umum di Indonesia karena device-nya murah dan banyak dijual. Strukturnya:

```
78 78      Start bit (2 byte)
0D         Length (1 byte — dari protocol number sampai CRC, inklusif)
01         Protocol number (login = 0x01)
01 23 45 67 89 01 23 45    IMEI (8 byte, BCD encoded)
00 01      Serial number (2 byte)
8C DD      CRC-ITU (2 byte)
0D 0A      Stop bit (2 byte)
```

Contoh di atas adalah packet login dari datasheet Concox GT06 v1.8.1 untuk terminal ID `123456789012345` (IMEI 15 digit — 8 byte BCD memuat 16 digit, digit pertama dibuang). CRC-ITU dihitung dari byte _length_ sampai _serial number_ (inklusif) — detail varian CRC-nya kita bedah di [Part 3](/writing/2026/decode-packet-gt06-teltonika/). Angka `0x7878` di awal dan `0x0D0A` di akhir adalah "tanda tangan" GT06. Saat kamu melihat byte itu di log TCP, kamu tahu: ini Concox/GT06 family.

### Contoh: Struktur Packet Teltonika

Teltonika (seri FMB, FMTC) punya pendekatan sedikit berbeda — lebih terstruktur, dengan konsep "codec":

```
0000 0000        Preamble (4 byte nol)
0000 0039         Data field length (4 byte)
08               Codec ID (1 byte — 0x08 = codec8, 0x0E = codec8 extended)
01               Number of data (1 byte — jumlah AVL records)
...              AVL data (IMEI + records)
...              Number of data (repeat)
0000 0XXX         CRC-16 (4 byte)
```

Teltonika pakai 4-byte length prefix dan CRC-16, sedangkan GT06 pakai 1-byte length, CRC-ITU 2 byte, plus serial number yang dipakai untuk mencocokkan ACK. Perbedaan ini akan penting saat kita menulis decoder di Part 3.

## Protokol Populer di Indonesia

Berdasarkan pengalaman saya menangani GPS tracking di Indonesia, ini brand/protokol yang paling sering ditemui:

| Protokol       | Brand Umum                           | Format         | Keterangan                                  |
| -------------- | ------------------------------------ | -------------- | ------------------------------------------- |
| **GT06**       | Concox, Coban, Xexun, berbagai "OEM" | Binary         | Paling murah, paling banyak varian clone    |
| **Teltonika**  | Teltonika FMB/FMTC/FM                | Binary         | Premium, dokumentasi lengkap, codec system  |
| **Meitrack**   | Meitrack MVT/MST                     | Binary         | Cukup umum di fleet enterprise              |
| **Wialon IPS** | Berbagai brand (Universal)           | Text (ASCII)   | Comma-separated, lebih mudah dibaca manusia |
| **H02**        | H02/GPS103                           | Text (ASCII)   | Sederhana, sering di device murah           |
| **MQTT**       | Berbagai brand modern                | JSON over MQTT | Tren baru — device 4G yang pakai JSON       |

### Binary vs Text Protocol

Protokol GPS terbagi dua kategori besar:

**Binary protocol** (Teltonika, GT06, Meitrack):

- Setiap byte punya arti presisi — bisa berisi multiple field
- Lebih hemat bandwidth (1 byte = 8 bit = bisa 8 boolean flags)
- Lebih sulit dibaca manusia (`\x8e\x01\x04` vs `lat=-6.2,lng=106.8`)
- Butuh dokumentasi protocol manual yang lengkap

**Text protocol** (Wialon, H02):

- Format ASCII yang bisa dibaca langsung: `#L#359769030123456;NA`
- Lebih mudah di-debug
- Lebih boros bandwidth
- Cocok untuk device dengan resource terbatas atau testing cepat

### Tren: MQTT dan JSON

GPS tracker generasi baru (4G/LTE, Cat-M1, NB-IoT) mulai beralih ke MQTT dengan payload JSON. Ini perubahan besar:

```json
{
  "imei": "359769030123456",
  "lat": -6.2,
  "lng": 106.816666,
  "speed": 42,
  "course": 180,
  "ignition": true,
  "timestamp": "2026-09-08T10:30:00Z"
}
```

JSON jauh lebih mudah di-parse, lebih human-readable, dan tidak butuh protocol manual khusus. Tapi device 2G/3G lama yang masih mendominasi pasar Indonesia masih pakai binary TCP. Untuk beberapa tahun ke depan, keduanya akan hidup berdampingan.

## Kesalahpahaman Umum yang Saya Alami

### "Cukup baca dokumentasi satu brand"

Salah. GT06 punya puluhan varian protocol karena banyak clone/ OEM yang sedikit memodifikasi format. Concox GT06, Coban GPS103, dan "GT06 generic" punya perbedaan kecil yang bikin decodermu crash kalau tidak handle edge case.

### "IMEI unik per device"

Secara teori ya. Praktiknya? Banyak device murah yang punya IMEI duplikat atau IMEI yang tidak valid. Selalu tambahkan kolom `device_id` sendiri di database, jangan pakai IMEI sebagai primary key tanpa normalisasi.

### "TCP connection = device online"

Tidak selalu. NAT timeout, carrier-level TCP reset, dan device hang bisa membuat koneksi "hidup" di sisi server tapi device sudah mati. Heartbeat/keep-alive mechanism itu wajib, bukan opsional.

### "Semua device kirim data dalam UTC"

Mayoritas ya, tapi beberapa brand mengirim timestamp dalam timezone lokal (UTC+7 untuk Indonesia). Selalu verify di dokumentasi protocol — atau lebih baik, assume nothing dan test dengan device asli.

## Tools untuk Inspect Packet

Sebelum mulai coding decoder, ada baiknya kamu bisa "melihat" data yang masuk. Ini tools yang saya pakai:

### 1. TCP Proxy Logger

Bikin TCP proxy sederhana yang hanya men-logging setiap byte yang lewat, lalu forward ke server asli:

```go
// Minimal TCP logger — log semua byte yang masuk
func handleConn(conn net.Conn) {
    defer conn.Close()
    buf := make([]byte, 1024)
    for {
        n, err := conn.Read(buf)
        if err != nil {
            break
        }
        fmt.Printf("%x\n", buf[:n]) // print sebagai hex
    }
}
```

Output dalam hex format memungkinkan kamu melihat struktur packet secara visual dan mencocokkannya dengan dokumentasi protocol.

### 2. Wireshark

Kalau kamu bisa capture traffic langsung di interface server, Wireshark dengan filter `tcp.port == 5094` (atau port yang kamu pakai) akan menampilkan setiap packet dengan detail. Gunakan "Follow TCP Stream" untuk melihat percakapan device-server secara lengkap.

### 3. Device Simulator

Beberapa brand menyediakan simulator. Kalau tidak ada, kamu bisa merekam packet dari device asli lalu replay-nya untuk testing. Ini penting karena kamu tidak ingin debug dengan device fisik setiap kali — terutama saat mengembangkan decoder untuk multiple protocols.

## Yang Harus Kamu Pahami Sebelum Lanjut

Di akhir artikel ini, kamu seharusnya sudah paham:

- **Kenapa GPS device pakai TCP socket, bukan HTTP** — efisiensi, persistence, dan kontrol format
- **Alur komunikasi device-server** — connect → login → data reporting → commands → heartbeat
- **Anatomi packet binary** — start marker, length, payload, CRC, end marker
- **Perbedaan protokol per brand** — binary vs text, GT06 vs Teltonika vs MQTT
- **Kesalahpahaman umum** — IMEI duplikat, TCP "hidup" tapi device mati, timezone tidak konsisten

Pemahaman ini adalah fondasi. Tanpa ini, saat kamu melihat byte `0x7878` di log, kamu tidak akan tahu itu artinya apa.

## What's Next

Artikel ini bagian dari seri **Membangun GPS Backend dari Nol**.

Selanjutnya: [Part 2 — Membangun TCP Listener untuk GPS Device di Go](/writing/2026/tcp-listener-gps-go/). Kita akan mulai coding — membuat TCP server yang bisa menerima koneksi dari ratusan device secara concurrent menggunakan goroutine.

Kalau kamu tidak sabar untuk lihat decode packet, [Part 3](/writing/2026/decode-packet-gt06-teltonika/) akan membahas detil parsing GT06 dan Teltonika binary.

## CTA

Bagikan artikel ini jika bermanfaat. Untuk diskusi lebih lanjut, kunjungi [Contact](/contact/) atau subscribe [RSS](/writing/index.xml).
