---
title: "Monolith Modular Dulu, Microservice Nanti: Filosofi Kesederhanaan di Backend"
description: "Microservice bukan gelar kedewasaan arsitektur — ia solusi untuk masalah organisasi yang belum semua tim punya. Kenapa monolith modular tetap pilihan utama saya, dan kapan tepat naik kelas."
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

Belakangan, saya makin sering mendengar pertanyaan interview ini: "kenapa sistem kamu belum microservice?" Biasanya nadanya bukan benar-benar bertanya, melainkan menuduh. Seolah arsitektur punya tangga prestise: mulai dari monolith yang memalukan, naik ke "monolith modular" yang lumayan, lalu jadi dewa setelah sistemnya dipecah menjadi dua puluh service dengan service mesh.

Posisi saya sederhana: **monolith modular adalah pilihan default yang tepat untuk mayoritas backend. Microservice baru menjawab masalah yang memang harus kamu hadapi sebelum membelinya.** Saya akan menjelaskannya dari pengalaman, bukan dogma.

## Sistem yang Membayar Tagihannya

Supaya ini bukan sekadar opini, saya pegang backend GPS fleet tracking yang terus menerima data posisi dari armada device, menyimpan jutaan titik per hari ke TimescaleDB, melayani ratusan endpoint API, serta menangani billing dan geofencing. Beban seperti ini sering dijawab dengan, "pasti butuh microservice".

Arsitekturnya? **Satu binary Go.**

Di dalamnya ada disiplin: package `listener`, `decoder`, `ingest`, `api`, dan `ws`, dengan batas modul yang tegas, contract internal, serta layer usecase/repository yang rapi. Deploy-nya satu container, observability-nya satu log stream, dan debugging-nya satu trace. Sistem ini, seperti yang saya ceritakan di [seri GPS Backend](/writing/2026/memahami-gps-protocol/), menangani beban yang sering dianggap hanya bisa ditangani armada service.

Bukan karena kami anti-microservice. Karena kami menghitung.

## Yang Sebenarnya Dibeli Microservice

Microservice jarang menyelesaikan masalah teknis yang tidak bisa diselesaikan monolith. Yang dia selesaikan hampir selalu **masalah organisasi**:

- Banyak tim yang saling menginjak deploy satu sama lain → deploy independence
- Codebase yang tidak muat di kepala satu tim → ownership boundary
- Conway's law yang sudah memecah organisasi → arsitektur yang mengikutinya

Itu masalah nyata untuk perusahaan dengan puluhan engineer. Kalau timmu lima orang dan deploy-mu dua kali seminggu, masalah itu belum kamu hadapi. Yang ada baru bayangan bahwa suatu saat kamu akan menghadapinya, dan bayangan itu sudah dibayar hari ini dengan **distributed system tax**: kegagalan jaringan antar-service yang harus ditangani, konsistensi data yang tidak lagi gratis, tracing yang butuh infrastruktur sendiri, pipeline deploy yang berlipat mengikuti jumlah service, serta bug yang dulu bisa ditemukan dalam satu stack trace tetapi kini tersebar di lima log.

Pajak itu bukan mitos. Tagihannya datang tiap bulan, sering kali saat tim kecil sedang sibuk membangun produk.

## Monolith Modular Bukan Monolith Sembarangan

Membela monolith **tidak** sama dengan membela codebase tanpa batas. Monolith yang membusuk, dengan controller 2.000 baris dan semua file saling mengimpor, bisa membuatmu _benar-benar butuh_ microservice karena tak ada yang berani menyentuh apa pun tanpa merusak semuanya.

Yang saya pertahankan adalah **monolith modular**: batas modulnya ditegakkan sama ketatnya dengan batas service, tetapi komunikasinya tetap di dalam proses tanpa tambahan network di antaranya.

