---
title: "Monolith Modular Dulu, Microservice Nanti: Filosofi Kesederhanaan di Backend"
description: "Kenapa monolith modular masih jadi pilihan default saya, dan masalah seperti apa yang baru layak dibayar dengan microservice."
author: "Faiq Najib Al-Aziz"
date: 2026-11-24
lastmod: 2026-11-24
draft: true
toc: true
comments: true
images:
  - og.png
tags:
  - arsitektur
  - backend
  - golang
  - opini
pillar: "backend"
---

Akhir-akhir ini saya sering mendengar pertanyaan interview: "kenapa sistem kamu belum microservice?" Kadang rasanya bukan bertanya, tapi menguji apakah saya cukup keren. Seolah monolith itu memalukan, lalu monolith modular lumayan, dan baru dianggap hebat setelah dipecah jadi entah berapa service. Padahal, apa masalah yang sebenarnya sedang kita selesaikan?

Pilihan saya sejauh ini: **monolith modular jadi titik awal yang masuk akal untuk banyak backend. Microservice baru berguna ketika masalah yang diselesaikannya memang sudah ada.** Ini bukan aturan untuk semua orang, cuma kesimpulan dari sistem yang pernah saya kerjakan.

## Contoh dari Kerjaan Saya

Contoh yang saya pegang adalah backend GPS fleet tracking. Sistemnya menerima posisi dari banyak device, menyimpan jutaan titik per hari ke TimescaleDB, melayani ratusan endpoint API, dan menangani billing serta geofencing. Kalau diceritakan begitu, biasanya ada saja yang menyahut, "berarti butuh microservice, dong."

Tapi arsitekturnya masih **satu binary Go**. (Iya, satu saja.)

Di dalam satu binary itu ada package `listener`, `decoder`, `ingest`, `api`, dan `ws`. Batas modulnya jelas, kontrak internalnya ada, dan layer usecase/repository tidak dicampur aduk. Deploy-nya satu container. Saat ada masalah, saya tidak perlu mencari log dari banyak service sekaligus. Di [seri GPS Backend](/writing/2026/memahami-gps-protocol/) saya bercerita lebih jauh soal sistem ini.

Bukan berarti kami anti-microservice. Kami cuma menghitung biaya dan manfaatnya dulu.

## Yang Sebenarnya Dibeli Microservice

Microservice bukan satu-satunya cara menyelesaikan masalah teknis. Sering kali, manfaat terbesarnya ada di **masalah organisasi**:

Biasanya masalahnya terlihat saat beberapa tim mulai saling menghalangi jadwal deploy, codebase sudah terlalu besar untuk dikelola satu tim, atau struktur organisasi memang terbagi mengikuti Conway's law. Di titik itu, batas kepemilikan yang lebih mandiri bisa membantu.

Semua itu memang masalah nyata untuk organisasi besar. Tapi kalau timmu lima orang dan deploy dua kali seminggu, belum tentu kamu punya masalah tersebut. Bisa jadi yang dibayar sekarang adalah antisipasi untuk masalah masa depan, dalam bentuk **distributed system tax**: menangani network failure, menjaga konsistensi data, menyiapkan tracing, mengurus pipeline deploy untuk tiap service, lalu mencari bug yang tersebar di beberapa log.

Biaya tambahan ini terasa terus, termasuk saat tim kecil sebetulnya sedang sibuk membangun produknya.

## Monolith Modular Bukan Monolith Sembarangan

Saya bukan membela monolith yang semua bagiannya saling impor dan controllernya 2.000 baris. Codebase seperti itu memang menyulitkan perubahan. Kadang tim sampai berpikir perlu pindah ke microservice, padahal masalah awalnya adalah batas modul yang tidak pernah dijaga.

Yang saya pilih adalah **monolith modular**. Batas modulnya jelas dan dijaga, tetapi komunikasi antar-modul tetap terjadi di dalam proses. Tidak perlu menambah network hop untuk setiap panggilan.

