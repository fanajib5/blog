---
title: "Hijrah Backend (2): Anatomi Endpoint 15 Detik"
description: "Ep 2 seri Hijrah Backend: forensik sebuah endpoint yang makan 15 detik, empat hipotesis salah, satu baris konfigurasi yang benar, dan pelajaran membaca log sebelum ber teori."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T015:30:00+07:00
lastmod: 2026-09-10T23:00:00+07:00
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

Di [episode sebelumnya](/writing/2026/hijrah-backend-01/) saya menyinggung soal satu _endpoint_ yang bisa makan 15 detik sekali panggil. Episode ini cerita lengkapnya, karena perjalanan mencari penyebabnya adalah salah satu _debugging_ paling mengedukasi yang pernah saya alami. Bukan karena rumit, tapi karena saya salah berulang kali dengan penuh percaya diri hehe~

## Sebuah Klik, ±17 Detik

Korbannya: _endpoint_ estimasi bahan bakar per grup kendaraan. Satu klik di _dashboard_, lalu menunggu. ±17 detik lebih sedikit, setiap kali. Untuk ukuran _dashboard_ yang diakses tiap hari, itu terasa seperti _loading_ jaman _dial-up_ hahaha.

Dan selama berminggu-minggu penyelidikan, ada _soundtrack_-nya: _"Faiq, kok error?" "Faiq, kok lemot?"_ Tenang, Mas, lagi saya telusuri hehe.

Sebelum lanjut: _endpoint_ ini menjalankan satu _query_ ber-CTE[^1] ke tabel ringkasan perangkat yang isinya puluhan juta baris. Dari sini, teori pertama langsung muncul dengan wajah paling percaya diri.

## Tersangka Pertama: Query-nya Tentu Saja

_Kalau lambat, ya query-nya dong._ Naluri semua _developer_, termasuk saya.

Jadi saya buka _EXPLAIN_. Dan _EXPLAIN_-nya menjawab: _query_-mu sehat-sehat saja, Mas. Rencana eksekusinya memakai _index_ dengan benar, langkah termahalnya pun masih di ordo puluhan milidetik. Untuk memastikan, _query_ yang sama saya jalankan langsung ke _database_ lewat CLI: 78 milidetik, _termasuk_ _round-trip_ jarak ribuan kilometer.

Tujuh puluh delapan milidetik. _Endpoint_-nya: 17.000 milidetik. Tersangka pertama gugur. _Ups_ hehe.

## Tersangka Kedua: Geografi

Nah, ini bagian yang memalukan sekaligus penting: arsitektur yang saya terima waktu itu menempatkan aplikasi di _region cloud_ Eropa, sementara _database_ utamanya di Indonesia. Jaraknya ribuan kilometer, dan setiap _query_ MySQL membayar tol sekitar 190 milidetik satu arah. _User_ di Indonesia, _database_ di Indonesia, tapi datanya muter dulu ke Eropa. _Best practice_ mana yang bilang begitu? hahaha.

Dengan kondisi seperti itu, teori kedua terdengar sangat masuk akal: _pool_ koneksi yang kecil bikin _request_ ngantri tiket _round-trip_ mahal. Saya besarkan _pool_-nya, tambah _timeout_, rapikan _idle connection_. _Deploy_ dengan harapan.

Hasilnya: 16,57 detik menjadi 15,64 detik. Itu pun saya curigai cuma _noise_. Tersangka kedua... tidak tertangkap. _Hadeh._

## Tersangka Ketiga: Umur Koneksi

Masih di jalur yang sama, muncul teori ketiga: _server_ database membunuh koneksi _idle_ di menit kesepuluh, sementara aplikasi mengira koneksinya berumur 30 menit. Ketimpangan umur = koneksi _zombie_ = gagal di tengah jalan.

Teori ini tidak sepenuhnya salah, ketimpangannya nyata, dan perbaikannya memang patut dilakukan. Tapi juga tidak menjawab misteri utama: angkanya tetap di atas 15 detik. Tiga kali menuduh, tiga kali meleset. Sudah waktunya berhenti ber teori dan mulai mendengarkan.

## Log Bicara, Semua Teori Bubar

Malam itu saya buka log aplikasi. Dan di sana, jawabannya sudah lama duduk manis:

```text
GetGasEstimationByGroups query failed: invalid connection
```

Bukan 200 yang lambat. **500 yang gagal.** _Endpoint_-nya tidak pelit waktu, dia _error_, lalu _database driver_ mencoba ulang otomatis, tiap percobaan membayar biaya sambungan ulang di jalur transbenua, gagal lagi, dan begitu terus sampai menyerah. _Frontend_ ikut mencoba ulang. _User_ melihat semuanya sebagai... "lambat".

