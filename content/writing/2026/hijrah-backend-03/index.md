---
title: "Hijrah Backend (3): Mem-_port_ Puluhan Parser Protokol GPS Tanpa Menghentikan Armada"
description: "Ep 3 seri Hijrah Backend: sprint sebulan mem-port 21 versi parser biner GPS, mobil parkir yang terbaca 66 km/jam, band-aid yang bertahan kurang dari sehari, dan satu karakter yang menyelesaikan semuanya."
author: "Faiq Najib Al-Aziz"
date: 2026-09-11T01:30:00+07:00
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

Mari mulai dari laporan paling membingungkan yang pernah saya tangani: ada kendaraan yang sedang parkir, mesin mati, tapi sistem membaca kecepatannya **66 km/jam**. Satelitnya juga ramai, datanya masuk terus. Kalau Anda penasaran bagaimana akhirnya sebuah tanda baca yang salah bisa membuat mobil parkir ngebut, cerita ini untuk Anda hehe~

## Rewind: Januari 2025

Seperti yang dibahas di [episode pertama](/writing/2026/hijrah-backend-01/), mandat migrasi sudah menunggu sejak sebelum saya diterima kerja. Salah satu bagian terbesarnya jatuh ke tangan saya: protokol. Pintu masuk seluruh data armada.

Bentuknya begini: puluhan tipe _tracker_ GPS, tiap vendor punya bahasa binernya sendiri, dan sistem lama punya satu _parser_ untuk tiap bahasa itu. Tugas saya menulis ulang semuanya di Go, sambil armada terus berkirim data setiap detik. Tidak ada jendela "kita matikan dulu semalam ya".

Jadi jadwal harian saya Januari 2025: baca _parser_ PHP, tulis _parser_ Go, ulangi. Kantor bahkan membelikan langganan AI _premium_ era itu untuk mempercepat konversi.

Jejaknya masih tersimpan sampai sekarang: percakapan pertama dengan sang pemegang mandat tercatat tanggal 2 Januari, jam tiga sore, isinya lokasi folder proyek; dan kalimat kerja pertama saya di sana adalah permintaan konversi file CodeIgniter pertama ke Go. Hasil sprint-nya juga tercatat resmi di grup atasan: _listener_ selesai konversi sepuluh hari lebih cepat dari timeline. Satu-satunya hal di mandat itu yang datang lebih cepat dari jadwal hahaha. Setiap orang punya cara menghabiskan malam-malamnya; cara saya sedang menulis ulang dua puluh satu versi _parser_ hehe~

## Keberuntungan yang Sering Dilupakan

Sebelum cerita salah pahamnya, catat dulu keberuntungannya: untuk setiap _parser_ Go yang saya tulis, ada kode PHP aslinya yang bisa dibandingkan. _Porting_ jadi soal 1:1, bukan menebak dari spesifikasi protokol.

Metodenya sederhana tapi ketat: bandingkan offset pembacaan GPS, struktur pembacaan elemen IO (posisi mulai bacanya), dan jumlah cabang _case_-nya, file demi file. Dua puluh satu versi, satu per satu. Bukan sekali layan semua, bukan "kan polanya sama". Karena, seperti akan Anda lihat, pola yang "sama" itulah yang hampir menggagalkan saya hahaha.

## Mobil Parkir yang Ngebut

Gejala muncul belakangan, di satu keluarga _parser_: _tracker_ dengan _codec_ tertentu terbaca 66 km/jam saat sebenarnya diam. Satu _field_: kecepatan.

Teori pertama saya terdengar sangat masuk akal. Di _parser_ itu ada cabang yang menimpa kecepatan hasil pembacaan blok GPS dengan nilai elemen IO bernomor 24. "Nah, IO-24-nya yang salah timpa! Buang saja timpaannya." Maka saya buang, di sembilan _parser_ sekaligus, karena "kan polanya sama".

_Patch_ itu bertahan kurang dari sehari. Setelah dicek ulang: cabang timpaan itu justru benar, versi PHP juga punya, dan membuangnya malah merusak kasus lain. _Revert_ di hari yang sama juga hahaha. Tercatat di riwayat _commit_ dengan anggun: _fix_ jam begitu, _revert_ jam segini.

## Detektif Data: Device atau Parser?

Sebelum menuduh lagi, saya pelajari dulu cara membedakan dua tersangka yang sering tertukar: _tracker_-nya yang rusak, atau _parser_-nya yang salah.

Heuristiknya ternyata sederhana dan bisa diandalkan:

