---
title: "Hijrah Backend (4): Kode Lama sebagai _Executable Spec_"
description: "Ep 4 seri Hijrah Backend: parity-first secara utuh, kenapa migrasi bukan momen perbaikan, cerita 'perbaikan' yang harus saya hapus sendiri, dan filosofi dependensi di balik 22 baris go.mod."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:00+07:00
lastmod: 2026-09-10T23:30:00+07:00
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

Kalau boleh merangkum satu aturan yang memegang kendali penuh atas migrasi ini, kualimatkan begini: **yang benar adalah yang lama.**[^2]

Kedengarannya menyebalkan, saya tahu. Kamu dipercaya memindahkan sistem ke bahasa baru, dan aturan nomor satu-nya justru: jangan berubah apa-apa. Bukan lebih cepat. Bukan lebih bersih. Bukan lebih baik. **Identik.** Tulisan ini bedah kenapa aturan yang anti-klimaks itu justru keputusan paling masuk akal yang pernah saya jalani hehe~

## Kenapa Sistem Baru Harus Setia pada Sistem Lama

Alasannya bukan nostalgia. Ada tiga alasan yang sangat pragmatis.

Pertama, **kepercayaan**. Puluhan ribu _user_ sudah bertahun-tahun percaya pada output sistem lama, angka yang sama, format yang sama, _quirk_ yang sama. Migrasi yang diam-diam mengubah hasil adalah migrasi yang mengikis kepercayaan itu tanpa izin.

Kedua, **permukaan _debugging_**. Kalau output sistem baru berbeda dari yang lama, tersangkanya cuma satu: proses _porting_-nya. Logikanya sudah teruji bertahun-tahun di produksi. Tapi kalau saya sekalian "memperbaiki" logika sambil berpindah bahasa, satu _bug_ baru berarti dua tersangka: logika barunya, atau penerjemahannya. [Episode kedua](/writing/2026/hijrah-backend-02/) sudah membuktikan betapa mahalnya _debugging_ dengan tersangka yang salah.

Ketiga, dan ini yang paling sering dilupakan: **dokumentasi yang bohong, kode yang jujur**. Sistem yang saya terima nyaris tanpa dokumentasi, semua pengetahuan ada di kepala satu orang yang kalau sedang tidak ada, aplikasi eksisting itu seperti kota tua tanpa peta. Kode lama adalah satu-satunya spesifikasi yang bisa dijalankan. Spesifikasi yang bisa dijalankan tidak bisa bohong; dia selalu mengaku apa yang benar-benar dia lakukan, termasuk aibnya.

Tinggal satu catatan soal spesifikasi ini: dia jujur, tapi kadang berbicara dalam bahasa misterius. Sistem lama hobi mengulang _query_ yang sama dalam _loop_, padahal sebenarnya bisa digabung jadi satu. Lalu ada sulap khas _framework_: tulis `$this->device()`, dan tiba-tiba muncul _method_ yang entah didefinisikan di mana, entah sejak kapan, dan, yang paling bikin bengong, sukses mengembalikan _response_ data. Di PHP, hal seperti itu dianggap wajar. Di Go, semua yang tadi tersulap itu harus kutulis eksplisit satu per satu. Awalnya terasa seperti kehilangan jalan pintas; lama-lama terasa seperti akhirnya tahu isi dapur hehe.

## Aturan Main: Mana yang Setia, Mana yang Bebas

Parity bukan berarti semua harus kembar. Yang saya pisahkan:

**Harus identik**: _business logic_, bentuk _response_ sampai ke nama _field_ dan tipe _edge case_-nya, aturan pembulatan, _default_ aneh, dan ya, _quirk_.

**Bebas berbeda**: cara mengambil datanya. Contoh favorit saya sudah diceritakan di [episode kedua](/writing/2026/hijrah-backend-02/): _endpoint_ yang di PHP menjalankan ratusan _query_ kecil bertingkat, di Go diganti satu _query_ CTE. Hasil akhirnya wajib sama, jalan menuju sana bebas.

Perbedaan ini yang membuat migrasi tetap menarik: kamu tidak sedang menyalin kamus, kamu sedang membangun jembatan baru dengan alun-alun yang sama persis di kedua ujungnya.

## Cerita: "Perbaikan" yang Harus Saya Hapus Sendiri

Ini bagian favorit saya, karena jadi pelajaran mahal.

Ada satu _endpoint_ riwayat perjalanan kendaraan yang responsnya di sistem lama berisi beberapa _field_ tambahan: riwayat alarm, aktivitas _geofence_, dan insiden perilaku mengemudi. Versi Go awal saya mengisi ketiganya dengan semestinya, alarm _speed limit_, SOS, masuk/keluar _geofence_. Lebih kaya, lebih berguna. Saya merasa keren sebentar.

