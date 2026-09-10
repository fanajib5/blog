---
title: "Hijrah Backend (8): Refleksi 18 Bulan (Lebih atau Kurang)"
description: "Episode terakhir seri Hijrah Backend: yang akan saya kerjakan beda kalau mengulang, anti-pattern transbenua yang dijanjikan sejak Ep 2, satu rencana mengajar yang tidak jadi, dan kata terima kasih."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:00+07:00
lastmod: 2026-09-10T15:40:00+07:00
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

Ini episode terakhir berseri. Dan seperti yang sudah Anda duga dari judulnya, angka "18 bulan" itu sendiri perlu tanda kutip: kalau dihitung dari hari pertama sampai tulisan ini disusun, angkanya lebih dari itu. Tapi ya sudahlah, angka di _slide_ memang punya versi masing-masing; seri ini sejak awal memang cerita tentang selisihnya hahaha.[^1]

Tujuh episode sebelumnya sudah membahas pelajaran teknis satu per satu. Episode ini isinya sisanya: yang akan saya kerjakan beda, utang arsitektur yang saya janjikan sejak [episode kedua](/writing/2026/hijrah-backend-02/), satu babak yang tidak jadi, dan terima kasih.

## Yang Akan Saya Kerjakan Beda Kalau Mengulang

**Pertama, angka target akan saya debat dengan data, sejak hari nol.** [Episode satu](/writing/2026/hijrah-backend-01/) sudah memperlihatkan aritmetikanya: 370+ _endpoint_, tiga bulan, kira-kira empat _endpoint_ per hari tanpa libur. Kalau mengulang, saya akan meletakkan spreadsheet itu di meja sejak _interview_: ini jumlahnya, ini kompleksitasnya, ini manusianya (satu orang). Angka yang jujur di awal lebih murah daripada _burnout_ di tengah.

**Kedua, dokumentasi ditulis sejak hari pertama.** Salah satu kesulitan terbesar warisan sistem lama bukan kodenya, tapi pengetahuannya: semua ada di kepala satu orang, dan _kode_ yang menjadi satu-satunya spesifikasi. Saya menikmati peran "manusia dokumentasi" ketika menjawab pertanyaan; saya tidak ingin siapa pun (termasuk diri saya beberapa tahun lagi) tergantung pada itu. Seri blog ini sebenarnya bagian dari pembayarannya hehe.

**Ketiga, verifikasi paritas dijadwalkan, bukan dirasakan.** [Episode tiga](/writing/2026/hijrah-backend-03/) sudah cerita: saya mengumumkan "selesai" padahal verifikasinya belum 100%, dan benar saja. Kalau mengulang, verifikasi itu akan jadi _checklist_ yang punya jatah waktu sendiri, bukan perasaan yang ditunggu datang.

**Keempat, kesehatan mental masuk estimasi proyek.** Ada periode tiga bulan di awal yang menagih bayarannya ke kepala saya. Saya tidak menyesal bekerja keras; saya hanya akan menulis durasinya dengan tinta yang sama jujurnya seperti menulis estimasi _endpoint_.

**Kelima, arsitektur didiskusikan sebelum diwarisi.** Dan ini bawa kita ke janji saya.

## Utang Arsitektur yang Dijanjikan Sejak Ep 2

Di [episode kedua](/writing/2026/hijrah-backend-02/) saya berjanji membahas satu hal di episode penutup: kenapa _endpoint_-endpoint ringan di sistem ini masih punya _floor_ sekitar 2-3 detik, setelah semua perbaikan.

Penyebabnya bukan kode; arsitekturnya. _User_ di Indonesia, _database_ utama di Indonesia, tapi aplikasinya di _region cloud_ Eropa. Setiap klik membayar dua kali penyeberangan. Selama itu diwarisi, semua _optimasi_ punya batas: kita bisa memperbaiki dari 17 detik ke 3 detik, tapi tiga detik itu lantainya, dan lantai tidak bisa ditokok oleh _kode_.