Di proyek saya, modul berkomunikasi lewat antarmuka yang jelas, bukan dengan mengakses tabel domain lain seenaknya. Saya juga berusaha membuat setiap modul bisa dibaca sendiri dan menjaga arah dependency, misalnya usecase → repository, bukan bolak-balik.

Buktinya ada di proyek yang sama: migrasi Laravel → Go dilakukan **tanpa big-bang rewrite**. Dua backend berjalan paralel, lalu endpoint dipindahkan satu per satu lewat proxy. Itu mungkin karena batas modul dan contract-nya sudah rapi. Batas yang bisa dipindah antar-runtime kelak bisa dipindah antar-service.

## Kapan Saya Akan Memecah Sistem

Bagi saya, "microservice nanti" bukan berarti menolak selamanya. Ada beberapa kondisi yang akan membuat saya mempertimbangkan pemisahan. Bukan karena sedang tren:

1. **Deploy benar-benar saling menginjak**: tim berbeda harus rilis komponen berbeda dengan ritme berbeda, dan antrian koordinasi jadi bottleneck yang terasa tiap minggu.
2. **Profil beban yang ekstrem timpang**: satu modul butuh resource kelas beda (mis. komputasi berat yang layak di-scale terpisah dari API yang ringan).
3. **Isolasi kegagalan yang sudah terbukti menyakitkan**: crash satu modul berulang kali menyeret keseluruhan sistem, dan bukan karena bug yang bisa diperbaiki.
4. **Organisasi memang sudah terpecah**: tim-tim dengan ownership berbeda, siklus rilis berbeda, bahkan runtime berbeda.

Kalau salah satu kondisi itu muncul, saya tidak perlu memulai semuanya dari nol. Saya bisa memakai **strangler pattern**, mengambil modul yang paling siap menjadi service pertama, lalu mengalihkan traffic lewat proxy. Modul lain menyusul kalau memang perlu. Tapi ekstraksi hanya lebih mudah kalau batas modul di dalam monolith sudah rapi. Kalau berantakan, ya kekacauannya ikut pindah ke jaringan.

Jadi urutan yang saya pilih: **rapikan modul dulu, distribusikan saat memang dibutuhkan**. Monolith modular bukan lawan microservice. Ia bisa jadi titik berangkat yang lebih tenang.

## Kapan Microservice Masuk Akal Sejak Awal

Tentu ada juga situasi ketika microservice masuk akal sejak awal. Misalnya, regulasi mengharuskan data pribadi tinggal di yurisdiksi tertentu atau tenant perlu isolasi fisik. Bisa juga sistemnya memang perlu beberapa runtime dengan siklus hidup berbeda, seperti pipeline yang menjalankan Python, Go, dan JVM. Atau produk bisnisnya sejak awal memang platform untuk banyak tim, misalnya marketplace dengan divisi independen.

Itu semua **batasan nyata dari luar**, bukan optimasi yang dibayangkan. Kalau kebutuhanmu datang dari tim, regulasi, atau runtime yang berbeda, microservice bisa jadi pilihan yang tepat. Kalau cuma supaya terlihat modern, mungkin perlu duduk sebentar dan tanya lagi masalah apa yang ingin diselesaikan.

## Kenapa Saya Memilih Ini untuk Sekarang

Saya pernah menulis bahwa [memilih tech stack itu soal bisnis, bukan ego](/writing/2026/tech-stack-ego-vs-business/). Untuk sistem yang sekarang saya pegang, saya memilih monolith modular karena belum ada alasan kuat untuk menambah urusan operasional. Kalau kebutuhannya berubah, baru saya pikirkan lagi. Batas modul yang rapi setidaknya membuat pilihan itu tidak tertutup.

## Ngobrol?

Kalau kamu pernah memisahkan sistem dengan alasan berbeda, [hubungi saya](/contact/). Kamu juga bisa mengikuti tulisan berikutnya lewat [RSS](/writing/index.xml).