Lalu saya telusuri sistem lamanya, dan ketemu pemandangan yang sekarang jadi gambar favorit saya:[^1]

```php
//get data alarm history
// $history_alarms = $device->getHistoryAlarm($start_date, $end_date, ...);
$history_alarms = [];
```

Query aslinya **dikomentari orang**. Tidak dihapus, dikomentari, lalu diganti array kosong. Tiga _field_ itu ternyata sudah bertahun-tahun selalu berisi kosong di sistem produksi. Dan setelah saya cek ke _frontend_: tidak satu pun yang dipakai.

Keputusannya kalimat yang aneh untuk diucapkan seorang _engineer_: _"hapus perbaikan kita, samakan dengan yang lama: kosongkan."_

Dan rasanya memang aneh. Sengaja menurunkan "kualitas" kode sendiri supaya setia pada sistem yang sedang kamu gantikan. Tapi itulah poinnya: **perbaikan diam-diam adalah racun dalam migrasi**. Kalau suatu hari memang perlu mengisi data alarm itu, dia harus jadi keputusan eksplisit yang terpisah, bukan kejutan yang lolos bareng migrasi. Perbaikan boleh; kejutan tidak boleh hehe~

## Quirk Kecil yang Wajib Ditiru

Parity juga turun sampai hal yang kelihatannya remeh. Contoh nyata: kalau total waktu bergerak sebuah kendaraan nol, sistem lama menampilkan tanda strip `'-'`, bukan `0 menit`. Alasannya sederhana: helper di kode lama cuma dipanggil kalau nilainya positif, jadi nol tidak pernah kebagian format. Versi awal saya menampilkan `0 menit`, secara teknis lebih benar, secara produksi: beda, berarti salah.

Plus satu _edge case_: rentang tanggal yang tidak wajar (misalnya tanggal akhir di masa depan). Sistem lama membalas _envelope_ kosong berformat khusus; versi awal saya membalas _array_ polos. _User_ tidak akan pernah tahu bedanya, sampai suatu hari _script_ mereka yang mem-_parse_ _response_ tahu hahaha.

Meniru perilaku aneh secara sadar, lalu menuliskannya di _test_ dengan muka datar, itu pengalaman yang unik. Kamu tahu itu bukan "cara yang benar". Kamu tahu itu "cara yang sudah dipercaya". Dan dalam migrasi, yang kedua menang.

## Pajak Paritas: Gelondongan _Field_

Kebiasaan warisan lain: _response_ JSON di sistem lama cenderung dikirim satu gelondong. Satu _endpoint_ membalas dengan puluhan _field_, sebagian bersarang dalam-dalam, dan tidak semuanya dipakai _frontend_-nya. Di PHP, biaya menyerahkan gelondongan itu terasa ringan. Di Go, yang justru terkenal efisien, menyerialisasi gelondongan itu jadi beban nyata yang dibayar di tiap _request_. Parity memaksa saya membawanya dulu apa adanya; itu harga setianya hehe.

Gelondongan itu juga lahir dari kebiasaan yang menular: _frontend_ tidak konsisten dari _endpoint_ mana dia mengambil sebuah _field_, kadang dari sini, kadang dari sana, tergantung selera masanya. Konvensi penamaan pun ikut berganti-ganti antar era. Hasil akhirnya: aplikasi eksisting terasa seperti rumah tambal sulam. Tapi jujur, untuk ukuran tambal sulam, dia kokoh juga, udah bertahun-tahun dipakai puluhan ribu orang hahaha.

Konsistensinya memang tidak berhenti di sumber data. Tipe datanya pun ikut berimprovisasi: _field_ yang sama kadang dikirim sebagai angka, kadang, saat kosong, sebagai _string_ kosong. Ke PHP, perbedaan secuil itu terlalu sopan untuk digubris. Ke Go yang _strict typing_, _string_ kosong yang mengaku angka itu berdiri di depan pintu sambil menolak mengisi formulir hahaha.

Lebih kreatifnya lagi: _field_ yang sama, dari halaman berbeda ke _endpoint_ serupa, sekali dikirim sebagai angka, sekali sebagai _string_. PHP menerima keduanya sambil senyum. Go menolak keduanya sambil menyerahkan _error decoding_ yang panjang hahaha.

