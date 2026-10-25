---
title: "Pemilihan Tech Stack: Antara Ego dan Bisnis"
description: "Catatan soal godaan memilih teknologi yang keren, dan cara saya mencoba membedakan rasa penasaran dari kebutuhan proyek."
author: "Faiq Najib Al-Aziz"
date: 2026-04-18
lastmod: 2026-09-11T09:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - arsitektur
  - soft-skill
  - catatan
---

_Nganu_, jadi beberapa waktu lalu saya duduk di sebuah rapat internal, entah via Zoom, entah via Google Meet, sudah lupa. Yang jelas, seorang rekan tiba-tiba semangat sekali mengusulkan sesuatu:

> _"Gimana kalau kita migrasi ke microservices sekalian? Biar modern, biar scalable, biar-"_

_Biar apa?_ Sistem kami saat itu punya dua fitur utama, satu tim kecil berisi empat orang, dan _traffic_ yang paling sibuknya pun tidak sampai seribuan _request_ per hari. Kebutuhan _microservices_? Nol. Tapi semangatnya... seratus hahaha.

Saya tidak menyalahkan beliau. Saya pun pernah begitu. Dan kalau jujur, kadang masih. Godaan memilih teknologi yang keren memang nyata, dan tidak ada salahnya, _selama_ kita sadar itu godaan, bukan keputusan teknis.

Setiap kali harus memilih _tech stack_, saya merasa ada dua suara yang saling tarik-menarik: ego yang ingin terlihat canggih, dan bisnis yang hanya peduli apakah sistemnya berjalan dan menghasilkan nilai.

## Tanda-tanda Ego Mulai Ikut Campur

Kalau mau jujur, keputusan teknis yang didorong ego biasanya punya tanda-tanda seperti ini:

**"Teknologi ini lagi _trending_."**
Buka _Twitter/X_, scroll sebentar, ada saja _thread_ tentang _framework_ baru yang katanya mengubah segalanya. Bulan depan muncul lagi yang katanya lebih mengubah segalanya. Begitu terus. _Fear of Missing Out_ di dunia teknologi itu nyata, dan kalau dituruti terus, ya capek juga.

**"Nanti susah di-_hire_ kalau pakai yang lama."**
Kedengarannya masuk akal. Kadang memang benar, tapi kadang ini cara halus membenarkan keputusan yang sebenarnya lebih soal karier pribadi daripada kebutuhan sistem. Tidak salah juga, kok. Yang penting jujur soal alasannya.

**"Teman-teman komunitas sudah pakai ini semua."**
Ternyata _peer pressure_ tidak berhenti setelah SMA. Di lingkungan _developer_, wujudnya bisa rasa tertinggal karena belum pakai _Kubernetes_, belum coba _Rust_, atau belum _containerize_ semuanya. Padahal _monolith_ kecilnya masih baik-baik saja hehe~

**"Kode yang bagus itu _fun_ untuk ditulis."**
Nah, ini gampang sekali dibungkus dengan alasan profesional. Kita memilih arsitektur kompleks bukan karena dibutuhkan, melainkan karena seru dibuat. Yang kebagian repot nanti? Orang yang meneruskan _codebase_-nya, mungkin termasuk kita sendiri beberapa bulan lagi[^1].

## Bisnis Biasanya Tidak Ikut Memilih Stack-mu

Agak pahit, tapi begitulah: **bisnis biasanya tidak peduli kamu pakai PHP atau Go, REST atau GraphQL, Postgres atau MySQL**. Yang penting sistemnya jalan, cukup cepat, biaya operasinya masuk akal, dan bisa dikembangkan saat kebutuhan baru datang.

Dalam praktiknya, pertanyaan bisnis biasanya berkisar di hal-hal ini:

| Pertanyaan Engineer | Pertanyaan Bisnis |
|---|---|
| Apakah teknologi ini _state-of-the-art_? | Apakah bisa selesai tepat waktu? |
| Apakah arsitekturnya _elegant_? | Apakah tim bisa _maintain_ ini? |
| Apakah ini bisa _scale_ sampai jutaan _user_? | Berapa biaya _server_ tiap bulannya? |
| Apakah ini pakai bahasa yang populer? | Kalau ada yang keluar tim, berapa lama onboarding _developer_ baru? |

Kalau dilihat begitu, pertanyaannya memang beda. Saya sendiri sering lebih sibuk memikirkan kolom kiri, sementara yang menggaji saya lebih peduli kolom kanan. Ya, kadang perlu diingatkan.

Bukan berarti aspek teknis boleh diabaikan. Pilihan teknis yang buruk hari ini bisa jadi utang teknis mahal besok, dan itu juga masalah bisnis. Jadi dua sisinya perlu dilihat, bukan salah satunya saja.

## Pertanyaan yang Sekarang Saya Ajukan

Setelah beberapa kali salah pilih (dan ikut menanggung akibatnya hehe), sekarang saya coba bertanya empat hal ini sebelum memilih _stack_ atau arsitektur baru:

### 1. Apa tim masih bisa merawat ini enam bulan lagi?

Pertanyaannya bukan "bisa saya _implement_?", tapi "bisa tim saya hidup bersama ini?" Kalau saya pergi besok, orang lain masih bisa melanjutkannya atau malah _breakdown_ selama dua minggu?

