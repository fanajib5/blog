---
title: "Migrasi Legacy PHP ke Go: Kenapa, Bagaimana, dan Pelajarannya"
description: "Catatan pengalaman mengkonversi sistem backend dari PHP (CodeIgniter 3 & Laravel) ke Go, 370+ endpoint, 33 entity, dan 194K baris kode yang berhasil dimigrasi bertahap."
author: "Faiq Najib Al-Aziz"
date: 2026-04-04
lastmod: 2026-09-11T09:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - php
  - arsitektur
  - migration
---

_Codebase_ PHP yang saya tangani makin sulit dipelihara: fitur baru susah ditambahkan, _bug_ lebih sering muncul, dan setiap _deploy_ terasa seperti melempar koin. Masalahnya bukan PHP. Sistem ini tumbuh selama bertahun-tahun tanpa arsitektur yang jelas. Suatu hari, saya sampai harus _rollback_ tiga kali dalam sehari setelah _deploy_ sederhana. Cukup membuat stres.

Tulisan ini bukan argumen bahwa _"Go lebih baik dari PHP"_ atau _"PHP sudah mati"_. Saya ingin mencatat pengalaman memigrasikan sistem _backend_ dari PHP (CodeIgniter 3 dan Laravel) ke Go dalam proyek yang saya kerjakan. Ini bukan tutorial atau ajakan untuk ikut pindah bahasa. Mudah-mudahan pengalaman dan kesalahan saya bisa berguna bagi yang sedang menghadapi situasi serupa.

## Masalahnya Bukan Bahasa, Tapi Arsitektur

Sistem yang saya tangani punya profil seperti ini:

- **370+ API endpoint**[^1]
- **33 database entity** yang saling berhubungan
- **~194.000 baris kode** PHP yang terdiri dari campuran CodeIgniter 3 dan Laravel
- _Testing?_ Ada, tetapi _coverage_-nya saat itu masih sangat rendah.

Masalah sebenarnya bukan di bahasa pemrogramannya. PHP itu bagus kok. Masalahnya ada di:

1. **Tidak ada pemisahan _layer_**: _controller_ langsung mengakses database, sementara _business logic_ bercampur dengan _presentation logic_. Kodenya seperti nasi goreng campur, sulit membedakan bagian yang satu dari yang lain.
2. **Sulit di-_test_**: kode yang _tightly coupled_ membuat _unit testing_ jadi sulit. Untuk menguji satu fungsi, saya harus menyiapkan database, _mock_ tiga _dependency_, lalu berharap semuanya berjalan.
3. **_Developer experience_ menurun**: _onboarding developer_ baru semakin lama dan _bug fix_ semakin berisiko. Seorang _developer_ baru pernah bilang, _"Mas, ini kodenya... ehem, menarik sekali arsitekturnya."_ Maksudnya, _chaotic_.

Sistem ini membutuhkan lebih dari sekadar pergantian bahasa. Arsitekturnya juga perlu ditata ulang.

## Kenapa Go?

Kalau ditanya kenapa tidak _refactor_ saja di PHP, jawabannya: **bisa saja**. Namun, dalam kasus ini Go lebih sesuai karena beberapa pertimbangan. Bukan semata-mata karena _hype_ Go.

### 1. _Type Safety_ Menghemat Waktu _Debug_

PHP bersifat _dynamically typed_[^2], sehingga banyak _bug_ baru diketahui saat _runtime_. _Static typing_ di Go dapat menangkap _error_ terkait tipe saat _compile time_, sebelum error tersebut mencapai _production_.

### 2. _Concurrency_ Lebih Mudah

Sistem ini menangani banyak _request_ sekaligus, mulai dari _tracking GPS real-time_ hingga _report generation_. Dibandingkan pendekatan lain yang pernah saya coba, _goroutine_ membuat _concurrent programming_ lebih sederhana. Saat pertama kali menggunakannya, saya sempat berpikir, _"Kok bisa sesederhana ini?"_

### 3. _Deployment_ yang Bersih

