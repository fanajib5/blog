---
title: "Banking Process Automation & Open API Portal"
description: "Otomasi proses Treasury dan International Banking di bank nasional menggunakan RPA dan pengembangan Mega Open API portal, menghemat IDR 12 juta/bulan."
date: 2020-11-01
lastmod: 2026-04-15T00:00:00+07:00
draft: false
comments: false
project_type: "Internal System"
tech_stack: ["UiPath RPA", "Laravel", "PHP", "SQL Server", "Linux"]
live_url: ""
repo_url: ""
---

## Masalah

Bank nasional Indonesia dengan operasi Treasury dan International Banking yang menjalankan proses manual berulang:

- **Tax reporting** dan **bond settlement** membutuhkan sekitar 3 jam per proses
- Tingkat kesalahan manual yang tinggi pada proses repetitif
- Tidak ada visibilitas internal terhadap layanan banking yang tersedia
- Akses ke layanan banking untuk pihak eksternal belum terstandarisasi

## Solusi

Dua track parallel: **otomasi RPA** untuk proses backend dan **Open API portal** untuk akses layanan.

### Track 1: Process Automation (RPA)

Menggunakan **UiPath** untuk mengotomasi:
- Tax reporting workflow, dari data gathering hingga report generation
- Bond settlement process, dari instruction hingga confirmation
- Credit card dispute workflows, processing otomatis untuk selected use cases

### Track 2: Internal Dashboard & Open API

- **Internal dashboard** menggunakan Laravel + SQL Server untuk visibility operasional
- **Mega Open API portal**: memperkenalkan akses terstandarisasi ke layanan banking untuk penggunaan internal dan eksternal
- **Linux server configuration**: setup dan maintenance environment deployment

## Hasil

- **Proses time turun dari ~3 jam ke ~1 jam** per cycle (tax reporting & bond settlement)
- **Hemat IDR 12 juta per bulan** dari pengurangan biaya labor dan error-related costs
- **100% time savings** pada selected credit card dispute use cases vs manual
- Open API portal meningkatkan visibility dan akses ke layanan banking

## Pelajaran

1. **RPA bukan solusi untuk semua**: cocok untuk proses berulang dengan aturan jelas, tapi untuk proses yang butuh judgment, automation parsial lebih realistis daripada full automation
2. **Kalkulasi ROI penting**: mengukur impact dalam rupiah (IDR 12 juta/bulan) membuat stakeholder non-teknis memahami nilai dari investasi teknologi
3. **Banking domain knowledge**: memahami regulasi dan proses Treasury/Banking sama pentingnya dengan skill teknis di sektor finansial
