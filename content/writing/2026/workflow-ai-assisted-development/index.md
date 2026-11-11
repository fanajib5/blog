---
title: "Workflow AI-Assisted Development: Kilo, Claude Code, dan Teman-Temannya"
description: "Cerita cara saya bekerja bareng AI coding agent sehari-hari: memory lintas sesi, verifikasi ala receipt, dan pelajaran dari AI yang percaya diri padahal salah."
author: "Faiq Najib Al-Aziz"
date: 2026-10-13
lastmod: 2026-10-13
draft: false
toc: true
comments: true
images:
  - og.png
tags:
  - ai
  - tools
  - workflow
  - productivity
pillar: "ai-dev"
---

Ada dua kejadian di sesi kerja saya belakangan ini. Dua-duanya benar-benar terjadi, dan dua-duanya melibatkan AI yang sama.

Pertama: saya minta asisten AI melanjutkan pekerjaan konten. Dia bekerja gigih: menyusun roadmap, menulis master doc, lalu mendraft artikel pembuka sebuah seri. Rapi, meyakinkan, dan **ternyata duplikat semua**. Draft artikel itu sudah ada, saya tulis minggu sebelumnya, tergeletak diam di folder. AI tidak tahu karena tidak ada yang mengingatkannya.

Kedua: di artikel tentang protokol GPS, AI menuliskan contoh paket dari "datasheet" dengan percaya diri penuh: nomor serial, nilai CRC, sampai IMEI 16 digit (IMEI itu 15 digit, hitung digit saja dia gagal hahaha). Urutan byte salah, nilai salah, panjang salah. Dan dia akan terus mempertahankannya sampai kode uji menolaknya mentah-mentah. Setelah semua varian CRC saya _brute-force_ terhadap PDF datasheet aslinya, barulah mesin yang sama memberi jawaban benar, itu pun setelah dikasih _receipt_ untuk diverifikasi.

Dua kejadian itu mengubah cara saya bekerja dengan AI coding agent. Intinya: **hasilnya baru berguna setelah saya tahu cara memeriksanya.**

## Yang Berubah dalam Cara Kerja Saya

Saya sudah tidak memperlakukan AI sebagai _autocomplete yang percaya diri_: terima output, salin, lanjut. Dari pengalaman saya, lebih masuk akal menganggapnya **junior engineer yang cepat banget, banyak baca, dan bisa yakin luar biasa padahal keliru**.

Buat saya, AI seperti itu berguna selama hasilnya tetap saya review. Sebagai backend developer, dulu saya menulis kode dan sesekali minta review. Sekarang **AI yang menulis, saya yang memverifikasi**. Kerjaan saya bergeser dari mengetik ke membaca, menguji, dan memutuskan.

Makanya yang paling saya andalkan bukan "prompt engineering", tapi **verifikasi**: menulis uji, mencari sumber yang bisa dipercaya, dan memeriksa apakah jawaban yang terdengar fasih itu memang benar.

## Stack Harian Saya

Bukan iklan, cuma konteks. Ini yang benar-benar terpasang di mesin kerja saya, plus alasannya:

**Agent CLI (Kilo Code, Claude Code).** Saya lebih produktif dengan agent di terminal daripada plugin IDE. Dia bisa dikomposisikan dengan `git`, `docker`, `psql`, dan server dev yang sedang jalan. Semua pekerjaan non-trivial ujung-ujungnya di shell, jadi agent yang tinggal di shell tidak butuh jembatan.

**Serena (MCP, navigasi semantik).** Di codebase Laravel/Go yang besar, LSP membantu saya menemukan definisi dan referensi simbol langsung. Hasilnya lebih presisi daripada pencarian teks pakai grep, dan agent cukup membaca simbol yang relevan tanpa memasukkan banyak file ke context.

**Memory server (knowledge graph per project).** Ini jawaban saya untuk kejadian pertama. Keputusan arsitektur, insiden yang sudah terpecahkan, dan jebakan yang pernah ketemu saya simpan sebagai graph per project, lalu saya cari di awal tiap tugas. Sejak itu saya jauh lebih jarang mengulang kerjaan yang sudah ada.

**Dokumentasi hidup (context7).** Sebelum menulis kode yang menyentuh API versi tertentu, saya suruh agent baca dokumentasi terbaru. Lumayan menghindarkan jawaban yang memakai API yang _dulu_ benar.

