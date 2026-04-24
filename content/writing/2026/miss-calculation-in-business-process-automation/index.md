---
title: "Otomasi Proses Bisnis dengan RPA UiPath: Ketika Selisih Rp8 Miliar Mulai Terlihat Normal"
description: "Catatan pengalaman menggunakan RPA UiPath untuk mengurangi risiko proses manual setelah miss kalkulasi kertas kerja obligasi hingga Rp8 miliar terasa seperti angka yang biasa saja."
author: "Faiq Najib"
date: 2020-10-12
lastmod: 2020-10-12
draft: false
toc: true
comments: false
tags:
  - catatan
  - rpa
  - otomasi
  - uipath
---

Ada fase dalam pekerjaan yang bikin ukuran "besar" jadi bergeser tanpa sadar. Setiap hari lihat angka miliaran, puluhan miliar, ratusan juta, sampai-sampai suatu waktu ketika ada selisih **Rp8 miliar** di kertas kerja obligasi, reaksi pertama saya bukan panik. Malah lebih ke, _"Oh, ada miss lagi. Cek bentar ya."_ 

Nah itu yang justru mengganggu.

Karena kalau dipikir-pikir, **Rp8 miliar itu bukan angka kecil**. Tapi di mata saya waktu itu, saking seringnya lihat nominal besar, angka itu sempat terasa seperti **Rp8 juta saja**. Tetap salah, tentu. Tapi secara mental, rasa bahayanya tumpul. Dan ketika rasa bahaya mulai tumpul, itu pertanda ada yang salah bukan cuma di perhitungannya, tapi juga di proses kerjanya.

Tulisan ini bukan tutorial UiPath Studio langkah demi langkah. Ini catatan pengalaman saya tentang bagaimana insiden miss kalkulasi di proses obligasi membuka mata saya bahwa otomasi proses bisnis itu bukan soal keren-kerenan tool, tapi soal **menjaga manusia dari kelelahan, bias, dan kebiasaan menganggap risiko besar sebagai hal biasa**.

## Awalnya Bukan Bug Besar, Cuma Proses yang Terlalu Manual

Konteksnya kurang lebih begini: ada pekerjaan yang berulang, formatnya mirip setiap periode, tapi tetap membutuhkan ketelitian tinggi. Data datang dari beberapa sumber, lalu disalin ke kertas kerja, divalidasi, dihitung ulang, dan akhirnya dipakai untuk pelaporan atau keputusan berikutnya.

Secara teori, alurnya sederhana. Secara praktik, ya tidak sesederhana itu hehe.

Karena setiap langkah kecil membuka peluang salah yang juga kecil, tapi kalau peluang salah kecil itu ditumpuk terus setiap hari, hasil akhirnya bisa besar sekali.

Masalah utamanya bukan ada satu orang yang ceroboh. Masalahnya lebih sistemik:

1. **Terlalu banyak copy-paste manual**
2. **Validasi dilakukan dengan mata dan kebiasaan**, bukan dengan kontrol yang konsisten
3. **Ada ketergantungan pada orang tertentu** yang sudah hafal pola kerja di luar kepala
4. **Tekanan waktu** bikin proses cek ulang berubah dari verifikasi menjadi formalitas

Dan seperti banyak proses operasional lain, semuanya terlihat "masih jalan" sampai suatu hari ketemu angka yang terlalu besar untuk diabaikan.

## Momen Rp8 Miliar Itu

Saya masih ingat rasa janggalnya. Ada angka yang tidak nyambung saat mencocokkan hasil kalkulasi. Setelah ditelusuri, selisihnya bukan jutaan. Bukan ratusan juta juga. Tapi **sekitar Rp8 miliar**.

Di titik itu saya sempat berhenti beberapa detik. Bukan karena tidak tahu harus ngapain, tapi karena otak saya anehnya tidak langsung menganggap itu "besar". Padahal jelas besar. Sangat besar.

Mungkin ini terdengar absurd, tapi begitulah efek kalau terlalu lama melihat nominal besar setiap hari. Persepsi jadi bergeser. Angka yang seharusnya bikin jantung agak loncat malah terlihat seperti item kerja biasa. Seolah-olah, _"ya udah, nanti dicek lagi."_

