---
title: "Hijrah Frontend (4): Dua Library UI, Dua Era Penamaan"
description: "Ep 4 seri Hijrah Frontend: primereact dan antd hidup berdampingan di satu aplikasi tanpa pernah bertemu di satu file. Tentang garis demarkasi, kamus UI di kantong reducer, dan tiga era styling."
author: "Faiq Najib Al-Aziz"
date: 2026-09-24T09:00:00+07:00
lastmod: 2026-09-11T03:30:00+07:00
draft: true
toc: true
comments: false
tags:
  - frontend
  - ui
  - konsistensi
  - cerita
series: "Hijrah Frontend"
---

Di [episode kedua](/writing/2026/hijrah-frontend-02/) saya menyebut angkanya: satu _library_ UI dipakai di 101 _file_, satunya bertahan di 13. Episode ini kami buka lebih dalam, karena di dalamnya ada dua temuan yang membuat saya tertawa sendirian di depan layar hehe~

Temuan pertama: keduanya **tidak pernah bertemu di satu _file_ yang sama**. Temuan kedua: _library_ yang kalah popularitas itu menyimpan barang paling dicari se-kota. Mari berurutan.

## Dua Peradaban dengan Garis Demarkasi

Peradaban pertama adalah _library_ mayoritas: dia menyediakan _paginator_, _button_, _skeleton_, _card_, sampai _galleria_ gambar. Dia fondasi tampilan hampir semua halaman; panggilannya terdengar di seratus satu _file_.[^1]

Peradaban kedua lebih kecil, tapi punya monopoli. Dia yang menyimpan _DatePicker_, _TimePicker_, dan _Select_, komponen paling dicari se-_kota_ ketika sebuah halaman butuh laporan dengan kalender. Tiga belas _file_ menggantungkan hidup padanya, mayoritas halaman _report_.

Dan yang membuat saya lega sekaligus kagum: setelah dicek satu per satu, **nol _file_ memakai keduanya sekaligus**. Dua peradaban itu hidup berdampingan tanpa pernah berbagi kamar. Ada garis demarkasi yang tidak tertulis di dokumen mana pun, tapi dipatuhi sempurna, entah oleh siapa dan sejak kapan hehe~

Garis seperti ini biasanya lahir bukan dari kebijakan, tapi dari pengalaman: sekali mencoba mencampur keduanya, seseorang pernah merasakan _styling_ yang saling makan, lalu seluruh tim lupa tidak-lupa. Demarkasi dengan trauma sebagai notaris hahaha.

## Kamus di Kantong Reducer

Temuan kedua ini favorit saya. Salah satu _library_ itu butuh _locale_: label kalender dalam bahasa Indonesia. Wajar; semua orang butuh kalender berbahasa sendiri. Yang tidak wajar adalah di mana _locale_-nya di-_import_: **di dalam _reducer_**.

_Pengusaha data_, yang seharusnya mengurus angka dan status, ternyata membawa kamus lapisan tampilan di kantongnya. Tiga _reducer_ berbeda, tiga kali kamus yang sama.[^2]

Untuk apa? Mungkin supaya label _locale_ tersedia saat _state_ disusun. Mungkin sekadar ikut _copy-paste_ zaman dulu. Tidak ada yang tahu pasti, dan memangnya perlu? Inilah peta dan kota tua: arsitektur yang rapi ada di kepala orang asing, sementara kenyataannya adalah kota yang tumbuh liar tapi berfungsi. _Reducer_ membawa kamus itu aneh, tapi dia sudah bertahun-tahun menunjukkan jalan dengan benar, jadi biarlah dia membawa kamusnya hahaha.

## Tiga Era Styling

Lapisan berikutnya: bagaimana komponen-komponen ini berdandan. Di _repo_ ada tiga generasi yang hidup damai:

1. **_Global CSS_ klasik**: empat puluh delapan _file_ _stylesheet_ yang memengaruhi siapa pun yang kebetulan memakai nama _class_ yang sama. Era kepercayaan buta.
2. **Bawaan _library_ UI**: tema dari masing-masing peradaban, yang kadang saling menyusup ke wilayah satu sama lain.
3. **Tailwind**: generasi baru, dengan _config_-nya, plus satu dokumen perbaikan di akar _repo_ yang sudah saya ceritakan di [episode pertama](/writing/2026/hijrah-frontend-01/), monumen penyakit yang sembuh.

Tiga era itu tidak saling menghapus. Halaman era pertama tetap bergaya era pertama, dan begitu seterusnya, seperti kota dengan arsitektur kolonial, modern, dan kontemporer berjajar di satu jalan. Berantakan? Tergantung siapa yang ditanya. Berkarakter? Tanpa debat hahaha.

## Yang Kami Lakukan (dan Tidak)

Supaya setia pada tradisi: saat port tipis ini berjalan, kami **tidak menyeragamkan** apa pun dari daftar di atas. Tidak ada migrasi _library_, tidak ada pemisahan _reducer_ dari kamusnya, tidak ada penghapusan era styling.

Yang kami jaga justru garis demarkasinya: nol _file_ campuran itu kami pertahankan sebagai aturan tidak tertulis yang resmi kami tulis. Karena standardisasi besar saat pindah rumah itu [pelanggaran aturan episode empat](/writing/2026/hijrah-backend-04/) versi _frontend_. Standardisasi itu nyata dan bagus; tempatnya adalah epilog, bukan koper hehe~

## Pelajaran

1. **Dua _library_ berdampingan itu sejarah, bukan dosa.** Selama garis demarkasi jelas, mereka berdamai lebih baik daripada banyak tim.
2. **Larang campuran di level _file_; itu demarkasi termurah yang paling efektif.** Tidak butuh _tooling_; cukup disiplin dan rasa trauma bersama.
3. **Kebocoran lapisan itu petunjuk.** Kamus UI di kantong _reducer_ lucu dibaca, dan sekaligus menunjukkan di mana batas lapisan bocor. Tertawa dulu, catat kemudian.
4. **Menyeragamkan itu epilog.** Jangan gabungkan pindah rumah dengan renovasi total; koper akan robek di tengah jalan.

Episode berikutnya episode penutup berseri: dua sisi satu gedung, apa yang berubah setelah _backend_ dan _frontend_ sama-sama pindah, dan warisan mana yang kami pilih untuk dirawat. Sampai ketemu di sana.

Sekian. Salam.

[^1]: Angka _file_ dan daftar komponen dihitung langsung dari _repo_ saat episode ini ditulis; komponen minor tidak semuanya disebut.

[^2]: Contoh kode dan nama _file_ disederhanakan; strukturnya sama, isinya tidak penting untuk cerita.
