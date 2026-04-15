# Design: Clean Architecture — Dari Spaghetti Code ke Kode yang Bisa Dibaca Ulang

**Date**: 2026-04-15
**Author**: Faiq Najib
**Status**: Approved
**Category**: Blog Article (Teaching/Tutorial — Educator Angle)

## Context

Blog sudah punya artikel teknis tentang migrasi PHP ke Go dan artikel business/product thinking tentang keputusan migrasi. Artikel baru ini mengisi gap yang berbeda: **pengantar Clean Architecture untuk mahasiswa** — educational, accessible, dan berbasis proyek nyata. Ditulis sebagai pengalaman sharing dari "dulu juga pernah nulis spaghetti code."

## Decisions

- **Pendekatan**: "Dari Spaghetti ke Clean" — naratif before/after
- **Target reader**: Mahasiswa semester menengah (sudah bisa ngode, tahu MVC, belum kenal Clean Architecture)
- **Contoh kode**: Language-agnostic (pseudo-code)
- **Kedalaman**: Menengah (2000-3000 kata)
- **Bahasa**: Bilingual (Indonesian + English)
- **Konteks**: Proyek GPS tracker nyata (same project as other articles)
- **Visual**: ASCII/text diagram (no image files needed)
- **Gaya penulisan**: Mengikuti style Faiq — personal, conversational, technical terms in italics, humor ringan

## Article Design

### Judul
- **ID**: "Clean Architecture: Dari Spaghetti Code ke Kode yang Bisa Dibaca Ulang"
- **EN**: "Clean Architecture: From Spaghetti Code to Readable Code"

### Tags
- **ID**: `catatan`, `arsitektur`
- **EN**: `notes`, `architecture`

### Frontmatter
```yaml
title: "Clean Architecture: Dari Spaghetti Code ke Kode yang Bisa Dibaca Ulang"
description: "Pengantar Clean Architecture untuk mahasiswa — dari spaghetti code ke kode yang terstruktur, dengan contoh nyata dari proyek GPS tracker."
author: "Faiq Najib"
date: 2026-04-15
lastmod: 2026-04-15
draft: false
toc: true
comments: false
tags:
  - catatan
  - arsitektur
```

### Outline

#### 1. Opening Hook — "Kode yang Dulu Masuk Akal"
- Cerita personal: "saya juga pernah nulis kode yang saat itu _sense_, tapi 3 bulan kemudian bingung sendiri"
- Relatable untuk mahasiswa — semua pernah di posisi ini
- Set tone: ini bukan kuliah formal, ini sharing pengalaman

#### 2. Apa Itu "Spaghetti Code" dan Kenapa Kita Semua Pernah Menulisnya
- Definisi tanpa jargon berat
- Contoh pseudo-code dari GPS tracker — controller yang langsung query DB, business logic bercampur
- ASCII diagram: flow spaghetti vs flow terstruktur
- Kenapa ini masalah: sulit ditest, sulit diubah, sulit dipahami orang lain

#### 3. Clean Architecture: Intinya Sederhana Kok
- Penjelasan konsep — intinya, bukan teori lengkap Robert C. Martin
- Dependency Rule: "bergantung ke dalam, bukan ke luar"
- ASCII diagram: lingkaran layer (Entity → Use Case → Interface Adapters → Framework/DB)
- Fokus 3 layer penting untuk mahasiswa:
  - Entity — aturan bisnis inti
  - Use Case — apa yang sistem lakukan
  - Infrastructure — detail teknis (DB, API, framework)

#### 4. Langkah demi Langkah: Terapkan di GPS Tracker
- Before: pseudo-code spaghetti — satu fungsi nangkap semua
- Step 1: Pisahkan Entity — definisikan aturan bisnis
- Step 2: Buat Use Case — apa yang sistem lakukan, tanpa peduli DB
- Step 3: Infrastructure — implementasi detail (DB, API)
- After: kode "clean" — perbandingan dengan versi spaghetti
- Penekanan: setiap layer bisa di-test sendiri, diganti sendiri

#### 5. Kenapa Ini Penting Buat Kamu
- Relevansi untuk mahasiswa: skripsi, proyek kuliah, portofolio
- Clean Architecture bukan overengineering — ini soal memikirkan sebelum menulis
- Kapan boleh TIDAK pakai: proyek kecil, prototype — supaya tidak dogmatis

#### 6. Pelajaran
- 3-4 takeaway utama
- Format konsisten dengan artikel sebelumnya

### Writing Style
- First-person, conversational (sama seperti artikel lainnya)
- Technical terms in italics: _spaghetti code_, _entity_, _use case_, _infrastructure_
- Pseudo-code tanpa ikat bahasa tertentu — fokus konsep
- ASCII diagram untuk visualisasi layer
- Humor ringan: "hehe", "_yah_", informal expressions
- "Pelajaran" section at end
- Link ke artikel migrasi teknis untuk reader yang mau tahu lebih lanjut

### Files to Create
1. `content/writing/2026/clean-architecture-intro/index.md` (Indonesian)
2. `content/writing/2026/clean-architecture-intro/index.en.md` (English)

## Verification
- Hugo build succeeds (no new errors beyond existing WEB3FORMS_KEY issue)
- Both language versions render correctly
- TOC generates properly
- Tags link correctly
- ASCII diagrams render correctly in markdown
- Frontmatter is valid
