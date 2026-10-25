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

Di pekerjaan tertentu, angka besar lama-lama bisa terasa biasa. Saya setiap hari melihat nominal miliaran, puluhan miliar, sampai ratusan juta. Suatu hari saya menemukan selisih **Rp8 miliar** di kertas kerja obligasi. Reaksi pertama saya malah, _"Oh, ada selisih lagi. Cek bentar ya."_

Nah, reaksi itu yang bikin saya kepikiran.

**Rp8 miliar jelas bukan angka kecil**. Tapi karena terlalu sering melihat nominal besar, angka itu sempat terasa seperti **Rp8 juta saja**. Hitungannya tetap salah, tentu. Yang agak mengganggu, alarm di kepala saya tidak berbunyi sekeras seharusnya. Jadi yang perlu dilihat bukan cuma hitungannya, tapi juga proses kerjanya.

Ini bukan tutorial UiPath Studio langkah demi langkah. Saya cuma ingin cerita bagaimana salah hitung di proses obligasi mengubah cara saya melihat otomasi proses bisnis. Buat saya, otomasi bukan soal tool yang keren-kerenan. Yang menarik justru bagaimana ia bisa membantu saat kita lelah, bias, atau mulai menganggap risiko besar sebagai hal biasa.

## Awalnya Cuma Proses Manual yang Berulang

Kurang lebih begini alurnya: pekerjaan berulang dengan format yang mirip tiap periode, tapi tetap perlu teliti. Data datang dari beberapa sumber, disalin ke kertas kerja, divalidasi, dihitung ulang, lalu dipakai untuk laporan atau keputusan berikutnya.

Di atas kertas sederhana. Pas dikerjakan, beda cerita. Ada banyak copy-paste manual, validasi masih mengandalkan mata dan kebiasaan, pengetahuan proses sering ada di kepala orang tertentu, dan tekanan waktu bisa membuat cek ulang sekadar formalitas. Tiap langkah kecil membuka peluang salah. Kalau terus menumpuk, hasil akhirnya bisa besar.

Buat saya, masalahnya bukan satu orang ceroboh. Prosesnya memang punya beberapa celah. Semuanya tampak "masih jalan" sampai ada angka yang terlalu besar untuk dianggap biasa.

## Waktu Selisih Rp8 Miliar Itu Muncul

Saya masih ingat rasa janggal saat mencocokkan hasil kalkulasi. Ada angka yang tidak cocok. Setelah ditelusuri, selisihnya bukan jutaan, bahkan bukan ratusan juta, melainkan **sekitar Rp8 miliar**.

Saya berhenti beberapa detik. Bukan karena tidak tahu harus berbuat apa, tapi otak saya tidak langsung menganggap angka itu "besar". Padahal ya jelas besar. Besar sekali.

Kedengarannya absurd, tapi terlalu lama melihat nominal besar tiap hari bisa menggeser persepsi. Angka yang seharusnya bikin waspada malah terasa seperti pekerjaan biasa. Semacam, _"ya sudah, nanti dicek lagi."_

Buat saya, jawabannya bukan sekadar "harus lebih teliti". Nasihat itu gampang diucapkan, tapi tidak banyak membantu. **Manusia bisa terbiasa dengan risiko**. Kalau sudah begitu, proses kerja tidak bisa cuma bergantung pada kewaspadaan orang.

## Kenapa Saya Mulai Melirik Otomasi

Setelah kejadian itu, saya tidak melihatnya sebagai salah satu orang saja. Buat saya, ini tanda beberapa bagian proses sebaiknya tidak dikerjakan sepenuhnya secara manual.

Beberapa pertanyaan terus muncul:

- Kenapa validasi penting masih bergantung pada cek visual?
- Kenapa data harus dipindah berkali-kali antar file atau sistem?
- Kenapa perbedaan angka baru terasa setelah sudah cukup jauh di proses?
- Kenapa kontrolnya lebih banyak hidup di kepala orang dibanding di alur kerja?

Pertanyaan-pertanyaan itu membuat saya serius mempertimbangkan **RPA (Robotic Process Automation)**, terutama **UiPath**. Saya bukan sedang berburu tool yang lagi ramai dibicarakan. Saya butuh cara untuk menutup celah di proses yang repetitif dan gampang bikin orang lengah.

## Kenapa Waktu Itu Saya Pilih UiPath

Waktu itu saya tidak mencari solusi paling "wah". Saya mencari yang masuk akal untuk kondisi yang ada.

### Bisa Masuk ke Proses yang Sudah Ada

Kami tidak sedang dalam posisi untuk merombak semua sistem dari nol. UiPath menarik karena bisa masuk ke proses existing tanpa menunggu semua aplikasi jadi ideal dulu.

### Manfaatnya Lebih Cepat Kelihatan

Pada pekerjaan yang penuh input berulang, validasi rutin, dan perbandingan angka, manfaat otomasi bisa terlihat lebih cepat. Ini penting, sebab stakeholder bisa kehilangan minat jika hasilnya terlalu lama terlihat.

