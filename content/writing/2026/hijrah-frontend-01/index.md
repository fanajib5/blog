---
title: "Hijrah Frontend (1): Ketika Backend Engineer Disuruh Menyentuh Frontend"
description: "Ep 1 seri Hijrah Frontend: setelah backend GPS selesai dihijrahkan ke Go, giliran gedung sebelah. Kesan pertama seorang backend engineer membuka kode frontend warisan, dan keputusan port tipis."
author: "Faiq Najib Al-Aziz"
date: 2026-09-23T09:00:01+07:00
lastmod: 2026-09-23T21:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - frontend
  - nextjs
  - cerita
series: "Hijrah Frontend"
---

Seri [Hijrah Backend](/writing/2026/hijrah-backend-01/) sudah selesai. Backend GPS sekarang berjalan di Go, 14 modul domain sudah tertata, dan _endpoint_ yang tadinya makan waktu 15 detik sudah jauh lebih cepat.

Sekarang giliran gedung sebelah: _frontend_.

Saya seorang _backend engineer_. Sehari-hari saya berurusan dengan _query_, _index_, _parser_ paket biner, dan kesejahteraan _database_. _Frontend_ biasanya hanya saya kunjungi seperlunya, seperti turis. Sampai akhirnya saya diminta ikut mengurusnya, bukan sekadar mampir hehe~

## Kesan Pertama: Bau _Spaghetti_

Saat membuka _frontend_ warisan itu, saya langsung melihat _spaghetti_ di mana-mana. Saya memang tidak jago _frontend_, tapi sudah cukup lama membaca kode untuk mengenali polanya. Anda tidak perlu jadi koki untuk tahu sup sudah terlalu lama di meja; kadang cukup lihat saja.

Saya tidak bermaksud menuduh siapa pun. Aplikasi itu dibangun selama bertahun-tahun, dikerjakan banyak orang dengan selera berbeda, dan tetap melayani puluhan ribu _user_ setiap hari. _Backend_ yang pernah saya hijrahkan punya cerita serupa. Ternyata gedungnya berbeda, tapi penyebabnya sama: **waktu dan keadaan darurat**.

## Keputusan: Fork, Bukan Rewrite

Pengalaman [menghijrahkan _backend_](/writing/2026/hijrah-backend-01/) membuat saya makin percaya bahwa _rewrite_ total memang terlihat menarik di _slide_, tapi menakutkan saat sudah masuk produksi.

Untuk _frontend_, kami memilih jalan yang mirip: **fork sistem lama, lalu port tipis**. Aplikasi dibawa ke rumah baru apa adanya, bukan digambar ulang dari nol dengan _framework_ terbaru. Bahkan nama _repo_-nya tidak berubah, mungkin karena belum sempat diberi tahu bahwa ia sudah pindah rumah.

Hari pertama di rumah baru saya habiskan dengan menghitung isi lemari:

- **76 halaman** di _app router_[^2]: 60 berformat JSX, 15 berformat JS, dan satu file _backup_ yang tidur di antara mereka[^1]
- Dua _library_ UI besar yang hidup berdampingan di satu aplikasi yang sama
- _State management_ warisan yang sudah bertahun-tahun menjadi tukang kebun sekaligus tukang listrik
- Satu dokumen bernama `TAILWIND_FIX.md` di akar _repo_: monumen kecil untuk penyakit yang pernah sehat hehe~

Enam puluh halaman memakai JSX. Ini bukan keluhan, hanya pengingat bahwa saya sedang belajar bahasa lain. Biasanya saya berteriak `if err != nil`; sekarang saya harus belajar merangkai _className_.

## Kenapa Port Tipis, Bukan Redesign

Pertanyaannya sama seperti saat di _backend_: kenapa tidak sekalian rombak semuanya supaya rapi dan modern?

Jawabannya sederhana: _user_ ingin tombol yang mereka pakai setiap hari tetap bekerja. Merombak tampilan sambil memindahkan aplikasi berarti mengubah dua hal sekaligus. Di [episode empat di seri backend](/writing/2026/hijrah-backend-04/), saya sudah belajar betapa mahalnya perbaikan diam-diam saat migrasi.

Untuk _frontend_, berarti tampilan dan perilakunya kami pertahankan dulu. Struktur internal bisa dirapikan nanti, satu keputusan setiap kali. Kode warisan yang ikut pindah dicatat, bukan disembunyikan. Di episode kedua, saya akan membahas apa saja yang terbawa dan alasan sebagian belum bisa ditinggalkan.

## Peta Perjalanan

Seri **Hijrah Frontend** ini berisi lima episode:

2. **Port tipis dan warisan yang ikut naik**: apa saja yang terbawa dari rumah lama, secara sadar.
3. **Type chaos: angka, _string_ kosong, dan halaman yang berbeda pendapat**: bagaimana satu _field_ yang sama dikirim dengan tipe berbeda-beda tergantung halamannya, dan bagaimana hal itu diterima di dunia yang _strict_.
4. **Dua _library_ UI, dua era penamaan**: warisan yang hidup berdampingan, dan konvensi yang berganti setiap ganti tukang.
5. **Dua sisi satu gedung**: penutup, refleksi, dan apa yang berubah setelah gedung sebelah jadi rumah sendiri.

Kalau Anda datang dari seri _backend_: selamat datang kembali, gedungnya masih sama, cuma kita pindah lantai. Kalau Anda baru mampir: [episode pembuka seri sebelah](/writing/2026/hijrah-backend-01/) adalah tempat terbaik untuk mulai, atau langsung saja di sini; cerita ini berdiri sendiri hehe~

## Jadi Penghuni Gedung Sebelah

Saya datang sebagai turis, tapi sekarang _frontend_ warisan ini juga menjadi tanggung jawab saya. Isinya sudah saya lihat: _spaghetti_, dua _library_ UI, dan 76 halaman yang perlu tetap berfungsi setelah pindah.

Berikutnya, saya mulai mencatat barang-barang yang ikut naik kereta. Daftarnya lebih panjang daripada yang saya kira.

[^1]: Satu file itu bukan salah siapa-siapa; dia jenazah _backup_ yang setia menemani, sama seperti puluhan jenazah berkomentar yang pernah saya temui di _backend_.

[^2]: Angka halaman dan rincian format dihitung langsung dari _repo_ saat episode ini ditulis; detail _stack_ lain disederhanakan untuk bercerita.