Go menghasilkan satu _binary_. Tidak perlu _composer install_ di _server_ atau khawatir soal konflik versi PHP. Dulu, _deploy_ PHP mengharuskan saya memastikan _composer dependencies_ terpasang, versi PHP cocok, dan semua _extension_ tersedia. Sekarang saya cukup melakukan _build_ di lokal lalu mengirim satu berkas dengan `scp`.

### 4. _Performance_ yang Terukur

Yang saya pertimbangkan bukan angka _benchmark_, melainkan **penggunaan _resource_ yang dapat diprediksi**. Penggunaan memori Go yang konsisten memudahkan perencanaan kapasitas. Sistem PHP sebelumnya bisa mengalami _memory spike_ tanpa sebab yang jelas, sedangkan penggunaan memori sekarang lebih rata dan dapat diprediksi.

Go tentu tidak sempurna. _Error handling_-nya _verbose_ (semua `if err != nil` itu)[^3], dan _ecosystem_-nya lebih kecil daripada PHP. Untuk kebutuhan proyek ini, _trade-off_-nya sepadan.

## Pendekatan Migrasi: Per-_Module_, Bukan _Big Bang_

Salah satu risiko migrasi adalah keputusan untuk menulis ulang semuanya sekaligus. Saya pernah mendengar cerita tim yang menghabiskan dua tahun untuk _big-bang rewrite_, tetapi tidak pernah menyelesaikannya. Penyebabnya beragam, mulai dari _burnout_ dan _scope creep_ hingga _business requirement_ yang berubah di tengah jalan.

Pendekatan yang saya pakai:

### 1. Pemetaan Modul

Pertama, saya memetakan semua _endpoint_ dan _entity_ ke modul yang jelas. Dari 370+ _endpoint_, saya mengelompokkannya ke beberapa domain seperti _authentication_, _tracking_, _reporting_, dan _user management_. Saya menghabiskan beberapa hari untuk membuat _spreadsheet_ pemetaan _endpoint_. Pekerjaan itu cukup membosankan, tetapi membantu proses berikutnya.

### 2. Service–Repository Pattern

Setiap modul di-_design_ dengan pola **service–repository**:

- **Repository layer**: bertanggung jawab atas akses data (query ke database)
- **Service layer**: berisi _business logic_, memanggil repository

Pemisahan ini membuat:

- _Repository_ bisa di-_mock_ saat testing _service_
- _Business logic_ bisa diuji tanpa database
- Penambahan fitur tidak merusak bagian lain

Dengan _layer_ yang jelas, setiap bagian punya tanggung jawab sendiri. Awalnya pola ini terasa seperti _over-engineering_, tetapi setelah beberapa bulan digunakan, pemisahan tersebut membantu.

### 3. Satu _Endpoint_ pada Satu Waktu

Prosesnya kurang lebih:

1. Ambil satu _endpoint_ dari PHP
2. Tulis _test case_ berdasarkan _behavior_ yang sudah ada[^4]
3. Implementasi di Go dengan pola service–repository
4. _Test_ sampai _pass_
5. _Deploy_ dan _monitor_
6. Ulangi

Proses ini memang lambat, tetapi **terukur dan dapat diprediksi**. Setiap _endpoint_ yang selesai menjadi kemajuan yang bisa dilihat _stakeholder_. Laporan _"Minggu ini berhasil migrasi 5 endpoint"_ lebih jelas daripada berbulan-bulan mengatakan _"kami masih mengerjakan migrasi"_ tanpa hasil yang terlihat.

## Hasil yang Terukur

Beberapa angka dari proyek ini:

- **370+ _endpoint_** berhasil dimigrasi
- **33 _entity_** dikonversi dari MySQL ke PostgreSQL[^5]
- **194K+ baris kode** PHP ditransformasi menjadi arsitektur Go yang lebih bersih
- **_Response time_ lebih konsisten**: tidak ada lagi _spike_ yang tidak terduga
- **_Test coverage_ meningkat signifikan**: dari hampir tidak ada menjadi angka yang pantas
- **_Developer onboarding_ lebih cepat**: struktur kode yang jelas membuat _developer_ baru bisa _contribute_ lebih cepat

Hal yang tidak tercatat dalam angka, tetapi terasa, adalah lebih tenangnya proses _deploy_. Saya tidak lagi berharap semoga tidak ada yang rusak. _Deploy_ tetap membuat sedikit gugup, tetapi tidak sampai mengganggu tidur.

