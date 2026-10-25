---
title: "Automating Google Apps Script with AI Assistance"
description: "An invoice reminder example with Apps Script. I asked AI to help write it, then tested the logic on my laptop before copying it into Google’s editor."
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

A lot of Google Workspace tasks feel too small for a dedicated app, but doing them over and over gets old. Things like reminding clients about invoices, summarizing Google Form responses each weekend, or copying data between spreadsheets. **Google Apps Script** can automate them. It’s JavaScript that runs on Google’s servers and can access Sheets, Gmail, and Calendar. It’s free for standard accounts.

For me, writing JavaScript isn’t the most annoying part. It’s the back-and-forth debugging in the Apps Script editor: tiny logs, limited breakpoints, and slow execution. AI can help, but I still need to check its work.

Here I build an invoice reminder for Google Sheets with AI assistance. Before opening Google’s editor, I test the logic on my laptop first.

## The Example I Worked On

This example spreadsheet has five columns:

```text
A: Client Name     B: Amount      C: Due Date      D: Status   E: Last Reminded
PT Maju Jaya       7,500,000      12/11/2026       UNPAID
CV Berkah          1,200,000      11/11/2026       UNPAID
PT Sejahtera       3,000,000      01/12/2026       UNPAID
```

The script emails clients once a day when an invoice is due within ≤ 3 days, then records the reminder date so it doesn’t spam them. It skips paid invoices, avoids repeatedly emailing about overdue invoices, and doesn’t send another reminder today if the client got one yesterday.

## I Keep the Logic Separate from Google Services

If I just ask AI to "write an Apps Script for invoice reminders", it might put everything in one block: read the sheet, calculate dates, format and send emails, then write back to rows. It’s hard to test the pieces without running them in Google. Each fix means copying the code into the editor again and guessing from the logs.

So I ask AI to split the code into two parts.

**Part one: logic**, plain JavaScript with no Google service calls:

```javascript
function filterDueInvoices(rows, today, leadDays) {
  // rows: [[client, amount, dueDate (Date), status, lastReminded (Date|null)], ...]
  const soon = [];
  for (const r of rows) {
    const [client, amount, due, status, lastReminded] = r;
    if (status !== "UNPAID") continue; // paid -> skip
    const daysLeft = Math.ceil((due - today) / 86400000);
    if (daysLeft < 0 || daysLeft > leadDays) continue; // overdue or too far out -> skip
    if (lastReminded && (today - lastReminded) / 86400000 < 3) continue; // 3-day dedup window
    soon.push({ client, amount, due, daysLeft });
  }
  return soon;
}

function composeReminderEmail(inv) {
  const dateStr = Utilities.formatDate(inv.due, "Asia/Jakarta", "d MMMM yyyy");
  const formattedAmount = Number(inv.amount).toLocaleString("id-ID");
  const timing = inv.daysLeft === 0 ? "today" : `in ${inv.daysLeft} days`;
  return {
    subject: `Reminder: Invoice for ${inv.client} is due on ${dateStr}`,
    body:
      `Hello ${inv.client} team,\n\n` +
      `Your invoice of Rp${formattedAmount} will be due ${timing} (${dateStr}).\n` +
      `Please let us know once payment has been processed.\n\n` +
      `Thank you,\nAkordium Lab`,
  };
}
```

**Part two: Google integration**, the bit that calls the services:

```javascript
function sendReminders() {
  const sheet = SpreadsheetApp.openById("YOUR_SHEET_ID")
    .getSheetByName("Invoices")
    .getDataRange()
    .getValues()
    .slice(1); // discard header row

  const today = new Date();
  const due = filterDueInvoices(sheet, today, 3);

  for (const inv of due) {
    const mail = composeReminderEmail(inv);
    GmailApp.sendEmail("finance@client.id", mail.subject, mail.body);
    // record reminder date in column E of the corresponding row
    sheetRow(inv).setValue(today); // pseudo-code - see implementation notes
  }
}
```

This way, **I can test the first part on my laptop** using Node.js and a few small mocks:

```javascript
// mock Google services - local test harness only
const sentEmails = [];
global.Utilities = {
  formatDate: (d, tz, fmt) => {
    /* ...date formatting implementation... */
  },
};
global.GmailApp = {
  sendEmail: (to, subject, body) => sentEmails.push({ to, subject, body }),
};
```

I set up six rows to cover those cases, then checked the results. That’s how I put this script together. The local test found things to fix right away.

## Two Bugs I Found

While testing locally, I found two bugs that were easy to miss by just reading the code:

**First, timezone handling on dates.** The initial implementation calculated `new Date('2026-11-12')`, which is parsed as midnight **UTC**. Compared with `today` in WIB (UTC+7), the date arithmetic shifted: an invoice due in 2 days appeared due in 3 days. The mismatch showed up in the asserted day count. In Apps Script, make sure the project's `timeZone` in `appsscript.json` is configured (`"timeZone": "Asia/Jakarta"`). Otherwise, `new Date()` follows the project timezone, not your local one.

**Second, a service method name.** The AI initially wrote `Utilities_formatDate(...)`, an underscore-style function name that does not exist in Apps Script. The actual method is `Utilities.formatDate(...)`. Both AI and people can make this kind of mistake when writing from memory without running the code.

The tests let two of the six rows pass the filter, as expected. The email showed `Rp7.500.000` and `12 November 2026`, and all the assertions passed. At least it didn’t just look right.

## Setting Up the Trigger

From the spreadsheet, open the Apps Script editor (Extensions -> Apps Script) and paste in both parts. Then set up a trigger to run `sendReminders` every morning.

```javascript
// run once manually to set up a daily 07:00 AM trigger
function setupTrigger() {
  ScriptApp.newTrigger("sendReminders")
    .timeBased()
    .atHour(7)
    .everyDays(1)
    .create();
}
```

Before using it, I check a few things:

- **Email quota limits.** Free Gmail accounts are capped at ~100 emails/day via `GmailApp` (Workspace accounts have higher allowances). These reminders go out in small numbers each day, so the quota should be fine. Do not use this setup for blast campaigns to hundreds of recipients.
- **Row write-backs.** To record the reminder timestamp in the right row, map the array index carefully. `getValues()` yields a zero-indexed array. When writing with `sheet.getRange(row, 5).setValue(today)`, use the actual sheet row number. Add `+1` for the header and `+1` because Sheets uses 1-based indexing.
- **Failures must be observable.** Wrap `GmailApp.sendEmail` in a `try/catch` and log to `console.error`. A silent trigger failure is worse than doing the work manually: you think reminders were sent when they were not.

## Notes for Asking AI for Help

Here are a few things I put in the prompt:

1. **Provide a real data schema** (column names and three sample rows), not a vague description. Concrete data shapes help the AI produce more accurate code.
2. **Explicitly request two layers**: "separate pure business logic from Google service invocations so it can be tested with Node.js". Without this instruction, the code may end up bundled together.
3. **List the edge cases**: already paid, overdue, and a 3-day dedup window. The AI will not guess your deduplication rules; spell out the business policy.
4. **Test first, paste later.** After the logic passes local tests, copy it into Google's script editor. The remaining live checks are the integration details, such as sheet IDs, permissions, and trigger timing.

I wrote about this in an [earlier article](/en/writing/2026/workflow-ai-assisted-development/), too: AI can help generate the code, but we still have to check it. This example uses Google Sheets, though the same workflow could work with Forms, Calendar, or Drive.

If you try this workflow or spot something I should fix, [Contact](/en/contact/). You can follow future posts via the [RSS feed](/en/writing/index.xml).
