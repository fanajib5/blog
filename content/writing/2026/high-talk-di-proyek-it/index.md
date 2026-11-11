---
title: "Tangga Lipat di Proyek IT"
description: "Catatan saya soal istilah teknis yang kadang bikin obrolan proyek IT terasa seperti pendakian tanpa peta."
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

Ada satu jenis obrolan yang bikin saya diam sebentar, mengerutkan dahi, lalu mengangguk-angguk seolah paham. Padahal dalam hati saya sudah minta tangga lipat.

Saya menyebut orangnya _high-talker_. Bukan karena suaranya nyaring, tapi karena penjelasannya kadang terasa seperti ajakan mendaki Gunung Semeru tanpa bekal dan tanpa peta. Saya sendiri baru dengar istilahnya, jadi jangan-jangan saya ikut-ikutan sok tahu juga hehe.

Anehnya, saya paling sering bertemu tipe ini di proyek IT.

## Kok Bisa Begitu?

Saya pernah bertanya-tanya kenapa obrolan teknis bisa berujung seperti ini. Dari beberapa proyek yang saya alami, alasannya bisa macam-macam.

Ada orang yang sudah lama berkutat dengan _microservices_, _event-driven architecture_, _CQRS_, atau _distributed tracing_, lalu lupa bahwa tidak semua orang tidur dan bangun dengan istilah yang sama. Mereka bicara seperti menulis dokumentasi teknis: detail, akurat, dan membingungkan kalau kita belum punya konteks hehe.

Ada juga yang ingin terlihat paling paham. Yang ini agak sensitif. Kadang istilah teknis berlebihan bukan kebiasaan, tapi pilihan. _Show off_, simpelnya. Semakin panjang akronim yang keluar, semakin tinggi posisi yang dia rasakan. Setidaknya di kepalanya sendiri~~

Topiknya juga bisa memang susah. Ini harus saya akui, _fair_. Tidak semua konsep IT bisa dijelaskan dalam dua kalimat. _Dependency injection_, _race condition_, dan _eventual consistency_ kadang memang butuh _effort_ ekstra untuk dipahami.

Saya perhatikan, orang yang paham biasanya bisa mencari cara untuk menjelaskan ulang. Kalau istilahnya malah makin bertambah, bisa jadi pembicaranya belum benar-benar paham. Atau saya saja yang belum nyambung, dua-duanya mungkin hahaha. Richard Feynman pernah bilang:

> _"Kalau kamu tidak bisa jelaskan sesuatu dengan simpel, berarti kamu belum paham sepenuhnya."_

## Waktu Obrolan Proyek Mulai Melayang

Saya pernah mengalaminya sendiri. Di satu proyek aplikasi, rekan yang lebih senior di _backend_ sering membuka penjelasan dengan istilah baru bertumpuk-tumpuk. Bahkan untuk hal yang sebenarnya bisa dijelaskan dalam satu kalimat.

_"Kita perlu redesign flow-nya karena ada tight coupling antara domain service dan infrastructure layer yang bikin testability-nya jelek dan nanti waktu kita mau scale horizontally bakal jadi bottleneck di message broker."_

...Saya yang saat itu cuma bisa mengangguk sambil dalam hati berbisik: _"Oke, Mas. Nanti kita ngobrol lagi ya kalau saya sudah beli kamus."_

Kalau diterjemahkan ke bahasa saya, maksudnya kode perlu dipisah supaya lebih gampang di-_maintain_. Panjang juga perjalanan untuk sampai ke sana haha.

Kalau _high-talker_-nya **atasan**, situasinya lebih rumit. Rekan sebaya masih bisa kita potong dengan candaan ringan, tetapi salah bicara kepada atasan bisa dianggap tidak sopan atau tidak profesional.

Pernah juga ada _meeting_ rutin ketika atasan menjelaskan arah teknis proyek sekitar 30 menit. Saya menunggu jeda buat bertanya, tapi tidak kunjung datang. Begitu _meeting_ selesai, saya cuma punya satu pertanyaan: _"Besok kita mau ngapain, ya?"_

## Mencoba Menjelaskan Ulang

