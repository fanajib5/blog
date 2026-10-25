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

Banyak pekerjaan di Google Workspace terlalu kecil untuk dibuatkan aplikasi, tetapi terlalu sering jika dikerjakan manual. Misalnya, mengingatkan klien tentang invoice yang akan jatuh tempo, merekap submitan Google Form tiap akhir pekan, atau menyalin data antar-spreadsheet. **Google Apps Script** bisa membantu mengotomasi pekerjaan seperti ini. Skrip JavaScript ini berjalan di server Google, punya akses langsung ke Sheets, Gmail, dan Calendar, serta gratis untuk akun biasa.

Bahasanya bukan kendala utama. Menulis skrip dari nol itu membosankan, sementara _debugging_ di editor Apps Script terasa menyiksa: log kecil, tanpa breakpoint yang layak, dan eksekusi lambat. AI bisa membantu, asalkan digunakan dengan cara yang tepat.

Artikel ini membahas reminder invoice otomatis dari Google Sheets yang saya tulis dengan bantuan AI. Saya mengujinya di laptop sebelum membuka editor Google.

## Kasus: Reminder Invoice dari Spreadsheet

Spreadsheet-nya berisi lima kolom:

```text
A: Nama Klien      B: Nominal     C: Jatuh Tempo   D: Status   E: Terakhir Reminder
PT Maju Jaya       7.500.000      12/11/2026       UNPAID
CV Berkah          1.200.000      11/11/2026       UNPAID
PT Sejahtera       3.000.000      01/12/2026       UNPAID
```

Skrip perlu mengirim email sekali sehari kepada klien yang invoice-nya jatuh tempo dalam ≤ 3 hari, lalu mencatat tanggal reminder supaya tidak spam. Ada beberapa kasus yang harus ditangani: invoice yang sudah lunas dilewati, invoice yang sudah lewat jatuh tempo tidak ditagih dua kali, dan klien yang sudah diingatkan kemarin tidak diingatkan lagi hari ini.

## Kunci Workflow: Pisahkan Logika dari Layanan Google

Kalau kamu meminta AI "buatkan script Apps Script reminder invoice", hasilnya bisa berupa satu gumpalan kode: membaca sheet, menghitung tanggal, memformat email, mengirim, lalu menulis balik. Semua bagian itu tercampur dan **tidak bisa diuji** tanpa menjalankannya di Google. Setiap perbaikan berarti menyalin ulang kode ke editor Google dan menebak-nebak dari log.

Workflow yang saya pakai adalah meminta AI memecah kode menjadi dua lapis.

**Lapisan 1: logika murni**, JavaScript polos tanpa panggilan layanan Google:

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

**Lapisan 2: integrasi Google**, lapisan tipis yang menghubungkan layanan:

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

Pemisahan ini membuat **lapisan 1 bisa diuji di laptop** dengan Node.js dan tiga mock kecil:

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

Berikutnya, siapkan skenario dengan enam baris data yang mencakup semua kasus tadi, lalu asersikan hasilnya. Begitulah cara skrip ini saya buat. Uji lokal langsung berguna.

## Yang Ketangkap Saat Uji Lokal

Uji lokal menangkap dua bug yang mudah terlewat saat membaca kode:

**Pertama, jam dan tanggal.** Kode pertama menghitung `new Date('2026-11-12')`, yang di-parse sebagai tengah malam **UTC**. Saat dibandingkan dengan `today` di zona WIB, hasilnya bergeser: invoice H-2 terbaca H-3. Perbedaan ini baru terlihat saat angka yang diassert tidak cocok. Di Apps Script, pastikan `timeZone` project di `appsscript.json` diset (`"timeZone": "Asia/Jakarta"`). Jika tidak, `new Date()` mengikuti zona project, bukan zona kamu.

**Kedua, nama layanan.** Versi awal menulis `Utilities_formatDate(...)`, gaya fungsi underscore yang tidak ada di Apps Script. Yang benar adalah `Utilities.formatDate(...)`. Kesalahan seperti ini bisa terjadi ketika AI maupun manusia menulis dari ingatan tanpa menjalankan kodenya.

Uji lokal akhirnya meloloskan 2 dari 6 baris, sesuai yang diharapkan. Email terformat sebagai `Rp7.500.000` dan `12 November 2026`, dan semua asersi hijau.

## Menyalakan: Trigger dan Jebakan Terakhir

Dari spreadsheet, buka editor Apps Script (Extensions → Apps Script) dan tempel kedua lapisan. Lalu pasang pemicu waktu agar `kirimReminder` berjalan tiap pagi.

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

Sebelum dipakai, periksa tiga hal ini:

- **Kuota email.** Akun Gmail gratis dibatasi ±100 email/hari via `GmailApp` (Workspace lebih besar). Reminder ini dikirim dalam jumlah kecil setiap hari, jadi aman. Jangan gunakan pola ini untuk _blast_ ratusan email.
- **Tulis-balik baris.** Untuk mencatat tanggal reminder di baris yang benar, indeksnya perlu dipetakan. `getValues()` memberi array; saat menulis dengan `sheet.getRange(row, 5).setValue(today)`, gunakan nomor baris asli. Tambahkan `+1` untuk header dan `+1` karena indeks sheet dimulai dari 1.
- **Gagal harus terlihat.** Bungkus `GmailApp.sendEmail` dengan `try/catch` dan catat ke `console.error`. Kegagalan trigger yang tidak terlihat lebih buruk daripada mengerjakan ini secara manual: kamu _merasa_ sudah diingatkan padahal tidak.

## Menyusun Prompt

Beberapa hal yang saya minta dalam prompt:

1. **Beri skema data nyata** (nama kolom dan tiga contoh baris), bukan deskripsi abstrak. Bentuk data yang konkret membantu AI menulis kode dengan lebih akurat.
2. **Minta dua lapis secara eksplisit**: "pisahkan logika murni dari panggilan layanan Google supaya bisa diuji dengan Node". Tanpa instruksi ini, kode bisa tercampur.
3. **Sebutkan kasus pinggiran**: lunas, terlewat jatuh tempo, dan dedup 3 hari. AI tidak akan menebak aturan dedup; kebijakan bisnis perlu disebutkan.
4. **Uji dulu, tempel kemudian.** Setelah logika lolos uji lokal, salin ke editor Google. Di sana, yang perlu diuji tinggal bagian penghubungnya, seperti ID sheet, izin akses, dan jam trigger.

Prinsip ini sejalan dengan [artikel sebelumnya](/writing/2026/workflow-ai-assisted-development/): AI menulis, verifikasi yang memutuskan. Contoh di sini memakai spreadsheet, tetapi alur yang sama bisa digunakan dengan Form, Calendar, atau Drive.

## CTA

Jika artikel ini bermanfaat, silakan bagikan. Untuk membahas workflow ini lebih lanjut, kunjungi [Contact](/contact/) atau subscribe [RSS](/writing/index.xml).
