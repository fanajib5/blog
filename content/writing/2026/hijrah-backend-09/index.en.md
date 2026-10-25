---
title: "Hijrah Backend (9): Epilogue, MySQL, PostgreSQL, Then MySQL Again"
description: "Epilogue of the Hijrah Backend series: the story of a database engine that changed direction twice, a LISTEN/NOTIFY optimization that went to waste, double work, and a frontend legacy smelled from across the stack."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:09+07:00
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

The series ended in [the previous episode](/en/writing/2026/hijrah-backend-08/). But one story didn't make it into the main run. It happened after I had written almost every other episode. Think of it as a post-credits scene: the screen is dark, the lights are on, and there's one more scene hehe.

It's the story of a database engine told to change course twice. I wasn't the one holding the wheel; you can probably guess who was hahaha.

## The Original Vision: One PostgreSQL for Everything

The initial direction was clear and written down. In the bosses' group chat in early 2025, the message came through firmly:[^1] cloud, plus Go, plus PostgreSQL is a must. One engine for everything, one SQL dialect, one queue of technologies to learn. It was a compelling vision, and I was enthusiastic too.

The work was substantial: converting the schema from MySQL, fixing data types with no direct equivalents, importing conflicting data, then rebuilding the models in Go. One feature made me especially proud: real-time updates between applications using PostgreSQL's own _LISTEN_/_NOTIFY_. We didn't need an extra message broker for that; the database itself knocked on the door. A little greedy, but in a technical way hehe~

## Back to MySQL It Goes

About a year later, the wind changed. The decision: the legacy system stays on MySQL, and the main domain data goes back to MySQL. PostgreSQL wasn't removed; it was moved to a better home: time-series location data, the hungriest data and the one most in need of time partitioning.

From a business point of view, the decision made sense. The same data didn't need to be maintained on two engines under two sets of rules, and the legacy system had outlived everyone's plans. I had no argument with the logic.

The cost of the switch, though, landed in the same place: on my desk.

An application born and raised in the PostgreSQL dialect suddenly had to switch to MySQL's dialect: different syntax, different SQL _standard library_ behavior, and types with different names and quirks. Errors sprouted in places that had been green the day before. The finished _LISTEN_/_NOTIFY_ optimization? Out of a job. I had to do the same work a second time, with hands that had memorized all the wrong roads hehe~

## What Remains of Two Worlds

The end result looks like peace after a duel: MySQL holds the domain data, PostgreSQL holds the location data. Two engines, two roles, no overlap. This architecture didn't come from a tidy whiteboard drawing. It came from two major decisions that reversed course while the deployments had to keep running.

Which one was right? Both, in their own time. The original vision had its reasons; reversing it made sense from a cost perspective. My mistake was assuming the architecture wouldn't change direction, then building everything without a fallback plan. I paid for that mistake in cash hahaha.

## And the Frontend? Same Story

The inconsistent inheritance didn't stop at the backend. When I started touching the v3 frontend, a thin port of v2, the same old problems showed up from the other side of the stack: fields with sources that moved around, naming conventions from different eras, and code that let me, an ordinary backend engineer, smell spaghetti without being a frontend expert hehe~

Maybe that's a story for another series. This one is long enough.

## Epilogue Lessons

1. **Price the return trip before departing.** A database migration isn't a one-way road; it's a round trip unless the decision is fenced in with data.
2. **SQL dialect flexibility is expensive.** If you want to switch engines freely, don't touch engine-specific features (yes, including my poor _LISTEN_/_NOTIFY_). If you want engine-specific features, don't promise portability. Pick one.
3. **One dataset, one home.** Two engines are fine, as long as their roles don't overlap. What's exhausting isn't the count; it's the overlap.
4. **Decisions above your pay grade are still decisions you have to live with.** Our job isn't to win the meeting; it's to keep the system alive after the meeting ends, while keeping a record of what it cost hehe.

That's the end of the post-credits scene. Thanks for reading. May your fleets, if you have any, keep reporting in, and may your database engines stay on course.

[^1]: Quotes and the order of events are presented from memory and personal notes, with technical terms simplified; names of people and providers stay undisclosed, consistent with earlier episodes.

[^2]: Quick explanation: _LISTEN_/_NOTIFY_ is a PostgreSQL feature for sending signals between applications connected to the same database. Great for live updates; useless once the application changes engines.
