---
title: "Business Process Automation with UiPath RPA: Start with the Boring Work First"
description: "My notes on automating daily copy-paste work with UiPath RPA, plus a few things I only realized later."
author: "Faiq Najib Al-Aziz"
date: 2026-03-12
lastmod: 2026-09-11T09:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - notes
  - rpa
  - automation
  - uipath
---

Every morning, I opened the same files, checked the same data, and sent a report in the same format. Day one felt normal. By day three, it was getting boring. By day ten, I was asking myself, _"Is this really human work, or just copy-paste with extra steps?"_ hehe.

That routine got me seriously looking at **RPA (Robotic Process Automation)**, especially **UiPath**. Not because I was chasing a trend. Our team had a real problem: a lot of repetitive work was eating time, and done by hand it added very little value.

This is not a click-by-click guide to UiPath Studio (the internet has plenty of those). I just want to write down my early experience automating business processes: what went well, what gave me a headache, and what I should have prepared from the start.

## Why This Process Needed Automation

At that time, several operational workflows followed the same pattern:

- Collect data from email attachments (mostly Excel)
- Validate required fields
- Re-enter the data into internal systems
- Produce daily recap reports for supervisors

Each step was simple, but the volume was decent and it never stopped repeating. After a while, it showed:

1. **Time vanished into repetitive work**
2. **Human error** on small things (typos, wrong column mapping)
3. **Lead time ballooned** whenever the workload went up
4. **The team was tired**, because all the energy went to administrative work

At that point the question was no longer _"Can we do this manually?"_ but _"How long are we going to keep paying so much effort for work that can be automated?"_

## Why We Chose UiPath

I looked at a few automation options. Given our team's situation back then, UiPath was the most realistic one.

### 1. A Friendly Learning Curve

For a team that does not code full-time, UiPath's visual workflows make it easier to start. The logic still has to be tidy, but getting in is less scary than writing code from scratch.

### 2. It Plugs Into Existing Processes

We could not redesign every system from scratch. UiPath helped us bridge the old processes, so daily operations kept running.

### 3. Faster Implementation

For repetitive cases with clear rules, results showed up quickly. This also helped convince non-technical stakeholders, since they trust results more than slides hehe.

UiPath is obviously not the answer for every case. If a process is already API-first and the systems are tidy, custom automation can be a better fit. But for our conditions at the time, it was the most sensible trade-off.

## How I Went About It

I did not start with the most complicated process. I picked the workflow that repeated most often and had the most stable rules.

### 1. Pick the Process First

My criteria were simple:

- High frequency
- Clear rules
- Rarely changes from week to week
- Manual mistakes actually hurt

This matters. If the rules keep changing, the bot gets "fragile" fast and the team's trust goes with it.

### 2. Map the As-Is Flow in Detail

Before building a robot, I wrote down every manual step: incoming data, validation, failure cases, and the final output.

Nah, this is where I realized a lot of steps only lived "in the operators' heads" and had never been documented. Without those notes, the bot could get stuck halfway.

### 3. Small Bots, Quick Tests

Instead of one giant bot for everything, I split it into small modules:

- Input reader module
- Validation module
- System entry module
- Reporting and notification module

Debugging and maintenance got easier. If one part acted up, I did not have to tear everything apart.

### 4. Exception Handling from Day One

People often brush this off, but failures will come:

- Input file format changes
- Required fields are empty
- Target system is slow or times out
- Credentials are invalid

If a bot only works in ideal scenarios, that is not automation, that is a demo. From the start I went with "errors are normal", and made sure the bot had clear logs and could retry safely.

## After the Bot Ran

After a few stable cycles, this is what we felt:

- Daily processing time dropped significantly
- Manual input errors decreased
- Internal SLA became easier to maintain
- The operations team had room for analysis, not just data entry

What changed most was how the team saw the bot. At first some people worried, _"Will bots replace our jobs?"_ Once it was running, the bot took the repetitive stuff and the team could focus on things that need judgment and context.

## What I Used Most

### 1. It Is a Process Project, Not Just a Tool Project

If the process is a mess, even the fanciest tool will not tidy it up. Clean up the workflow first, then automate.

### 2. Do Not Chase the Complicated Stuff at First

A small win that ships beats a big plan that never finishes. Start with a simple use case that still makes a difference.

### 3. Logs and Documentation Are Lifesavers

When a bot fails at peak hours, clear logs help more than pretty diagrams. Workflow documentation also makes handovers to other teams easier.

### 4. Bring Operational Users in Early

They run the process every day. Their insight is often more accurate than the technical team's guesses (mine included). Bringing them in early also makes adoption smoother.

## Closing

For me, UiPath RPA is not about "replacing people", but about giving them time back for work that is more worthwhile. Repetitive work still has to get done, it just does not always have to be done by hand.

For another example from the field, I wrote a [separate case study](/en/writing/2026/miss-calculation-in-business-process-automation/). There, a miscalculation of around Rp8 billion in a bond workpaper made me realize that overly manual processes can dull our sense of risk.

If you're deciding whether a process is a good fit for automation and want to chat about how to approach it, [get in touch](/en/contact/). Details of the [services](/en/services/) I can help with are here as well.

---

_Tags: [notes](/en/tags/notes/) · [rpa](/en/tags/rpa/) · [automation](/en/tags/automation/) · [uipath](/en/tags/uipath/)_
