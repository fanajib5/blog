---
title: "Hijrah Backend (3): Mem-_port_ Puluhan Parser Protokol GPS Tanpa Menghentikan Armada"
description: "Ep 3 seri Hijrah Backend: sebulan mem-port 21 versi parser biner GPS, mobil parkir yang terbaca 66 km/jam, band-aid yang umurnya kurang dari sehari, dan satu karakter biang keroknya."
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

Ada kendaraan yang sedang parkir, mesin mati, tapi sistem membaca kecepatannya **66 km/jam**. Satelitnya ramai dan datanya terus masuk. Setelah lumayan lama pusing, ternyata penyebabnya cuma satu karakter di kode parser. Satu. Karakter. Hahaha.

## Rewind: Januari 2025

Seperti saya ceritakan di [episode pertama](/writing/2026/hijrah-backend-01/), mandat migrasi sudah menunggu sebelum saya diterima kerja. Salah satu tugas terbesarnya adalah menulis ulang parser protokol, pintu masuk bagi seluruh data armada.

Gambarannya begini: ada puluhan tipe _tracker_ GPS, tiap vendor punya bahasa binernya sendiri, dan sistem lama punya satu _parser_ untuk tiap bahasa itu. Tugas saya menulis ulang semuanya di Go, sementara armada terus kirim data tiap detik. Tidak ada jendela "kita matikan dulu semalam ya".

Rutinitas saya sepanjang Januari 2025 sederhana: baca _parser_ PHP, tulis _parser_ Go, ulangi. Kantor bahkan membelikan langganan AI _premium_ yang tersedia waktu itu supaya konversinya lebih cepat.

Jejaknya masih ada. Percakapan pertama saya dengan pemegang mandat tercatat 2 Januari jam tiga sore, isinya lokasi folder proyek. Pesan kerja pertama saya di sana meminta konversi file CodeIgniter pertama ke Go. Hasil sprint juga tercatat di grup atasan: konversi _listener_ selesai sepuluh hari lebih cepat dari jadwal. Kayaknya itu satu-satunya bagian mandat yang selesai lebih awal, hehe. Malam-malam saya waktu itu habis untuk menulis ulang 21 versi _parser_.

## Keberuntungan yang Sering Dilupakan

Ada satu keuntungan besar: untuk setiap _parser_ Go, kode PHP aslinya ada sebagai pembanding. Jadi _porting_-nya bisa 1:1, tidak perlu menebak dari spesifikasi protokol.

Caranya sederhana tapi harus telaten: bandingkan offset pembacaan GPS, struktur pembacaan elemen IO (posisi mulai baca), dan jumlah cabang _case_, file demi file. Saya periksa 21 versi satu per satu, tidak sekaligus dan tidak pakai asumsi "ah polanya pasti sama". Asumsi itu hampir membuat saya salah memperbaiki masalah.

## Mobil Parkir yang Ngebut

Gejalanya muncul belakangan, di satu keluarga _parser_: _tracker_ dengan _codec_ tertentu terbaca 66 km/jam padahal diam. Cuma satu _field_ yang aneh: kecepatan.

Teori pertama saya terdengar masuk akal banget. Di _parser_ itu ada cabang yang menimpa kecepatan hasil pembacaan blok GPS dengan nilai elemen IO nomor 24. "Nah, IO-24-nya salah timpa! Buang saja timpaannya." Maka saya buang, di sembilan _parser_ sekaligus, karena "kan polanya sama". (Iya, itu asumsi yang sama tadi. Saya tidak belajar secepat itu.)

_Patch_ itu cuma bertahan kurang dari sehari. Setelah dicek ulang, cabang tersebut ternyata benar dan versi PHP-nya juga punya. Menghapusnya malah merusak kasus lain, jadi saya _revert_ di hari yang sama. Riwayat _commit_-nya mencatat _fix_ dan _revert_ di hari yang sama.

## Detektif Data: Device atau Parser?

Sebelum menebak lagi, saya belajar dulu cara membedakan dua kemungkinan yang gampang tertukar: _tracker_-nya yang bermasalah, atau _parser_-nya yang salah.

Heuristiknya ternyata sederhana dan bisa diandalkan:

- **Waktu GPS beku**, identik di antara paket yang jam kirimnya berbeda? Itu _device_-nya. _Parser_ itu deterministik, tidak mampu membekukan waktu.
- **Offset lokasi acak**, kadang maju kadang mundur tanpa pola? Itu _drift_ GPS si _device_.
- **Offset konsisten dan persis**? Baru pantas mencurigai _parser_-nya.

