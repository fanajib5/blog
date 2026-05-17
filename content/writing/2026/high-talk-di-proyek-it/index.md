---
title: "Tangga Lipat di Proyek IT"
description: "Sebuah cerita tentang rekan atau atasan proyek IT yang bicaranya lebih tinggi dari Gunung Semeru, dan bagaimana cara menghadapinya tanpa harus ikut mendaki."
author: "Faiq Najib"
date: 2026-05-17
lastmod: 2026-05-17
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

Jujur, saya sudah bertanya-tanya soal ini cukup lama. Dan setelah mengumpulkan berbagai pengalaman pahit-manis di berbagai proyek, saya punya beberapa kesimpulan.

**Pertama, mereka terlalu dalam di bidangnya.**

Orang yang sudah lama berkutat dengan _microservices_, _event-driven architecture_, _CQRS_, atau _distributed tracing_ itu kadang lupa bahwa tidak semua orang tidur dan bangun dengan istilah yang sama. Mereka bicara seperti menulis dokumentasi teknis, detail, akurat, dan sangat membingungkan kalau kamu belum punya konteks yang cukup hehe.

**Kedua, mereka ingin terlihat kompeten.**

Ini yang agak sensitif. Ada kalanya, penggunaan istilah teknis yang berlebihan itu bukan karena kebiasaan, tapi karena pilihan. _Show off_, simpelnya. Semakin panjang akronim yang keluar dari mulutnya, semakin tinggi posisi yang dia rasakan. Setidaknya di kepalanya sendiri~~

**Ketiga, topiknya memang susah.**

Ini yang harus saya akui juga, _fair_. Tidak semua konsep IT bisa dijelaskan dengan dua kalimat. Kadang _dependency injection_, _race condition_, atau _eventual consistency_ itu memang butuh sedikit... _effort_ ekstra untuk dipahami.

Bedanya adalah: orang yang **benar-benar paham** biasanya bisa menyederhanakan. Orang yang **setengah paham** biasanya malah menambahkan lebih banyak istilah. Seperti kata fisikawan Richard Feynman:

> _"Kalau kamu tidak bisa jelaskan sesuatu dengan simpel, berarti kamu belum paham sepenuhnya."_

## Kasusnya di Proyek IT: Rekan dan Atasan

Kasus konkretnya saya pernah alami langsung. Di satu proyek pembuatan aplikasi, seorang rekan satu tim, yang cukup senior soal _backend_, selalu mengawali setiap penjelasannya dengan sepuluh istilah baru. Bahkan untuk hal yang mestinya bisa dijelaskan dalam satu kalimat.

_"Kita perlu redesign flow-nya karena ada tight coupling antara domain service dan infrastructure layer yang bikin testability-nya jelek dan nanti waktu kita mau scale horizontally bakal jadi bottleneck di message broker."_

...Saya yang saat itu cuma bisa mengangguk sambil dalam hati berbisik: _"Oke, Mas. Nanti kita ngobrol lagi ya kalau saya sudah beli kamus."_

Intinya? Kita perlu pisahkan beberapa bagian kode supaya lebih gampang di-_maintain_. Tapi butuh satu paragraf penuh istilah untuk sampai ke sana haha.

Yang lebih menantang lagi adalah kalau _high-talker_-nya adalah **atasan**. Karena kalau rekan sebaya masih bisa kita potong dengan candaan ringan, atasan punya dinamika yang berbeda. Salah-salah malah dianggap tidak sopan atau tidak profesional.

Saya pernah menghadiri _meeting_ rutin dimana seorang atasan, dengan penuh semangat, menjelaskan arah teknis proyek selama 30 menit tanpa jeda yang cukup untuk pertanyaan. Dan saya keluar dari ruangan itu, atau lebih tepatnya, keluar dari Zoom Meeting, dengan satu pertanyaan besar: _"Jadi, kita mau ngapain besok?"_

## Teknik Feynman: Senjata Rahasia

