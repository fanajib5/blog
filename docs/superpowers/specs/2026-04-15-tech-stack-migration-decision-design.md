# Design: Decision Journal — Kapan Tech Stack Harus Dimigrasi

**Date**: 2026-04-15
**Author**: Faiq Najib
**Status**: Approved
**Category**: Blog Article (Business/Product Thinking)

## Context

Artikel teknis tentang migrasi PHP ke Go sudah ada (`content/writing/2026/legacy-php-to-go-migration/`). Artikel itu fokus ke *bagaimana* migrasi dilakukan — service-repository pattern, incremental approach, dll.

Artikel baru ini mengisi gap yang berbeda: **bagaimana memutuskan kapan saatnya migrasi** — dari sudut pandang business/product thinking, bukan implementasi teknis. Ditulis sebagai "Decision Journal" yang merekonstruksi proses berpikir di balik keputusan migrasi.

## Decisions

- **Pendekatan**: Decision Journal (naratif personal)
- **Hubungan dengan artikel lama**: Berdiri sendiri — tidak perlu baca artikel teknis untuk paham
- **Target reader**: General — teknis dan non-teknis
- **Kedalaman**: Menengah (2000-3000 kata)
- **Bahasa**: Bilingual (Indonesian + English)
- **Konteks**: Proyek GPS tracker nyata (370+ endpoint, PHP ke Go)

## Article Design

### Judul
- **ID**: "Catatan Keputusan: Kapan Tech Stack Harus Dimigrasi"
- **EN**: "Decision Journal: When It's Time to Migrate Your Tech Stack"

### Tags
- **ID**: `catatan`, `arsitektur`, `migration`
- **EN**: `notes`, `architecture`, `migration`

### Frontmatter
```yaml
title: "Catatan Keputusan: Kapan Tech Stack Harus Dimigrasi"
description: "Sebuah catatan pengambilan keputusan — kapan tech stack yang sudah ada perlu dimigrasi, kapan cukup di-refactor, dan bagaimana membaca sinyal dari sisi bisnis."
author: "Faiq Najib"
date: 2026-04-15
lastmod: 2026-04-15
draft: false
toc: true
comments: false
tags:
  - catatan
  - arsitektur
  - migration
```

### Outline

#### 1. Opening Hook — Momen Ketika Saya Tahu
- Cerita personal: momen spesifik di proyek GPS tracker ketika saya menyadari "ini bukan lagi soal refactor, ini butuh migrasi"
- Analogi relatable: renovasi rumah vs pindah rumah
- Set tone: ini bukan artikel teknis, ini catatan proses berpikir

#### 2. Kondisi Sistem Saat Itu
- Deskripsi singkat kondisi GPS tracker (tanpa terlalu teknis)
- Fokus pada **gejala bisnis**:
  - Fitur baru yang seharusnya 2 hari jadi 2 minggu
  - Bug yang "tidak bisa direproduksi" tapi muncul di production
  - Onboarding developer baru makin lama
  - Fear setiap deploy
- Hindari jargon berat — aksesibel untuk reader non-teknis

#### 3. Pertanyaan-Pertanyaan yang Saya Ajukan
Bagian inti — pertanyaan evaluatif beserta jawaban kontekstual:
1. "Apakah masalahnya di _tool_ atau di cara kita pakai?"
2. "Kalau kita refactor saja, apakah cukup?"
3. "Berapa biaya dari TIDAK melakukan apa-apa?"
4. "Apakah tim kita bisa menangani migrasi?"
5. "Kapan kita tahu migrasi itu berhasil?"

#### 4. Kerangka Berpikir: Bukan Soal Bahasa, Soal Momentum
Framework sederhana — **3 kondisi yang harus dipenuhi**:
1. Masalah struktural, bukan masalah _skill_
2. Biaya _inaction_ sudah terukur dan nyata
3. Tim punya kapasitas untuk menjalankan

Kenapa kalau salah satu tidak terpenuhi, lebih baik tahan dulu.

#### 5. Keputusan dan Apa yang Terjadi Setelahnya
- Cerita singkat hasil keputusan (tanpa detail teknis)
- Fokus pada: apa yang berubah di sisi bisnis/product?
- Link ke artikel migrasi teknis untuk detail implementasi

#### 6. Pelajaran
- Format konsisten dengan artikel sebelumnya
- 3-4 takeaway utama

### Writing Style (from existing articles)
- First-person perspective, conversational
- Technical terms in italics: _codebase_, _deploy_, _refactor_
- Occasional humor: "hehe", informal expressions
- Religious/cultural elements where natural: "Alhamdulillah"
- Structured with clear headings (##, ###)
- TOC enabled
- "Pelajaran" section at the end
- Closing with natural ending, no forced sign-off

### Files to Create
1. `content/writing/2026/tech-stack-migration-decision/index.md` (Indonesian)
2. `content/writing/2026/tech-stack-migration-decision/index.en.md` (English)

## Verification
- Hugo build succeeds: `hugo build`
- Both language versions render correctly
- TOC generates properly
- Tags link correctly
- Internal links (to migration article) work
- Frontmatter is valid
