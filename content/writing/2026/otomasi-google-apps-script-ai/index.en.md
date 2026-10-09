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

In every business, there is a class of tasks that fits an awkward middle ground: too small to build a dedicated app for, yet too frequent to handle manually. Chasing clients whose invoices are about to come due. Summarizing Google Form responses every weekend. Copy-pasting data across spreadsheets. If your day-to-day runs inside Google Workspace, the answer for this type of work has been waiting around for a long time: **Google Apps Script** - JavaScript running on Google's servers, packed with direct access to Sheets, Gmail, and Calendar, completely free for standard accounts.

The issue is not the language, but two practical hurdles: writing boilerplate scripts from scratch is tedious, and debugging inside the Apps Script web editor is painful (tiny log windows, no proper breakpoints, sluggish execution). Throw AI into the equation and you get a sweet combination - **if** you know how to wield it.

This article is a real-world case study: an automated invoice reminder running off Google Sheets, authored with AI assistance and tested right on my laptop before ever touching Google's editor.

## The Case: Invoice Reminders from a Spreadsheet

The spreadsheet setup is simple, containing five columns:

```text
A: Client Name     B: Amount      C: Due Date      D: Status   E: Last Reminded
PT Maju Jaya       7,500,000      12/11/2026       UNPAID
CV Berkah          1,200,000      11/11/2026       UNPAID
PT Sejahtera       3,000,000      01/12/2026       UNPAID
```

The requirement: once a day, email clients whose invoices are due within ≤ 3 days, then record the reminder date to avoid spamming them. Edge cases that must behave correctly: paid invoices are skipped, overdue ones are not billed repeatedly, and invoices already reminded yesterday are not nagged again today.

## The Workflow Secret: Decouple Logic from Google Services

If you ask an AI "write an Apps Script to send invoice reminders", it will spit out a monolithic blob of code: read sheets, calculate dates, format emails, send them, write back to rows - everything mashed together and **impossible to test** without running it directly in Google. Every fix iteration becomes a mental deployment into Google's online editor, deciphering vague logs.

The proper workflow (and the one I use): ask the AI to split the code into two distinct layers.

**Layer 1 - Pure logic**, plain JavaScript without a single Google service call:

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

**Layer 2 - The Google integration layer**, a thin glue pipeline:

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

Why does this separation matter? Because **layer 1 can be unit tested locally on my laptop** using Node.js and a couple of lightweight mocks:

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

Then, set up a comprehensive test fixture - six rows of data covering all aforementioned edge cases - and assert the outcomes. That was how this script came together, and local testing paid for itself right away.

## What Surfaced During Local Testing

Two bugs slipped past initial inspection but tripped test assertions - both classic perks of this workflow:

**First, timezone handling on dates.** The initial implementation calculated `new Date('2026-11-12')`, which is parsed as midnight **UTC**. When compared against `today` in WIB (UTC+7), the date arithmetic drifted: an invoice due in 2 days appeared as due in 3 days. A silent, classic pitfall caught purely because the asserted day count mismatched. In Apps Script, always ensure the project's `timeZone` in `appsscript.json` is configured (`"timeZone": "Asia/Jakarta"`). Otherwise, `new Date()` adopts the project script's default timezone rather than your local one.

**Second, hallucinated API signatures.** The AI initially wrote `Utilities_formatDate(...)`, an underscore-style function naming convention that does not exist in Apps Script; the actual method is `Utilities.formatDate(...)`. Small, silly, and exactly the type of slip-up both AI and humans produce when writing APIs from memory without executing them.

The final result of the local suite: 2 out of 6 rows passed the filter (exactly as intended), emails rendered as `Rp7.500.000` and `12 November 2026`, and every assertion turned green.

## Going Live: Triggers and Final Gotchas

In the Apps Script editor (Extensions -> Apps Script from your spreadsheet), paste both layers, then configure a time-driven trigger to run `sendReminders` every morning.

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

Three final gotchas to keep in mind before production:

- **Email quota limits.** Free Gmail accounts are capped at ~100 emails/day via `GmailApp` (Workspace accounts enjoy higher allowances). Invoice reminders are low-volume daily pings, so this is safe - just do not repurpose this setup for blast campaigns to hundreds of recipients.
- **Row write-backs.** Storing the reminder timestamp back to the correct row requires careful index mapping. `getValues()` yields a zero-indexed array; when writing via `sheet.getRange(row, 5).setValue(today)`, remember the actual sheet row requires `+1` for the header and `+1` for Sheets' 1-based indexing.
- **Failures must be observable.** Wrap `GmailApp.sendEmail` inside a `try/catch` and log to `console.error`. A silent trigger failure is worse than doing work manually: you assume reminders were sent when in fact nothing happened.

## Proven Prompting Patterns

To wrap things up, here is the AI prompting playbook that made this workflow effortless:

1. **Provide a real data schema** (column names plus 3 sample rows) rather than vague conceptual descriptions. AI writes code far more reliably against concrete shapes.
2. **Explicitly request two distinct layers**: "separate pure business logic from Google service invocations so it can be tested with Node.js". Without this prompt constraint, the AI will bundle everything together.
3. **List edge cases as clear bullet points**: already paid, overdue, 3-day dedup window. AI will not guess your business deduplication rules on its own - policies must be specified upfront.
4. **Test first, deploy later.** Once logic passes local tests, paste it into Google's script editor. The only parts left to verify live are the glue plumbing (sheet IDs, permission scopes, trigger execution).

This philosophy closely mirrors the principles from my [earlier article](/en/writing/2026/workflow-ai-assisted-development/): AI generates, verification decides. Google Sheets is just one playground - swap it for Google Forms, Calendar, or Drive, and the blueprint remains identical.

## Call to Action

Feel free to share this post if you found it helpful. For further conversations, reach out via [Contact](/en/contact/) or subscribe to the [RSS feed](/en/writing/index.xml).
