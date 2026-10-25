---
title: "Hijrah Backend (1): Hari Pertama Disodori Warisan 370+ Endpoint"
description: "Ep 1 seri Hijrah Backend: cerita di balik migrasi backend GPS dari PHP ke Go. Dari lowongan kerja yang isinya menjalankan keputusan orang lain, mandat tiga bulan, sampai warisan 370+ endpoint."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:01+07:00
lastmod: 2026-09-10T15:30:00+07:00
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

Cerita migrasi ini dimulai bahkan sebelum saya resmi bekerja.

Di sebuah perusahaan GPS tracking di Surabaya, salah satu senior tim mendapat mandat me-_rewrite_ sistem eksisting. Sampai hari ini saya tidak tahu persis apa yang dibicarakan di rapat internalnya; yang saya tahu hanya hasilnya: mereka memutuskan pindah ke Go. Dan baru setelah keputusan itu mantap, lowongan pun dibuka.

Jadi posisi saya di rekrutmen itu agak unik: saya bukan ikut menentukan arah proyeknya. Saya datang untuk menjalankan keputusan yang sudah dibuat orang lain.

Di _interview_, pertanyaan utamanya wajar: bisa tidak, me-_migrasi_ Laravel ke Go? Sempat ada tawaran tes, semacam _"nanti kami tunjukkan contoh aplikasi kami, coba kerjakan dalam seminggu"_. Tawaran itu akhirnya tidak jadi. Ya sudah, _interview_ berjalan seperti biasa, dan saya diterima.

Nah, ada satu kesepakatan yang ternyata sudah menunggu saya sejak sebelum hari pertama (entah lahir kapan): para pengambil keputusan sepakat proyek migrasi ini harus tuntas _develop_ plus _testing_ dalam **tiga bulan**.

Tiga bulan. Untuk 370+ _endpoint_.[^2] Ehem.

Angkanya lahir dari keyakinan yang kedengarannya masuk akal di rapat: migrasi Laravel ke Go itu cepat dan mudah, tinggal pindahin, langsung siap pakai di _production_. Cukup _export_-import, kan? Yang belum sempat ditanyakan: kenapa satu-satunya orang di rapat yang paham pekerjaannya, yang tugasnya cukup mengiyakan, tidak menyela dengan satu kalimat: _"sebentar, ini beda kategori"_.

Kalau dihitung, sekitar empat _endpoint_ per hari, tujuh hari seminggu, tanpa akhir pekan atau libur nasional. Waktu untuk bertanya _"kok bisa ya semantap itu menetapkan angkanya?"_ juga tidak masuk hitungan. Cantik di _slide_, kurang cantik di _keyboard_.

Ini episode pertama seri **Hijrah Backend**, catatan saya tentang memindahkan backend GPS dari PHP ke Go. Tenggat aslinya sudah lama lewat. Versi teknisnya (kenapa Go, pendekatannya, dan apa yang saya pelajari) sudah saya tulis di [tulisan April kemarin](/writing/2026/legacy-php-to-go-migration/). Di seri ini saya cerita hal-hal yang tidak muat di catatan teknis: keputusan, kekeliruan, dan orang-orang di balik migrasinya.

## Struktur Pasukan (dan Proporsinya)

Awal 2025, tim IT terbagi tiga: dua rekan merawat aplikasi eksisting, dua lagi membangun _backoffice_ admin, dan satu sub-tim khusus migrasi. Sub-tim migrasi isinya dua orang: satu senior pemegang mandat, dan satu saya.

Pembagian kerjanya ya... kurang seimbang.

Praktiknya, semua kode Go yang saya ceritakan di seri ini saya tulis sendiri. Kontribusi sang pemegang mandat lebih banyak berupa pertanyaan: _"kok error?"_, _"kok responsnya beda?"_, _"kok makin lemot? Go kan katanya lebih cepat?"_ Semuanya sah sebagai _feedback_. Hanya saja, yang bertanya bukan yang membuka _editor_.

Waktu isu kecepatan itu ramai, saya sempat menimpali dengan catatan teknis: menyebutnya _"migrasi Laravel ke Go"_ sebenarnya tidak _apple to apple_. Laravel itu _framework_, Go itu bahasa. Mau adil membandingkan _framework_? Bandingkan Laravel dengan CodeIgniter. Mau adil membandingkan bahasa? Bandingkan PHP _native_ dengan Go _native_. Yang terjadi di mandat kami: bahasanya diambil dari satu sisi, _framework_-nya dari sisi lain, lalu kecepatannya ditagih hehe.

## Warisan yang Diterima

Sistem yang saya terima ternyata dua dunia PHP yang hidup berdampingan.

Dunia pertama: API Laravel 8 dengan sekitar 290 _endpoint_, jadi 370+ kalau _cron job_ ikut dihitung.[^2] Dunia kedua: aplikasi CodeIgniter 3 yang jadi pintu masuk data, TCP _listener_ yang menerima paket dari puluhan tipe GPS _tracker_ (Teltonika, GT06, JT808, dan puluhan kerabatnya), ditambah 100-an _cron job_ yang mengolah data itu tiap malam.

