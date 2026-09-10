---
title: "Hijrah Backend (1): Hari Pertama Disodori Warisan 370+ Endpoint"
description: "Ep 1 seri Hijrah Backend: cerita personal di balik migrasi backend GPS dari PHP ke Go, dimulai dari lowongan yang mengajak mewujudkan keputusan orang lain, mandat tiga bulan, dan warisan 370+ endpoint."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T015:30:00+07:00
lastmod: 2026-09-10T015:30:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - php
  - migration
  - cerita
series: "Hijrah Backend"
---

Cerita ini sebenarnya dimulai sebelum saya diterima kerja.

Di sebuah perusahaan GPS tracking di Surabaya, salah satu senior tim mendapat mandat me-_rewrite_ sistem eksisting. Sampai hari ini saya tidak tahu persis apa yang dibicarakan di rapat internalnya; yang saya tahu hanya hasilnya: mereka memutuskan pindah ke Go. Dan baru setelah keputusan itu mantap, lowongan pun dibuka.

Jadi posisi saya di rekrutmen itu unik: saya tidak melamar sebuah pekerjaan, saya melamar sebuah keputusan yang sudah diambil orang lain hehe.

Di _interview_, pertanyaan utamanya wajar: bisa tidak, me-_migrasi_ Laravel ke Go? Sempat ada tawaran tes, semacam _"nanti kami tunjukkan contoh aplikasi kami, coba kerjakan dalam seminggu"_. Tawaran itu akhirnya tidak jadi. Ya sudah, _interview_ pun berjalan seperti biasa, dan saya diterima.

Lalu, entah kapan tepatnya lahirnya, ada satu kesepakatan yang sudah menunggu saya sejak sebelum hari pertama: para pengambil keputusan sepakat, proyek migrasi ini harus tuntas _develop_ plus _testing_ dalam **tiga bulan**.

Tiga bulan. Untuk 370+ _endpoint_.[^2]

Angka itu lahir dari satu keyakinan yang terdengar masuk akal di rapat: migrasi Laravel ke Go itu cepat dan mudah, tinggal pindahin, dan hasilnya langsung siap pakai di _production_. Cukup _export_-import, kan? Yang belum sempat ditanya, kenapa satu-satunya orang di rapat yang paham pekerjaannya, yang tugasnya kan cukup mengiyakan, tidak menambahkan satu kalimat saja: _"sebentar, ini beda kategori"_ hahaha.

Mari hitung bersama: itu sekitar empat _endpoint_ per hari, tujuh hari seminggu, tanpa akhir pekan, tanpa libur nasional, dan tanpa waktu untuk bertanya _"kok bisa ya semantap itu menetapkan angkanya?"_ hahaha. Angka yang indah di _slide_; kurang indah di _keyboard_ hehe~

Nah, tulisan ini episode pertama dari seri **Hijrah Backend**: catatan personal perjalanan memindahkan backend GPS dari PHP ke Go, perjalanan yang tenggat aslinya sudah lama terbang entah ke planet mana. Kalau Anda cari versi teknisnya (kenapa Go, bagaimana pendekatannya, pelajaran apa yang didapat), itu sudah saya tulis di [tulisan April kemarin](/writing/2026/legacy-php-to-go-migration/). Seri ini isinya cerita di balik layar angka-angka itu: keputusan, kekeliruan, dan hal-hal yang tidak muat di catatan teknis hehe~

## Struktur Pasukan (dan Proporsinya)

Awal 2025, tim IT terbagi tiga: dua rekan merawat aplikasi eksisting, dua lagi membangun _backoffice_ admin, dan satu sub-tim khusus migrasi. Sub-tim migrasi beranggotakan dua orang: satu senior yang menyandang mandat, dan satu saya.

Proporsi pengerjaannya, seperti mungkin sudah Anda duga dari nada tulisan ini, tidak sepenuhnya seimbang hahaha.

Dalam praktiknya, seluruh kode Go yang saya ceritakan di seri ini saya tulis sendiri. Kontribusi sang pemegang mandat lebih banyak ke arah menanyakan kabar: _"kok error?"_, _"kok responsnya beda?"_, _"kok makin lemot? Go kan katanya lebih cepat?"_ Pertanyaan-pertanyaan itu sah-sah saja sebagai _feedback_. Hanya saja, sang penanya bukan orang yang membuka _editor_ hehe~

Dan saat isu kecepatan itu ramai, saya sempat menimpali dengan satu catatan teknis: menyebutnya _"migrasi Laravel ke Go"_ sebenarnya tidak _apple to apple_. Laravel itu _framework_, Go itu bahasa. Kalau mau adil membandingkan _framework_, bandingkan Laravel dengan CodeIgniter. Kalau mau adil membandingkan bahasa, bandingkan PHP _native_ dengan Go _native_. Yang terjadi di mandat kami: mengambil bahasanya dari satu sisi dan _framework_-nya dari sisi lain, lalu menagih kecepatannya hehe.

## Warisan yang Diterima

Sistem yang saya terima terdiri dari dua dunia PHP yang hidup berdampingan.