Buat saya, pelajaran dari momen itu bukan sekadar "harus lebih teliti". Nasihat seperti itu terlalu dangkal. Pelajarannya adalah: **manusia bisa beradaptasi bahkan terhadap risiko**, dan ketika itu terjadi, proses kerja tidak boleh hanya bergantung pada kewaspadaan manusia.

## Kenapa Saya Langsung Kepikiran Otomasi

Setelah kejadian itu, saya tidak melihat masalahnya sebagai salah hitung individual. Saya melihatnya sebagai tanda bahwa ada bagian proses yang seharusnya tidak lagi dikerjakan dengan cara manual sepenuhnya.

Ada beberapa pertanyaan yang muncul waktu itu:

- Kenapa validasi penting masih bergantung pada cek visual?
- Kenapa data harus dipindah berkali-kali antar file atau sistem?
- Kenapa perbedaan angka baru terasa setelah sudah cukup jauh di proses?
- Kenapa kontrolnya lebih banyak hidup di kepala orang dibanding di alur kerja?

Dari situ saya mulai serius melihat **RPA (Robotic Process Automation)**, khususnya **UiPath**. Bukan karena saat itu saya sedang cari tool yang lagi naik daun, tapi karena saya butuh sesuatu yang bisa membantu menutup celah di proses yang terlalu repetitif, terlalu manual, dan terlalu gampang membuat orang lengah.

## Kenapa Memilih UiPath

Waktu itu saya tidak sedang mencari solusi paling "wah". Saya cari yang paling realistis untuk segera dipakai.

### 1. Cocok untuk Proses yang Sudah Ada

Kami tidak sedang dalam posisi untuk merombak semua sistem dari nol. UiPath menarik karena bisa masuk ke proses existing tanpa menunggu semua aplikasi jadi ideal dulu.

### 2. Nilainya Cepat Terlihat

Untuk pekerjaan yang penuh input berulang, validasi rutin, dan perbandingan angka, manfaat otomasi bisa cepat dirasakan. Ini penting, karena kalau hasilnya terlalu lama terlihat, biasanya stakeholder keburu kehilangan minat.

### 3. Bisa Dipakai Sebagai Lapisan Kontrol

Yang saya cari bukan sekadar "robot yang bantu klik". Yang saya butuhkan adalah lapisan kontrol tambahan: pembacaan data yang konsisten, validasi silang, penanda exception, dan jejak audit yang lebih jelas.

Buat use case seperti itu, UiPath masuk akal.

## Pendekatan yang Saya Ambil

Saya tidak mulai dari membuat robot besar yang mengerjakan semuanya. Itu terlalu berisiko dan terlalu susah dipelihara. Saya justru memecah masalahnya menjadi beberapa bagian yang lebih kecil.

### 1. Petakan Dulu Proses As-Is dengan Jujur

Bukan proses versi SOP yang rapi di dokumen, tapi proses yang benar-benar terjadi di meja kerja. Termasuk shortcut, kebiasaan, langkah yang sering dilewati, dan pengecekan yang sebenarnya cuma mengandalkan firasat operator.

Bagian ini penting sekali. Karena sering kali proses di dokumen terlihat bersih, tapi proses nyata di lapangan ternyata penuh improvisasi.

### 2. Tentukan Titik Kontrol yang Paling Kritis

Tidak semua langkah perlu diotomasi sekaligus. Saya pilih bagian yang paling rawan salah dan paling mahal kalau lolos:

- Pengambilan data sumber
- Rekonsiliasi antar nilai
- Penandaan angka yang di luar toleransi
- Pembuatan ringkasan exception

Dengan begitu, otomasi bukan cuma mempercepat kerja, tapi juga memperjelas bagian mana yang perlu perhatian manusia.

### 3. Anggap Error Itu Normal

Ini prinsip yang cukup mengubah cara saya melihat bot. Kalau sebuah otomasi hanya berjalan mulus saat semua input ideal, itu bukan otomasi yang siap dipakai. Itu presentasi.

