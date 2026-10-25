---
title: "Hijrah Backend (3): Mem-_port_ Puluhan Parser Protokol GPS Tanpa Menghentikan Armada"
description: "Ep 3 seri Hijrah Backend: sprint sebulan mem-port 21 versi parser biner GPS, mobil parkir yang terbaca 66 km/jam, band-aid yang bertahan kurang dari sehari, dan satu karakter yang menyelesaikan semuanya."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:03+07:00
lastmod: 2026-09-11T01:00:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - parser
  - gps
  - cerita
series: "Hijrah Backend"
---

Ada kendaraan yang sedang parkir, mesin mati, tetapi sistem membaca kecepatannya **66 km/jam**. Satelitnya ramai dan datanya terus masuk. Belakangan, saya menemukan bahwa satu karakter di kode parser cukup untuk menjelaskan kecepatan itu.

## Rewind: Januari 2025

Seperti diceritakan di [episode pertama](/writing/2026/hijrah-backend-01/), mandat migrasi sudah menunggu sebelum saya diterima kerja. Salah satu pekerjaan terbesarnya adalah menulis ulang parser protokol, pintu masuk bagi seluruh data armada.

Bentuknya begini: puluhan tipe _tracker_ GPS, tiap vendor punya bahasa binernya sendiri, dan sistem lama punya satu _parser_ untuk tiap bahasa itu. Tugas saya menulis ulang semuanya di Go, sambil armada terus berkirim data setiap detik. Tidak ada jendela "kita matikan dulu semalam ya".

Rutinitas saya sepanjang Januari 2025 sederhana: baca _parser_ PHP, tulis _parser_ Go, ulangi. Kantor bahkan membelikan langganan AI _premium_ yang tersedia saat itu untuk mempercepat konversi.

Jejaknya masih ada: percakapan pertama dengan pemegang mandat tercatat pada 2 Januari pukul tiga sore, dan isinya lokasi folder proyek. Kalimat kerja pertama saya di sana adalah permintaan untuk mengonversi file CodeIgniter pertama ke Go. Hasil sprint juga tercatat di grup atasan: konversi _listener_ selesai sepuluh hari lebih cepat dari jadwal. Sepertinya itu satu-satunya bagian dari mandat yang selesai lebih awal. Malam-malam saya saat itu diisi dengan menulis ulang 21 versi _parser_.

## Keberuntungan yang Sering Dilupakan

Ada satu keuntungan penting: untuk setiap _parser_ Go, tersedia kode PHP asli sebagai pembanding. Jadi _porting_-nya bisa dilakukan 1:1, bukan dengan menebak dari spesifikasi protokol.

Metodenya sederhana, tetapi harus teliti: bandingkan offset pembacaan GPS, struktur pembacaan elemen IO (posisi mulai baca), dan jumlah cabang _case_, file demi file. Saya memeriksa 21 versi satu per satu, bukan sekaligus atau dengan asumsi "kan polanya sama". Asumsi itu hampir membuat saya salah memperbaiki masalah.

## Mobil Parkir yang Ngebut

Gejala muncul belakangan, di satu keluarga _parser_: _tracker_ dengan _codec_ tertentu terbaca 66 km/jam saat sebenarnya diam. Satu _field_: kecepatan.

Teori pertama saya terdengar sangat masuk akal. Di _parser_ itu ada cabang yang menimpa kecepatan hasil pembacaan blok GPS dengan nilai elemen IO bernomor 24. "Nah, IO-24-nya yang salah timpa! Buang saja timpaannya." Maka saya buang, di sembilan _parser_ sekaligus, karena "kan polanya sama".

_Patch_ itu bertahan kurang dari sehari. Setelah diperiksa ulang, cabang tersebut ternyata benar dan versi PHP juga memilikinya. Menghapusnya justru merusak kasus lain, jadi _patch_ itu saya _revert_ pada hari yang sama. Riwayat _commit_-nya mencatat _fix_ dan _revert_ pada hari itu juga.

## Detektif Data: Device atau Parser?

Sebelum menebak lagi, saya pelajari cara membedakan dua kemungkinan yang mudah tertukar: _tracker_ yang bermasalah atau _parser_ yang salah.

Heuristiknya ternyata sederhana dan bisa diandalkan:

- **Waktu GPS beku**, identik di antara paket-paket yang jam kirimannya berbeda? Itu _device_-nya. _Parser_ itu deterministik; dia tidak mampu membekukan waktu.
- **Offset lokasi acak**, kadang maju kadang mundur tanpa pola? Itu _drift_ GPS si _device_.
- **Offset konsisten dan persis**? Baru layak curigai _parser_-nya.

