---
title: "Hijrah Backend (6): Merapikan _Monolith_, Pesawatnya Tetap Terbang"
description: "Ep 6 seri Hijrah Backend: merombak _monolith_ puluhan ribu baris menjadi 14 modul _domain_, sensus sebelum pindah, pindahan yang byte-identik, dan kenapa bukan microservices."
author: "Faiq Najib Al-Aziz"
date: 2026-09-11T01:30:00+07:00
lastmod: 2026-09-11T00:15:00+07:00
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

Sistem Go hasil migrasi saya lahir dengan satu penyakit warisan. Semua repositori tidur dalam dua folder raksasa bernama `repository` dan `usecase`, campuran menjadi satu dari _alert_, _billing_, _geofence_, sampai _fuel_. Secara teknis tidak ada yang salah; secara mental, itu kota besar tanpa kecamatan. Mau cari rumah mana pun, kamu harus hafal seluruh kotanya.

Episode ini cerita merapikan kota itu, menjadi 14 modul _domain_, sambil _endpoint_-endpoint-nya terus melayani produksi. Karena, Anda tahulah, tidak ada tombol jeda untuk sistem yang dipakai puluhan ribu orang hahaha.

## Kenapa Bukan _Microservices_

Pertanyaan pertama yang biasanya muncul: kalau mau memisahkan domain, kenapa tidak langsung _microservices_?

Jawabannya: tim kami kecil, dan _microservices_ itu bukan struktur arsitektur, dia keputusan infrastruktur. Tiap layanan berarti satu _deployment_ baru, satu antrean monitoring baru, satu set masalah jaringan baru, plus komunikasi antar-layanan yang dulu gratis jadi mahal. Untuk ukuran tim kami, menukar _folder_ yang rapi dengan enam _server_ tambahan itu seperti membeli rumah untuk menyimpan kamar yang tidak terpakai.

_Yang_ saya butuhkan bukan pemisahan _proses_, tapi pemisahan _tanggung jawab_. Itu nama _nya_: **_modular monolith_**, satu _binary_, satu _deployment_, tapi di dalamnya tiap domain punya rumah dengan dinding.

## Modul Itu Rumah dengan Satu Pintu

Konvensi modul di proyek ini sederhana:[^2] satu folder domain (misalnya `geofence`), di dalamnya repo dan _usecase_-nya; satu folder `api` yang jadi satu-satunya pintu keluar berisi interface; dan dinding yang dijaga **_compiler_**, bukan niat baik.

Dinding _compile-time_ itu kuncinya. Kalau aturan modul cuma tertulis di README, aturan itu akan dilanggar di sprint sibuk, dijamin, pernah semua mengalaminya. Tapi kalau repo internal modul tidak bisa diimpor dari luar folder-nya, _build_ langsung merah. Pelanggaran arsitektur jadi sesuatu yang tidak bisa di-_commit_, bukan sesuatu yang harus diingat-ingat hehe.

## Sensus Dulu, Pindah Kemudian

Bagian yang paling sering dilewatkan orang saat _refactoring_: menghitung dulu siapa memakai apa, sebelum memindahkan apa pun.

Untuk modul terbesar, _device_, saya membuat dokumen sensus sebelum menyentuh satu baris kode. Hasilnya mengejutkan sendiri: 51 file di luar modul mengonsumsi repo-nya, repo keluarga _device_ menawarkan 321 _method_ _exported_... dan yang benar-benar dipanggil dari luar cuma **100**.[^1] Lebih dari dua pertiga stoknya tidak pernah diminta. Bahkan satu repositori "dewa" berisi 122 _method_, yang terpakai 49.

Sensusnya pun punya jebakan yang bikin saya tertawa saat mengalaminya. Menghitung konsumen pakai pencarian nama, dan ternyata akhiran "-device" menyebar di mana-mana: ada repo _shared-link-device_, ada _user-group-device_, keduanya bukan bagian keluarga _device_. Ada pula satu repo yang namanya mengandung angka, dan pola pencarian huruf-saja saya melewatinya tanpa sadar. Kesimpulannya rendah hati: **sensu s yang tidak curiga pada dirinya sendiri akan menghitung dunia yang salah** hehe~

## Pindahan yang _Byte-Identik_

Di sini prinsip dari [episode keempat](/writing/2026/hijrah-backend-04/) kembali berlaku, ternyata juga untuk rumah saya sendiri: **mempindahkan bukan momen memperbaiki.**

