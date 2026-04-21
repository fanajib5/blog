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

Saya pernah berada di posisi di mana _codebase_ PHP sudah _kepenuhan_ — fitur baru makin susah ditambah, _bug_ makin sering muncul, dan setiap deploy terasa seperti melempar koin. Bukan karena PHP jelek, tapi karena sistem yang dibangun bertahun-tahun tanpa arsitektur yang jelas akhirnya _menyusahkan_ dirinya sendiri. Pernah waktu itu sampai harus _rollback_ tiga kali dalam sehari gara-gara _deploy_ yang harusnya _simple_. _Stress level_-nya... _hadeh_, jangan ditanya hahaha.

_Nganu_, jadi tulisan ini bukan _"Go lebih baik dari PHP"_ atau _"PHP sudah mati"_. Bukan. Tulisan ini catatan pengalaman saya melakukan migrasi sistem backend dari PHP (CodeIgniter 3 dan Laravel) ke Go, berdasarkan proyek nyata yang saya kerjakan. Bukan tutorial, bukan juga propaganda. Cuma catatan pribadi aja, siapa tahu ada yang lagi ngalamin hal serupa dan bisa ambil pelajaran dari kesalahan-kesalahan saya hehe~

## Masalahnya Bukan Bahasa, Tapi Arsitektur

Sistem yang saya tangani punya profil seperti ini:

- **370+ API endpoint** — _ya, bukan salah ketik_[^1]
- **33 database entity** yang saling berhubungan
- **~194.000 baris kode** PHP yang terdiri dari campuran CodeIgniter 3 dan Laravel
- _Testing?_ Ada, tapi _coverage_-nya... _yah_, lebih baik tidak dibahas hehe

Masalah sebenarnya bukan di bahasa pemrogramannya. PHP itu bagus kok. Masalahnya ada di:

1. **Tidak ada pemisahan layer** — _controller_ langsung query ke database, _business logic_ bercampur dengan _presentation logic_. Pokoknya kayak nasi goreng yang isinya macem-macem, tapi nggak tau mana nasi mana sayurnya hahaha.
2. **Sulit di-_test_** — kode yang tightly coupled bikin unit testing jadi _nightmare_. Mau _test_ satu function, eh harus _setup_ database, _mock_ tiga dependency, dan berdoa semoga berhasil.
3. **_Developer experience_ menurun** — onboarding _developer_ baru makin lama, _bug fix_ makin berisiko. Terakhir ada _developer_ baru yang sampai bilang, _"Mas, ini kodenya... ehem, menarik sekali arsitekturnya."_ — _Translation_: _chaotic_ hehe~

Intinya, sistem ini butuh bukan sekadar ganti bahasa, tapi **re-architect**.

## Kenapa Go?

Kalau ditanya kenapa tidak _refactor_ saja di PHP, jawabannya: **bisa saja**. Tapi dalam kasus ini, ada beberapa alasan kenapa Go jadi pilihan yang lebih tepat. Bukan karena saya lagi _hypnotized_ sama _hype Go_, tapi karena ada pertimbangan yang cukup matang (setidaknya menurut saya sih hehe):

### 1. _Type Safety_ Menghemat Waktu _Debug_

PHP itu _dynamically typed_[^2], yang artinya banyak _bug_ baru ketahuan saat _runtime_. Go dengan _static typing_-nya menangkap _error_ saat _compile time_. Sederhana, tapi dampaknya besar — _bug_ yang biasanya baru muncul di _production_ sekarang ketahuan saat _build_. Dan percayalah, tidur lebih nyenyak kalau tau _bug type-related_ nggak bakal tiba-tiba muncul jam 2 pagi hahaha.

### 2. _Concurrency_ untuk _Free_

Sistem ini menangani banyak _request_ simultan — mulai dari _tracking GPS real-time_ hingga _report generation_. _Goroutine_ di Go membuat _concurrent programming_ jadi jauh lebih simpel dibanding _approach_ lain yang pernah saya coba. Serius deh, pertama kali pakai _goroutine_ itu rasanya kayak, _"Kok bisa se-simpel ini?"_ hehe~

### 3. _Deployment_ yang Bersih

Satu _binary_. Tanpa _dependency hell_, tanpa _composer install_ di _server_, tanpa _PHP version conflict_. _Build_ di lokal, _deploy_ satu file. _Done_. Sederhana tapi _powerful_. Dulu deploy PHP itu harus pastiin dulu _composer dependencies_ terinstall dengan benar, _PHP version_ cocok, extension ini itu ada... sekarang tinggal _scp_ satu file, _done_. _Simple life is the best life_ hehe.

