---
title: "Hijrah Backend (6): Merapikan _Monolith_, Pesawatnya Tetap Terbang"
description: "Ep 6 seri Hijrah Backend: merombak _monolith_ puluhan ribu baris menjadi 14 modul _domain_, sensus sebelum pindah, pindahan yang byte-identik, dan kenapa bukan microservices."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:06+07:00
lastmod: 2026-09-11T09:00:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - arsitektur
  - refactoring
  - cerita
series: "Hijrah Backend"
---

Setelah migrasi ke Go, ada satu warisan yang cukup bikin saya geleng-geleng: semua repository numpuk di dua folder besar, `repository` dan `usecase`. Isinya campur aduk, dari _alert_ dan _billing_ sampai _geofence_ dan _fuel_. Secara teknis sistemnya jalan. Tapi kalau mau cari satu rumah di kota sebesar itu, saya harus hafal semua jalan.

Di episode ini saya merapikan strukturnya menjadi 14 modul _domain_, sambil menjaga _endpoint_ tetap melayani production. Penggunanya puluhan ribu, jadi tidak ada tombol jeda yang bisa saya pencet sebentar.

## Kenapa Bukan _Microservices_

Mungkin ada yang bertanya: kalau domainnya mau dipisah, kenapa tidak langsung pakai _microservices_?

Tim kami kecil. _Microservices_ juga bukan cuma soal folder atau diagram, tapi menambah urusan infrastruktur. Tiap layanan perlu di-deploy dan dipantau, lalu komunikasi antar-layanan yang tadinya tinggal panggil fungsi jadi urusan jaringan. Buat tim kami, enam _server_ tambahan untuk merapikan folder rasanya seperti beli rumah baru cuma untuk menyimpan kamar kosong.

Saya tidak butuh proses yang terpisah. Yang saya butuhkan batas tanggung jawab yang jelas. Makanya kami memilih **_modular monolith_**: satu _binary_ dan satu _deployment_, tapi domain di dalamnya punya batas masing-masing.

## Modul Itu Rumah dengan Satu Pintu

Aturan modulnya sederhana:[^2] satu folder untuk satu domain, misalnya `geofence`, lalu repository dan _usecase_ tinggal di sana. Folder `api` jadi pintu keluarnya, berisi interface yang boleh dipakai dari luar. Batasnya dijaga **_compiler_**, bukan sekadar janji di README.

Dinding _compile-time_ itu kuncinya. Aturan modul yang hanya tertulis di README mudah dilanggar saat sprint sibuk. Namun, jika repo internal modul tidak bisa diimpor dari luar folder-nya, _build_ langsung merah. Pelanggaran arsitektur jadi sesuatu yang tidak bisa di-_commit_, bukan sekadar sesuatu yang harus diingat.

## Sensus Dulu, Pindah Kemudian

Sebelum _refactoring_, saya mulai dengan menghitung siapa memakai apa. Ini bagian yang gampang dilewati kalau sudah tidak sabar ingin memindahkan folder.

Untuk modul terbesar, _device_, saya membuat dokumen sensus sebelum menyentuh satu baris kode. Hasilnya mengejutkan sendiri: 51 file di luar modul mengonsumsi repo-nya, repo keluarga _device_ menawarkan 321 _method_ _exported_... dan yang benar-benar dipanggil dari luar cuma **100**.[^1] Lebih dari dua pertiga stoknya tidak pernah diminta. Bahkan satu repositori "dewa" berisi 122 _method_, yang terpakai 49.

Sensus itu juga punya jebakan. Saya menghitung konsumen lewat pencarian nama, tetapi akhiran "-device" ternyata muncul di banyak tempat: repo _shared-link-device_ dan _user-group-device_ bukan bagian keluarga _device_. Satu repo lain punya angka di namanya, sehingga pola pencarian huruf-saja melewatkannya. Saya jadi belajar untuk ikut memeriksa cara sensusnya dibuat. Kalau tidak, hasilnya bisa kelihatan meyakinkan padahal yang dihitung keliru.

## Pindahan yang _Byte-Identik_

Di sini saya pakai lagi prinsip dari [episode keempat](/writing/2026/hijrah-backend-04/), kali ini untuk folder sendiri: **pindahan bukan waktunya beres-beres sekalian.**

