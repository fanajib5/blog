---
title: "Migrasi Legacy PHP ke Go: Kenapa, Bagaimana, dan Pelajarannya"
description: "Cerita saya memigrasikan backend PHP (CodeIgniter 3 dan Laravel) ke Go, satu endpoint demi satu endpoint."
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

_Codebase_ PHP yang saya tangani makin susah dipelihara. Fitur baru susah ditambahkan, _bug_ makin sering muncul, dan setiap _deploy_ rasanya seperti lempar koin. Bukan berarti PHP yang salah. Sistemnya tumbuh bertahun-tahun tanpa arsitektur yang jelas. Sampai suatu hari saya harus _rollback_ tiga kali dalam sehari gara-gara _deploy_ yang seharusnya sederhana. Lumayan bikin stres.

Saya tidak sedang bilang _"Go lebih baik dari PHP"_ atau _"PHP sudah mati"_. Ini catatan pengalaman saya memigrasikan sistem _backend_ dari PHP (CodeIgniter 3 dan Laravel) ke Go. Bukan tutorial, apalagi ajakan pindah bahasa. Siapa tahu cerita dan kesalahan saya berguna buat yang sedang menghadapi situasi serupa.

## Yang Bikin Repot: Arsitekturnya

Sistem yang saya tangani punya profil seperti ini:

- **370+ API endpoint**[^1]
- **33 database entity** yang saling berhubungan
- **~194.000 baris kode** PHP yang terdiri dari campuran CodeIgniter 3 dan Laravel
- _Testing?_ Ada, tetapi _coverage_-nya saat itu masih sangat rendah.

PHP-nya sendiri bukan biang masalah. PHP juga bisa dipakai dengan baik. Yang bikin repot di sistem ini antara lain:

1. **Tidak ada pemisahan _layer_**: _controller_ langsung mengakses database, sementara _business logic_ bercampur dengan _presentation logic_. Kodenya seperti nasi goreng campur, sulit membedakan bagian yang satu dari yang lain.
2. **Sulit di-_test_**: kode yang _tightly coupled_ membuat _unit testing_ jadi sulit. Untuk menguji satu fungsi, saya harus menyiapkan database, _mock_ tiga _dependency_, lalu berharap semuanya berjalan.
3. **_Developer experience_ menurun**: _onboarding developer_ baru semakin lama dan _bug fix_ semakin berisiko. Seorang _developer_ baru pernah bilang, _"Mas, ini kodenya... ehem, menarik sekali arsitekturnya."_ Maksudnya, _chaotic_.

Jadi, mengganti bahasa saja tidak akan cukup. Arsitekturnya juga perlu dibereskan.

## Kenapa Saya Pilih Go?

Kalau ditanya kenapa tidak _refactor_ saja di PHP, jawabannya: **bisa saja**. Tapi untuk kasus yang saya hadapi, Go terasa lebih cocok karena beberapa alasan. Bukan cuma karena lagi ramai dibicarakan.

### 1. _Type Safety_ Menghemat Waktu _Debug_

PHP bersifat _dynamically typed_[^2], sehingga banyak _bug_ baru diketahui saat _runtime_. _Static typing_ di Go dapat menangkap _error_ terkait tipe saat _compile time_, sebelum error tersebut mencapai _production_.

### 2. _Goroutine_ Membantu Urusan _Concurrency_

Sistem ini menangani banyak _request_ sekaligus, mulai dari _tracking GPS real-time_ hingga _report generation_. Dibandingkan pendekatan lain yang pernah saya coba, _goroutine_ membuat _concurrent programming_ lebih sederhana. Saat pertama kali menggunakannya, saya sempat berpikir, _"Kok bisa sesederhana ini?"_

### 3. Urusan _Deploy_ Lebih Ringkas

Go menghasilkan satu _binary_. Tidak perlu _composer install_ di _server_ atau khawatir soal konflik versi PHP. Dulu, _deploy_ PHP mengharuskan saya memastikan _composer dependencies_ terpasang, versi PHP cocok, dan semua _extension_ tersedia. Sekarang saya cukup melakukan _build_ di lokal lalu mengirim satu berkas dengan `scp`.

