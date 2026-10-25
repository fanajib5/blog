---
title: "Otomasi Proses Bisnis dengan RPA UiPath: Ketika Selisih Rp8 Miliar Mulai Terlihat Normal"
description: "Catatan pengalaman menggunakan RPA UiPath untuk mengurangi risiko proses manual setelah salah hitung pada kertas kerja obligasi hingga Rp8 miliar terasa seperti angka yang biasa saja."
author: "Faiq Najib Al-Aziz"
date: 2026-03-20
lastmod: 2026-09-11T09:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - catatan
  - rpa
  - otomasi
  - uipath
---

Dalam pekerjaan tertentu, ukuran "besar" bisa bergeser tanpa disadari. Setiap hari saya melihat angka miliaran, puluhan miliar, dan ratusan juta. Suatu hari, saat menemukan selisih **Rp8 miliar** di kertas kerja obligasi, reaksi pertama saya bukan panik. Malah, _"Oh, ada selisih lagi. Cek bentar ya."_

Reaksi itu yang mengganggu.

**Rp8 miliar bukan angka kecil**. Namun karena terlalu sering melihat nominal besar, angka itu sempat terasa seperti **Rp8 juta saja**. Hitungannya tetap salah, tentu, tetapi alarm di kepala saya tidak berbunyi sekeras seharusnya. Saat kewaspadaan mulai tumpul, yang perlu diperiksa bukan cuma perhitungannya, melainkan juga proses kerjanya.

Tulisan ini bukan tutorial langkah demi langkah UiPath Studio. Ini catatan tentang bagaimana salah hitung di proses obligasi mengubah cara saya melihat otomasi proses bisnis. Bagi saya, otomasi bukan soal tool yang terlihat keren, melainkan soal **membantu manusia menghadapi kelelahan, bias, dan kebiasaan menganggap risiko besar sebagai hal biasa**.

## Awalnya Bukan Bug Besar, Cuma Proses yang Terlalu Manual

Gambaran prosesnya kurang lebih begini: pekerjaannya berulang dan formatnya mirip setiap periode, tetapi tetap membutuhkan ketelitian tinggi. Data datang dari beberapa sumber, disalin ke kertas kerja, divalidasi, dihitung ulang, lalu dipakai untuk pelaporan atau keputusan berikutnya.

Di atas kertas, alurnya sederhana. Saat dikerjakan, tidak sesederhana itu.

Setiap langkah kecil membuka peluang salah. Kalau peluang-peluang kecil itu menumpuk setiap hari, hasil akhirnya bisa besar.

Masalahnya bukan satu orang yang ceroboh, melainkan proses yang punya beberapa celah:

1. **Terlalu banyak copy-paste manual**
2. **Validasi dilakukan dengan mata dan kebiasaan**, bukan dengan kontrol yang konsisten
3. **Ada ketergantungan pada orang tertentu** yang sudah hafal pola kerja di luar kepala
4. **Tekanan waktu** bikin proses cek ulang berubah dari verifikasi menjadi formalitas

Seperti banyak proses operasional lain, semuanya terlihat "masih jalan" sampai ada angka yang terlalu besar untuk diabaikan.

## Momen Rp8 Miliar Itu

Saya masih ingat rasa janggal saat mencocokkan hasil kalkulasi. Ada angka yang tidak cocok. Setelah ditelusuri, selisihnya bukan jutaan, bahkan bukan ratusan juta, melainkan **sekitar Rp8 miliar**.

Saya sempat berhenti beberapa detik. Bukan karena tidak tahu harus berbuat apa, tetapi karena otak saya tidak langsung menganggap angka itu "besar". Padahal jelas besar. Sangat besar.

Mungkin terdengar absurd, tetapi terlalu lama melihat nominal besar setiap hari bisa menggeser persepsi. Angka yang seharusnya membuat saya waspada malah terlihat seperti item kerja biasa. Seolah-olah, _"ya udah, nanti dicek lagi."_

