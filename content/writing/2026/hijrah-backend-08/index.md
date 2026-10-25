---
title: "Hijrah Backend (8): Refleksi 18 Bulan (Lebih atau Kurang)"
description: "Episode terakhir seri Hijrah Backend: yang akan saya kerjakan beda kalau mengulang, anti-pattern transbenua yang dijanjikan sejak Ep 2, satu rencana mengajar yang tidak jadi, dan kata terima kasih."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:08+07:00
lastmod: 2026-09-11T09:00:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - refleksi
  - karir
  - cerita
series: "Hijrah Backend"
---

Ini episode terakhir seri ini. Angka "18 bulan" di judul perlu tanda kutip: dari hari pertama sampai tulisan ini disusun, waktunya sudah lebih dari itu. Tapi ya sudahlah, angka di _slide_ memang punya versi masing-masing. Sejak awal, seri ini memang bercerita tentang selisih itu hahaha.[^1]

Tujuh episode sebelumnya membahas pelajaran teknis. Di bagian terakhir ini, saya menulis tentang hal-hal yang akan saya ubah jika mengulang, utang arsitektur yang saya janjikan sejak [episode kedua](/writing/2026/hijrah-backend-02/), rencana mengajar yang tidak terlaksana, dan hal yang paling saya syukuri.

## Yang Akan Saya Kerjakan Beda Kalau Mengulang

**Pertama, saya akan membahas angka target dengan data sejak hari pertama.** [Episode satu](/writing/2026/hijrah-backend-01/) sudah menunjukkan hitungannya: 370+ _endpoint_, tiga bulan, kira-kira empat _endpoint_ per hari tanpa libur. Jika mengulang, saya akan membawa spreadsheet itu ke _interview_: ini jumlahnya, ini kompleksitasnya, dan ini tenaga yang tersedia (satu orang). Angka yang jujur sejak awal lebih murah daripada _burnout_ di tengah.

**Kedua, dokumentasi harus ditulis sejak hari pertama.** Kesulitan terbesar dari sistem lama bukan hanya kodenya, melainkan pengetahuan yang tersimpan di kepala satu orang. _Kode_ menjadi satu-satunya spesifikasi. Saya senang menjawab pertanyaan sebagai "manusia dokumentasi", tetapi saya tidak ingin siapa pun, termasuk diri saya beberapa tahun lagi, bergantung pada itu. Seri blog ini salah satu cara saya membayar utang tersebut hehe.

**Ketiga, verifikasi paritas harus dijadwalkan, bukan mengandalkan perasaan.** Di [episode tiga](/writing/2026/hijrah-backend-03/) saya sudah bercerita bahwa saya mengumumkan "selesai" sebelum verifikasi mencapai 100%, dan benar saja. Kalau mengulang, verifikasi akan punya _checklist_ dan jatah waktunya sendiri, bukan menunggu sampai saya merasa siap.

**Keempat, kesehatan mental harus masuk estimasi proyek.** Tiga bulan pertama menagih bayarannya ke kepala saya. Saya tidak menyesal bekerja keras, tetapi jika mengulang, durasi dan bebannya akan saya tulis sejujur estimasi _endpoint_.

**Kelima, arsitektur perlu dibahas sebelum diwarisi.** Ini membawa saya ke janji yang belum dibayar.

## Utang Arsitektur yang Dijanjikan Sejak Ep 2

Di [episode kedua](/writing/2026/hijrah-backend-02/) saya berjanji menjelaskan kenapa _endpoint_ ringan di sistem ini masih punya _floor_ sekitar 2-3 detik setelah semua perbaikan.

Penyebabnya bukan kode, melainkan arsitektur. _User_ dan _database_ utama ada di Indonesia, tetapi aplikasinya berada di _region cloud_ Eropa. Setiap klik harus menempuh dua kali penyeberangan. Selama susunan itu tidak berubah, _optimasi_ punya batas. Waktu respons bisa turun dari 17 detik menjadi 3 detik, tetapi lantai tiga detik itu tidak bisa ditembus dengan _kode_ saja.

