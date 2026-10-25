---
title: "Tangga Lipat di Proyek IT"
description: "Sebuah cerita tentang rekan atau atasan proyek IT yang bicaranya lebih tinggi dari Gunung Semeru, dan bagaimana cara menghadapinya tanpa harus ikut mendaki."
author: "Faiq Najib Al-Aziz"
date: 2026-05-17
lastmod: 2026-09-11T09:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - soft-skill
  - catatan
  - personal
---

Ada satu jenis orang yang kadang bikin saya harus diam sejenak, mengerutkan dahi, lalu berpura-pura mengangguk, padahal dalam hati sudah mengangkat tangan dan berteriak minta tangga lipat.

Saya menyebutnya _high-talker_. Bukan berarti suaranya nyaring. Tapi cara mereka berbicara serasa mengajak kita mendaki Gunung Semeru... tanpa bekal, tanpa peta, dan tanpa persiapan fisik sama sekali.

Dan ironisnya, saya paling sering bertemu tipe ini justru di proyek IT.

## Kenapa Mereka Seperti Ini?

Saya sudah cukup lama bertanya-tanya kenapa bisa begitu. Di beberapa proyek yang saya alami, ada tiga kemungkinan.

**Pertama, mereka terlalu dalam di bidangnya.**

Orang yang sudah lama berkutat dengan _microservices_, _event-driven architecture_, _CQRS_, atau _distributed tracing_ kadang lupa bahwa tidak semua orang tidur dan bangun dengan istilah yang sama. Mereka bicara seperti menulis dokumentasi teknis: detail, akurat, dan sangat membingungkan kalau kamu belum punya konteks yang cukup hehe.

**Kedua, mereka ingin terlihat kompeten.**

Yang ini agak sensitif. Ada kalanya penggunaan istilah teknis yang berlebihan bukan karena kebiasaan, tapi pilihan. _Show off_, simpelnya. Semakin panjang akronim yang keluar dari mulutnya, semakin tinggi posisi yang dia rasakan. Setidaknya di kepalanya sendiri~~

**Ketiga, topiknya memang susah.**

Ini yang harus saya akui juga, _fair_. Tidak semua konsep IT bisa dijelaskan dengan dua kalimat. Kadang _dependency injection_, _race condition_, atau _eventual consistency_ itu memang butuh sedikit... _effort_ ekstra untuk dipahami.

Bedanya adalah: orang yang **benar-benar paham** biasanya bisa menyederhanakan. Orang yang **setengah paham** biasanya malah menambahkan lebih banyak istilah. Seperti kata fisikawan Richard Feynman:

> _"Kalau kamu tidak bisa jelaskan sesuatu dengan simpel, berarti kamu belum paham sepenuhnya."_

## Kasusnya di Proyek IT: Rekan dan Atasan

Saya pernah mengalami ini langsung. Di satu proyek pembuatan aplikasi, seorang rekan satu tim yang cukup senior soal _backend_ selalu mengawali penjelasannya dengan sepuluh istilah baru, bahkan untuk hal yang mestinya bisa dijelaskan dalam satu kalimat.

_"Kita perlu redesign flow-nya karena ada tight coupling antara domain service dan infrastructure layer yang bikin testability-nya jelek dan nanti waktu kita mau scale horizontally bakal jadi bottleneck di message broker."_

...Saya yang saat itu cuma bisa mengangguk sambil dalam hati berbisik: _"Oke, Mas. Nanti kita ngobrol lagi ya kalau saya sudah beli kamus."_

Intinya? Kita perlu pisahkan beberapa bagian kode supaya lebih gampang di-_maintain_. Tapi butuh satu paragraf penuh istilah untuk sampai ke sana haha.

Kalau _high-talker_-nya **atasan**, situasinya lebih rumit. Rekan sebaya masih bisa kita potong dengan candaan ringan, tetapi salah bicara kepada atasan bisa dianggap tidak sopan atau tidak profesional.

Saya pernah menghadiri _meeting_ rutin di mana seorang atasan, dengan penuh semangat, menjelaskan arah teknis proyek selama 30 menit tanpa jeda yang cukup untuk pertanyaan. Dan saya keluar dari ruangan itu, atau lebih tepatnya, keluar dari Zoom Meeting, dengan satu pertanyaan besar: _"Jadi, kita mau ngapain besok?"_

## Teknik Feynman

