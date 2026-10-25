---
title: "Kenapa Satu Bug Bisa Tiga Hari?"
description: "Catatan kenapa memperbaiki satu bug kecil bisa makan waktu berhari-hari, dan cara menjelaskannya ke orang non-teknis supaya tidak salah paham."
author: "Faiq Najib Al-Aziz"
date: 2026-04-16
lastmod: 2026-09-11T09:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - communication
  - soft-skill
  - teaching
---

_"Ini cuma bug kecil kan? Paling 5 menit selesai."_

Pernah denger kalimat ini? Atau variasinya: _"Tinggal ganti satu baris doang, kan?"_ dan _"Kok bisa seharian cuma buat fix ini?"_

Kalau kamu _developer_, kemungkinan besar pernah dengar dari atasan, _project manager_, atau _client_. Saya sendiri sudah beberapa kali, dan jujur reaksi pertama saya dulu cuma senyum kecut hehe. Padahal mereka memang tidak wajib tahu apa itu _N+1 query_. Yang perlu mereka tahu cuma **kenapa sesuatu yang kelihatannya sepele bisa lama**.

Nah, mari saya ceritakan apa saja yang bisa terjadi di balik bug yang kelihatannya sepele itu, lalu cara saya menjelaskannya.

## Anatomi "1 Bug = 3 Hari"

Misalnya ada _bug_: **data laporan tidak muncul di dashboard**. Sekilas kelihatan gampang, tinggal benerin tampilannya, kan?

Ternyata setelah diperiksa:

1. **Datanya memang tidak ada**: bukan soal tampilan. _Query_ yang harusnya menyimpan data ke database tidak jalan di kondisi tertentu.
2. **Query-nya bermasalah**: ada _race condition_ yang muncul kalau 2 user mengakses bersamaan.
3. **Skema database perlu diubah**: untuk menangani _race condition_ tadi, perlu tambah _constraint_ baru.
4. **Data yang sudah ada harus dimigrasi**: skema berubah, jadi data lama ikut disesuaikan.
5. **Harus di-test**: bukan cuma _test case_ baru, tapi juga memastikan fitur lama tidak ikut rusak.

Jadi yang tadinya kelihatan _"data tidak muncul"_ ternyata rantainya begini: **bug di _query_ → _race condition_ → perubahan skema → migrasi data → _testing_ end-to-end**. Dari "ganti satu baris" jadi menyentuh 4 _layer_ sistem. Ya... lumayan juga hahaha.

### Analogi Rumah Bocor

Bayangkan kamu lapor ke pemilik rumah: _"Pak, ada noda di dinding."_

Pemilik rumah pikir: _"Ah, tinggal cat ulang. 30 menit beres."_

Tapi setelah diperiksa ternyata:

- Noda di dinding karena **pipa di balik tembok bocor**
- Pipa bocor karena **sambungannya sudah berkarat**
- Sambungan berkarat karena **ventilasi di atap tersumbat**, jadi uap air menumpuk
- Untuk memperbaiki semuanya, **atap harus dibuka dulu**, baru ganti pipa, baru cat ulang dinding

Pemilik rumah melihat noda. Tukang melihat pipa, sambungan, ventilasi, dan atap. Masalahnya sama, tapi yang kelihatan oleh masing-masing beda.

Begitu juga kalau atasan dan _developer_ ngobrolin bug.

## Tiga Langkah Menjelaskan Masalah Teknis

Setelah beberapa kali salah paham (dan sempat kesal sendiri), saya menemukan pola yang lumayan membantu: **Terjemah, Visualkan, Kaitkan**. Namanya saya karang sendiri ya, jangan dicari di buku mana pun.

### 1. Terjemah: Dari Bahasa Teknis ke Bahasa Risiko

Jangan berhenti di istilah teknis. Jelaskan dampaknya.

**Kurang efektif:**
> _"Ada N+1 query di endpoint laporan. Setiap kali load, dia query satu-satu ke database. Kalau datanya 1000 row, berarti 1001 query. Makanya lambat."_

Daripada cuma menyebut jumlah _query_, ceritakan **dampaknya ke bisnis**.

