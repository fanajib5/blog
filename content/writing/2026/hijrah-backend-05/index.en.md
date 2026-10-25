---
title: "Hijrah Backend (5): The Query That Said 'Use My Index'"
description: "Episode 5 of the Hijrah Backend series: when a perfect index gets quietly ignored by one small DATE() wrapper, sargability lessons on a tens-of-millions-row table, an innocent COLLATE suspect, and debt I chose to admit."
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

In [episode two](/en/writing/2026/hijrah-backend-02/), the query was innocent: 78 milliseconds in the CLI while the endpoint burned 15 seconds. This episode is the mirror image. This time the query really was guilty, not because it was complex or ugly, but because one small function wrapper made it **ignore an index built specifically for it**.

## A Perfectly Designed Index (Times Three)

The victim: an endpoint counting alerts per device. Its alert table holds tens of millions of rows,[^2] and on top of it sits a composite index: (date, device, alert type). Read the endpoint's needs, "count alerts per device per type, within a date range", and that index looks like it was built for exactly this query. Someone in the past understood the problem perfectly.

And here's my favorite part, which I only noticed while writing this episode: in the database schema, that same index exists... in **three identical copies**. Different names, identical contents. Apparently three people in three different eras each added it without checking the schema first hahaha. So the index this query needed wasn't just present, it was present in surplus.

Yet the query still didn't use it. A full table scan across tens of millions of rows left the endpoint crawling at around 10 seconds. The right index was there, but the query couldn't use it.

## The Phone Book Told to Reread Itself

The technical term is _non-sargable_, a query written so the index can't be used. The easiest way to picture it: an index is a phone book sorted alphabetically.

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

The consequence: the parameters you send must carry their time components. In my code, the bounds were already fully prepared in the use case, starting `00:00:00`, ending `23:59:59`, so the result stays identical: every row within the same dates, without losing a second in between.

Final result: from a ~10-second full scan to an index seek in the blink of an eye. Deployed, and the endpoint recovered without a single line of business logic touched.

## The Innocent Suspect

To be fair, this episode has a subplot. During the same investigation, one join looked deeply suspicious: a cross-table comparison carrying an explicit collate marker in the middle. It had the exact face of the classic slow-query suspect: "mismatched collations make joins skip indexes."

I checked, and both sides of the join used the same collation. The marker was redundant, not the cause. Suspect released.

These two consecutive episodes taught the same lesson from opposite directions: in [episode two](/en/writing/2026/hijrah-backend-02/), EXPLAIN cleared the CTE; in this one, checking the `DATE()` wrapper confirmed it was the culprit. Intuition can point to suspects, but measurement delivers the verdict.

## The Debt I Admit

One section I think deserves to be written honestly: after fixing that one `DATE()` case, I searched the codebase for the same pattern, and found three more joins shaped identically in the fuel module. `DATE()` called on the column on both sides of the join.

As of this writing, they are **not fixed**. The endpoints have never been reported slow, so they haven't earned repair time yet. The pattern is on the list; if I tackle it, EXPLAIN will be part of the investigation.

A parity-first migration does leave small debts like these. What matters isn't zero debt; it's that the debt is recorded and not hiding.

## Lessons

1. **Don't call functions on columns in `WHERE`/`JOIN`.** Put the function on the parameter side, keep the column in the shape the index recognizes.
2. **Even the best index can be wasted by one small wrapper.** Index design and query design are one package; if either drifts, both fail.
3. **When you find a pattern-shaped bug, hunt for its siblings.** Bugs born from a writing habit are rarely born alone.
4. **Recorded technical debt is fine; hidden debt is dangerous.** I admitted mine in public so it won't be forgotten.

Next episode, we move from one query to the shape of the city: how a monolith of tens of thousands of lines was rebuilt into 14 domain modules while the plane kept flying.

Cheers.

[^1]: SQL snippets are simplified for storytelling, table and column names kept just enough; other details altered.

[^2]: Table row counts are rounded to order of magnitude; the precise scale isn't needed to understand the lesson.
