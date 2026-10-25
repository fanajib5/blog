---
title: "Workflow AI-Assisted Development: Kilo, Claude Code, dan Teman-Temannya"
description: "Cara saya bekerja bareng AI coding agent sehari-hari — bukan review fitur, tapi workflow nyata: memory lintas sesi, verifikasi ala receipt, dan pelajaran dari AI yang percaya diri sambil salah."
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

Dua kejadian dari sesi kerja saya belakangan ini, keduanya benar-benar terjadi, keduanya melibatkan AI yang sama:

Pertama: saya minta asisten AI melanjutkan pekerjaan konten. Dia bekerja gigih — menyusun roadmap, menulis master doc, lalu mendraft artikel pembuka sebuah seri. Rapi, meyakinkan, dan **sepenuhnya duplikat**: draft artikel itu sebenarnya sudah ada, ditulis minggu sebelumnya, tergeletak diam di folder. AI tidak tahu — karena tidak ada yang mengingatnya.

Kedua: dalam artikel tentang protokol GPS, AI menuliskan contoh paket dari "datasheet" dengan percaya diri total: nomor serial, nilai CRC, sampai IMEI 16 digit (IMEI itu 15 digit — dia bahkan gagal di arithmetic digit). Salah urutan byte, salah nilai, salah panjang. Dan dia akan mempertahankannya sampai kode uji menolaknya mentah-mentah. Setelah brute-force semua varian CRC terhadap PDF datasheet asli, barulah jawaban yang benar muncul — dari mesin yang sama, setelah diberi _receipt_ untuk diverifikasi.

Dua kejadian itu mengubah cara saya bekerja dengan AI coding agent. Yang saya pelajari: **hasilnya baru berguna setelah saya tahu cara memeriksanya.**

## Yang Berubah dalam Cara Kerja Saya

Saya tidak lagi memperlakukan AI sebagai _autocomplete yang percaya diri_ — menerima output, menyalin, lalu lanjut. Dari pengalaman saya, lebih masuk akal memperlakukannya sebagai **junior engineer yang sangat cepat, banyak membaca, dan bisa sangat yakin meski keliru**.

Bagi saya, AI seperti itu berguna selama hasil kerjanya tetap saya review. Sebagai backend developer, dulu saya menulis kode dan sesekali minta review; sekarang **AI yang menulis dan saya yang memverifikasi**. Pekerjaan saya bergeser dari mengetik ke membaca, menguji, dan memutuskan.

Karena itu, hal yang paling saya andalkan bukan "prompt engineering", melainkan **verifikasi**: menulis uji, mencari sumber yang bisa dipercaya, dan memeriksa apakah jawaban yang terdengar fasih memang benar.

## Stack Harian Saya

Bukan iklan — cuma konteks. Ini yang benar-benar terpasang di mesin kerja saya, dan kenapa masing-masing ada:

**Agent CLI (Kilo Code, Claude Code).** Saya lebih produktif dengan agent di terminal daripada plugin IDE: dia bisa dikomposisikan dengan `git`, `docker`, `psql` — dan dengan server dev yang sedang jalan. Semua pekerjaan non-trivial berakhir di shell; agent yang hidup di shell tidak butuh jembatan.

**Serena (MCP, navigasi semantik).** Di codebase Laravel/Go yang besar, saya menggunakannya untuk mencari definisi dan referensi simbol lewat LSP, bukan membuka banyak file untuk menelusurinya dengan grep.

**Memory server (knowledge graph per project).** Ini jawaban saya untuk kejadian pertama. Saya simpan keputusan arsitektur, insiden yang sudah terpecahkan, dan jebakan yang pernah ditemui sebagai graph per project, lalu mencarinya di awal tiap tugas. Sejak itu, saya jauh lebih jarang mengulang pekerjaan yang sudah ada.

**Dokumentasi hidup (context7).** Sebelum menulis kode yang menyentuh API versi tertentu, saya arahkan agent untuk membaca dokumentasi terkini. Ini membantu menghindari jawaban yang memakai API yang _dulu_ benar.

**Checkpoint berpikir (sequential thinking).** Saat debugging berlapis — Dockerfile, reverse proxy, dan environment variable yang saling berpengaruh — saya gunakan proses reasoning eksplisit yang bisa direvisi di tengah jalan. Ini tidak membuat AI lebih pintar, tetapi membantu saya menahan kesimpulan sampai tiap lapisan diperiksa.

