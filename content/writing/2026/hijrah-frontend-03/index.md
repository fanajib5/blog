---
title: "Hijrah Frontend (3): Type Chaos, Angka, String Kosong, dan Halaman yang Berbeda Pendapat"
description: "Episode 3 Hijrah Frontend: field yang sama terkirim sebagai angka, string kosong, atau string biasa. PHP dulu memaafkan, Go tidak, dan saya menemukan 194 bekas konversinya."
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

Tiga halaman mengirim _field_ yang sama dengan cara berbeda. Ada yang mengirim angka, ada yang mengirim _string_ kosong kalau nilainya tidak ada, ada juga yang membungkus angka jadi _string_. Kebiasaan ini bertahan bertahun-tahun, sampai penerimanya berubah jadi sistem yang tidak mau menebak.

Begitulah _type chaos_ muncul. Tidak ada yang sengaja bikin, tapi bekasnya masih bisa dihitung di _repo_ kami.

## Dulu, PHP Memaklumi

Dulu penerimanya adalah PHP, bahasa yang sangat pemaaf soal tipe data. Kirim `"123"`, dibaca sebagai 123. Kirim `""`, dianggap kosong. Kirim `null`, seolah tidak terlihat. Selama bertahun-tahun, halaman-halaman itu tidak perlu memikirkan tipe karena bahasanya tidak mempermasalahkannya.

Tiap halaman mengirim dengan gayanya sendiri, _backend_ menerima saja, dan hidup terasa sederhana. Baru belakangan saya sadar, tenang-tenang saja bukan berarti sistemnya sehat. Penerimanya saja yang tidak pernah protes.

## Lalu Go Datang

Lalu _backend_-nya pindah ke Go. Pandangannya soal tipe berbeda: **tipe adalah kontrak**. Kalau kontraknya meminta angka, yang dikirim harus angka. _String_ kosong yang mengaku angka ditolak di pintu, lengkap dengan _error decoding_ yang panjang dan sama sekali tidak lucu.

Go tidak menciptakan _chaos_; ia hanya berhenti memaafkannya. Tiga kebiasaan yang sebelumnya tidak bermasalah berubah menjadi pelanggaran:

1. Ada nilainya? Kirim **angka**. Tidak ada nilainya? Kirim **_string_ kosong**.[^2]
2. Halaman lain untuk fungsi serupa mengirim **_string_**, dari sananya.
3. Dan tidak ada dua halaman yang pernah duduk bareng menyepakati hal itu.

Tidak ada penjahatnya. Setiap halaman konsisten dengan caranya sendiri. _Chaos_ ini muncul pelan-pelan selama bertahun-tahun, bukan karena ada yang sengaja membuatnya.

## Bekasnya Ternyata Bisa Dihitung

Yang paling menarik, _chaos_ ini bukan cuma bisa diceritakan. Jumlahnya juga bisa dihitung.

Saat menyisir _repo_ baru, saya menemukan hampir dua ratus pemanggilan `String()` di berbagai halaman, ditambah lebih dari dua puluh `Number()`.[^1] Sebagian memang punya kegunaan sendiri. Sebagian lain adalah **bekas luka** dari era _chaos_: jaring pengaman agar nilai dengan tipe yang tidak pasti tetap bisa diproses.

Jaring pengaman itu bukan kesalahan. Mereka membantu transisi tetap berjalan. Tapi jumlahnya juga jadi petunjuk: kalau tipe data bisa dipercaya, mestinya tidak ada begitu banyak tempat yang harus menebak.

## Biar Kontraknya Jelas

Solusi jangka panjangnya bukan menambah jaring pengaman ke-400. Pertanyaannya perlu diubah: bukan lagi _"nilai ini bentuknya apa hari ini?"_, melainkan _"kontraknya bilang apa?"_

Satu _field_ punya satu tipe yang dijanjikan, lalu semua halaman yang mengirimnya mengikuti kontrak itu. _String_ kosong yang mengaku angka bisa ditolak lebih awal, di tempat yang dapat menjelaskan masalahnya. Daftar kontrak yang sederhana dan tertulis itu mungkin bisa mengakhiri perdebatan yang selama ini dibiarkan _frontend_.

## Yang Saya Catat

Saya jadi ingat: bahasa yang memaklumi tipe bisa menyembunyikan utang sampai penerimanya berubah. Tiap halaman mungkin terasa benar sendiri, tapi sistem keseluruhannya belum tentu rapi. Menurut saya, kontraknya perlu ditulis jelas dan normalisasi dilakukan di satu pintu. Jaring pengaman yang tersebar itu membantu, tapi bukan tujuan akhir.

Hampir dua ratus pemanggilan konversi tadi tidak semuanya masalah. Tapi cukup banyak yang memberi petunjuk bahwa tipe datanya belum bisa dipercaya. Di episode berikutnya, saya bahas warisan yang lebih kelihatan: dua _library_ UI dan dua era penamaan dalam satu aplikasi.

[^1]: Pola dan angka dihitung langsung dari _repo_ saat episode ini ditulis; tidak semua pemanggilan konversi adalah bekas luka, dan tidak semua bekas luka tercatat.

[^2]: Detail _endpoint_, nama _field_, dan bentuk _error_ disederhanakan; yang dipertahankan hanya bentuk masalahnya.
