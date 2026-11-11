---
title: "Hijrah Frontend (4): Dua Library UI, Dua Era Penamaan"
description: "Ep 4 seri Hijrah Frontend: primereact dan antd hidup berdampingan di satu aplikasi tanpa pernah bertemu di satu file. Tentang garis demarkasi, kamus UI di kantong reducer, dan tiga era styling."
author: "Faiq Najib Al-Aziz"
date: 2026-09-23T09:00:04+07:00
lastmod: 2026-09-23T21:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - frontend
  - ui
  - konsistensi
  - cerita
series: "Hijrah Frontend"
---

Di [episode kedua](/writing/2026/hijrah-frontend-02/) saya sempat menyebut angkanya: satu _library_ UI dipakai di 101 _file_, satunya di 13 saja. Kali ini saya bongkar penggunaannya lebih dekat. Ada dua hal yang bikin saya mengernyit, lalu tertawa sendiri di depan layar, hehe.

Rupanya keduanya **tidak pernah dipakai dalam _file_ yang sama**. Aneh juga, _library_ yang lebih jarang dipakai justru punya komponen yang paling sering dicari. Saya ceritakan.

## Dua Library, Batas yang Tidak Tertulis

_Library_ pertama dipakai di lebih banyak halaman. Isinya _paginator_, _button_, _skeleton_, _card_, sampai _galleria_ gambar. Hampir semua halaman memakai komponen darinya; ada 101 _file_ yang memanggilnya.[^1]

_Library_ kedua hanya dipakai di 13 _file_, kebanyakan halaman _report_. Namun, komponen _DatePicker_, _TimePicker_, dan _Select_ hanya tersedia di sana. Saat halaman laporan membutuhkan kalender, ketiganya yang dicari.

Saya cek _file_-nya satu per satu dan memang **tidak ada yang memakai dua _library_ sekaligus**. Batas ini kelihatannya selalu dijaga, walaupun saya tidak menemukan catatan kapan atau kenapa aturan itu muncul. Setidaknya, pola tersebut masih konsisten di _file_ yang saya periksa.

## Kamus di Kantong Reducer

Temuan kedua ini favorit saya. Salah satu _library_ membutuhkan _locale_ supaya label kalender tampil dalam bahasa Indonesia. Masuk akal. Tapi tempat _import_-nya membuat saya berhenti sebentar: **di dalam _reducer_**.

_Reducer_ biasanya mengurus data seperti angka dan status. Di sini, tiga _reducer_ berbeda masing-masing membawa kamus yang sama untuk lapisan tampilan.[^2]

Kenapa _locale_ ditaruh di sana? Mungkin supaya labelnya tersedia waktu _state_ disusun, mungkin juga sisa _copy-paste_ lama. Saya belum tahu. Letaknya memang terasa aneh, tapi sudah bertahun-tahun berfungsi. Untuk port kali ini, saya catat dulu. Belum perlu dipindah-pindah.

## Tiga Era Styling

Untuk _styling_, ada tiga generasi di _repo_:

1. **_Global CSS_ klasik**: 48 _file stylesheet_ yang bisa memengaruhi elemen lain dengan nama _class_ yang sama.
2. **Bawaan _library_ UI**: tema dari masing-masing _library_, yang kadang masuk ke wilayah satu sama lain.
3. **Tailwind**: generasi baru dengan _config_-nya, serta satu dokumen perbaikan di akar _repo_ yang sudah saya ceritakan di [episode pertama](/writing/2026/hijrah-frontend-01/).

Ketiganya masih dipakai. Halaman yang lebih lama tetap memakai gaya lama, sementara halaman lain memakai _library_ UI atau Tailwind. Hasilnya memang tidak seragam. Ya, begitulah _frontend_ yang kami port, hehe.

## Yang Kami Lakukan (dan Tidak)

Selama port tipis ini, kami **tidak menyeragamkan** hal-hal di atas. Tidak ada migrasi _library_, pemisahan _reducer_ dari _locale_, atau penghapusan era _styling_.

Yang kami jaga cuma batas antarlibrary: satu _file_ tidak mencampur keduanya. Kebiasaan yang tadinya tidak tertulis itu sekarang kami catat. Kalau sekalian melakukan standardisasi besar saat pindahan, itu akan melanggar [aturan episode empat](/writing/2026/hijrah-backend-04/) versi _frontend_. Nanti saja, setelah port selesai.

## Catatan Saya

1. **Dua _library_ bisa berdampingan.** Yang penting, batas pemakaiannya jelas.
2. **Mulai dari aturan sederhana di level _file_.** Kami tidak membutuhkan _tooling_ khusus untuk menjaga agar keduanya tidak tercampur.
3. **Import _locale_ di _reducer_ menunjukkan batas lapisan yang kurang rapi.** Untuk sekarang, cukup catat dulu karena kode itu masih berfungsi.
4. **Pisahkan port dari standardisasi.** Pindahkan dulu; perbaikan besar bisa menyusul.

Episode berikutnya jadi penutup seri. Saya akan melihat dua sisi gedung yang sama, apa yang berubah setelah _backend_ dan _frontend_ dipindahkan, dan warisan mana yang kami putuskan untuk dipelihara. Sampai jumpa di sana.

Sekian. Salam.

[^1]: Angka _file_ dan daftar komponen dihitung langsung dari _repo_ saat episode ini ditulis; komponen minor tidak semuanya disebut.

[^2]: Contoh kode dan nama _file_ disederhanakan; strukturnya sama, isinya tidak penting untuk cerita.
