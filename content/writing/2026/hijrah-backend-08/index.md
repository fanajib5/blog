---
title: "Hijrah Backend (8): Refleksi 18 Bulan (Lebih atau Kurang)"
description: "Episode terakhir seri Hijrah Backend: apa yang akan saya kerjakan beda kalau mengulang, utang arsitektur yang dijanjikan sejak Ep 2, rencana mengajar yang tidak jadi, dan terima kasih."
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

Ini episode terakhir seri ini. Angka "18 bulan" di judul perlu tanda kutip: dari hari pertama sampai tulisan ini dibuat, waktunya sudah lebih dari itu. Ya sudahlah, angka di _slide_ memang punya versinya sendiri. Dari awal seri ini memang bercerita tentang selisih itu hahaha.[^1]

Tujuh episode sebelumnya isinya pelajaran teknis. Di bagian terakhir ini saya cerita apa yang akan saya ubah kalau mengulang, utang arsitektur yang saya janjikan sejak [episode kedua](/writing/2026/hijrah-backend-02/), rencana mengajar yang tidak terlaksana, dan hal yang paling saya syukuri.

## Yang Akan Saya Kerjakan Beda Kalau Mengulang

**Pertama, saya akan membahas angka target dengan data sejak hari pertama.** [Episode satu](/writing/2026/hijrah-backend-01/) sudah menunjukkan hitungannya: 370+ _endpoint_, tiga bulan, kira-kira empat _endpoint_ per hari tanpa libur. Kalau mengulang, spreadsheet itu akan saya bawa ke _interview_: ini jumlahnya, ini kerumitannya, ini tenaga yang tersedia (satu orang). Angka jujur di awal lebih murah daripada _burnout_ di tengah jalan.

**Kedua, dokumentasi ditulis sejak hari pertama.** Susahnya sistem lama bukan cuma kodenya, tapi juga pengetahuan yang tersimpan di kepala satu orang. _Kode_ jadi satu-satunya spesifikasi. Saya sih senang jadi "manusia dokumentasi" tiap ada yang bertanya, tapi tidak mau siapa pun, termasuk saya sendiri beberapa tahun lagi, bergantung pada itu. Seri blog ini salah satu cara saya mencicil utangnya hehe.

**Ketiga, verifikasi paritas dijadwalkan, bukan mengandalkan perasaan.** Di [episode tiga](/writing/2026/hijrah-backend-03/) saya sudah cerita bahwa saya mengumumkan "selesai" sebelum verifikasi mencapai 100%, dan benar saja. Kalau mengulang, verifikasi punya _checklist_ dan jatah waktu sendiri, bukan menunggu saya merasa siap.

**Keempat, kesehatan mental masuk estimasi proyek.** Tiga bulan pertama menagih bayarannya ke kepala saya. Saya tidak menyesal bekerja keras, tapi kalau mengulang, durasi dan bebannya akan saya tulis sejujur estimasi _endpoint_.

**Kelima, arsitektur dibahas sebelum diwarisi.** Nah, ini membawa saya ke janji yang belum saya bayar.

## Utang Arsitektur yang Dijanjikan Sejak Ep 2

Di [episode kedua](/writing/2026/hijrah-backend-02/) saya berjanji menjelaskan kenapa _endpoint_ ringan di sistem ini masih punya _floor_ sekitar 2-3 detik setelah semua perbaikan.

Penyebabnya bukan kode, tapi arsitektur. _User_ dan _database_ utama ada di Indonesia, sedangkan aplikasinya di _region cloud_ Eropa. Setiap klik harus menyeberang dua kali. Selama susunan itu tidak berubah, _optimasi_ ada batasnya. Waktu respons memang bisa turun dari 17 detik ke 3 detik, tapi lantai tiga detik itu tidak tembus kalau cuma lewat _kode_.