Satu lagi yang hampir jadi candaan sesama _developer_: sistem lama gemar membalas hasil kosong dengan HTTP 200 berisi `[]` atau `null`. Padahal bisa saja dikirim kode status yang jujur, sekalian menjelaskan bahwa datanya tidak ada. Tapi _frontend_ sudah bertahun-tahun membangun hidupnya di atas `[]` itu, dan aturan parity bilang: tiru. Jadi sistem Go saya pun ikut melapor "semua aman" sambil membawa kabar kosong hahaha.

Karena tahu respons saya nanti gelondongan, saya membangun alat buktinya: audit kecil yang memeriksa _frontend_ untuk tiap _field_, mana yang benar-benar dibaca, mana yang cuma numpang lewat. Audit itulah yang jadi kuitansi saat giliran membereskan tiba. Dia juga yang membantu saya saat harus mengosongkan _field_ riwayat alarm di cerita di atas: tidak ada satu pun yang membacanya.

## Parity Bukan Dogma

Sampai di sini bisa terdengar seperti sekte kesetiaan. Tenang, parity punya pengecualian.

Ada satu penyesuaian _timezone_ di sistem lama yang jelas-jelas bug, menggeser data mundur satu-dua jam di _timezone_ tertentu. Yang itu saya tidak tiru. Bedanya dengan kasus alarm: pengecualian ini saya ambil secara sadar, saya catat alasannya, dan saya siap mempertanggungjawabkannya. **Parity adalah _default_, bukan dogma.** Pengecualiannya boleh ada, asal pengecualiannya tahu diri: sadar, tercatat, dan bisa dijelaskan.

## Sisi Lain Spesifikasi: Soal Dependensi

Di bulan-bulan awal, saya menerima satu saran dari senior yang memimpin proyek ini: _"sebisa mungkin pakai standar library saja."_

Reaksi internal saya waktu itu: skeptis. Bagi saya aturan semacam itu terlalu kaku, yang penting kita sadar _library_ yang kita pakai rawan _breaking changes_ atau tidak, kan? Tapi saya mengiyakan. Alasannya sederhana dan sedikit memalukan: saya takut kalau repo saya di-inspeksi dan saya tidak mengikuti instruksi, saya kena tegur hehe.

Lucunya: sampai proyek berjalan berbulan-bulan, inspeksi itu tidak pernah datang. Dan kenyataan akhirnya berbicara sendiri, sampai tulisan ini dibuat, _go.mod_ saya berisi **22 dependensi langsung**: _web framework_, _driver database_, _cache_, _structured logging_, _config_, dan teman-temannya.

Filosofi yang akhirnya benar-benar saya jalani bukan "standar library saja", tapi lebih longgar dan justru lebih menuntut: **setiap dependensi harus bisa menjawab satu pertanyaan, kenapa standar library tidak cukup untuk ini?** _Framework_ HTTP? Standar library memang belum nyaman. _Date/time handling_? Standar library cukup, jadi tidak ada _library_ tambahan. Aturannya bukan soal berapa banyak, tapi soal tiap baris punya alasan.

Pelajaran kecilnya: aturan yang ditegakkan dengan rasa takut akan ditaati, tapi aturan yang ditaati tanpa dipahami tidak akan bertahan. Untungnya yang terakhir terjadi ke saya, dan hasilnya lebih sehat dari aturannya sendiri hahaha.

## Pelajaran

1. **Spesifikasi terbaik untuk migrasi adalah kode lama itu sendiri.** Dia selalu _up-to-date_, tidak pernah bohong, dan bisa dijalankan sebagai pembanding.
2. **Kesetiaan lebih penting daripada keunggulan.** Perbaikan boleh datang, tapi setelah sistem baru stabil, sebagai keputusan eksplisit yang terpisah.
3. **Pengecualian parity harus sadar dan tercatat.** Default-nya tiru; yang tidak ditiru harus bisa dijelaskan kenapa.
4. **Aturan dependensi yang baik berisi alasan, bukan angka.** "Standar library saja" terdengar disiplin; "tiap dependensi wajib punya alasan" itu yang benar-benar bisa dijalankan.

Episode berikutnya kita ke dapur _database_: kenapa _query_ yang sudah punya _index_ bagus bisa memilih untuk tidak memakainya, dan kenapa pembungkus sekecil `DATE()` bisa menghukum tabel puluhan juta baris. Sampai ketemu di sana.

Sekian. Salam.

[^1]: Potongan kode dalam tulisan ini disederhanakan dari bentuk aslinya, nama _field_ dan struktur dipertahankan secukupnya untuk bercerita, detail internal diubah.

[^2]: "Yang benar adalah yang lama" berlaku selama masa migrasi. Setelah sistem baru stabil dan terverifikasi, statusnya lulus uji dan mulai berhak menentukan sendiri arah perubahannya.
