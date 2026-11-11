---
title: "Hijrah Backend (2): Anatomi Endpoint 15 Detik"
description: "Catatan saya membongkar endpoint yang terasa 15 detik, lengkap dengan teori-teori salah yang sempat saya bela mati-matian."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:02+07:00
lastmod: 2026-09-11T09:00:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - debugging
  - database
  - cerita
series: "Hijrah Backend"
---

Di [episode sebelumnya](/writing/2026/hijrah-backend-01/) saya sempat cerita soal _endpoint_ yang bisa makan 15 detik sekali panggil. Bagian yang paling saya ingat justru bukan teknisnya, tapi betapa yakinnya saya pada jawaban-jawaban yang ternyata salah. Ehem.

## Satu Klik, Lalu Menunggu

Satu klik pada _endpoint_ estimasi bahan bakar per grup kendaraan, lalu menunggu sekitar 17 detik. Kalau _dashboard_-nya dibuka tiap hari, menunggu segitu lama rasanya seperti balik ke zaman _dial-up_.

Dan selama berminggu-minggu penyelidikan, ada _soundtrack_-nya: _"Faiq, kok error?" "Faiq, kok lemot?"_ Tenang, Mas, lagi saya telusuri hehe.

_Endpoint_ ini menjalankan satu _query_ ber-CTE[^1] ke tabel ringkasan perangkat yang berisi puluhan juta baris. Saya langsung punya tersangka.

## Tersangka Pertama, Query

_Kalau lambat, ya query-nya dong._ Naluri semua _developer_, termasuk saya.

Jadi saya buka _EXPLAIN_. Dan _EXPLAIN_-nya menjawab: _query_-mu sehat-sehat saja, Mas. Rencana eksekusinya memakai _index_ dengan benar, langkah termahalnya pun masih di ordo puluhan milidetik. Untuk memastikan, _query_ yang sama saya jalankan langsung ke _database_ lewat CLI: 78 milidetik, _termasuk_ _round-trip_ jarak ribuan kilometer.

Tujuh puluh delapan milidetik. _Endpoint_-nya: 17.000 milidetik. Tersangka pertama gugur. _Ups_ hehe.

## Tersangka Kedua, Jarak

Bagian ini agak memalukan, tapi penting: aplikasi yang saya terima berjalan di _region cloud_ Eropa, sementara _database_ utamanya berada di Indonesia. Jaraknya ribuan kilometer; setiap _query_ MySQL membayar tol sekitar 190 milidetik satu arah. _User_ dan _database_ sama-sama di Indonesia, tetapi datanya harus memutar lewat Eropa.

Dengan kondisi seperti itu, teori kedua terdengar sangat masuk akal: _pool_ koneksi yang kecil bikin _request_ ngantri tiket _round-trip_ mahal. Saya besarkan _pool_-nya, tambah _timeout_, rapikan _idle connection_. _Deploy_ dengan harapan.

Hasilnya: 16,57 detik menjadi 15,64 detik. Saya curiga penurunan itu cuma _noise_. Perubahan _pool_ belum menjelaskan masalahnya.

## Tersangka Ketiga, Koneksi Tua

Masih di jalur yang sama, muncul teori ketiga: _server_ database membunuh koneksi _idle_ di menit kesepuluh, sementara aplikasi mengira koneksinya berumur 30 menit. Ketimpangan umur = koneksi _zombie_ = gagal di tengah jalan.

Teori ini tidak sepenuhnya salah, ketimpangannya nyata, dan perbaikannya memang patut dilakukan. Tapi juga tidak menjawab misteri utama: angkanya tetap di atas 15 detik. Tiga kali menuduh, tiga kali meleset. Sudah waktunya berhenti berteori dan mulai mendengarkan.

## Lalu Saya Baca Log-nya

Malam itu saya buka log aplikasi:

```text
GetGasEstimationByGroups query failed: invalid connection
```

Bukan 200 yang lambat. **500 yang gagal.** _Endpoint_-nya tidak pelit waktu, dia _error_, lalu _database driver_ mencoba ulang otomatis, tiap percobaan membayar biaya sambungan ulang di jalur transbenua, gagal lagi, dan begitu terus sampai menyerah. _Frontend_ ikut mencoba ulang. _User_ melihat semuanya sebagai... "lambat".

