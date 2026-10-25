---
title: "Hijrah Frontend (3): Type Chaos, Angka, String Kosong, dan Halaman yang Berbeda Pendapat"
description: "Ep 3 seri Hijrah Frontend: satu field yang sama dikirim sebagai angka, string kosong, dan string biasa tergantung halamannya. Tentang PHP yang memafkan, Go yang perfeksionis, dan 194 bekas lukanya."
author: "Faiq Najib Al-Aziz"
date: 2026-09-23T09:00:03+07:00
lastmod: 2026-09-23T21:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - frontend
  - typescript
  - type-safety
  - cerita
series: "Hijrah Frontend"
---

Tiga halaman mengirim _field_ yang sama dengan cara berbeda. Halaman pertama mengirim angka. Halaman kedua mengirim _string_ kosong ketika nilainya tidak ada. Halaman ketiga mengirim angka yang dibungkus sebagai _string_. Cara-cara itu bertahan bertahun-tahun, sampai penerimanya berganti menjadi sistem yang tidak mau menebak.

Begitulah _type chaos_ muncul. Tidak ada yang sengaja membuatnya, tetapi bekasnya masih bisa dihitung di _repo_ kami.

## Dunia yang Memafkan

Dulu penerimanya adalah PHP, bahasa yang sangat pemaaf soal tipe data. Kirim `"123"`, dibaca sebagai 123. Kirim `""`, dianggap kosong. Kirim `null`, seolah tidak terlihat. Selama bertahun-tahun, halaman-halaman itu tidak perlu memikirkan tipe karena bahasanya tidak mempermasalahkannya.

Semua halaman pun mengirim dengan gayanya masing-masing, _backend_ menerimanya, dan hidup terasa sederhana. Belakangan saya sadar, kedamaian itu bukan tanda sistemnya sehat. Penerimanya saja yang tidak pernah protes.

## Tetangga Baru yang Perfeksionis

Lalu _backend_-nya pindah ke Go. Pandangannya soal tipe berbeda: **tipe adalah kontrak**. Kalau kontraknya meminta angka, yang dikirim harus angka. _String_ kosong yang mengaku angka ditolak di pintu, lengkap dengan _error decoding_ yang panjang dan sama sekali tidak lucu.

Go tidak menciptakan _chaos_; ia hanya berhenti memaafkannya. Tiga kebiasaan yang sebelumnya tidak bermasalah berubah menjadi pelanggaran:

1. Ada nilainya? Kirim **angka**. Tidak ada nilainya? Kirim **_string_ kosong**.[^2]
2. Halaman lain untuk fungsi serupa mengirim **_string_**, dari sananya.
3. Dan tidak ada dua halaman yang pernah duduk bareng menyepakati hal itu.

Tidak ada penjahat di sini. Setiap halaman konsisten dengan dirinya sendiri. _Chaos_-nya _emergent_: muncul dari kebebasan yang berlangsung bertahun-tahun, bukan karena ada yang sengaja membuatnya.

## Bekas Luka yang Terukur

Yang paling menarik, _chaos_ ini bukan cuma bisa diceritakan. Jumlahnya juga bisa dihitung.

Saat menyisir _repo_ baru, saya menemukan hampir dua ratus pemanggilan `String()` di berbagai halaman, ditambah lebih dari dua puluh `Number()`.[^1] Sebagian memang punya kegunaan sendiri. Sebagian lain adalah **bekas luka** dari era _chaos_: jaring pengaman agar nilai dengan tipe yang tidak pasti tetap bisa diproses.

Jaring pengaman itu bukan kesalahan; mereka membantu transisi tetap berjalan. Namun, jumlahnya juga menunjukkan masalah dengan cukup jujur. Kalau tipe data sudah bisa dipercaya, tidak akan ada begitu banyak titik yang harus menebak.

## Kontrak, Bukan Tebak-Tebakan

Solusi jangka panjangnya bukan menambah jaring pengaman ke-400. Pertanyaannya perlu diubah: bukan lagi _"nilai ini bentuknya apa hari ini?"_, melainkan _"kontraknya bilang apa?"_

Satu _field_ punya satu tipe yang dijanjikan, lalu semua halaman yang mengirimnya mengikuti kontrak itu. _String_ kosong yang mengaku angka bisa ditolak lebih awal, di tempat yang dapat menjelaskan masalahnya. Daftar kontrak yang sederhana dan tertulis itu mungkin bisa mengakhiri perdebatan yang selama ini dibiarkan _frontend_.

## Pelajaran

1. **Bahasa yang memaafkan bisa menyembunyikan utang tipe.** Masalahnya baru muncul ketika penerimanya berganti.
2. **_Chaos_ bisa muncul tanpa disengaja.** Tiap halaman benar menurut caranya sendiri; sistem secara keseluruhan yang bermasalah.
3. **Penerima yang _strict_ memaksa kita menulis kontrak yang semestinya sudah ada.**
4. **Normalisasi cukup di satu pintu.** Jaring pengaman yang tersebar bukan arsitektur; itu cicilan.

Hampir dua ratus pemanggilan konversi tadi tidak semuanya masalah, tetapi cukup banyak yang memberi petunjuk tentang ketidakpastian tipe. Episode berikutnya beralih ke warisan yang lebih mudah dilihat: dua _library_ UI dan dua era penamaan dalam satu aplikasi.

[^1]: Pola dan angka dihitung langsung dari _repo_ saat episode ini ditulis; tidak semua pemanggilan konversi adalah bekas luka, dan tidak semua bekas luka tercatat.

[^2]: Detail _endpoint_, nama _field_, dan bentuk _error_ disederhanakan; yang dipertahankan hanya bentuk masalahnya.
