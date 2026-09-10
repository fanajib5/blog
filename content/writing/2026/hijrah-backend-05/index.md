---
title: "Hijrah Backend (5): Query yang Bilang 'Pakai _Index_-ku'"
description: "Ep 5 seri Hijrah Backend: ketika index yang sempurna diam-diam didiamkan oleh satu pembungkus DATE(), pelajaran sargable di tabel puluhan juta baris, tersangka COLLATE yang tidak bersalah, dan utang yang saya akui."
author: "Faiq Najib Al-Aziz"
date: 2026-09-24T09:00:00+07:00
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

Di [episode kedua](/writing/2026/hijrah-backend-02/), query-nya tidak bersalah, 78 milidetik di CLI, sementara _endpoint_-nya makan 15 detik. Episode ini cermin kebalikannya: kali ini query-nya benar-benar bersalah. Tapi bukan karena rumit atau jelek, dia bersalah karena satu pembungkus fungsi kecil yang membuatnya **mendiamkan _index_ yang disiapkan khusus untuknya** hehe~

## _Index_ yang Dirancang Sempurna (Dikali Tiga)

Korbannya: _endpoint_ hitungan _alert_ per _device_. Satu tabel _alert_ berisi puluhan juta baris,[^2] dan di atasnya ada _index_ komposit: (tanggal, _device_, tipe _alert_). Kalau kamu membaca kebutuhan _endpoint_-nya, "ambil jumlah _alert_ per _device_ per tipe, dalam rentang tanggal", _index_ itu persis seperti dibuat untuk _query_ ini. Seseorang di masa lalu memahami masalahnya dengan benar.

Dan ini bagian favorit saya, yang baru saya sadari saat menulis episode ini: di skema _database_, _index_ yang sama itu... ada **tiga salinan**. Nama berbeda, isi identik. Sepertinya tiga orang di tiga masa berbeda saling menambahkan tanpa membuka skema dulu hahaha. Jadi _index_ yang dibutuhkan itu bukan cuma ada, dia ada berlebih.

Dan tetap saja, _query_-nya tidak memakainya. _Full table scan_ di puluhan juta baris, _endpoint_ merayap sampai ±10 detik. Luar biasa kan, rasanya saat kebutuhan paling dasar diabaikan di depan mata? hehe~

## Buku Telepon yang Dilitari

Istilah teknisnya _non-sargable_, _query_ yang membuat _index_ tidak bisa dipakai. Cara paling gampang membayangkannya: _index_ itu buku telepon yang tersusun alfabetis.

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

Konsekuensinya: parameter yang dikirim harus lengkap dengan jamnya. Di kode saya, batas waktunya memang sudah disiapkan lengkap dari _usecase_, mulai `00:00:00`, berakhir `23:59:59`, jadi hasilnya tetap identik: semua baris tanggal yang sama, tanpa kehilangan satu detik pun di tengah.

Hasil akhirnya: dari ±10 detik _full scan_ menjadi pencarian _index_ yang sekejap mata. _Deploy_, dan _endpoint_ itu pulih tanpa satu baris _business logic_ disentuh.

## Tersangka yang Tidak Bersalah

Supaya adil, cerita episode ini punya subplot. Di penyelidikan yang sama, ada satu _join_ yang tampak sangat mencurigakan: perbandingan antar tabel dengan penanda _collate_ eksplisit di tengahnya. Wajahnya persis tersangka klasik _query_ lambat: "beda _collation_ bikin _join_ tidak memakai _index_".

Setelah dicek: kedua sisi yang di-_join_ ternyata memakai _collation_ yang sama persis. Penandanya redundan, bukan beracun. Tersangka dibebaskan.

Jadinya dua episode beruntun mengajarkan pelajaran yang sama dari arah berlawanan: di [episode dua](/writing/2026/hijrah-backend-02/) yang menuduh harus bukti (_EXPLAIN_ menggugurkan tuduhan ke CTE), dan di episode ini yang diduga polos pun harus dicek (pembungkus `DATE()` ternyata memang pendekat). _Intuisi_ boleh menunjuk tersangka, tapi hanya pengukuran yang boleh menjatuhkan vonis hehe~

## Utang yang Diakui

Satu bagian yang menurut saya penting untuk ditulis jujur: setelah memperbaiki satu kasus `DATE()`, pola yang sama saya cari di seisi _codebase_, dan menemukan tiga _join_ lain dengan bentuk identik di modul bahan bakar. `DATE()` dipanggil pada kolom di sisi kiri dan kanan _join_.

Statusnya sampai episode ini ditulis: **belum saya perbaiki**. _Endpoint_-nya belum pernah dilaporkan lambat, jadi dia belum mempan dapat jatah waktu perbaikan. Tapi dia sudah masuk daftar, dan suatu hari, mungkin di episode lain, mungkin diam-diam, dia akan ketemu dengan yang mulia `EXPLAIN` juga hahaha.

Migrasi dengan paritas memang meninggalkan utang-utang kecil seperti ini. Yang penting bukan nol utang; yang penting utangnya tercatat dan tidak main sembunyi-sembunyian.

## Pelajaran

1. **Jangan panggil fungsi pada kolom di `WHERE`/`JOIN`.** Taruh fungsinya di sisi parameter, biar kolom tetap dalam bentuk yang dikenali _index_-nya.
2. **_Index_ terbaik pun bisa sia-sia oleh satu pembungkus kecil.** Desain _index_ dan desain _query_ adalah satu paket; salah satunya saja yang melenceng, keduanya gagal.
3. **Setelah menemukan satu bug pola, cari saudara-saudaranya.** Bug yang lahir dari satu kebiasaan menulis biasanya tidak lahir sendirian.
4. **Utang teknis yang dicatat itu wajar; yang disembunyikan itu berbahaya.** Saya mengakuinya di tulisan publik, sekarang kalian semua saksinya, jadi tidak mungkin dilupakan hahaha.

Episode berikutnya kita naik kelas dari satu _query_ ke bentuk kotanya: bagaimana _monolith_ puluhan ribu baris dirombak menjadi 14 modul _domain_, sambil pesawatnya tetap terbang. Sampai ketemu di sana.

Sekian. Salam.

[^1]: Potongan SQL disederhanakan untuk keperluan cerita, nama tabel dan kolom dipertahankan secukupnya, detail lain diubah.

[^2]: Angka baris tabel dibulatkan ke orde besaran; kapasitas dan skala persisnya tidak perlu untuk memahami pelajarannya.