Jalan keluarnya jelas dan sudah lama teridentifikasi: pindahkan aplikasi mendekati _database_ dan _user_-nya, atau tarik replika mendekat. Keduanya bukan _refactoring_; keduanya keputusan infrastruktur dengan anggaran dan koordinasi lintas pihak. Jadi ini dia titik jujur satu-satunya penulis solo: **sebagian utang tidak bisa dibayar sendirian, dan mengakuinya pun bagian dari pekerjaan.**[^2] Semoga suatu hari episode lanjutannya bisa saya tulis dengan cerita keberhasilan, bukan cuma cetak biru hahaha.

## Satu Babak yang Tidak Jadi

Ada satu babak yang hampir saya ceritakan sebagai bagian favorit seri ini: diminta mengajari Go ke tim. Rencananya sudah ada sejak Agustus 2025. Materinya sudah saya siapkan sendiri, terstruktur empat minggu: pengenalan Go, fungsi dan struktur data, OOP dan _concurrency_, sampai _web development_ dengan Go. Salah satu rekan bahkan sudah membelikan kursus _online_ untuk ikut belajar.

Sampai episode ini ditulis, kelas itu belum pernah terjadi.

Dan setelah saya renungkan, ini justru penutup yang cocok untuk seri penuh cerita tentang selisih antara rencana dan realita: rencana terakhir yang tidak berjalan adalah rencana tentang saya mengajar. Materinya masih tergantung rapi di repo, menunggu dijadwalkan, antre di belakang jadwal-jadwal lain yang sudah lebih dulu menunggu hehe.

> Sebenarnya, jujur, saya merasa ada kekecewaan. Alasannya sederhana: saya berharap dengan mengajari Go ke tim, mereka bisa melihat langsung pentingnya _planning_ dalam ngoding dan penggunaan tipe data pada variabel, hal yang seharusnya terasa penting lewat pengalaman, bukan lewat kelas saya. Saya akui, saya sendiri bukan pembaca yang terstruktur; saya baca apa pun yang sedang saya butuhkan, sehingga ilmu saya terasa seperti ilmu _cabutan_. Tapi dari kebiasaan itu saya justru belajar _debugging_ dan _system analysis_, biar lebih paham perilaku program dan cara mengatasi isu-isu _production_.

## Yang Paling Saya Syukuri

Seri ini dimulai dari lowongan kerja yang mengajak mewujudkan keputusan orang lain, lewat mandat tiga bulan, _endpoint_ yang makan 15 detik, mobil parkir yang ngebut, dan ratusan keputusan kecil di antaranya.

Tapi kalau ditanya apa yang paling saya syukuri, jawabannya bukan teknis.

> Selain kehebohan yang saya alami selama proses migrasi ke Go ini, saya bersyukur mendapatkan banyak sekali pengetahuan, dari sisi teknis sampai sisi psikologis, manajemen, dan kepemimpinan. Itu semua, _Alhamdulillah_, bisa saya raih berkat ridha Allah serta doa keluarga dan istri yang tidak pernah putus.

Saya hanya menambahkan satu kalimat dari saya: tidak banyak pekerjaan yang membiarkan kamu melihat sesuatu yang kamu tulis diam-diam bekerja untuk puluhan ribu orang, setiap detik, tanpa pamit. Itu privilese. _Alhamdulillah_.

## Penutup Seri

Tujuh episode, satu refleksi, dan satu perjalanan yang katanya tiga bulan.

Terima kasih sudah mengikuti sampai sini. Kalau kebetulan Anda sedang berada di tengah migrasi semacam ini: ukur dulu, tulis dokumentasinya, rawat dirinya, dan ingat bahwa "selesai" itu spektrum. Sampai jumpa di tulisan-tulisan berikutnya, yang semoga tidak harus menunggu migrasi dulu hehe.

Terima kasih sudah tersasar ke sini. Semoga harimu menyenangkan!

Sekian. Salam.

[^1]: Angka-angka dalam refleksi ini merujuk pada episode-episode sebelumnya, yang masing-masing sudah mencantumkan catatan pembulatannya.

[^2]: Detail infrastruktur dan nama-nama pihak tetap tidak disebut, konsisten dengan episode-episode sebelumnya.
