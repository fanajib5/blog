---
title: "MIS-APAR — Sistem Manajemen APAR"
description: "Sistem informasi manajemen penjualan, inventaris, dan pemeliharaan Alat Pemadam Api Ringan (APAR) — produk pertama PT Akordium Digital Berkah."
date: 2026-01-01
lastmod: 2026-04-15T00:00:00+07:00
draft: false
comments: false
project_type: "Freelance / Product"
tech_stack: ["Laravel", "Livewire", "Alpine.js", "Tailwind CSS", "MySQL", "Redis"]
live_url: ""
repo_url: "https://github.com/fanajib5/mis-apar"
---

## Masalah

CV Andika Jaya Infinite mengelola bisnis penjualan dan pemeliharaan APAR (Alat Pemadam Api Ringan) secara manual — mulai dari pencatatan stok, penjualan, hingga jadwal pemeliharaan. Proses manual ini menyebabkan:

- Kesenjangan antara stok fisik dan stok sistem
- Sulit melacak kontrak pemeliharaan yang sudah jatuh tempo
- Laporan keuangan yang lambat dan rentan kesalahan

## Solusi

Dibangun MIS-APAR (Management Information System for Fire Extinguisher) sebagai **produk pertama PT Akordium Digital Berkah** — perusahaan sole proprietorship saya.

### Fitur Utama

Sistem ERP-style yang mencakup seluruh operasional bisnis APAR:

- **Master data** — customer, produk, pricing
- **Sales workflow** — sales order, invoice, delivery
- **Maintenance management** — kontrak pemeliharaan, scheduling, tracking
- **Bookkeeping** — pembayaran, laporan keuangan
- **Document management** — generate dokumen terkait transaksi

### Stack Teknis

| Komponen | Teknologi |
|----------|-----------|
| Backend | Laravel |
| Frontend | Livewire + Alpine.js |
| Styling | Tailwind CSS + Flux UI |
| Database | MySQL |
| Cache | Redis |

Dioptimalkan untuk **pengguna non-teknis** — 4 admin user dan owner mengoperasikan sistem untuk kegiatan bisnis sehari-hari.

## Hasil

- Digitalisasi seluruh operasional bisnis APAR yang sebelumnya manual
- Interface yang user-friendly untuk pengguna non-teknis
- Workflow ERP-style lengkap dari sales hingga maintenance contract

## Pelajaran

1. **User-centric design untuk non-teknis** — keputusan menggunakan Livewire + Alpine.js (bukan SPA framework) mempercepat development sambil tetap memberikan interaktivitas yang cukup untuk admin
2. **ERP-style complexity management** — bisnis APAR punya domain logic yang lebih kompleks dari yang terlihat (pricing tier, maintenance scheduling, document generation) — memahami domain bisnis jauh lebih penting daripada pilihan teknis
3. **First product lessons** — membangun produk pertama untuk klien nyata mengajarkan arti sebenarnya dari "build what matters" vs "build what's cool"
