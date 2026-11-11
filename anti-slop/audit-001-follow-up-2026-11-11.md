# Audit 001 Follow-up: Revisi najib.id 2026

**Tanggal:** 2026-11-11  
**Laporan asal:** [audit-001-2026-11-11.md](audit-001-2026-11-11.md)  
**Otorisasi:** Pemilik menyetujui rekomendasi 1 sampai 5, lalu meminta rekomendasi 6 dikerjakan juga.

## Yang diubah

### 1. Sisa template di lima artikel

- `## What's Next` dan `## CTA` pada `decode-packet-gt06-teltonika`, `geofencing-postgis`, `gps-data-postgresql-timescaledb`, `memahami-gps-protocol` (versi Indonesia) diganti satu bagian "Selanjutnya dalam Seri Ini" yang memuat navigasi seri, ajakan kontak, dan penutup "Sekian. Salam.".
- `workflow-ai-assisted-development`: dua bagian digabung menjadi satu bagian "Berikutnya", CTA ganda dihapus.
- Versi Inggris: hanya heading `## CTA` yang dihapus pada empat artikel. Heading "What's Next" tetap karena memang bahasa Inggris.

### 2. Hijrah Frontend 05

- Rujukan ke lelucon "visa turis dan KTP" yang tidak ada di episode 1 diganti rujukan ke "turis" yang memang ada di episode 1.
- Kalimat "jaring pengaman kecil yang masih berupa angsuran" ditulis ulang.
- Kalimat pengantar yang menggantung ("saya pisahkan catatannya seperti ini:") dihapus.

### 3. Klaim tanpa konteks ukur

Ditulis ulang tanpa angka baru, di versi Indonesia dan Inggris:

- `gps-data-postgresql-timescaledb`: klaim "menit menjadi detik" di production diganti hasil uji lokal yang sudah ada di artikel (158 ms ke 0,5 ms, dataset kecil).
- `tcp-listener-gps-go`: "50.000" dan "ratusan ribu koneksi" diganti pernyataan bahwa batasnya bergantung pada memori, file descriptor, dan beban kerja.
- `legacy-php-to-go-migration`: "meningkat signifikan ... angka yang pantas" menjadi "naik dari hampir tidak ada".
- `tech-stack-migration-decision`: contoh angka (2 hari ke 2 minggu, bug naik 30%, onboarding 4 minggu) diganti daftar hal yang perlu diukur.

### 4. realtime-pipeline-reliability (draft)

- Semua em dash dihapus (versi Indonesia dan Inggris).
- Disclaimer dikurangi menjadi satu di pembuka, ditulis dengan "saya". Kalimat "Jangan menyebutnya durable queue" dan disclaimer penutup skenario sintetis dihapus.
- Kalimat penutup berbentuk aforisme dihapus, diganti CTA dan "Sekian. Salam." (versi Indonesia).

### 5. Seri Hijrah

- Bagian "Catatan" bernomor di `hijrah-backend-06`, `hijrah-backend-09`, `hijrah-frontend-02`, `hijrah-frontend-04` diubah menjadi paragraf, hanya memakai isi yang sudah ada. Klaim absolut di backend-06 ("satu-satunya aturan yang bertahan") dilunakkan.
- `hijrah-backend-07`: "hehe/hahaha" dari 8 menjadi 4. Yang dipertahankan menempel pada lelucon atau pengakuan salah.
- Sapaan "Anda" menjadi "kamu" di `hijrah-backend-09` dan `hijrah-frontend-01`.

### 6. Pola "bukan X, tapi Y" dan aforisme (versi Indonesia)

Dikurangi di tempat pola itu menggantikan pernyataan langsung atau berulang. Satu pola per artikel dipertahankan bila menjadi inti argumen.

- `miss-calculation-in-business-process-automation`: sekitar delapan pola menjadi dua. "Buat saya" di awal kalimat dihapus (tersisa dalam bentuk "yang menarik buat saya"). Aforisme berhuruf tebal ("Manusia bisa terbiasa dengan risiko") menjadi klausa biasa. Pengulangan momen Rp8 miliar di bagian penutup dihapus; momen itu tetap diceritakan di pembuka dan bagian tengah.
- `tech-stack-migration-decision`: "Dari sisi bisnis" dari empat kali menjadi satu, tiga lainnya diganti pembuka berbeda. "Debug-nya bukan soal logika, tapi..." dan "bukan karena kurang ide, tapi..." disederhanakan.
- `hijrah-frontend-03`: aforisme "Go tidak menciptakan chaos; ia hanya berhenti memaafkannya" ditulis lebih lugas. "Jaring pengaman ke-400" dihapus karena angka itu tidak sejalan dengan hitungan 194.
- `hijrah-backend-06`: "bukan sekadar sesuatu yang harus diingat" dihapus karena mengulang kalimat sebelumnya.
- `business-process-automation-with-rpa-uipath`: penutup "bukan soal menggantikan manusia, tapi..." menjadi pernyataan langsung.

Tidak diubah: `explaining-bugs-to-non-tech` (pola "bukan menyederhanakan, tapi menerjemahkan" adalah tesis artikelnya) dan `tech-stack-ego-vs-business` (pola itu inti sikapnya). Versi Inggris tidak diubah untuk rekomendasi ini.

## Tidak dikerjakan, dan alasannya

- **Penyatuan footnote disclaimer.** Setiap footnote memuat catatan spesifik (misalnya orde besaran kapasitas dan tanggal sensus) dan dirujuk dari badan teks. Menghapusnya berisiko memutus rujukan atau membuang caveat yang bermakna.
- **Sudut "saya" berbasis pengalaman di `realtime-pipeline-reliability`.** Isi artikel tetap prinsip. Anekdot atau keputusan nyata harus datang dari penulis; saya tidak mengarangnya.
- **Angka 194 di Hijrah Frontend 03 dan 05.** Rincian "hampir dua ratus `String()` ditambah lebih dari dua puluh `Number()`" tidak bisa dicocokkan tanpa repo sumber, jadi angkanya tidak diubah.
- **Bagian "Catatan" bernomor di `hijrah-backend-02` sampai `05`, rekap di artikel lain, dan versi Inggris seri Hijrah.** Di luar yang disebut audit.

## Verifikasi

- Tidak ada em dash di seluruh `2026/*/index.md` dan `index.en.md`.
- Tidak ada heading `## What's Next` atau `## CTA` tersisa di versi Indonesia, dan `## CTA` di versi Inggris.
- Tidak ada "Anda" tersisa di seri Hijrah, dan rujukan "visa/KTP" di FE-05 sudah hilang.
- Daftar "Catatan" bernomor di lima artikel yang diubah sudah menjadi paragraf.
- Status draft tidak berubah (7 artikel `draft: true`).
- Build Hugo di memori berhasil (`WEB3FORMS_KEY=test hugo --renderToMemory`, tanpa error). Tanpa variabel itu build berhenti oleh pemeriksaan env yang sudah ada sebelum perubahan ini, tidak terkait revisi.
