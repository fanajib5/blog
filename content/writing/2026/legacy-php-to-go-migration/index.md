---
title: "Migrasi Legacy PHP ke Go: Kenapa, Bagaimana, dan Pelajarannya"
description: "Catatan pengalaman mengkonversi sistem backend dari PHP (CodeIgniter 3 & Laravel) ke Go — 370+ endpoint, 33 entity, dan 194K baris kode yang berhasil dimigrasi bertahap."
author: "Faiq Najib"
date: 2026-04-15
lastmod: 2026-04-15
draft: false
toc: true
comments: false
tags:
  - go
  - php
  - arsitektur
  - migration
---

Saya pernah berada di posisi di mana _codebase_ PHP sudah _kepenuhan_ — fitur baru makin susah ditambah, _bug_ makin sering muncul, dan setiap deploy terasa seperti melempar koin. Bukan karena PHP jelek, tapi karena sistem yang dibangun bertahun-tahun tanpa arsitektur yang jelas akhirnya _menyusahkan_ dirinya sendiri.

_Nganu_, jadi tulisan ini bukan _"Go lebih baik dari PHP"_ atau _"PHP sudah mati"_. Bukan. Tulisan ini catatan pengalaman saya melakukan migrasi sistem backend dari PHP (CodeIgniter 3 dan Laravel) ke Go, berdasarkan proyek nyata yang saya kerjakan.

## Masalahnya Bukan Bahasa, Tapi Arsitektur

Sistem yang saya tangani punya profil seperti ini:

- **370+ API endpoint** — _ ya, bukan salah ketik_
- **33 database entity** yang saling berhubungan
- **~194.000 baris kode** PHP yang terdiri dari campuran CodeIgniter 3 dan Laravel
- _Testing?_ Ada, tapi _coverage_-nya... _yah_, lebih baik tidak dibahas hehe

Masalah sebenarnya bukan di bahasa pemrogramannya. Masalahnya ada di:

1. **Tidak ada pemisahan layer** — _controller_ langsung query ke database, _business logic_ bercampur dengan _presentation logic_
2. **Sulit di-_test_** — kode yang tightly coupled bikin unit testing jadi _nightmare_
3. **_Developer experience_ menurun** — onboarding _developer_ baru makin lama, _bug fix_ makin berisiko

Intinya, sistem ini butuh bukan sekadar ganti bahasa, tapi **re-architect**.

## Kenapa Go?

Kalau ditanya kenapa tidak _refactor_ saja di PHP, jawabannya: **bisa saja**. Tapi dalam kasus ini, ada beberapa alasan kenapa Go jadi pilihan yang lebih tepat:

### 1. _Type Safety_ Menghemat Waktu _Debug_

PHP itu _dynamically typed_, yang artinya banyak _bug_ baru ketahuan saat _runtime_. Go dengan _static typing_-nya menangkap _error_ saat _compile time_. Sederhana, tapi dampaknya besar — _bug_ yang biasanya baru muncul di _production_ sekarang ketahuan saat _build_.

### 2. _Concurrency_ untuk _Free_

Sistem ini menangani banyak _request_ simultan — mulai dari _tracking GPS real-time_ hingga _report generation_. _Goroutine_ di Go membuat _concurrent programming_ jadi jauh lebih simpel dibanding _approach_ lain yang pernah saya coba.

### 3. _Deployment_ yang Bersih

Satu _binary_. Tanpa _dependency hell_, tanpa _composer install_ di _server_, tanpa _PHP version conflict_. _Build_ di lokal, _deploy_ satu file. _Done_.

### 4. _Performance_ yang Terukur

Bukan soal _benchmark_ angka, tapi soal **penggunaan resource yang predictable**. _Memory usage_ Go yang konsisten membuat kapasitas _planning_ jauh lebih mudah.

Bukan berarti Go sempurna — _error handling_-nya _verbose_ (semua `if err != nil` itu... _well_, _you get used to it_), dan _ecosystem_-nya lebih kecil dari PHP. Tapi untuk _use case_ ini, _trade-off_-nya sepadan.

## Pendekatan Migrasi: Per-_Module_, Bukan _Big Bang_

Salah satu kesalahan terbesar dalam migrasi adalah _"kita _rewrite_ semuanya dari nol"_. Saya pernah dengar cerita _horor_ tentang tim yang _spend_ 2 tahun untuk _big-bang rewrite_ dan akhirnya... tidak jadi.

Pendekatan yang saya pakai:

### 1. Pemetaan Modul