### Bisa Jadi Lapisan Kontrol Tambahan

Yang saya cari bukan sekadar "robot yang bantu klik". Yang saya butuhkan adalah lapisan kontrol tambahan: pembacaan data yang konsisten, validasi silang, penanda exception, dan jejak audit yang lebih jelas.

Buat use case seperti itu, UiPath masuk akal.

## Cara Saya Mendekatinya

Saya tidak membuat satu bot raksasa untuk mengerjakan semuanya. Terlalu berisiko dan susah dirawat. Saya pecah dulu masalahnya jadi bagian-bagian kecil.

### Saya Petakan Proses yang Benar-Benar Terjadi

Yang saya petakan bukan cuma SOP rapi di dokumen, tapi pekerjaan yang betul-betul terjadi: shortcut, kebiasaan, langkah yang sering dilewati, sampai pengecekan yang cuma mengandalkan firasat operator.

Bagian ini penting. Proses di dokumen bisa terlihat bersih, sementara praktiknya penuh improvisasi.

### Lalu Pilih Titik yang Paling Perlu Dicek

Tidak semua langkah harus diotomasi sekaligus. Saya pilih bagian yang rawan salah dan mahal kalau lolos:

- Pengambilan data sumber
- Rekonsiliasi antar nilai
- Penandaan angka yang di luar toleransi
- Pembuatan ringkasan exception

Dengan begitu, otomasi bukan hanya mempercepat kerja, tetapi juga memperjelas bagian yang membutuhkan perhatian manusia.

### Saya Anggap Error Bakal Terjadi

Cara pandang saya ke bot berubah setelah ini. Kalau alurnya cuma mulus saat semua input ideal, berarti belum siap dipakai. Itu baru cocok buat presentasi.

Sejak awal, saya lebih suka merancang alur dengan asumsi hal-hal berikut akan terjadi:

- format file berubah
- kolom ada yang kosong
- nama field beda tipis tapi efeknya besar
- hasil perhitungan tidak cocok
- sistem target lambat atau gagal terbuka

Bot harus tahu kapan lanjut, kapan berhenti, dan kapan memanggil manusia.

### Terakhir, Log-nya Harus Bisa Dibaca

Sering kali sistem otomatis bikin repot bukan karena logika utamanya jelek, tapi karena saat error muncul orang tidak tahu harus mencari masalah di mana.

Sejak itu, saya makin percaya bahwa **log yang jelas lebih berharga daripada workflow yang terlihat canggih tapi gelap saat bermasalah**.

## Yang Paling Terasa Setelahnya

Setelah prosesnya lebih stabil, yang berubah bukan cuma kecepatan kerja. Yang paling terasa buat saya:

- **rasa waspada tim membaik**, karena exception jadi lebih terlihat
- **diskusi berubah dari "siapa yang salah input" menjadi "kenapa kontrol ini bisa lolos"**
- **cek ulang jadi lebih fokus**, karena manusia tidak lagi habis energi untuk pekerjaan copy-paste
- **angka besar kembali terasa besar**, karena sistem membantu menandai anomali lebih awal

Buat saya, bagian terakhir itu penting. Manfaat otomasi tidak selalu soal hemat waktu. Di kasus ini, rasanya lebih penting membantu kami peka lagi terhadap risiko.

## Yang Masih Saya Ingat

Selisih Rp8 miliar itu muncul dari rangkaian langkah kecil yang dianggap biasa. Orang bisa teliti, tapi juga bisa lelah, bosan, atau terburu-buru. Kalau prosesnya penting, kontrolnya perlu ada di sistem, bukan cuma di kepala orang. Otomasi mengambil pekerjaan repetitif supaya manusia bisa fokus pada penilaian, analisis, dan exception. Tapi sebelum bikin bot, saya tetap perlu paham prosesnya dulu. Kalau alurnya masih kabur, robot cuma mempercepat kekacauan.

Saya masih ingat momen melihat selisih Rp8 miliar dan sempat menganggapnya angka biasa. Rasanya seperti alarm yang bunyinya baru kedengaran setelah telat. Dari situ saya sadar, kerja manual yang berulang bisa mengikis kepekaan kita terhadap risiko.

Buat saya, nilai RPA UiPath bukan cuma mempercepat pekerjaan. Ia juga bisa membantu menjaga disiplin proses, terutama saat perhatian manusia sedang tidak prima.

Kalau kamu ingin baca versi yang lebih umum tentang bagaimana saya melihat otomasi proses bisnis dengan RPA UiPath, saya juga punya [catatan lain](/writing/2026/business-process-automation-with-rpa-uipath/) yang membahas sisi pendekatan dan implementasinya secara lebih luas.

Kalau kamu sedang mengevaluasi otomasi untuk proses yang sensitif terhadap angka, validasi, dan risiko operasional, kamu bisa [menghubungi saya](/contact/) atau melihat [layanan](/services/) yang saya tawarkan.

---

_Tag: [catatan](/tags/catatan/) · [rpa](/tags/rpa/) · [otomasi](/tags/otomasi/) · [uipath](/tags/uipath/)_
