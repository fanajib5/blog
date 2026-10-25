---
title: "Hijrah Backend (7): Dari Paket TCP ke _Time-Series Database_"
description: "Pengalaman saya memindahkan paket GPS lewat antrean sampai TimescaleDB, termasuk pesan yang dulu saya buang dan pilihan kecil yang nyaris membuang lebih banyak data."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:07+07:00
lastmod: 2026-09-11T09:00:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - infrastruktur
  - rabbitmq
  - timescaledb
series: "Hijrah Backend"
---

Setiap detik, armada mengirim kabar. Puluhan ribu _tracker_ GPS mengirim paket TCP berisi posisi, status mesin, dan kekuatan sinyal. Sistem harus menerima semuanya sepanjang hari, tanpa kampanye "ayo hemat kirim data" hahaha.

Di [episode pertama](/writing/2026/hijrah-backend-01/) saya sempat cerita bahwa sistem lama menerima paket dan menulisnya ke _database_ dalam layanan yang sama. Sekarang tugasnya dipisah: _listener_ menerima dan menerjemahkan paket, antrean menampungnya, lalu _consumer_ menulis ke _database_. Di episode ini saya ceritakan alurnya, termasuk kesalahan yang baru kelihatan setelah jalan hehe~

## Kenapa Ada Antrean di Tengah Jalan

Mungkin kamu bertanya, bukankah menambah satu _hop_ berarti menambah waktu?

Menerima paket dan menulis ke _database_ itu kecepatannya beda. _Tracker_ tetap mengirim meski _database_ sedang sibuk. Kalau penerimaan dan penulisan disatukan, _database_ yang lambat ikut memperlambat _listener_. Paket yang gagal masuk tinggal berharap _device_-nya mencoba lagi.

Antrean jadi tempat menitipkan paket sementara. _Listener_ bisa lanjut menerima, sementara _consumer_ mengambil data secepat _database_ sanggup menulis. _Buffer_ membantu saat ada lonjakan siang hari. Tapi komponen baru berarti ada cara baru untuk gagal juga. Saya baru sadar setelah ketemu masalahnya di produksi hahaha.

## Saat Broker Mati, Pesan Ikut Hilang

Sistem lama tidak punya urusan dengan antrean mati, karena ia langsung melakukan _insert_. Kalau _database_-nya ngambek, _device_ bisa mencoba lagi nanti. Sistem baru punya masalah sendiri. Solusi pertama saya? Kalau koneksi ke _broker_ putus, **pesannya dibuang**. Sampai sekarang saya masih heran kenapa dulu rasanya itu masuk akal.

Koneksi _broker_ putus tanpa peringatan, lalu data posisi kendaraan pelanggan ikut hilang begitu saja. Infrastrukturnya bersin, datanya yang tumbang.

Saya memperbaikinya bertahap. Koneksi yang cuma tersendat diberi _retry_ selama beberapa detik. Kalau _broker_ tetap mati, masalahnya harus kelihatan di log _error_, bukan diam-diam menunggu ada yang menemukan peringatan berminggu-minggu kemudian. Lalu saya pasang _backpressure_. Antrean menampung sekitar 8 ribu paket;[^2] kalau penuh, `Send()` ikut menunggu. _Listener_ melambat dan _tracker_ mencoba lagi lewat TCP. Jadi, **data tidak hilang, cuma telat datang**. Membuat sumber menunggu ternyata lebih murah daripada kehilangan paket hehe.

Komentar di kode producer sekarang mencatat alurnya: antrean penuh → `Send()` blok → _listener_ melambat → _device_ mencoba lagi. Dulu terlihat seperti _bug_, ternyata bisa jadi pengaman.

## Disiplin yang Salah Tempat

Di tahap berikutnya, _consumer_ menulis ribuan baris lokasi sekaligus (_bulk insert_). Saya pernah membuat kesalahan yang agak ironis: kalau satu baris gagal di dalam _loop_, fungsi langsung menjalankan `return err`. **Baris-baris lokasi setelahnya ikut dibuang.**

Sistem PHP lama malah memakai `continue` untuk kasus seperti ini. Versi Go saya yang katanya "lebih disiplin soal _error_" justru membuang lebih banyak data. Perbaikan pertamanya sederhana: ganti `return` dengan `continue`, lalu catat baris yang gagal di log. Saya lakukan hal yang sama di _sender_ lain, menaikkan _buffer_ konsumen sepuluh kali lipat, dan menambah _worker_. Angka-angkanya saya tulis di komentar _config_ supaya tidak jadi angka misterius hahaha.[^1]

Dari kejadian ini saya belajar bahwa pilihan `continue` atau `return` di _loop_ bukan soal gaya saja. Satu _error_ bisa menghentikan pemrosesan ribuan baris. Jadi saya berusaha memikirkan dampaknya dulu, bukan sekadar memilih yang kelihatan paling disiplin.

## Database yang Mengerti Waktu

Tahap terakhir menyimpan data lokasi, yang selalu terkait waktu dan tempat. Untuk itu saya memakai PostgreSQL dengan ekstensi _time-series_. Tabel lokasi menjadi _hypertable_ yang dipartisi otomatis berdasarkan waktu.

Ada dua hal yang tidak saya dapatkan di sistem lama. Pertama, **kompresi**: _chunk_ lama dikompresi otomatis. Kini lebih dari seratus _chunk_ disimpan dengan cara itu, dan _index_ tertentu bisa dibangun langsung di atas data terkompresi tanpa membongkarnya. Kedua, **retensi otomatis**: kebijakan mingguan membuang data yang melewati batas usia. Dulu, data lama dibersihkan secara manual, sambil berdoa. Sekarang _database_-nya yang mengurus jadwal hehe~

Sekarang kalau ada yang bertanya kapan data lama dibersihkan, saya tinggal menunjuk policy-nya hehe.

## Catatan Saya

Yang paling terasa dari perubahan ini bukan karena antrean atau _database_ baru terdengar keren. Saya harus memutuskan dulu apa yang dilakukan sistem saat ada bagian yang gagal, dan memastikan kegagalannya kelihatan. `continue` dan `return` juga sama-sama punya tempatnya. Salah pilih, banyak baris bisa ikut hilang.

Di sisi penyimpanan, _backpressure_ bikin sumber menunggu daripada membuang data, sementara kompresi dan retensi otomatis mengurangi pekerjaan beres-beres manual. Ternyata beberapa urusan yang dulu bikin saya berdoa sekarang tinggal jadi aturan _database_ hehe.

Berikutnya episode terakhir seri ini. Saya akan menengok perjalanan hampir dua tahun, hal yang akan saya ubah kalau mengulang, dan bagian yang paling saya syukuri.

Versi tutorial dari dua babak episode ini, dari _TCP listener_ sampai _time-series database_, ada di [GPS Backend Part 2](/writing/2026/tcp-listener-gps-go/) dan [Part 4](/writing/2026/gps-data-postgresql-timescaledb/).

[^1]: Potongan kode dan angka konfigurasi disederhanakan, bentuk aslinya lebih panjang dan membawa detail internal.

[^2]: Kapasitas infrastruktur (ukuran antrean, jumlah _worker_, retensi) ditampilkan sebagai orde besaran; yang penting untuk cerita adalah arah dan alasannya.
