---
title: "Hijrah Backend (9): Epilogue, MySQL, PostgreSQL, Then MySQL Again"
description: "Epilogue of the Hijrah Backend series: the story of a database engine that changed direction twice, a LISTEN/NOTIFY optimization that went to waste, double work, and a frontend legacy smelled from across the stack."
author: "Faiq Najib Al-Aziz"
date: 2026-09-11T01:30:00+07:00
lastmod: 2026-09-11T02:00:00+07:00
draft: false
toc: true
comments: false
tags:
  - postgresql
  - mysql
  - migration
  - story
series: "Hijrah Backend"
---

This series already ended in [the previous episode](/en/writing/2026/hijrah-backend-08/). But every long journey has one story that never fits in the main body, and this one actually happened after almost every other episode was written. Think of it as the post-credits scene: the screen is dark, the lights are on, but there's one more scene hehe.

It's the story of a database engine asked to change course twice. And as for who was holding the wheel at the time: not me, and by now you can probably guess hahaha.

## The Original Vision: One PostgreSQL for Everything

The initial direction was clear and written down. In the bosses' group chat, in early 2025, the sentence came out firmly:[^1] cloud, plus Go, plus PostgreSQL is a must. One engine for everything, one SQL dialect, one queue of things to learn. As a vision, it was beautiful, and honestly, I was enthusiastic too.

The work was real as well: converting the schema from MySQL, fixing data types with no direct equivalents, importing data that conflicted here and there, and rebuilding the models in Go. Then came the feature that made me proud: real-time updates between applications, built on PostgreSQL's own _LISTEN_/_NOTIFY_. No extra message broker needed for that case; the database itself knocks on your door. Greedy, yes, but technically greedy hehe~

## Back to MySQL It Goes

Then, about a year later, the wind changed. The decision arrived: the legacy system stays on MySQL, and the main domain data goes back to MySQL. PostgreSQL wasn't deleted; it was reassigned to a base that suited it better: time-series location data, which is the hungriest and the most in need of time partitioning.

From a business point of view, the decision had its logic: the same data doesn't need to be maintained on two engines under two sets of rules, and the legacy system that refuses to die has outlived everyone's plans. I had no argument with the logic.

But the cost landed where it always lands: on my desk.

An application born and raised in the PostgreSQL dialect suddenly had to live in the MySQL dialect: different syntax, different standard-library SQL behavior, types with different names and different moods. Errors sprouted in places that were green yesterday. The finished _LISTEN_/_NOTIFY_ optimization? Unemployed. And me? I did the same job a second time, with hands that had memorized all the wrong roads hehe~

## What Remains of Two Worlds

The end result looks like peace after a duel: MySQL holds the domain data, PostgreSQL holds the location data. Two engines, two roles, no interference. Not architecture born from a tidy whiteboard drawing; it was born from two big decisions that reversed course, and deployments that had to stay alive between them.

If you ask which one was right: both were right, in their own time. The original vision was right as a vision; the reversal was right as a cost balance. What wasn't right was assuming architecture never changes direction, then building everything without a fallback plan. That mistake was mine, and I paid it in cash hahaha.

## And the Frontend? Same Story

To be fair, the inconsistent inheritance didn't stop at the backend. When I started touching the v3 frontend (a thin port of v2), the same old wounds became noticeable from the other side of the stack: fields whose sources moved around, naming conventions that changed with the era, and code that let me, an ordinary backend engineer, smell spaghetti without being a frontend expert hehe~

But that's a story for another series, maybe. This one is long enough.

## Epilogue Lessons

1. **Price the return trip before departing.** A database migration isn't a one-way road; it's a round trip unless the decision is fenced in with data.
2. **SQL dialect flexibility is expensive.** If you want to switch engines freely, don't touch engine-specific features (yes, including my poor _LISTEN_/_NOTIFY_). If you want engine-specific features, don't promise portability. Pick one.
3. **One dataset, one home.** Two engines are fine, as long as their roles don't overlap. What's exhausting isn't the count; it's the overlap.
4. **Decisions above your pay grade are still decisions you have to live with.** Our job isn't to win the meeting; it's to keep the system alive after the meeting ends, while keeping a record of what it cost hehe.

And with that, it's truly closed. Thank you for reading all the way to the post-credits scene. May your fleets (if you have any) always speak, and may your database engines never change course.

Cheers.

[^1]: Quotes and the order of events are presented from memory and personal notes, with technical terms simplified; names of people and providers stay undisclosed, consistent with earlier episodes.

[^2]: Quick explanation: _LISTEN_/_NOTIFY_ is a PostgreSQL feature for sending signals between applications connected to the same database. Great for live updates; useless once the application changes engines.