Lalu bandingkan paket yang sama di sistem lama dan sistem baru: waktu sama, koordinat sama, jumlah satelit sama. Bedanya satu: kecepatan. Sistem lama membaca 9, sistem saya membaca 66. Bukan _device_. Parser saya. Terbukti di kertas, bukan cukup di mulut hehe.

## Satu Karakter yang Menggerakkan Mobil

Akar masalahnya ada di kode PHP asli: `startPosition =+ startRecord`.[^1] Di PHP, `=+` adalah _assignment_ biasa dengan tanda plus unary di depan angka. Saya yang mulai terbiasa menulis Go tanpa sadar mengubahnya menjadi `+=`, yang artinya tambah lalu _assign_.

Beda **satu karakter**. Akibatnya, posisi mulai pembacaan elemen IO bergeser beberapa _byte_. _Parser_ lalu "menemukan" elemen IO di posisi yang keliru, termasuk IO-24 yang membawa angka 66. Mobil-mobil yang parkir pun seolah ikut melaju tanpa izin pemiliknya.

Perbaikannya hanya satu karakter di dua file. Hari itu juga saya membuat _commit_ untuk perbaikan dan _revert_ _band-aid_-nya. Pada akhirnya, seluruh penelusuran ini mengerucut pada beda antara `=` dan `+=`.

## Cuci Besi: Mengembalikan 514.380 Baris

Kode sudah benar belum cukup. Data yang sempat salah juga harus pulang.

Untuk rentang dua minggu yang terkontaminasi, saya tarik arsip dari sistem lama, cocokkan per paket, dan perbaiki 514.380 baris lokasi di sistem baru.[^2] Pencocokannya 100%: tidak ada satu baris pun yang gagal dipulangkan. Dan _glitch_ lamanya terverifikasi hilang, di _timestamp_ yang sama, 66 berubah menjadi 9.

Bagian ini tidak glamor dan jarang masuk _tutorial_: migrasi bukan cuma memastikan kode baru benar, tetapi juga membersihkan data yang telanjur salah. Data lama tidak bisa dibiarkan begitu saja.

## Jujur Soal Kata "Selesai"

Sprint ini bagian dari periode tiga bulan yang berdampak pada kesehatan mental saya. Saya menuliskannya apa adanya.

Waktu itu saya mengumumkan pekerjaan selesai dengan keyakinan yang belum penuh karena verifikasi paritas belum 100%. Ternyata, sampai episode ini ditulis, sesekali masih ada perbaikan _parser_. Sekarang saya memandang "selesai" sebagai spektrum, bukan tombol. Setiap laporan baru saya perlakukan sebagai data yang perlu diperiksa.

## Pelajaran

1. **_Porting_ kode biner itu beda satu _byte_ = beda dunia.** Bandingkan file demi file, jangan menggeneralisasi pola antar file yang "kelihatan sama".
2. **Pahami dulu, _patch_ kemudian.** _Band-aid_ yang dibuang di sembilan file sekaligus harus saya _revert_ di hari yang sama. Mahalnya bukan di jamnya, tapi di kepercayaan dirinya.
3. **Konsistensi pola adalah detektor.** Beku = _device_, acak = _drift_, konsisten-persis = curigai _parser_.
4. **"Selesai" itu hipotesis sampai diverifikasi.** Dan itu normal; yang tidak normal adalah berhenti memverifikasi.
5. **Migrasi mencakup data lama.** Kode baru yang benar wajib diikuti pembersihan jejak salah yang sempat tertinggal.

Episode keempat berangkat dari pertanyaan yang muncul di sini: kapan kode lama harus dianggap sebagai acuan, dan apa yang terjadi ketika "perbaikan" justru harus saya hapus sendiri?

Untuk tutorial menulis _decoder_ GT06 dari nol, termasuk tabel _byte_ demi _byte_ dengan CRC yang diuji, ada di [GPS Backend Part 3](/writing/2026/decode-packet-gt06-teltonika/).

[^1]: Potongan kode disederhanakan; nama protokol dan _field_ IO dipertahankan secukupnya untuk bercerita.

[^2]: Angka baris dan jumlah _device_ ditampilkan apa adanya karena saat itu benar-benar terukur; skala infrastruktur lain tetap tidak disebut demi anonimitas.
