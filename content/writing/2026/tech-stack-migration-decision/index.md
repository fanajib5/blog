---
title: "Catatan Keputusan: Kapan Tech Stack Harus Dimigrasi"
description: "Sebuah catatan pengambilan keputusan, kapan tech stack yang sudah ada perlu dimigrasi, kapan cukup di-refactor, dan bagaimana membaca sinyal dari sisi bisnis."
author: "Faiq Najib"
date: 2026-04-15
lastmod: 2026-04-15
draft: false
toc: true
comments: false
tags:
  - catatan
  - arsitektur
  - migration
---

Ada momen di mana saya berhenti ngetik, _lean back_ di kursi, dan sadar: _"Ini bukan lagi soal refactor."_

Waktu itu saya lagi _nge-debug_ satu _bug_ di sistem GPS _tracker_ yang sudah jalan bertahun-tahun[^1]. _Bug_-nya _simple_, laporan posisi kendaraan tidak _update_ di _dashboard_. Tapi untuk memperbaikinya, saya harus _trace_ lewat empat file berbeda, dua _layer_ _business logic_ yang _nyangkut_ satu sama lain, dan satu _query_ yang ditulis tanpa _index_. _Satu jam_ kemudian, _fix_-nya cuma dua baris. Dua baris.

Bukan _bug_-nya yang bikin saya berpikir ulang. Tapi **waktu yang dibutuhkan untuk menemukan dua baris itu**. Rasanya seperti mencari jarum di tumpukan jerami, tapi jarumnya ternyata ada di kantong celana sendiri hehe~

_Nganu_, tulisan ini bukan tentang bahasa pemrograman tertentu atau solusi teknis tertentu. Ini catatan pribadi tentang **proses berpikir** di balik keputusan migrasi _tech stack_, kapan saatnya, kapan belum, dan bagaimana saya menilainya dari sisi yang bukan cuma teknis. Soalnya sering banget kan denger diskusi teknis yang ujung-ujungnya jadi debat bahasa pemrograman A vs B, padahal masalahnya bukan di situ hahaha.

## Kondisi Sistem Saat Itu

Proyek GPS _tracker_ yang saya tangani bukan proyek kecil. Angkanya kurang lebih begini:

- **370+ API _endpoint_** yang melayani berbagai kebutuhan, dari _real-time tracking_ sampai _report generation_
- **33 _database entity_** yang saling berhubungan
- **~194.000 baris kode** yang sudah ditulis bertahun-tahun oleh beberapa _developer_[^2]

Tapi angka-angka itu sebenarnya bukan masalahnya. _Ya ampun_, jumlah baris kode itu memang terlihat banyak, tapi percaya deh itu bukan yang bikin pusing. Masalahnya ada di **gejala-gejala** yang muncul:

### 1. Fitur Baru yang Seharusnya Cepat, Jadi Lambat

Fitur yang dulu bisa dikirim dalam dua hari, sekarang butuh dua minggu. Bukan karena _developer_-nya lambat, tapi karena setiap perubahan berdampak ke bagian yang tidak terduga. Satu _field_ baru di satu _entity_ bisa merambat ke lima file berbeda.

Dari sisi bisnis, ini berarti **kecepatan deliver value ke _user_ menurun**. Fitur yang client minta makin lama datang, dan jendela kompetitif makin mengecil.

### 2. _Bug_ yang Hanya Muncul di _Production_

_Kalau di lokal aman, tapi di production error, dimana harusnya saya cari?_ (pertanyaan yang sering bikin saya begadang sambil _scrolling Stack Overflow_ hahaha)

Ini _classic symptom_ dari sistem yang tightly coupled. Kode yang berjalan di satu _environment_ tidak berjalan sama di _environment_ lain karena ada _side effect_ yang tidak terduga. _Debug_-nya bukan soal logika, tapi soal _mengapa_ konteks _production_ berbeda dari ekspektasi. Pernah waktu itu saya sampai _remote_ ke _server production_ jam 2 pagi cuma buat _check_ satu environment variable yang ternyata... memang belum di-_set_. _Facepalm_.

Dari sisi bisnis, ini artinya **tidak ada kepastian**. Client bisa _get_ laporan yang salah di pagi hari, dan tidak ada yang tahu kenapa sampai siang.

### 3. _Onboarding_ _Developer_ Baru Makin Lama

