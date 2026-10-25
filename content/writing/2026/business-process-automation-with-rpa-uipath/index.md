---
title: "Otomasi Proses Bisnis dengan RPA UiPath: Mulai dari yang Membosankan Dulu"
description: "Catatan saya mulai mengotomasi kerjaan copy-paste harian pakai RPA UiPath, plus hal-hal yang baru saya sadari belakangan."
author: "Faiq Najib Al-Aziz"
date: 2026-03-12
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

Setiap pagi saya membuka file yang sama, memeriksa data yang sama, lalu mengirim laporan dengan format yang sama. Hari pertama terasa biasa. Hari ketiga mulai membosankan. Hari kesepuluh saya bertanya, _"Ini kerjaan manusia atau kerjaan copy-paste berjamaah?"_ hehe.

Pengalaman itu bikin saya mulai serius melirik **RPA (Robotic Process Automation)**, khususnya **UiPath**. Bukan karena ikut-ikutan tren ya. Tim kami memang punya masalah nyata: banyak kerjaan repetitif yang menyita waktu, padahal nilainya kecil kalau dikerjakan manual.

Tulisan ini bukan tutorial klik-klik menu di UiPath Studio (itu banyak di internet). Saya cuma mau mencatat pengalaman awal mengotomasi proses bisnis: apa yang lancar, apa yang bikin pusing, dan apa yang seharusnya saya siapkan dari awal.

## Kenapa Proses Ini Perlu Diotomasi

Waktu itu ada beberapa alur kerja operasional dengan pola mirip:

- Ambil data dari email dan lampiran Excel
- Validasi beberapa kolom wajib
- Input ulang ke sistem internal
- Buat rekap harian untuk atasan

Tiap langkahnya sederhana, tapi volumenya lumayan dan terus berulang. Lama-lama kerasa juga dampaknya:

1. **Waktu habis di kerjaan berulang**
2. **Human error** untuk hal kecil (salah ketik, salah mapping kolom)
3. **Lead time membengkak** kalau volume data naik
4. **Tim capek**, karena tenaga habis untuk kerja administratif

Di titik itu pertanyaannya bukan lagi _"bisa dikerjakan manual atau tidak"_, tapi _"sampai kapan kita mau bayar mahal untuk kerjaan yang bisa diotomasi?"_

## Kenapa Memilih UiPath

Saya sempat melihat beberapa opsi otomasi. Untuk kondisi tim saat itu, UiPath yang paling realistis.

### 1. _Learning curve_ Cukup Ramah

Untuk tim yang bukan anak coding full-time, workflow visual UiPath memudahkan langkah awal. Logikanya tetap harus rapi, tapi masuknya tidak seseram nulis kode dari nol.

### 2. Bisa Nyambung ke Proses yang Sudah Ada

Kami tidak mungkin merombak semua sistem dari nol. UiPath membantu "menjembatani" proses lama, jadi operasional tetap jalan.

### 3. Implementasi Lebih Cepat

Untuk kasus repetitif dengan aturan jelas, hasilnya cepat kelihatan. Ini juga membantu meyakinkan stakeholder non-teknis, karena mereka lebih percaya hasil daripada slide hehe.

UiPath jelas bukan jawaban untuk semua kasus. Kalau prosesnya sudah API-first dan sistemnya rapi, custom automation kadang lebih cocok. Tapi untuk kondisi tim saat itu, ini trade-off yang paling masuk akal.

## Cara Saya Mengerjakannya

Saya tidak mulai dari proses paling rumit. Saya pilih alur yang paling sering berulang dan aturannya paling stabil.

### 1. Pilih Prosesnya Dulu

Kriteria saya sederhana:

- Frekuensi tinggi
- Aturan jelas
- Dari minggu ke minggu jarang berubah
- Kalau salah input manual, dampaknya terasa

Ini penting. Kalau aturannya sering berubah, bot cepat "rapuh" dan kepercayaan tim ikut hilang.

### 2. Petakan Alur As-Is Sampai Detail

Sebelum bikin robot, saya mencatat setiap langkah manual: data masuk, validasi, kondisi gagal, sampai keluaran akhir.

Nah, di tahap ini saya baru sadar banyak langkah ternyata hanya ada "di kepala" operator dan tidak pernah didokumentasikan. Tanpa catatan itu, bot bisa mentok di tengah jalan.

### 3. Bot Kecil-Kecil, Uji Cepat

Daripada satu bot raksasa untuk semuanya, saya bagi jadi modul kecil:

- Modul baca input
- Modul validasi
- Modul input ke sistem
- Modul laporan dan notifikasi

Debugging dan perawatannya jadi lebih enak. Kalau satu bagian rewel, saya tidak perlu membongkar semuanya.

### 4. _Exception Handling_ dari Awal

Bagian ini sering disepelekan, padahal skenario gagal pasti datang:

- Format file berubah
- Kolom wajib kosong
- Sistem target lambat atau timeout
- Kredensial tidak valid

Kalau bot cuma jalan di skenario ideal, itu bukan otomasi, itu demo. Dari awal saya pakai prinsip "anggap error itu normal", dan memastikan bot punya log yang jelas serta bisa di-retry dengan aman.

## Setelah Bot Jalan

Setelah stabil beberapa siklus, ini yang terasa:

- Waktu proses harian turun signifikan
- Error input manual berkurang
- SLA internal lebih mudah dijaga
- Tim operasional punya ruang untuk analisis, bukan cuma entry data

Yang paling berubah justru cara tim memandang bot. Awalnya ada yang khawatir, _"nanti bot gantiin kerjaan kita"_. Begitu bot jalan, kerjaan repetitif diurus bot, dan tim bisa fokus ke hal yang butuh keputusan dan konteks.

## Yang Paling Kepakai

### 1. Ini Proyek Proses, Bukan Sekadar Proyek Tool

Kalau prosesnya masih berantakan, tool secanggih apa pun tidak akan merapikannya. Rapikan alurnya dulu, baru otomasi.

### 2. Jangan Kejar yang Rumit di Awal

Hasil kecil yang jadi lebih baik daripada rencana besar yang tidak selesai. Mulai dari use case sederhana tapi berdampak.

### 3. Log dan Dokumentasi Itu Penyelamat

Saat bot gagal di jam sibuk, log yang jelas lebih berguna daripada diagram yang cantik. Dokumentasi alur juga memudahkan handover ke tim lain.

### 4. Ajak User Operasional dari Awal

Mereka yang menjalankan proses ini setiap hari. Insight mereka sering lebih akurat daripada tebakan tim teknis (termasuk tebakan saya). Mengajak mereka dari awal juga bikin adopsi lebih mulus.

## Penutup

Buat saya, RPA UiPath bukan soal "menggantikan manusia", tapi mengembalikan waktu mereka untuk kerjaan yang lebih berguna. Kerjaan repetitif tetap harus selesai, cuma tidak harus selalu manual.

Untuk contoh lain dari lapangan, saya juga menulis [studi kasus lain](/writing/2026/miss-calculation-in-business-process-automation/). Di sana salah hitung kertas kerja obligasi sampai Rp8 miliar membuat saya sadar bahwa proses yang terlalu manual bisa menumpulkan kepekaan terhadap risiko.

Kalau sedang menimbang apakah sebuah proses cocok diotomasi dan mau ngobrol soal pendekatannya, [hubungi saya](/contact/). Rincian [layanan](/services/) yang bisa saya bantu juga ada di sini.

---

_Tag: [catatan](/tags/catatan/) · [rpa](/tags/rpa/) · [otomasi](/tags/otomasi/) · [uipath](/tags/uipath/)_
