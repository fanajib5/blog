---
title: "Workflow AI-Assisted Development: Kilo, Claude Code, dan Teman-Temannya"
description: "Cara saya bekerja bareng AI coding agent sehari-hari — bukan review fitur, tapi workflow nyata: memory lintas sesi, verifikasi ala receipt, dan pelajaran dari AI yang percaya diri sambil salah."
author: "Faiq Najib Al-Aziz"
date: 2026-10-13
lastmod: 2026-10-13
draft: true
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

Dua cerita itu adalah dua sisi dari satu koin, dan artikel ini tentang koinnya: **bagaimana bekerja dengan AI coding agent tanpa jadi korban kekuatannya sendiri.**

## Pergeseran Mental Model

Cara salah memakai AI: menjadikannya _autocomplete yang percaya diri_ — terima output, salin-tempel, lanjut. Cara yang benar menurut pengalaman saya: perlakukan dia sebagai **junior engineer yang sangat cepat, sangat luas bacaannya, dan overconfident secara struktural**.

Junior seperti itu luar biasa berguna kalau kamu senior yang mau review. Dan itu menggeser pekerjaan saya sebagai backend developer: dulu saya menulis kode dan sesekali minta review; sekarang **AI yang menulis dan saya yang memverifikasi**. Jam kerja saya bergeser dari mengetik ke membaca, menguji, dan memutuskan.

Konsekuensi praktisnya: skill yang paling naik nilainya bukan "prompt engineering" — tapi **verifikasi**. Kemampuan menulis uji yang tidak bisa dibohongi, menemukan sumber otoritatif, dan mengenali kapan jawaban yang fasih itu kosong.

## Stack Harian Saya

Bukan iklan — cuma konteks. Ini yang benar-benar terpasang di mesin kerja saya, dan kenapa masing-masing ada:

**Agent CLI (Kilo Code, Claude Code).** Saya lebih produktif dengan agent di terminal daripada plugin IDE: dia bisa dikomposisikan dengan `git`, `docker`, `psql` — dan dengan server dev yang sedang jalan. Semua pekerjaan non-trivial berakhir di shell; agent yang hidup di shell tidak butuh jembatan.

**Serena (MCP, navigasi semantik).** Untuk codebase Laravel/Go yang besar, mencari definisi dan referensi simbol lewat LSP jauh lebih presisi daripada grep — dan jauh lebih hemat _context window_. Agent yang membaca 3 simbol relevan bekerja lebih baik daripada yang membaca 3 file penuh.

**Memory server (knowledge graph per project).** Ini jawaban dari cerita pertama di pembuka. AI tidak punya memori antar sesi secara bawaan — jadi saya berikan: keputusan arsitektur, insiden yang sudah terpecahkan, dan jebakan yang pernah ketemu, tersimpan sebagai graph per project dan dicari di awal tiap tugas. Sejak protokol ini jalan, "menulis ulang yang sudah ada" praktis hilang.

**Dokumentasi hidup (context7).** API framework berubah lebih cepat dari training data. Sebelum menulis kode yang menyentuh API versi spesifik, agent-nya saya arahkan untuk menarik dokumentasi terkini. Halusinasi paling halus bentuknya adalah API yang _dulu_ benar.

**Checkpoint berpikir (sequential thinking).** Untuk debugging multi-layer — Dockerfile yang bertabrakan dengan proxy yang bertabrakan dengan env — saya paksa proses reasoning eksplisit yang bisa direvisi di tengah jalan. Bukannya AI jadi lebih pintar; jadinya lebih sulit baginya untuk loncat ke kesimpulan.

## Workflow yang Terbukti (dan Alasannya)

Seri [GPS Backend](/writing/2026/memahami-gps-protocol/) yang sedang berjalan di blog ini adalah eksperimen paling sempurna dari workflow itu — enam artikel teknis, semua kodenya ditulis dan diverifikasi dalam sesi bersama AI. Polanya:

