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

Ini tulisan pertama di seri **Building Akordium Lab**. Rencananya saya akan menulis catatan bulanan sambil membangun perusahaan software dari Surabaya. Jadi ini bukan kisah yang ditulis setelah semuanya sukses. Saya sendiri juga belum tahu nanti jalannya akan seperti apa.

Kenapa saya menulisnya terbuka? Saya lebih gampang belajar kalau sambil menulis, dan pengalaman cepat sekali menguap kalau cuma disimpan di kepala. Saya juga iri melihat orang-orang yang membangun bisnis kecil sambil cerita prosesnya, dari startup sampai developer yang menjual produk sendiri. Mereka bisa membangun cerita dan komunitasnya sendiri. Saya mau mencoba juga, walaupun versi saya mungkin lebih banyak cerita soal bingungnya.

Oh iya, jangan berharap kisah sukses dulu. Ini catatan proses, dan angka atau kesimpulan saya bisa saja keliru. Semoga setahun lagi saya bisa membaca ulang tulisan ini sambil geleng-geleng (atau tertawa karena ternyata rencananya meleset semua).

## Kenapa Mulai

Saya backend developer. Sehari-hari saya bekerja dengan PHP/Laravel, dan belakangan makin banyak memakai Go dan PostgreSQL. Saya juga mengerjakan sistem yang harus terus hidup, termasuk sistem GPS tracking yang menangani posisi ribuan kendaraan setiap hari. Pekerjaan yang saya suka.

Tapi belakangan pola kerja "proyek datang, dikerjakan, selesai, lalu hilang" terasa agak sayang. Dari tiap proyek ada pelajaran soal arsitektur, keputusan yang saya sesali, dan insiden jam 2 pagi yang bikin mata melek. Begitu proyek selesai, banyak pengetahuan itu ikut menguap. Kerja sekali, hasilnya sekali. Rasanya kok boros, ya?

Dari situ muncul prinsip Akordium Lab: **satu kerja sebisa mungkin menghasilkan beberapa aset.** Proyek klien bisa jadi bahan artikel, library, template, studi kasus, atau kalau beruntung, produk. Saya ingin mengingat prinsip ini selama 12 bulan ke depan. Nanti kita lihat saya konsisten atau tidak, hahaha.

## Apa yang Sudah Ada di Meja (September 2026)

Biar kelihatan titik mulainya, ini keadaan saya di akhir September 2026. Strategi kontennya baru mulai jalan waktu itu:

**Sudah hidup:**

