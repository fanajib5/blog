---
title: "GPS Fleet Tracking API, Laravel ke Go"
description: "Konversi full-stack backend GPS fleet tracking dari Laravel (PHP) ke Go dengan MySQL (data domain) + PostgreSQL/TimescaleDB (data lokasi), 370+ endpoint, 33 entity, clean architecture."
date: 2024-06-01
lastmod: 2026-09-11T02:30:00+07:00
draft: false
comments: false
project_type: "Production System"
tech_stack: ["Go", "MySQL", "PostgreSQL", "TimescaleDB", "RabbitMQ", "Docker"]
live_url: ""
repo_url: ""
results: ["~194K LoC migrated", "370+ API endpoints", "Read/write split otomatis"]
---

## Masalah

Sistem GPS fleet tracking yang menangani pelacakan kendaraan secara real-time berjalan di atas Laravel (PHP) dengan MySQL. Seiring pertumbuhan jumlah device dan volume data lokasi, sistem mengalami bottleneck:

- **Respons time** yang semakin lambat pada endpoint reporting dan history
- **Koneksi database** yang sering terkuras oleh query kompleks di tabel device data yang sangat besar
- **Maintenance** yang mahal, setiap perubahan butuh understanding PHP codebase yang sudah kompleks

## Solusi

Konversi total backend dari **Laravel → Go** menggunakan Clean Architecture pattern, dengan pemisahan peran database: **MySQL untuk data domain, PostgreSQL + TimescaleDB untuk data lokasi (time-series)**.

### Arsitektur

```
Request → Controller → UseCase → Repository → MySQL (domain) / PostgreSQL+TimescaleDB (lokasi)
                       ↕
                    Gateway → External API / RabbitMQ
```

Setiap layer punya tanggung jawab yang jelas:
- **Entity**: 33 domain model (device, geofence, vehicle, driver, invoice, dll)
- **UseCase**: 40 business logic layer
- **Repository**: 82 file data access (read/write split, master-slave aware)
- **Route**: 370+ API endpoint

### Stack Teknis

| Komponen | Teknologi |
|----------|-----------|
| Language | Go 1.26 |
| HTTP Framework | GoFiber v2 |
| Database | MySQL (data domain) + PostgreSQL/TimescaleDB (data lokasi/time-series) |
| ORM/Driver | pgx/v5 (raw SQL performance) |
| Messaging | RabbitMQ (amqp091-go) |
| Cache | Ristretto (in-memory) |
| Migration | golang-migrate |
| Validation | go-playground/validator |
| Auth | JWT + unified auth |

### Fitur Utama

- **Real-time tracking**: data lokasi device diproses dan disimpan ke TimescaleDB hypertable
- **Geofencing**: alert masuk/keluar area, schedule geofence
- **Dashboard & reporting**: device summary, history route, fuel monitoring
- **Fleet management**: vehicle, driver, device assignment
- **Billing**: invoice, partner, payment integration (BCA VA)
- **Multi-tenancy**: enterprise, user group, shared link
- **IoT Hub**: device command, incident tracking

## Hasil

- **~194K lines of Go code** menggantikan codebase PHP
- **370+ API endpoint** dengan full parity terhadap versi Laravel
- **Read/write split** otomatis, query berat dialihkan ke slave DB
- **TimescaleDB hypertable** untuk tabel device data yang menerima jutaan record per hari
- Build time dan binary yang efisien, single binary deployment via Docker

## Pelajaran

1. **Clean Architecture membantu migrasi bertahap**: setiap endpoint bisa dikonversi satu per satu tanpa breaking changes, memungkinkan v2 (Laravel) dan v3 (Go) berjalan paralel selama transisi
2. **pgx/v5 > ORM untuk high-throughput**: kontrol penuh terhadap SQL query memberikan performa yang lebih predictable dibanding ORM abstraction
3. **TimescaleDB mengubah permainan**: hypertable + compression membuat jutaan record lokasi per hari tersimpan hemat dan tetap cepat dibaca.