1. **Rencana dulu, baru generasi.** Satu dokumen roadmap + satu master doc sebagai _single source of truth_. AI yang bekerja tanpa peta menghasilkan konten acak yang bagus-bagus sendirian.
2. **Cek memory sebelum mulai.** Apa yang sudah diputuskan, apa yang sudah pernah gagal. Lima puluh ribu token context yang tepat sasaran mengalahkan lima juta yang acak.
3. **Verifikasi = jalankan, bukan baca.** Aturan keras: kode contoh wajib dieksekusi sebelum masuk artikel. Decoder GT06 diuji 13 asersi terhadap vektor datasheet. SQL TimescaleDB dijalankan di container dengan 155 ribu baris. WebSocket diuji 50 klien konkuren plus satu klien sengaja disabotase. Hasilnya menakjubkan: bug yang _tidak terlihat_ dari membaca kode (data race di `RLock`, off-by-one offset kecepatan, timeout yang bertabrakan dengan interval heartbeat) semuanya ketangkap karena kode dinyalakan.
4. **Catat keputusan setelah selesai.** Hal yang dipelajari kembali ke memory — sesi berikutnya mulai dari titik ini, bukan dari nol.

Perhatikan langkah 3. Itu inti semuanya. Kode yang tidak dijalankan itu hipotesis — tidak peduli siapa yang menulisnya, manusia atau mesin.

## Pola Kegagalan AI (dan Mitigasinya)

Empat pola yang paling sering saya temui:

**Halusinasi yang percaya diri.** Contoh datasheet di pembuka adalah kelas paling berbahaya: salah tapi fasih, dengan format yang meyakinkan. Mitigasi: klaim faktual harus punya _receipt_ — vektor uji, tautan sumber, atau output mesin yang bisa direproduksi. "AI bilang begitu" bukan sumber.

**Amnesia.** Tanpa memory eksternal, tiap sesi mulai dari nol dan mengulang pekerjaan yang sudah ada. Mitigasi: memory protocol + file status (roadmap dengan status per item) — murah, dan mengubah AI dari penebak jadi pewaris.

**Yes-boss syndrome.** Minta satu solusi, dia kasih satu solusi — padahal ada lima dengan trade-off berbeda. Mitigasi: minta opsi beserta trade-off-nya sebelum eksekusi, terutama untuk keputusan arsitektur. Agent yang baik akan melawanmu dengan pilihan, bukan menurut dengan satu jawaban.

**Context yang penuh sesak.** Masalah besar dimasukkan sekaligus = kualitas luruh diam-diam di tengah jalan. Mitigasi: pecah jadi tugas atom + SSoT documents — sama seperti kita memecah epic jadi ticket, alasan sama.

## Jadi, Ini Curang atau Bukan?

Pertanyaan yang pasti muncul: menulis artikel dengan bantuan AI — itu curang?

Posisi saya: yang penting bukan siapa yang mengetik, tapi **siapa yang menanggung jawaban**. Artikel seri GPS tadi ditulis AI-assisted, dan saya tulis begitu adanya — karena setiap klaimnya bisa ditagih: CRC-nya diverifikasi brute-force, SQL-nya punya hasil `EXPLAIN ANALYZE`, angkanya hasil uji sungguhan. Workflow-nya justru menaikkan standar dibanding saya menulis sendiri dari ingatan (ingat cerita kedua? yang percaya diri sambil salah itu AI; yang sama akan terjadi pada manusia yang malas memverifikasi).

Kalau kamu mau mulai, mulai dari satu hal saja: **puas hanya ketika kodenya jalan**. Sisanya — memory, dokumen hidup, checkpoint — menyusul alami setelah kejadian pertama kali AI menuliskan IMEI 16 digit dengan wajah lurus.

## What's Next

Saya akan menulis lanjutan praktik AI ini — otomasi Google Apps Script dengan bantuan AI untuk pekerjaan operasional non-koding. Ikuti lewat [RSS](/writing/index.xml) atau [hubungi saya](/contact/) kalau ada workflow AI yang mau kamu tanyakan.

## CTA

Bagikan artikel ini jika bermanfaat. Untuk diskusi lebih lanjut, kunjungi [Contact](/contact/) atau subscribe [RSS](/writing/index.xml).