Pertama, _map_ semua _endpoint_ dan _entity_ ke dalam modul-modul yang jelas. Dari 370+ _endpoint_, saya mengelompokkannya menjadi beberapa domain: _authentication_, _tracking_, _reporting_, _user management_, dan seterusnya.

### 2. Service–Repository Pattern

Setiap modul di-_design_ dengan pola **service–repository**:

- **Repository layer** — bertanggung jawab atas akses data (query ke database)
- **Service layer** — berisi _business logic_, memanggil repository

Kenapa dipisah? Karena dengan pemisahan ini:

- _Repository_ bisa di-_mock_ saat testing _service_
- _Business logic_ bisa diuji tanpa database
- Penambahan fitur tidak merusak bagian lain

### 3. Satu _Endpoint_ pada Satu Waktu

Prosesnya kurang lebih:

1. Ambil satu _endpoint_ dari PHP
2. Tulis _test case_ berdasarkan _behavior_ yang sudah ada
3. Implementasi di Go dengan pola service–repository
4. _Test_ sampai _pass_
5. _Deploy_ dan _monitor_
6. Ulangi

Ya, memang lambat. Tapi **_predictable_**. Setiap migrasi _endpoint_ adalah _incremental progress_ yang terukur.

## Hasil yang Terukur

Beberapa angka dari proyek ini:

- **370+ _endpoint_** berhasil dimigrasi
- **33 _entity_** dikonversi dari MySQL ke PostgreSQL
- **194K+ baris kode** PHP ditransformasi menjadi arsitektur Go yang lebih bersih
- **_Response time_ lebih konsisten** — tidak ada lagi _spike_ yang tidak terduga
- **_Test coverage_ meningkat signifikan** — dari hampir tidak ada menjadi angka yang pantas
- **_Developer onboarding_ lebih cepat** — struktur kode yang jelas membuat _developer_ baru bisa _contribute_ lebih cepat

Yang tidak terukur tapi sangat terasa: **_peace of mind_ saat _deploy_**. Tidak ada lagi _feeling_ "semoga kali ini tidak ada yang _break_".

## Pelajaran

Beberapa hal yang saya pelajari dari proses ini:

### 1. Pahami Dulu Sistem yang Ada

Sebelum menulis satu baris pun kode Go, saya _spend_ waktu cukup lama untuk memahami _behavior_ sistem yang sudah ada. Bukan membaca _code_-nya saja — tapi memahami **mengapa** keputusan tertentu dibuat di masa lalu. Kadang, kode yang terlihat _"aneh"_ punya alasan yang masuk akal di konteks saat itu dibuat.

### 2. _Big Bang_ Rewrite itu _Trap_

_Kalau bisa sedikit-sedikit, ngapain langsung semua?_ Pendekatan _incremental_ memang terasa lambat, tapi risikonya jauh lebih kecil. Setiap _endpoint_ yang berhasil dimigrasi adalah _progress_ yang bisa ditunjukkan ke _stakeholder_.

### 3. _Test_ Dulu, Migrasi Kemudian

Menulis _test_ untuk sistem _legacy_ itu membosankan, _ya_? Tapi _test_ adalah **jaring pengaman** yang memastikan _behavior_ sistem setelah migrasi tetap sama. Tanpa _test_, kamu tidak migrasi — kamu berjudi.

### 4. Jangan _Prematurely Optimize_

Awalnya saya tergoda untuk langsung pakai _microservices_, _message queue_, dan arsitektur _fancy_ lainnya. Tapi _reality check_: sistem yang belum stabil arsitekturnya tidak butuh _microservices_ — butuh **fondasi yang kuat**. _Monolith_ yang well-structured lebih baik daripada _microservices_ yang _chaotic_.

## Penutup

Migrasi dari PHP ke Go bukan tentang _"bahasa A lebih baik dari bahasa B"_. Tapi tentang **memilih _tool_ yang tepat untuk masalah yang dihadapi** — dan dalam kasus ini, Go dengan _static typing_, _concurrency model_, dan _deployment simplicity_-nya adalah pilihan yang tepat.

Kalau kamu punya sistem _legacy_ yang mulai _kepenuhan_ dan ingin mendiskusikan pendekatan migrasi yang tepat, [hubungi saya](/contact/). Atau lihat [layanan](/services/) yang bisa saya bantu.

---

_Tag: [go](/tags/go/) · [php](/tags/php/) · [arsitektur](/tags/arsitektur/) · [migration](/tags/migration/)_