Di sinilah saya mulai berkenalan lebih serius dengan yang namanya [Teknik Feynman](https://fs.blog/feynman-technique/).

Intinya simpel: kalau kamu tidak bisa menjelaskan sebuah konsep kepada seseorang yang sama sekali tidak tahu apa-apa, berarti kamu sendiri belum benar-benar menguasainya.

Dalam konteks proyek IT, teknik ini berguna dari dua arah.

**Sebagai pendengar**, kamu bisa minta rekan atau atasan untuk menjelaskan ulang dengan analogi yang lebih sederhana. Contoh kalimat yang cukup ampuh:

- _"Bisa dianalogikan dulu, Mas/Pak, seolah-olah saya anak SMA yang baru belajar coding?"_
- _"Bisa kasih contoh nyata dari kasus kita dulu sebelum masuk ke teorinya?"_

Orang yang benar-benar paham akan menerima tantangan itu dengan senang hati. Bahkan biasanya malah _happy_ karena ada yang mau dengerin. Kalau dia malah tambah bingung saat diminta menyederhanakan... nah, itu pertanda yang cukup jelas haha.

**Sebagai pembicara**, teknik ini melatih kita sendiri untuk tidak terjebak dalam kebiasaan yang sama. Sebelum menjelaskan sesuatu ke tim, coba tanya diri sendiri dulu: _kalau teman saya yang baru sebulan belajar coding mendengar ini, apakah dia akan mengerti?_

Kalau jawabannya tidak, maka sederhanakan dulu.

Contoh konkretnya seperti ini. Daripada bilang:

> _"Kita butuh implementasi Dependency Injection supaya coupling-nya loose dan unit test-nya bisa di-mock."_

Coba bilang:

> _"Bayangin mobilmu haus bensin. Biasanya kamu sendiri yang harus isi bensin. Tapi dengan cara ini, mobilnya cukup bilang 'butuh bensin', dan orang lain yang kasih. Mobilnya nggak perlu tahu dari mana bensinnya datang. Nah, itu intinya."_

Jauh lebih mudah dicerna, dan pesannya tetap sampai.

## Cara Menghadapinya

Dari pengalaman, ada beberapa pendekatan yang cukup berhasil, dan satu yang sebaiknya dihindari.

**Yang berhasil:**

1. **Tanya dengan tulus, bukan konfrontatif.** Kalimat seperti _"Wah menarik, bisa dicontohkan dalam kasus kita?"_ terasa jauh lebih aman daripada _"Saya nggak ngerti, jelasin yang simpel dong."_ Hasil akhirnya sama, tapi yang pertama tidak melukai ego siapa pun. Apalagi kalau yang diajak bicara adalah atasan hehe.

2. **Minta dokumentasi atau diagram.** Kadang orang lebih mudah menjelaskan lewat tulisan atau gambar daripada ngobrol langsung. Dan dengan dokumentasi, kamu bisa baca ulang pelan-pelan tanpa tekanan. _Win-win_.

3. **Validasi dulu, tanya kemudian.** Coba parafrase balik pemahamanmu: _"Oh iya, jadi maksudnya sistem kita perlu dipisah supaya lebih mudah di-maintain ya?"_, kalau dia setuju, berarti kamu sudah menangkap intinya. Kalau tidak, dia akan mengoreksi, dan penjelasannya biasanya akan jadi lebih jelas karena terpaksa haha.

4. **Di meeting, buat aturan bersama.** Kalau posisimu memungkinkan, usulkan kebiasaan tim: _"Kita sepakat ya, setiap ada istilah teknis baru, langsung kasih penjelasan singkatnya."_ Terasa sepele, tapi dampaknya ke kualitas komunikasi tim itu luar biasa.

**Yang sebaiknya dihindari:**

Jangan pura-pura paham demi menjaga perasaan semua orang. Termasuk perasaan diri sendiri. Karena itu cuma menunda masalah. Dan masalah yang ditunda di proyek IT biasanya berbunga, lalu beranak-pinak, lalu jadi _bug_ yang kamu temukan seminggu sebelum _deadline_ haha.

## Penutup: Kita Semua Pernah Mendaki

Satu hal yang saya sadari setelah cukup banyak berhadapan dengan tipe komunikasi seperti ini: saya sendiri pun pernah jadi _high-talker_-nya.

Ada masa-masa dimana saya sangat antusias dengan sesuatu yang baru dipelajari, entah itu _clean architecture_, _hexagonal pattern_, atau konsep apapun yang baru saya temukan dari blog luar, dan langsung menyebutkannya di setiap kesempatan. Padahal tidak semua orang butuh mendengar itu saat itu juga. Dan mungkin saya sendiri pun belum benar-benar menguasainya~~

Jadi, tulisan ini bukan untuk menghakimi siapa pun. Lebih ke pengingat, untuk saya sendiri dan mungkin juga untuk kamu yang tersasar ke sini dan membaca ini, bahwa komunikasi yang baik bukan soal seberapa banyak istilah yang kita tahu. Tapi seberapa yakin kita bahwa orang lain benar-benar mengerti apa yang kita maksud.

Kalau perlu, sediakan tangga lipat. Atau lebih baik lagi: jangan bikin orang lain butuh tangga lipat hehe.

Sekian. Salam.