## Pelajaran

Proses ini mengajarkan beberapa hal:

### 1. Pahami Dulu Sistem yang Ada

Sebelum menulis kode Go, saya meluangkan waktu untuk memahami _behavior_ sistem yang sudah ada. Saya tidak hanya membaca kodenya, tetapi juga mencari tahu **mengapa** keputusan tertentu dibuat. Kode yang terlihat _"aneh"_ bisa saja punya alasan yang masuk akal pada saat itu. Jangan buru-buru menganggap kode _legacy_ sebagai kode buruk; mungkin ada _constraint_ yang melatarbelakanginya.

### 2. _Big Bang_ Rewrite itu _Trap_

_Kalau bisa sedikit-sedikit, mengapa harus sekaligus?_ Pendekatan _incremental_ memang terasa lambat, tetapi risikonya lebih kecil. Setiap _endpoint_ yang selesai bisa ditunjukkan kepada _stakeholder_, sementara sistem tetap berjalan selama proses migrasi.

### 3. _Test_ Dulu, Migrasi Kemudian

Menulis _test_ untuk sistem _legacy_ memang membosankan. Namun, _test_ menjadi **jaring pengaman** untuk memastikan _behavior_ sistem tidak berubah setelah migrasi. Tanpa _test_, kita mengambil risiko mengubah perilaku yang sudah diharapkan pengguna.

### 4. Jangan _Prematurely Optimize_

Awalnya saya tergoda memakai _microservices_, _message queue_, dan arsitektur lain yang lebih rumit. Namun, sistem dengan arsitektur yang belum stabil membutuhkan **fondasi yang kuat**, bukan _microservices_. _Monolith_ yang _well-structured_ lebih baik daripada _microservices_ yang _chaotic_. Prinsip KISS (_Keep It Simple, Stupid_)[^6] tetap relevan.

## Penutup

Migrasi dari PHP ke Go bukan soal _"bahasa A lebih baik dari bahasa B"_. Intinya adalah **memilih _tool_ yang sesuai dengan masalah**. Dalam proyek ini, _static typing_, _concurrency model_, dan kemudahan _deployment_ membuat Go menjadi pilihan yang tepat.

Apakah semua sistem PHP perlu dimigrasi ke Go? Tidak. Jika sistem berjalan baik, arsitekturnya jelas, dan tim nyaman menggunakan PHP, tidak ada alasan untuk pindah hanya karena _hype_. Migrasi sebaiknya dilakukan ketika ada _business value_ yang jelas dan manfaat yang bisa diukur.

Kalau sistem _legacy_ yang kamu tangani mulai sulit dikembangkan dan kamu ingin mendiskusikan pendekatan migrasinya, [hubungi saya](/contact/). Kamu juga bisa melihat [layanan](/services/) yang saya tawarkan.

[^1]: Serius, saya sendiri sempat _double-check_ angkanya waktu pertama kali ngitung. Ternyata memang segitu banyak hahaha.

[^2]: PHP 7+ memang sudah punya _type hints_ dan _strict types_, tapi tetap tidak se-_strict_ Go yang _static typed_ sejak awal.

[^3]: Di awal-awal pakai Go, saya sempat _annoyed_ sama banyaknya `if err != nil`. Tapi setelah terbiasa, _ya udah_ _accept_ aja. Lagian lebih baik _verbose_ tapi jelas daripada _concise_ tapi _error_ handling-nya _hidden_.

[^4]: Menulis _test_ berdasarkan _behavior_ yang ada itu penting. Jangan sampai migrasi malah mengubah _behavior_ yang sudah diharapkan _user_.

[^5]: Migrasi dari MySQL ke PostgreSQL itu cerita tersendiri. _Someday_ mungkin saya tulis juga hehe.

[^6]: _Keep It Simple, Stupid_, prinsip yang sering dilupakan saat kita terlalu excited sama teknologi baru.

---

_Tag: [go](/tags/go/) · [php](/tags/php/) · [arsitektur](/tags/arsitektur/) · [migration](/tags/migration/)_