### 4. _Performance_ yang Terukur

Bukan soal _benchmark_ angka, tapi soal **penggunaan resource yang predictable**. _Memory usage_ Go yang konsisten membuat kapasitas _planning_ jauh lebih mudah. Dulu sistem PHP bisa tiba-tiba _memory spike_ tanpa sebab yang jelas. Sekarang _memory usage_-nya _flat_ dan _predictable_. _Peace of mind_, priceless hahaha.

Bukan berarti Go sempurna — _error handling_-nya _verbose_ (semua `if err != nil` itu... _well_, _you get used to it_)[^3], dan _ecosystem_-nya lebih kecil dari PHP. Tapi untuk _use case_ ini, _trade-off_-nya sepadan. Setiap _tool_ punya kelebihan dan kekurangan, tinggal kita pintar-pintarnya milih yang paling cocok aja hehe~

## Pendekatan Migrasi: Per-_Module_, Bukan _Big Bang_

Salah satu kesalahan terbesar dalam migrasi adalah _"kita rewrite semuanya dari nol"_. Saya pernah dengar cerita _horor_ tentang tim yang _spend_ 2 tahun untuk _big-bang rewrite_ dan akhirnya... tidak jadi. Alasannya macem-macem: _burn out_, _scope creep_, atau _business requirement_ yang berubah di tengah jalan. _Amit-amit_ deh kalau sampai kejadian kayak gitu hahaha.

Pendekatan yang saya pakai:

### 1. Pemetaan Modul

Pertama, _map_ semua _endpoint_ dan _entity_ ke dalam modul-modul yang jelas. Dari 370+ _endpoint_, saya mengelompokkannya menjadi beberapa domain: _authentication_, _tracking_, _reporting_, _user management_, dan seterusnya. Prosesnya... _yah_, cukup _tedious_. Butuh waktu beberapa hari cuma buat bikin _spreadsheet_ yang berisi mapping semua endpoint. Tapi percayalah, langkah ini _worth it_ banget hehe.

### 2. Service–Repository Pattern

Setiap modul di-_design_ dengan pola **service–repository**:

- **Repository layer** — bertanggung jawab atas akses data (query ke database)
- **Service layer** — berisi _business logic_, memanggil repository

Kenapa dipisah? Karena dengan pemisahan ini:

- _Repository_ bisa di-_mock_ saat testing _service_
- _Business logic_ bisa diuji tanpa database
- Penambahan fitur tidak merusak bagian lain

Sederhananya, kita bikin _layer_ yang jelas sehingga _concern_ masing-masing bagian tidak _mixed up_. Awalnya sih terasa _over-engineering_, tapi setelah jalan beberapa bulan, _oh man_, ini sangat membantu hehe~

### 3. Satu _Endpoint_ pada Satu Waktu

Prosesnya kurang lebih:

1. Ambil satu _endpoint_ dari PHP
2. Tulis _test case_ berdasarkan _behavior_ yang sudah ada[^4]
3. Implementasi di Go dengan pola service–repository
4. _Test_ sampai _pass_
5. _Deploy_ dan _monitor_
6. Ulangi

Ya, memang lambat. Tapi **_predictable_**. Setiap migrasi _endpoint_ adalah _incremental progress_ yang terukur. Dan yang paling penting, _stakeholder_ bisa lihat _progress_ secara nyata. _"Minggu ini berhasil migrasi 5 endpoint"_ itu lebih meyakinkan daripada _"kami masih ngerjain migrasi"_ selama berbulan-bulan tanpa hasil yang terlihat hehe.

## Hasil yang Terukur

Beberapa angka dari proyek ini:

- **370+ _endpoint_** berhasil dimigrasi
- **33 _entity_** dikonversi dari MySQL ke PostgreSQL[^5]
- **194K+ baris kode** PHP ditransformasi menjadi arsitektur Go yang lebih bersih
- **_Response time_ lebih konsisten** — tidak ada lagi _spike_ yang tidak terduga
- **_Test coverage_ meningkat signifikan** — dari hampir tidak ada menjadi angka yang pantas
- **_Developer onboarding_ lebih cepat** — struktur kode yang jelas membuat _developer_ baru bisa _contribute_ lebih cepat

Yang tidak terukur tapi sangat terasa: **_peace of mind_ saat _deploy_**. Tidak ada lagi _feeling_ "semoga kali ini tidak ada yang _break_". Sekarang deploy itu... _yah_, tetap deg-degan dikit sih, tapi nggak sampai bikin susah tidur hahaha.