Lalu saya bandingkan paket yang sama di sistem lama dan baru: waktu sama, koordinat sama, jumlah satelit sama. Bedanya cuma satu: kecepatan. Sistem lama membaca 9, sistem saya 66. Bukan _device_, tapi parser saya. Terbukti di atas kertas, bukan cuma modal omong hehe.

## Satu Karakter yang Menggerakkan Mobil

Biang keroknya ada di kode PHP asli: `startPosition =+ startRecord`.[^1] Di PHP, `=+` itu _assignment_ biasa dengan tanda plus unary di depan angka. Saya yang sudah mulai terbiasa menulis Go tanpa sadar mengubahnya jadi `+=`, artinya tambah lalu _assign_.

Beda **satu karakter**. Akibatnya posisi mulai pembacaan elemen IO bergeser beberapa _byte_. _Parser_ lalu "menemukan" elemen IO di posisi yang keliru, termasuk IO-24 yang membawa angka 66. Mobil-mobil yang parkir pun seolah melaju tanpa izin pemiliknya.

Perbaikannya cuma satu karakter di dua file. Hari itu juga saya _commit_ perbaikannya dan me-_revert_ _band-aid_ tadi. Jadi ujung-ujungnya, penelusuran panjang ini berakhir di beda antara `=` dan `+=`. Lucu, sekaligus bikin pengin menjedotkan kepala ke meja.

## Cuci Besi: Mengembalikan 514.380 Baris

Kode benar saja belum cukup. Data yang sempat salah juga harus dibereskan.

Untuk rentang dua minggu yang terkontaminasi, saya tarik arsip dari sistem lama, cocokkan per paket, dan perbaiki 514.380 baris lokasi di sistem baru.[^2] Pencocokannya 100%: tidak ada satu baris pun yang gagal dipulangkan. Glitch lamanya juga terverifikasi hilang, di _timestamp_ yang sama, 66 berubah jadi 9.

Bagian ini tidak glamor dan jarang masuk _tutorial_, tapi migrasi bukan cuma memastikan kode baru benar. Data yang telanjur salah juga harus dibersihkan, tidak bisa dibiarkan begitu saja.

## Jujur Soal Kata "Selesai"

Sprint ini bagian dari periode tiga bulan yang lumayan berdampak ke kesehatan mental saya. Saya tulis apa adanya saja.

Waktu itu saya mengumumkan pekerjaan selesai dengan keyakinan yang belum penuh, karena verifikasi paritas belum 100%. Dan benar saja, sampai episode ini ditulis, sesekali masih ada perbaikan _parser_. Sekarang saya menganggap "selesai" itu spektrum, bukan tombol. Setiap laporan baru saya perlakukan sebagai data yang perlu diperiksa.

## Catatan yang Saya Bawa Pulang

1. **_Porting_ kode biner itu, beda satu _byte_ = beda dunia.** Bandingkan file demi file, jangan menyamaratakan pola antar file yang "kelihatannya sama".
2. **Paham dulu, baru _patch_.** _Band-aid_ yang saya buang di sembilan file sekaligus harus saya _revert_ di hari yang sama. Mahalnya bukan di jamnya, tapi di percaya dirinya.
3. **Pola yang konsisten itu detektor.** Beku = _device_, acak = _drift_, konsisten-persis = curigai _parser_.
4. **"Selesai" itu hipotesis sampai diverifikasi.** Itu normal. Yang tidak normal adalah berhenti memverifikasi.
5. **Migrasi mencakup data lama.** Kode baru yang benar harus diikuti pembersihan jejak salah yang tertinggal.

Episode keempat berangkat dari pertanyaan yang muncul di sini: kapan kode lama dianggap sebagai acuan, dan apa jadinya kalau "perbaikan" malah harus saya hapus sendiri?

Untuk tutorial menulis _decoder_ GT06 dari nol, termasuk tabel _byte_ demi _byte_ dengan CRC yang diuji, ada di [GPS Backend Part 3](/writing/2026/decode-packet-gt06-teltonika/).

[^1]: Potongan kode disederhanakan; nama protokol dan _field_ IO dipertahankan secukupnya untuk bercerita.

[^2]: Angka baris dan jumlah _device_ ditampilkan apa adanya karena saat itu benar-benar terukur; skala infrastruktur lain tetap tidak disebut demi anonimitas.
