---
title: "Hijrah Backend (8): Eighteen Months in Retrospect (Give or Take)"
description: "The final episode of the Hijrah Backend series: what I'd do differently, the architecture debt promised back in Ep 2, a teaching plan that never happened, and thank-yous."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:08+07:00
lastmod: 2026-09-10T15:40:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - retrospect
  - career
  - story
series: "Hijrah Backend"
---

This is the series' final episode. The "eighteen months" in the title needs quotation marks: by the time I wrote this, more time had passed since day one. Oh well, numbers on slides make their own rules. This series has been about that gap from the start hahaha.[^1]

The previous seven episodes covered the technical lessons. In this last part I go through what I'd change if I started over, the architecture debt I promised in [episode two](/en/writing/2026/hijrah-backend-02/), a teaching plan that never happened, and what I'm grateful for.

## What I'd Do Differently If I Started Over

**First, I'd discuss the target with data from day one.** [Episode one](/en/writing/2026/hijrah-backend-01/) showed the arithmetic: 370+ endpoints, three months, roughly four endpoints a day with no days off. If I started over, I'd bring that spreadsheet to the interview: here's the count, here's the complexity, here's the available headcount (one person). An honest number early is cheaper than burnout halfway through.

**Second, write the documentation from day one.** The hard part of inheriting the old system wasn't just the code, it was the knowledge sitting in one person's head. The code became the only specification. I do enjoy being "walking documentation" whenever someone asks, but I don't want anyone, me a few years from now included, to depend on that. This blog series is one way I'm paying that debt off in installments hehe.

**Third, schedule parity verification instead of relying on a feeling.** In [episode three](/en/writing/2026/hijrah-backend-03/) I wrote about announcing "done" while verification was below 100%, and sure enough. If I started over, verification would have a checklist and time budget of its own, instead of waiting for me to feel ready.

**Fourth, put mental health in the project estimate.** The first three months took a toll on my head. I don't regret working hard, but next time I'd write down the duration and its toll as honestly as the endpoint estimate.

**Fifth, discuss architecture before inheriting it.** Which brings me to the promise I still owe.

## The Architecture Debt Promised Since Ep 2

In [episode two](/en/writing/2026/hijrah-backend-02/) I promised to explain why the lighter endpoints in this system still have a floor of about 2-3 seconds after all the fixes.

The cause isn't code, it's architecture. The users and main database are in Indonesia, but the application sits in a European cloud region. Every click crosses twice. As long as that arrangement stays, optimization has a limit. We got the response time down from 17 seconds to 3, but code alone can't break through that three-second floor.

The way out has been clear for a while: move the application closer to the database and users, or bring a replica closer. Neither is a refactoring; both are infrastructure decisions that need a budget and coordination across parties. So I have to admit, as the person working on it alone: **some debts cannot be repaid alone, and admitting that is part of the job.**[^2] I hope I can write a follow-up someday as a success story, not just a blueprint hahaha.

## The Act That Never Happened

There's one part I almost made my favorite of this series: being asked to teach Go to the team. The plan had been around since August 2025. I prepared four weeks of material: Go fundamentals, functions and data structures, OOP and concurrency, then web development with Go. One colleague even bought an online course so they could learn along.

As of this episode, the class has never happened.

Thinking about it, it fits a series about the gap between plans and reality: the last plan to fall through was my plan to teach. The material is still sitting neatly in its repo, queued behind other plans that have been waiting even longer hehe.

> Honestly, I do feel some disappointment. The reason is simple: I had hoped that teaching Go to the team would let them see, up close, the importance of planning in coding and of using proper data types, the kind of thing that should feel important through experience, not through my class. I admit I'm not a structured reader myself; I read whatever I currently need, so my knowledge feels like scavenged knowledge. But from that habit I instead learned debugging and system analysis, to better understand how programs behave and how to handle production issues.

## What I'm Most Grateful For

This series started with a job opening that asked me to carry out someone else's decision. Then came the three-month mandate, an endpoint taking 15 seconds, a speeding parked car, and hundreds of small decisions squeezed in between.

But if you ask what I'm most grateful for, the answer isn't technical.

> Besides the chaos I went through during this migration to Go, I'm grateful for the sheer amount of knowledge I gained, from the technical side to the psychological, management, and leadership sides. All of it, _Alhamdulillah_, I could reach through Allah's blessing and the never-ending prayers of my family and my wife.

I'll add just one sentence of my own: not many jobs let you watch something you wrote quietly working for tens of thousands of people, every second, without asking for attention. That's a privilege. _Alhamdulillah_.

## Closing the Series

Seven technical episodes, one retrospect, and a journey that was supposedly three months.

Thanks for following along. If you're in the middle of a similar migration: count the work, write things down, and don't forget to look after yourself. As for the word "done", well... turns out it stretches, as I learned on this trip.

[^1]: Figures in this retrospect refer to earlier episodes, each of which carries its own rounding notes.

[^2]: Infrastructure details and names of parties stay undisclosed, consistent with earlier episodes.
