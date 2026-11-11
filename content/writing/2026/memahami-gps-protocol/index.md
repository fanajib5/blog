---
title: "Memahami GPS Protocol: Cara Komunikasi Device Tracker"
description: "GPS tracker mengirim data posisi lewat TCP socket dengan protokol binary yang beda-beda tiap brand. Catatan saya soal cara kerjanya, format packet Teltonika dan GT06, dan kenapa bukan HTTP."
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

Waktu pertama kali dipercaya menangani backend untuk ratusan GPS tracker, saya kira kerjaannya cuma bikin REST API biasa: device kirim `POST /api/location` pakai JSON, server simpan ke database, selesai. Gampang, kan? Hahaha.

Ternyata saya keliru. Backend itu akhirnya dimigrasikan dari Laravel ke Go, mencakup lebih dari 370 endpoint. Kisah lengkapnya saya tulis di [seri naratif Hijrah Backend](/writing/2026/hijrah-backend-01/). Seri yang sedang kamu baca ini versi tutorialnya: membangun ulang backend dari nol, dengan kode yang bisa kamu ikuti.

GPS tracker itu tidak kenal HTTP. Tidak ada JSON. Data yang masuk lewat koneksi TCP berupa byte mentah seperti `\x00\x00\x00\x2f\x8e\x01\x04\x01\x03...`, tanpa header, content-type, atau petunjuk apa pun. Tiap brand pun punya cara sendiri menyusun byte-byte itu.

Di artikel ini saya cerita dulu soal cara GPS tracker ngobrol dengan server. Belum tutorial decode ya, itu ada di [Part 3](/writing/2026/decode-packet-gt06-teltonika/). Kita mulai dari konsep yang perlu dipahami sebelum menulis kode.

## Apa Itu GPS Tracker, Sebenarnya?

GPS tracker adalah embedded device dengan dua modul inti:

1. **GPS module**: menerima sinyal dari satelit untuk menentukan posisi (latitude, longitude, altitude, speed, heading).
2. **GSM/LTE module**: mengirim data posisi itu ke server lewat jaringan seluler.

Selain itu, device biasanya punya:

- **Digital I/O**: sensor pintu terbuka/tutup, ignition (mesin menyala), SOS button
- **Analog input**: sensor bahan bakar, suhu
- **Accelerometer**: deteksi kejutan (tabrakan atau rem mendadak)
- **Internal battery**: cadangan kalau power utama terputus

Data dari semua sensor ini dikemas dalam satu packet dan dikirim ke server secara periodik, biasanya tiap 10-30 detik saat device bergerak dan lebih jarang saat diam supaya hemat kuota.

## Kenapa TCP, Bukan HTTP?

Awalnya saya juga bertanya-tanya: kenapa device tidak pakai HTTP REST API saja?

Ada empat alasan.

### 1. Efisiensi Bandwidth

HTTP request punya overhead besar. Header saja bisa 500+ bytes (`Host`, `Content-Type`, `Accept`, `Authorization`, dll), sedangkan satu packet GPS binary biasanya cuma 40-60 bytes. Dengan koneksi 2G/3G yang tidak stabil dan kuota SIM card yang berbayar, setiap byte itu dihitung.

### 2. Persistent Connection

Device tracker perlu menjaga koneksi tetap aktif supaya server bisa kirim command kapan saja, misalnya "matikan mesin" (engine cut), "update interval reporting", atau "minta lokasi sekarang". HTTP itu pola request-response. Untuk mengirim command saat device tidak sedang request, perlu mekanisme lain seperti polling atau kanal terpisah.

### 3. Kontrol Penuh atas Format Data

HTTP memaksa struktur tertentu (method, headers, body, status code). Protokol GPS binary membebaskan produsen device merancang format seefisien mungkin. Satu byte bisa berarti 3-4 field sekaligus pakai bitmask.

### 4. Kompatibilitas Hardware

Banyak GPS tracker memakai microcontroller dengan resource terbatas (RAM 64KB, clock 48MHz). HTTP stack (parsing headers, TLS handshake, JSON encoding) kemakan resource terlalu banyak. Raw TCP socket jauh lebih ringan.

## Cara Kerja Komunikasi GPS Device

Alurnya begini:

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

Device membuka koneksi TCP ke IP:port server. Setelah tersambung, device mengirim **login packet** yang biasanya berisi IMEI (International Mobile Equipment Identity), nomor unik 15 digit yang jadi identitas device.

Server membalas dengan ACK (acknowledge). Kalau IMEI tidak dikenal, server bisa menutup koneksi atau mengabaikan datanya.

### Fase 2: Data Reporting

Setelah login berhasil, device mulai mengirim location data secara periodik. Beberapa protokol juga mengirim data saat ada event:

- Saat device bergerak (motion detected)
- Saat melewati jarak tertentu dari titik sebelumnya (distance-based)
- Saat ignition dinyalakan/dimatikan
- Saat SOS button ditekan
- Saat geofence dilanggar

