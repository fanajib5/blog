---
title: "GPS Fleet Tracking API — Laravel ke Go"
description: "Konversi full-stack backend GPS fleet tracking dari Laravel (PHP) ke Go dengan PostgreSQL — 370+ endpoint, 33 entity, clean architecture."
date: 2024-06-01
lastmod: 2026-04-15T00:00:00+07:00
draft: false
comments: false
project_type: "Production System"
tech_stack: ["Go", "PostgreSQL", "TimescaleDB", "Apache Kafka", "Docker"]
live_url: ""
repo_url: ""
---

## Masalah

Sistem GPS fleet tracking yang menangani pelacakan kendaraan secara real-time berjalan di atas Laravel (PHP) dengan MySQL. Seiring pertumbuhan jumlah device dan volume data lokasi, sistem mengalami bottleneck:

- **Respons time** yang semakin lambat pada endpoint reporting dan history
- **Koneksi database** yang sering terkuras oleh query kompleks di tabel device data yang sangat besar
- **Maintenance** yang mahal — setiap perubahan butuh understanding PHP codebase yang sudah kompleks

## Solusi

Konversi total backend dari **Laravel → Go** menggunakan Clean Architecture pattern, dengan migrasi database dari **MySQL → PostgreSQL + TimescaleDB**.

### Arsitektur

```
Request → Controller → UseCase → Repository → PostgreSQL/TimescaleDB
                       ↕
                    Gateway → External API / Kafka
```

Setiap layer punya tanggung jawab yang jelas:
- **Entity**: 33 domain model (device, geofence, vehicle, driver, invoice, dll)
- **UseCase**: 40 business logic layer
- **Repository**: 82 file data access (read/write split, master-slave aware)
- **Route**: 370+ API endpoint

### Stack Teknis

| Komponen | Teknologi |
|----------|-----------|
| Language | Go 1.24 |
| HTTP Framework | GoFiber v2 |
| Database | PostgreSQL + TimescaleDB (hypertable untuk device data) |
| ORM/Driver | pgx/v5 (raw SQL performance) |
| Messaging | Apache Kafka (Sarama) |
| Cache | Ristretto (in-memory) |
| Migration | golang-migrate |
| Validation | go-playground/validator |
| Auth | JWT + unified auth |

### Fitur Utama

- **Real-time tracking** — data lokasi device diproses dan disimpan ke TimescaleDB hypertable
- **Geofencing** — alert masuk/keluar area, schedule geofence
- **Dashboard & reporting** — device summary, history route, fuel monitoring
- **Fleet management** — vehicle, driver, device assignment
- **Billing** — invoice, partner, payment integration (BCA VA)
- **Multi-tenancy** — enterprise, user group, shared link
- **IoT Hub** — device command, incident tracking

## Hasil

- **~194K lines of Go code** menggantikan codebase PHP
- **370+ API endpoint** dengan full parity terhadap versi Laravel
- **Read/write split** otomatis — query berat dialihkan ke slave DB
- **TimescaleDB hypertable** untuk tabel device data yang menerima jutaan record per hari
- Build time dan binary yang efisien — single binary deployment via Docker

## Pelajaran

1. **Clean Architecture membantu migrasi bertahap** — setiap endpoint bisa dikonversi satu per satu tanpa breaking changes, memungkinkan v2 (Laravel) dan v3 (Go) berjalan paralel selama transisi
2. **pgx/v5 > ORM untuk high-throughput** — kontrol penuh terhadap SQL query memberikan performa yang lebih predictable dibanding ORM abstraction
3. **TimescaleDB mengubah permainan** — hypertable + continuous aggregate menggantikan query reporting yang sebelumnya butuh menit menjadi detik