**Lebih efektif:**
> _"Sistem sekarang mengambil data satu per satu, padahal datanya bisa ratusan. Jadi makin banyak data, makin lambat. Kalau dibiarkan, saat user mencapai seribu, halaman laporan bisa load sampai 30 detik. User akan mengira sistemnya error lalu pergi."_

Contohnya:

| Bahasa Developer | Bahasa Bisnis |
|---|---|
| N+1 query | Makin banyak data, makin lambat |
| 1001 query | Load sampai 30 detik |
| Perlu _refactor_ | Kalau dibiarkan, user akan pergi |

Kamu bukan sedang menyederhanakan masalah, tapi **menerjemahkan konsekuensinya**.

### 2. Visualkan: Pakai Analogi, Bukan Diagram Arsitektur

Kalau pendengar tidak akrab dengan diagram arsitektur (dan jujur, kebanyakan memang tidak), analogi sehari-hari jauh lebih membantu.

Beberapa analogi yang sering saya pakai:

- **_Refactoring_** = merenovasi rumah yang sudah berdiri. Tidak bisa asal ganti lantai tanpa cek fondasinya dulu.
- **_Technical debt_** = utang bank. Bisa ambil jalan pintas sekarang, tapi suatu saat harus dibayar, plus bunga.
- **_Testing_** = sabuk pengaman. Mobil tidak jadi lebih cepat, tapi kecelakaan tidak berubah jadi bencana.
- **_Race condition_** = dua orang mau masuk lewat pintu yang sama dari arah berlawanan. Kalau tidak ada aturan siapa duluan, ya saling halang.
- **_Deployment_** = ganti ban mobil sambil jalan. Harus hati-hati supaya penumpang tidak merasa.

Kuncinya: analogi harus dari dunia yang **familiar** buat pendengarnya. Kalau atasanmu orang keuangan, pakai analogi investasi. Kalau orang _marketing_, pakai analogi _campaign_.

### 3. Kaitkan ke Prioritas Mereka

Hubungkan penjelasanmu dengan hal yang perlu mereka putuskan, seperti **deadline, budget, dan risiko**:

- _"Kalau kita fix sekarang dengan 2 hari, kita mencegah downtime yang bisa 10x lebih mahal nanti."_
- _"Ini bukan soal bikin fitur baru, tapi memastikan fitur yang sudah jalan tidak tiba-tiba mati."_
- _"Risikonya: kalau tidak ditangani, data laporan bisa tidak akurat. Padahal data laporan itu yang dipakai untuk keputusan bisnis."_

## Template Praktis

Kalau harus menjelaskan masalah teknis ke non-teknis, saya pakai _template_ singkat ini:

> **Apa yang terjadi?** (1-2 kalimat, tanpa jargon)
>
> **Apa dampaknya?** (ke user / ke bisnis / ke timeline)
>
> **Berapa lama untuk fix?** (estimasi realistis, bukan yang optimistis)
>
> **Apa rencananya?** (langkah besarnya saja, tanpa detail teknis)
>
> **Apa risikonya kalau ditunda?** (ini yang sering bikin keputusan jadi lebih cepat)

Contoh:

> **Apa yang terjadi?** Laporan bulanan tidak menampilkan data yang diinput setelah tanggal 15.
>
> **Apa dampaknya?** Manajer tidak bisa lihat data lengkap untuk keputusan bulan ini.
>
> **Berapa lama?** 2-3 hari.
>
> **Rencananya?** Perbaiki cara sistem menyimpan data, sesuaikan data yang sudah ada, dan pastikan fitur lain tidak terpengaruh.
>
> **Risiko kalau ditunda?** Data yang hilang bisa makin banyak, dan perbaikannya makin lama karena data yang harus disesuaikan makin banyak.

## Dari Bug ke Dampak

Dua contoh laporan tadi kira-kira menunjukkan caranya: mulai dari data yang tidak muncul, lalu sampaikan dampak dan rencana perbaikannya. Kalau kamu punya pengalaman serupa waktu menjelaskan masalah teknis, [hubungi saya](/contact/). Siapa tahu bisa saling curhat hehe.

---

_Tag: [communication](/tags/communication/) · [soft-skill](/tags/soft-skill/) · [teaching](/tags/teaching/)_
