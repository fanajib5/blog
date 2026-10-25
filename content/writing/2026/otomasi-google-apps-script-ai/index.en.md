---
title: "Automating Google Apps Script with AI Assistance"
description: "Eliminating repetitive tasks in Google Workspace with Apps Script, and how to get AI to write it properly: separate business logic from Google services, test locally, then paste into the editor."
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

Many tasks in Google Workspace are too small to justify a dedicated app, but too frequent to handle manually. Think of reminding clients about upcoming invoices, summarizing Google Form responses every weekend, or copying data between spreadsheets. **Google Apps Script** can automate work like this. It is JavaScript that runs on Google's servers, with direct access to Sheets, Gmail, and Calendar, and it is free for standard accounts.

The language is not the main hurdle. Writing a script from scratch is tedious, and debugging in the Apps Script editor is painful: tiny log windows, no proper breakpoints, and sluggish execution. AI can help, provided you use it the right way.

This article walks through an automated invoice reminder for Google Sheets that I wrote with AI assistance. I tested it on my laptop before opening Google's editor.

## The Case: Invoice Reminders from a Spreadsheet

The spreadsheet has five columns:

```text
A: Client Name     B: Amount      C: Due Date      D: Status   E: Last Reminded
PT Maju Jaya       7,500,000      12/11/2026       UNPAID
CV Berkah          1,200,000      11/11/2026       UNPAID
PT Sejahtera       3,000,000      01/12/2026       UNPAID
```

The script needs to email clients once a day when their invoices are due within ≤ 3 days, then record the reminder date to avoid spamming them. It also needs to handle a few edge cases: skip paid invoices, avoid repeatedly billing for overdue ones, and avoid reminding clients again today if they were reminded yesterday.

## The Workflow Secret: Decouple Logic from Google Services

If you ask an AI "write an Apps Script to send invoice reminders", it may produce one monolithic block: read the sheet, calculate dates, format emails, send them, and write back to rows. With everything mixed together, it is **impossible to test** without running it in Google. Each round of fixes means copying the code into Google's editor and guessing from the logs.

The workflow I use is to ask the AI to split the code into two layers.

**Layer 1: Pure logic**, plain JavaScript without any Google service calls:

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

**Layer 2: Google integration**, a thin layer that connects the services:

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

With this separation, **layer 1 can be unit tested locally on my laptop** using Node.js and a few lightweight mocks:

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

Next, set up a test fixture with six rows covering those edge cases, then assert the outcomes. That is how I put this script together. Local testing was useful right away.

## What Surfaced During Local Testing

Local tests caught two bugs that were easy to miss when reading the code:

**First, timezone handling on dates.** The initial implementation calculated `new Date('2026-11-12')`, which is parsed as midnight **UTC**. Compared with `today` in WIB (UTC+7), the date arithmetic shifted: an invoice due in 2 days appeared due in 3 days. The mismatch showed up in the asserted day count. In Apps Script, make sure the project's `timeZone` in `appsscript.json` is configured (`"timeZone": "Asia/Jakarta"`). Otherwise, `new Date()` follows the project timezone, not your local one.

**Second, a service method name.** The AI initially wrote `Utilities_formatDate(...)`, an underscore-style function name that does not exist in Apps Script. The actual method is `Utilities.formatDate(...)`. Both AI and people can make this kind of mistake when writing from memory without running the code.

The local tests ultimately passed 2 out of 6 rows through the filter, as intended. Emails rendered as `Rp7.500.000` and `12 November 2026`, and every assertion passed.

## Going Live: Triggers and Final Gotchas

From the spreadsheet, open the Apps Script editor (Extensions -> Apps Script) and paste both layers. Then configure a time-driven trigger to run `sendReminders` every morning.

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

Before using it, check three things:

- **Email quota limits.** Free Gmail accounts are capped at ~100 emails/day via `GmailApp` (Workspace accounts have higher allowances). These reminders go out in small numbers each day, so the quota should be fine. Do not use this setup for blast campaigns to hundreds of recipients.
- **Row write-backs.** To record the reminder timestamp in the right row, map the array index carefully. `getValues()` yields a zero-indexed array. When writing with `sheet.getRange(row, 5).setValue(today)`, use the actual sheet row number. Add `+1` for the header and `+1` because Sheets uses 1-based indexing.
- **Failures must be observable.** Wrap `GmailApp.sendEmail` in a `try/catch` and log to `console.error`. A silent trigger failure is worse than doing the work manually: you think reminders were sent when they were not.

## Writing the Prompt

Here are a few things I included in the prompt:

1. **Provide a real data schema** (column names and three sample rows), not a vague description. Concrete data shapes help the AI produce more accurate code.
2. **Explicitly request two layers**: "separate pure business logic from Google service invocations so it can be tested with Node.js". Without this instruction, the code may end up bundled together.
3. **List the edge cases**: already paid, overdue, and a 3-day dedup window. The AI will not guess your deduplication rules; spell out the business policy.
4. **Test first, paste later.** After the logic passes local tests, copy it into Google's script editor. The remaining live checks are the integration details, such as sheet IDs, permissions, and trigger timing.

This approach follows the principle in my [earlier article](/en/writing/2026/workflow-ai-assisted-development/): AI generates, verification decides. This example uses Google Sheets, but the same workflow can also use Google Forms, Calendar, or Drive.

## Call to Action

If you found this article useful, feel free to share it. To discuss this workflow, reach out via [Contact](/en/contact/) or subscribe to the [RSS feed](/en/writing/index.xml).