Dulu, _developer_ baru bisa mulai _contribute_ dalam seminggu. Saat itu, butuh hampir sebulan baru mereka nyaman _ngode_ tanpa takut merusak sesuatu. Bukan karena mereka kurang _skill_, tapi karena _codebase_ butuh **context** yang banyak untuk dipahami. Saya masih ingat ekspresi salah satu _developer_ baru waktu dia baru pertama kali buka _codebase_-nya. Mukanya... _yah_, seperti orang yang baru bangun tidur terus langsung disuruh lari marathon hehe~

Dari sisi bisnis, ini berarti **biaya menambah kapasitas tim meningkat**. Setiap _developer_ baru butuh waktu lebih lama sebelum jadi produktif.

### 4. _Fear_ Setiap _Deploy_

Setiap kali mau _deploy_, ada _feeling_ "semoga kali ini tidak ada yang _break_". Bukan karena tidak ada _testing_, tapi karena _testing_ yang ada tidak _cover_ semua _edge case_. Dan di sistem yang tightly coupled, satu perubahan kecil bisa punya efek _domino_. Seperti menarik satu benang di sweater, eh taunya yang lain ikut rontok juga. _Deploy_ di hari Jumat sore? _Amit-amit jabang bayi_, jangan sampai hahaha.

Dari sisi bisnis, ini artinya **tim jadi konservatif**. Fitur yang sebenarnya aman ditunda karena takut efek sampingnya. Inovasi melambat bukan karena kurang ide, tapi karena takut _break_.

## Pertanyaan-Pertanyaan yang Saya Ajukan

Setelah sadar bahwa gejala-gejala di atas bukan _normal_, saya mulai mengajukan pertanyaan-pertanyaan ini ke diri saya sendiri. Bukan pertanyaan teknis, tapi pertanyaan yang membantu saya memahami **apakah masalahnya bisa diselesaikan tanpa migrasi**.

### "Apakah Masalahnya di _Tool_ atau di Cara Kita Pakai?"

Ini pertanyaan pertama dan paling penting. Kalau masalahnya cara kita menulis kode, misalnya, tidak ada _layering_, tidak ada _testing_, tidak ada _code review_, maka migrasi _tech stack_ tidak akan menyelesaikan apa-apa. Kita cuma pindah masalah ke _tool_ baru.

Dalam kasus GPS _tracker_ ini, jawabannya: **keduanya**. Cara kode ditulis memang perlu diperbaiki, tapi bahasa dan _framework_ yang dipakai juga punya _limitation_ yang membuat penulisan kode yang _clean_ jadi lebih sulit dari seharusnya. _Dynamically typed language_[^3] tanpa _enforcement_ di _runtime_ membuat _bug_ _type-related_ muncul di _production_, bukan saat _development_. Dan _bug type-related_ di _production_ itu... _hadeh_, bikin hati dag-dig-dug setiap kali ada notifikasi error hehe.

### "Kalau Kita _Refactor_ Saja, Apakah Cukup?"

Pertanyaan kedua: kalau kita _invest_ waktu untuk merapikan arsitektur di _tech stack_ yang ada, apakah hasilnya sepadan?

Di kasus ini, saya _calculate_ kasar: untuk _refactor_ 370+ _endpoint_ dengan arsitektur yang _proper_ di PHP, butuh waktu yang hampir sama dengan migrasi ke _stack_ baru. Bedanya, kalau _refactor_ di PHP, kita tetap _stuck_ dengan beberapa _limitation_ fundamental (_type safety_, _concurrency_, _deployment complexity_). Kalau migrasi, kita _unlock_ hal-hal baru.

Tapi ini **kasus saya**, _ya_. Bukan berarti _refactor_ selalu salah. Kalau sistemnya lebih kecil, atau kalau _limitation_ _stack_-nya tidak terlalu menghambat, _refactor_ adalah pilihan yang jauh lebih bijak. Jangan sampai karena baca tulisan ini terus langsung migrasi semua sistem tanpa pikir panjang. Nanti malah jadi seperti cerita _horor_ yang pernah saya dengar, 2 tahun migrasi, eh akhirnya balik lagi ke sistem lama hahaha.

### "Berapa Biaya dari TIDAK Melakukan Apa-apa?"

Ini pertanyaan yang sering luput. Kita sering hitung biaya migrasi, waktu, uang, risiko, tapi jarang hitung **biaya dari tetap stagnan**.