Jalan keluarnya sudah lama jelas: pindahkan aplikasi lebih dekat ke _database_ dan _user_, atau dekatkan replikanya. Dua-duanya bukan _refactoring_, tapi keputusan infrastruktur yang butuh anggaran dan koordinasi lintas pihak. Di sini saya harus mengaku sebagai penulis solo: **sebagian utang tidak bisa dibayar sendirian, dan mengakuinya juga bagian dari pekerjaan.**[^2] Mudah-mudahan suatu hari saya bisa menulis lanjutannya sebagai cerita sukses, bukan cuma cetak biru hahaha.

## Satu Babak yang Tidak Jadi

Ada satu babak yang hampir saya jadikan bagian favorit seri ini: saya diminta mengajari Go ke tim. Rencananya sudah ada sejak Agustus 2025. Saya menyiapkan materi untuk empat minggu: pengenalan Go, fungsi dan struktur data, OOP dan _concurrency_, sampai _web development_ dengan Go. Salah satu rekan bahkan sudah membelikan kursus _online_ supaya bisa ikut belajar.

Sampai episode ini ditulis, kelasnya belum pernah terjadi.

Kalau dipikir-pikir, cocok juga jadi penutup seri tentang selisih antara rencana dan kenyataan: rencana terakhir yang tidak jalan adalah rencana saya mengajar. Materinya masih rapi di repo, antre menunggu jadwal bersama rencana-rencana lain yang sudah lebih dulu mengantre hehe.

> Sebenarnya, jujur, saya merasa ada kekecewaan. Alasannya sederhana: saya berharap dengan mengajari Go ke tim, mereka bisa melihat langsung pentingnya _planning_ dalam ngoding dan penggunaan tipe data pada variabel, hal yang seharusnya terasa penting lewat pengalaman, bukan lewat kelas saya. Saya akui, saya sendiri bukan pembaca yang terstruktur; saya baca apa pun yang sedang saya butuhkan, sehingga ilmu saya terasa seperti ilmu _cabutan_. Tapi dari kebiasaan itu saya justru belajar _debugging_ dan _system analysis_, biar lebih paham perilaku program dan cara mengatasi isu-isu _production_.

## Yang Paling Saya Syukuri

Seri ini dimulai dari lowongan kerja untuk menjalankan keputusan orang lain. Setelah itu ada mandat tiga bulan, _endpoint_ yang makan waktu 15 detik, mobil parkir yang ngebut, dan ratusan keputusan kecil di sela-selanya.

Tapi kalau ditanya apa yang paling saya syukuri, jawabannya bukan soal teknis.

> Selain kehebohan yang saya alami selama proses migrasi ke Go ini, saya bersyukur mendapatkan banyak sekali pengetahuan, dari sisi teknis sampai sisi psikologis, manajemen, dan kepemimpinan. Itu semua, _Alhamdulillah_, bisa saya raih berkat ridha Allah serta doa keluarga dan istri yang tidak pernah putus.

Saya cuma menambahkan satu kalimat dari saya: tidak banyak pekerjaan yang membiarkan kamu melihat sesuatu yang kamu tulis diam-diam bekerja untuk puluhan ribu orang, setiap detik, tanpa pamit. Itu privilese. _Alhamdulillah_.

## Penutup Seri

Tujuh episode teknis, satu refleksi, dan perjalanan yang katanya tiga bulan.

Terima kasih sudah mengikuti seri ini. Kalau kamu sedang menjalani migrasi serupa: hitung pekerjaannya, tulis dokumentasinya, dan jangan lupa jaga diri. Soal kata "selesai", ya... ternyata maknanya bisa melar juga, seperti yang saya pelajari di perjalanan ini.

[^1]: Angka-angka dalam refleksi ini merujuk pada episode-episode sebelumnya, yang masing-masing sudah mencantumkan catatan pembulatannya.

[^2]: Detail infrastruktur dan nama-nama pihak tetap tidak disebut, konsisten dengan episode-episode sebelumnya.
