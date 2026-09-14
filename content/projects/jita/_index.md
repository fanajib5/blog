---
title: "JITA, Japan Industry Training Academy"
description: "Ekosistem digital dua arah yang menjembatani talenta profesional Indonesia dengan industri Jepang melalui integrasi SSO ICE Center ITB, automated Japanese CV builder (Rirekisho), dan two-way job matching."
date: 2026-09-01
lastmod: 2026-09-14T00:00:00+07:00
draft: false
comments: false
project_type: "Client Project / Web Platform"
tech_stack: ["React", "TypeScript", "Vite", "Node.js", "Express", "MySQL", "JWT/SSO", "Docker"]
live_url: "https://jijp.akordium.id"
repo_url: ""
results: ["Integrasi SSO ICE Center ITB (JWT RS256)", "Automated Japanese CV Builder (Rirekisho PDF)", "Two-Way Job Matching (Apply & Scout)"]
---

## Masalah

Terdapat kebutuhan besar dari industri Jepang akan tenaga profesional terampil dari luar negeri, namun proses rekrutmen dan persiapan talenta dari Indonesia sering kali menghadapi hambatan:

- **Kompleksitas format dokumen kerja Jepang**: Format Curriculum Vitae resmi Jepang (*Rirekisho* / 履歴書) memiliki struktur yang sangat ketat, kaku, dan spesifik. Pengisian manual oleh kandidat sering menghasilkan kesalahan format yang menurunkan peluang lolos seleksi.
- **Verifikasi kualifikasi yang terpecah**: Perusahaan mitra industri di Jepang (*Mitra Jinzai*) membutuhkan kepastian validitas sertifikasi bahasa (JLPT N5–N1), identitas resmi, dan rekam jejak pelatihan kandidat sebelum mengajukan tawaran.
- **Ketiadaan kanal pencarian dua arah**: Kebanyakan platform hanya bersifat satu arah (kandidat melamar lowongan), tanpa mekanisme bagi mitra perusahaan Jepang untuk mencari dan mengundang talenta berprestasi secara proaktif (*talent scouting*).

## Solusi

Dikembangkan platform terpadu **JITA (Japan Industry Training Academy)** (demo: [jijp.akordium.id](https://jijp.akordium.id)) sebagai ekosistem digital dua arah yang mencakup siklus karier lengkap kandidat: mulai dari pelatihan, sertifikasi, pelacakan progres, verifikasi dokumen, pembuatan CV standar Jepang, hingga penempatan kerja.

### Fitur Utama

1. **Autentikasi Terintegrasi (SSO ICE Center ITB)**:
   - Single Sign-On berbasis JWT (RS256) terintegrasi langsung dengan portal **ICE Center ITB**.
   - Mekanisme *auto-provisioning* akun dan sinkronisasi profil talenta secara otomatis.

2. **Automated Japanese CV Builder (*Rirekisho* PDF)**:
   - Pembuatan dokumen CV standar industri Jepang (*Rirekisho* / 履歴書) secara otomatis ke format PDF presisi tinggi.
   - Dukungan tipografi bahasa Jepang lengkap menggunakan font *Noto Sans CJK JP*.

3. **Track Record & Document Vault**:
   - Kalender jadwal kelas pelatihan, silabus modul, dan evaluasi progres kompetensi.
   - Penyimpanan terenkripsi untuk berkas pribadi (KTP, transkrip, sertifikat JLPT) yang diverifikasi manual oleh staf admin.

4. **Two-Way Job Matching (Apply & Scout)**:
   - **Apply**: Kandidat yang terverifikasi dapat melamar lowongan kerja mitra industri di Jepang.
   - **Scout**: Perusahaan mitra Jepang dapat menelusuri katalog talenta terverifikasi dan mengirimkan undangan interview langsung.

### Stack Teknis

| Komponen | Teknologi |
|----------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express, `mysql2/promise` |
| Database | MySQL |
| Autentikasi | JWT RS256 (SSO ICE Center ITB) |
| Dokumen Engine | PDF Generator (Noto Sans CJK JP) |
| Notifikasi | Nodemailer (SMTP), In-App Notification |
| Infrastruktur | Docker, Coolify, Nginx Reverse Proxy |

## Hasil

- **Integrasi SSO yang mulus**: Mempermudah onboarding ratusan talenta dari ekosistem ICE Center ITB tanpa registrasi manual berulang.
- **Standarisasi CV Jepang 100%**: Mengeliminasi kesalahan penulisan dan tata letak *Rirekisho* melalui generator PDF otomatis.
- **Peluang rekrutmen dua arah**: Mempercepat proses matchmaking antara kandidat kompeten dengan mitra korporasi di Jepang.

## Pelajaran

1. **Standarisasi dokumen lintas budaya**: Membangun generator *Rirekisho* mengajarkan bahwa tata letak dokumen di Jepang bukan sekadar masalah estetika, melainkan standar kepatuhan operasional yang menentukan kredibilitas kandidat.
2. **Resiliensi arsitektur SSO**: Integrasi SSO antar-sistem independen memerlukan penanganan edge-case yang matang (token expiry, signature verification RS256, auto-provisioning fallback) agar alur autentikasi pengguna tidak terputus.
3. **Membangun kepercayaan via verification layer**: Di platform ketenagakerjaan lintas negara, dashboard verifikasi admin untuk memvalidasi KTP dan sertifikat kompetensi adalah fondasi utama agar mitra industri percaya pada kualitas talenta yang terdaftar.