### 4. _Resource_ Lebih Mudah Diperkirakan

Yang saya pertimbangkan bukan angka _benchmark_, melainkan **penggunaan _resource_ yang dapat diprediksi**. Penggunaan memori Go yang konsisten memudahkan perencanaan kapasitas. Sistem PHP sebelumnya bisa mengalami _memory spike_ tanpa sebab yang jelas, sedangkan penggunaan memori sekarang lebih rata dan dapat diprediksi.

Go tentu tidak sempurna. _Error handling_-nya _verbose_ (semua `if err != nil` itu)[^3], dan _ecosystem_-nya lebih kecil daripada PHP. Untuk kebutuhan proyek ini, _trade-off_-nya sepadan.

## Cara Migrasinya: Per Modul, Bukan Sekaligus

Salah satu risiko migrasi adalah menulis ulang semuanya sekaligus. Saya pernah dengar cerita tim yang menghabiskan dua tahun untuk _big-bang rewrite_, tapi akhirnya tidak selesai. Ada yang _burnout_, ada _scope creep_, ada juga kebutuhan bisnis yang berubah di tengah jalan. Ya, banyak cara proyek bisa melenceng.

Pendekatan yang saya pakai:

### 1. Pemetaan Modul

Pertama, saya memetakan semua _endpoint_ dan _entity_ ke modul yang jelas. Dari 370+ _endpoint_, saya mengelompokkannya ke beberapa domain seperti _authentication_, _tracking_, _reporting_, dan _user management_. Saya menghabiskan beberapa hari untuk membuat _spreadsheet_ pemetaan _endpoint_. Pekerjaan itu cukup membosankan, tetapi membantu proses berikutnya.

### 2. Service-Repository Pattern

Setiap modul saya _design_ dengan pola **service-repository**:

- **Repository layer**: bertanggung jawab atas akses data (query ke database)
- **Service layer**: berisi _business logic_, memanggil repository

Pembagian ini lumayan membantu:

- _Repository_ bisa di-_mock_ saat testing _service_
- _Business logic_ bisa diuji tanpa database
- Penambahan fitur tidak merusak bagian lain

Dengan _layer_ yang jelas, tiap bagian punya urusannya sendiri. Awalnya pola ini terasa seperti _over-engineering_. Setelah dipakai beberapa bulan, saya mulai merasakan gunanya.

### 3. Satu _Endpoint_ pada Satu Waktu

Prosesnya kurang lebih:

1. Ambil satu _endpoint_ dari PHP
2. Tulis _test case_ berdasarkan _behavior_ yang sudah ada[^4]
3. Implementasi di Go dengan pola service-repository
4. _Test_ sampai _pass_
5. _Deploy_ dan _monitor_
6. Ulangi

Proses ini memang lambat, tetapi **terukur dan dapat diprediksi**. Setiap _endpoint_ yang selesai menjadi kemajuan yang bisa dilihat _stakeholder_. Laporan _"Minggu ini berhasil migrasi 5 endpoint"_ lebih jelas daripada berbulan-bulan mengatakan _"kami masih mengerjakan migrasi"_ tanpa hasil yang terlihat.

## Hasilnya Sejauh Ini

Ini beberapa angka dari proyeknya:

- **370+ _endpoint_** berhasil dimigrasi
- **33 _entity_** dikonversi dari MySQL ke PostgreSQL[^5]
- **194K+ baris kode** PHP ditransformasi menjadi arsitektur Go yang lebih bersih
- **_Response time_ lebih konsisten**: tidak ada lagi _spike_ yang tidak terduga
- **_Test coverage_ meningkat signifikan**: dari hampir tidak ada menjadi angka yang pantas
- **_Developer onboarding_ lebih cepat**: struktur kode yang jelas membuat _developer_ baru bisa _contribute_ lebih cepat

Hal yang tidak tercatat dalam angka, tetapi terasa, adalah lebih tenangnya proses _deploy_. Saya tidak lagi berharap semoga tidak ada yang rusak. _Deploy_ tetap membuat sedikit gugup, tetapi tidak sampai mengganggu tidur.