Bagi saya, pelajarannya bukan sekadar "harus lebih teliti". Nasihat seperti itu terlalu dangkal. **Manusia bisa terbiasa bahkan dengan risiko**. Ketika itu terjadi, proses kerja tidak bisa hanya bergantung pada kewaspadaan manusia.

## Kenapa Saya Langsung Kepikiran Otomasi

Setelah kejadian itu, saya tidak menganggapnya sebagai kesalahan satu orang. Saya melihatnya sebagai tanda bahwa beberapa bagian proses tidak seharusnya dikerjakan sepenuhnya secara manual.

Beberapa pertanyaan terus muncul:

- Kenapa validasi penting masih bergantung pada cek visual?
- Kenapa data harus dipindah berkali-kali antar file atau sistem?
- Kenapa perbedaan angka baru terasa setelah sudah cukup jauh di proses?
- Kenapa kontrolnya lebih banyak hidup di kepala orang dibanding di alur kerja?

Pertanyaan-pertanyaan itu membuat saya serius mempertimbangkan **RPA (Robotic Process Automation)**, khususnya **UiPath**. Saya bukan sedang mencari tool yang lagi naik daun. Saya butuh sesuatu untuk membantu menutup celah dalam proses yang repetitif, manual, dan mudah membuat orang lengah.

## Kenapa Memilih UiPath

Saat itu saya tidak mencari solusi paling "wah". Saya mencari yang paling realistis untuk diterapkan.

### 1. Cocok untuk Proses yang Sudah Ada

Kami tidak sedang dalam posisi untuk merombak semua sistem dari nol. UiPath menarik karena bisa masuk ke proses existing tanpa menunggu semua aplikasi jadi ideal dulu.

### 2. Nilainya Cepat Terlihat

Pada pekerjaan yang penuh input berulang, validasi rutin, dan perbandingan angka, manfaat otomasi bisa terlihat lebih cepat. Ini penting, sebab stakeholder bisa kehilangan minat jika hasilnya terlalu lama terlihat.

### 3. Bisa Dipakai Sebagai Lapisan Kontrol

Yang saya cari bukan sekadar "robot yang bantu klik". Yang saya butuhkan adalah lapisan kontrol tambahan: pembacaan data yang konsisten, validasi silang, penanda exception, dan jejak audit yang lebih jelas.

Buat use case seperti itu, UiPath masuk akal.

## Pendekatan yang Saya Ambil

Saya tidak membuat satu bot besar untuk mengerjakan semuanya. Cara itu terlalu berisiko dan sulit dipelihara. Sebaliknya, saya membagi masalahnya menjadi beberapa bagian yang lebih kecil.

### 1. Petakan Dulu Proses As-Is dengan Jujur

Yang saya petakan bukan versi SOP yang rapi di dokumen, melainkan proses yang benar-benar terjadi di meja kerja: shortcut, kebiasaan, langkah yang sering dilewati, dan pengecekan yang hanya mengandalkan firasat operator.

Bagian ini penting. Proses di dokumen bisa terlihat bersih, sementara praktiknya penuh improvisasi.

### 2. Tentukan Titik Kontrol yang Paling Kritis

Tidak semua langkah perlu diotomasi sekaligus. Saya memilih bagian yang paling rawan salah dan paling mahal jika terlewat:

- Pengambilan data sumber
- Rekonsiliasi antar nilai
- Penandaan angka yang di luar toleransi
- Pembuatan ringkasan exception

Dengan begitu, otomasi bukan hanya mempercepat kerja, tetapi juga memperjelas bagian yang membutuhkan perhatian manusia.

### 3. Anggap Error Itu Normal

Prinsip ini mengubah cara saya melihat bot. Kalau otomasi hanya berjalan mulus saat semua input ideal, itu belum siap dipakai. Itu baru presentasi.

Sejak awal, saya lebih suka merancang alur dengan asumsi hal-hal berikut akan terjadi:

