---
title: "Hijrah Backend (5): Query yang Bilang 'Pakai _Index_-ku'"
description: "Cerita episode 5 Hijrah Backend: satu DATE() membuat index tak terpakai, tersangka COLLATE ternyata tidak bersalah, dan ada utang yang belum sempat saya bereskan."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:05+07:00
lastmod: 2026-09-10T23:45:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - database
  - sql
  - cerita
series: "Hijrah Backend"
---

Di [episode kedua](/writing/2026/hijrah-backend-02/), _query_-nya tidak bersalah. Di CLI cuma 78 milidetik, sementara _endpoint_-nya makan 15 detik. Kali ini kebalikannya: _query_-nya memang bersalah. Bukan karena rumit, tapi karena satu pembungkus fungsi membuatnya **mengabaikan _index_ yang sudah disiapkan**.

## _Index_-nya Ada, Malah Tiga

Korbannya: _endpoint_ hitungan _alert_ per _device_. Satu tabel _alert_ berisi puluhan juta baris,[^2] dan di atasnya ada _index_ komposit: (tanggal, _device_, tipe _alert_). Kalau kamu membaca kebutuhan _endpoint_-nya, "ambil jumlah _alert_ per _device_ per tipe, dalam rentang tanggal", _index_ itu persis seperti dibuat untuk _query_ ini. Seseorang di masa lalu memahami masalahnya dengan benar.

Bagian favorit saya baru ketahuan saat menulis episode ini: di skema _database_, _index_ yang sama ternyata punya **tiga salinan**. Namanya beda, isinya sama. Sepertinya ada tiga orang dari tiga masa berbeda yang menambahkannya tanpa mengecek skema dulu hahaha. Jadi _index_-nya bukan cuma tersedia, malah kebanyakan.

Namun _query_-nya tetap tidak memakainya. _Full table scan_ di puluhan juta baris membuat _endpoint_ merayap sampai ±10 detik. _Index_ yang tepat sudah tersedia, tetapi _query_ ini tidak bisa menggunakannya.

## Buku Telepon yang Harus Dibaca dari Awal

Istilah teknisnya _non-sargable_, alias _query_ yang membuat _index_ tidak bisa dipakai. Bayangkan _index_ sebagai buku telepon yang disusun alfabetis.

Tanya buku telepon: _"cari semua nama yang dimulai huruf B"_, dia langsung buka halaman B, selesai sepersekian detik. Sekarang tanya: _"cari semua nama yang kalau huruf-hurufnya diacak ulang, dimulai huruf B"_, bukunya cuma bisa baca dari halaman satu sampai tamat, karena urutan alfabetisnya tidak lagi membantu.

`WHERE DATE(kolom) >= DATE(?)` itu persis pertanyaan kedua: fungsi `DATE()` dipanggil **pada kolom**, artinya setiap baris di tabel puluhan juta baris harus diubah bentuknya dulu, baru dibandingkan. _Index_ yang tersusun rapi tidak berguna untuk nilai yang belum lahir dari fungsinya. _Database_-nya tidak bodoh; dia cuma tidak punya pilihan.

## Pindahkan Fungsinya, Bukan Kolomnya

Perbaikannya bukan _tuning_ eksotis, cuma memindahkan fungsi dari sisi kolom ke sisi parameter:[^1]

```sql
-- sebelum: index didiamkan
WHERE DATE(a.dt) >= DATE(?) AND DATE(a.dt) <= DATE(?)

-- sesudah: index kembali dipakai
WHERE a.dt >= ? AND a.dt <= ?
```

Konsekuensinya, parameter harus dikirim lengkap dengan jamnya. Di kode saya, batas waktunya memang sudah disiapkan di _usecase_, dari `00:00:00` sampai `23:59:59`. Hasilnya tetap sama, semua baris di tanggal yang dimaksud ikut terambil.

Hasil akhirnya: dari ±10 detik _full scan_ menjadi pencarian _index_ yang sekejap mata. _Deploy_, dan _endpoint_ itu pulih tanpa satu baris _business logic_ disentuh.

## COLLATE Ternyata Bukan Pelakunya

Supaya adil, cerita episode ini punya subplot. Di penyelidikan yang sama, ada satu _join_ yang tampak sangat mencurigakan: perbandingan antar tabel dengan penanda _collate_ eksplisit di tengahnya. Wajahnya persis tersangka klasik _query_ lambat: "beda _collation_ bikin _join_ tidak memakai _index_".

Setelah dicek, kedua sisi yang di-_join_ memakai _collation_ yang sama. Penandanya redundan, bukan penyebab masalah. Tersangka dibebaskan.

Dua episode ini arahnya berlawanan. Di [episode dua](/writing/2026/hijrah-backend-02/), _EXPLAIN_ menunjukkan CTE bukan masalahnya. Kali ini, pemeriksaan membuktikan `DATE()` memang pelakunya. Intuisi boleh menunjuk tersangka, tapi tetap perlu diperiksa dulu.

## Ada Tiga Lagi yang Belum Saya Bereskan

Setelah memperbaiki satu kasus `DATE()`, saya mencari pola yang sama di _codebase_. Ketemu tiga _join_ lain dengan bentuk identik di modul bahan bakar. `DATE()` dipanggil pada kolom di sisi kiri dan kanan _join_.

Statusnya saat episode ini ditulis: **belum saya perbaiki**. _Endpoint_-nya belum pernah dilaporkan lambat, jadi belum mendapat jatah waktu perbaikan. Polanya sudah masuk daftar; kalau nanti dikerjakan, `EXPLAIN` akan ikut memeriksanya.

Migrasi dengan paritas memang meninggalkan utang kecil seperti ini. Buat saya, yang penting utangnya tercatat. Jangan sampai pura-pura lupa, hahaha.

## Catatan Buat Saya

Kalau saya tarik benang merahnya, satu fungsi kecil di sisi kolom bisa bikin _index_ yang sudah ada jadi tidak berguna. Jadi setelah menemukan satu pola, saya cari juga saudara-saudaranya. Kali ini ketemu tiga, dan saya catat dulu sebagai utang. Bukan berarti dibiarkan selamanya, ya. Semoga saya ingat pas ada waktu mengerjakannya hehe.

Di episode berikutnya saya pindah dari satu _query_ ke bentuk kotanya: bagaimana _monolith_ puluhan ribu baris dirombak jadi 14 modul _domain_, sementara pesawatnya tetap terbang.

Sekian. Salam.

[^1]: Potongan SQL disederhanakan untuk keperluan cerita, nama tabel dan kolom dipertahankan secukupnya, detail lain diubah.

[^2]: Angka baris tabel dibulatkan ke orde besaran; kapasitas dan skala persisnya tidak perlu untuk memahami pelajarannya.
