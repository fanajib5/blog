---
title: "Building Akordium Lab #1: Starting from Scratch That Isn't Really Scratch"
description: "The first note on building Akordium Lab in public: why start, what is on the table as of September 2026, and measurable 12-month goals."
author: "Faiq Najib Al-Aziz"
date: 2026-10-01
lastmod: 2026-10-01
draft: false
toc: true
comments: true
images:
  - og.png
tags:
  - akordium
  - building-in-public
  - bisnis
pillar: "akordium"
series: "building-akordium-lab"
series_part: 1
---

This is the first post in a series I call **Building Akordium Lab** - monthly dispatches on building a software company out of Surabaya, written as I go, not after the victory lap.

Why write in public? Two reasons. First, I learn best by writing: if it is not documented, the experience simply evaporates. Second, I envy the folks building small businesses out in the open: open startups, indie hackers, developers selling their own products. They own their narrative and community. I want that too, in my own version.

Oh, and one disclaimer: this series is not a success story. It is a process log. The numbers and conclusions here might be wrong, and part of the fun later on will be rereading these posts a year from now while shaking my head.

## Why Start

I am a backend developer. My day-to-day work involves PHP/Laravel, increasingly more Go, PostgreSQL, and systems that must stay alive around the clock, including a GPS tracking system handling vehicle locations for thousands of units every day. Work I genuinely enjoy.

Yet the career pattern of "project comes in -> build it -> ship it -> gone" began feeling wasteful. Every project produces hard-won knowledge - architecture decisions, trade-offs, mistakes, how to fix an incident at 2 AM - and all of it evaporates the moment the contract closes. One unit of work, one output. No compounding assets.

So I designed Akordium Lab around a single principle: **one piece of work must produce multiple assets.** A client project should yield articles, libraries, templates, case studies, and, when feasible, products. Out of everything I have planned for the next 12 months, this is the one non-negotiable rule.

## What Is on the Table (September 2026)

To keep things honest, here is the baseline inventory - the state of affairs at the end of September 2026, right as this content strategy kicked off:

**Already live:**

- **[akordium.id](https://akordium.id)** - the company landing page, listing services and portfolio.
- **najib.id** - this personal blog. Two content tracks are currently in flight: the [Hijrah Backend narrative series](/en/writing/2026/hijrah-backend-01/) (a 9-episode story migrating 370+ endpoints) that just came out, and the [GPS Backend tutorial series](/en/writing/2026/memahami-gps-protocol/) kicking off this week; the rest is a mix of older posts (2019-2023) and a few other 2026 pieces.
- **Several internal products** at varying stages, ranging from tools in active use to concepts that exist only as business design documents.
- **DukunGPS** - an open-core GPS tracking platform plan that I take most seriously: the business design was finished and approved in July 2026, waiting on execution. Its foundation is the production GPS fleet tracking experience I share in the [GPS Backend series](/en/writing/2026/memahami-gps-protocol/).

**Freshly organized this month:**

- **Internal documentation system** (HQ) - a single home for SOPs, product specs, and content strategy. Previously scattered across chats, memory, and random docs.
- **12-week content roadmap** - GPS Backend Series as the flagship, AI workflow articles, and this Building Akordium Lab series.
- **GPS series master doc** - all technical material for the GPS series compiled into one single source of truth before being split into articles. Like I said: one unit of work, multiple assets.

**Not yet there:** a steady readership (newsletter/RSS subscribers are still in the single digits), product revenue (still zero - development consulting services keep the lights on), and name recognition beyond my immediate circle.

## Guiding Principles

Three decisions that might differ from typical software agencies:

1. **Backend first, keep it simple first.** Go + PostgreSQL + modular monolith. No microservices on day one, no Kubernetes out of FOMO. Complexity is bought when needed, not when trendy - a lesson carried over from the production system migrations I write about on this blog.
2. **Open core for products.** DukunGPS is modeled after Traccar: open source core (Apache 2.0), paid enterprise features. Open source becomes the engine for trust and distribution, not a CSR gesture.
3. **Write everything down.** Every architectural decision, every solved problem, every mistake. The personal blog serves as the authority engine, akordium.id as the conversion engine. They feed each other rather than compete.

## 12-Month Targets

To keep myself accountable, I broke down the targets into measurable milestones:

| Target | Metric |
| --- | --- |
| GPS Backend Series completed + compiled into an ebook | 6+ articles, 1 lead magnet ebook |
| Content published consistently | adheres to roadmap, no gap > 2 weeks |
| Newsletter gains its first core readership | 50 subscribers |
| DukunGPS crosses Phase 0-1 milestone | open-source core repo released + early community |
| Contributors/leads generated from content | prospective client mentions "read the blog first" |

What I am **not** targeting in these 12 months: product revenue replacing consulting services. Realistically, that takes 2-3 years. This year is about building assets and distribution.

## Mistakes This Month

Yesterday's content planning session almost produced a funny little accident: my AI assistant and I almost **rewrote an article that had already been written** - an old draft sat quietly in a folder without either of us remembering it. Not just once, almost twice.

The takeaway: unwritten memory does not exist. Now all content plans live in a single roadmap with per-article status tracking, plus cross-session memory for the AI assistant. Very meta, but the principle "document it or lose it" proved true even for the documentation process itself.

## Metrics to Report Monthly

Every Building Akordium Lab post will report the same set of metrics so progress can be compared over time:

1. Published content vs planned
2. Product progress (DukunGPS and companions)
3. Subscribers/traffic
4. One mistake + one lesson learned
5. Key decisions made that month

I will hold off on financial figures for now - there is nothing exciting to share yet, and I have not decided how open I want to be on that front. We will see.

---

That is the starting baseline. The desk is cleared, the roadmap is written, and the GPS series starts publishing next week.

If you are building something too - a product, an agency, anything - I would love to hear your story. [Reach out here](/en/contact/), or follow along via [RSS](/en/writing/index.xml).

Next month: the first report.

Cheers.
