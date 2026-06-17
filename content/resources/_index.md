---
title: "Resources"
description: "Kumpulan tools, template, checklist, dan resource gratis yang saya buat atau rekomendasikan untuk backend developer dan independent builder."
date: 2024-01-01T00:00:00+07:00
lastmod: 2024-01-01T00:00:00+07:00
author: "Faiq Najib Al-Aziz"
draft: false
toc: true
comments: false
tags:
  - resources
  - tools
  - open-source
  - backend
  - golang
---

Halaman ini mengumpulkan **tools, template, dan resource gratis** yang saya buat atau rekomendasikan untuk backend developer, independent builder, dan educator.

## Open Source Tools

### go-starter (Go Project Scaffolder)
CLI tool untuk scaffold proyek Go dengan struktur Clean Architecture yang sudah siap production. Mengurangi boilerplate dan mempercepat inisialisasi project.

- **Repositori:** [github.com/fanajib5/go-starter](https://github.com/fanajib5/go-starter)
- **Fitur:** Clean Architecture, Gin/Echo/Fiber pilihan, Docker-ready, CI/CD config
- **Cocok untuk:** Backend developer yang ingin mulai project Go dengan struktur yang benar

### retro-jib-hugo-theme (Fork Theme Blog Developer)
Theme Hugo untuk blog developer yang saya modifikasi dari `retro-jib`. Mendukung bilingual (ID/EN), SEO-friendly, dan ringan.

- **Repositori:** [github.com/fanajib5/retro-jib-hugo](https://github.com/fanajib5/retro-jib-hugo)
- **Fitur:** Bilingual, responsive, dark mode, SEO optimized
- **Cocok untuk:** Developer yang ingin setup blog pribadi dengan Hugo

## Checklist & Cheatsheet

### Backend Developer Checklist
Checklist untuk memastikan aplikasi backend production-ready sebelum deploy:

- [ ] Database migration sudah versioned (gunakan Goose/Migrate)
- [ ] Environment variables dikelola dengan benar (bukan hardcoded)
- [ ] Logging terstruktur (structured logging dengan zap/logrus)
- [ ] Health check endpoint (`/health` atau `/ready`)
- [ ] Graceful shutdown sudah diimplementasi
- [ ] Rate limiting pada endpoint publik
- [ ] Input validation di semua endpoint
- [ ] Error handling yang konsisten (jangan expose stack trace ke client)
- [ ] Connection pooling untuk database sudah dioptimasi
- [ ] Backup strategy untuk database

### PostgreSQL Performance Cheatsheet
Panduan cepat untuk optimasi query PostgreSQL:

| Masalah | Solusi |
|----------|--------|
| Query lambat | `EXPLAIN ANALYZE` untuk identify slow query |
| Missing index | `CREATE INDEX CONCURRENTLY` untuk hindari lock |
| N+1 query | Gunakan eager loading (`JOIN` atau `IN` clause) |
| Connection exhaustion | PNDOO connection pooling (PgBouncer) |
| Table bloat | `VACUUM FULL` atau `pg_repack` |

## Tutorial yang Direkomendasikan

### Migrasi PHP ke Golang
Pengalaman praktis migrasi sistem CodeIgniter 3 ke Go dengan arsitektur yang bersih.

- **Baca:** [Migrasi Legacy PHP ke Go](/writing/2026/legacy-php-to-go-migration/)

### Setup VPS untuk Production
Panduan setup VPS Hetzner dari nol hingga siap deploy aplikasi.

- **Baca:** [Catatan VPS: Set Up VPS Pertama yang Bukan Pertama](/writing/2023/set-up-first-but-not-first-vps/)

### Clean Architecture untuk Go
Pengenalan prinsip Clean Architecture dan penerapannya di proyek Go.

- **Baca:** [Pengenalan Clean Architecture](/writing/2023/clean-architecture-intro/)

## Kontribusi

Jika Anda menemukan bug atau ingin menambahkan resource, silakan buat issue atau pull request di repositori terkait. Semua resource di halaman ini gratis untuk digunakan secara komersial maupun non-komersi.

---

*Ini adalah halaman yang sedang berkembang. Saya akan terus menambahkan resource baru seiring pembelajaran dan proyek yang saya bangun.*
