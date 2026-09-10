---
title: "Hijrah Frontend (1): Ketika Backend Engineer Disuruh Menyentuh Frontend"
description: "Ep 1 seri Hijrah Frontend: setelah backend GPS selesai dihijrahkan ke Go, giliran gedung sebelah. Kesan pertama seorang backend engineer membuka kode frontend warisan, dan keputusan port tipis."
author: "Faiq Najib Al-Aziz"
date: 2026-09-24T09:00:00+07:00
lastmod: 2026-09-11T02:45:00+07:00
draft: true
toc: true
comments: false
tags:
  - frontend
  - nextjs
  - cerita
series: "Hijrah Frontend"
---

Seri [Hijrah Backend](/writing/2026/hijrah-backend-01/) sudah tamat. Backend GPS sudah berdiri di Go, 14 modul domain tertata, _endpoint_ yang tadinya makan 15 detik sudah sembuh.

Nah, sekarang giliran gedung sebelah.

Saya seorang _backend engineer_. Dunia saya: _query_, _index_, _parser_ paket biner, dan kesejahteraan _database_. _Frontend_ adalah negeri yang saya kunjungi seperlunya, dengan visa turis. Dan episode ini cerita tentang saat visa turis itu dicabut, diganti KTP penduduk hehe~

## Kesan Pertama: Hidung Backend Tidak Menyatu

Saat mulai menyentuh _frontend_ warisan, satu hal langsung terasa: bahkan saya yang tidak jago _frontend_ bisa mencium bau _spaghetti_-nya, cukup dengan _mental model_ seorang programmer dan pengalaman bertahun-tahun membaca kode. Anda tidak perlu jago masak untuk tahu sup itu sudah tujuh hari; cukup hidung.

Dan bau itu bukan tuduhan. _Frontend_ itu apa adanya: dibangun bertahun-tahun, disentuh banyak orang dengan selera berbeda, bertahan hidup melayani puluhan ribu _user_ setiap hari. Sama persis dengan _backend_ yang pernah saya hijrahkan. Kok bisa gedung yang berbeda punya bau yang sama persis? Karena penjaganya sama: **waktu dan darurat** hehe~

## Keputusan: Fork, Bukan Rewrite

Setelah pengalaman [menghijrahkan _backend_](/writing/2026/hijrah-backend-01/), satu hal saya percaya: _rewrite_ total itu menarik di _slide_ dan menakutkan di produksi.

Jadi untuk _frontend_, keputusannya sejenis: **fork sistem lama, port tipis**. Bukan menggambar ulang dari nol dengan _framework_ termutakhir, tapi membawa aplikasi lama masuk ke rumah baru, apa adanya dulu. _Repo_-nya bahkan memakai nama yang sama persis; seolah dia sendiri belum diinformasikan bahwa ia sudah pindah haluan hahaha.

Dan di hari pertama membuka rumah baru itu, saya mulai menghitung isi lemari:

- **76 halaman** di _app router_[^2]: 60 berformat JSX, 15 berformat JS, dan satu file _backup_ yang tidur di antara mereka[^1]
- Dua _library_ UI besar yang hidup berdampingan di satu aplikasi yang sama
- _State management_ warisan yang sudah bertahun-tahun menjadi tukang kebun sekaligus tukang listrik
- Satu dokumen bernama `TAILWIND_FIX.md` di akar _repo_: monumen kecil untuk penyakit yang pernah sehat hehe~

Enam puluh di antaranya berformat JSX. Bukan keluhan; cuma pengingat bahwa negeri ini berbahasa lain. Saya yang biasa berteriak `if err != nil` kini harus belajar menenun _className_ hahaha.

## Kenapa Port Tipis, Bukan Redesign

Pertanyaan yang sama dengan di _backend_: kenapa tidak sekalian merombak total, sekalian rapi, sekalian modern?

Jawabannya juga sama: _user_ tidak peduli arsitektur internal Anda; mereka peduli tombol yang mereka tekan setiap hari tetap berperilaku sama. Merombak tampilan sambil memindahkan rumah itu dua perubahan sekaligus, dan [episode empat di seri backend](/writing/2026/hijrah-backend-04/) sudah menjelaskan harga dari memperbaiki sambil berpindah: perbaikan diam-diam adalah racun.

Jadi paritas versi _frontend_: tampilan dan perilaku dibawa dulu apa adanya, struktur internal dirapikan belakangan, satu keputusan satu waktu. Kode warisan yang ikut naik kereta dicatat, bukan disembunyikan. Episode kedua akan membahas persis apa saja yang ikut naik kereta itu, dan kenapa sebagian tetap harus ikut walau bau hehe~

## Peta Perjalanan

Seri **Hijrah Frontend** ini berisi lima episode:

2. **Port tipis dan warisan yang ikut naik**: apa saja yang terbawa dari rumah lama, sadar-sadar.
3. **Type chaos: angka, _string_ kosong, dan halaman yang berbeda pendapat**: bagaimana satu _field_ yang sama dikirim dengan tipe berbeda-beda tergantung halamannya, dan bagaimana hal itu diterima di dunia yang _strict_.
4. **Dua _library_ UI, dua era penamaan**: warisan yang hidup berdampingan, dan konvensi yang berganti setiap ganti tukang.
5. **Dua sisi satu gedung**: penutup, refleksi, dan apa yang berubah setelah gedung sebelah jadi rumah sendiri.

Kalau Anda datang dari seri _backend_: selamat datang kembali, gedungnya masih sama, cuma kita pindah lantai. Kalau Anda baru mampir: [episode pembuka seri sebelah](/writing/2026/hijrah-backend-01/) adalah tempat terbaik untuk mulai, atau langsung saja di sini; cerita ini berdiri sendiri hehe~

## Penutup

_Visa turis_ sudah dicabut. Sejak hari ini, _frontend_ warisan ini resmi jadi tanggung jawab saya juga: dengan segala _spaghetti_-nya, dua _library_ UI-nya, dan tujuh puluh enam halamannya yang menunggu dihitung ulang.

Episode berikutnya: inventaris warisan yang ikut naik kereta. Sampai ketemu di sana.

Terima kasih sudah tersasar ke sini dan membaca hehe. Semoga harimu menyenangkan!

Sekian. Salam.

[^1]: Satu file itu bukan salah siapa-siapa; dia jenazah _backup_ yang setia menemani, sama seperti puluhan jenazah berkomentar yang pernah saya temui di _backend_.

[^2]: Angka halaman dan rincian format dihitung langsung dari _repo_ saat episode ini ditulis; detail _stack_ lain disederhanakan untuk bercerita.