## Hal yang Saya Pelajari

Ada beberapa hal yang saya pelajari selama proses ini:

### Kenali Sistem Lama Dulu

Sebelum menulis kode Go, saya coba pahami dulu _behavior_ sistem lama. Saya baca kodenya sambil mencari tahu **kenapa** keputusan tertentu pernah dibuat. Kode yang kelihatan _"aneh"_ mungkin punya alasan yang masuk akal pada masanya. Jadi, jangan buru-buru menyebut kode _legacy_ jelek. Bisa saja ada _constraint_ yang sekarang sudah tidak kelihatan.

### Jangan Langsung Tulis Ulang Semuanya

_Kalau bisa dicicil, kenapa harus sekaligus? _Incremental_ memang terasa pelan, tapi risikonya lebih kecil. Tiap _endpoint_ yang selesai bisa ditunjukkan ke _stakeholder_, sementara sistem lama tetap berjalan.

### Tes Sebelum Pindah

Menulis _test_ untuk sistem _legacy_ memang membosankan (saya tahu). Tapi _test_ jadi jaring pengaman supaya _behavior_ tidak berubah diam-diam setelah migrasi. Tanpanya, kita bisa saja mengubah sesuatu yang sudah diandalkan pengguna.

### Jangan Keburu Membuatnya Rumit

Awalnya saya tergoda memakai _microservices_, _message queue_, dan macam-macam arsitektur rumit lainnya. Tapi sistem yang arsitekturnya belum stabil butuh fondasi dulu, bukan tambahan komponen. _Monolith_ yang _well-structured_ lebih enak dirawat daripada _microservices_ yang _chaotic_. Prinsip KISS (_Keep It Simple, Stupid_)[^6] masih kepakai.

## Jadi, Perlukah Pindah ke Go?

Buat saya, migrasi PHP ke Go bukan lomba _"bahasa A lebih baik dari bahasa B"_. Yang penting memilih _tool_ yang pas untuk masalahnya. Di proyek ini, _static typing_, model _concurrency_, dan _deployment_ yang lebih sederhana membuat Go terasa cocok.

Apakah semua sistem PHP perlu pindah ke Go? Tidak juga. Kalau sistemnya berjalan baik, arsitekturnya jelas, dan tim nyaman dengan PHP, pindah cuma karena _hype_ malah menambah pekerjaan. Menurut saya, migrasi baru masuk akal kalau _business value_-nya jelas dan manfaatnya bisa diukur.

Kalau sistem _legacy_ yang kamu tangani mulai sulit dikembangkan dan kamu ingin mendiskusikan pendekatan migrasinya, [hubungi saya](/contact/). Kamu juga bisa melihat [layanan](/services/) yang saya tawarkan.

[^1]: Serius, saya sendiri sempat _double-check_ angkanya waktu pertama kali ngitung. Ternyata memang segitu banyak hahaha.

[^2]: PHP 7+ memang sudah punya _type hints_ dan _strict types_, tapi tetap tidak se-_strict_ Go yang _static typed_ sejak awal.

[^3]: Di awal-awal pakai Go, saya sempat _annoyed_ sama banyaknya `if err != nil`. Tapi setelah terbiasa, _ya udah_ _accept_ aja. Lagian lebih baik _verbose_ tapi jelas daripada _concise_ tapi _error_ handling-nya _hidden_.

[^4]: Menulis _test_ berdasarkan _behavior_ yang ada itu penting. Jangan sampai migrasi malah mengubah _behavior_ yang sudah diharapkan _user_.

[^5]: Migrasi dari MySQL ke PostgreSQL itu cerita tersendiri. _Someday_ mungkin saya tulis juga hehe.

[^6]: _Keep It Simple, Stupid_, prinsip yang sering dilupakan saat kita terlalu excited sama teknologi baru.

---

_Tag: [go](/tags/go/) · [php](/tags/php/) · [arsitektur](/tags/arsitektur/) · [migration](/tags/migration/)_