Begitu sudut pandangnya berubah, petunjuk yang tadinya menganga jadi terbaca:

1. _Query_ ber-CTE selalu gagal, _query_ sederhana di _pool_ yang sama selalu sukses.
2. _Query_ gas yang sama, lewat CLI, sukses mulus 0,7 detik.

Apa bedanya aplikasi dengan CLI? **Protokol.** Aplikasi saya waktu itu pakai _prepared statement_ (protokol biner MySQL, tiga _round-trip_ per _query_), sedangkan CLI pakai protokol teks (satu _round-trip_). Dan pada jalur biner itulah _server_ me-_reset_ koneksi di tengah eksekusi. Jalurnya pun bukan internet telanjang: koneksi ke _server_ _database_ di Indonesia melewati _tunnel_ VPN, dan di lorong itulah _query_ CTE ber-protokol biner berulang kali terbunuh di tengah jalan, sementara _query_ teks yang ramping lolos tanpa lecet.

## Satu Baris yang Mengakhiri Semua

Perbaikannya akhirnya cuma satu baris konfigurasi di DSN:

```go
InterpolateParams: true,
```

Artinya: kirim _query_ lewat protokol teks, parameter di-_interpolate_ di sisi _driver_ (dengan _escaping_ yang benar, jadi aman terhadap _SQL injection_ asalkan tetap pakai _placeholder_, bukan _concat_ manual), persis seperti yang dilakukan CLI yang selalu sukses itu.

_Deploy_. Klik _dashboard_. Dan _invalid connection_ tidak pernah muncul lagi. _Alhamdulillah._ Yang namanya perjuangan berminggu-minggu, titiknya bisa semencit di satu baris hehe.

## Yang Terbukti, yang Masih Dugaan

Sekarang bagian yang jarang ditulis orang: memisahkan mana yang **terbukti** dan mana yang masih **dugaan**.

**Terbukti**: pada jalur _prepared statement_ lewat _tunnel_ VPN ke _database_, _query_ CTE berulang kali terbunuh di tengah jalan; jalur protokol teks menghindarinya; perbaikan satu baris itu menghentikan _error_ sepenuhnya di produksi.

**Masih dugaan sampai sekarang**: kenapa persisnya _tunnel_ itu menghukum jalur biner pada _query_ CTE yang kompleks (dan hanya mereka). Ada beberapa kandidat penjelasan, tapi saya belum punya bukti definitifnya, dan menurut saya itu boleh-boleh saja diakui di tulisan publik hahaha. _Debugging_ yang jujur tidak harus berakhir di kepastian total; cukup berakhir di masalah yang hilang.

Oh iya, dua "perbaikan salah" di tengah jalan (ukuran _pool_ dan umur koneksi) tetap saya pertahankan, keduanya kebetulan _best practice_ yang memang harusnya ada. Jadi bukan kerugian total lah ya, kan? hehe~

## Pelajaran

1. **Ukur dulu, baru menuduh.** Satu _EXPLAIN_ menggugurkan teori yang hampir membuat saya _rewrite_ _query_ yang ternyata tidak bersalah.
2. **Baca log sebelum bikin teori.** Jawabannya sudah duduk manis di log berminggu-minggu, sementara saya sibuk menghakimi _query_, geografi, dan umur koneksi.
3. **Asimetri adalah petunjuk emas.** Mana yang selalu gagal vs mana yang selalu sukses, begitu digarisbawahi, penyebabnya ketahuan sendiri.
4. **"Lambat" kadang sesungguhnya "gagal berkali-kali".** _Latency_ yang aneh selalu layak dicurigai sebagai _retry_ yang menumpuk.

Satu catatan penutup: sampai episode ini ditulis, _endpoint_-endpoint ringan di sistem itu masih punya _floor_ sekitar 2-3 detik karena arsitektur transbenua yang sama. Itu cerita arsitektur yang saya simpan untuk episode penutup. _Stay tuned_ lagi deh hehe.

Episode berikutnya kita pindah panggung: dari _database_ ke paket-paket biner yang dikirim _tracker_ GPS, dan bagaimana saya mem-_port_ puluhan _parser_ protokol tanpa merusak data armada yang sedang jalan. Sampai ketemu di sana.

Sekian. Salam.

[^1]: CTE (_Common Table Expression_), cara menulis _query_ bertingkat dengan sub-hasil yang diberi nama, diawali kata `WITH`. Enak dibaca, kadang bikin _database_ mikir keras.

[^2]: Detail _infrastruktur_ (nama _provider_, lokasi persis, angka kapasitas) sengaja dibulatkan atau tidak disebut, seri ini soal pelajarannya, bukan alamatnya.
