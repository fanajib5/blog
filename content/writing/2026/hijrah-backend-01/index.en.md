---
title: "Hijrah Backend (1): Day One, Handed a Legacy of 370+ Endpoints"
description: "Episode 1 of the Hijrah Backend series: the personal story behind migrating a GPS backend from PHP to Go, starting with a job opening that asked me to execute someone else's decision, a three-month mandate, and a legacy of 370+ endpoints."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:01+07:00
lastmod: 2026-09-10T15:30:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - php
  - migration
  - story
series: "Hijrah Backend"
---

The migration story began before I officially joined the company.

At a GPS tracking company in Surabaya, Indonesia, one of the team's seniors received a mandate to rewrite the existing system. To this day I don't know exactly what was said in that internal meeting; I only know the outcome: they decided to move to Go. And only after that decision was final did the job opening appear.

So my position in the hiring process was a little unusual: I wasn't there to help choose the project's direction. I was there to carry out a decision other people had already made.

At the interview, the main question was fair: could I handle a Laravel-to-Go migration? There was even a test offer, something like _"we'll show you a sample of our app, see if you can work on it within a week"_. The offer never materialized. Fine, the interview proceeded normally, and I got the job.

Then, at some point before my first day, one agreement was already waiting for me: the decision-makers had settled that this migration project must be complete, development plus testing, within **three months**.

Three months. For 370+ endpoints.[^2]

That number came from a belief that sounded reasonable in the meeting: migrating Laravel to Go is fast and easy; just move it over and it goes straight to production. Export-import, right? Nobody asked why the one person in that meeting who actually knew the work, whose job was to nod along, didn't interrupt with one sentence: _"wait, these are different categories"_.

That works out to roughly four endpoints a day, seven days a week, with no weekends or national holidays. There wasn't time in the estimate to ask _"how did that number get set so confidently?"_ either. It looked neat on a slide, less so on a keyboard.

This is the first episode of **Hijrah Backend**, my personal account of moving a GPS backend from PHP to Go. The original deadline is long behind us. I covered the technical side (why Go, the approach, and what I learned) in [my April article](/en/writing/2026/legacy-php-to-go-migration/). This series is about what didn't fit in that write-up: the decisions, mistakes, and people behind the migration.

## The Team Structure (and Its Proportions)

In early 2025, the IT team split three ways: two colleagues maintaining the existing app, two building the admin backoffice, and one dedicated migration sub-team. The migration sub-team had two members: one senior holding the mandate, and me.

The workload wasn't exactly balanced.

In practice, I wrote every line of Go code in this series. The mandate holder's contribution was mostly questions: _"why is it erroring?"_, _"why is the response different?"_, _"why is it slower? Go is supposed to be faster."_ They were fair questions. The person asking them just wasn't the one opening the editor.

And when the speed issue got loud, I once countered with one technical note: calling it a _"Laravel to Go migration"_ was never quite _apples to apples_. Laravel is a framework; Go is a language. To compare framework speed fairly, compare Laravel with CodeIgniter. To compare language speed fairly, compare plain PHP with plain Go. Our mandate took the language from one side and the framework from the other, then demanded the speed hehe.

## The Inheritance

The system I received was two PHP worlds living side by side.

World one: a Laravel 8 API with roughly 290 endpoints, a number that becomes 370+ if you count the cron jobs.[^2] World two: a CodeIgniter 3 app that served as the front door for data, a TCP listener receiving packets from dozens of GPS tracker types (Teltonika, GT06, JT808, and dozens of their cousins), plus 100+ cron jobs processing all of it every night.

The data was no joke either. Tens of thousands of GPS units live-tracking, tens of millions of rows of location and alert data, all flowing into MySQL.

The symptoms showed up in the first few weeks. On the fuel-estimation dashboard, for example, 30 vehicles triggered hundreds of queries: fetch each device, fetch its type, then loop through seven days of daily summaries. The database worked overtime while the user waited with a cup of coffee.

There was also an endpoint that could take 15 seconds per call. I blamed several things before finding the cause; that's where episode two begins.

## The Total Rewrite Temptation

With an inheritance like that, the first temptation was sweet: _"just rewrite everything from scratch. Clean, modern, pleasant to read."_

God forbid. I'll admit the temptation got to me for a moment. But a total rewrite meant gambling with behavior that tens of thousands of users already trust. Behavior that was sometimes odd, sometimes undocumented, but very much their daily reality.

So I took the less glamorous path: **parity-first**, treating the old code as an _executable spec_. Each new Go endpoint had to behave identically to the old one, quirks included. Except for quirks clearly unused by the frontend, those got cleaned out with much hesitation. Slowly, one endpoint at a time, while the old system kept serving. _Business as usual_.

This decision shaped every episode that follows. And the details of why parity-first saved so much time (plus examples of quirks that made me scratch my head) get their own episode, number four.

## The Map

The series contains eight episodes plus one epilogue. If you're reading this and the next ones are already out, then everything went live at once, as planned hehe:

2. **Anatomy of a 15-second endpoint**: a journey through four wrong hypotheses before the real culprit showed up somewhere completely unexpected.
3. **Porting dozens of GPS protocol parsers**: replacing the code that reads binary packets from all kinds of trackers, without corrupting data for a live fleet.
4. **Old code as an executable spec**: parity-first in depth, what must match exactly, and what's safe to drop.
5. **Queries that say "use my index"**: sargability lessons on tables with tens of millions of rows.
6. **Tidying a monolith into 14 domain modules**: restructuring while the plane keeps flying.
7. **From TCP packets to a time-series database**: how location data travels from listener to clean storage.
8. **Eighteen months in retrospect**: what I'd do differently, plus a Go-teaching plan still waiting for its schedule hehe.
9. **Epilogue: MySQL, PostgreSQL, then MySQL again**: the story of a database engine that changed course twice, and who paid the fare.

## Closing

The mandate gave me three months. By the time I wrote this, the migration had long outlasted that deadline. I crossed the distance between the number on the slide and the reality at the keyboard with Allah's help, my family's prayers, and my wife's support. Without them, these notes wouldn't exist.

Episode two starts with that 15-second endpoint. The answer wasn't in the query I suspected.

If you're looking for a tutorial on building a GPS backend from scratch, I wrote one in the GPS Backend series. Hijrah Backend is the story behind that work.

[^1]: Company details are deliberately anonymized, colleague names are replaced with roles or fictional initials, and numbers are rounded just enough to tell the story. This series is about the technical journey, not the company.

[^2]: Around 290 API endpoints in Laravel, plus 100+ cron jobs and endpoints in the CodeIgniter 3 app. The "370+" figure I used in [the April article](/en/writing/2026/legacy-php-to-go-migration/) is the sum of both.