Dunia pertama: API berbasis Laravel 8 dengan sekitar 290 _endpoint_, angkanya jadi 370+ kalau _cron job_ ikut dihitung.[^2] Dunia kedua: aplikasi CodeIgniter 3 yang jadi pintu masuk data, TCP _listener_ yang menerima paket dari puluhan tipe GPS _tracker_ (Teltonika, GT06, JT808, dan puluhan kerabatnya), ditambah 100-an _cron job_ yang mengolah data itu tiap malam.

Datanya juga tidak main-main. Puluhan ribu unit GPS yang _live tracking_, puluhan juta baris data lokasi dan _alert_, semuanya bermuara ke MySQL.

Dan gejalanya sudah terasa sejak minggu-minggu awal. Salah satunya di halaman _dashboard_ estimasi bahan bakar per grup kendaraan. Untuk 30 kendaraan, halaman itu menjalankan ratusan _query_: ambil _device_, ambil tipe _device_-nya, lalu _loop_ tujuh hari ambil ringkasan harian. _Database_-nya kerja rodi, _user_-nya nunggu sambil ngopi. _Hadeh._

Masih ada lagi sih: _endpoint_ yang bisa makan 15 detik sekali panggil. Tapi cerita lengkapnya, lengkap dengan semua hipotesis salah saya, saya simpan buat episode berikutnya. _Stay tuned_ hehe.

## Godaan Rewrite Total

Dengan warisan segitu, godaan pertama yang datang itu manis sekali: _"rewrite_ semuanya dari nol aja. Bersih, modern, enak dibaca."

_Amit-amit._ Untung godaan itu saya tolak, setelah sempat tergiur sebentar, jujur. _Rewrite_ total itu artinya berjudi dengan perilaku sistem yang selama ini dipercaya puluhan ribu _user_. Perilaku yang kadang aneh, kadang tidak terdokumentasi, tapi sudah jadi kenyataan sehari-hari mereka.

Jadi saya pilih jalan yang kurang glamor: **parity-first**, kode lama diperlakukan sebagai _executable spec_. _Endpoint_ baru di Go harus berperilaku identik dengan yang lama, termasuk _quirk_-nya. Kecuali _quirk_ yang jelas-jelas tidak dipakai _frontend_, itu dibersihkan sambil mikir dua kali. Perlahan, satu _endpoint_ pada satu waktu, sambil sistem lama tetap melayani. _Business as usual_, _gitu loh_.

Keputusan ini yang paling menentukan arah semua episode ke depan. Dan detail kenapa parity-first itu justru menyelamatkan banyak waktu (plus contoh _quirk_ yang bikin saya garuk-garuk kepala) saya bedah tuntas di episode keempat.

## Peta Perjalanan

Seri ini berisi delapan episode plus satu epilog. Kalau Anda baca tulisan ini dan episode selanjutnya sudah terbit, berarti semuanya tayang serentak sesuai rencana hehe:

2. **Anatomi _endpoint_ 15 detik**: perjalanan empat hipotesis salah sampai penyebab asli ketemu di tempat yang sama sekali tidak terduga.
3. **Mem-_port_ puluhan _parser_ protokol GPS**: bagaimana mengganti kode yang membaca paket biner dari _tracker_ bermerek-ragam, tanpa merusak data armada yang sudah jalan.
4. **Kode lama sebagai _executable spec_**: parity-first lebih dalam: apa yang harus identik, apa yang boleh dibuang.
5. **Query yang bilang "pakai _index_-ku"**: pelajaran _sargable_ di tabel puluhan juta baris.
6. **Merapikan _monolith_ jadi 14 modul _domain_**: restrukturisasi sambil pesawatnya terbang.
7. **Dari paket TCP ke _time-series database_**: bagaimana data lokasi berpindah dari _listener_ sampai tersimpan rapi.
8. **Refleksi 18 bulan**: yang akan saya lakukan beda kalau mengulang, plus satu rencana mengajar Go yang menunggu jadwal hehe.
9. **Epilog: MySQL, PostgreSQL, lalu MySQL lagi**: kisah mesin _database_ yang pindah haluan dua kali, dan siapa yang membayar ongkosnya.

## Penutup

Mandat yang menunggu saya sejak sebelum hari pertama itu tenggangnya tiga bulan. Saat tulisan ini disusun, perjalanan ini sudah jauh melampaui angka itu. Selisihnya bukan kelambanan; itu ukuran jarak antara angka di _slide_ dan realita di _keyboard_. Dan sebagian besar jarak itu saya tempuh sendirian, dengan bantuan Allah, doa keluarga, dan dukungan istri saya. Tanpa semuanya, seri ini tidak akan ada.

Episode berikutnya kita masuk ke bagian yang paling sering ditanyakan: _kok bisa sih satu_ endpoint _makan 15 detik?_ Sampai ketemu di sana.

Terima kasih sudah tersasar ke sini dan membaca hehe. Semoga harimu menyenangkan!

Sekian. Salam.

[^1]: Detail perusahaan sengaja saya anonimkan, nama rekan kerja diganti peran atau inisial fiktif, dan angka-angka dibulatkan secukupnya untuk bercerita. Tulisan ini soal perjalanan teknisnya, bukan soal perusahaannya.

[^2]: Sekitar 290 _endpoint_ API di Laravel, plus 100-an _cron job_ dan _endpoint_ di aplikasi CodeIgniter 3. Angka "370+" yang saya pakai di [tulisan April](/writing/2026/legacy-php-to-go-migration/) berasal dari jumlahan keduanya.
