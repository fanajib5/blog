---
title: "Choosing a Tech Stack: Between Ego and Business"
description: "Notes on the pull of shiny new technology, and how I try to tell curiosity apart from a project need."
author: "Faiq Najib Al-Aziz"
date: 2026-04-18
lastmod: 2026-09-11T09:28:00+07:00
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

Whenever I have to choose a tech stack, I hear two voices pulling in different directions: the ego that wants to look sophisticated, and the business that cares whether the system works and delivers value.

## Signs Your Ego Might Be Involved

If we're honest, ego-driven technical decisions tend to come with signs like these:

**"This technology is trending."**
Open Twitter/X and scroll for a bit. There will be a thread about some new framework that supposedly changes everything. Next month there will be another one that changes everything again. Round and round we go. Tech FOMO is real, and following it every time gets exhausting.

**"It'll be hard to hire people if we stick with the old stuff."**
That can be true. But sometimes this is a nice way to justify a decision that's more about personal career goals than the system. That's not wrong either. Just be honest about the reason.

**"Everyone in the community is already using this."**
Peer pressure doesn't stop after high school. In developer circles, it can look like feeling left behind because you haven't tried Kubernetes or Rust, or containerized everything, even though your little monolith is doing just fine hehe~

**"Good code is fun to write."**
This one is easy to dress up as professionalism. We pick a complex architecture not because we need it, but because it's fun to build. Then someone has to carry that codebase later, maybe us a few months from now[^1].

## The Business Usually Isn't Picking Your Stack

A little uncomfortable, but usually true: **the business doesn't care if you use PHP or Go, REST or GraphQL, Postgres or MySQL**. It cares that the system runs, is fast enough, costs a reasonable amount to operate, and can be extended when new needs show up.

In practice, business questions usually come back to things like these:

| Engineer's Question | Business Question |
|---|---|
| Is this technology state-of-the-art? | Can it be done on time? |
| Is the architecture elegant? | Can the team maintain it? |
| Can this scale to millions of users? | What's the monthly server cost? |
| Does this use a popular language? | If someone leaves the team, how long does onboarding take? |

The questions are different. I catch myself spending more time on the left while the people paying my salary are thinking about the right. Sometimes I need the reminder.

That doesn't mean technical concerns can be ignored. A poor technical choice today can become expensive technical debt tomorrow, which is a business concern too. We have to look at both sides.

## Questions I Ask Myself Now

After a few wrong turns (and dealing with the consequences hehe), I try to ask myself four things before choosing a new stack or architecture:

### 1. Can the team still maintain this six months from now?

The question isn't "can I implement this?" It's "can the team live with it?" If I leave tomorrow, can someone else continue, or will the first two weeks be a breakdown?

I want the technology we choose to remain understandable to the most junior person on the team[^2]. If not, we're building a knowledge silo, and that's genuinely risky.

### 2. Does this fix a real problem, or an imaginary future one?

Premature optimization is the enemy of productivity. Building a complex event-driven architecture for an application that may never reach millions of users is an extremely costly decision, both in time and in complexity.

My rule of thumb: **solve the problem in front of us with something good enough for what we can measure now**. If we need to scale later, refactor based on evidence, not my fortune-telling hehe.

### 3. What does it actually cost?

Not just cloud costs. Time counts too. How long does setup take? Onboarding? Debugging when something breaks? How long until a new developer can understand the system well enough to contribute?

Sophisticated technology that takes a week to set up locally is expensive, before a single line of business logic has been written.

### 4. Does this speed up time-to-market or hold it back?

Delivery speed matters enormously to a business. A feature that's six months late can mean lost opportunities, users going to a competitor, or investors losing confidence.

If a technology choice speeds up delivery, great. If it slows it down, reconsider, even if the technology is technically the "more correct" choice.

## One Example from My Own Work

Let me _self-reflect_ for a moment. I wrote about [migrating a backend from PHP to Go](/writing/2026/legacy-php-to-go-migration/). The project had 370+ endpoints, 33 entities, and nearly 200,000 lines of code.

And the honest question I had to ask myself at the time was: **was this a business decision, or was it my ego wanting to work with Go?**

The answer was both. I was curious about Go, but that wasn't the whole story hehe~

The **ego** side: yes, I was genuinely excited about Go. I wanted deeper hands-on experience with it. I liked how Go handles concurrency. That was all real, and I won't pretend otherwise.

But the **business** side was equally real:

- The legacy system had serious architectural problems, not because of PHP itself, but because of the complete absence of layer separation, making every change a high-risk operation
- Unpredictable deploys had caused multiple production incidents
- Low test coverage had made the team afraid to refactor, even when refactoring was urgently needed
- A single Go binary eliminated the dependency hell on the server that had been consuming the ops team's time

So Go wasn't chosen purely because it's cool, but because in that specific context, the trade-offs made sense: a large upfront migration cost[^3], but with measurable long-term benefits.

For me, what matters is being able to explain the trade-offs honestly and stand behind the decision. Not pretending I have no ego at all.

## Ego Can Be Useful Too

**Developer ego isn't always bad.** It can make us want to learn new things, write cleaner code, and push for better solutions. Those things can be useful.

The trouble starts when ego clouds our judgment. We choose technology to look clever instead of solving a problem. We build something complicated because it's fun, then defend a bad choice because admitting it feels embarrassing.

I still have to check my own motives from time to time. Sometimes the reason really is business; sometimes I just want to try a new technology. That's fine, as long as I don't mix the two up when explaining a decision to the team.

I won't always get that distinction right. But I think it's worth asking before we build the whole thing.

That's it from me for now. Thanks for somehow ending up here and reading to the end hehe~

[^1]: And it's usually ourselves, six months later, who've completely forgotten why we built it that way in the first place hahaha.
[^2]: This doesn't mean you can't use advanced technology. It means there's a responsibility for documentation, an onboarding plan, and ensuring knowledge isn't centralized in one person.
[^3]: Migration using an incremental, per-module approach rather than a big-bang rewrite, a hard lesson learned from many teams who've tried the latter and failed.
