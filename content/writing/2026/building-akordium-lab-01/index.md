---
title: "Building Akordium Lab #1: Mulai dari Nol yang Tidak Benar-Benar Nol"
description: "Catatan pertama membangun Akordium Lab terbuka: kenapa mulai, apa yang sudah ada di meja September 2026, dan target 12 bulan yang bisa kamu tuntut."
author: "Faiq Najib Al-Aziz"
date: 2026-10-01
lastmod: 2026-10-01
draft: true
toc: true
comments: true
images:
  - og.png
tags:
  - akordium
  - building-in-public
  - bisnis
pillar: "akordium"
series: "building-akordium-lab"
series_part: 1
---

Ini tulisan pertama dari seri yang saya beri nama **Building Akordium Lab** — catatan bulanan membangun perusahaan software dari Surabaya, ditulis sambil jalan, bukan sesudah sukses.

Kenapa ditulis terbuka? Dua alasan. Pertama, saya belajar paling baik dengan menulis — kalau tidak didokumentasikan, pengalaman menguap. Kedua, saya iri sama orang-orang yang membangun bisnis kecilnya di publik: open startup, indie hacker, dev yang jualan produk sendiri. Mereka punya kendali atas narasi dan komunitas. Saya mau begitu, versi saya sendiri.

Oh iah, satu peringatan: seri ini bukan seri sukses. Ini seri proses. Angka dan kesimpulan di sini bisa keliru, dan nanti bagian dari serunya adalah membaca ulang tulisan ini setahun lagi sambil geleng-geleng.

## Kenapa Mulai

Saya backend developer. Harian saya PHP/Laravel, sekarang makin banyak Go, PostgreSQL, sistem yang harus hidup terus — termasuk sistem GPS tracking yang menangani posisi kendaraan ribuan unit setiap hari. Pekerjaan yang saya suka.

Tapi pola karier "proyek masuk → dikerjakan → selesai → hilang" mulai terasa boros. Setiap proyek menghasilkan pengetahuan — arsitektur, keputusan, kesalahan, cara memperbaiki insiden jam 2 pagi — dan semuanya menguap begitu proyek close. Satu kerja, satu hasil. Tidak ada aset yang menumpuk.

Jadi Akordium Lab saya dirancang dengan satu prinsip: **satu kerja harus menghasilkan banyak aset.** Proyek klien menghasilkan artikel, library, template, studi kasus, dan — kalau berhasil — produk. Dari semua yang saya rencanakan 12 bulan ke depan, prinsip ini yang paling nggak boleh dilanggar.

## Apa yang Sudah Ada di Meja (September 2026)

Supaya jujur, ini inventaris awalnya — kondisi per akhir September 2026, saat strategi konten ini baru mulai jalan:

**Sudah hidup:**