Belakangan saya membaca lagi soal [Teknik Feynman](https://fs.blog/feynman-technique/).

Versi singkatnya, coba jelaskan konsep itu ke orang yang belum pernah mendengarnya. Kalau saya sendiri masih berputar-putar, mungkin saya belum cukup paham.

Di obrolan proyek, saya bisa memakainya sebagai pendengar maupun pembicara.

**Sebagai pendengar**, kamu bisa minta rekan atau atasan untuk menjelaskan ulang dengan analogi yang lebih sederhana. Contoh kalimat yang cukup ampuh:

- _"Bisa dianalogikan dulu, Mas/Pak, seolah-olah saya anak SMA yang baru belajar coding?"_
- _"Bisa kasih contoh nyata dari kasus kita dulu sebelum masuk ke teorinya?"_

Kalau orangnya paham, biasanya ia bisa memberi contoh yang lebih sederhana. Kalau malah sama-sama bingung, ya mungkin kami perlu berhenti sebentar dan menyamakan pemahaman dulu haha.

**Sebagai pembicara**, teknik ini melatih kita sendiri untuk tidak terjebak dalam kebiasaan yang sama. Sebelum menjelaskan sesuatu ke tim, coba tanya diri sendiri dulu: _kalau teman saya yang baru sebulan belajar coding mendengar ini, apakah dia akan mengerti?_

Kalau jawabannya belum, coba sederhanakan dulu. Saya sendiri juga perlu mengingat ini.

Contohnya, daripada bilang:

> _"Kita butuh implementasi Dependency Injection supaya coupling-nya loose dan unit test-nya bisa di-mock."_

Coba bilang:

> _"Bayangin mobilmu haus bensin. Biasanya kamu sendiri yang harus isi bensin. Tapi dengan cara ini, mobilnya cukup bilang 'butuh bensin', dan orang lain yang kasih. Mobilnya nggak perlu tahu dari mana bensinnya datang. Nah, itu intinya."_

Analogi ini mungkin lebih gampang dibayangkan, setidaknya buat saya.

## Kalau Mulai Kehilangan Alur

Kalau penjelasan mulai terasa seperti kamus berjalan, saya biasanya mencoba menarik obrolan kembali ke masalah yang sedang dibahas.

**Yang bisa dicoba:**

1. **Tanya baik-baik.** _"Wah menarik, bisa kasih contoh dari kasus kita?"_ terdengar lebih enak daripada _"Saya nggak ngerti, jelasin yang simpel dong."_ Apalagi kalau lawan bicara kita atasan hehe.

2. **Minta contoh tertulis atau gambar.** Kadang diagram lebih membantu daripada penjelasan lisan. Saya juga bisa membacanya ulang tanpa harus buru-buru mengangguk.

3. **Coba ulangi dengan kata-kata sendiri.** Misalnya, _"Berarti sistemnya perlu dipisah supaya lebih mudah di-maintain, ya?"_ Kalau salah, lawan bicara bisa mengoreksi. Saya sering lebih paham setelah mendengar versi sederhananya.

4. **Kalau memungkinkan, sepakati kebiasaan di meeting.** Misalnya, setiap memakai istilah baru, sekalian jelaskan artinya sebentar. Tidak perlu jadi aturan panjang, yang penting orang tidak pulang dengan pertanyaan yang sama seperti saya.

**Yang sebaiknya dihindari:**

Saya berusaha tidak pura-pura paham hanya supaya obrolan cepat selesai. Nanti pertanyaannya muncul lagi, biasanya saat _deadline_ sudah dekat dan _bug_ mulai beranak-pinak haha.

## Saya Juga Pernah Jadi _High-Talker_

Setelah beberapa kali mengeluh soal orang lain, saya sadar saya juga pernah jadi _high-talker_.

Kalau baru belajar _clean architecture_ atau _hexagonal pattern_, saya bisa terlalu semangat membawanya ke obrolan. Padahal orang lain belum tentu butuh mendengar istilah itu saat itu, dan saya pun belum tentu sudah paham betul. Hehe, kena diri sendiri.

Tulisan ini bukan buat menghakimi siapa-siapa. Saya menulisnya sambil mengingatkan diri sendiri: kalau orang lain tidak menangkap maksud saya, mungkin saya yang perlu menjelaskan ulang. Istilah baru yang saya pelajari tidak harus masuk ke setiap obrolan. Kadang satu kalimat sederhana sudah cukup, kalau saya bisa merangkainya.
