---
title: "Hijrah Frontend (2): Port Tipis dan Warisan yang Ikut Naik"
description: "Ep 2 seri Hijrah Frontend: 76 halaman masuk, 76 halaman keluar. Kenapa tidak ada yang ditinggal, apa isi kotak yang saya buka duluan, dan satu rencana besar yang akhirnya batal."
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

Pindahan di [episode pertama](/writing/2026/hijrah-frontend-01/) akhirnya selesai. Di hari serah terima, manifestnya cuma punya satu angka penting: **tujuh puluh enam kotak masuk, tujuh puluh enam kotak keluar. Tidak ada halaman yang tertinggal.**

Tidak ada yang tertinggal karena memang begitu keputusan kami. Ada yang sengaja dibawa, ada yang ikut tanpa diundang, dan ada satu rencana besar yang akhirnya batal. Saya ceritakan satu-satu ya.

## Kenapa Nol Halaman Ditinggalkan

Kalau pernah pindah rumah, pasti tahu rasa lega waktu bilang, "yang ini buang aja". Migrasi _frontend_ punya godaan yang sama. Menghapus halaman rasanya seperti sekalian merapikan produk.

Masalahnya, menentukan hidup-mati halaman saat pindahan itu artinya mengambil dua keputusan sekaligus: memindahkan aplikasi dan mengubah cakupan produk. [Seri sebelah](/writing/2026/hijrah-backend-04/) sudah mengajari saya mahalnya kombinasi itu. Jadi aturannya jelas: **tujuh puluh enam masuk, tujuh puluh enam keluar**, diperiksa halaman demi halaman, tanpa skrip untuk membuang.

Hasilnya memang tidak dramatis, tapi angkanya cocok: _repo_ baru berisi 76 halaman, sama dengan _repo_ lama, dan daftar foldernya cocok satu per satu. Halaman dengan nama yang bikin bertanya-tanya, seperti _demo_, _docs_, dan jalur khusus, ikut pindah juga. Bukan karena semuanya penting, tapi memutuskan untuk menghapusnya memang bukan bagian dari fase ini.

## Isi Kotak yang Saya Buka Duluan

Kotak pertama yang saya buka isinya dua _library_ UI yang sudah lama hidup berdampingan. Di rumah baru, hitungannya kelihatan jelas: satu _library_ dipakai di **101 _file_**, sedangkan yang satunya tinggal bertahan di **13 _file_**.[^1]

Angka itu menunjukkan dua era: satu _library_ dominan, satu lagi muncul belakangan, dan keduanya hidup di aplikasi yang sama tanpa perang terbuka. Dua-duanya kami bawa. Menghapus satu _library_ berarti mengubah semua _file_ yang memakainya, dan mengubah semua _file_ saat pindahan itu melanggar aturan [episode empat](/writing/2026/hijrah-backend-04/).

Ada juga sambungan _state management_ warisan. Di _app router_ yang baru, tinggal satu titik sambungan, tapi titik itu masih jadi jantung bagi halaman-halaman yang memakainya. Memotongnya sekarang berarti mengubah hal lain lagi, dan itu bukan kerjaan pindahan ini.

## Yang Sadar Dibawa, yang Dicatat

Beberapa warisan kecil juga saya catat waktu ikut naik:

- **JSX tanpa tipe**: negeri ini memang belum bicara _TypeScript_. Bukan keputusan episode ini, cukup dicatat untuk keputusan lain di hari lain.[^2]
- **Penamaan dua era**: sebagian berawalan huruf kapital, sebagian mengikuti selera yang beda. Tidak kami seragamkan saat pindah. Menyeragamkan itu kerjaan epilog, bukan koper.
- **Satu `page.backup`**: satu halaman membawa jenazah _backup_-nya sendiri. Saya ketawa waktu nemu, soalnya [dia punya saudara](/writing/2026/hijrah-backend-04/) di gedung sebelah hahaha.

Beda lho antara membawa sesuatu dengan sadar dan baru menemukannya setelah pindahan. Yang pertama punya catatan, alasan, dan giliran dibersihkan nanti. Yang kedua gampang luput, lalu ikut beranak-pinak.

## Rencana Besar yang Tidak Jadi

Seperti di seri sebelah, ada satu rencana yang perlu dicatat walau tidak jadi dijalankan: mengganti _state management_ warisan dengan yang baru.

Batalnya bukan karena gagal. Prioritasnya bergeser ke kerjaan yang dampaknya lebih terasa buat _user_. Membatalkan sesuatu sebelum menghabiskan tenaga juga semacam _quality control_ untuk rencana sendiri. Ya... anggap saja begitu hehe.

## Catatan Akhir

1. **Pindahkan dulu 1:1, putuskan cakupan belakangan.** Menghapus halaman saat pindahan berarti dua keputusan sekaligus.
2. **Hitung isi kotaknya.** Angka 76 ke 76 dan 101 ke 13 bikin obrolan soal warisan lebih konkret, tidak cuma soal selera.
3. **Dua _library_ yang hidup berdampingan menandai dua era.** Masing-masing punya alasan kenapa masih ada di aplikasi.
4. **Rencana yang dibatalkan sebelum menghabiskan biaya itu juga keputusan yang bagus.** Catat alasannya supaya jelas kapan perlu dibuka lagi.

Kotak berikutnya isinya bukan _library_, tapi tipe data yang tidak seragam. Satu _field_ yang sama bisa dikirim sebagai angka, _string_ kosong, atau _string_ biasa, tergantung halaman yang mengirimnya. Di situlah _type chaos_ mulai kelihatan.

[^1]: Angka halaman, _file_, dan pemakaian _library_ dihitung langsung dari _repo_ saat episode ini ditulis, dengan pemisahan detail internal untuk bercerita.

[^2]: Nama _library_, _framework_, dan struktur folder dipertahankan secukupnya; yang tidak perlu untuk cerita tidak disebut.
