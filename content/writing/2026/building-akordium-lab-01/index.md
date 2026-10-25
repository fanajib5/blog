---
title: "Building Akordium Lab #1: Mulai dari Nol yang Tidak Benar-Benar Nol"
description: "Catatan pertama membangun Akordium Lab terbuka: kenapa mulai, apa yang sudah ada di meja September 2026, dan target 12 bulan yang bisa kamu tuntut."
author: "Faiq Najib Al-Aziz"
date: 2026-10-01
lastmod: 2026-10-01
draft: false
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

Ini tulisan pertama dari seri **Building Akordium Lab**, catatan bulanan tentang membangun perusahaan software dari Surabaya. Saya menulisnya sambil jalan, bukan setelah sukses.

Kenapa ditulis terbuka? Ada dua alasan. Pertama, saya belajar paling baik dengan menulis. Kalau tidak didokumentasikan, pengalaman menguap. Kedua, saya iri melihat orang-orang yang membangun bisnis kecil secara terbuka: startup yang berbagi proses, indie hacker, dan developer yang menjual produknya sendiri. Mereka punya kendali atas narasi dan komunitas. Saya juga ingin mencoba cara itu, dengan versi saya sendiri.

Oh iya, satu peringatan: seri ini bukan kisah sukses, melainkan catatan proses. Angka dan kesimpulan di sini bisa keliru. Nanti, bagian serunya adalah membaca ulang tulisan ini setahun lagi sambil geleng-geleng.

## Kenapa Mulai

Saya backend developer. Sehari-hari saya bekerja dengan PHP/Laravel, dan belakangan makin banyak memakai Go dan PostgreSQL. Saya juga mengerjakan sistem yang harus terus hidup, termasuk sistem GPS tracking yang menangani posisi ribuan kendaraan setiap hari. Pekerjaan yang saya suka.

Tapi pola karier "proyek masuk → dikerjakan → selesai → hilang" mulai terasa boros. Setiap proyek memberi saya pengetahuan tentang arsitektur, keputusan, kesalahan, sampai cara menangani insiden jam 2 pagi. Semua itu menguap begitu proyek selesai. Satu pekerjaan, satu hasil. Tidak ada aset yang menumpuk.

Karena itu, Akordium Lab saya rancang dengan satu prinsip: **satu kerja harus menghasilkan banyak aset.** Proyek klien akan menghasilkan artikel, library, template, studi kasus, dan, kalau berhasil, produk. Dari semua rencana saya untuk 12 bulan ke depan, prinsip ini yang paling tidak boleh dilanggar.

## Apa yang Sudah Ada di Meja (September 2026)

Supaya jelas dari mana saya mulai, berikut inventaris per akhir September 2026, saat strategi konten ini baru berjalan:

**Sudah hidup:**

