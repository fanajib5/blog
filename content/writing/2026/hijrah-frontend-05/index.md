---
title: "Hijrah Frontend (5): Dua Sisi Satu Gedung"
description: "Catatan saya setelah port seri Hijrah Frontend selesai, tentang apa yang sudah dipindah dan apa yang masih menunggu."
author: "Faiq Najib Al-Aziz"
date: 2026-09-23T09:00:05+07:00
lastmod: 2026-09-23T21:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - frontend
  - refleksi
  - cerita
series: "Hijrah Frontend"
---

Ini episode terakhir seri _frontend_. Seperti [seri sebelah](/writing/2026/hijrah-backend-09/), saya tidak mau menulis seolah semua masalah sudah beres. Saya cuma ingin mencatat apa yang selesai, apa yang belum disentuh, dan apa yang saya pelajari setelah ikut mengurus kedua sisi gedung ini.

## Cek Inventaris Dulu

Empat episode lalu, saya mulai membongkar gedung _frontend_ warisan. Port-nya sekarang selesai, jadi saya catat dulu isinya:

- **76 halaman dipindahkan dan tetap hidup.** Port 1:1 tanpa meninggalkan satu halaman pun. Semua _link_ internal antarhalaman masih menuju ke tempat yang benar.
- **Dua _library_ UI tetap dipakai.** Ada 101 _file_ untuk yang mayoritas dan 13 untuk pemegang komponen kalender. Seperti sebelumnya, tidak ada _file_ yang memakai keduanya.
- **194 bekas luka tipe sudah terukur.**[^1] Ada 194 jaring pengaman kecil yang masih berupa angsuran, belum menjadi arsitektur.
- **Tiga era _styling_ masih ada**,[^2] satu _backup_ sudah dipensiunkan, dan _standardisasi_ menunggu giliran.

Angka-angka ini bukan tanda gedungnya sudah rapi. **Pindahan selesai, renovasi belum.** Saya sempat mencampuradukkan dua hal itu, padahal jelas beda pekerjaan.

## Backend dan Frontend, Sama-sama Warisan

Kalau saya lihat lagi dua seri ini, pola kerjanya mirip meski masalahnya beda.

Di _backend_, kami menemukan _query_ yang tidak sargable dan _prepared statement_ yang terputus di _tunnel_. Di _frontend_, ada _field_ dengan tipe yang tidak sesuai dan dua _library_ yang dipisahkan oleh garis demarkasi. Cara menanganinya serupa di kedua sisi: ukur dulu, pindahkan dengan setia, catat yang dibatalkan, dan jangan memperbaiki sambil memindahkan.

Dua sistem ini juga tumbuh karena waktu dan keadaan darurat, bukan karena seseorang duduk merancang arsitektur sempurna. Jadi saya susah menyalahkan _spaghetti_-nya. Kode itu tetap melayani pengguna meski orang yang merawatnya berganti.

## Yang Saya Catat untuk Nanti

Biar tidak semuanya menumpuk di kepala, saya pisahkan catatannya seperti ini:

Mulai sekarang, saya jaga batas antarlibrary supaya tidak ada _file_ campuran, kontrak tipe di pintu masuk, dan kebiasaan mencatat warisan yang kami bawa.

_TypeScript_, penamaan lintas era, dan _refactor_ struktur internal masih menunggu giliran. Saya ingin melihat data pemakaian dulu sebelum mengubah struktur.

Migrasi _state management_ batal, dan saya tidak menyesal. Rencana yang tidak jadi juga perlu dicatat, bukan disembunyikan seolah tidak pernah ada.

> Setelah ikut berjibaku merawat _web app_ v3 ini, saya malah makin merasa seperti turis. Hati masih protes, tapi _production_ tetap harus jalan.

Di [episode pertama](/writing/2026/hijrah-frontend-01/) saya bercanda soal visa turis yang dicabut dan diganti KTP penduduk. Kenyataannya, KTP-nya memang terbit, tetapi hati saya masih sering membawa paspor.

## Nah, Selesai Juga

Dengan episode ini, dua seri Hijrah selesai: [satu _backend_](/writing/2026/hijrah-backend-01/) dan seri _frontend_. Keduanya membahas dua sisi gedung yang sama, yang tetap melayani puluhan ribu _user_ setiap hari. Kode tidak minta tepuk tangan, tapi saya boleh kan? hehe.

Kalau kamu juga sedang mengurus sistem warisan, saya biasanya mulai dengan mengukur dulu. Pindahkan apa adanya, catat yang belum dikerjakan, dan jangan memaksa semuanya selesai sekaligus. Saya sendiri masih belajar bagian terakhir itu.

Terima kasih sudah mengikuti seri ini sampai akhir. Semoga gedung yang kamu urus tetap jalan meski penjaganya berganti.

Sekian. Salam.

[^1]: Angka-angka inventaris merujuk pada episode-episode sebelumnya di seri ini, yang masing-masing mencantumkan catatan pengukurannya.

[^2]: Nama _library_, _framework_, dan detail _stack_ tetap disederhanakan, konsisten dengan seluruh seri.
