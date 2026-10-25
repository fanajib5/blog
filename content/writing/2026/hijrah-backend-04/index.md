---
title: "Hijrah Backend (4): Kode Lama sebagai _Executable Spec_"
description: "Ep 4 seri Hijrah Backend: soal parity-first, kenapa migrasi bukan waktunya memperbaiki, cerita 'perbaikan' yang akhirnya saya hapus sendiri, dan urusan dependensi di balik 22 baris go.mod."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:04+07:00
lastmod: 2026-09-11T09:00:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - migration
  - arsitektur
  - cerita
series: "Hijrah Backend"
---

Kalau disuruh merangkum satu aturan yang memegang kendali penuh atas migrasi ini, jawaban saya: **yang benar adalah yang lama.**[^2]

Menyebalkan, ya, saya tahu. Dipercaya memindahkan sistem ke bahasa baru, eh aturan nomor satunya malah: jangan ubah apa-apa. Bukan lebih cepat, bukan lebih bersih, bukan lebih bagus. **Identik.** Tapi setelah menjalaninya, saya paham kenapa aturan yang antiklimaks ini masuk akal.

## Kenapa Sistem Baru Harus Setia pada Sistem Lama

Bukan karena nostalgia. Alasannya pragmatis banget.

Pertama, **kepercayaan**. Puluhan ribu _user_ sudah bertahun-tahun percaya pada output sistem lama: angka yang sama, format yang sama, _quirk_ yang sama. Migrasi yang diam-diam mengubah hasil itu mengikis kepercayaan tanpa izin.

Kedua, **urusan _debugging_**. Kalau output sistem baru beda dari yang lama, tersangkanya cuma satu: proses _porting_-nya. Logikanya sudah teruji bertahun-tahun di produksi. Tapi kalau saya sekalian "memperbaiki" logika sambil pindah bahasa, satu _bug_ baru berarti dua tersangka: logika barunya, atau terjemahannya. [Episode kedua](/writing/2026/hijrah-backend-02/) sudah membuktikan betapa mahalnya _debugging_ dengan tersangka yang salah.

Ketiga, ini yang paling sering dilupakan: **dokumentasi bisa bohong, kode tidak**. Sistem yang saya terima nyaris tanpa dokumentasi. Semua pengetahuan ada di kepala satu orang, dan kalau orangnya sedang tidak ada, aplikasi eksisting itu seperti kota tua tanpa peta. Kode lama adalah satu-satunya spesifikasi yang bisa dijalankan, dan spesifikasi yang bisa dijalankan tidak bisa bohong. Dia selalu mengaku apa yang benar-benar dia lakukan, termasuk aibnya.

Jujur sih, tapi kadang bicaranya seperti teka-teki. Sistem lama hobi mengulang _query_ yang sama di dalam _loop_, padahal bisa digabung jadi satu. Ada juga sulap khas _framework_: tulis `$this->device()`, lalu muncul _method_ yang entah didefinisikan di mana dan sejak kapan. Yang bikin bengong, _method_ itu berhasil mengembalikan data. Di PHP itu dianggap wajar. Di Go, semua yang tadi tersulap harus saya tulis eksplisit satu per satu. Awalnya terasa kehilangan jalan pintas, tapi lama-lama saya jadi tahu isi dapurnya.

## Aturan Main: Mana yang Setia, Mana yang Bebas

Parity bukan berarti semuanya harus kembar. Pembagiannya begini:

**Harus identik**: _business logic_, bentuk _response_ sampai ke nama _field_ dan perilaku _edge case_, aturan pembulatan, _default_ aneh, dan ya, _quirk_.

**Boleh beda**: cara mengambil datanya. Contoh favorit saya sudah diceritakan di [episode kedua](/writing/2026/hijrah-backend-02/): _endpoint_ yang di PHP menjalankan ratusan _query_ kecil bertingkat, di Go diganti satu _query_ CTE. Hasil akhirnya wajib sama, jalan menuju ke sana bebas.

Pembagian ini bikin migrasinya tetap seru. Saya tidak sedang menyalin kamus, tapi membangun jembatan baru dengan alun-alun yang persis sama di kedua ujungnya.

## Cerita: "Perbaikan" yang Harus Saya Hapus Sendiri

Bagian favorit saya, karena jadi pelajaran mahal.

