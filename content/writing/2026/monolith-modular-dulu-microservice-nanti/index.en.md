---
title: "Modular Monolith First, Microservices Later: A Philosophy of Backend Simplicity"
description: "Why the modular monolith is still my default, and what kind of problem might make microservices worth the cost."
author: "Faiq Najib Al-Aziz"
date: 2026-11-24
lastmod: 2026-11-24
draft: true
toc: true
comments: true
images:
  - og.png
tags:
  - architecture
  - backend
  - golang
  - opinion
pillar: "backend"
---

Lately I keep hearing this interview question: "why isn’t your system on microservices yet?" Sometimes it sounds less like a question and more like a test of whether I am cool enough. As if a monolith were embarrassing, a modular monolith respectable, and you only made it once everything was split into some number of services. But what problem are we trying to solve?

My current choice is this: **a modular monolith is a sensible starting point for many backends. Microservices are useful when the problem they solve actually exists.** This is not a rule for everyone, just what I have concluded from the systems I have worked on.

## A System I Work On

The system I have in mind is a GPS fleet tracking backend. It receives positions from many devices, stores millions of points per day in TimescaleDB, serves hundreds of API endpoints, and handles billing and geofencing. When I describe it, someone usually says, "that must need microservices."

And its architecture is **a single Go binary**. (Yes, just one.)

That one binary has packages like `listener`, `decoder`, `ingest`, `api`, and `ws`. They have clear boundaries, explicit internal contracts, and separate usecase/repository layers. It deploys as one container. When something goes wrong, I do not have to look through logs from several services at once. I write more about it in my [GPS Backend series](/en/writing/2026/memahami-gps-protocol/).

We are not against microservices. We just try to count the costs first.

## What Microservices Actually Buy You

Microservices are not the only way to solve technical problems. Often their biggest benefit is for **organizational problems**:

Usually the problem shows up when teams keep blocking each other's deployments, a codebase becomes too large for one team to own, or the organization is already split along Conway's law. At that point, clearer ownership boundaries can help.

Those are real problems in large organizations. But if you have a team of five and deploy twice a week, you may not have them yet. You may be paying in advance for a future problem, through the **distributed system tax**: handling network failures, keeping data consistent, setting up tracing, maintaining a deployment pipeline for every service, and finding bugs spread across several logs.

Those extra costs keep showing up, even when a small team should be busy building the product.

## A Modular Monolith Is Not a Sloppy Monolith

I am not defending a monolith where everything imports everything else and controllers are 2,000 lines long. That kind of codebase makes changes painful. A team might decide it needs microservices, when the original problem was that nobody kept the module boundaries in check.

I prefer the **modular monolith**. Its boundaries are clear and enforced, but communication between modules stays in-process. No extra network hop for every call.

In my project, modules communicate through explicit interfaces instead of casually reaching into other domains' tables. I also try to keep each module understandable on its own and dependencies flowing one way, for example usecase -> repository, not back and forth.

There is proof in that same tracking project: migrating from Laravel to Go was done **without a big-bang rewrite**. Both backends ran in parallel, and endpoints moved route by route through a reverse proxy. That worked because the module boundaries and contracts were clean from the start. Boundaries that can move across runtimes can later move across services.

## When I Would Split the System

For me, "microservices later" does not mean never. There are conditions that would make me consider splitting the system. None of them is "because it is trendy":

1. **Deployments are genuinely stepping on each other**: Different teams must release distinct components at different cadences, and cross-team coordination bottlenecks surface every single week.
2. **Severely skewed workload profiles**: One module demands fundamentally different resource tiers (for example, heavy computation jobs that merit scaling independently from lightweight HTTP APIs).
3. **Failure isolation has proven genuinely painful**: Crashes in one non-critical module repeatedly bring down the entire system, and not because of a bug that can simply be patched.
4. **The organization is already structurally divided**: Distinct teams with autonomous ownership, independent release schedules, or entirely different target runtimes.

If one of those conditions shows up, I do not have to start from scratch. I can use the **strangler pattern**, extract the module that is most ready, and route traffic through a proxy. The rest can follow if needed. Extraction is easier when the module boundaries are already clear. A messy monolith does not magically become clean microservices; the mess just moves onto the network.

So my order is: **make modules clear first, distribute them when there is a reason**. A modular monolith is not the enemy of microservices. It can be a calmer place to start.

## When Microservices Make Sense From Day One

There are also situations where microservices make sense from day one. Regulations might require personal data to stay in a particular jurisdiction or tenants might need physical isolation. The system might also need several runtimes with different lifecycles, like a pipeline running Python, Go, and JVM components. Or the product might be a multi-team platform from the start, such as a marketplace with independent business units.

Those are **real external constraints**, not imagined optimizations. If your need comes from team structure, regulation, or different runtimes, microservices may be right. If the reason is just to look modern, it may be worth sitting down and asking what problem you are trying to solve.

## Why I Pick This for Now

I once wrote that [choosing a tech stack is a business decision, not an ego trip](/en/writing/2026/tech-stack-ego-vs-business/). For the system I work on now, I prefer a modular monolith because I do not have a strong reason to add the operational work. If the need changes, I can reconsider. At least clear module boundaries leave that option open.

## Want to Talk?

If you've split a system for different reasons, you can [contact me](/en/contact/). You can also subscribe to [RSS](/en/writing/index.xml) to follow future posts.
