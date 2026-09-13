---
title: "Otomasi Google Apps Script dengan Bantuan AI"
description: "Menghilangkan pekerjaan berulang di Google Workspace dengan Apps Script — dan cara membuat AI menuliskannya dengan benar: pisahkan logika dari layanan Google, uji di lokal, baru tempel ke editor."
author: "Faiq Najib Al-Aziz"
date: 2026-11-10
lastmod: 2026-11-10
draft: true
toc: true
comments: true
images:
  - og.png
tags:
  - ai
  - automation
  - productivity
  - workflow
pillar: "ai-dev"
---

Di setiap bisnis ada pekerjaan kelas ini: terlalu kecil untuk dibuat aplikasi, terlalu sering untuk dikerjakan manual. Mengingatkan klien yang invoice-nya mau jatuh tempo. Merekap submitan Google Form tiap akhir pekan. Menyalin data antar-spreadsheet. Kalau hidupmu ada di Google Workspace, jawaban untuk kelas pekerjaan ini sudah menunggu sejak lama: **Google Apps Script** — JavaScript yang berjalan di server Google, punya akses langsung ke Sheets, Gmail, dan Calendar, gratis untuk akun biasa.

Masalahnya bukan bahasanya, tapi dua hal: menulis skrip dari nol itu membosankan, dan _debugging_ di editor Apps Script itu menyiksa (log kecil, tanpa breakpoint yang layak, eksekusi lambat). Masukkan AI ke persamaan dan kamu dapat kombinasi yang manis — **kalau** tahu cara memakainya.

Artikel ini studi kasus nyata: reminder invoice otomatis dari Google Sheets, ditulis dengan bantuan AI dan diuji di laptop saya sebelum sekali pun menyentuh editor Google.

## Kasus: Reminder Invoice dari Spreadsheet

Spreadsheet-nya sederhana — lima kolom:

```text
A: Nama Klien      B: Nominal     C: Jatuh Tempo   D: Status   E: Terakhir Reminder
PT Maju Jaya       7.500.000      12/11/2026       UNPAID
CV Berkah          1.200.000      11/11/2026       UNPAID
PT Sejahtera       3.000.000      01/12/2026       UNPAID
```

Kebutuhannya: sekali sehari, kirim email ke klien yang invoice-nya jatuh tempo dalam ≤ 3 hari, lalu catat tanggal reminder-nya supaya tidak spam. Skenario pinggiran yang harus benar: invoice yang sudah lunas dilewati, yang sudah lewat jatuh tempo tidak ditagih dua kali, dan yang sudah diingatkan kemarin tidak diingatkan lagi hari ini.

## Kunci Workflow: Pisahkan Logika dari Layanan Google

Kalau kamu minta AI "buatkan script Apps Script reminder invoice", dia akan menghasilkan satu gumpalan kode: baca sheet, hitung tanggal, format email, kirim, tulis balik — semuanya karam dan **tidak bisa diuji** tanpa menjalankannya di Google. Setiap iterasi perbaikan = deploy mental ke editor Google dan menebak-nebak dari log.

Workflow yang benar (dan yang saya pakai): minta AI memecah jadi dua lapis.

**Lapisan 1 — logika murni**, JavaScript polos tanpa satu pun panggilan layanan Google:

```javascript
function filterDueInvoices(rows, today, leadDays) {
  // rows: [[klien, nominal, dueDate (Date), status, terakhirReminder (Date|null)], ...]
  const soon = [];
  for (const r of rows) {
    const [klien, nominal, due, status, terakhir] = r;
    if (status !== "UNPAID") continue; // lunas → skip
    const daysLeft = Math.ceil((due - today) / 86400000);
    if (daysLeft < 0 || daysLeft > leadDays) continue; // lewat / terlalu jauh → skip
    if (terakhir && (today - terakhir) / 86400000 < 3) continue; // dedup 3 hari
    soon.push({ klien, nominal, due, daysLeft });
  }
  return soon;
}

function composeReminderEmail(inv) {
  const tgl = Utilities.formatDate(inv.due, "Asia/Jakarta", "d MMMM yyyy");
  const rp = Number(inv.nominal).toLocaleString("id-ID");
  const hari = inv.daysLeft === 0 ? "hari ini" : `${inv.daysLeft} hari lagi`;
  return {
    subject: `Reminder: Invoice ${inv.klien} jatuh tempo ${tgl}`,
    body:
      `Halo tim ${inv.klien},\n\n` +
      `Invoice sebesar Rp${rp} akan jatuh tempo ${hari} (${tgl}).\n` +
      `Mohon konfirmasi jika pembayaran sudah diproses.\n\n` +
      `Terima kasih,\nAkordium Lab`,
  };
}
```

**Lapisan 2 — lapisan Google**, tipis, cuma pipa:

```javascript
function kirimReminder() {
  const sheet = SpreadsheetApp.openById("SHEET_ID_ANDA")
    .getSheetByName("Invoices")
    .getDataRange()
    .getValues()
    .slice(1); // buang header

  const today = new Date();
  const due = filterDueInvoices(sheet, today, 3);

  for (const inv of due) {
    const mail = composeReminderEmail(inv);
    GmailApp.sendEmail("finance@klien.id", mail.subject, mail.body);
    // catat tanggal reminder di kolom E baris terkait
    sheetRow(inv).setValue(today); // pseudo — lihat catatan implementasi
  }
}
```

