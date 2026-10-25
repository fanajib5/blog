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

Sistem Go hasil migrasi saya membawa satu penyakit warisan. Semua repositori tersimpan di dua folder raksasa bernama `repository` dan `usecase`, bercampur dari _alert_ dan _billing_ sampai _geofence_ dan _fuel_. Secara teknis tidak ada yang salah. Namun, rasanya seperti kota besar tanpa kecamatan: untuk mencari satu rumah, saya harus hafal seluruh kota.

Episode ini tentang merapikan kota itu menjadi 14 modul _domain_, sementara _endpoint_-nya tetap melayani produksi. Sistem yang dipakai puluhan ribu orang tidak punya tombol jeda.

## Kenapa Bukan _Microservices_

Pertanyaan pertama yang biasanya muncul: kalau mau memisahkan domain, kenapa tidak langsung _microservices_?

Jawabannya: tim kami kecil, dan _microservices_ bukan sekadar struktur arsitektur, melainkan keputusan infrastruktur. Tiap layanan berarti satu _deployment_ baru, satu antrean monitoring baru, satu set masalah jaringan baru, plus komunikasi antar-layanan yang dulu gratis jadi mahal. Untuk ukuran tim kami, menukar _folder_ yang rapi dengan enam _server_ tambahan seperti membeli rumah untuk menyimpan kamar yang tidak terpakai.

Yang saya butuhkan bukan pemisahan _proses_, tapi pemisahan _tanggung jawab_. Itu namanya: **_modular monolith_**, satu _binary_, satu _deployment_, tapi di dalamnya tiap domain punya rumah dengan dinding.

## Modul Itu Rumah dengan Satu Pintu

Konvensi modul di proyek ini sederhana:[^2] satu folder domain (misalnya `geofence`), di dalamnya repo dan _usecase_-nya; satu folder `api` yang jadi satu-satunya pintu keluar berisi interface; dan dinding yang dijaga **_compiler_**, bukan niat baik.

Dinding _compile-time_ itu kuncinya. Aturan modul yang hanya tertulis di README mudah dilanggar saat sprint sibuk. Namun, jika repo internal modul tidak bisa diimpor dari luar folder-nya, _build_ langsung merah. Pelanggaran arsitektur jadi sesuatu yang tidak bisa di-_commit_, bukan sekadar sesuatu yang harus diingat.

## Sensus Dulu, Pindah Kemudian

Bagian yang paling sering dilewatkan orang saat _refactoring_: menghitung dulu siapa memakai apa, sebelum memindahkan apa pun.

Untuk modul terbesar, _device_, saya membuat dokumen sensus sebelum menyentuh satu baris kode. Hasilnya mengejutkan sendiri: 51 file di luar modul mengonsumsi repo-nya, repo keluarga _device_ menawarkan 321 _method_ _exported_... dan yang benar-benar dipanggil dari luar cuma **100**.[^1] Lebih dari dua pertiga stoknya tidak pernah diminta. Bahkan satu repositori "dewa" berisi 122 _method_, yang terpakai 49.

Sensus itu juga punya jebakan. Saya menghitung konsumen lewat pencarian nama, tetapi akhiran "-device" ternyata muncul di banyak tempat: repo _shared-link-device_ dan _user-group-device_ bukan bagian keluarga _device_. Satu repo lain punya angka di namanya, sehingga pola pencarian huruf-saja melewatkannya. Pelajarannya: **sensus yang tidak curiga pada dirinya sendiri akan menghitung dunia yang salah**.

## Pindahan yang _Byte-Identik_

Di sini prinsip dari [episode keempat](/writing/2026/hijrah-backend-04/) kembali berlaku, ternyata juga untuk rumah saya sendiri: **mempindahkan bukan momen memperbaiki.**

Aturan kerjanya: file repo dipindah ke modul tanpa mengubah satu byte pun, Git sampai mengakuinya sebagai pindahan 100% identik. Yang diubah hanya peta pintunya: interface di folder `api`, _adapter_ yang meneruskannya, dan _import path_ para konsumen. Kalau _diff_ menunjukkan apa pun selain pindahan dan penggantian nama, itu tanda ada yang selingkuh dari rencana.

