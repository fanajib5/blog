---
title: "Hijrah Frontend (5): Dua Sisi Satu Gedung"
description: "Episode penutup seri Hijrah Frontend: inventaris akhir port tipis, pelajaran yang sama dengan pakaian berbeda, warisan yang dirawat vs yang menunggu, dan perpisahan singkat."
author: "Faiq Najib Al-Aziz"
date: 2026-09-24T09:00:00+07:00
lastmod: 2026-09-11T03:45:00+07:00
draft: true
toc: true
comments: false
tags:
  - frontend
  - refleksi
  - cerita
series: "Hijrah Frontend"
---

Ini episode terakhir berseri _frontend_. Dan sesuai tradisi penutup di [seri sebelah](/writing/2026/hijrah-backend-09/), episode ini bukan pesta kemenangan; dia inventaris akhir: apa yang sudah beres, apa yang sengaja belum, dan apa yang dipelajari dari tinggal di gedung yang dua sisinya akhirnya dihuni satu orang yang sama hehe~

## Inventaris Akhir yang Jujur

Empat episode lalu kita membuka gedung _frontend_ warisan. Saat pintu ditutup kembali, begini isinya:

- **76 halaman pindah, 76 halaman hidup.** Port 1:1 tanpa buang satu halaman pun, dan semua _link_ internal antar halaman tetap mengerti jalan pulangnya.
- **Dua _library_ UI tetap berdamai.** Seratus satu _file_ untuk si mayoritas, tiga belas untuk si pemegang monopoli kalender, dan tetap nol _file_ yang memergoki mereka berbagi kamar.
- **194 bekas luka tipe terukur.**[^1] Dua ratus jaring pengaman kecil yang jujur mengaku dirinya angsuran, bukan arsitektur.
- **Tiga era styling hidup berdampingan**,[^2] satu jenazah _backup_ mendapat penghormatan terakhir yang layak, dan _standardisasi_ resmi menunggu di ruang epilog.

Tidak ada di daftar itu yang berbunyi "semuanya rapi". Dan justru itu kejujurannya: gedung ini tidak selesai direnovasi; gedung ini **selesai dipindahkan**. Dua hal yang berbeda, dan membedakan keduanya adalah pelajaran terbesar dari dua seri hehe~

## Dua Sisi Satu Gedung

Kalau kedua seri ini dibaca berdampingan, satu polanya tidak mungkin terlewat: **pelajarannya sama, cuma pakainya beda**.

Di _backend_, warisan berupa _query_ yang tak sargable dan _prepared statement_ yang terbunuh di _tunnel_. Di _frontend_, warisan berupa _field_ yang berpendapat soal tipe dan dua _library_ yang berdamai lewat garis demarkasi. Di kedua sisi, solusinya juga sama persis: ukur dulu, pindahkan dengan setia, catat yang dibatalkan, dan jangan pernah memperbaiki sambil memindahkan.

Bahkan penjaganya sama. Di kedua gedung, yang membesarkan kode bukan kebijakan arsitektur yang indah, melainkan **waktu dan darurat**. Karena itu pula, saya tidak pernah bisa membenci bau _spaghetti_ yang saya cium di gedung ini: dia bau yang sama dengan gedung sebelah, bau tempat yang terus bertugas meski penjaganya berganti-ganti hehe~

## Yang Dirawat, yang Menunggu

Supaya setia pada tradisi daftar utang, ini pembagiannya:

**Yang dirawat mulai sekarang**: garis demarkasi _library_ (nol _file_ campuran), kontrak tipe di pintu masuk, dan kebiasaan mencatat warisan yang dibawa, seperti empat episode ini.

**Yang menunggu gilirannya**: _TypeScript_ (keputusan besar yang belum waktunya), standardisasi penamaan lintas era (epilog, bukan koper), dan _refactor_ struktur internal (satu keputusan satu waktu, dengan data pemakaian di tangan).

**Yang dibatalkan dan tidak menyesal**: migrasi _state management_. Dia sudah masuk daftar yang tidak jadi, dan daftar itu bagian dari arsip yang sehat hahaha.

> **[ISI KAMU, opsional: satu-dua kalimat sebagai backend engineer yang kini juga merawat frontend. Rasanya sekarang bagaimana? Tetap negeri turis, atau sudah mulai merasa penduduk? Suaramu, terserah panjangnya.]**

## Penutup Dua Seri

Dengan episode ini, dua seri Hijrah berdiri selesai: [satu _backend_](/writing/2026/hijrah-backend-01/), satu _frontend_, dua sisi satu gedung yang sama, yang melayani puluhan ribu _user_ setiap hari tanpa pernah sekali pun minta diacungi jempol.

Kalau Anda sedang berdiri di depan gedung warisan Anda sendiri, _backend_ atau _frontend_ atau yang lain: ukur dulu, pindahkan dengan setia, rawat diri Anda, dan izinkan beberapa warisan menunggu gilirannya dengan tenang. Gedung tidak perlu selesai direnovasi supaya layak dihuni.

Terima kasih sudah mengikuti sampai episode terakhir. Semoga gedung Anda bertugas lama, dan penjaganya berganti dengan tenang.

Sekian. Salam.

[^1]: Angka-angka inventaris merujuk pada episode-episode sebelumnya di seri ini, yang masing-masing mencantumkan catatan pengukurannya.

[^2]: Nama _library_, _framework_, dan detail _stack_ tetap disederhanakan, konsisten dengan seluruh seri.
