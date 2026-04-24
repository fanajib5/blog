---
title: "Choosing a Tech Stack: Between Ego and Business"
description: "The temptation to pick the latest technology is real, but is that decision driven by sound business logic, or just our developer ego?"
author: "Faiq Najib"
date: 2026-04-18
lastmod: 2026-04-22
draft: false
toc: true
comments: false
tags:
  - architecture
  - soft-skill
  - notes
---

_So anyway_, a while back I was sitting in an internal meeting, Zoom or Google Meet, I honestly can't remember, when a colleague suddenly lit up with enthusiasm:

> _"What if we migrate to microservices while we're at it? To be modern, to be scalable, to be-"_

_To be what, exactly?_ Our system at the time had two main features, a team of four people, and traffic that barely hit a thousand requests a day on its busiest day. The case for microservices? Zero. The enthusiasm for it? A hundred hahaha.

I can't blame him. I've been there. And if I'm honest, I still slip into that mindset sometimes. The pull toward shiny new technology is very real, and there's nothing inherently wrong with it, _as long as_ we recognize it as a pull, not a technical decision.

This piece is about the tension between two voices that often argue in my head whenever I have to choose a tech stack: the ego that wants to look sophisticated, and the business voice that only cares whether the system works, delivers value, and doesn't cost a fortune to keep alive.

## When Ego Does the Talking

The signs that a technical decision is being driven by ego are actually easy to spot, if you're willing to be honest with yourself:

**"This technology is trending."**
Open Twitter/X, scroll for two minutes, and you'll find three threads about a new framework that supposedly changes everything. A month later, there's another new framework that changes the previous one. And the cycle spins on. FOMO in the tech world is genuinely real, and dangerous if left unchecked.

**"It'll be hard to hire people if we stick with the old stuff."**
This argument sounds reasonable on the surface, but it's often used to justify a decision that's really about personal career goals, not system needs. Which is fair! But be honest that that's the motivation, not the system's requirements.

**"Everyone in the community is already using this."**
Peer pressure doesn't stop after high school. In developer circles, it looks like feeling left behind if you haven't adopted Kubernetes yet, haven't tried Rust, or haven't containerized everything, even when your system is a perfectly fine little monolith hehe~

**"Good code is fun to write."**
This one is the most dangerous because it hides behind a cloak of professionalism. We choose a complex architecture not because it's needed, but because it's _exciting_ to implement. And the one who ends up bearing that weight is whoever inherits the codebase later[^1].

## The Business Doesn't Care About Your Stack

Here's a slightly uncomfortable truth that needs to be said: **the business doesn't care if you use PHP or Go, REST or GraphQL, Postgres or MySQL**, as long as the system runs, is fast, is cheap to operate, and can be extended when new requirements come in.

What the business actually cares about:

| Engineer's Question | Business Question |
|---|---|
| Is this technology state-of-the-art? | Can it be done on time? |
| Is the architecture elegant? | Can the team maintain it? |
| Can this scale to millions of users? | What's the monthly server cost? |
| Does this use a popular language? | If someone leaves the team, how long does onboarding take? |

Notice how the two columns are talking about completely different things. And we often spend too much time in the left column, while the people paying our salaries are thinking from the right.

This doesn't mean we should ignore technical concerns. Poor technical choices today become expensive technical debt tomorrow, _and that is also_ a business concern. The point is that **both sides need to be considered**, not just one.

## A Framework That Doesn't Hurt

After choosing wrong a few times (and living with the consequences hehe), I've landed on four questions I now run through before committing to a new stack or architecture:

### 1. Can my team maintain this six months from now?

Not "can I implement this?", but "can the team live with this long-term?" If I leave tomorrow, can someone else continue without a two-week breakdown?

The technology we choose should be understandable by the most junior person on the team[^2]. If not, we're building a knowledge silo, and that's genuinely risky.

### 2. Does this solve a real problem that exists now, or a hypothetical one that might exist later?

Premature optimization is the enemy of productivity. Building a complex event-driven architecture for an application that may never reach millions of users is an extremely costly decision, both in time and in complexity.

The rule I try to hold: **solve the problem that exists right now, with a solution that's good enough for measurable current needs**. If scaling becomes necessary later, refactor with evidence, not assumptions.

### 3. What's the real cost?

Not just cloud costs, but time costs. How long does setup take? How long for onboarding? How long to debug when something breaks? How long before a new developer understands the system well enough to contribute?

Sophisticated technology that takes a week to set up locally is expensive, before a single line of business logic has been written.

### 4. Does this improve time-to-market or slow it down?

Delivery speed matters enormously to a business. A feature that's six months late can mean lost opportunities, users going to a competitor, or investors losing confidence.

If a technology choice speeds up delivery, great. If it slows it down, reconsider, even if the technology is technically the "more correct" choice.

## Lessons from the Field

Let me self-reflect for a moment here. I wrote previously about [migrating a backend system from PHP to Go](/writing/2026/legacy-php-to-go-migration/), 370+ endpoints, 33 entities, nearly 200,000 lines of code.

And the honest question I had to ask myself at the time was: **was this a business decision, or was it my ego wanting to work with Go?**

The answer was... both, but with a measured balance hehe~

The **ego** side: yes, I was genuinely excited about Go. I wanted deeper hands-on experience with it. I liked how Go handles concurrency. That was all real, and I won't pretend otherwise.

But the **business** side was equally real:

- The legacy system had serious architectural problems, not because of PHP itself, but because of the complete absence of layer separation, making every change a high-risk operation
- Unpredictable deploys had caused multiple production incidents
- Low test coverage had made the team afraid to refactor, even when refactoring was urgently needed
- A single Go binary eliminated the dependency hell on the server that had been consuming the ops team's time

So Go wasn't chosen purely because it's cool, but because in that specific context, the trade-offs made sense: a large upfront migration cost[^3], but with measurable long-term benefits.

That's what separates a business-driven technical decision from an ego-driven one: **there's a clear trade-off analysis, and you're willing to stand behind it**.

## Ego Isn't Always the Villain

One thing I want to clarify before closing: **developer ego isn't inherently bad**.

Wanting to learn new technologies is good, that's what keeps us growing. Wanting to write clean, elegant code is good, that's what makes systems easier to maintain. Wanting to push for better solutions is good, that's what drives real innovation.

The problem is when ego **clouds our judgment**, when we choose technology to look smart, not to solve problems. When we build complex systems not because they're needed, but because they're fun to build. When we defend a wrong choice because we don't want to admit a mistake.

Being aware of that difference, I think, is one of the more important marks of maturity in a software engineer.

That's all from me. Thanks for somehow ending up here and reading this, I hope it's useful hehe~

[^1]: And it's usually ourselves, six months later, who've completely forgotten why we built it that way in the first place hahaha.
[^2]: This doesn't mean you can't use advanced technology. It means there's a responsibility for documentation, an onboarding plan, and ensuring knowledge isn't centralized in one person.
[^3]: Migration using an incremental, per-module approach rather than a big-bang rewrite, a hard lesson learned from many teams who've tried the latter and failed.
