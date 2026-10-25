---
title: "Hijrah Backend (7): Dari Paket TCP ke _Time-Series Database_"
description: "Ep 7 seri Hijrah Backend: bagaimana paket-paket TCP dari ribuan tracker GPS menjadi baris data rapi, kenapa ada antrean, producer yang dulu membuang segalanya, dan database yang mengerti waktu."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:07+07:00
lastmod: 2026-09-11T09:00:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - infrastruktur
  - rabbitmq
  - timescaledb
series: "Hijrah Backend"
---

Setiap detik, armada mengirim kabar. Puluhan ribu _tracker_ GPS mengirim paket TCP berisi posisi, status mesin, dan kekuatan sinyal. Sistem harus menerima semuanya sepanjang hari, tanpa kampanye "ayo hemat kirim data" hahaha.

Di [episode pertama](/writing/2026/hijrah-backend-01/) saya sempat bercerita bahwa sistem lama menerima paket dan menulis ke _database_ dalam layanan yang sama. Sistem baru memisahkan pekerjaan itu ke tiga tempat: _listener_ menerima dan menerjemahkan paket, antrean pesan menampungnya, lalu _consumer_ menulisnya ke _database_. Di episode ini saya ceritakan cara kerja tiap bagian, termasuk dua kesalahan yang saya buat hehe~

## Kenapa Ada Antrean di Tengah Jalan

Pertanyaan yang wajar: bukankah menambah satu _hop_ berarti menambah waktu?

Kecepatan menerima paket dan menulis ke _database_ memang berbeda. _Tracker_ tetap mengirim meski _database_ sedang sibuk. Jika penerimaan dan penulisan diikat, _database_ yang lambat akan memperlambat penerimaan juga. Paket yang gagal masuk hanya bisa berharap _device_-nya mengirim ulang.

Antrean memisahkan dua pekerjaan itu. _Listener_ menerima paket lalu menitipkannya di antrean; _consumer_ mengambil paket secepat _database_ sanggup menulis. _Buffer_ menyerap lonjakan pada siang hari. Namun, tiap komponen baru juga membawa cara gagal yang baru. Saya menemukannya dengan cara paling klasik: langsung di produksi hahaha.

## Ketika Broker Tidur: Producer yang Membuang Segalanya

Sistem lama tidak mengenal skenario antrean mati karena ia langsung melakukan _insert_. Kalau _database_-nya ngambek, _device_ bisa mencoba lagi nanti. Sistem baru saya punya masalah lain, dan jawaban pertama saya sekarang saya sesali: kalau koneksi ke _broker_ putus... **pesan dibuang**.

Diam-diam, efisien, dan mengerikan. Data posisi kendaraan pelanggan hilang tanpa suara hanya karena infrastruktur sedang bersin.

Perbaikannya berlapis. Pertama, jangan cepat menyerah: lakukan _retry_ bertingkat selama beberapa detik agar _broker_ yang hanya tersendat tidak membuat paket hilang. Kedua, kalau _broker_ mati lebih lama, jangan diam-diam membuang pesan. **Bunyikan alarmnya** lewat log _error_ yang jelas, bukan peringatan yang baru ditemukan tiga minggu kemudian. Ketiga, dan ini favorit saya, terapkan _backpressure_ yang jujur. Antrean saya menampung sekitar 8 ribu paket;[^2] saat penuh, `Send()` ikut menunggu. _Listener_ melambat, lalu _tracker_ di ujung sana mencoba lagi lewat TCP. Hasil akhirnya cukup filosofis: **data tidak hilang, hanya datang terlambat.** Membuat sumber menunggu bukan kegagalan; bagi saya, itulah mekanisme penyimpanan termurah hehe.

Komentar di kode producer saya sampai mendokumentasikan rantai ini dengan bangga: antrean penuh → `Send()` blok → _listener_ melambat → _device retry_. Rantai yang tadinya terlihat seperti _bug_ ternyata dirancang sebagai pengaman.

## Disiplin yang Salah Tempat

