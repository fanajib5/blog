---
title: "Membangun TCP Listener untuk GPS Device di Go"
description: "Cara membuat TCP server di Go untuk menerima koneksi dari ratusan GPS tracker secara concurrent. Dari net.Listen sampai goroutine-per-connection pattern."
author: "Faiq Najib Al-Aziz"
date: 2026-09-22
lastmod: 2026-09-22
draft: true
toc: true
comments: true
images: []
tags:
  - golang
  - gps
  - tcp
  - networking
pillar: "gps-iot"
series: "gps-backend-series"
series_part: 2
---

# Membangun TCP Listener untuk GPS Device di Go

## Hook: Masalah Nyata

500 GPS tracker perlu connect ke server secara bersamaan, masing-masing mengirim data setiap 10 detik. HTTP API akan kewalahan. Solusinya: TCP server yang handle setiap koneksi di goroutine-nya sendiri.

## Konteks

Di [Part 1](/writing/memahami-gps-protocol/) kita sudah paham cara device berkomunikasi via TCP. Sekarang waktunya membangun server yang menerima koneksi-koneksi itu.

## Solusi

### Arsitektur: Goroutine per Connection

Go punya keunggulan untuk use case ini: goroutine sangat murah. Pattern "one goroutine per TCP connection" cocok untuk GPS listener.

### Kenapa Bukan HTTP?

- HTTP connection overhead per request
- GPS device butuh persistent connection
- HTTP parsing tidak perlu untuk raw binary packet

## Implementasi

### TCP Server Dasar

```go
func main() {
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
}

func handleConnection(conn net.Conn) {
    defer conn.Close()
    // Read packets, decode, store...
}
```

### Connection Pool & Graceful Shutdown

<!-- TODO: context-based shutdown, connection tracking, sync.WaitGroup -->

## Hasil

<!-- Benchmark: 1.000 concurrent connections pada VPS Hetzner CX21, memory <100MB -->

## Lessons Learned

## What's Next

Artikel ini bagian dari seri **Membangun GPS Backend dari Nol**.

- Sebelumnya: [Part 1 — Memahami GPS Protocol](/writing/memahami-gps-protocol/)
- Selanjutnya: [Part 3 — Decode Packet: GT06 & Teltonika Protocol](/writing/decode-packet-gt06-teltonika/)

## CTA

Bagikan artikel ini jika bermanfaat. Untuk diskusi lebih lanjut, kunjungi [Contact](/contact/) atau subscribe [RSS](/writing/index.xml).