Kenapa pemisahan ini penting? Karena **lapisan 1 bisa diuji di laptop** — dengan Node.js dan tiga mock kecil:

```javascript
// mock layanan Google — hanya untuk uji lokal
const sentEmails = [];
global.Utilities = {
  formatDate: (d, tz, fmt) => {
    /* ...format tanggal Indonesia... */
  },
};
global.GmailApp = {
  sendEmail: (to, subject, body) => sentEmails.push({ to, subject, body }),
};
```

Lalu tanamkan skenario lengkap — enam baris data yang mengandung semua kasus pinggiran tadi — dan asersikan hasilnya. Begitulah cara skrip ini lahir, dan uji lokalnya langsung membayar dirinya sendiri.

## Yang Ketangkap Saat Uji Lokal

Dua bug yang lolos pandangan mata tapi mati di asersi — keduanya hadiah khas workflow ini:

**Pertama, jam dan tanggal.** Kode pertama menghitung `new Date('2026-11-12')` — yang di-parse sebagai tengah malam **UTC**. Dibandingkan dengan `today` zona WIB, hasilnya bergeser: invoice H-2 terbaca H-3. Klasik, diam-diam, dan hanya ketahuan karena angka yang diassert tidak cocok. Di Apps Script, pastikan juga `timeZone` project di `appsscript.json` diset (`"timeZone": "Asia/Jakarta"`) — kalau tidak, `new Date()` mengikuti zona project, bukan zona kamu.

**Kedua, nama layanan.** Versi awal menulis `Utilities_formatDate(...)` — gaya fungsi underscore yang tidak ada di Apps Script; yang benar `Utilities.formatDate(...)`. Kecil, memalukan, dan persis jenis kesalahan yang AI (dan manusia) buat ketika menulis dari ingatan tanpa dijalankan.

Hasil akhir uji lokal: 2 dari 6 baris lolos filter (yang benar), email terformat `Rp7.500.000` dan `12 November 2026`, dan semua asersi hijau.

## Menyalakan: Trigger dan Jebakan Terakhir

Di editor Apps Script (Extensions → Apps Script dari spreadsheet-mu), tempel kedua lapisan, lalu pasang pemicu waktu: jalankan `kirimReminder` tiap pagi.

```javascript
// jalankan sekali saja untuk memasang trigger harian jam 07:00
function pasangTrigger() {
  ScriptApp.newTrigger("kirimReminder")
    .timeBased()
    .atHour(7)
    .everyDays(1)
    .create();
}
```

Tiga jebakan terakhir sebelum produksi:

- **Kuota email.** Akun Gmail gratis dibatasi ±100 email/hari via `GmailApp` (Workspace lebih besar). Reminder itu kirim-dikit-tiap-hari, jadi aman — tapi jangan pakai pola ini untuk _blast_ ratusan email.
- **Tulis-balik baris.** Mencatat tanggal reminder ke baris yang benar butuh mapping indeks — `getValues()` memberi array; saat menulis pakai `sheet.getRange(row, 5).setValue(today)` dengan nomor baris asli (jangan lupa `+1` untuk header dan `+1` karena indeks sheet 1-based).
- **Gagal harus terlihat.** Bungkus `GmailApp.sendEmail` dengan `try/catch` dan catat ke `console.error` — eksekusi trigger yang gagal diam-diam adalah otomasi yang lebih buruk dari manual: kamu _merasa_ sudah diingatkan padahal tidak.

## Pola Prompt yang Terbukti

Untuk menutup, ini bagian AI-nya — pola prompt yang membuat semua di atas mengalir:

1. **Beri skema data nyata** (nama kolom + 3 contoh baris), bukan deskripsi abstrak. AI menulis kode jauh lebih akurat terhadap bentuk data konkret.
2. **Minta dua lapis secara eksplisit**: "pisahkan logika murni dari panggilan layanan Google supaya bisa diuji dengan Node". Tanpa perintah ini, kode pasti menyatu.
3. **Sebutkan kasus pinggiran sebagai daftar**: lunas, terlewat jatuh tempo, dedup 3 hari. AI tidak akan menebak dedup sendiri — kebijakan bisnis harus diantarkan.
4. **Uji dulu, tempel kemudian.** Logika hijau di lokal → baru salin ke editor Google. Yang tersisa untuk diuji di sana hanya pipa (ID sheet, izin akses, jam trigger).

Pola ini, kebetulan, sama persis dengan prinsip [artikel sebelumnya](/writing/2026/workflow-ai-assisted-development/): AI menulis, verifikasi yang memutuskan. Spreadsheet hanyalah panggungnya — ganti dengan Form, Calendar, atau Drive dan kerangkanya tidak berubah.

## CTA

Bagikan artikel ini jika bermanfaat. Untuk diskusi lebih lanjut, kunjungi [Contact](/contact/) atau subscribe [RSS](/writing/index.xml).