Dalam kasus GPS _tracker_:
- Fitur yang makin lambat dikirim = client mungkin pindah ke kompetitor
- _Bug_ yang muncul di _production_ = _trust_ client menurun
- Onboarding yang makin lama = biaya rekrutmen efektif meningkat
- _Fear_ saat _deploy_ = inovasi melambat

Kalau total biaya _inaction_ dalam satu tahun **melebihi** estimasi biaya migrasi, secara bisnis, keputusannya cukup jelas.

### "Apakah Tim Kita Bisa Menangani Migrasi?"

Migrasi _tech stack_ butuh _skill_ baru. Tim harus belajar _stack_ yang mungkin belum familiar. Ada _ramp-up time_. Ada _mistakes_ yang pasti terjadi.

Pertanyaannya bukan "bisakah?" tapi "apakah kita punya **ruang** untuk melakukannya?" Kalau tim sudah _overwhelmed_ dengan _deadline_ dan _bug fix_, migrasi hanya akan menambah beban. Tapi kalau ada _window_, entah itu antar proyek, atau saat kapasitas sedang cukup, itu saat yang tepat untuk mulai.

Dalam kasus saya, kami tidak migrasi semua sekaligus. Kami mulai dari satu _module_, satu _endpoint_ pada satu waktu, sambil tetap menjalankan _business as usual_. _Pelan-pelan asal kenceng_, begitu kata teman saya hehe. Detail teknisnya ada di [catatan migrasi saya yang lain](/writing/2026/legacy-php-to-go-migration/).

### "Kapan Kita Tahu Migrasi Itu Berhasil?"

Kalau kita tidak punya definisi "berhasil", kita tidak bisa tahu kapan harus berhenti. Untuk saya, _success criteria_-nya:

1. **Fitur baru bisa dikirim lebih cepat** dari sebelumnya
2. **_Bug_ _production_ berkurang secara terukur**
3. **_Developer_ baru bisa _onboard_ lebih cepat**
4. **_Deploy_ tidak lagi ditakuti**

Kalau setelah migrasi, angka-angka ini membaik, maka migrasi berhasil. Kalau tidak, maka kita perlu evaluasi ulang.

## Kerangka Berpikir: Bukan Soal Bahasa, Soal Momentum

Setelah melewati proses tanya-jawab di atas, saya menyimpulkan kerangka berpikir sederhana: **tiga kondisi yang harus dipenuhi** sebelum migrasi masuk akal.

### 1. Masalahnya Struktural, Bukan Masalah _Skill_

Kalau masalahnya cuma "kita belum _paham_ cara pakai _tool_ ini dengan baik", maka solusinya belajar, bukan pindah. Migrasi cuma masuk akal ketika **arsitektur sistem itu sendiri** yang menjadi penghambat, bukan kemampuan tim.

### 2. Biaya _Inaction_ Sudah Terukur dan Nyata

Bukan _feeling_ "kayaknya sih makin lambat", tapi **data**. Fitur yang dulu 2 hari sekarang 2 minggu. _Bug_ _production_ naik 30% dalam 6 bulan. Onboarding makan 4 minggu bukan 1 minggu. Kalau datanya tidak ada, kumpulkan dulu. Jangan migrasi berdasarkan _assumption_.

### 3. Tim Punya Kapasitas untuk Menjalankan

Migrasi butuh waktu, energi, dan fokus. Kalau tim sedang di _peak season_, atau kalau tidak ada _budget_ untuk _learning curve_, lebih baik tunda. Migrasi yang _force_ di waktu yang salah bisa lebih merusak daripada _codebase_ yang _legacy_.

---

Kalau ketiga kondisi terpenuhi: **migrasi masuk akal**. Kalau satu saja tidak terpenuhi: lebih baik _refactor_, atau tahan dulu sampai kondisinya mendukung.

## Keputusan dan Apa yang Terjadi

Saya memutuskan untuk migrasi. Bukan keputusan dalam semalam, tapi proses beberapa minggu setelah mengumpulkan data dan berdiskusi dengan tim. Ada _moment_ di mana saya sempat ragu juga sih, _"Apa beneran harus migrasi? Apa nggak cukup di-refactor aja?"_ Tapi setelah melihat datanya, _ya udah_, keputusan diambil.