- **Waktu GPS beku**, identik di antara paket-paket yang jam kirimannya berbeda? Itu _device_-nya. _Parser_ itu deterministik; dia tidak mampu membekukan waktu.
- **Offset lokasi acak**, kadang maju kadang mundur tanpa pola? Itu _drift_ GPS si _device_.
- **Offset konsisten dan persis**? Baru layak curigai _parser_-nya.

Lalu bandingkan paket yang sama di sistem lama dan sistem baru: waktu sama, koordinat sama, jumlah satelit sama. Bedanya satu: kecepatan. Sistem lama membaca 9, sistem saya membaca 66. Bukan _device_. Parser saya. Terbukti di kertas, bukan cukup di mulut hehe.

## Satu Karakter yang Menggerakkan Mobil

Akar masalahnya akhirnya ketemu, dan ini bagian favorit saya: di kode PHP asli tertulis `startPosition =+ startRecord`.[^1] Ya, `=+`. Di PHP itu dibaca sebagai _assignment_ biasa dengan tanda plus unary di depan angka. Tangan saya yang sudah mulai terbiasa Go menuliskannya kembali sebagai `+=`, yang artinya tambah-terus-assign.

Beda **satu karakter**. Akibatnya: posisi mulai pembacaan elemen IO bergeser beberapa _byte_, sehingga _parser_ "menemukan" elemen IO yang sebenarnya bukan di posisi itu, termasuk IO-24 yang membawa angka 66. Mobil-mobil yang parkir pun ikut lari tanpa izin mereka hahaha.

Perbaikannya: satu karakter, di dua file. _Commit_-nya berdua hari itu juga, bersama jenasah _band-aid_-nya. Seminggu-squared perjuangan forensic, titiknya ditutup oleh perbedaan antara `=` dan `+=` hehe.

## Cuci Besi: Mengembalikan 514.380 Baris

Kode sudah benar belum cukup. Data yang sempat salah juga harus pulang.

Untuk rentang dua minggu yang terkontaminasi, saya tarik arsip dari sistem lama, cocokkan per paket, dan perbaiki 514.380 baris lokasi di sistem baru.[^2] Pencocokannya 100%: tidak ada satu baris pun yang gagal dipulangkan. Dan _glitch_ lamanya terverifikasi hilang, di _timestamp_ yang sama, 66 berubah menjadi 9.

Bagian ini tidak glamor dan tidak ada di _tutorial_ mana pun: migrasi bukan cuma soal kode baru yang benar, tapi juga soal membersihkan jejak kode lama yang sempat keliru. Data tidak boleh meninggalkan masa lalu dalam keadaan salah.

## Jujur Soal Kata "Selesai"

Sprint ini bagian dari periode tiga bulan yang menagih bayarannya ke kesehatan mental saya. Itu fakta, dan saya tulis apa adanya.

Dan soal kata "selesai": waktu itu saya umumkan selesai dengan percaya diri setengah hati, karena verifikasi paritasnya belum 100%. Benar saja, sampai episode ini ditulis pun, sesekali masih ada perbaikan _parser_ yang masuk. Sekarang saya lebih tenang memaknainya: "selesai" itu spektrum, bukan tombol. Yang penting bukan klaimnya; yang penting tiap laporan baru diperlakukan sebagai data, bukan sebagai penghinaan hahaha.

## Pelajaran

1. **_Porting_ kode biner itu beda satu _byte_ = beda dunia.** Bandingkan file demi file, jangan menggeneralisasi pola antar file yang "kelihatan sama".
2. **Pahami dulu, _patch_ kemudian.** _Band-aid_ yang dibuang di sembilan file sekaligus harus saya _revert_ di hari yang sama. Mahalnya bukan di jamnya, tapi di kepercayaan dirinya.
3. **Konsistensi pola adalah detektor.** Beku = _device_, acak = _drift_, konsisten-persis = curigai _parser_.
4. **"Selesai" itu hipotesis sampai diverifikasi.** Dan itu normal; yang tidak normal adalah berhenti memverifikasi.
5. **Migrasi mencakup data lama.** Kode baru yang benar wajib diikuti pembersihan jejak salah yang sempat tertinggal.

Episode berikutnya kita bedah filosofi yang menopang semua episode sebelumnya: kenapa "yang benar adalah yang lama", dan apa yang terjadi ketika "perbaikan" harus saya hapus sendiri. Sampai ketemu di sana.

Sekian. Salam.

[^1]: Potongan kode disederhanakan; nama protokol dan _field_ IO dipertahankan secukupnya untuk bercerita.

[^2]: Angka baris dan jumlah _device_ ditampilkan apa adanya karena saat itu benar-benar terukur; skala infrastruktur lain tetap tidak disebut demi anonimitas.
