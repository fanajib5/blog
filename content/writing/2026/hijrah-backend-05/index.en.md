---
title: "Hijrah Backend (5): The Query That Said 'Use My Index'"
description: "Episode 5 of Hijrah Backend: one DATE() call sidelined an index, COLLATE turned out to be innocent, and I still have a bit of debt to pay."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:05+07:00
lastmod: 2026-09-10T23:45:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - database
  - sql
  - story
series: "Hijrah Backend"
---

In [episode two](/en/writing/2026/hijrah-backend-02/), the query was innocent. It took 78 milliseconds in the CLI while the endpoint burned 15 seconds. This time it is the other way around: the query really was guilty. Not because it was complicated, but because one small function wrapper made it **ignore an index that was already there for it**.

## The Index Was There, Three Times

The victim: an endpoint counting alerts per device. Its alert table holds tens of millions of rows,[^2] and on top of it sits a composite index: (date, device, alert type). Read the endpoint's needs, "count alerts per device per type, within a date range", and that index looks like it was built for exactly this query. Someone in the past understood the problem perfectly.

My favorite part only came up while writing this episode: the database schema has **three copies of the same index**. Different names, identical contents. Apparently three people at three different points in time added it without checking the schema first hahaha. So the index was not just there, there were too many of them.

Yet the query still didn't use it. A full table scan across tens of millions of rows left the endpoint crawling at around 10 seconds. The right index was there, but the query couldn't use it.

## A Phone Book Forced to Start Over

The technical term is _non-sargable_, meaning the query is written in a way that prevents the index from being used. Picture an index as an alphabetized phone book.

Ask it: _"find all names starting with B"_, it opens straight to the B page, done in a fraction of a second. Now ask: _"find all names that, when their letters are shuffled, start with B"_, the book has to read itself from page one to the end, because alphabetical order no longer helps.

`WHERE DATE(column) >= DATE(?)` is exactly the second question: the `DATE()` function is called **on the column**, meaning every row in a tens-of-millions-row table must be reshaped before it can be compared. A neatly sorted index is useless against values that haven't been born from the function yet. The database isn't being stupid; it just has no choice.

## Move the Function, Not the Column

The fix isn't exotic tuning, it's moving the function from the column side to the parameter side:[^1]

```sql
-- before: the index gets ignored
WHERE DATE(a.dt) >= DATE(?) AND DATE(a.dt) <= DATE(?)

-- after: the index goes back to work
WHERE a.dt >= ? AND a.dt <= ?
```

The parameters need their time components. In my code, the bounds were already prepared in the use case, from `00:00:00` to `23:59:59`. The result stays the same: all rows on those dates are included.

Final result: from a ~10-second full scan to an index seek in the blink of an eye. Deployed, and the endpoint recovered without a single line of business logic touched.

## COLLATE Was Not the Culprit

To be fair, this episode has a subplot. During the same investigation, one join looked deeply suspicious: a cross-table comparison carrying an explicit collate marker in the middle. It had the exact face of the classic slow-query suspect: "mismatched collations make joins skip indexes."

I checked, and both sides of the join used the same collation. The marker was redundant, not the cause. Suspect released.

These two episodes point in opposite directions. In [episode two](/en/writing/2026/hijrah-backend-02/), EXPLAIN showed that the CTE was not the problem. This time, checking the query confirmed that `DATE()` was the culprit. Intuition can point at a suspect, but it is worth checking first.

## Three More I Have Not Fixed Yet

After fixing that `DATE()` case, I searched the codebase for the same pattern. I found three more joins shaped the same way in the fuel module, with `DATE()` called on columns on both sides of the join.

As of this writing, they are **not fixed**. The endpoints have never been reported slow, so they haven't earned repair time yet. The pattern is on the list; if I tackle it, EXPLAIN will be part of the investigation.

A parity-first migration does leave small debts like these. For me, the important part is to record them instead of pretending they are not there. Hopefully I remember to come back to them hehe.

## What I'm Taking Away

My takeaway is pretty simple: applying a function to a column can make an existing index useless. When I find a pattern like that, I should look for its siblings too. This time I found three, and I have written them down as debt. That does not mean I am leaving them forever, of course. I hope I remember to fix them hehe.

Next episode I will move from one query to the shape of the city: how a monolith of tens of thousands of lines became 14 domain modules while the plane kept flying.

Cheers.

[^1]: SQL snippets are simplified for storytelling, table and column names kept just enough; other details altered.

[^2]: Table row counts are rounded to order of magnitude; the precise scale isn't needed to understand the lesson.
