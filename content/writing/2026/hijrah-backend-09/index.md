---
title: "Hijrah Backend (9): Epilog, MySQL, PostgreSQL, Lalu MySQL Lagi"
description: "Catatan tambahan setelah seri Hijrah Backend selesai: database yang pindah arah dua kali, kerja ulang, dan sedikit bau spaghetti dari frontend."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:09+07:00
lastmod: 2026-09-11T02:00:00+07:00
draft: false
toc: true
comments: false
tags:
  - postgresql
  - mysql
  - migrasi
  - cerita
series: "Hijrah Backend"
---

Seri ini sudah ditutup di [episode lalu](/writing/2026/hijrah-backend-08/). Namun ada satu cerita yang tidak sempat masuk ke bagian utama. Kejadiannya berlangsung setelah hampir semua episode lain ditulis. Anggap saja adegan pasca-kredit: layar sudah gelap, lampu sudah menyala, tapi masih ada satu adegan lagi hehe.

Ini kisah tentang mesin _database_ yang dua kali diminta pindah haluan. Soal siapa yang memegang kemudi, bukan saya. Mungkin Anda sudah bisa menebak hahaha.

## Rencana Awalnya: PostgreSQL untuk Semua

Arah awalnya jelas dan tertulis. Pada awal 2025, di grup atasan, pesannya disampaikan dengan mantap:[^1] _cloud_ plus Go plus PostgreSQL adalah keharusan. Satu mesin untuk semuanya, satu dialek SQL, satu antrean teknologi yang perlu dipelajari. Visinya terdengar bagus, dan saya ikut antusias.

Pekerjaannya lumayan banyak: konversi skema dari MySQL, bereskan tipe data yang tidak punya padanan langsung, impor data yang berkonflik, lalu bangun ulang modelnya di Go. Ada satu fitur yang membuat saya bangga: pembaruan _real-time_ antar aplikasi dengan _LISTEN_/_NOTIFY_ bawaan PostgreSQL.[^2] Untuk itu, kami tidak perlu _message broker_ tambahan; _database_-nya sendiri yang mengetuk pintu. Sedikit rakus, tapi rakus secara teknis hehe~

## Lalu Arah Anginnya Berubah

Sekitar setahun kemudian, arah angin berubah. Keputusannya: sistem warisan tetap memakai MySQL dan data domain utama kembali ke MySQL. PostgreSQL tidak dihapus, melainkan dialihkan ke tempat yang lebih cocok: data lokasi _time-series_, yang paling rakus dan paling membutuhkan partisi waktu.

Dari kacamata bisnis, keputusan itu masuk akal. Data yang sama tidak perlu dirawat di dua mesin dengan dua aturan, sementara sistem warisan masih bertahan jauh melampaui rencana siapa pun. Saya tidak mempermasalahkan logikanya.

Namun, biaya peralihannya mendarat di tempat yang sama: meja saya.

Aplikasi yang lahir dan tumbuh dengan dialek PostgreSQL tiba-tiba harus memakai dialek MySQL: sintaksnya berbeda, perilaku _standard library_ SQL-nya berbeda, begitu juga nama dan perilaku tipenya. _Error_ bermunculan di bagian yang sehari sebelumnya masih hijau. Optimasi _LISTEN_/_NOTIFY_ yang sudah selesai? Menganggur. Saya pun mengerjakan ulang hal yang sama, dengan tangan yang sudah hafal jalan yang salah hehe~

## Akhirnya, Dua Database

Hasil akhirnya tampak seperti damai setelah duel: MySQL memegang data domain, PostgreSQL memegang data lokasi. Dua mesin, dua peran, tanpa saling mengganggu. Arsitektur ini tidak lahir dari gambar rapi di _whiteboard_. Ia terbentuk dari dua keputusan besar yang berbalik arah, sementara _deployment_ harus tetap hidup di antaranya.

Kalau ditanya keputusan mana yang benar, saya rasa keduanya masuk akal pada waktunya. Yang bikin saya kapok adalah mengira arah arsitektur tidak akan berubah, lalu membangun semuanya tanpa rencana cadangan. Tagihannya saya bayar sendiri dalam bentuk kerja ulang hahaha.

## Frontend-nya Juga Begitu

Warisan yang tidak konsisten itu ternyata tidak berhenti di _backend_. Saat mulai menyentuh _frontend_ v3, yang merupakan port tipis dari v2, saya mencium masalah lama dari sisi seberang: _field_ dengan sumber yang berpindah-pindah, konvensi penamaan dari era yang berbeda, dan kode yang membuat saya, _backend engineer_ biasa, bisa mencium bau _spaghetti_ tanpa jago _frontend_ hehe~

Mungkin itu cerita untuk seri lain. Yang ini sudah cukup panjang.

## Catatan dari Epilog Ini

1. **Pikirkan biaya pulangnya juga.** Migrasi _database_ bisa jadi perjalanan pulang-pergi kalau arah keputusan berubah.
2. **Fleksibilitas dialek SQL ada ongkosnya.** Kalau ingin pindah mesin dengan mudah, hati-hati memakai fitur khasnya (iya, termasuk _LISTEN_/_NOTIFY_-ku). Kalau mau memakainya, ya jangan sekaligus menjanjikan semuanya gampang dipindah.
3. **Satu data, satu rumah.** Dua mesin tidak masalah kalau perannya jelas. Yang bikin repot itu data yang tumpang tindih.
4. **Keputusan di atas gaji kita tetap harus dijalani.** Setelah rapat selesai, sistemnya harus tetap hidup. Saya cuma berharap biaya perubahannya ikut dicatat hehe.

Nah, itu tadi adegan pasca-kreditnya. Terima kasih sudah ikut sampai sini. Semoga armada Anda, kalau punya, rajin mengirim kabar. Dan semoga mesin databasenya tidak mendadak pindah haluan hehe.

[^1]: Kutipan dan urutan kejadian disajikan dari ingatan dan catatan pribadi, dengan istilah teknis disederhanakan; nama pihak dan _provider_ tidak disebut, konsisten dengan episode-episode sebelumnya.

[^2]: Penjelasan singkat: _LISTEN_/_NOTIFY_ adalah fitur PostgreSQL untuk mengirim sinyal antar aplikasi yang tersambung ke _database_ yang sama. Praktis untuk _live update_; tidak berguna kalau aplikasinya pindah mesin.
