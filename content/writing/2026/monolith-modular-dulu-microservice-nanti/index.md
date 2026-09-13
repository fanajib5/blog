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

Ada pertanyaan interview yang semakin sering saya dengar, dan setiap kali mendengarnya saya ingin bertanya balik: "kenapa sistem kamu belum microservice?" — diucapkan bukan sebagai pertanyaan, tapi sebagai tuduhan. Seolah arsitektur itu tangga prestise: mulai dari monolith yang memalukan, naik ke "monolith modular" yang lumayan, dan lulus jadi dewa saat tabelnya pecah jadi dua puluh service dengan service mesh.

Posisi saya di artikel ini sederhana dan akan saya pertahankan dengan pengalaman, bukan dogma: **monolith modular adalah pilihan default yang benar untuk mayoritas backend, dan microservice adalah jawaban untuk masalah yang harus kamu miliki lebih dulu sebelum membelinya.**

## Sistem yang Membayar Tagihannya

Biar tidak jadi opini awang-awang, ini sistem yang saya pegang: backend GPS fleet tracking yang menerima data posisi dari armada device terus-menerus, menyimpan jutaan titik per hari ke TimescaleDB, melayani ratusan endpoint API, plus billing dan geofencing. Beban yang oleh buku-buku biasa dijawab dengan "pasti butuh microservice".

Arsitekturnya? **Satu binary Go.**

Di dalamnya ada disiplin: package `listener`, `decoder`, `ingest`, `api`, `ws` — batas modul yang tegas, antarmuka lewat contract internal, layer usecase/repository yang rapi. Deploy-nya satu container, observability-nya satu log stream, debugging-nya satu trace. Dan sistem itu — persis seperti yang diceritakan di [seri GPS Backend](/writing/2026/memahami-gps-protocol/) — menangani beban yang dikhawatirkan orang hanya bisa ditangani armada service.

Bukan karena kami anti-microservice. Karena kami menghitung.

## Yang Sebenarnya Dibeli Microservice

Microservice jarang menyelesaikan masalah teknis yang tidak bisa diselesaikan monolith. Yang dia selesaikan hampir selalu **masalah organisasi**:

- Banyak tim yang saling menginjak deploy satu sama lain → deploy independence
- Codebase yang tidak muat di kepala satu tim → ownership boundary
- Conway's law yang sudah memecah organisasi → arsitektur yang mengikutinya

Itu masalah nyata — untuk perusahaan dengan puluhan engineer. Kalau timmu lima orang dan deploy-mu dua kali seminggu, kamu tidak punya masalah itu. Yang kamu punya harapan akan punya, dan harapan itu dibayar hari ini dengan **distributed system tax**: kegagalan jaringan antar-service yang harus ditangani, konsistensi data yang jadi tidak lagi gratis, tracing yang butuh infrastruktur sendiri, pipeline deploy dikali jumlah service, dan satu bug yang dulu bisa ditemukan dalam satu stack trace kini tersebar di lima log.

Pajak itu bukan mitos — dia tagihan bulanan yang jatuh tempo tepat saat tim kecil sedang paling sibuk membangun produk.

## Monolith Modular Bukan Monolith Sembarangan

Satu hal perlu jujur: membela monolith **tidak** sama dengan membela codebase raksasa tanpa batas. Monolith yang membusuk — controller 2.000 baris, semua import semua — adalah cara paling pasti memastikan suatu hari kamu _benar-benar butuh_ microservice karena tidak ada yang sanggup menyentuh apa pun tanpa merusak semuanya.

Yang saya pertahankan adalah **monolith modular**: batas modul yang ditegakkan sama ketatnya dengan batas service, hanya saja tanpa network di antaranya.

- Modul berkomunikasi lewat antarmuka eksplisit, bukan saling megang database orang
- Satu modul bisa dibaca dan dipahami sendirian
- Dependency mengalir satu arah (seperti usecase → repository, tidak bolak-balik)