Setelah itu, dua petunjuk yang sebelumnya saya lewatkan jadi jelas:

1. _Query_ ber-CTE selalu gagal, _query_ sederhana di _pool_ yang sama selalu sukses.
2. _Query_ gas yang sama, lewat CLI, sukses mulus 0,7 detik.

Apa bedanya aplikasi dengan CLI? **Protokol.** Aplikasi saya waktu itu pakai _prepared statement_ (protokol biner MySQL, tiga _round-trip_ per _query_), sedangkan CLI pakai protokol teks (satu _round-trip_). Dan pada jalur biner itulah _server_ me-_reset_ koneksi di tengah eksekusi. Jalurnya pun bukan internet telanjang: koneksi ke _server_ _database_ di Indonesia melewati _tunnel_ VPN, dan di lorong itulah _query_ CTE ber-protokol biner berulang kali terbunuh di tengah jalan, sementara _query_ teks yang ramping lolos tanpa lecet.

## Satu Baris Konfigurasi

Perbaikannya akhirnya cuma satu baris konfigurasi di DSN:

```go
InterpolateParams: true,
```

Artinya: kirim _query_ lewat protokol teks, parameter di-_interpolate_ di sisi _driver_ (dengan _escaping_ yang benar, jadi aman terhadap _SQL injection_ asalkan tetap pakai _placeholder_, bukan _concat_ manual), persis seperti yang dilakukan CLI yang selalu sukses itu.

_Deploy_. Klik _dashboard_. Dan _invalid connection_ tidak pernah muncul lagi. _Alhamdulillah._ Yang namanya perjuangan berminggu-minggu, titiknya bisa semencit di satu baris hehe.

## Yang Terbukti, yang Masih Dugaan

Nah, saya mau pisahkan mana yang **terbukti** dan mana yang sampai sekarang masih **dugaan**.

**Terbukti**: pada jalur _prepared statement_ lewat _tunnel_ VPN ke _database_, _query_ CTE berulang kali terbunuh di tengah jalan; jalur protokol teks menghindarinya; perbaikan satu baris itu menghentikan _error_ sepenuhnya di produksi.

**Masih dugaan sampai sekarang**: kenapa persisnya _tunnel_ itu menghukum jalur biner pada _query_ CTE yang kompleks (dan hanya mereka). Ada beberapa kandidat penjelasan, tapi saya belum punya bukti definitifnya, dan menurut saya itu boleh-boleh saja diakui di tulisan publik hahaha. _Debugging_ yang jujur tidak harus berakhir di kepastian total; cukup berakhir di masalah yang hilang.

Oh iya, dua "perbaikan salah" di tengah jalan (ukuran _pool_ dan umur koneksi) tetap saya pertahankan, keduanya kebetulan _best practice_ yang memang harusnya ada. Jadi bukan kerugian total lah ya, kan? hehe~

## Yang Saya Bawa Pulang

1. **Ukur dulu sebelum menuduh.** Satu _EXPLAIN_ menyelamatkan _query_ yang hampir saya _rewrite_, padahal dia tidak bersalah hehe.
2. **Baca log-nya.** Jawabannya sudah ada di sana berminggu-minggu, sementara saya sibuk menyalahkan _query_, jarak, dan umur koneksi.
3. **Bandingkan yang gagal dan yang berhasil.** Begitu saya lihat _query_ CTE selalu gagal sementara yang sederhana lolos, petunjuknya mulai kelihatan.
4. **"Lambat" kadang artinya gagal berkali-kali.** Kalau _latency_-nya aneh, saya sekarang lebih curiga ada _retry_ yang menumpuk.

Sampai tulisan ini dibuat, _endpoint_-endpoint ringan di sistem itu masih punya _floor_ sekitar 2-3 detik karena arsitektur transbenua yang sama. Penyebab latensi sisanya masih menjadi cerita tersendiri.

[^1]: CTE (_Common Table Expression_), cara menulis _query_ bertingkat dengan sub-hasil yang diberi nama, diawali kata `WITH`. Enak dibaca, kadang bikin _database_ mikir keras.

[^2]: Detail _infrastruktur_ (nama _provider_, lokasi persis, angka kapasitas) sengaja dibulatkan atau tidak disebut, seri ini soal pelajarannya, bukan alamatnya.