- **[akordium.id](https://akordium.id)** — landing page perusahaan, dengan layanan dan portfolio
- **najib.id** — blog pribadi ini. Dua jalur konten sedang berjalan: [seri naratif Hijrah Backend](/writing/2026/hijrah-backend-01/), kisah 9 episode migrasi 370+ endpoint yang baru terbit, dan [seri tutorial GPS Backend](/writing/2026/memahami-gps-protocol/) yang mulai minggu ini. Tulisan lainnya masih campuran artikel lama (2019–2023) dan beberapa tulisan 2026.
- **Beberapa produk internal** dalam tahap berbeda, mulai dari yang aktif dipakai sampai yang baru berupa desain bisnis di dokumen.
- **DukunGPS** — rencana platform GPS tracking open-core yang paling serius saya garap. Business design-nya selesai dan disetujui pada Juli 2026; sekarang tinggal eksekusi. Fondasinya adalah pengalaman production GPS fleet tracking yang saya ceritakan di [seri GPS Backend](/writing/2026/memahami-gps-protocol/).

**Baru dirapikan bulan ini:**

- **Sistem dokumentasi internal** (HQ) — satu tempat untuk semua SOP, spesifikasi produk, dan strategi konten. Sebelumnya, semuanya tersebar di chat, kepala, dan dokumen random.
- **Roadmap konten 12 minggu ke depan** — berisi GPS Backend Series sebagai seri utama, artikel AI workflow, dan seri Building Akordium Lab ini.
- **Master doc seri GPS** — semua materi teknis dikumpulkan dalam satu sumber sebelum dipecah menjadi artikel. Prinsipnya sama: satu kerja, banyak aset.

**Belum ada:** pembaca tetap (newsletter/RSS subscriber masih hitungan jari), revenue dari produk (masih nol — jasa development yang menopang), dan nama yang dikenal orang di luar lingkaran pertemanan.

## Cara Kerja yang Saya Pegang

Tiga keputusan yang mungkin beda dari software house kebanyakan:

1. **Backend dulu, sederhana dulu.** Go + PostgreSQL + monolith modular. Tidak perlu microservice sejak hari pertama atau Kubernetes karena FOMO. Kompleksitas dibeli saat dibutuhkan, bukan saat sedang trendi. Pelajaran ini juga saya dapat dari migrasi sistem production yang saya tulis di blog.
2. **Open core untuk produk.** DukunGPS dirancang dengan model Traccar: core open source (Apache 2.0) dan fitur enterprise berbayar. Open source menjadi mesin kepercayaan dan distribusi, bukan CSR.
3. **Tulis semua.** Catat setiap keputusan arsitektur, masalah yang terpecahkan, dan kesalahan. Blog pribadi membangun otoritas, sedangkan akordium.id membantu konversi. Keduanya saling mendukung, bukan saling berebut.

## Target 12 Bulan

Agar bisa ditagih, saya turunkan targetnya menjadi hal-hal yang bisa diukur:

| Target                                                   | Ukuran                                        |
| -------------------------------------------------------- | --------------------------------------------- |
| Seri GPS Backend lengkap terbit + dikompilasi jadi ebook | 6+ artikel, 1 ebook lead magnet               |
| Konten terbit konsisten                                  | sesuai roadmap, tanpa bolong > 2 minggu       |
| Newsletter punya pembaca tetap pertama                   | 50 subscriber                                 |
| DukunGPS lewat gerbang Fase 0–1                          | repo core open source rilis + komunitas awal  |
| Kontributor/lead dari konten                             | ada prospek yang menyebut "baca blognya dulu" |

Yang **tidak** saya targetkan dalam 12 bulan ini adalah pendapatan produk yang menggantikan jasa. Target itu lebih realistis dalam 2–3 tahun. Tahun ini saya fokus membangun aset dan distribusi.

## Kesalahan Bulan Ini

Sesi planning konten kemarin hampir menghasilkan kecelakaan kecil yang lucu. Saya dan asisten AI sempat **menulis ulang artikel yang ternyata sudah pernah ditulis**. Draft lamanya tergeletak di folder tanpa kami ingat. Kejadian ini hampir terulang.

Pelajarannya: ingatan yang tidak dituliskan mudah hilang. Sekarang semua rencana konten ada di satu roadmap dengan status tiap artikel, ditambah memory lintas sesi untuk asisten AI. Agak meta, tapi prinsip "dokumentasikan atau hilang" ternyata berlaku juga untuk proses dokumentasi.

## Metrik yang Akan Dilaporkan Tiap Bulan

Setiap tulisan Building Akordium Lab akan melaporkan lima hal yang sama agar progresnya bisa dibandingkan:

1. Konten terbit vs rencana
2. Progres produk (DukunGPS dan kawan-kawan)
3. Subscriber/traffic
4. Satu kesalahan + satu pembelajaran
5. Keputusan penting bulan itu

Untuk sekarang, saya belum membagikan angka finansial. Belum ada yang menarik untuk dibagikan, dan saya belum memutuskan seberapa terbuka ingin bercerita soal itu. Nanti saya lihat lagi.

---

Itulah kondisi awal Akordium Lab pada akhir September. Roadmap 12 minggu sudah ada, dan seri GPS Backend mulai terbit minggu depan.

Kalau kamu juga sedang membangun produk atau agency, saya senang mendengar ceritamu. [Hubungi saya di sini](/contact/), atau ikuti tulisan berikutnya lewat [RSS](/writing/index.xml).

Bulan depan: laporan pertama.

Sekian. Salam.
