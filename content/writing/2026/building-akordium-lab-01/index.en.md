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

This is the first post in **Building Akordium Lab**. I plan to write monthly as I build a software company in Surabaya, so this is not a story told after everything worked out. I do not know yet how the whole thing will go.

Why write in public? I learn better when I write things down, and experiences fade if I leave them in my head. I also envy people who share the process of building small businesses, from startups to developers selling their own products. They get to build their own story and community. I want to try that too, even if my version includes a fair amount of confusion.

One disclaimer: do not expect a success story just yet. This is a process log, and I could be wrong about the numbers or conclusions. Hopefully I can reread this a year from now and shake my head (or laugh because none of the plans worked out, haha).

## Why Start

I am a backend developer. My day-to-day work involves PHP/Laravel, and lately more Go and PostgreSQL. I also work on systems that need to stay up around the clock, including a GPS tracking system that handles locations for thousands of vehicles every day. I enjoy this work.

But lately the "project comes in, I build it, ship it, then it is gone" pattern has started to feel wasteful. Every project teaches me something about architecture, trade-offs, decisions I regret, or fixing a 2 AM incident that definitely wakes me up. Much of it evaporates when the contract ends. One job, one result. That feels like a waste.

That is where Akordium Lab gets its guiding idea: **one piece of work should produce several assets, where possible.** A client project might become an article, a library, a template, a case study, or, if things go well, a product. I want to keep this in mind for the next 12 months. We will see if I actually stick to it, haha.

## What Is on the Table (September 2026)

To make the starting point clear, here is where things stood at the end of September 2026, when I started this content strategy:

**Already live:**

- **[akordium.id](https://akordium.id)** - the company landing page, listing services and portfolio.
- **najib.id** - this personal blog. Two content tracks are underway: the [Hijrah Backend narrative series](/en/writing/2026/hijrah-backend-01/), a 9-episode story about migrating 370+ endpoints that just came out, and the [GPS Backend tutorial series](/en/writing/2026/memahami-gps-protocol/) starting this week. The rest is a mix of older posts (2019-2023) and a few other 2026 pieces.
- **Several internal products** at different stages, from tools in active use to concepts that exist only in business design documents.
- **DukunGPS** - the open-core GPS tracking platform plan I take most seriously. Its business design was completed and approved in July 2026; execution is next. The foundation is my production GPS fleet tracking experience, which I share in the [GPS Backend series](/en/writing/2026/memahami-gps-protocol/).

**Freshly organized this month:**

- **Internal documentation system** (HQ) - one place for SOPs, product specs, and content strategy. Before this, they were scattered across chats, memory, and random docs.
- **12-week content roadmap** - with GPS Backend Series as the flagship, plus AI workflow articles and this Building Akordium Lab series.
- **GPS series master doc** - all technical material for the series goes into one source before I split it into articles. The same principle applies: one unit of work, multiple assets.

**Not yet there:** a steady readership (newsletter/RSS subscribers are still in the single digits), product revenue (still zero - development consulting services keep the lights on), and name recognition beyond my immediate circle.

## A Few Choices I Am Making

On the technical side, I am choosing Go + PostgreSQL and a modular monolith. No need for microservices or Kubernetes on day one just because of FOMO. Complexity can wait until there is a problem that needs it. For products, DukunGPS follows the Traccar model: an open source core (Apache 2.0) with paid enterprise features. I also want to write down the architecture decisions, solved problems, and mistakes. Hopefully this blog is useful to someone else too, not just a place for me to vent about work.

## 12-Month Targets

So I can hold myself accountable, I made the targets concrete:

| Target | Metric |
| --- | --- |
| GPS Backend Series completed + compiled into an ebook | 6+ articles, 1 lead magnet ebook |
| Content published consistently | adheres to roadmap, no gap > 2 weeks |
| Newsletter gains its first core readership | 50 subscribers |
| DukunGPS crosses Phase 0-1 milestone | open-source core repo released + early community |
| Contributors/leads generated from content | prospective client mentions "read the blog first" |

What I am **not** targeting in these 12 months is product revenue that replaces consulting services. Realistically, that is a 2-3 year goal. This year is about building assets and distribution.

## Mistakes This Month

During this month’s content planning, my AI assistant and I almost **rewrote an article I had already written**. The old draft was sitting in a folder. We nearly repeated the same blunder, even though the answer was just to look for it first, hehe.

I like to think my memory is pretty good. Apparently, I can even forget that I already wrote a draft. Now my content plans live in one roadmap with a status for each article, plus cross-session memory for the AI assistant. A little meta, but it turns out the documentation process needs documenting too.

## What I Will Check Each Month

In each Building Akordium Lab post, I will try to report the same five things so I can compare progress from month to month:

1. Published content vs planned
2. Product progress (DukunGPS and companions)
3. Subscribers/traffic
4. One mistake + one lesson learned
5. Key decisions made that month

I will hold off on financial figures for now. There is nothing exciting to share yet, and I have not decided how open I want to be about them. I will revisit that later.

---

That is where Akordium Lab stood at the end of September. I have a 12-week roadmap, and the GPS Backend series is supposed to start publishing next week. Let’s see if the schedule survives contact with reality.

If you are also building a product or an agency, I would love to hear your story. [Get in touch here](/en/contact/), or follow the next posts via [RSS](/en/writing/index.xml).

Next month: the first report.

Cheers.
