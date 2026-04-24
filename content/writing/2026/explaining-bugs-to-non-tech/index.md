---
title: "Kenapa Satu Bug Bisa Tiga Hari?"
description: "Kenapa memperbaiki satu bug kecil bisa memakan waktu berhari-hari, dan bagaimana menjelaskannya ke orang non-teknis agar tidak terjadi miskomunikasi."
author: "Faiq Najib"
date: 2026-04-16
lastmod: 2026-04-16
draft: false
toc: true
comments: false
tags:
  - communication
  - soft-skill
  - teaching
---

_"Ini cuma bug kecil kan? Paling 5 menit selesai."_

Pernah denger kalimat ini? Atau mungkin variasinya: _"Tinggal ganti satu baris doang, kan?"_, _"Kok bisa seharian cuma buat fix ini?"_

Kalau kamu _developer_, hampir pasti pernah. Dan kalimat itu biasanya datang dari atasan, _project manager_, atau _client_, orang yang tidak perlu tahu apa itu _N+1 query_, tapi perlu tahu **kenapa sesuatu yang terlihat simpel memakan waktu yang tidak simpel**.

Ini bukan tentang menyalahkan siapa. Ini tentang **kenapa _gap_ komunikasi ini terjadi dan bagaimana menutupinya**.

## Anatomi "1 Bug = 3 Hari"

Ceritanya begini. Ada _bug_: **data laporan tidak muncul di dashboard**. Di _surface_, terlihat simpel, tinggal _fix_ tampilannya, kan?

Ternyata, setelah diperiksa:

1. **Datanya tidak ada**: bukan masalah tampilan, tapi _query_ yang seharusnya menyimpan data ke database tidak berjalan di kondisi tertentu
2. **Query-nya bermasalah**: ada kondisi _race condition_ yang muncul saat 2 user mengakses bersamaan
3. **Skema database perlu diubah**: untuk menangani _race condition_ itu, perlu tambah _constraint_ baru
4. **Data existing harus di-migrasi**: perubahan skema berarti data yang sudah ada harus disesuaikan
5. **Harus di-test**: dan bukan cuma _test case_ baru, tapi juga memastikan fitur lama tidak _break_

Jadi, yang terlihat _"data tidak muncul"_ sebenarnya adalah: **bug di _query_ → _race condition_ → perubahan skema → migrasi data → _testing_ end-to-end**. Dari "ganti satu baris" menjadi "sentuh 4 _layer_ sistem".

### Analogi Rumah Bocor

Bayangkan kamu lapor ke pemilik rumah: _"Ada noda di dinding."_

Pemilik rumah pikir: _"Ah, tinggal cat ulang. 30 menit beres."_

Tapi setelah diperiksa ternyata:

- Noda di dinding karena **pipa di balik tembok bocor**
- Pipa bocor karena **sambungan sudah berkarat**
- Sambungan berkarat karena **ventilasi di atap tersumbat**, jadi uap air menumpuk
- Untuk fix semuanya, harus **buka atap dulu**, baru ganti pipa, baru cat ulang dinding

Pemilik rumah melihat noda. Tukang melihat pipa, sambungan, ventilasi, dan atap. Keduanya melihat masalah yang sama, tapi **tingkat kedalaman yang berbeda**.

Ini yang terjadi antara atasan dan _developer_.

## Tiga Langkah Menjelaskan Masalah Teknis

Setelah beberapa kali mengalami _miskomunikasi_ (dan belajar dari kesalahan), saya menemukan pola yang konsisten membantu. Saya sebut **Terjemah, Visualkan, Kaitkan**.

### 1. Terjemah: Dari Bahasa Teknis ke Bahasa Risiko

Kesalahan paling umum: menjelaskan masalah teknis dengan istilah teknis.

**Tidak efektif:**
> _"Ada N+1 query di endpoint laporan. Setiap kali load, dia query satu-satu ke database. Kalau datanya 1000 row, berarti 1001 query. Makanya lambat."_

Atasan tidak peduli berapa _query_-nya. Yang dia pedulikan: **dampaknya ke bisnis apa?**

**Lebih efektif:**
> _"Sistem sekarang mengambil data satu per satu, padahal datanya bisa ratusan. Jadi semakin banyak data, semakin lambat. Kalau dibiarkan, saat user mencapai seribu, halaman laporan bisa load sampai 30 detik, user akan berpikir sistemnya error dan meninggalkan aplikasi."_

Perhatikan pergeserannya:

| Bahasa Developer | Bahasa Bisnis |
|---|---|
| N+1 query | Semakin banyak data, semakin lambat |
| 1001 query | Load sampai 30 detik |
| Perlu _refactor_ | Kalau dibiarkan, user akan pergi |

