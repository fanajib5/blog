---
title: "Pemilihan Tech Stack: Antara Ego dan Bisnis"
description: "Godaan memilih teknologi terbaru itu nyata, tapi apakah keputusan itu lahir dari logika bisnis, atau sekadar ego kita sebagai developer?"
author: "Faiq Najib"
date: 2026-04-18
lastmod: 2026-04-22
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

Tulisan ini tentang tegangan antara dua suara yang sering bertengkar di kepala saya ketika harus memilih _tech stack_: suara ego yang ingin terlihat canggih, dan suara bisnis yang hanya peduli apakah sistemnya jalan dan menghasilkan nilai.

## Ketika Ego Berbicara

Ciri-ciri keputusan teknis yang didorong ego itu sebenarnya cukup mudah dikenali, kalau kita mau jujur:

**"Teknologi ini lagi _trending_."**
Buka _Twitter/X_, scroll sebentar, langsung ada tiga _thread_ tentang framework baru yang katanya mengubah segalanya. Satu bulan kemudian, ada lagi framework baru yang mengubah yang tadi. Dan siklus itu terus berputar. _Fear of Missing Out_ di dunia teknologi itu nyata sekali, dan berbahaya kalau tidak dikendalikan.

**"Nanti susah di-_hire_ kalau pakai yang lama."**
Ini argumen yang kedengarannya masuk akal, tapi seringkali dipakai untuk membenarkan keputusan yang sebenarnya bukan soal sistem, melainkan soal karier pribadi. Yang mana tidak salah! Tapi harus jujur bahwa motivasinya memang itu, bukan kebutuhan sistem.

**"Teman di komunitas semuanya sudah pakai ini."**
_Peer pressure_ itu tidak berhenti di masa SMA. Di dunia _developer_, bentuknya adalah rasa tidak enak kalau belum pakai _Kubernetes_, belum coba _Rust_, atau belum _containerize_ semuanya, padahal sistem-nya _monolith_ kecil yang baik-baik saja hehe~

**"Kode yang bagus itu _fun_ untuk ditulis."**
Nah, yang ini paling berbahaya karena terselubung dalam jubah profesionalisme. Kita memilih arsitektur yang kompleks bukan karena dibutuhkan, tapi karena... _exciting_ untuk diimplementasikan. Dan akhirnya yang menanggung beban adalah orang yang meneruskan _codebase_ tersebut[^1].

## Bisnis Tidak Peduli Stack-mu

Ini kenyataan yang sedikit pahit tapi perlu dikatakan: **bisnis tidak peduli kamu pakai PHP atau Go, REST atau GraphQL, Postgres atau MySQL**, selama sistemnya berjalan, cepat, murah untuk dioperasikan, dan mudah dikembangkan ketika ada kebutuhan baru.

Yang benar-benar dipedulikan bisnis:

| Pertanyaan Engineer | Pertanyaan Bisnis |
|---|---|
| Apakah teknologi ini _state-of-the-art_? | Apakah bisa selesai tepat waktu? |
| Apakah arsitekturnya _elegant_? | Apakah tim bisa _maintain_ ini? |
| Apakah ini bisa _scale_ sampai jutaan _user_? | Berapa biaya _server_ tiap bulannya? |
| Apakah ini pakai bahasa yang populer? | Kalau ada yang keluar tim, berapa lama onboarding _developer_ baru? |

Perhatikan betapa kedua kolom itu bicara hal yang sama sekali berbeda. Dan seringkali kita terlalu fokus di kolom kiri, sementara yang membayar gaji kita berpikir dari kolom kanan.

Bukan berarti kita harus abaikan aspek teknis. Pilihan teknis yang buruk hari ini bisa jadi hutang teknis yang mahal besok, _dan itu juga_ kekhawatiran bisnis. Maksudnya, **kedua sisi perlu dipertimbangkan**, bukan cuma satu.

## Cara Memilih yang Tidak Menyakitkan

Setelah beberapa kali salah pilih (dan menanggung akibatnya hehe), saya punya empat pertanyaan yang sekarang selalu saya ajukan sebelum memutuskan _stack_ atau arsitektur baru:

### 1. Apakah tim saya bisa _maintain_ ini dalam 6 bulan?

Bukan "bisakah saya _implement_ ini?", tapi "bisakah tim saya hidup bersama ini dalam jangka panjang?" Kalau saya yang pergi besok, apakah orang lain bisa melanjutkan tanpa _breakdown_ dua minggu pertama?

Teknologi yang kita pilih harus bisa dipahami oleh orang yang paling junior di tim[^2]. Kalau tidak, kita sedang membangun _knowledge silo_, dan itu berbahaya.

### 2. Apakah ini memecahkan masalah nyata yang sudah ada, atau masalah yang mungkin ada nanti?

_Premature optimization_ itu musuh _productivity_. Membangun sistem _event-driven_ yang kompleks untuk aplikasi yang belum tentu mencapai jutaan _user_ adalah keputusan yang sangat mahal, baik dari sisi waktu maupun kompleksitas.