Saya ingin teknologi yang dipilih tetap bisa dipahami oleh orang yang paling junior di tim[^2]. Kalau tidak, kita sedang membangun _knowledge silo_, dan itu berbahaya.

### 2. Ini menyelesaikan masalah sekarang, atau masalah khayalan nanti?

_Premature optimization_ itu musuh _productivity_. Membangun sistem _event-driven_ yang kompleks untuk aplikasi yang belum tentu mencapai jutaan _user_ adalah keputusan yang sangat mahal, baik dari sisi waktu maupun kompleksitas.

Pegangan saya: **bereskan masalah yang ada sekarang dengan solusi yang cukup untuk kebutuhan saat ini**. Kalau nanti memang perlu _scale_, kita _refactor_ berdasarkan bukti. Bukan berdasarkan ramalan saya yang sok tahu hehe.

### 3. Berapa ongkos sebenarnya?

Bukan cuma biaya _cloud_, waktu juga dihitung. Berapa lama _setup_-nya? _Onboarding_-nya? _Debugging_ saat ada masalah? Berapa lama _developer_ baru perlu supaya paham sistemnya?

Teknologi yang canggih tapi butuh seminggu untuk _setup_ lokal itu mahal, bahkan sebelum satu baris kode bisnis ditulis.

### 4. Ini mempercepat _time-to-market_ atau malah menahannya?

Kecepatan _delivery_ itu sangat penting bagi bisnis. Fitur yang telat enam bulan bisa berarti _opportunity_ yang hilang, _user_ yang pergi ke kompetitor, atau _investor_ yang kehilangan kepercayaan.

Kalau pilihan teknologi kita mempercepat _delivery_, bagus. Kalau justru memperlambat, pertimbangkan ulang, meskipun teknologinya secara teknis lebih "benar".

## Contoh yang Pernah Saya Alami

Boleh _self-reflect_ sebentar? Saya pernah menulis tentang [migrasi backend dari PHP ke Go](/writing/2026/legacy-php-to-go-migration/). Proyeknya punya 370+ _endpoint_, 33 _entity_, dan hampir 200 ribu baris kode.

Dan pertanyaan yang jujur saya ajukan ke diri sendiri saat itu adalah: **apakah ini keputusan bisnis, atau ego saya yang ingin kerja dengan Go?**

Jawabannya: dua-duanya. Saya memang penasaran dengan Go, tapi bukan cuma itu hehe~

Sisi **ego**-nya: ya, saya penasaran dengan Go. Saya ingin _hands-on_ experience yang lebih dalam. Saya suka cara Go menangani _concurrency_. Itu nyata dan saya tidak akan mengingkarinya.

Tapi sisi **bisnis**-nya juga nyata:

- Sistem lama punya masalah arsitektur yang serius, bukan sekadar PHP-nya, tapi ketiadaan pemisahan _layer_ yang membuat setiap perubahan berisiko tinggi
- _Deploy_ yang tidak bisa diprediksi sudah beberapa kali menyebabkan insiden di _production_
- _Testing coverage_ yang rendah membuat tim takut untuk _refactor_, padahal _refactor_ dibutuhkan
- Satu _binary_ Go menghilangkan masalah _dependency hell_ di _server_ yang selama ini makan waktu tim _ops_

Jadi, Go bukan dipilih semata karena keren, tapi karena di konteks spesifik tersebut, _trade-off_-nya masuk akal: biaya migrasi[^3] yang besar _upfront_, tapi dengan _long-term benefit_ yang terukur.

Buat saya, yang penting bisa menjelaskan _trade-off_-nya dengan jujur dan siap bertanggung jawab atas pilihan itu. Bukan pura-pura tidak punya ego sama sekali.

## Ego Juga Ada Gunanya

**Ego sebagai _developer_ tidak selalu buruk.** Kita jadi ingin belajar hal baru, menulis kode yang lebih bersih, dan mendorong solusi yang lebih baik. Itu semua ada manfaatnya.

Masalahnya muncul kalau ego mulai mengaburkan penilaian. Kita memilih teknologi supaya terlihat pintar, bukan karena menyelesaikan masalah. Kita bikin sistem rumit karena seru, lalu membela pilihan yang salah karena gengsi mengakuinya.

Saya sendiri masih perlu mengecek motivasi itu dari waktu ke waktu. Kadang alasannya memang bisnis, kadang saya cuma ingin mencoba teknologi baru. Tidak apa-apa, asal tidak mencampuradukkan keduanya saat menjelaskan keputusan ke tim.

Saya belum tentu selalu bisa membedakannya dengan benar. Tapi setidaknya pertanyaannya layak diajukan sebelum kita telanjur membangun semuanya.

Nah, itu dulu dari saya. Terima kasih sudah tersasar ke sini dan membaca sampai selesai hehe~

[^1]: Dan biasanya itu adalah diri kita sendiri, enam bulan kemudian, yang sudah lupa kenapa dulu bikin seperti itu hahaha.
[^2]: Ini bukan berarti tidak boleh pakai teknologi yang advanced. Tapi artinya ada tanggung jawab untuk dokumentasi, onboarding plan, dan memastikan knowledge tidak tersentralisasi di satu orang.
[^3]: Migrasi dengan pendekatan bertahap per-modul, bukan _big bang rewrite_, pelajaran pahit dari banyak tim yang pernah mencoba dan gagal.