Jalan keluarnya sudah lama jelas: pindahkan aplikasi lebih dekat ke _database_ dan _user_, atau dekatkan replikanya. Keduanya bukan _refactoring_, melainkan keputusan infrastruktur yang memerlukan anggaran dan koordinasi lintas pihak. Inilah bagian yang perlu saya akui sebagai penulis solo: **sebagian utang tidak bisa dibayar sendirian, dan mengakuinya pun bagian dari pekerjaan.**[^2] Mudah-mudahan suatu hari saya bisa menulis kelanjutannya sebagai cerita keberhasilan, bukan hanya cetak biru hahaha.

## Satu Babak yang Tidak Jadi

Ada satu babak yang hampir saya masukkan sebagai bagian favorit seri ini: saya diminta mengajari Go ke tim. Rencananya sudah ada sejak Agustus 2025. Saya menyiapkan materi untuk empat minggu: pengenalan Go, fungsi dan struktur data, OOP dan _concurrency_, sampai _web development_ dengan Go. Salah satu rekan bahkan sudah membelikan kursus _online_ agar bisa ikut belajar.

Sampai episode ini ditulis, kelas itu belum pernah terjadi.

Setelah saya renungkan, ini cocok menjadi penutup untuk seri tentang selisih antara rencana dan kenyataan: rencana terakhir yang tidak berjalan adalah rencana saya mengajar. Materinya masih tersimpan rapi di repo, menunggu jadwal seperti rencana-rencana lain yang sudah lebih dulu mengantre hehe.

> Sebenarnya, jujur, saya merasa ada kekecewaan. Alasannya sederhana: saya berharap dengan mengajari Go ke tim, mereka bisa melihat langsung pentingnya _planning_ dalam ngoding dan penggunaan tipe data pada variabel, hal yang seharusnya terasa penting lewat pengalaman, bukan lewat kelas saya. Saya akui, saya sendiri bukan pembaca yang terstruktur; saya baca apa pun yang sedang saya butuhkan, sehingga ilmu saya terasa seperti ilmu _cabutan_. Tapi dari kebiasaan itu saya justru belajar _debugging_ dan _system analysis_, biar lebih paham perilaku program dan cara mengatasi isu-isu _production_.

## Yang Paling Saya Syukuri

Seri ini dimulai dari lowongan kerja untuk mewujudkan keputusan orang lain. Setelah itu ada mandat tiga bulan, _endpoint_ yang makan waktu 15 detik, mobil parkir yang ngebut, dan ratusan keputusan kecil di antaranya.

Tapi kalau ditanya apa yang paling saya syukuri, jawabannya bukan teknis.

> Selain kehebohan yang saya alami selama proses migrasi ke Go ini, saya bersyukur mendapatkan banyak sekali pengetahuan, dari sisi teknis sampai sisi psikologis, manajemen, dan kepemimpinan. Itu semua, _Alhamdulillah_, bisa saya raih berkat ridha Allah serta doa keluarga dan istri yang tidak pernah putus.

Saya hanya menambahkan satu kalimat dari saya: tidak banyak pekerjaan yang membiarkan kamu melihat sesuatu yang kamu tulis diam-diam bekerja untuk puluhan ribu orang, setiap detik, tanpa pamit. Itu privilese. _Alhamdulillah_.

## Penutup Seri

Tujuh episode teknis, satu refleksi, dan perjalanan yang katanya tiga bulan.

Terima kasih sudah mengikuti seri ini. Kalau sedang menjalani migrasi serupa, ukur pekerjaannya, tulis dokumentasinya, dan jaga diri sendiri. Kata "selesai" pun punya rentang makna, seperti yang saya pelajari selama perjalanan ini.

[^1]: Angka-angka dalam refleksi ini merujuk pada episode-episode sebelumnya, yang masing-masing sudah mencantumkan catatan pembulatannya.

[^2]: Detail infrastruktur dan nama-nama pihak tetap tidak disebut, konsisten dengan episode-episode sebelumnya.
