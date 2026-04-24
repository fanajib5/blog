---
title: "URL Shortener REST API"
description: "Open source URL shortener backend menggunakan Go, Echo, dan MySQL dengan arsitektur modular."
date: 2021-12-01
lastmod: 2026-04-15T00:00:00+07:00
draft: false
comments: false
project_type: "Open Source"
tech_stack: ["Go", "Echo", "MySQL", "REST API"]
live_url: ""
repo_url: "https://github.com/fanajib5/url_shortener_PA"
---

## Masalah

Butuh backend URL shortener yang sederhana tapi terstruktur, bukan sekadar proof of concept, tapi kode yang bisa jadi referensi arsitektur untuk proyek Go lainnya.

## Solusi

Dibangun menggunakan **Go dengan Echo framework** dan **MySQL**, dengan struktur modular yang clean:

- **Link creation**: generate short code untuk URL panjang
- **Redirect handling**: resolve short code ke URL asli
- **Basic analytics**: tracking jumlah klik per link
- **RESTful API**: endpoint yang mengikuti best practices

### Arsitektur

Struktur modular yang memisahkan handler, service, dan repository, memudahkan testing dan extend untuk fitur baru.

## Hasil

- Open source di [GitHub](https://github.com/fanajib5/url_shortener_PA)
- Arsitektur modular yang bisa dijadikan template untuk proyek Go lain
- Clean endpoint design dengan error handling yang konsisten

## Pelajaran

1. **Framework selection matters**: Echo memberikan routing dan middleware yang ringan tanpa overhead, cocok untuk API kecil-menengah
2. **Modular structure sejak awal**: meskipun proyek kecil, struktur yang benar membuat penambahan fitur (analytics, auth) jadi straightforward tanpa refactor besar