Aturan kerjanya: file repo dipindah ke modul tanpa mengubah satu byte pun, Git sampai mengakuinya sebagai pindahan 100% identik. Yang diubah hanya peta pintunya: interface di folder `api`, _adapter_ yang meneruskannya, dan _import path_ para konsumen. Kalau _diff_ menunjukkan apa pun selain pindahan dan penggantian nama, itu tanda ada yang selingkuh dari rencana.

Kenapa saya repot-repot menjaga pindahannya tetap identik? _Review_-nya jadi lebih ringan. Yang diperiksa bukan lagi apakah logika barunya benar, cukup memastikan memang tidak ada yang berubah. Puluhan ribu baris bisa pindah alamat tanpa harus dibaca ulang satu per satu. Godaan seperti "sekalian ganti nama variabel, ah" saya tahan dulu. Satu PR, satu urusan.

## Ragam Modul Itu Wajar

Tidak semua modul dirapikan dengan resep sama. Modul _geofence_ saya _seal_ paling ketat: _wrapper_ delegasi era lama dihapus, puluhan _method_ mati dibersihkan, dan kode penanda _error_-nya diekspor lewat pintu `api` supaya konsumen bisa memeriksanya tanpa mengintip ke dalam rumah. Modul _sharing_ punya catatan tersendiri: inilah modul pertama yang perlu membaca _config_ aplikasi di pintunya.

Sedangkan modul _device_, yang terbesar, saya sengaja biarkan pintunya terbuka untuk sementara: repos-nya masih bisa diimpor langsung, dengan rencana yang tertulis jelas untuk _seal_ menyusul. Ini pengecualian sadar, seperti cerita parity di [episode keempat](/writing/2026/hijrah-backend-04/): dogma itu untuk buku pelajaran; proyek hidup butuh pengecualian yang tercatat.

## _Cache_ Tanpa _Redis_

Soal _cache_, kami memakai cache in-_process_, [ristretto](https://github.com/dgraph-io/ristretto), bukan _Redis_. Kantor memang tidak menjalankan _Redis_, dan sepertinya tidak ada yang mau menambah _service_ hanya untuk cache. Ini pas dengan cara deploy kami: satu _binary_, geser, jalan. Cache yang ikut mati bersama prosesnya tidak masalah karena bukan sumber kebenaran, cuma akselerator. Kalau suatu hari beberapa _instance_ perlu berbagi cache, ya keputusan ini bisa ditinjau lagi.

## Utang yang Tersisa

Masih ada utang teknis yang belum selesai, seperti yang saya ceritakan di [episode kelima](/writing/2026/hijrah-backend-05/). Beberapa repo di dalam modul masih membaca tabel domain lain lewat SQL langsung, dan dua modul belum ter-_seal_. Saya sudah mencatat semuanya. Nanti dikerjakan satu per satu, kota ini tidak harus selesai direnovasi malam ini juga.

## Catatan Saya

1. **Sensus sebelum pindah.** Angka konsumen dan _method_ yang benar-benar dipakai itu yang menentukan bentuk pintu modul, bukan tebakan, bukan selera.
2. **Dinding yang dijaga _compiler_ lebih kuat daripada kesepakatan verbal.** Aturan arsitektur yang tidak bisa dilanggar tanpa _build_ merah adalah satu-satunya aturan yang bertahan di sprint sibuk.
3. **Pindahan _byte-identik_ membuat _review_ murah.** Pisahkan "memindahkan" dari "memperbaiki", campurkannya, dan keduanya sama-sama jadi susah dicek.
4. **Pengecualian antar modul itu wajar, asal sadar dan tercatat.** Seragam sempurna itu indah di diagram; proyek hidup butuh pintu yang kebijakannya jelas.

Di episode berikutnya, saya keluar dari _dashboard_ dan ikut paket TCP dari _tracker_ GPS sampai masuk menjadi baris di _database time-series_.

Sekian. Salam.

[^1]: Angka-angka sensus adalah kondisi saat dokumen itu dibuat, dan memang sudah berubah sejaknya. Itu wajar; sensus yang baik selalu punya tanggal.

[^2]: Nama modul dan struktur folder dipertahankan secukupnya untuk bercerita; detail internal diubah atau disederhanakan.
