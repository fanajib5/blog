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

This is the first post in **Building Akordium Lab**, a monthly account of building a software company in Surabaya. I am writing as I go, not after a victory lap.

Why write in public? I have two reasons. First, I learn best by writing. If I do not document an experience, it fades. Second, I envy people who build small businesses in public: open startups, indie hackers, and developers selling their own products. They shape their own narrative and community. I want to try that too, in my own way.

One disclaimer: this is not a success story; it is a process log. The numbers and conclusions might be wrong. Part of the fun will be rereading these posts a year from now and shaking my head.

## Why Start

I am a backend developer. My day-to-day work involves PHP/Laravel, and lately more Go and PostgreSQL. I also work on systems that need to stay up around the clock, including a GPS tracking system that handles locations for thousands of vehicles every day. I enjoy this work.

But the pattern of "project comes in -> build it -> ship it -> gone" began to feel wasteful. Every project leaves me with knowledge about architecture, trade-offs, decisions, mistakes, and fixing a 2 AM incident. It all evaporates when the contract closes. One piece of work, one output. Nothing accumulates.

That is why I designed Akordium Lab around one principle: **one piece of work must produce multiple assets.** A client project should yield articles, libraries, templates, case studies, and, when feasible, products. Of all my plans for the next 12 months, this is the rule I will not compromise on.

## What Is on the Table (September 2026)

Here is the starting inventory: the state of things at the end of September 2026, when this content strategy got underway.

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

## Guiding Principles

Three decisions that might differ from typical software agencies:

1. **Backend first, keep it simple.** Go + PostgreSQL + modular monolith. No microservices on day one and no Kubernetes out of FOMO. I will add complexity when it is needed, not because it is trendy. That lesson also comes from the production system migrations I write about on this blog.
2. **Open core for products.** DukunGPS is designed on the Traccar model: an open source core (Apache 2.0) with paid enterprise features. Open source should build trust and distribution, not serve as a CSR gesture.
3. **Write everything down.** Every architectural decision, every solved problem, every mistake. The personal blog builds authority; akordium.id converts that attention. They support each other rather than compete.

## 12-Month Targets

To keep myself accountable, I broke the targets into measurable milestones:

| Target | Metric |
| --- | --- |
| GPS Backend Series completed + compiled into an ebook | 6+ articles, 1 lead magnet ebook |
| Content published consistently | adheres to roadmap, no gap > 2 weeks |
| Newsletter gains its first core readership | 50 subscribers |
| DukunGPS crosses Phase 0-1 milestone | open-source core repo released + early community |
| Contributors/leads generated from content | prospective client mentions "read the blog first" |

What I am **not** targeting in these 12 months is product revenue that replaces consulting services. Realistically, that is a 2-3 year goal. This year is about building assets and distribution.

## Mistakes This Month

Yesterday's content planning session nearly caused a funny little mishap. My AI assistant and I almost **rewrote an article that had already been written**. The old draft was sitting in a folder, forgotten by both of us. We nearly did it again.

The lesson: if I do not write something down, it is easy to forget. Now every content plan lives in one roadmap with a status for each article, plus cross-session memory for the AI assistant. A little meta, but "document it or lose it" applies to the documentation process too.

## Metrics to Report Monthly

Every Building Akordium Lab post will report the same five metrics so I can compare progress over time:

1. Published content vs planned
2. Product progress (DukunGPS and companions)
3. Subscribers/traffic
4. One mistake + one lesson learned
5. Key decisions made that month

I will hold off on financial figures for now. There is nothing exciting to share yet, and I have not decided how open I want to be about them. I will revisit that later.

---

That is where Akordium Lab stood at the end of September. The 12-week roadmap is in place, and the GPS Backend series starts publishing next week.

If you are also building a product or an agency, I would love to hear your story. [Get in touch here](/en/contact/), or follow the next posts via [RSS](/en/writing/index.xml).

Next month: the first report.

Cheers.
