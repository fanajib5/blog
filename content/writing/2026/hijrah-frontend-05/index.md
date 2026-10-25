---
title: "Hijrah Frontend (5): Dua Sisi Satu Gedung"
description: "Episode penutup seri Hijrah Frontend: inventaris akhir port tipis, pelajaran yang sama dengan pakaian berbeda, warisan yang dirawat vs yang menunggu, dan perpisahan singkat."
author: "Faiq Najib Al-Aziz"
date: 2026-09-23T09:00:05+07:00
lastmod: 2026-09-23T21:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - frontend
  - refleksi
  - cerita
series: "Hijrah Frontend"
---

Ini episode terakhir seri _frontend_. Seperti penutup [seri sebelah](/writing/2026/hijrah-backend-09/), saya tidak ingin menjadikannya pesta kemenangan. Saya ingin mencatat apa yang selesai, apa yang memang belum dikerjakan, dan apa yang saya pelajari setelah akhirnya mengurus kedua sisi gedung ini.

## Inventaris Akhir yang Jujur

Empat episode lalu, kita mulai membongkar gedung _frontend_ warisan. Setelah port selesai, inilah inventarisnya:

- **76 halaman dipindahkan dan tetap hidup.** Port 1:1 tanpa meninggalkan satu halaman pun. Semua _link_ internal antarhalaman masih menuju ke tempat yang benar.
- **Dua _library_ UI tetap dipakai.** Ada 101 _file_ untuk yang mayoritas dan 13 untuk pemegang komponen kalender. Seperti sebelumnya, tidak ada _file_ yang memakai keduanya.
- **194 bekas luka tipe sudah terukur.**[^1] Ada 194 jaring pengaman kecil yang masih berupa angsuran, belum menjadi arsitektur.
- **Tiga era _styling_ masih ada**,[^2] satu _backup_ sudah dipensiunkan, dan _standardisasi_ menunggu giliran.

Daftar ini tidak mengatakan bahwa semuanya sudah rapi. Gedung ini **selesai dipindahkan**, bukan selesai direnovasi. Membedakan dua hal itu menjadi pelajaran terbesar dari kedua seri.

## Dua Sisi Satu Gedung

Kalau kedua seri dibaca berdampingan, ada satu pola yang terlihat: **pelajarannya sama, masalahnya berbeda**.

Di _backend_, kami menemukan _query_ yang tidak sargable dan _prepared statement_ yang terputus di _tunnel_. Di _frontend_, ada _field_ dengan tipe yang tidak sesuai dan dua _library_ yang dipisahkan oleh garis demarkasi. Cara menanganinya serupa di kedua sisi: ukur dulu, pindahkan dengan setia, catat yang dibatalkan, dan jangan memperbaiki sambil memindahkan.

Kondisi di kedua gedung juga terbentuk oleh hal yang sama: **waktu dan keadaan darurat**, bukan kebijakan arsitektur yang rapi. Karena itu saya tidak bisa membenci _spaghetti_ di gedung ini. Kode itu tetap melayani penggunanya meski penjaganya berganti.

## Yang Dirawat, yang Menunggu

Berikut pembagian hal-hal yang kami catat:

**Yang dirawat mulai sekarang**: batas antarlibrary (tidak ada _file_ campuran), kontrak tipe di pintu masuk, dan kebiasaan mencatat warisan yang dibawa, seperti dalam empat episode ini.

**Yang menunggu giliran**: _TypeScript_ (keputusan besar yang belum waktunya), standardisasi penamaan lintas era, dan _refactor_ struktur internal setelah ada data pemakaian.

**Yang dibatalkan tanpa penyesalan**: migrasi _state management_. Rencana ini sudah masuk daftar yang tidak jadi, dan daftar itu juga bagian dari arsip yang sehat.

> Akhirnya, setelah ikut berjibaku merawat _web app_ v3 ini, saya semakin merasa menjadi turis di sini. Hati menolak, tapi tuntutan terus jalan, dan _production_ harus tetap lancar.

Di [episode pertama](/writing/2026/hijrah-frontend-01/) saya bercanda soal visa turis yang dicabut dan diganti KTP penduduk. Kenyataannya, KTP-nya memang terbit, tetapi hati saya masih sering membawa paspor.

## Penutup Dua Seri

Dengan episode ini, dua seri Hijrah selesai: [satu _backend_](/writing/2026/hijrah-backend-01/) dan satu _frontend_. Keduanya membahas dua sisi gedung yang sama, yang melayani puluhan ribu _user_ setiap hari tanpa pernah meminta diacungi jempol.

Kalau Anda sedang menghadapi gedung warisan sendiri, entah _backend_, _frontend_, atau yang lain, mulailah dengan mengukur. Pindahkan dengan setia, catat apa yang belum dikerjakan, dan rawat diri sendiri. Tidak semua hal harus selesai sekaligus.

Terima kasih sudah mengikuti seri ini sampai akhir. Semoga gedung Anda terus melayani dengan baik, meski penjaganya berganti.

Sekian. Salam.

[^1]: Angka-angka inventaris merujuk pada episode-episode sebelumnya di seri ini, yang masing-masing mencantumkan catatan pengukurannya.

[^2]: Nama _library_, _framework_, dan detail _stack_ tetap disederhanakan, konsisten dengan seluruh seri.
