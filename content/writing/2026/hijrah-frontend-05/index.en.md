---
title: "Hijrah Frontend (5): Two Sides of One Building"
description: "The final episode of the Hijrah Frontend series: the thin port's honest closing inventory, the same lessons in different clothes, the inheritance we feed versus the one that waits, and a short farewell."
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

This is the final episode of the _frontend_ series. Like the closing episode of [the neighboring series](/en/writing/2026/hijrah-backend-09/), I don't want to make it a victory party. I want to record what is done, what we intentionally left unfinished, and what I learned after ending up looking after both sides of this building.

## The Honest Closing Inventory

The last four episodes took us through the inherited _frontend_ building. Now that the port is done, here's the inventory:

- **76 pages moved and still working.** A 1:1 port without leaving a page behind. Every internal link still points to the right place.
- **Both UI libraries are still in use.** There are 101 files using the majority library and 13 using the calendar components. As before, no file uses both.
- **194 type scars measured.**[^1] Those 194 small safety nets are still installments, not architecture.
- **Three styling eras remain**,[^2] one backup has been retired, and _standardization_ is waiting its turn.

This list doesn't mean everything is tidy. The building **finished being moved**, not renovated. Knowing the difference is the biggest lesson from both series.

## Two Sides of One Building

Read side by side, the two series share one pattern: **the lesson is similar, but the problems are different**.

On the _backend_, we found non-sargable queries and _prepared statements_ cut off in the _tunnel_. On the _frontend_, we found fields with mismatched types and two UI libraries kept apart by a demarcation line. We handled both sides in much the same way: measure first, move faithfully, record what gets canceled, and don't fix things during the move.

The conditions in both buildings were also shaped by the same things: **time and urgency**, not a neat architecture policy. That's why I can't hate the _spaghetti_ in this building. The code kept serving its users even as its caretakers changed.

## What We Feed, What We Wait For

Here's how we divided the items we recorded:

**What we maintain from now on**: the library boundary (no mixed files), type contracts at the entrance, and the habit of recording what we inherited, as we did in these four episodes.

**Waiting for its turn**: _TypeScript_ (a big decision that isn't due yet), naming standardization across eras, and internal refactoring once we have usage data.

**Canceled without regret**: the _state management_ migration. It's on the list of things that didn't happen, and that list is part of a healthy archive.

> In the end, after all the wrestling with keeping this v3 web app alive, I feel more and more like a tourist here. The heart says no, but the demands keep coming, and _production_ has to keep running.

In [episode one](/en/writing/2026/hijrah-frontend-01/) I joked about the tourist visa being revoked and replaced with a resident ID. The ID card did arrive, but my heart still carries its passport.

## Closing Both Series

With this episode, both Hijrah series are complete: [one _backend_](/en/writing/2026/hijrah-backend-01/) and one _frontend_. They cover two sides of the same building, serving tens of thousands of users every day without asking for applause.

If you're dealing with an inherited building of your own, _backend_, _frontend_, or otherwise, start by measuring. Move faithfully, record what remains, and take care of yourself. Not everything has to be done at once.

Thank you for following the series to the end. May your building keep serving well, even as its caretakers change.

Cheers.

[^1]: Inventory figures refer to earlier episodes in this series, each of which carries its own measurement notes.

[^2]: Library, framework, and stack details stay simplified, consistent with the whole series.