## Rutinitas yang Saya Pakai

Seri [GPS Backend](/writing/2026/memahami-gps-protocol/) di blog ini memberi saya contoh konkret: enam artikel teknis dengan kode yang ditulis dan diverifikasi bersama AI. Dalam pengerjaannya, saya memakai pola berikut:

1. **Rencana dulu, baru generasi.** Satu dokumen roadmap dan satu master doc menjadi _single source of truth_. Peta ini menjaga tiap artikel tetap sejalan dengan seri, bukan hanya terlihat bagus sendirian.
2. **Cek memory sebelum mulai.** Saya tinjau keputusan dan kegagalan sebelumnya agar sesi baru tidak mengulangnya. Context yang tepat sasaran lebih berguna daripada context yang banyak tetapi acak.
3. **Verifikasi = jalankan, bukan baca.** Aturan keras: kode contoh wajib dieksekusi sebelum masuk artikel. Decoder GT06 diuji 13 asersi terhadap vektor datasheet. SQL TimescaleDB dijalankan di container dengan 155 ribu baris. WebSocket diuji 50 klien konkuren plus satu klien sengaja disabotase. Pengujian itu menangkap bug yang _tidak terlihat_ dari membaca kode (data race di `RLock`, off-by-one offset kecepatan, timeout yang bertabrakan dengan interval heartbeat).
4. **Catat keputusan setelah selesai.** Saya masukkan hal yang dipelajari ke memory agar sesi berikutnya bisa melanjutkan dari keputusan yang sudah dibuat.

Langkah 3 paling penting bagi saya. Kode yang belum dijalankan masih hipotesis, siapa pun yang menulisnya.

## Pola yang Saya Waspadai

Ada empat pola yang berulang di sesi saya, beserta cara saya menghadapinya:

**Halusinasi yang percaya diri.** Contoh datasheet di pembuka salah, tetapi disajikan dengan format meyakinkan. Untuk klaim faktual, saya cari _receipt_ — vektor uji, tautan sumber, atau output mesin yang bisa direproduksi. "AI bilang begitu" bukan sumber.

**Amnesia.** Ketika sesi tidak membawa konteks sebelumnya, pekerjaan yang sudah ada bisa terulang. Saya menyimpan keputusan di memory dan status pekerjaan di roadmap agar bisa melihat apa yang sudah dikerjakan.

**Yes-boss syndrome.** Saat keputusan punya konsekuensi, saya minta beberapa opsi dan trade-off-nya sebelum memilih. Dengan begitu, saya bisa menilai pilihan, bukan sekadar menerima solusi pertama.

**Context yang penuh sesak.** Tugas besar lebih mudah ditangani jika dipecah menjadi bagian yang bisa diperiksa satu per satu. Saya memakai dokumen acuan agar bagian-bagiannya tetap terhubung.

## Jadi, Ini Curang atau Bukan?

Pertanyaan yang pasti muncul: menulis artikel dengan bantuan AI — itu curang?

Posisi saya: yang penting bukan siapa yang mengetik, tetapi **siapa yang bertanggung jawab atas isinya**. Saya menyatakan bahwa seri GPS ditulis dengan bantuan AI karena klaim-klaimnya bisa diperiksa: CRC diverifikasi dengan brute-force, SQL punya hasil `EXPLAIN ANALYZE`, dan angkanya berasal dari pengujian sungguhan. Bagi saya, memakai AI tidak mengurangi tanggung jawab untuk memeriksa semuanya.

Kalau ingin mulai, pilih satu kebiasaan: **jangan menganggap kode benar sebelum menjalankannya**. Memory, dokumentasi, dan checkpoint membantu pekerjaan saya, tetapi semuanya berawal dari kesediaan memeriksa hasilnya — termasuk ketika AI menulis IMEI 16 digit dengan yakin.

## What's Next

Saya akan menulis lanjutan praktik AI ini — otomasi Google Apps Script dengan bantuan AI untuk pekerjaan operasional non-koding. Ikuti lewat [RSS](/writing/index.xml) atau [hubungi saya](/contact/) kalau ada workflow AI yang mau kamu tanyakan.

## CTA

Bagikan artikel ini jika bermanfaat. Untuk diskusi lebih lanjut, kunjungi [Contact](/contact/) atau subscribe [RSS](/writing/index.xml).