Hasilnya? _Alhamdulillah_. Fitur baru yang dulu butuh dua minggu sekarang bisa dikirim dalam hitungan hari. _Bug_ _production_ menurun. Onboarding _developer_ baru lebih cepat. Dan yang paling penting: _deploy_ tidak lagi ditakuti. Sekarang _deploy_ di hari Jumat sore pun... _yah_, masih agak deg-degan sih, tapi nggak separah dulu hahaha.

Untuk detail teknis bagaimana migrasi dilakukan, pendekatan per-_module_, _pattern_ yang dipakai, dan pelajaran teknisnya, ada di [catatan terpisah](/writing/2026/legacy-php-to-go-migration/) yang saya tulis khusus untuk sisi implementasinya.

## Pelajaran

### 1. Kumpulkan Data Dulu, Keputusan Kemudian

Jangan migrasi karena "kayaknya sih butuh" atau karena _tech stack_ baru lagi _trending_[^4]. Kumpulkan datanya, berapa lama fitur baru dikirim, berapa sering _bug_ muncul, berapa lama onboarding. Kalau datanya mendukung, keputusannya jauh lebih mudah dijual ke _stakeholder_. Percayalah, bilang ke atasan _"kita harus migrasi karena Go itu keren"_ itu nggak akan berhasil. Tapi kalau bilang _"fitur yang dulu 2 hari sekarang 2 minggu, ini datanya"_, baru deh ngobrol hehe.

### 2. Migrasi Itu Keputusan Bisnis, Bukan Cuma Teknis

Sering kali diskusi migrasi _stuck_ di "bahasa A lebih baik dari bahasa B". Padahal pertanyaan yang seharusnya diajukan: "apakah _tech stack_ saat ini masih memungkinkan kita _deliver value_ dengan kecepatan yang dibutuhkan?" Kalau jawabannya tidak, maka saatnya bicara migrasi. Soalnya kan tujuan akhirnya bikin produk yang berguna buat _user_, bukan menang debat di forum online hahaha.

### 3. _Refactor_ vs Migrasi Bukan Binary

Bukan pilihan antara "refactor semua" atau "migrasi semua". Kadang jawabannya _refactor_ dulu, kemudian migrasi bertahap. Kadang jawabannya _refactor_ saja sudah cukup. Konteks dan skala sistem menentukan. _Life is not always black and white_, begitu juga dengan keputusan teknis hehe~

### 4. Hitung Juga Biaya Tidak Berbuat Apa-apa

Kita sering fokus pada "berapa biaya migrasi" dan lupa bertanya "berapa biaya kalau kita tidak migrasi?" Kadang, biaya tetap diam jauh lebih mahal dalam jangka panjang. Seperti kata pepatah, _"kalau sakit gigi, mending langsung ke dokter gigi daripada nahan-nahan sampai parah"_. _Eh_, ada pepatah kayak gitu nggak sih? _Yah_, pokoknya kalian paham maksud saya hahaha.

## Penutup

Keputusan migrasi _tech stack_ itu personal, tergantung pada konteks, tim, _timeline_, dan banyak faktor lain. Tidak ada _framework_ yang bisa menjawab semua situasi. Tapi dengan mengajukan pertanyaan yang tepat dan mengumpulkan data yang cukup, keputusan yang diambil jauh lebih _sound_ daripada mengikuti _hype_.

Semoga catatan ini bermanfaat buat yang lagi galau mau migrasi atau nggak. Kalau kamu sedang menghadapi dilema serupa dan ingin mendiskusikannya, [hubungi saya](/contact/). Atau lihat [layanan](/services/) yang bisa saya bantu.

[^1]: Sistem GPS _tracker_ yang sudah berjalan sejak beberapa tahun lalu, dengan berbagai penambahan fitur dan _patch_ di sana-sini.
[^2]: Banyak _developer_ yang datang dan pergi selama bertahun-tahun. Masing-masing punya gaya _coding_ sendiri. Jadinya... _yah_, _mixed styles_ hehe.
[^3]: Bukan berarti _dynamically typed language_ itu jelek, _ya_. Cuma untuk kasus tertentu, _static typing_ bisa sangat membantu.
[^4]: _FOMO_ (_Fear of Missing Out_) dalam dunia _tech_ itu nyata. Tapi jangan sampai keputusan teknis diambil cuma karena takut ketinggalan _trend_.

---

_Tag: [catatan](/tags/catatan/) · [arsitektur](/tags/arsitektur/) · [migration](/tags/migration/)_