Saya lalu mulai mengenal [Teknik Feynman](https://fs.blog/feynman-technique/) lebih serius.

Intinya simpel: kalau kamu tidak bisa menjelaskan sebuah konsep kepada seseorang yang sama sekali tidak tahu apa-apa, berarti kamu sendiri belum benar-benar menguasainya.

Di proyek IT, teknik ini bisa dilihat dari dua sisi.

**Sebagai pendengar**, kamu bisa minta rekan atau atasan untuk menjelaskan ulang dengan analogi yang lebih sederhana. Contoh kalimat yang cukup ampuh:

- _"Bisa dianalogikan dulu, Mas/Pak, seolah-olah saya anak SMA yang baru belajar coding?"_
- _"Bisa kasih contoh nyata dari kasus kita dulu sebelum masuk ke teorinya?"_

Orang yang paham biasanya bisa menjawabnya. Kalau dia malah tambah bingung saat diminta menyederhanakan, mungkin penjelasan awalnya memang belum membantu haha.

**Sebagai pembicara**, teknik ini melatih kita sendiri untuk tidak terjebak dalam kebiasaan yang sama. Sebelum menjelaskan sesuatu ke tim, coba tanya diri sendiri dulu: _kalau teman saya yang baru sebulan belajar coding mendengar ini, apakah dia akan mengerti?_

Kalau jawabannya tidak, maka sederhanakan dulu.

Contohnya, daripada bilang:

> _"Kita butuh implementasi Dependency Injection supaya coupling-nya loose dan unit test-nya bisa di-mock."_

Coba bilang:

> _"Bayangin mobilmu haus bensin. Biasanya kamu sendiri yang harus isi bensin. Tapi dengan cara ini, mobilnya cukup bilang 'butuh bensin', dan orang lain yang kasih. Mobilnya nggak perlu tahu dari mana bensinnya datang. Nah, itu intinya."_

Analogi ini lebih mudah dicerna, dan pesannya tetap sampai.

## Cara Menghadapinya

Kalau penjelasan mulai sulit diikuti, ada beberapa cara untuk membawanya kembali ke kasus yang sedang dibahas.

**Yang berhasil:**

1. **Tanya dengan tulus, bukan konfrontatif.** Kalimat seperti _"Wah menarik, bisa dicontohkan dalam kasus kita?"_ terasa jauh lebih aman daripada _"Saya nggak ngerti, jelasin yang simpel dong."_ Hasil akhirnya sama, tapi yang pertama tidak melukai ego siapa pun. Apalagi kalau yang diajak bicara adalah atasan hehe.

2. **Minta dokumentasi atau diagram.** Kadang orang lebih mudah menjelaskan lewat tulisan atau gambar daripada ngobrol langsung. Dan dengan dokumentasi, kamu bisa baca ulang pelan-pelan tanpa tekanan. _Win-win_.

3. **Validasi dulu, tanya kemudian.** Coba parafrase balik pemahamanmu: _"Oh iya, jadi maksudnya sistem kita perlu dipisah supaya lebih mudah di-maintain ya?"_, kalau dia setuju, berarti kamu sudah menangkap intinya. Kalau tidak, dia akan mengoreksi, dan penjelasannya biasanya akan jadi lebih jelas karena terpaksa haha.

4. **Di meeting, buat aturan bersama.** Kalau posisimu memungkinkan, usulkan kebiasaan tim: _"Kita sepakat ya, setiap ada istilah teknis baru, langsung kasih penjelasan singkatnya."_ Terasa sepele, tapi dampaknya ke kualitas komunikasi tim itu luar biasa.

**Yang sebaiknya dihindari:**

Jangan pura-pura paham demi menjaga perasaan semua orang. Termasuk perasaan diri sendiri. Karena itu cuma menunda masalah. Dan masalah yang ditunda di proyek IT biasanya berbunga, lalu beranak-pinak, lalu jadi _bug_ yang kamu temukan seminggu sebelum _deadline_ haha.

## Saya Juga Pernah Jadi _High-Talker_

Setelah beberapa kali berhadapan dengan cara komunikasi seperti ini, saya sadar saya sendiri pun pernah jadi _high-talker_.

Ada masa-masa di mana saya sangat antusias dengan sesuatu yang baru dipelajari, entah itu _clean architecture_, _hexagonal pattern_, atau konsep apa pun yang baru saya temukan dari blog luar, dan langsung menyebutkannya di setiap kesempatan. Padahal tidak semua orang butuh mendengar itu saat itu juga. Dan mungkin saya sendiri pun belum benar-benar menguasainya~~

Saya menulis ini bukan untuk menghakimi siapa pun. Saya juga perlu mengingatkan diri sendiri bahwa istilah yang baru saya pelajari belum tentu perlu saya bawa ke setiap obrolan.