Setiap location data packet minimal berisi timestamp, latitude, dan longitude. Biasanya ada juga speed, heading/azimuth, altitude, status I/O (ignition, door, alarm), dan battery level.

### Fase 3: Server Commands

Server bisa mengirim command ke device yang sedang online. Contohnya:

- **Reboot device**: berguna kalau device hang
- **Set reporting interval**: ubah frekuensi kirim data
- **Engine cut**: matikan starter mesin (anti-maling)
- **Listen-in**: aktifkan mikrofon untuk monitoring audio
- **Request current location**: minta posisi sekarang juga

### Fase 4: Heartbeat / Keep-Alive

Saat device idle (tidak bergerak), dia tetap menjaga koneksi TCP dengan mengirim packet heartbeat tiap 2-5 menit. Ini mencegah NAT timeout dan memastikan koneksi tetap "hidup".

## Anatomi Packet GPS

Meski format tiap brand beda, sebagian besar protokol GPS binary mengikuti pola umum ini:

```
┌──────────┬──────────┬────────────┬─────────────┬──────────┬──────────┐
│  Start   │  Length  │  Protocol  │   Payload   │   CRC    │   End    │
│  Marker  │  Bytes   │    ID      │   (Data)    │  Check   │  Marker  │
└──────────┴──────────┴────────────┴─────────────┴──────────┴──────────┘
```

- **Start marker**: byte tetap penanda awal packet (misal `\x78\x78` untuk GT06, atau 4 byte nol `\x00\x00\x00\x00` untuk Teltonika)
- **Length**: jumlah byte payload (supaya server tahu kapan packet selesai)
- **Protocol ID / Codec ID**: identifier jenis data (location, alarm, heartbeat, response command)
- **Payload**: data sebenarnya (IMEI, koordinat, status I/O, dll)
- **CRC**: checksum untuk validasi integritas data
- **End marker**: byte tetap penanda akhir packet (misal `\x0d\x0a` untuk GT06)

### Contoh: Struktur Packet GT06 (Concox)

GT06 termasuk protokol yang umum di Indonesia karena device-nya murah dan gampang dicari. Strukturnya:

```
78 78      Start bit (2 byte)
0D         Length (1 byte, dari protocol number sampai CRC, inklusif)
01         Protocol number (login = 0x01)
01 23 45 67 89 01 23 45    IMEI (8 byte, BCD encoded)
00 01      Serial number (2 byte)
8C DD      CRC-ITU (2 byte)
0D 0A      Stop bit (2 byte)
```

Contoh di atas adalah packet login dari datasheet Concox GT06 v1.8.1 untuk terminal ID `123456789012345` (IMEI 15 digit; 8 byte BCD memuat 16 digit, digit pertama dibuang). CRC-ITU dihitung dari byte _length_ sampai _serial number_ (inklusif). Detail varian CRC kita bedah di [Part 3](/writing/2026/decode-packet-gt06-teltonika/). Angka `0x7878` di awal dan `0x0D0A` di akhir itu semacam "tanda tangan" GT06. Begitu lihat byte itu di log TCP, kamu langsung tahu ini keluarga Concox/GT06.

### Contoh: Struktur Packet Teltonika

Teltonika (seri FMB, FMTC) pakai pendekatan yang agak beda. Strukturnya lebih teratur dan memakai konsep "codec":

```
0000 0000        Preamble (4 byte nol)
0000 0039         Data field length (4 byte)
08               Codec ID (1 byte: 0x08 = codec8, 0x0E = codec8 extended)
01               Number of data (1 byte, jumlah AVL records)
...              AVL data (records saja; IMEI dikirim terpisah saat handshake)
...              Number of data (repeat)
0000 0XXX         CRC-16 (4 byte)
```

Teltonika pakai 4-byte length prefix dan CRC-16, sedangkan GT06 pakai 1-byte length, CRC-ITU 2 byte, plus serial number untuk mencocokkan ACK. Perbedaan ini bakal penting waktu kita menulis decoder di Part 3.

## Protokol Populer di Indonesia

Dari pengalaman saya menangani GPS tracking di Indonesia, ini brand/protokol yang sering ketemu:

| Protokol       | Brand Umum                           | Format         | Keterangan                                  |
| -------------- | ------------------------------------ | -------------- | ------------------------------------------- |
| **GT06**       | Concox, Coban, Xexun, berbagai "OEM" | Binary         | Paling murah, paling banyak varian clone    |
| **Teltonika**  | Teltonika FMB/FMTC/FM                | Binary         | Premium, dokumentasi lengkap, codec system  |
| **Meitrack**   | Meitrack MVT/MST                     | Binary         | Cukup umum di fleet enterprise              |
| **Wialon IPS** | Berbagai brand (Universal)           | Text (ASCII)   | Comma-separated, lebih mudah dibaca manusia |
| **H02**        | H02/GPS103                           | Text (ASCII)   | Sederhana, sering di device murah           |
| **MQTT**       | Berbagai brand modern                | JSON over MQTT | Tren baru: device 4G yang pakai JSON        |

