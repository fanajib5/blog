---
title: "GPS Protocol Engine & Real-Time TCP Listener"
description: "High-performance IoT socket listener di Go untuk memproses stream binary dari ratusan GPS tracker secara concurrent dengan memory pooling dan zero-allocation framing."
date: 2024-08-01
lastmod: 2026-10-12T00:00:00+07:00
draft: false
comments: false
project_type: "Open Reference / Deep Tech"
tech_stack: ["Go", "TCP Sockets", "Binary Protocols", "TimescaleDB", "Redis", "Docker"]
live_url: "/series/gps-backend-series/"
repo_url: ""
results: ["Sub-millisecond packet decode", "Ratusan koneksi socket paralel", "Proteksi slow-client via ring buffer"]
---

## Masalah

Komunikasi perangkat tracker GPS IoT tidak menggunakan HTTP/JSON karena keterbatasan bandwidth dan efisiensi modul seluler di kendaraan. Tracker berkomunikasi melalui **raw TCP socket stream** menggunakan paket biner (Teltonika Codec 8/8 Extended, GT06/Concox) yang rentan terhadap fragmentasi TCP stream dan connection drop.

Sistem membutuhkan engine listener yang:
- Mampu menerima ratusan koneksi TCP concurrent tanpa exhaust memory
- Melakukan framing paket biner yang terfragmentasi dengan akurat
- Memvalidasi checksum (CRC16) dan mengirim ACK handshake secara real-time
- Mencegah starvation/blocking dari client dengan koneksi lambat

## Solusi

Dibangun **GPS TCP Listener & Decoder Engine** di atas **Go** dengan arsitektur berorientasi performa tinggi:

- **TCP Stream Framing**: custom scanner/framing loop untuk membaca packet delimiter dan length field tanpa buffer overflow.
- **Protocol Parsers**: decoder biner untuk protokol Teltonika (Codec 8/Extended) dan GT06 dengan validasi CRC16.
- **Memory Efficiency**: memanfaatkan `sync.Pool` untuk buffer byte parser guna menekan GC pause di traffic tinggi.
- **Pipeline Fan-out**: posisi kendaraan yang berhasil divalidasi didistribusikan ke pipeline worker via Redis Streams dan disimpan ke hypertable TimescaleDB.

### Arsitektur

```
GPS Tracker (TCP) ──> [ net.Listen Go Worker Pool ]
                               │
                      [ Binary Framing & CRC16 ]
                               │
                      [ Decoder (Teltonika / GT06) ]
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
    [ Redis Pub/Sub Fan-out ]      [ TimescaleDB Hypertable ]
```

## Hasil & Dokumentasi

- Mampu memproses ribuan data koordinat per detik dengan sub-millisecond decoding latency.
- Arsitektur lengkap dan implementasi langkah-demi-langkah didokumentasikan secara publik di [Seri GPS Backend](/series/gps-backend-series/).