Bukti bahwa batas ini nyata, dari proyek yang sama: migrasi Laravel → Go dilakukan **tanpa big-bang rewrite**. Dua backend berjalan paralel, endpoint dipindahkan satu per satu lewat proxy — bisa dilakukan justru karena batas modul dan kontraknya rapi sejak awal. Batas yang bisa dipindah antar-runtime adalah batas yang kelak bisa dipindah antar-service.

## Kapan Saya Akan Naik Kelas

"Microservice nanti" bukan jargon penghibur — ada sinyal konkret yang akan membuat saya memecah sistem, dan tidak satu pun di antaranya adalah "karena sekarang trenya":

1. **Deploy benar-benar saling menginjak** — tim berbeda harus rilis komponen berbeda dengan ritme berbeda, dan antrian koordinasi jadi bottleneck yang terasa tiap minggu.
2. **Profil beban yang ekstrem timpang** — satu modul butuh resource kelas beda (mis. komputasi berat yang layak di-scale terpisah dari API yang ringan).
3. **Isolasi kegagalan yang sudah terbukti menyakitan** — crash satu modul berulang kali menyeret keseluruhan sistem, dan bukan karena bug yang bisa diperbaiki.
4. **Organisasi memang sudah terpecah** — tim-tim dengan ownership berbeda, siklus rilis berbeda, bahkan runtime berbeda.

Saat sinyal itu muncul, jalannya bukan memulai dari nol, tapi **strangler pattern**: ekstraksi modul yang paling mature jadi service pertama, proxy mengalihkan lalu-lintas, sisanya menyusul. Dan ini kuncinya: ekstraksi itu murah hanya kalau batas modulnya sudah rapi. Modul yang bolong-bonggok sebagai monolith tidak akan ajaib jadi service yang sehat — kamu hanya mendistribusikan kekacauannya ke jaringan.

Jadi urutan yang benar bukan "monolith dulu, microservice kalau sudah jago". Urutannya: **modular dulu, distribusi kalau sudah dibutuhkan**. Monolith modular yang rapi adalah jalan menuju microservice yang benar — bukan lawannya.

## Ruang untuk Setuju yang Sehat

Biar tidak jadi artikel satu sisi: ada kondisi di mana microservice memang benar sejak awal, dan saya akan memilihnya tanpa ragu:

- Boundary organisasi sudah keras dari regulasi (data pribadi satu yurisdiksi, audit terpisah, tenant yang menuntut isolasi fisik)
- Sistem memang federasi runtime sejak lahir — misal pipeline yang harus menjalankan komponen Python, Go, dan JVM bersamaan dengan siklus hidup berbeda
- Produkmu secara bisnis memang platform multi-team dari hari pertama (marketplace dengan divisi-divisi independen)

Perhatikan polanya: semuanya **constraint eksternal yang nyata**, bukan optimasi teknis yang dibayangkan. Selama alasanmu bisa ditulis dalam satu kalimat ber-subjek "tim/regulasi/runtime", microservice sah. Kalau kalimatnya ber-subjek "biar kelihatan modern", kembali ke meja gambar.

## Penutup

Saya pernah menulis bahwa [memilih tech stack itu soal bisnis, bukan ego](/writing/2026/tech-stack-ego-vs-business/) — dan arsitektur adalah versi besar dari kalimat yang sama. Microservice dibeli dengan kompleksitas; monolith modular dibeli dengan disiplin. Untuk tim dan masalah yang dimiliki mayoritas dari kita, disiplin jauh lebih murah — dan bisa dikonversi jadi kompleksitas kapan pun kita benar-benar butuh, bukan sebaliknya.

Kompleksitas yang dibeli sebelum waktunya tidak hilang — dia hanya menunggu tagihannya di bulan-bulan ketika kamu paling sibuk membangun hal yang sebenarnya.

## CTA

Bagikan artikel ini jika bermanfaat. Untuk diskusi lebih lanjut, kunjungi [Contact](/contact/) atau subscribe [RSS](/writing/index.xml).