- **[akordium.id](https://akordium.id)** — landing page perusahaan, dengan layanan dan portfolio
- **najib.id** — blog pribadi ini. Dua jalur konten sedang jalan: [seri naratif Hijrah Backend](/writing/2026/hijrah-backend-01/) (9 episode kisah migrasi 370+ endpoint) yang baru terbit, dan [seri tutorial GPS Backend](/writing/2026/memahami-gps-protocol/) yang mulai minggu ini; sisanya masih campuran tulisan lama (2019–2023) dan beberapa tulisan 2026 lainnya
- **Beberapa produk internal** dalam tahap berbeda-beda — dari yang aktif dipakai sampai yang baru sebatas desain bisnis di dokumen
- **DukunGPS** — rencana platform GPS tracking open-core yang paling serius saya garap: business design-nya sudah selesai dan disetujui Juli 2026, tinggal eksekusi. Fondasinya pengalaman production GPS fleet tracking yang saya ceritakan di [seri GPS Backend](/writing/2026/memahami-gps-protocol/)

**Baru dirapikan bulan ini:**

- **Sistem dokumentasi internal** (HQ) — satu tempat untuk semua SOP, spesifikasi produk, dan strategi konten. Sebelumnya tersebar di chat, kepala, dan dokumen random
- **Roadmap konten 12 minggu ke depan** — GPS Backend Series sebagai seri utama, artikel AI workflow, dan seri Building Akordium Lab ini
- **Master doc seri GPS** — semua materi teknis seri GPS dikumpulkan jadi satu sumber dulu, baru dipecah jadi artikel. Seperti yang saya bilang: satu kerja, banyak aset

**Belum ada:** pembaca tetap (newsletter/RSS subscriber masih hitungan jari), revenue dari produk (masih nol — jasa development yang menopang), dan nama yang dikenal orang di luar lingkaran pertemanan.

## Cara Kerja yang Saya Pegang

Tiga keputusan yang mungkin beda dari software house kebanyakan:

1. **Backend dulu, sederhana dulu.** Go + PostgreSQL + monolith modular. Tidak microservice hari pertama, tidak Kubernetes karena FOMO. Kompleksitas dibeli saat dibutuhkan, bukan saat trendi — ini juga pelajaran dari migrasi sistem production yang saya tulis di blog ini.
2. **Open core untuk produk.** DukunGPS dirancang model Traccar: core open source (Apache 2.0), fitur enterprise berbayar. Open source jadi mesin kepercayaan dan distribusi, bukan CSR.
3. **Tulis semua.** Setiap keputusan arsitektur, setiap masalah terpecahkan, setiap kesalahan. Blog personal jadi mesin otoritas, akordium.id jadi mesin konversi. Keduanya saling feed, tidak saling rebut.

## Target 12 Bulan

Supaya bisa dituntut, targetnya saya turunkan jadi yang bisa diukur:

| Target                                                   | Ukuran                                        |
| -------------------------------------------------------- | --------------------------------------------- |
| Seri GPS Backend lengkap terbit + dikompilasi jadi ebook | 6+ artikel, 1 ebook lead magnet               |
| Konten terbit konsisten                                  | sesuai roadmap, tanpa bolong > 2 minggu       |
| Newsletter punya pembaca tetap pertama                   | 50 subscriber                                 |
| DukunGPS lewat gerbang Fase 0–1                          | repo core open source rilis + komunitas awal  |
| Kontributor/lead dari konten                             | ada prospek yang menyebut "baca blognya dulu" |

Yang **tidak** saya targetkan 12 bulan ini: revenue produk yang menggantikan jasa. Itu realistisnya 2–3 tahun. Tahun ini membangun aset dan distribusi.

## Kesalahan Bulan Ini

Sesi planning konten kemarin hampir menghasilkan kecelakaan kecil yang lucu: saya (bersama asisten AI) sempat **menulis ulang artikel yang ternyata sudah pernah ditulis** — draft lama tergeletak diam di folder tanpa ada yang ingat. Bukan sekali, hampir dua kali.

Pelajarannya: memory yang tidak dituliskan tidak ada. Sekarang semua rencana konten hidup di satu roadmap dengan status per artikel, plus memory lintas sesi buat asisten AI-nya. Meta banget, tapi prinsip "dokumentasikan atau hilang" terbukti berlaku bahkan untuk proses dokumentasi itu sendiri.

## Metrik yang Akan Dilaporkan Tiap Bulan

Setiap tulisan Building Akordium Lab akan melaporkan hal yang sama supaya bisa dibandingkan:

1. Konten terbit vs rencana
2. Progres produk (DukunGPS dan kawan-kawan)
3. Subscriber/traffic
4. Satu kesalahan + satu pembelajaran
5. Keputusan penting bulan itu

Angka finansial dulu saya simpan dulu — belum ada yang menarik untuk dibagikan, dan saya belum memutuskan seberapa terbuka mau jadi. Nanti kita lihat.

---

Itu kondisi awalnya. Meja sudah dirapikan, roadmap sudah tertulis, seri GPS minggu depan mulai terbit.

Kalau kamu membangun sesuatu juga — produk, agency, apa pun — saya senang dengar ceritanya. [Kontak ada di sini](/contact/), atau ikuti lewat [RSS](/writing/index.xml).

Bulan depan: laporan pertama.

Sekian. Salam.