**Checkpoint berpikir (sequential thinking).** Saat debugging beberapa lapisan yang saling memengaruhi, seperti Dockerfile, reverse proxy, dan environment variable, saya pakai proses reasoning eksplisit yang bisa direvisi di tengah jalan. AI-nya tidak jadi lebih pintar, tapi saya jadi bisa menahan kesimpulan sampai tiap lapisan dicek.

## Rutinitas yang Saya Pakai

Seri [GPS Backend](/writing/2026/memahami-gps-protocol/) di blog ini jadi contoh konkretnya: enam artikel teknis dengan kode yang ditulis dan diverifikasi bareng AI. Waktu mengerjakannya, pola saya begini:

1. **Rencana dulu, baru generate.** Satu dokumen roadmap dan satu master doc jadi _single source of truth_. Peta ini menjaga tiap artikel tetap nyambung dengan seri, bukan cuma kelihatan bagus sendirian.
2. **Cek memory sebelum mulai.** Saya tinjau keputusan dan kegagalan sebelumnya supaya sesi baru tidak mengulanginya. Context yang tepat sasaran lebih berguna daripada context yang banyak tapi acak.
3. **Verifikasi itu menjalankan, bukan membaca.** Aturan keras: kode contoh wajib dieksekusi sebelum masuk artikel. Decoder GT06 diuji 13 asersi terhadap vektor datasheet. SQL TimescaleDB dijalankan di container dengan 155 ribu baris. WebSocket diuji 50 klien konkuren plus satu klien yang sengaja disabotase. Pengujian itu menangkap bug yang _tidak kelihatan_ kalau cuma baca kode (data race di `RLock`, off-by-one offset kecepatan, timeout yang bertabrakan dengan interval heartbeat).
4. **Catat keputusan setelah selesai.** Hal yang saya pelajari saya masukkan ke memory supaya sesi berikutnya bisa lanjut dari keputusan yang sudah dibuat.

Langkah 3 yang paling penting buat saya. Kode yang belum dijalankan masih hipotesis, siapa pun yang menulisnya.

## Pola yang Saya Waspadai

Ada empat pola yang berulang di sesi saya, dan cara saya menghadapinya:

**Halusinasi yang percaya diri.** Contoh datasheet di awal tadi salah, tapi disajikan dengan format yang meyakinkan. Untuk klaim faktual, saya cari _receipt_: vektor uji, tautan sumber, atau output mesin yang bisa direproduksi. "Kata AI begitu" bukan sumber.

**Amnesia.** Kalau sesi tidak membawa konteks sebelumnya, pekerjaan yang sudah ada bisa terulang. Keputusan saya simpan di memory dan status kerjaan di roadmap supaya kelihatan apa yang sudah beres.

**Yes-boss syndrome.** Kalau keputusannya punya konsekuensi, saya minta beberapa opsi beserta trade-off-nya sebelum memilih. Jadi saya bisa menilai pilihan, bukan cuma menerima solusi pertama.

**Context yang penuh sesak.** Tugas besar lebih gampang ditangani kalau dipecah jadi bagian yang bisa dicek satu-satu. Saya pakai dokumen acuan supaya bagian-bagiannya tetap nyambung.

## Jadi, Ini Curang atau Bukan?

Pertanyaan yang pasti muncul: menulis artikel dibantu AI, itu curang?

Pendapat saya: yang penting bukan siapa yang mengetik, tapi **siapa yang bertanggung jawab atas isinya**. Saya bilang terang-terangan bahwa seri GPS ditulis dibantu AI karena klaimnya bisa diperiksa: CRC diverifikasi dengan brute-force, SQL punya hasil `EXPLAIN ANALYZE`, dan angkanya dari pengujian sungguhan. AI memang bisa salah dengan yakin, tapi manusia juga bisa jatuh ke jebakan yang sama kalau cuma mengandalkan ingatan dan melewatkan verifikasi.

Kalau mau mulai, pilih satu kebiasaan saja: **jangan anggap kode benar sebelum dijalankan**. Memory, dokumentasi, dan checkpoint membantu kerjaan saya, tapi semuanya bermula dari mau memeriksa hasilnya, termasuk saat AI dengan yakin menulis IMEI 16 digit.

## What's Next

Saya berencana menulis lanjutan soal AI ini: otomasi Google Apps Script dengan bantuan AI untuk kerjaan operasional non-koding. Ikuti lewat [RSS](/writing/index.xml) atau [hubungi saya](/contact/) kalau ada workflow AI yang mau ditanyakan.

## CTA

Kalau menemukan kekeliruan pada contoh paket atau hasil pengujian, [hubungi saya](/contact/). Boleh juga subscribe [RSS](/writing/index.xml) untuk mengikuti tulisan berikutnya.