### Binary vs Text Protocol

Protokol GPS terbagi dua kubu besar.

**Binary protocol** (Teltonika, GT06, Meitrack):

- Setiap byte punya arti presisi dan bisa berisi beberapa field
- Lebih hemat bandwidth (1 byte = 8 bit = bisa 8 boolean flag)
- Lebih sulit dibaca manusia (`\x8e\x01\x04` vs `lat=-6.2,lng=106.8`)
- Butuh dokumentasi protocol yang lengkap

**Text protocol** (Wialon, H02):

- Format ASCII yang bisa langsung dibaca: `#L#359769030123456;NA`
- Lebih gampang di-debug
- Lebih boros bandwidth
- Cocok untuk device dengan resource terbatas atau testing cepat

### Tren: MQTT dan JSON

Belakangan saya mulai ketemu tracker generasi baru (4G/LTE, Cat-M1, NB-IoT) yang memakai MQTT dengan payload JSON:

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

JSON lebih mudah di-parse, lebih human-readable, dan tidak butuh protocol manual khusus. Tapi di Indonesia perangkat 2G/3G masih banyak dipakai dan tetap menggunakan binary TCP. Dua pendekatan ini kemungkinan akan hidup berdampingan beberapa tahun ke depan.

## Kesalahpahaman yang Pernah Saya Alami

### "Cukup baca dokumentasi satu brand"

Salah. GT06 punya puluhan varian protocol karena banyak clone/OEM yang sedikit memodifikasi format. Concox GT06, Coban GPS103, dan "GT06 generic" punya perbedaan kecil yang bikin decoder-mu crash kalau edge case-nya tidak ditangani.

### "IMEI unik per device"

Secara teori, ya. Praktiknya, banyak device murah memiliki IMEI duplikat atau tidak valid. Tambahkan kolom `device_id` sendiri di database dan jangan pakai IMEI sebagai primary key tanpa normalisasi.

### "TCP connection = device online"

Tidak selalu. NAT timeout, TCP reset di level carrier, dan device hang bisa bikin koneksi kelihatan "hidup" di sisi server padahal device sudah mati. Makanya heartbeat/keep-alive mechanism wajib ada.

### "Semua device kirim data dalam UTC"

Mayoritas, tapi ada beberapa brand yang mengirim timestamp dalam timezone lokal (UTC+7 untuk Indonesia). Cek dokumentasi protocol, atau lebih baik jangan berasumsi dan uji dengan device asli.

## Tools untuk Inspect Packet

Sebelum menulis decoder, saya "mengintip" dulu data yang masuk dengan beberapa tools.

### 1. TCP Packet Logger

Untuk melihat struktur packet, pakai handler koneksi TCP sederhana yang mencatat byte masuk. Contoh ini hanya menerima dan menampilkan data, tidak meneruskannya ke server lain:

```go
// Minimal TCP logger: log semua byte yang masuk
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

Output hex membantu melihat struktur packet dan mencocokkannya dengan dokumentasi protocol.

### 2. Wireshark

Kalau bisa capture traffic langsung di interface server, pakai filter `tcp.port == 5094` (atau port yang kamu pakai) di Wireshark untuk melihat detail tiap packet. Fitur "Follow TCP Stream" menampilkan percakapan device-server secara lengkap.

### 3. Device Simulator

Beberapa brand menyediakan simulator. Kalau tidak ada, rekam packet dari device asli lalu replay untuk testing. Jadi kamu tidak perlu selalu debug pakai device fisik waktu mengembangkan decoder untuk banyak protocol.

## Bekal Sebelum Lanjut

Sebelum lanjut, pastikan sudah paham:

- **Kenapa GPS device pakai TCP socket, bukan HTTP**: efisiensi, koneksi persisten, dan kontrol format
- **Alur komunikasi device-server**: connect → login → data reporting → commands → heartbeat
- **Anatomi packet binary**: start marker, length, payload, CRC, end marker
- **Beda protokol tiap brand**: binary vs text, GT06 vs Teltonika vs MQTT
- **Kesalahpahaman umum**: IMEI duplikat, TCP "hidup" tapi device mati, timezone tidak konsisten

## What's Next

Artikel ini bagian dari seri **Membangun GPS Backend dari Nol**.

Selanjutnya: [Part 2: Membangun TCP Listener untuk GPS Device di Go](/writing/2026/tcp-listener-gps-go/). Di sana kita bikin TCP server yang menerima koneksi dari ratusan device secara concurrent pakai goroutine.

Kalau mau langsung ke urusan baca packet, [Part 3](/writing/2026/decode-packet-gt06-teltonika/) membahas detail parsing GT06 dan Teltonika binary.

## CTA

Buat diskusi, mampir ke [Contact](/contact/) atau subscribe [RSS](/writing/index.xml).
