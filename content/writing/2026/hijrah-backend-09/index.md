---
title: "Hijrah Backend (9): Epilog, MySQL, PostgreSQL, Lalu MySQL Lagi"
description: "Epilog seri Hijrah Backend: kisah mesin database yang berubah arah dua kali, optimasi LISTEN/NOTIFY yang hangus, kerja dua kali, dan warisan frontend yang tercium dari seberang."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:00+07:00
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

Seri ini sudah ditutup di [episode lalu](/writing/2026/hijrah-backend-08/). Tapi setiap perjalanan panjang selalu punya satu cerita yang tidak muat di badan utama, dan cerita ini memang terjadi setelah hampir semua episode lain ditulis. Anggap saja adegan pasca-kredit di film: layar sudah gelap, lampu sudah nyala, tapi ada satu adegan lagi hehe.

Ini kisah tentang mesin _database_ yang diminta pindah haluan dua kali. Dan soal siapa yang pegang kemudi saat itu: bukan saya, dan Anda mungkin sudah bisa menebak hahaha.

## Visi Awal: Satu PostgreSQL untuk Semua

Arah awalnya jelas dan tertulis. Di grup atasan, awal 2025, kalimatnya keluar dengan mantap:[^1] _cloud_ plus Go plus PostgreSQL adalah keharusan. Satu mesin untuk semuanya, satu dialek SQL, satu antrian yang perlu dipelajari. Secara visi, itu indah, dan saya jujur saja ikut antusias.

Kerjaannya juga nyata: konversi skema dari MySQL, perbaikan tipe data yang tidak punya padanan langsung, _import_ data yang konflik di sana-sini, sampai membangun ulang modelnya di Go. Sampai satu fitur yang membuat saya bangga: pembaruan _real-time_ antar aplikasi dibangun di atas _LISTEN_/_NOTIFY_ bawaan PostgreSQL.[^2] Tidak butuh _message broker_ tambahan untuk kasus itu; _database_-nya sendiri yang mengetuk pintu. Rakus sedikit, tapi rakusnya teknis hehe~

## Pulang, Nak

Lalu, sekitar setahun kemudian, arah angin berubah. Keputusan datang: sistem warisan tetap MySQL, dan data domain utama kembali ke MySQL. PostgreSQL tidak dihapus; dia dipindahkan ke pangkalan yang lebih cocok: data _time-series_ lokasi, yang memang paling rakus dan paling butuh partisi waktu.

Dari kacamata bisnis, keputusan itu punya logikanya: data yang sama tidak perlu dirawat di dua mesin dengan dua aturan, dan sistem warisan yang masih hidup memang bertahan lebih lama dari rencana siapa pun. Saya tidak berdebat dengan logikanya.

Tapi biayanya mendarat ke tempat yang sama seperti biasa: ke meja saya.

Aplikasi yang sudah lahir dan tumbuh di dialek PostgreSQL tiba-tiba harus hidup di dialek MySQL: sintaks yang beda, perilaku _standard library_ SQL yang beda, tipe yang beda nama dan beda mood. _Error_ bermunculan di tempat yang kemarin masih hijau. Optimasi _LISTEN_/_NOTIFY_ yang sudah jadi? Menganggur. Dan saya? Saya mengerjakan hal yang sama untuk kedua kalinya, dengan tangan yang sudah hafal jalan yang salah hehe~

## Yang Tersisa dari Dua Dunia

Hasil akhirnya terlihat seperti damai setelah duel: MySQL memegang data domain, PostgreSQL memegang data lokasi. Dua mesin, dua peran, tidak saling mengganggu. Bukan arsitektur yang lahir dari gambar rapi di _whiteboard_; dia lahir dari dua keputusan besar yang berbalik arah, dan _deployment_ yang harus tetap hidup di antara keduanya.

Kalau Anda bertanya mana yang benar: keduanya benar, di waktunya masing-masing. Visi awal benar sebagai visi; keputusan balik benar sebagai keseimbangan biaya. Yang tidak benar adalah mengira arah arsitektur tidak akan pernah berubah, lalu membangun segalanya tanpa rencana cadangan. Itu kesalahan saya, dan dia saya bayar tunai hahaha.

## Dan Frontend? Sama Saja

Supaya adil, warisan yang tidak konsisten itu ternyata tidak berhenti di _backend_. Saat mulai menyentuh _frontend_ v3 (yang port tipis dari v2), luka-lama yang sama tercium lagi dari sisi seberang: _field_ yang sumbernya berpindah-pindah, konvensi penamaan yang berganti-ganti era, dan kode yang membuat saya, seorang _backend engineer_ biasa, bisa mencium bau _spaghetti_ tanpa perlu jago _frontend_ hehe~

Tapi itu cerita untuk seri lain, mungkin. Yang ini sudah cukup panjang.

## Pelajaran Epilog

1. **Hitung biaya balik sebelum berangkat.** Migrasi mesin _database_ itu bukan satu jalan; itu jalan pulang-pergi kalau keputusannya tidak dipagari dengan data.
2. **Fleksibilitas dialek SQL itu mahal.** Kalau mau bisa pindah-pindah mesin, jangan menyentuh fitur khasnya (iya, termasuk _LISTEN_/_NOTIFY_-ku yang malang). Kalau mau memakai fitur khasnya, jangan berjanji bisa pindah. Pilih satu.
3. **Satu data, satu rumah.** Dua mesin boleh, asal perannya tidak tumpang tindih. Yang melelahkan bukan jumlahnya, tapi tumpang tindihnya.
4. **Keputusan di atas gaji Anda tetap keputusan yang harus dijalani.** Tugas kita bukan menang di rapat; tugas kita memastikan sistem tetap hidup setelah rapat selesai, sambil menyimpan catatan biayanya hehe.

Dengan ini, benar-benar tutup. Terima kasih sudah membaca sampai adegan pasca-kredit. Semoga armada kalian (kalau punya) selalu bicara, dan mesin databasenya tidak pindah haluan.

Sekian. Salam.

[^1]: Kutipan dan urutan kejadian disajikan dari ingatan dan catatan pribadi, dengan istilah teknis disederhanakan; nama pihak dan _provider_ tidak disebut, konsisten dengan episode-episode sebelumnya.

[^2]: Penjelasan singkat: _LISTEN_/_NOTIFY_ adalah fitur PostgreSQL untuk mengirim sinyal antar aplikasi yang tersambung ke _database_ yang sama. Praktis untuk _live update_; tidak berguna kalau aplikasinya pindah mesin.
