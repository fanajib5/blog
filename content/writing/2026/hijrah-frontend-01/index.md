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

Seri [Hijrah Backend](/writing/2026/hijrah-backend-01/) akhirnya kelar. Backend GPS sekarang jalan di Go, 14 modul domain sudah tertata, dan _endpoint_ yang dulu butuh 15 detik sekarang jauh lebih ngebut. Alhamdulillah.

Nah, sekarang giliran gedung sebelah: _frontend_.

Saya seorang _backend engineer_. Sehari-hari saya berurusan dengan _query_, _index_, _parser_ paket biner, dan kesejahteraan _database_. _Frontend_ biasanya hanya saya kunjungi seperlunya, seperti turis. Sampai akhirnya saya diminta ikut mengurusnya. Bukan sekadar mampir lagi, hehe~

## Kesan Pertama: Bau _Spaghetti_

Saat membuka _frontend_ warisan itu, saya langsung melihat _spaghetti_ di mana-mana. Saya memang tidak jago _frontend_, tapi sudah cukup lama baca kode orang untuk tahu mana yang _spaghetti_. Tidak perlu jadi koki untuk tahu kalau sup sudah kelamaan nangkring di meja, kan? Kelihatan saja sudah cukup.

Eh, saya tidak bermaksud menuduh siapa pun ya. Aplikasi itu dibangun bertahun-tahun, dikerjakan banyak orang dengan selera berbeda, dan tetap melayani puluhan ribu _user_ setiap hari. _Backend_ yang dulu saya hijrahkan ceritanya mirip. Gedungnya beda, penyebabnya sama: **waktu dan keadaan darurat**.

## Keputusan: Fork, Bukan Rewrite

Pengalaman [menghijrahkan _backend_](/writing/2026/hijrah-backend-01/) membuat saya makin yakin bahwa _rewrite_ total itu kelihatan keren di _slide_, tapi bikin deg-degan begitu masuk produksi.

Untuk _frontend_, kami ambil jalan yang mirip: **fork sistem lama, lalu port tipis**. Aplikasinya dibawa ke rumah baru apa adanya, tidak digambar ulang dari nol pakai _framework_ terbaru. Bahkan nama _repo_-nya tidak berubah, mungkin karena belum sempat diberi tahu bahwa ia sudah pindah rumah.

Hari pertama di rumah baru saya habiskan untuk menghitung isi lemari:

- **76 halaman** di _app router_[^2]: 60 berformat JSX, 15 berformat JS, dan satu file _backup_ yang tidur di antara mereka[^1]
- Dua _library_ UI besar yang hidup berdampingan di satu aplikasi yang sama
- _State management_ warisan yang sudah bertahun-tahun menjadi tukang kebun sekaligus tukang listrik
- Satu dokumen bernama `TAILWIND_FIX.md` di akar _repo_: monumen kecil untuk penyakit yang pernah sehat hehe~

Enam puluh halaman pakai JSX. Ini bukan keluhan, cuma pengingat bahwa saya sedang belajar bahasa lain. Biasanya saya teriak `if err != nil`, sekarang harus belajar merangkai _className_ (ya... pelan-pelan).

## Kenapa Port Tipis, Bukan Redesign

Pertanyaannya sama seperti di _backend_: kenapa tidak sekalian dirombak biar rapi dan kekinian?

Jawabannya sederhana, _user_ maunya tombol yang mereka pakai tiap hari tetap jalan. Merombak tampilan sambil pindahan berarti mengubah dua hal sekaligus. Di [episode empat di seri backend](/writing/2026/hijrah-backend-04/), saya sudah belajar betapa mahalnya perbaikan diam-diam saat migrasi.

Jadi untuk _frontend_, tampilan dan perilakunya kami pertahankan dulu. Struktur internal dirapikan nanti saja, satu keputusan setiap kali. Kode warisan yang ikut pindah kami catat, tidak kami sembunyikan. Di episode kedua saya cerita apa saja yang terbawa dan kenapa sebagian belum bisa ditinggal.

## Rencana Episode

Seri **Hijrah Frontend** ini rencananya lima episode (yang pertama sedang Anda baca):

2. **Port tipis dan warisan yang ikut naik**: apa saja yang terbawa dari rumah lama, secara sadar.
3. **Type chaos: angka, _string_ kosong, dan halaman yang berbeda pendapat**: satu _field_ yang sama dikirim dengan tipe berbeda-beda tergantung halamannya, lalu bagaimana itu diterima di dunia yang _strict_.
4. **Dua _library_ UI, dua era penamaan**: warisan yang hidup berdampingan, dan konvensi yang berganti setiap ganti tukang.
5. **Dua sisi satu gedung**: penutup, refleksi, dan apa yang berubah setelah gedung sebelah jadi rumah sendiri.

Kalau Anda datang dari seri _backend_: selamat datang kembali, gedungnya masih sama, cuma pindah lantai. Kalau baru mampir, boleh mulai dari [episode pembuka seri sebelah](/writing/2026/hijrah-backend-01/), atau langsung di sini saja. Cerita ini tetap bisa dinikmati sendiri kok, hehe~

## Tetangga Baru Gedung Sebelah

Saya datang sebagai turis, tapi sekarang _frontend_ warisan ini ikut jadi tanggung jawab saya. Isinya sudah kelihatan: _spaghetti_, dua _library_ UI, dan 76 halaman yang harus tetap jalan setelah pindah.

Selanjutnya saya mulai mencatat barang-barang yang ikut naik kereta. Ternyata daftarnya lebih panjang dari dugaan saya.

[^1]: Satu file itu bukan salah siapa-siapa; dia jenazah _backup_ yang setia menemani, sama seperti puluhan jenazah berkomentar yang pernah saya temui di _backend_.

[^2]: Angka halaman dan rincian format dihitung langsung dari _repo_ saat episode ini ditulis; detail _stack_ lain disederhanakan untuk bercerita.