Aturan yang saya pegang: **selesaikan masalah yang ada sekarang, dengan solusi yang cukup baik untuk kebutuhan yang terukur**. Kalau nanti butuh _scale_, _refactor_ dengan bukti, bukan dengan asumsi.

### 3. Berapa biaya nyatanya?

Bukan cuma biaya _cloud_, tapi biaya waktu. Berapa lama untuk _setup_? Berapa lama untuk _onboarding_? Berapa lama _debugging_ ketika ada masalah? Berapa lama kalau ada _developer_ baru harus paham sistem ini?

Teknologi yang canggih tapi butuh seminggu untuk _setup_ lokal itu mahal, bahkan sebelum satu baris kode bisnis ditulis.

### 4. Apakah ini meningkatkan _time-to-market_ atau memperlambatnya?

Kecepatan _delivery_ itu sangat penting bagi bisnis. Fitur yang telat enam bulan bisa berarti _opportunity_ yang hilang, _user_ yang pergi ke kompetitor, atau _investor_ yang kehilangan kepercayaan.

Kalau pilihan teknologi kita mempercepat _delivery_, bagus. Kalau justru memperlambat, pertimbangkan ulang, meskipun teknologinya secara teknis lebih "benar".

## Pelajaran dari Lapangan

Boleh saya _self-reflect_ sebentar? Saya pernah menulis tentang [migrasi sistem backend dari PHP ke Go](/writing/2026/legacy-php-to-go-migration/) yang saya kerjakan, 370+ _endpoint_, 33 _entity_, hampir 200 ribu baris kode.

Dan pertanyaan yang jujur saya ajukan ke diri sendiri saat itu adalah: **apakah ini keputusan bisnis, atau ego saya yang ingin kerja dengan Go?**

Jawabannya... keduanya, tapi dengan proporsi yang terjaga hehe~

Sisi **ego**-nya: ya, saya penasaran dengan Go. Saya ingin _hands-on_ experience yang lebih dalam. Saya suka cara Go menangani _concurrency_. Itu nyata dan saya tidak akan mengingkarinya.

Tapi sisi **bisnis**-nya juga nyata:

- Sistem lama punya masalah arsitektur yang serius, bukan sekadar PHP-nya, tapi ketiadaan pemisahan _layer_ yang membuat setiap perubahan berisiko tinggi
- _Deploy_ yang tidak bisa diprediksi sudah beberapa kali menyebabkan insiden di _production_
- _Testing coverage_ yang rendah membuat tim takut untuk _refactor_, padahal _refactor_ dibutuhkan
- Satu _binary_ Go menghilangkan masalah _dependency hell_ di _server_ yang selama ini makan waktu tim _ops_

Jadi, Go bukan dipilih semata karena keren, tapi karena di konteks spesifik tersebut, _trade-off_-nya masuk akal: biaya migrasi[^3] yang besar _upfront_, tapi dengan _long-term benefit_ yang terukur.

Itu yang membedakan keputusan teknis berbasis bisnis dengan keputusan berbasis ego: **ada analisis _trade-off_ yang jelas dan berani dipertanggungjawabkan**.

## Ego Itu Tidak Selalu Buruk

Satu hal yang ingin saya luruskan sebelum menutup tulisan ini: **ego sebagai _developer_ tidak selalu negatif**.

Ingin mempelajari teknologi baru itu bagus, itu yang membuat kita berkembang. Ingin menulis kode yang _clean_ dan _elegant_ itu bagus, itu yang membuat sistem lebih mudah dirawat. Ingin _push_ untuk solusi yang lebih baik itu bagus, itu yang menggerakkan inovasi.

Yang bermasalah adalah ketika ego itu **mengaburkan judgment kita**, ketika kita memilih teknologi untuk terlihat pintar, bukan untuk memecahkan masalah. Ketika kita membangun sistem yang kompleks bukan karena dibutuhkan, tapi karena _fun_ untuk dibangun. Ketika kita mempertahankan pilihan yang salah karena tidak mau mengakui kekeliruan.

_Aware_ terhadap perbedaan itu, menurut saya, adalah salah satu kematangan penting seorang _software engineer_.

Sekian. Semoga bermanfaat dan terima kasih sudah tersasar ke sini hehe~

[^1]: Dan biasanya itu adalah diri kita sendiri, enam bulan kemudian, yang sudah lupa kenapa dulu bikin seperti itu hahaha.
[^2]: Ini bukan berarti tidak boleh pakai teknologi yang advanced. Tapi artinya ada tanggung jawab untuk dokumentasi, onboarding plan, dan memastikan knowledge tidak tersentralisasi di satu orang.
[^3]: Migrasi dengan pendekatan bertahap per-modul, bukan _big bang rewrite_, pelajaran pahit dari banyak tim yang pernah mencoba dan gagal.
