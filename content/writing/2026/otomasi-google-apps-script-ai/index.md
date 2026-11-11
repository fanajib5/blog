---
title: "Otomasi Google Apps Script dengan Bantuan AI"
description: "Contoh reminder invoice dengan Apps Script. Saya minta bantuan AI menulisnya, lalu menguji logikanya di laptop sebelum menyalin ke editor Google."
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

Banyak pekerjaan di Google Workspace rasanya terlalu kecil untuk dibuatkan aplikasi, tapi kalau dikerjakan berulang-ulang bikin bosan juga. Contohnya mengingatkan klien soal invoice, merekap Google Form tiap akhir pekan, atau menyalin data antar-spreadsheet. **Google Apps Script** bisa mengerjakannya otomatis. Ini JavaScript yang berjalan di server Google dan bisa mengakses Sheets, Gmail, serta Calendar. Untuk akun biasa, penggunaannya gratis.

Buat saya, menulis JavaScript bukan bagian yang paling merepotkan. Yang bikin malas justru bolak-balik _debugging_ di editor Apps Script: log kecil, breakpoint terbatas, dan eksekusinya juga terasa lambat. AI bisa membantu, tapi hasilnya tetap perlu dicek.

Di sini saya membuat reminder invoice dari Google Sheets dengan bantuan AI. Sebelum membuka editor Google, saya coba logikanya di laptop dulu.

## Contoh yang Saya Kerjakan

Spreadsheet contoh ini punya lima kolom:

```text
A: Nama Klien      B: Nominal     C: Jatuh Tempo   D: Status   E: Terakhir Reminder
PT Maju Jaya       7.500.000      12/11/2026       UNPAID
CV Berkah          1.200.000      11/11/2026       UNPAID
PT Sejahtera       3.000.000      01/12/2026       UNPAID
```

Skrip ini mengirim email harian kalau invoice jatuh tempo dalam ≤ 3 hari, lalu mencatat kapan reminder dikirim supaya tidak spam. Invoice lunas dilewati, invoice lewat jatuh tempo tidak dikirim berulang-ulang, dan klien yang baru diingatkan kemarin tidak dikirimi lagi hari ini.

## Saya Pisahkan Logika dan Layanan Google

Kalau saya cuma meminta AI "buatkan script Apps Script untuk reminder invoice", bisa-bisa semua logikanya dijadikan satu gumpalan: baca sheet, hitung tanggal, format email, kirim, lalu tulis balik. Sulit menguji potongan-potongan ini tanpa menjalankannya di Google. Setiap kali ada yang salah, saya harus menyalin lagi kodenya dan menerka-nerka dari log.

Jadi saya minta AI memisahkan kodenya menjadi dua bagian.

**Bagian pertama: logika**, JavaScript biasa tanpa memanggil layanan Google:

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

**Bagian kedua: penghubung Google**, tugasnya memanggil layanan yang diperlukan:

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
    sheetRow(inv).setValue(today); // pseudo, lihat catatan implementasi
  }
}
```

Dengan cara ini, **logika pertama bisa saya uji di laptop** memakai Node.js dan beberapa mock kecil:

```javascript
// mock layanan Google, hanya untuk uji lokal
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

Saya siapkan enam baris data untuk menguji kasus-kasus tadi, lalu memeriksa hasilnya. Begitulah skrip ini saya susun. Tes lokal langsung menemukan hal yang perlu dibetulkan.

## Dua Bug yang Ketemu

Waktu dites di lokal, saya menemukan dua bug yang gampang luput kalau cuma membaca kodenya:

**Pertama, jam dan tanggal.** Kode pertama menghitung `new Date('2026-11-12')`, yang di-parse sebagai tengah malam **UTC**. Saat dibandingkan dengan `today` di zona WIB, hasilnya bergeser: invoice H-2 terbaca H-3. Perbedaan ini baru terlihat saat angka yang diassert tidak cocok. Di Apps Script, pastikan `timeZone` project di `appsscript.json` diset (`"timeZone": "Asia/Jakarta"`). Jika tidak, `new Date()` mengikuti zona project, bukan zona kamu.

**Kedua, nama layanan.** Versi awal menulis `Utilities_formatDate(...)`, gaya fungsi underscore yang tidak ada di Apps Script. Yang benar adalah `Utilities.formatDate(...)`. Kesalahan seperti ini bisa terjadi ketika AI maupun manusia menulis dari ingatan tanpa menjalankan kodenya.

Hasilnya, dua dari enam baris lolos filter, sesuai harapan. Format emailnya menjadi `Rp7.500.000` dan `12 November 2026`, dan semua asersi lewat. Lumayan, setidaknya bukan cuma kelihatan benar.

## Memasang Trigger

Dari spreadsheet, buka editor Apps Script (Extensions → Apps Script) dan tempel kedua bagian tadi. Setelah itu, pasang trigger supaya `kirimReminder` berjalan tiap pagi.

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

Sebelum dipakai, saya cek lagi beberapa hal ini:

- **Kuota email.** Akun Gmail gratis dibatasi ±100 email/hari via `GmailApp` (Workspace lebih besar). Reminder ini dikirim dalam jumlah kecil setiap hari, jadi aman. Jangan gunakan pola ini untuk _blast_ ratusan email.
- **Tulis-balik baris.** Untuk mencatat tanggal reminder di baris yang benar, indeksnya perlu dipetakan. `getValues()` memberi array; saat menulis dengan `sheet.getRange(row, 5).setValue(today)`, gunakan nomor baris asli. Tambahkan `+1` untuk header dan `+1` karena indeks sheet dimulai dari 1.
- **Gagal harus terlihat.** Bungkus `GmailApp.sendEmail` dengan `try/catch` dan catat ke `console.error`. Kegagalan trigger yang tidak terlihat lebih buruk daripada mengerjakan ini secara manual: kamu _merasa_ sudah diingatkan padahal tidak.

## Catatan Waktu Meminta Bantuan AI

Ini beberapa hal yang saya masukkan ke prompt:

1. **Beri skema data nyata** (nama kolom dan tiga contoh baris), bukan deskripsi abstrak. Bentuk data yang konkret membantu AI menulis kode dengan lebih akurat.
2. **Minta dua lapis secara eksplisit**: "pisahkan logika murni dari panggilan layanan Google supaya bisa diuji dengan Node". Tanpa instruksi ini, kode bisa tercampur.
3. **Sebutkan kasus pinggiran**: lunas, terlewat jatuh tempo, dan dedup 3 hari. AI tidak akan menebak aturan dedup; kebijakan bisnis perlu disebutkan.
4. **Uji dulu, tempel kemudian.** Setelah logika lolos uji lokal, salin ke editor Google. Di sana, yang perlu diuji tinggal bagian penghubungnya, seperti ID sheet, izin akses, dan jam trigger.

Di [artikel sebelumnya](/writing/2026/workflow-ai-assisted-development/) saya juga menulis soal ini: AI bisa bantu menulis, tapi kita tetap harus memeriksa hasilnya. Contohnya kali ini memakai spreadsheet; alur serupa bisa dicoba dengan Form, Calendar, atau Drive.

Kalau kamu mencoba alur ini atau menemukan bagian yang perlu diperbaiki, [Contact](/contact/). Tulisan berikutnya bisa diikuti lewat [RSS](/writing/index.xml).