Di tahap kedua, _consumer_ menulis ribuan baris lokasi sekaligus (_bulk insert_). Saya pernah membuat kesalahan ironis di sini: jika satu baris gagal dalam _loop_ penulisan massal, fungsi langsung menjalankan `return err`. **Semua baris lokasi setelahnya ikut dibuang.**

Lucunya, sistem PHP lama justru menjalankan `continue` dalam kasus ini. Versi Go saya yang "lebih disiplin soal _error_" malah membuang lebih banyak data daripada versi yang saya kira santai. Perbaikan pertamanya cuma mengganti sembilan huruf: `return` menjadi `continue`. Saya tambahkan log agar baris yang gagal tetap terlihat, lalu menerapkan perbaikan yang sama ke semua _sender_ lain. Terakhir, _buffer_ konsumen saya naikkan sepuluh kali lipat dan jumlah _worker_ saya tambah. Keputusan itu tercatat di komentar _config_, bukan disimpan sebagai angka misterius hahaha.[^1]

Pelajarannya masih saya ingat: **memperhatikan _error_ itu bagus; menyerah total karena satu _error_ bukan disiplin, itu drama.** Di _pipeline_ data, pilihan antara `continue` dan `return` bisa menentukan nasib ribuan baris. Jadi, setiap kali pilihan itu muncul, pikirkan dampaknya.

## Database yang Mengerti Waktu

Tahap terakhir menyimpan data lokasi, yang selalu terkait waktu dan tempat. Untuk itu saya memakai PostgreSQL dengan ekstensi _time-series_. Tabel lokasi menjadi _hypertable_ yang dipartisi otomatis berdasarkan waktu.

Ada dua hal yang tidak saya dapatkan di sistem lama. Pertama, **kompresi**: _chunk_ lama dikompresi otomatis. Kini lebih dari seratus _chunk_ disimpan dengan cara itu, dan _index_ tertentu bisa dibangun langsung di atas data terkompresi tanpa membongkarnya. Kedua, **retensi otomatis**: kebijakan mingguan membuang data yang melewati batas usia. Dulu, data lama dibersihkan secara manual, sambil berdoa. Sekarang _database_-nya yang mengurus jadwal hehe~

Dengan keduanya, pertanyaan "kapan kita beres-beres data?" berubah dari ritual menjadi urusan konfigurasi.

## Pelajaran

1. **Setiap komponen baru punya cara gagal baru.** Menambah antrean berarti harus menjawab sejak awal: kalau broker mati, apa yang terjadi pada data?
2. **Gagal boleh, gagal diam-diam jangan.** Coba lagi, lalu tampilkan _error_ dengan jelas. _Warning_ yang menunggu dibaca bisa membuat masalah luput.
3. **`continue` vs `return` di _loop_ massal adalah keputusan hidup-mati data.** Satu kata mengubah "satu baris gagal" menjadi "seribu baris dibuang".
4. **_Backpressure_ itu fitur.** Saat kapasitas habis, membiarkan sumber menunggu adalah penyimpanan termurah yang ada.
5. **Retensi otomatis menggantikan ritual.** Apa yang dulu rutin manual dan penuh doa, kini cuma kebijakan yang jalan sendiri.

Berikutnya adalah episode terakhir seri ini. Saya akan bercerita tentang hampir dua tahun perjalanan, hal-hal yang akan saya ubah jika mengulang, dan bagian yang paling saya syukuri.

Versi tutorial dari dua babak episode ini, dari _TCP listener_ sampai _time-series database_, ada di [GPS Backend Part 2](/writing/2026/tcp-listener-gps-go/) dan [Part 4](/writing/2026/gps-data-postgresql-timescaledb/).

[^1]: Potongan kode dan angka konfigurasi disederhanakan, bentuk aslinya lebih panjang dan membawa detail internal.

[^2]: Kapasitas infrastruktur (ukuran antrean, jumlah _worker_, retensi) ditampilkan sebagai orde besaran; yang penting untuk cerita adalah arah dan alasannya.