Datanya juga tidak main-main. Puluhan ribu unit GPS _live tracking_, puluhan juta baris data lokasi dan _alert_, semuanya masuk ke MySQL.

Gejalanya sudah kelihatan sejak minggu-minggu awal. Di halaman _dashboard_ estimasi bahan bakar per grup kendaraan, misalnya, 30 kendaraan memicu ratusan _query_: ambil _device_, ambil tipe _device_-nya, lalu _loop_ tujuh hari untuk ringkasan harian. _Database_-nya kerja rodi, _user_-nya menunggu sambil ngopi.

Ada juga _endpoint_ yang bisa makan 15 detik sekali panggil. Saya sempat menyalahkan beberapa hal sebelum ketemu penyebabnya. Ceritanya ada di episode berikutnya.

## Godaan Rewrite Total

Dengan warisan segitu, godaan pertama terasa manis: _"rewrite_ semuanya dari nol aja. Bersih, modern, enak dibaca."

_Amit-amit._ Jujur, saya sempat tergiur sebentar. Tapi _rewrite_ total itu berarti berjudi dengan perilaku sistem yang selama ini dipercaya puluhan ribu _user_. Perilakunya kadang aneh, kadang tidak terdokumentasi, tapi sudah jadi kenyataan sehari-hari mereka.

Jadi saya pilih jalan yang kurang glamor: **parity-first**, kode lama diperlakukan sebagai _executable spec_. _Endpoint_ baru di Go harus berperilaku identik dengan yang lama, _quirk_-nya juga. Kecuali _quirk_ yang jelas-jelas tidak dipakai _frontend_, itu dibersihkan sambil mikir dua kali. Pelan-pelan, satu _endpoint_ per satu waktu, sementara sistem lama tetap melayani. _Business as usual_, _gitu loh_.

Keputusan ini yang menentukan arah semua episode berikutnya. Kenapa parity-first justru menghemat banyak waktu (plus contoh _quirk_ yang bikin saya garuk-garuk kepala) saya bahas di episode keempat.

## Peta Perjalanan

Seri ini isinya delapan episode plus satu epilog. Kalau kamu baca ini dan episode selanjutnya sudah terbit, berarti semuanya tayang serentak sesuai rencana hehe:

2. **Anatomi _endpoint_ 15 detik**: empat hipotesis salah dulu, baru penyebab aslinya ketemu di tempat yang sama sekali tidak terduga.
3. **Mem-_port_ puluhan _parser_ protokol GPS**: mengganti kode pembaca paket biner dari berbagai merek _tracker_, tanpa merusak data armada yang sudah jalan.
4. **Kode lama sebagai _executable spec_**: parity-first lebih dalam, apa yang harus identik dan apa yang boleh dibuang.
5. **Query yang bilang "pakai _index_-ku"**: pelajaran _sargable_ di tabel puluhan juta baris.
6. **Merapikan _monolith_ jadi 14 modul _domain_**: restrukturisasi sambil pesawatnya terbang.
7. **Dari paket TCP ke _time-series database_**: perjalanan data lokasi dari _listener_ sampai tersimpan rapi.
8. **Refleksi 18 bulan**: apa yang akan saya lakukan beda kalau mengulang, plus rencana mengajar Go yang masih menunggu jadwal hehe.
9. **Epilog: MySQL, PostgreSQL, lalu MySQL lagi**: kisah mesin _database_ yang pindah haluan dua kali, dan siapa yang bayar ongkosnya.

## Penutup

Mandat itu memberi saya tiga bulan. Waktu tulisan ini dibuat, migrasinya sudah jauh melewati tenggat tersebut. Jarak antara angka di _slide_ dan kenyataan di _keyboard_ saya lalui dengan bantuan Allah, doa keluarga, dan dukungan istri. Tanpa mereka, catatan ini tidak akan ada.

Episode kedua kembali ke _endpoint_ 15 detik tadi. Spoiler: masalahnya bukan di _query_ yang saya curigai.

Kalau kamu cari tutorial membangun backend GPS dari nol, saya menulisnya terpisah di [seri GPS Backend](/writing/2026/memahami-gps-protocol/). Seri Hijrah ini catatan di balik pekerjaan itu.

Terima kasih sudah membaca!

[^1]: Detail perusahaan sengaja saya anonimkan, nama rekan kerja diganti peran atau inisial fiktif, dan angka-angka dibulatkan secukupnya untuk bercerita. Tulisan ini soal perjalanan teknisnya, bukan soal perusahaannya.

[^2]: Sekitar 290 _endpoint_ API di Laravel, plus 100-an _cron job_ dan _endpoint_ di aplikasi CodeIgniter 3. Angka "370+" yang saya pakai di [tulisan April](/writing/2026/legacy-php-to-go-migration/) berasal dari jumlahan keduanya.