## Pelajaran

Beberapa hal yang saya pelajari dari proses ini:

### 1. Pahami Dulu Sistem yang Ada

Sebelum menulis satu baris pun kode Go, saya _spend_ waktu cukup lama untuk memahami _behavior_ sistem yang sudah ada. Bukan membaca _code_-nya saja — tapi memahami **mengapa** keputusan tertentu dibuat di masa lalu. Kadang, kode yang terlihat _"aneh"_ punya alasan yang masuk akal di konteks saat itu dibuat. Jangan langsung _judge_ kode _legacy_ sebagai kode jelek. Siapa tahu dulu ada _constraint_ tertentu yang memaksa keputusan itu diambil hehe~

### 2. _Big Bang_ Rewrite itu _Trap_

_Kalau bisa sedikit-sedikit, ngapain langsung semua?_ Pendekatan _incremental_ memang terasa lambat, tapi risikonya jauh lebih kecil. Setiap _endpoint_ yang berhasil dimigrasi adalah _progress_ yang bisa ditunjukkan ke _stakeholder_. Dan yang penting, sistem tetap jalan normal selama proses migrasi. _Business as usual_, _gitu deh_ hehe.

### 3. _Test_ Dulu, Migrasi Kemudian

Menulis _test_ untuk sistem _legacy_ itu membosankan, _ya_? Tapi _test_ adalah **jaring pengaman** yang memastikan _behavior_ sistem setelah migrasi tetap sama. Tanpa _test_, kamu tidak migrasi — kamu berjudi. Dan percayalah, _deploy_ dengan _test coverage_ yang bagus itu jauh lebih _relaxing_ daripada _deploy_ sambil berdoa hahaha.

### 4. Jangan _Prematurely Optimize_

Awalnya saya tergoda untuk langsung pakai _microservices_, _message queue_, dan arsitektur _fancy_ lainnya. Tapi _reality check_: sistem yang belum stabil arsitekturnya tidak butuh _microservices_ — butuh **fondasi yang kuat**. _Monolith_ yang well-structured lebih baik daripada _microservices_ yang _chaotic_. _KISS_ (_Keep It Simple, Stupid_)[^6] itu beneran _wisdom_ yang _timeless_ hehe~

## Penutup

Migrasi dari PHP ke Go bukan tentang _"bahasa A lebih baik dari bahasa B"_. Tapi tentang **memilih _tool_ yang tepat untuk masalah yang dihadapi** — dan dalam kasus ini, Go dengan _static typing_, _concurrency model_, dan _deployment simplicity_-nya adalah pilihan yang tepat.

Apakah semua sistem PHP harus dimigrasi ke Go? _Enggak lah_. Kalau sistem PHP-mu jalan dengan baik, arsitekturnya jelas, dan tim nyaman pakai PHP, _ya udah_, lanjutkan. Jangan migrasi cuma karena ikut-ikutan _hype_. Migrasilah karena ada _clear business value_ dan _measurable benefit_-nya hehe~

Kalau kamu punya sistem _legacy_ yang mulai _kepenuhan_ dan ingin mendiskusikan pendekatan migrasi yang tepat, [hubungi saya](/contact/). Atau lihat [layanan](/services/) yang bisa saya bantu.

[^1]: Serius, saya sendiri sempat _double-check_ angkanya waktu pertama kali ngitung. Ternyata memang segitu banyak hahaha.

[^2]: PHP 7+ memang sudah punya _type hints_ dan _strict types_, tapi tetap tidak se-_strict_ Go yang _static typed_ sejak awal.

[^3]: Di awal-awal pakai Go, saya sempat _annoyed_ sama banyaknya `if err != nil`. Tapi setelah terbiasa, _ya udah_ _accept_ aja. Lagian lebih baik _verbose_ tapi jelas daripada _concise_ tapi _error_ handling-nya _hidden_.

[^4]: Menulis _test_ berdasarkan _behavior_ yang ada itu penting. Jangan sampai migrasi malah mengubah _behavior_ yang sudah diharapkan _user_.

[^5]: Migrasi dari MySQL ke PostgreSQL itu cerita tersendiri. _Someday_ mungkin saya tulis juga hehe.

[^6]: _Keep It Simple, Stupid_ — prinsip yang sering dilupakan saat kita terlalu excited sama teknologi baru.

---

_Tag: [go](/tags/go/) · [php](/tags/php/) · [arsitektur](/tags/arsitektur/) · [migration](/tags/migration/)_