- **[akordium.id](https://akordium.id)**: landing page perusahaan, dengan layanan dan portfolio
- **najib.id**: blog pribadi ini. Dua jalur konten sedang berjalan: [seri naratif Hijrah Backend](/writing/2026/hijrah-backend-01/), kisah 9 episode migrasi 370+ endpoint yang baru terbit, dan [seri tutorial GPS Backend](/writing/2026/memahami-gps-protocol/) yang mulai minggu ini. Tulisan lainnya masih campuran artikel lama (2019-2023) dan beberapa tulisan 2026.
- **Beberapa produk internal** dalam tahap berbeda, mulai dari yang aktif dipakai sampai yang baru berupa desain bisnis di dokumen.
- **DukunGPS**: rencana platform GPS tracking open-core yang paling serius saya garap. Business design-nya selesai dan disetujui pada Juli 2026; sekarang tinggal eksekusi. Fondasinya adalah pengalaman production GPS fleet tracking yang saya ceritakan di [seri GPS Backend](/writing/2026/memahami-gps-protocol/).

**Baru dirapikan bulan ini:**

- **Sistem dokumentasi internal** (HQ): satu tempat untuk semua SOP, spesifikasi produk, dan strategi konten. Sebelumnya, semuanya tersebar di chat, kepala, dan dokumen random.
- **Roadmap konten 12 minggu ke depan**: berisi GPS Backend Series sebagai seri utama, artikel AI workflow, dan seri Building Akordium Lab ini.
- **Master doc seri GPS**: semua materi teknis dikumpulkan dalam satu sumber sebelum dipecah menjadi artikel. Prinsipnya sama: satu kerja, banyak aset.

**Belum ada:** pembaca tetap (newsletter/RSS subscriber masih hitungan jari), revenue dari produk (masih nol, jasa development yang menopang), dan nama yang dikenal orang di luar lingkaran pertemanan.

## Beberapa Pilihan Kerja Saya

Di sisi teknis, saya memilih Go + PostgreSQL dan monolith modular. Microservice atau Kubernetes tidak perlu dipakai sejak hari pertama cuma karena FOMO. Kompleksitasnya menyusul kalau memang ada masalah yang perlu diatasi. Untuk produk, DukunGPS memakai model Traccar: core open source (Apache 2.0), lalu fitur enterprise berbayar. Saya juga mau mencatat keputusan arsitektur, masalah yang selesai, dan kesalahan. Semoga blog ini berguna buat orang lain juga, bukan cuma jadi tempat saya curhat soal kerjaan.

## Target 12 Bulan

Biar nanti saya bisa ditagih, targetnya saya buat cukup konkret:

| Target                                                   | Ukuran                                        |
| -------------------------------------------------------- | --------------------------------------------- |
| Seri GPS Backend lengkap terbit + dikompilasi jadi ebook | 6+ artikel, 1 ebook lead magnet               |
| Konten terbit konsisten                                  | sesuai roadmap, tanpa bolong > 2 minggu       |
| Newsletter punya pembaca tetap pertama                   | 50 subscriber                                 |
| DukunGPS lewat gerbang Fase 0-1                          | repo core open source rilis + komunitas awal  |
| Kontributor/lead dari konten                             | ada prospek yang menyebut "baca blognya dulu" |

Yang **tidak** saya targetkan dalam 12 bulan ini adalah pendapatan produk yang menggantikan jasa. Target itu lebih realistis dalam 2-3 tahun. Tahun ini saya fokus membangun aset dan distribusi.

## Kesalahan Bulan Ini

Di sesi planning konten bulan ini, saya dan asisten AI hampir **menulis ulang artikel yang ternyata sudah pernah saya tulis**. Draft lamanya ternyata masih ada di folder. Kami hampir mengulang blunder yang sama, padahal jawabannya tinggal dicari dulu, hehe.

Saya suka merasa ingatan saya cukup bagus. Nyatanya, draft lama saja bisa lupa. Sekarang rencana konten saya taruh di satu roadmap dengan status tiap artikel, plus memory lintas sesi untuk asisten AI. Agak meta memang, tapi rupanya proses dokumentasi pun perlu didokumentasikan.

## Yang Akan Saya Cek Tiap Bulan

Di tiap tulisan Building Akordium Lab, saya akan mencoba melaporkan lima hal ini supaya progres bulan ke bulan masih bisa dibandingkan:

1. Konten terbit vs rencana
2. Progres produk (DukunGPS dan kawan-kawan)
3. Subscriber/traffic
4. Satu kesalahan + satu pembelajaran
5. Keputusan penting bulan itu

Untuk sekarang, saya belum membagikan angka finansial. Belum ada yang menarik untuk dibagikan, dan saya belum memutuskan seberapa terbuka ingin bercerita soal itu. Nanti saya lihat lagi.

---

Begitulah kondisi awal Akordium Lab di akhir September. Roadmap 12 minggu sudah saya susun, dan seri GPS Backend rencananya mulai terbit minggu depan. Semoga jadwalnya tidak langsung berantakan.

Kalau kamu juga sedang membangun produk atau agency, saya senang mendengar ceritamu. [Hubungi saya di sini](/contact/), atau ikuti tulisan berikutnya lewat [RSS](/writing/index.xml).

Bulan depan: laporan pertama.

Sekian. Salam.
