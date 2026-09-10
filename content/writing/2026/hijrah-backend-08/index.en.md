---
title: "Hijrah Backend (8): Eighteen Months in Retrospect (Give or Take)"
description: "The final episode of the Hijrah Backend series: what I'd do differently, the transcontinental anti-pattern promised back in Ep 2, a teaching plan that never happened, and the thank-yous."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:00+07:00
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

This is the final episode of the series. And as you might have guessed from the title, the "eighteen months" figure itself needs quotation marks: counted from day one to when this post was written, the number is larger. But fine, numbers on slides each get their own version; this series has been a story about that gap since the beginning hahaha.[^1]

The previous seven episodes handled technical lessons one by one. This episode holds the rest: what I'd do differently, the architecture debt I promised to discuss back in [episode two](/en/writing/2026/hijrah-backend-02/), one act that never happened, and the thank-yous.

## What I'd Do Differently If I Started Over

**First, I'd debate the target number with data, from day zero.** [Episode one](/en/writing/2026/hijrah-backend-01/) showed the arithmetic: 370+ endpoints, three months, roughly four endpoints per day with no days off. If I started over, I'd put that spreadsheet on the table during the interview itself: here's the count, here's the complexity, here's the headcount (one person). An honest number early is cheaper than burnout in the middle.

**Second, documentation written from day one.** One of the hardest parts of the old system's inheritance wasn't the code, it was the knowledge: everything lived in one person's head, with the code as the only specification. I enjoyed playing "walking documentation" when answering questions; I don't want anyone, including myself a few years from now, depending on that. This blog series is partly its repayment hehe.

**Third, parity verification gets scheduled, not felt.** [Episode three](/en/writing/2026/hijrah-backend-03/) told the story: I announced "done" while verification was below 100%, and I was proven right. If I started over, verification would be a checklist with its own time budget, not a feeling I wait for.

**Fourth, mental health goes into the project estimate.** There was a three-month period early on that collected its payment from my head. I don't regret working hard; I'd just write that duration in equally honest ink as the endpoint estimate.

**Fifth, architecture gets discussed before it gets inherited.** Which brings us to my promise.

## The Architecture Debt Promised Since Ep 2

In [episode two](/en/writing/2026/hijrah-backend-02/) I promised to cover one thing in the final episode: why the lighter endpoints in this system still carry a floor of about 2-3 seconds after all the fixes.

The cause isn't code; it's architecture. Users in Indonesia, main database in Indonesia, but the application in a European cloud region. Every click pays for two crossings. As long as that's inherited, every optimization has a limit: we went from 17 seconds to 3, but three seconds is the floor, and floors can't be patched by code.

The way out is clear and long identified: move the application closer to the database and users, or pull a replica closer. Neither is a refactoring; both are infrastructure decisions involving budget and cross-party coordination. So here is the honest confession of a solo writer: **some debts cannot be repaid alone, and admitting that is part of the job.**[^2] May a follow-up episode someday be written as a success story, not just a blueprint hahaha.

## The Act That Never Happened

There's one act I almost told as my favorite part of this series: being asked to teach Go to the team. The plan existed since August 2025. I prepared the material myself, structured into four weeks: Go fundamentals, functions and data structures, OOP and concurrency, up to web development with Go. One colleague even bought an online course to join the learning.

As of this episode, the class has never happened.

And on reflection, it makes a fitting closer for a series full of stories about the gap between plans and reality: the last plan to fall through was the plan about me teaching. The material still hangs neatly in its repo, waiting to be scheduled, queued behind other schedules that started waiting earlier hehe.

> Honestly, I do feel some disappointment. The reason is simple: I had hoped that teaching Go to the team would let them see, up close, the importance of planning in coding and of using proper data types, the kind of thing that should feel important through experience, not through my class. I admit I'm not a structured reader myself; I read whatever I currently need, so my knowledge feels like scavenged knowledge. But from that habit I instead learned debugging and system analysis, to better understand how programs behave and how to handle production issues.

## What I'm Most Grateful For

This series started with a job opening that asked me to execute someone else's decision, went through a three-month mandate, an endpoint eating 15 seconds, a speeding parked car, and hundreds of small decisions in between.

But if you ask what I'm most grateful for, the answer isn't technical.

> Besides the chaos I went through during this migration to Go, I'm grateful for the sheer amount of knowledge I gained, from the technical side to the psychological, management, and leadership sides. All of it, _Alhamdulillah_, I could reach through Allah's blessing and the never-ending prayers of my family and my wife.

I'll add just one sentence of my own: not many jobs let you watch something you wrote quietly working for tens of thousands of people, every second, without asking for attention. That's a privilege. _Alhamdulillah_.

## Closing the Series

Seven episodes, one retrospect, and one journey that was supposedly three months.

Thank you for following along this far. If you happen to be in the middle of a migration like this: measure first, write the docs, take care of yourself, and remember that "done" is a spectrum. See you in future writings, which hopefully won't need another migration to happen first hehe.

Thanks for stopping by. Have a great day!

Cheers.

[^1]: Figures in this retrospect refer to earlier episodes, each of which carries its own rounding notes.

[^2]: Infrastructure details and names of parties stay undisclosed, consistent with earlier episodes.