Aturan kerjanya: file repo dipindah ke modul tanpa mengubah satu byte pun, Git sampai mengakuinya sebagai pindahan 100% identik. Yang diubah hanya peta pintunya: interface di folder `api`, _adapter_ yang meneruskannya, dan _import path_ para konsumen. Kalau _diff_ menunjukkan apa pun selain pindahan dan penggantian nama, itu tanda ada yang selingkuh dari rencana.

Kenapa seketat itu? Karena _review_ pindahan _byte-identik_ itu murah: yang dicek bukan "apakah logikanya benar" tapi "apakah benar tidak ada yang berubah". Tiga puluh ribu baris berpindah rumah dengan pertanyaan review yang bisa dijawab dalam hitungan menit. Perbaikan kecil yang menggoda di tengah jalan, biasanya berupa "sekalian ganti nama variabel ini yuk", ditunda semua. Satu PR, satu maksud.

## Ragam Modul Itu Wajar

Tidak semua modul dirapikan dengan resep sama. Modul _geofence_ saya _seal_ paling ketat: _wrapper_ delegasi era lama dihapus, puluhan _method_ mati dibersihkan, dan kode penanda _error_-nya diekspor lewat pintu `api` supaya konsumen bisa memeriksanya tanpa bobong ke dalam rumah. Modul _sharing_ malah mencatat sejarah kecil: _modul_ pertama yang butuh membaca _config_ aplikasi di pintunya.

Sedangkan modul _device_, yang terbesar, saya sengaja biarkan pintunya terbuka untuk sementara: repos-nya masih bisa diimpor langsung, dengan rencana yang tertulis jelas untuk _seal_ menyusul. Ini pengecualian sadar, seperti cerita parity di [episode keempat](/writing/2026/hijrah-backend-04/): dogma itu untuk buku pelajaran; proyek hidup butuh pengecualian yang tercatat.

## _Cache_ Tanpa _Redis_

Satu keputusan infrastruktur yang sering ditanyakan: _cache_-nya in-_process_, [ristretto](https://github.com/dgraph-io/ristretto), bukan _Redis_. Sebagian karena kantor memang tidak menjalankan _Redis_ dan tidak ada yang ingin menambah _service_ baru hanya untuk _cache_; sebagian karena filosofi _deployment_ saya: satu _binary_, geser, jalan. _Cache_ ikut mati bersama prosesnya pun tidak masalah, dia bukan sumber kebenaran, cuma percepat. Kalau suatu hari skala menuntut _cache_ bersama antar-_instance_, keputusan itu dibuka kembali dengan senang hati. Yang penting keputusannya punya alasan yang masih hidup, bukan warisan yang tidak siapa pun berani sentuh hahaha.

## Utang yang Tersisa

Supaya setia pada tradisi [episode kelima](/writing/2026/hijrah-backend-05/), utangnya saya akui di sini juga: beberapa repos di dalam modul masih membaca tabel domain lain lewat SQL langsung, jejak era pra-modul yang belum sepenuhnya diubah jadi bacaan lewat pintu `api`. Dua modul lain belum ter-_seal_ sama sekali. Semua tercatat, semua punya giliran. Kota tidak selesai direntap dalam satu malam hahaha.

## Pelajaran

1. **Sensus sebelum pindah.** Angka konsumen dan _method_ yang benar-benar dipakai itu yang menentukan bentuk pintu modul, bukan tebakan, bukan selera.
2. **Dinding yang dijaga _compiler_ lebih kuat daripada kesepakatan verbal.** Aturan arsitektur yang tidak bisa dilanggar tanpa _build_ merah adalah satu-satunya aturan yang bertahan di sprint sibuk.
3. **Pindahan _byte-identik_ membuat _review_ murah.** Pisahkan "memindahkan" dari "memperbaiki", campurkannya, dan keduanya sama-sama jadi susah dicek.
4. **Pengecualian antar modul itu wajar, asal sadar dan tercatat.** Seragam sempurna itu indah di diagram; proyek hidup butuh pintu yang kebijakannya jelas.

Episode berikutnya kita keluar sebentar dari _dashboard_ dan masuk ke jalan raya: bagaimana paket-paket TCP dari _tracker_ GPS berubah menjadi baris data yang rapi di _database_ _time-series_. Sampai ketemu di sana.

Sekian. Salam.

[^1]: Angka-angka sensus adalah kondisi saat dokumen itu dibuat, dan memang sudah berubah sejaknya. Itu wajar; sensus yang baik selalu punya tanggal.

[^2]: Nama modul dan struktur folder dipertahankan secukupnya untuk bercerita; detail internal diubah atau disederhanakan.