Ada satu _endpoint_ riwayat perjalanan kendaraan yang responsnya di sistem lama berisi beberapa _field_ tambahan: riwayat alarm, aktivitas _geofence_, dan insiden perilaku mengemudi. Versi Go awal saya mengisi semuanya dengan benar: alarm _speed limit_, SOS, serta aktivitas masuk dan keluar _geofence_. Lebih kaya dan lebih berguna, setidaknya menurut saya waktu itu. _Ehem._

Lalu saya telusuri sistem lamanya, dan ketemu pemandangan yang sekarang jadi gambar favorit saya:[^1]

```php
//get data alarm history
// $history_alarms = $device->getHistoryAlarm($start_date, $end_date, ...);
$history_alarms = [];
```

Query aslinya **dikomentari orang**. Tidak dihapus, tapi dikomentari, lalu diganti array kosong. Jadi tiga _field_ itu ternyata sudah bertahun-tahun selalu kosong di produksi. Dan setelah saya cek ke _frontend_: tidak satu pun dipakai.

Keputusannya adalah kalimat yang aneh diucapkan seorang _engineer_: _"hapus perbaikan kita, samakan dengan yang lama, kosongkan."_

Rasanya memang aneh, sengaja menurunkan "kualitas" kode sendiri demi setia pada sistem yang sedang digantikan. Tapi **perbaikan diam-diam itu racun dalam migrasi**. Kalau suatu hari data alarm itu memang perlu diisi, putuskan secara terpisah, jangan diselipkan ke migrasi.

## Quirk Kecil yang Wajib Ditiru

Parity turun sampai ke hal yang kelihatannya remeh. Contoh nyata: kalau total waktu bergerak sebuah kendaraan nol, sistem lama menampilkan tanda strip `'-'`, bukan `0 menit`. Alasannya sederhana: helper di kode lama cuma dipanggil kalau nilainya positif, jadi nol tidak pernah kebagian format. Versi awal saya menampilkan `0 menit`. Secara teknis lebih benar, tapi secara produksi beda, berarti salah.

Satu lagi _edge case_: rentang tanggal yang tidak wajar (misalnya tanggal akhir di masa depan). Sistem lama membalas _envelope_ kosong berformat khusus, sedangkan versi awal saya membalas _array_ polos. _User_ biasa tidak akan sadar bedanya, sampai suatu hari _script_ mereka yang mem-_parse_ _response_ yang sadar hahaha.

Meniru perilaku aneh lalu menuliskannya di _test_ dengan muka datar itu rasanya unik juga. Saya tahu ini bukan "cara yang benar", tapi "cara yang sudah dipercaya". Dalam migrasi, yang kedua menang.

## Pajak Paritas: Gelondongan _Field_

Kebiasaan warisan lain: _response_ JSON di sistem lama cenderung dikirim satu gelondong. Satu _endpoint_ membalas dengan puluhan _field_, sebagian bersarang dalam-dalam, dan tidak semuanya dipakai _frontend_. Di PHP, ongkos menyerahkan gelondongan itu terasa ringan. Di Go, yang terkenal efisien, menyerialisasi gelondongan itu jadi beban nyata yang dibayar di tiap _request_. Parity memaksa saya membawanya dulu apa adanya. Itu harga kesetiaan hehe.

Gelondongan itu juga lahir dari kebiasaan yang menular: _frontend_ tidak konsisten soal dari _endpoint_ mana dia mengambil sebuah _field_, kadang dari sini, kadang dari sana, tergantung selera zamannya. Konvensi penamaan pun berganti-ganti antar era. Hasilnya, aplikasi eksisting terasa seperti rumah tambal sulam. Tapi jujur, untuk ukuran tambal sulam dia kokoh juga, sudah bertahun-tahun dipakai puluhan ribu orang hahaha.

Konsistensinya tidak berhenti di sumber data. Tipe datanya ikut berimprovisasi: _field_ yang sama kadang dikirim sebagai angka, kadang, kalau kosong, sebagai _string_ kosong. Buat PHP, beda sekecil itu terlalu sopan untuk digubris. Buat Go yang _strict typing_, _string_ kosong yang mengaku angka itu berdiri di depan pintu sambil menolak mengisi formulir hahaha.

Lebih kreatif lagi: _field_ yang sama, dari halaman berbeda ke _endpoint_ serupa, sekali dikirim sebagai angka, sekali sebagai _string_. PHP menerima keduanya sambil senyum. Go menolak keduanya sambil menyodorkan _error decoding_ yang panjang.

