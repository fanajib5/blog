---
title: "Hijrah Frontend (2): Port Tipis dan Warisan yang Ikut Naik"
description: "Ep 2 seri Hijrah Frontend: 76 halaman masuk, 76 halaman keluar. Kenapa nol halaman ditinggalkan, apa isi kotak yang dibuka pertama, dan satu rencana besar yang tidak jadi."
author: "Faiq Najib Al-Aziz"
date: 2026-09-23T09:00:02+07:00
lastmod: 2026-09-23T21:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - frontend
  - nextjs
  - migrasi
  - cerita
series: "Hijrah Frontend"
---

Pindahan di [episode pertama](/writing/2026/hijrah-frontend-01/) selesai. Pada hari serah terima, manifestnya hanya punya satu angka penting: **tujuh puluh enam kotak masuk, tujuh puluh enam kotak keluar. Tidak ada halaman yang tertinggal.**

Tidak ada yang tertinggal karena memang begitu keputusan kami. Ada yang sengaja dibawa, ada yang ikut tanpa diundang, dan ada satu rencana besar yang akhirnya batal. Saya ceritakan satu per satu.

## Kenapa Nol Halaman Ditinggalkan

Kalau pernah pindah rumah, mungkin Anda pernah merasa lega saat berkata, "yang ini buang aja". Migrasi _frontend_ punya godaan serupa. Menghapus halaman bisa terasa seperti merapikan _produk_ sekaligus.

Tapi menentukan hidup-mati halaman saat pindahan berarti mengambil dua keputusan sekaligus: memindahkan aplikasi dan mengubah cakupan produk. [Seri sebelah](/writing/2026/hijrah-backend-04/) sudah mengajari saya mahalnya kombinasi itu. Jadi aturannya jelas: **tujuh puluh enam masuk, tujuh puluh enam keluar**, diperiksa halaman demi halaman, tanpa skrip untuk membuangnya.

Hasilnya memang tidak dramatis, tetapi angkanya cocok: _repo_ baru berisi 76 halaman, sama seperti _repo_ lama, dan daftar foldernya cocok satu per satu. Halaman yang namanya bikin bertanya-tanya, seperti _demo_, _docs_, dan jalur khusus, ikut dipindahkan. Bukan karena semuanya penting; keputusan untuk menghapusnya memang bukan bagian dari fase ini.

## Isi Kotak yang Dibuka Pertama

Dua _library_ UI yang sudah lama hidup berdampingan menjadi kotak pertama yang kami buka. Di rumah baru, hitungannya terlihat jelas: satu _library_ dipakai di **101 _file_**, sementara yang satunya tinggal bertahan di **13 _file_**.

Angka itu memperlihatkan dua era: satu _library_ dominan, satu lagi muncul belakangan, dan keduanya hidup dalam aplikasi yang sama tanpa perang terbuka.[^1] Kami tetap membawa keduanya. Menghapus satu _library_ berarti mengubah semua _file_ yang memakainya, sedangkan mengubah semua _file_ saat pindahan bertentangan dengan aturan [episode empat](/writing/2026/hijrah-backend-04/).

Ada juga sambungan _state management_ warisan. Di _app router_ baru, hanya satu titik sambungan yang tersisa. Namun, titik itu masih menjadi jantung bagi halaman-halaman yang menggunakannya. Memotongnya sekarang berarti mengubah hal lain lagi, bukan pekerjaan pindahan ini.

## Yang Sadar Dibawa, yang Terekam

Kami juga mencatat beberapa warisan kecil saat memindahkannya:

- **JSX tanpa tipe**: negeri ini memang belum bicara _TypeScript_. Bukan keputusan episode ini; dia tercatat untuk keputusan lain, di hari lain.[^2]
- **Penamaan dua era**: sebagian berjudul kapital di awal, sebagian lagi mengikuti selera yang berbeda. Kami tidak menyeragamkan saat pindah; menyeragamkan itu kerjaannya epilog, bukan koper.
- **Satu `page.backup`**: satu halaman membawa jenazah _backup_-nya sendiri. Aku tertawa saat menemukannya, karena [dia punya saudara](/writing/2026/hijrah-backend-04/) di gedung sebelah hahaha.

Ada bedanya membawa sesuatu dengan sadar dan baru menemukannya setelah pindahan. Yang pertama punya catatan, alasan, dan giliran untuk dibersihkan nanti. Yang kedua sering luput dari perhatian, lalu ikut bertambah.

## Rencana Besar yang Tidak Jadi

Seperti di seri sebelah, ada rencana yang perlu dicatat meski tidak jadi dijalankan: mengganti _state management_ warisan dengan yang baru.

Rencana itu batal bukan karena gagal. Prioritasnya bergeser ke pekerjaan yang dampaknya lebih terasa bagi _user_. Membatalkan sesuatu sebelum menghabiskan sumber daya juga bagian dari _kontrol kualitas_ atas rencana sendiri.

## Pelajaran

1. **Pindahkan dulu 1:1, putuskan cakupan belakangan.** Menghapus halaman saat pindahan berarti membuat dua keputusan sekaligus.
2. **Hitung isi kotak.** Angka 76 ke 76 dan 101 ke 13 membuat pembicaraan soal warisan lebih konkret, bukan sekadar soal selera.
3. **Dua _library_ yang hidup berdampingan menandai dua era.** Keduanya punya alasan masing-masing untuk masih ada di aplikasi.
4. **Rencana yang dibatalkan sebelum menghabiskan biaya juga keputusan yang baik.** Catat alasannya agar jelas kapan perlu dibuka lagi.

Kotak berikutnya isinya bukan _library_, melainkan tipe data yang tidak seragam. Satu _field_ yang sama bisa dikirim sebagai angka, _string_ kosong, atau _string_ biasa, tergantung halaman yang mengirimnya. Di situlah _type chaos_ mulai terlihat.

[^1]: Angka halaman, _file_, dan pemakaian _library_ dihitung langsung dari _repo_ saat episode ini ditulis, dengan pemisahan detail internal untuk bercerita.

[^2]: Nama _library_, _framework_, dan struktur folder dipertahankan secukupnya; yang tidak perlu untuk cerita tidak disebut.