- Modul berkomunikasi lewat antarmuka eksplisit, bukan saling megang database orang
- Satu modul bisa dibaca dan dipahami sendirian
- Dependency mengalir satu arah (seperti usecase → repository, tidak bolak-balik)

Buktinya ada di proyek yang sama: migrasi Laravel → Go dilakukan **tanpa big-bang rewrite**. Dua backend berjalan paralel, lalu endpoint dipindahkan satu per satu lewat proxy. Itu mungkin karena batas modul dan contract-nya sudah rapi. Batas yang bisa dipindah antar-runtime kelak bisa dipindah antar-service.

## Kapan Sistem Ini Perlu Dipecah

"Microservice nanti" bukan sekadar alasan untuk menunda. Ada sinyal konkret yang akan membuat saya memecah sistem. Tidak satu pun alasannya "karena sekarang trenya":

1. **Deploy benar-benar saling menginjak** — tim berbeda harus rilis komponen berbeda dengan ritme berbeda, dan antrian koordinasi jadi bottleneck yang terasa tiap minggu.
2. **Profil beban yang ekstrem timpang** — satu modul butuh resource kelas beda (mis. komputasi berat yang layak di-scale terpisah dari API yang ringan).
3. **Isolasi kegagalan yang sudah terbukti menyakitkan** — crash satu modul berulang kali menyeret keseluruhan sistem, dan bukan karena bug yang bisa diperbaiki.
4. **Organisasi memang sudah terpecah** — tim-tim dengan ownership berbeda, siklus rilis berbeda, bahkan runtime berbeda.

Saat sinyal itu muncul, saya tidak akan memulai dari nol. Saya akan memakai **strangler pattern**: mengekstrak modul yang paling mature menjadi service pertama, mengalihkan lalu lintas lewat proxy, lalu menyusul dengan modul lain bila perlu. Ekstraksi ini murah hanya kalau batas modulnya sudah rapi. Modul yang berantakan di dalam monolith tidak otomatis menjadi service yang sehat; kekacauannya hanya berpindah ke jaringan.

Urutannya bukan "monolith dulu, microservice kalau sudah jago", melainkan **modular dulu, distribusi kalau sudah dibutuhkan**. Monolith modular yang rapi adalah jalan menuju microservice yang tepat, bukan lawannya.

## Kapan Microservice Masuk Akal Sejak Awal

Ada kondisi ketika microservice memang tepat sejak awal, dan saya akan memilihnya tanpa ragu:

- Boundary organisasi sudah keras dari regulasi (data pribadi satu yurisdiksi, audit terpisah, tenant yang menuntut isolasi fisik)
- Sistem memang federasi runtime sejak lahir — misal pipeline yang harus menjalankan komponen Python, Go, dan JVM bersamaan dengan siklus hidup berbeda
- Produkmu secara bisnis memang platform multi-team dari hari pertama (marketplace dengan divisi-divisi independen)

Semua itu **constraint eksternal yang nyata**, bukan optimasi teknis yang dibayangkan. Kalau alasanmu ber-subjek "tim/regulasi/runtime", microservice masuk akal. Kalau alasannya "biar kelihatan modern", kembali ke meja gambar.

## Pilihan Default yang Lebih Sederhana

Saya pernah menulis bahwa [memilih tech stack itu soal bisnis, bukan ego](/writing/2026/tech-stack-ego-vs-business/). Arsitektur juga soal yang sama. Microservice dibayar dengan kompleksitas, monolith modular dengan disiplin. Untuk kebanyakan tim dan masalah yang kita hadapi, disiplin lebih murah. Batas modul yang rapi juga memberi jalan untuk menambah kompleksitas saat memang diperlukan; arah sebaliknya lebih sulit.

## CTA

Kalau pengalamanmu soal kapan service perlu dipisah berbeda, saya terbuka untuk berdiskusi lewat [Contact](/contact/) atau mengikuti tulisan berikutnya lewat [RSS](/writing/index.xml).