Bukan berarti kamu menyederhanakan, kamu **menterjemahkan konsekuensinya**.

### 2. Visualkan: Pakai Analogi, Bukan Diagram Arsitektur

Diagram arsitektur bagus untuk sesama _developer_. Untuk non-teknis, analogi jauh lebih kuat.

Beberapa analogi yang sering saya pakai:

- **_Refactoring_** = merenovasi rumah yang sudah berdiri. Tidak bisa cuma ganti lantai tanpa cek fondasinya dulu.
- **_Technical debt_** = utang bank. Bisa ambil jalan pintas sekarang (utang), tapi suatu saat harus dibayar, dengan bunga.
- **_Testing_** = sabuk pengaman. Tidak membuat mobil jadi lebih cepat, tapi membuat kecelakaan tidak menjadi bencana.
- **_Race condition_** = dua orang mau masuk pintu yang sama dari arah berlawanan. Kalau tidak ada aturan siapa dulu, bisa saling menghalangi.
- **_Deployment_** = ganti ban mobil saat jalan. Harus hati-hati supaya penumpang tidak merasakan.

Kuncinya: analogi harus dari dunia yang **familiar** bagi pendengar. Kalau atasanmu dari dunia keuangan, pakai analogi investasi. Kalau dari dunia _marketing_, pakai analogi _campaign_.

### 3. Kaitkan ke Prioritas Mereka

Atasan punya prioritas yang berbeda dengan _developer_. Prioritas kita: kode bersih, _maintainable_, _scalable_. Prioritas mereka: **deadline, budget, risiko**.

Jadi saat menjelaskan, kaitkan ke prioritas mereka:

- _"Kalau kita fix sekarang dengan 2 hari, kita mencegah downtime yang bisa 10x lebih mahal nanti."_
- _"Ini bukan tentang membuat fitur baru, ini tentang memastikan fitur yang sudah jalan tidak tiba-tiba berhenti."_
- _"Risikonya: kalau tidak ditangani, data laporan bisa tidak akurat. Dan data laporan itu yang dipakai untuk keputusan bisnis."_

Kalimat _"technical debt"_ mungkin tidak menggerakkan atasan. Tapi _"kalau tidak ditangani sekarang, kita bisa kehilangan data transaksi"_, itu baru didengar.

## Template Praktis

Saat harus menjelaskan masalah teknis ke non-teknis, saya pakai _template_ singkat ini:

> **Apa yang terjadi?** (1–2 kalimat, tanpa jargon)
>
> **Apa dampaknya?** (ke user / ke bisnis / ke timeline)
>
> **Berapa lama untuk fix?** (estimasi realistis, bukan optimistis)
>
> **Apa rencananya?** (langkah-langkah besar, tanpa detail teknis)
>
> **Apa risikonya kalau ditunda?** (ini yang sering membuat keputusan lebih cepat)

Contoh:

> **Apa yang terjadi?** Laporan bulanan tidak menampilkan data yang diinput setelah tanggal 15.
>
> **Apa dampaknya?** Manajer tidak bisa lihat data lengkap untuk keputusan bulan ini.
>
> **Berapa lama?** 2–3 hari.
>
> **Rencananya?** Perbaiki cara sistem menyimpan data, sesuaikan data yang sudah ada, dan pastikan fitur lain tidak terpengaruh.
>
> **Risiko kalau ditunda?** Data bisa makin banyak yang hilang, dan perbaikannya makin lama karena jumlah data yang harus disesuaikan makin besar.

Singkat, jelas, dan, yang paling penting, **tidak ada istilah teknis**.

## Komunikasi Itu Skill

Banyak _developer_, termasuk saya dulu, berpikir bahwa kalau kode sudah bagus, kerjaan sudah selesai. Tapi kenyataannya, **kalau tidak bisa dijelaskan, tidak akan didukung**. Dan tanpa dukungan, baik itu waktu, resource, atau kepercayaan, kode terbaik pun tidak akan pernah _deploy_.

Komunikasi bukan bakat. Ini _skill_ yang bisa dilatih, persis seperti menulis kode. Setiap kali kamu menjelaskan masalah teknis ke non-teknis, kamu _sharpen_ skill itu. Awalnya mungkin canggung. Tapi lama-lama, jadi refleks.

Dan refleks itu sangat berguna, bukan cuma di dunia kerja, tapi juga saat mengajar. Karena mengajar, pada dasarnya, adalah menjelaskan hal kompleks dengan cara yang _accessible_.

Kalau kamu tertarik dengan topik _teaching_ dan komunikasi teknik, atau punya pengalaman serupa yang ingin didiskusikan, [hubungi saya](/contact/).

---

_Tag: [communication](/tags/communication/) · [soft-skill](/tags/soft-skill/) · [teaching](/tags/teaching/)_
