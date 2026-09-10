---
title: "Hijrah Backend (7): Dari Paket TCP ke _Time-Series Database_"
description: "Ep 7 seri Hijrah Backend: bagaimana paket-paket TCP dari ribuan tracker GPS menjadi baris data rapi, kenapa ada antrean, producer yang dulu membuang segalanya, dan database yang mengerti waktu."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:00+07:00
lastmod: 2026-09-11T00:30:00+07:00
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

Setiap detik, armada bicara. Puluhan ribu _tracker_ GPS mengirim paket TCP berisi posisi, status mesin, tinggi sinyal, dan sistem wajib menelan semuanya, sepanjang hari, tanpa kampanye "ayo hemat kirim data" hahaha.

Di [episode pertama](/writing/2026/hijrah-backend-01/) saya singgung: sistem lama menerima dan menulis dalam satu layanan yang sama. Sistem baru membelahnya menjadi tiga panggung: _listener_ yang hanya menerima dan menerjemahkan paket; antrean pesan di tengah; dan _consumer_ yang menulis ke _database_. Episode ini cerita tiap panggungnya, termasuk dua kali saya tersandung di antaranya hehe~

## Kenapa Ada Antrean di Tengah Jalan

Pertanyaan yang wajar: bukannya tambah hop berarti tambah lambat?

Logikanya begini: kecepatan menerima paket dan kecepatan menulis ke _database_ itu dua kecepatan yang berbeda. Armada tidak peduli _database_ sedang sibuk, tracker tetap kirim. Kalau penerimaan dan penulisan diikat satu sama lain, _database_ yang lambat membuat penerimaan ikut lambat, dan data yang gagal masuk cuma bisa berharap _device_-nya baik hati mengirim ulang.

Antrean memisahkan dua kecepatan itu. _Listener_ menerima secepat armada bicara dan menitipkan paket ke antrean; _consumer_ menarik dari antrean secepat _database_ sanggup. Lonjakan siang hari diserap _buffer_. Tapi, dan ini pelajaran besar episode ini, setiap komponen baru membawa cara gagal yang baru. Dan saya menemukannya dengan cara yang benar-benar klasik: langsung di produksi hahaha.

## Ketika Broker Tidur: Producer yang Membuang Segalanya

Skenario yang tidak pernah ada di sistem lama: bagaimana kalau antreannya mati? Sistem lama tidak punya mode gagal ini, dia insert langsung; kalau _database_-nya ngambek, ya _device_ yang coba lagi nanti. Sistem baru saya punya jawaban pertama yang sekarang saya sesali: kalau koneksi ke broker putus... **pesan dibuang**.

Bungkam, efisien, dan mengerikan. Data posisi kendaraan pelanggan dibuang diam-diam karena infrastruktur sedang bersin.

Perbaikannya berlapis. Pertama: jangan menyerah cepat, _retry_ bertingkat beberapa detik, sehingga _broker_ yang sekadar tersendat tak menjatuhkan satu paket pun. Kedua: kalau benar-benar mati lebih lama, jangan buang diam-diam, **buing keras-keras**: log _error_ yang jelas, bukan peringatan yang bisa ditemukan tiga minggu kemudian. Ketiga, dan favorit saya: _backpressure_ yang jujur. Antrean saya berkapasitas ±8 ribu paket;[^2] kalau penuh, `Send()` ikut menunggu, _listener_ otomatis melambat, dan _tracker_ di ujung sana akan _retry_ TCP. Hasil akhirnya filosofis: **data tidak hilang, dia hanya datang terlambat.** Sumber yang menunggu itu bukan kegagalan; dia mekanisme penyimpan termurah yang pernah ada hehe.

Komentar di kode producer saya sampai mendokumentasikan rantai ini dengan bangga: antrean penuh → `Send()` blok → _listener_ melambat → _device retry_. Rantai yang tadinya terlihat seperti _bug_ ternyata dirancang sebagai pengaman.