Satu lagi yang hampir jadi bahan candaan sesama _developer_: sistem lama gemar membalas hasil kosong dengan HTTP 200 berisi `[]` atau `null`. Kode status lain sebenarnya bisa menjelaskan bahwa datanya tidak ada, tapi _frontend_ sudah bertahun-tahun bergantung pada `[]` itu. Aturan parity bilang: tiru. Jadi sistem Go saya pun ikut melapor "semua aman" sambil membawa kabar kosong.

Karena sudah tahu respons saya bakal gelondongan, saya bikin alat buktinya: audit kecil yang memeriksa _frontend_ untuk tiap _field_, mana yang benar-benar dibaca, mana yang cuma numpang lewat. Audit itu jadi kuitansi saat giliran beres-beres tiba. Dia juga yang membantu saya waktu mengosongkan _field_ riwayat alarm di cerita tadi: ternyata tidak ada yang membacanya.

## Parity Bukan Dogma

Sampai sini mungkin terdengar seperti sekte kesetiaan. Tenang, parity ada pengecualiannya.

Ada satu penyesuaian _timezone_ di sistem lama yang jelas-jelas bug, menggeser data mundur satu-dua jam di _timezone_ tertentu. Yang itu tidak saya tiru. Bedanya dengan kasus alarm: pengecualian ini saya ambil dengan sadar, alasannya saya catat, dan saya siap mempertanggungjawabkannya. **Parity itu _default_, bukan dogma.** Pengecualian boleh ada, asal sadar, tercatat, dan bisa dijelaskan.

## Sisi Lain Spesifikasi: Soal Dependensi

Di bulan-bulan awal, saya dapat satu saran dari senior yang memimpin proyek ini: _"sebisa mungkin pakai standar library saja."_

Reaksi dalam hati saya waktu itu: skeptis. Menurut saya aturan begitu terlalu kaku, yang penting kita sadar _library_ yang dipakai rawan _breaking changes_ atau tidak, kan? Tapi saya iya-iya saja. Alasannya sederhana dan agak memalukan: takut kalau repo saya diinspeksi dan saya tidak mengikuti instruksi, saya kena tegur hehe.

Lucunya, sampai proyek berjalan berbulan-bulan, inspeksi itu tidak pernah datang. Dan kenyataannya bicara sendiri: sampai tulisan ini dibuat, _go.mod_ saya berisi **22 dependensi langsung**: _web framework_, _driver database_, _cache_, _structured logging_, _config_, dan teman-temannya.

Prinsip yang akhirnya benar-benar saya jalani bukan "standar library saja", tapi lebih longgar sekaligus lebih menuntut: **setiap dependensi harus bisa menjawab satu pertanyaan, kenapa standar library tidak cukup untuk ini?** _Framework_ HTTP? Standar library memang belum nyaman. _Date/time handling_? Standar library cukup, jadi tidak ada _library_ tambahan. Intinya bukan soal jumlah, tapi tiap baris harus punya alasan.

Aturan yang ditegakkan dengan rasa takut mungkin ditaati, tapi aturan yang tidak dipahami tidak akan bertahan. Untung saya akhirnya menemukan prinsip yang lebih sehat daripada sekadar menurut.

## Catatan Akhir

1. **Spesifikasi terbaik untuk migrasi adalah kode lama itu sendiri.** Selalu _up-to-date_, tidak bisa bohong, dan bisa dijalankan sebagai pembanding.
2. **Setia lebih penting daripada unggul.** Perbaikan boleh datang nanti, setelah sistem baru stabil, sebagai keputusan terpisah.
3. **Pengecualian parity harus sadar dan tercatat.** Default-nya tiru, dan yang tidak ditiru harus bisa dijelaskan alasannya.
4. **Aturan dependensi yang bagus berisi alasan, bukan angka.** "Standar library saja" terdengar disiplin, tapi "tiap dependensi wajib punya alasan" yang benar-benar bisa dijalankan.

Episode berikutnya kita ke dapur _database_: _query_ ber-_index_ yang memilih tidak memakainya, dan pembungkus `DATE()` yang memperlambat tabel berisi puluhan juta baris.

Sekian. Salam.

[^1]: Potongan kode dalam tulisan ini disederhanakan dari bentuk aslinya, nama _field_ dan struktur dipertahankan secukupnya untuk bercerita, detail internal diubah.

[^2]: "Yang benar adalah yang lama" berlaku selama masa migrasi. Setelah sistem baru stabil dan terverifikasi, statusnya lulus uji dan mulai berhak menentukan sendiri arah perubahannya.