- format file berubah
- kolom ada yang kosong
- nama field beda tipis tapi efeknya besar
- hasil perhitungan tidak cocok
- sistem target lambat atau gagal terbuka

Bot harus tahu kapan lanjut, kapan berhenti, dan kapan memanggil manusia.

### 4. Simpan Log yang Bisa Dibaca Manusia

Banyak sistem otomatis gagal bukan karena logika utamanya buruk, melainkan karena saat error muncul, orang sulit mengetahui letak masalahnya.

Sejak itu, saya makin percaya bahwa **log yang jelas lebih berharga daripada workflow yang terlihat canggih tapi gelap saat bermasalah**.

## Dampak yang Paling Terasa

Setelah proses mulai lebih stabil, perubahan yang terasa bukan hanya pada kecepatan kerja.

Yang paling terasa bagi saya:

- **rasa waspada tim membaik**, karena exception jadi lebih terlihat
- **diskusi berubah dari "siapa yang salah input" menjadi "kenapa kontrol ini bisa lolos"**
- **cek ulang jadi lebih fokus**, karena manusia tidak lagi habis energi untuk pekerjaan copy-paste
- **angka besar kembali terasa besar**, karena sistem membantu menandai anomali lebih awal

Poin terakhir itu penting bagi saya. Manfaat otomasi bukan selalu soal menghemat waktu. Dalam kasus ini, yang terasa penting adalah membantu mengembalikan kepekaan terhadap risiko.

## Pelajaran yang Paling Menempel

### 1. Risiko Besar Sering Masuk dari Celah yang Terlihat Sepele

Selisih Rp8 miliar itu bukan berasal dari satu kejadian besar. Selisih itu muncul dari rangkaian langkah kecil yang dianggap biasa.

### 2. Ketelitian Manual Bukan Kontrol yang Bisa Diskalakan

Orang bisa teliti, tetapi juga bisa lelah, bosan, terburu-buru, atau terlalu terbiasa melihat pola yang sama. Kalau prosesnya penting, kontrol perlu ada di sistem, bukan hanya di kepala orang.

### 3. Otomasi yang Baik Tidak Menghapus Peran Manusia

Justru sebaliknya. Otomasi mengambil pekerjaan repetitif supaya manusia bisa fokus ke judgment, analisis, dan penanganan exception.

### 4. Tool Bukan Jawaban Kalau Prosesnya Sendiri Masih Kabur

Sebelum menggunakan UiPath, saya perlu memahami alur prosesnya dengan jujur. Kalau prosesnya sendiri masih abu-abu, robot hanya akan mempercepat kekacauan.

## Penutup

Momen melihat selisih Rp8 miliar dan sempat menganggapnya angka biasa terasa seperti alarm yang lebih keras daripada error message apa pun. Bagi saya, itu menandakan bahwa proses manual yang terlalu repetitif bisa mengikis kepekaan manusia terhadap risiko.

Di situlah saya melihat nilai RPA UiPath: bukan sekadar mempercepat pekerjaan, tetapi membantu menjaga disiplin proses saat perhatian manusia tidak selalu bisa diandalkan sepenuhnya.

Kalau kamu ingin baca versi yang lebih umum tentang bagaimana saya melihat otomasi proses bisnis dengan RPA UiPath, saya juga punya [catatan lain](/writing/2026/business-process-automation-with-rpa-uipath/) yang membahas sisi pendekatan dan implementasinya secara lebih luas.

Kalau kamu sedang mengevaluasi otomasi untuk proses yang sensitif terhadap angka, validasi, dan risiko operasional, kamu bisa [menghubungi saya](/contact/) atau melihat [layanan](/services/) yang saya tawarkan.

---

_Tag: [catatan](/tags/catatan/) · [rpa](/tags/rpa/) · [otomasi](/tags/otomasi/) · [uipath](/tags/uipath/)_