Kenapa aturannya seketat itu? _Review_ pindahan _byte-identik_ lebih murah: yang dicek bukan "apakah logikanya benar", melainkan "apakah benar tidak ada yang berubah". Tiga puluh ribu baris bisa berpindah rumah dengan pertanyaan _review_ yang dijawab dalam hitungan menit. Perbaikan kecil yang menggoda di tengah jalan, seperti "sekalian ganti nama variabel ini yuk", ditunda. Satu PR, satu maksud.

## Ragam Modul Itu Wajar

Tidak semua modul dirapikan dengan resep sama. Modul _geofence_ saya _seal_ paling ketat: _wrapper_ delegasi era lama dihapus, puluhan _method_ mati dibersihkan, dan kode penanda _error_-nya diekspor lewat pintu `api` supaya konsumen bisa memeriksanya tanpa mengintip ke dalam rumah. Modul _sharing_ punya catatan tersendiri: inilah modul pertama yang perlu membaca _config_ aplikasi di pintunya.

Sedangkan modul _device_, yang terbesar, saya sengaja biarkan pintunya terbuka untuk sementara: repos-nya masih bisa diimpor langsung, dengan rencana yang tertulis jelas untuk _seal_ menyusul. Ini pengecualian sadar, seperti cerita parity di [episode keempat](/writing/2026/hijrah-backend-04/): dogma itu untuk buku pelajaran; proyek hidup butuh pengecualian yang tercatat.

## _Cache_ Tanpa _Redis_

Satu keputusan infrastruktur yang sering ditanyakan: _cache_-nya in-_process_, [ristretto](https://github.com/dgraph-io/ristretto), bukan _Redis_. Kantor memang tidak menjalankan _Redis_, dan tidak ada yang ingin menambah _service_ baru hanya untuk _cache_. Ini juga sesuai filosofi _deployment_ saya: satu _binary_, geser, jalan. _Cache_ yang ikut mati bersama prosesnya bukan masalah; ia bukan sumber kebenaran, hanya mempercepat. Kalau skala suatu hari menuntut _cache_ bersama antar-_instance_, keputusan itu bisa ditinjau lagi. Yang penting, alasannya masih relevan dan bukan sekadar warisan yang tidak berani disentuh.

## Utang yang Tersisa

Seperti di [episode kelima](/writing/2026/hijrah-backend-05/), utangnya saya akui di sini juga: beberapa repo di dalam modul masih membaca tabel domain lain lewat SQL langsung, jejak era pra-modul yang belum sepenuhnya diganti dengan akses lewat pintu `api`. Dua modul lain belum ter-_seal_ sama sekali. Semuanya tercatat dan menunggu giliran. Kota tidak selesai direnovasi dalam satu malam.

## Pelajaran

1. **Sensus sebelum pindah.** Angka konsumen dan _method_ yang benar-benar dipakai itu yang menentukan bentuk pintu modul, bukan tebakan, bukan selera.
2. **Dinding yang dijaga _compiler_ lebih kuat daripada kesepakatan verbal.** Aturan arsitektur yang tidak bisa dilanggar tanpa _build_ merah adalah satu-satunya aturan yang bertahan di sprint sibuk.
3. **Pindahan _byte-identik_ membuat _review_ murah.** Pisahkan "memindahkan" dari "memperbaiki", campurkannya, dan keduanya sama-sama jadi susah dicek.
4. **Pengecualian antar modul itu wajar, asal sadar dan tercatat.** Seragam sempurna itu indah di diagram; proyek hidup butuh pintu yang kebijakannya jelas.

Episode berikutnya kita keluar dari _dashboard_ dan masuk ke jalan raya: bagaimana paket TCP dari _tracker_ GPS berubah menjadi baris data di _database time-series_.

Sekian. Salam.

[^1]: Angka-angka sensus adalah kondisi saat dokumen itu dibuat, dan memang sudah berubah sejaknya. Itu wajar; sensus yang baik selalu punya tanggal.

[^2]: Nama modul dan struktur folder dipertahankan secukupnya untuk bercerita; detail internal diubah atau disederhanakan.
