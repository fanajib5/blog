---
title: "Hijrah Frontend (3): Type Chaos, Angka, String Kosong, dan Halaman yang Berbeda Pendapat"
description: "Ep 3 seri Hijrah Frontend: satu field yang sama dikirim sebagai angka, string kosong, dan string biasa tergantung halamannya. Tentang PHP yang memafkan, Go yang perfeksionis, dan 194 bekas lukanya."
author: "Faiq Najib Al-Aziz"
date: 2026-09-24T09:00:00+07:00
lastmod: 2026-09-11T03:15:00+07:00
draft: true
toc: true
comments: false
tags:
  - frontend
  - typescript
  - type-safety
  - cerita
series: "Hijrah Frontend"
---

Ada satu _field_ yang sama, dikirim oleh tiga halaman berbeda, dengan tiga keyakinan berbeda tentang apa dia itu. Halaman pertama mengirim angka. Halaman kedua, kalau kosong, mengirim _string_ kosong. Halaman ketiga mengirim angka tapi dibungkus _string_. Ketiganya hidup damai bertahun-tahun, sampai satu hari penerimanya berganti menjadi sistem yang menolak menebak hehe~

Episode ini tentang _type chaos_: bagaimana ia lahir tanpa niat siapa pun, kenapa ia bertahan bertahun-tahun, dan bekas lukanya yang sampai hari ini masih terukur di _repo_ kami.

## Dunia yang Memafkan

Dulu, penerima cerita ini adalah PHP. Dan PHP, bagi tipe data, adalah teman paling pemaaf yang pernah ada. Kirim `"123"`, dia baca 123. Kirim `""`, dia baca kosong. Kirim `null`, dia pura-pura tidak melihat. Selama bertahun-tahun, tidak ada satu halaman pun yang merasa perlu memikirkan tipe, karena bahasanya tidak pernah mempermasalahkannya.

Dunia ini berjalan damai. Semua halaman mengirim dengan gayanya masing-masing, _backend_ menerima dengan senyum, dan hidup terasa sederhana. Yang tidak kami sadari: damai itu bukan karena sistemnya sehat, tapi karena saksi utamanya tidak pernah bersaksi hehe~

## Tetangga Baru yang Perfeksionis

Lalu _backend_-nya pindah ke Go, dan Go punya pandangan yang sangat berbeda tentang tipe: **tipe adalah kontrak**. Kalau kontraknya bilang angka, yang datang harus angka; _string_ kosong yang mengaku angka akan ditolak di pintu, dengan _error decoding_ yang panjang dan tidak tertawakan.

Di sinilah chaos itu baru tampak bentuknya. Bukan karena Go menciptakan chaos; Go cuma berhenti memafkannya. Tiga keyakinan yang selama ini hidup damai tiba-tiba jadi tiga pelanggaran:

1. Ada nilainya? Kirim **angka**. Tidak ada nilainya? Kirim **_string_ kosong**.[^2]
2. Halaman lain untuk fungsi serupa mengirim **_string_**, dari sananya.
3. Dan tidak ada dua halaman yang pernah duduk bareng menyepakati hal itu.

Tidak ada penjahat di cerita ini. Setiap halaman konsisten dengan dirinya sendiri, sepanjang umurnya. Chaosnya itu _emergent_: ia lahir dari bertahun-tahun kebebasan, bukan dari kejahatan siapa pun hahaha.

## Bekas Luka yang Terukur

Bagian favorit saya dari episode ini: chaosnya tidak cuma bisa diceritakan, dia bisa dihitung.

Saat saya menyapu _repo_ baru, satu pola terlihat jelas: hampir dua ratus pemanggilan `String()` tersebar di halaman-halaman, plus dua puluh lebih `Number()`.[^1] Sebagian memang tugas resminya; sebagian lagi adalah **bekas luka** dari era chaos: jaring pengaman kecil yang dipasang supaya nilai yang tak tentu tipenya tetap bisa diproses.

Dua ratus jaring pengaman itu tidak salah; malah mereka pahlawan sunyi yang membuat transisi tetap jalan. Tapi kehadiran mereka adalah pengukuran paling jujur tentang masalahnya: kalau tipe data sudah dipercaya, tidak akan ada dua ratus titik yang merasa perlu menebak-nebak hehe~

## Kontrak, Bukan Tebak-Tebakan

Solusi jangka panjangnya bukan menambah jaring pengaman keempat ratus. Solusinya adalah mengubah pertanyaannya: dari _"nilai ini bentuknya apa hari ini?"_ menjadi _"kontraknya bilang apa?"_

Satu _field_, satu tipe yang dijanjikan, dipatuhi semua halaman yang mengirimnya. _String_ kosong yang mengaku angka tidak lagi ditolak di ujung dengan _error_; dia ditolak lebih awal, di tempat yang bisa menjelaskan dengan sopan. Dan daftar kontrak itu menjadi dokumen paling berguna yang pernah diabaikan _frontend_ bertahun-tahun: sederhana, tertulis, dan menghabiskan semua perdebatan hahaha.

## Pelajaran

1. **Bahasa yang memafkan menyembunyikan hutang tipe.** Ia bukan menyelesaikan masalah; ia menundukkannya sampai penerima berganti.
2. **Chaos itu _emergent_, bukan disengaja.** Setiap halaman benar secara lokal; hanya sistem keseluruhan yang salah.
3. **Penerima yang _strict_ itu berkah, meski terasa seperti pengganggu.** Dia memaksa kontrak yang seharusnya sudah ada sejak awal.
4. **Normalisasi di satu pintu, jangan disebarkan.** Dua ratus jaring pengaman tersebar itu bukan arsitektur; itu angsuran.

Episode berikutnya kita naik ke lapisan yang lebih terlihat: dua _library_ UI yang hidup berdampingan di satu aplikasi, dan penamaan yang berganti setiap pergantian tukang. Sampai ketemu di sana.

Sekian. Salam.

[^1]: Pola dan angka dihitung langsung dari _repo_ saat episode ini ditulis; tidak semua pemanggilan konversi adalah bekas luka, dan tidak semua bekas luka tercatat.

[^2]: Detail _endpoint_, nama _field_, dan bentuk _error_ disederhanakan; yang dipertahankan hanya bentuk masalahnya.