## Disiplin yang Salah Tempat

Panggung kedua: _consumer_ yang menulis ribuan baris lokasi sekaligus (_bulk insert_). Di sini saya pernah memasang kesalahan yang ironis: dalam _loop_ penulisan massal, kalau satu baris gagal, fungsi langsung `return err`, dan **seluruh sisa lokasi dalam gundukan itu ikut dibuang**.

Yang membuatnya lucu: sistem PHP lama justru `continue` di kasus ini. Versi Go saya yang "lebih disiplin soal _error_" ternyata lebih boros data daripada versi yang saya anggap santai. Perbaikan pertamanya sembilan huruf: `return` menjadi `continue`, plus log supaya baris yang gagal tetap kelihatan. Lalu diteruskan ke semua _sender_ lain, dan ditutup penyetelan: _buffer_ konsumen dinaikkan sepuluh kali lipat dengan _worker_ yang ikut ditambah, semuanya tercatat di komentar _config_ sebagai keputusan, bukan angka misterius hahaha.[^1]

Pelajarannya menempel sampai sekarang: **perhatian pada _error_ itu bagus; menyerah total karena satu _error_ bukan disiplin, itu drama.** Di _pipeline_ data, keputusan antara `continue` dan `return` itu keputusan hidup-mati data, dan dia layak dipikirkan serius setiap kali muncul.

## Database yang Mengerti Waktu

Panggung terakhir: data lokasi itu data waktu, nilainya di tautan (kapan, di mana), dan barisnya lahir tanpa henti. Untuk ini saya pakai PostgreSQL dengan ekstensi _time-series_: tabel lokasi jadi _hypertable_ yang terpartisi otomatis per waktu.

Dua kemewahan yang tidak saya dapat di sistem lama. Pertama, **kompresi**: _chunk_-chunk data yang sudah tua dikompresi otomatis, lebih dari seratus _chunk_ sekarang hidup hemat, dan _index_ tertentu dibangun langsung di atas bentuk terkompresi tanpa perlu membongkarnya. Kedua, **retensi yang jalan sendiri**: kebijakan mingguan membuang data lebih tua dari batas yang ditentukan. Sistem lama merapikan data lama secara manual, kala itu, dengan berdoa. Sekarang _database_-nya yang punya kalender hehe~

Kombinasi keduanya mengubah pertanyaan "kapan kita beres-beres data?" dari _kenaifan_ menjadi _konfigurasi_.

## Pelajaran

1. **Setiap komponen baru punya cara gagal baru.** Menambah antrean berarti harus menjawab sejak awal: kalau broker mati, apa yang terjadi pada data?
2. **Gagal boleh, gagal diam-diam jangan.** _Retry_, lalu _error_ yang nyaring. _Warning_ yang sabar menunggu dibaca itu lobang.
3. **`continue` vs `return` di _loop_ massal adalah keputusan hidup-mati data.** Satu kata mengubah "satu baris gagal" menjadi "seribu baris dibuang".
4. **_Backpressure_ itu fitur.** Saat kapasitas habis, membiarkan sumber menunggu adalah penyimpanan termurah yang ada.
5. **Retensi otomatis menggantikan ritual.** Apa yang dulu rutin manual dan penuh doa, kini cuma kebijakan yang jalan sendiri.

Episode berikutnya episode terakhir berseri ini: refleksi hampir dua tahun, yang akan saya kerjakan beda kalau mengulang, dan bagian yang paling saya syukuri. Sampai ketemu di penutup.

Sekian. Salam.

[^1]: Potongan kode dan angka konfigurasi disederhanakan, bentuk aslinya lebih panjang dan membawa detail internal.

[^2]: Kapasitas infrastruktur (ukuran antrean, jumlah _worker_, retensi) ditampilkan sebagai orde besaran; yang penting untuk cerita adalah arah dan alasannya.