Jadi dari awal saya lebih suka mendesain alur yang mengasumsikan hal-hal berikut pasti akan terjadi:

- format file berubah
- kolom ada yang kosong
- nama field beda tipis tapi efeknya besar
- hasil perhitungan tidak cocok
- sistem target lambat atau gagal terbuka

Bot harus tahu kapan lanjut, kapan berhenti, dan kapan memanggil manusia.

### 4. Simpan Log yang Bisa Dibaca Manusia

Lucunya, banyak sistem otomatis gagal bukan karena logika utamanya jelek, tapi karena saat error muncul, tidak ada yang bisa cepat paham sebenarnya gagal di mana. 

Sejak itu saya makin percaya bahwa **log yang jelas lebih berharga daripada workflow yang terlihat canggih tapi gelap saat bermasalah**.

## Dampak yang Paling Terasa

Setelah prosesnya mulai lebih stabil, perubahan yang terasa bukan cuma di kecepatan kerja.

Yang paling saya rasakan justru ini:

- **rasa waspada tim membaik**, karena exception jadi lebih terlihat
- **diskusi berubah dari "siapa yang salah input" menjadi "kenapa kontrol ini bisa lolos"**
- **cek ulang jadi lebih fokus**, karena manusia tidak lagi habis energi untuk pekerjaan copy-paste
- **angka besar kembali terasa besar**, karena sistem membantu menandai anomali lebih awal

Buat saya, poin terakhir itu penting. Kadang manfaat otomasi bukan cuma hemat waktu. Kadang manfaat terbesarnya adalah mengembalikan sensitivitas kita terhadap risiko.

## Pelajaran yang Paling Menempel

### 1. Risiko Besar Sering Masuk dari Celah yang Terlihat Sepele

Selisih Rp8 miliar itu tidak terasa datang dari satu ledakan besar. Dia datang dari rangkaian langkah kecil yang dianggap biasa.

### 2. Ketelitian Manual Bukan Kontrol yang Bisa Diskalakan

Orang bisa teliti, tapi orang juga bisa capek, bosan, terburu-buru, atau terlalu terbiasa melihat pola yang sama. Kalau prosesnya penting, kontrolnya harus hidup di sistem, bukan cuma di kepala orang.

### 3. Otomasi yang Baik Tidak Menghapus Peran Manusia

Justru sebaliknya. Otomasi mengambil pekerjaan repetitif supaya manusia bisa fokus ke judgment, analisis, dan penanganan exception.

### 4. Tool Bukan Jawaban Kalau Prosesnya Sendiri Masih Kabur

Sebelum menyentuh UiPath, saya harus paham dulu alur prosesnya dengan jujur. Kalau prosesnya sendiri masih abu-abu, robot hanya akan mempercepat kekacauan.

## Penutup

Buat saya, momen melihat selisih Rp8 miliar lalu sempat merasa itu seperti angka yang biasa saja adalah alarm yang lebih keras daripada error message apa pun. Itu penanda bahwa proses manual yang terlalu repetitif bisa mengikis sensitivitas manusia terhadap risiko.

Dan di situlah saya melihat nilai RPA UiPath: bukan sekadar untuk mempercepat pekerjaan, tapi untuk membantu menjaga disiplin proses saat perhatian manusia tidak selalu bisa diandalkan penuh.

Kalau kamu ingin baca versi yang lebih umum tentang bagaimana saya melihat otomasi proses bisnis dengan RPA UiPath, saya juga punya [catatan lain](/writing/2026/business-process-automation-with-rpa-uipath/) yang membahas sisi pendekatan dan implementasinya secara lebih luas.

Kalau kamu sedang mengevaluasi otomasi proses bisnis yang sensitif terhadap angka, validasi, dan risiko operasional, [hubungi saya](/contact/). Atau lihat [layanan](/services/) yang bisa saya bantu.

---

_Tag: [catatan](/tags/catatan/) · [rpa](/tags/rpa/) · [otomasi](/tags/otomasi/) · [uipath](/tags/uipath/)_
