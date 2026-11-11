---
title: "Hijrah Frontend (5): Two Sides of One Building"
description: "A note from the end of Hijrah Frontend: the port is done, a few things are still waiting, and I’m still learning to look after this inherited code."
author: "Faiq Najib Al-Aziz"
date: 2026-09-23T09:00:05+07:00
lastmod: 2026-09-23T21:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - frontend
  - retrospect
  - story
series: "Hijrah Frontend"
---

This is the final _frontend_ episode. Like the closing episode of [the neighboring series](/en/writing/2026/hijrah-backend-09/), I don’t want to write as if every problem is solved. I just want to note what’s done, what we haven’t touched, and what I learned while looking after both sides of this building.

## Let Me Check the Inventory

Four episodes ago, I started taking apart the inherited _frontend_ building. The port is done now, so here’s what’s in it:

- **76 pages moved and still working.** A 1:1 port without leaving a page behind. Every internal link still points to the right place.
- **Both UI libraries are still in use.** There are 101 files using the majority library and 13 using the calendar components. As before, no file uses both.
- **194 type scars measured.**[^1] Those 194 small safety nets are still installments, not architecture.
- **Three styling eras remain**,[^2] one backup has been retired, and _standardization_ is waiting its turn.

These numbers don’t mean the building is tidy. **The move is done, the renovation isn’t.** I had started treating those as the same job, but they clearly aren’t.

## Backend and Frontend, Both Inherited

Looking back at both series, the way we worked was similar even though the problems weren’t.

On the _backend_, we found non-sargable queries and _prepared statements_ cut off in the _tunnel_. On the _frontend_, we found fields with mismatched types and two UI libraries kept apart by a demarcation line. We handled both sides in much the same way: measure first, move faithfully, record what gets canceled, and don't fix things during the move.

Both systems also grew under time pressure and emergencies, not because someone sat down to design a perfect architecture. So I have a hard time blaming the _spaghetti_. The code kept serving its users as its caretakers changed.

## Notes for Later

To keep these things from piling up in my head, I split the notes like this:

From now on, I’ll keep the library boundary (no mixed files), the type contracts at the entrance, and the habit of recording what we inherited.

_TypeScript_, naming across eras, and internal refactoring can wait. I’d like to see usage data before changing the structure.

The _state management_ migration is canceled, and I don’t regret it. Plans that didn’t happen belong in the record too, instead of pretending they never existed.

> After all the wrestling with this v3 web app, I feel even more like a tourist. My heart still objects, but _production_ has to keep running.

In [episode one](/en/writing/2026/hijrah-frontend-01/) I joked about the tourist visa being revoked and replaced with a resident ID. The ID card did arrive, but my heart still carries its passport.

## Well, That’s That

With this episode, both Hijrah series are done: the [one _backend_](/en/writing/2026/hijrah-backend-01/) and the _frontend_ series. They cover two sides of the same building, still serving tens of thousands of users every day. The code doesn’t ask for applause, but I can, right? hehe.

If you’re looking after an inherited system too, I’d start by measuring. Move it as it is, note what’s left, and don’t force everything to be done at once. I’m still working on that last part myself.

Thanks for following this series to the end. I hope your building keeps running even as its caretakers change.

Cheers.

[^1]: Inventory figures refer to earlier episodes in this series, each of which carries its own measurement notes.

[^2]: Library, framework, and stack details stay simplified, consistent with the whole series.
