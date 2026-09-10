---
title: "Hijrah Frontend (2): Port Tipis dan Warisan yang Ikut Naik"
description: "Ep 2 seri Hijrah Frontend: 76 halaman masuk, 76 halaman keluar. Kenapa nol halaman ditinggalkan, apa isi kotak yang dibuka pertama, dan satu rencana besar yang tidak jadi."
author: "Faiq Najib Al-Aziz"
date: 2026-09-24T09:00:00+07:00
lastmod: 2026-09-11T03:00:00+07:00
draft: true
toc: true
comments: false
tags:
  - frontend
  - nextjs
  - migrasi
  - cerita
series: "Hijrah Frontend"
---

Pindahan di [episode pertama](/writing/2026/hijrah-frontend-01/) akhirnya selesai, dan hari penyerahan barang tiba. Manifestnya pendek dan membosankan, persis seperti manifest pindahan terbaik: **tujuh puluh enam kotak masuk, tujuh puluh enam kotak keluar. Nol halaman tertinggal.**

Itu bukan kebetulan. Itu keputusan. Dan episode ini cerita tentang keputusan itu: apa yang sadar kita naikkan, apa yang ternyata ikut naik tanpa undangan, dan satu rencana besar yang memilih untuk tidak jadi hehe~

## Kenapa Nol Halaman Ditinggalkan

Kalau Anda pernah pindah rumah, Anda tahu momen paling membebaskan: saat memutuskan "yang ini buang aja". Migrasi _frontend_ punya momen yang sama, dengan godaan yang lebih besar, karena membuang halaman terasa seperti membereskan _produk_ sekalian.

_Amit-amit_ lagi. Memutuskan hidup-mati sebuah halaman saat pindah rumah itu dua keputusan digabung jadi satu: pindah, dan merombak skope produk. [Seri sebelah](/writing/2026/hijrah-backend-04/) sudah membayar biaya pembelajaran untuk kombinasi itu. Jadi aturannya sederhana: **tujuh puluh enam masuk, tujuh puluh enam keluar**, halaman demi halaman, satu per satu, tanpa skrip pembuangan.

Hasilnya terverifikasi membosankan: _repo_ baru menghitung 76 halaman, _repo_ lama juga 76, dan daftar foldernya cocok satu per satu. Bahkan halaman-halaman yang namanya menimbulkan tanda tanya, semacam _demo_ dan _docs_ dan jalur-jalur khusus, ikut naik juga. Bukan karena penting; tapi karena membuangnya bukan wewenang momen ini hahaha.

## Isi Kotak yang Dibuka Pertama

Dua kotak pertama yang kami buka: dua _library_ UI yang selama ini hidup berdampingan. Di rumah baru, hitungannya jujur dan terukur: satu _library_ dipakai di **101 _file_**, _library_ satunya tinggal bertahan di **13 _file_**.

Angka itu bercerita sendiri: ada era dominasi dan era sisipan, berdampingan dalam satu aplikasi yang sama, tanpa perang terbuka.[^1] Keduanya tetap harus dibawa dulu, karena membuang _library_ berarti menyentuh semua _file_-nya, dan menyentuh semua _file_ saat pindah rumah itu pelanggaran aturan [episode empat](/writing/2026/hijrah-backend-04/).

Satu _wire_ lagi yang ikut naik: sambungan _state management_ warisan. Di _app router_ baru dia cuma tinggal satu titik sambungan, tapi satu titik yang menyala itu tetap jantung bagi halaman-halaman yang memakainya. Dipotong sekarang? Bukan wewenang momen ini juga hahaha.

## Yang Sadar Dibawa, yang Terekam

Selain kotak-kotak besar, ada warisan kecil yang sengaja kami catat saat menaikkannya:

- **JSX tanpa tipe**: negeri ini memang belum bicara _TypeScript_. Bukan keputusan episode ini; dia tercatat untuk keputusan lain, di hari lain.[^2]
- **Penamaan dua era**: sebagian berjudul kapital di awal, sebagian lagi mengikuti selera yang berbeda. Kami tidak menyeragamkan saat pindah; menyeragamkan itu kerjaannya epilog, bukan koper.
- **Satu `page.backup`**: satu halaman membawa jenazah _backup_-nya sendiri. Aku tertawa saat menemukannya, karena [dia punya saudara](/writing/2026/hijrah-backend-04/) di gedung sebelah hahaha.

Catatannya satu: warisan yang dibawa sadar itu beda nasibnya dengan warisan yang lolos. Yang sadar dibawa punya catatan, punya alasan, dan punya giliran untuk dibersihkan kelak. Yang lolos malah sering beranak pinak.

## Rencana Besar yang Tidak Jadi

Supaya adil dengan tradisi jujur di seri sebelah: ada satu rencana besar yang memilih mundur sebelum dimulai, yaitu mengganti _state management_ warisan dengan yang baru.

Batalnya bukan karena gagal; prioritasnya bergeser ke hal yang lebih terasa dampaknya bagi _user_. Dan saya tenang dengan itu: rencana yang dibatalkan sebelum menelan sumber daya itu bukan kegagalan, itu _kontrol kualitas_ atas rencana sendiri hehe~

## Pelajaran

1. **Pindahkan dulu 1:1, putuskan skope belakangan.** Membuang halaman saat pindah itu dua keputusan dalam satu tarikan napas; pisahkan.
2. **Hitung isi kotak dengan angka.** 76 ke 76, 101 ke 13, angka-angka itu yang membuat percakapan soal warisan tidak berubah jadi perang selera.
3. **Dua _library_ berdampingan itu dua era, bukan dua pilihan.** Jangan hakimi yang lama; dia menang lebih banyak _battle_ daripada yang baru.
4. **Rencana yang dibatalkan sebelum menelan biaya adalah menang.** Catat dia di daftar yang tidak jadi, dengan kepala tegak.

Episode berikutnya kita buka kotak paling berduri: _type chaos_, di mana satu _field_ yang sama dikirim sebagai angka, _string_ kosong, dan _string_ biasa, tergantung halamannya yang mengirim. Sampai ketemu di sana.

Sekian. Salam.

[^1]: Angka halaman, _file_, dan pemakaian _library_ dihitung langsung dari _repo_ saat episode ini ditulis, dengan pemisahan detail internal untuk bercerita.

[^2]: Nama _library_, _framework_, dan struktur folder dipertahankan secukupnya; yang tidak perlu untuk cerita tidak disebut.
