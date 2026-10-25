---
title: "Modular Monolith First, Microservices Later: A Philosophy of Backend Simplicity"
description: "Microservices are not a badge of architectural maturity. They are a solution to organizational problems that not every team actually has. Here is why the modular monolith remains my default choice, and when it makes sense to graduate."
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

I hear this interview question more and more often: "why isn't your system on microservices yet?" Most of the time, it sounds less like a question than an accusation. As if architecture had a prestige ladder: start with the embarrassing monolith, move up to the respectable "modular monolith", then become a demigod once your system is split into twenty services tied together by a service mesh.

My position is straightforward: **a modular monolith is the right default for most backends. Microservices solve problems you need to actually have before you pay to solve them.** I am making that case from experience, not dogma.

## A System That Pays Its Bills

To ground this in something I run, the system is a GPS fleet tracking backend. It continuously ingests real-time location data from device fleets, stores millions of telemetry points per day in TimescaleDB, serves hundreds of API endpoints, and handles billing and geofencing. Workloads like these are often said to "definitely require microservices."

The architecture? **A single Go binary.**

Inside, packages like `listener`, `decoder`, `ingest`, `api`, and `ws` have clear boundaries and communicate through explicit internal contracts. The usecase/repository layers are clean. It deploys as a single container, needs one log stream for observability, and at most one distributed trace for debugging. As I describe in my [GPS Backend series](/en/writing/2026/memahami-gps-protocol/), this system handles the workload people assume needs a fleet of services.

We are not against microservices. We did the math.

## What Microservices Actually Buy You

Microservices rarely solve technical problems that cannot be solved within a monolith. What they almost always solve are **organizational problems**:

- Multiple teams stepping on each other's deployments -> deployment independence
- Codebases too massive to fit into one team's collective head -> ownership boundaries
- Conway's law already fracturing the organization -> architecture reflecting team structure

Those are real problems for companies with dozens or hundreds of engineers. If your team has five people and deploys twice a week, you do not have them yet. What you have is the expectation that you might someday, and that expectation is already costing you the **distributed system tax**: network failures between services that you now have to handle, data consistency that is no longer free, tracing that needs its own infrastructure, deployment pipelines multiplied by the number of services, and bugs that once took one stack trace to find but are now scattered across five different log aggregators.

That tax is real. The bill arrives every month, often when a small team is busiest building the product.

## A Modular Monolith Is Not a Sloppy Monolith

Defending a monolith is **not** the same as defending an unbounded spaghetti codebase. A decaying monolith, with 2,000-line controllers and every file importing everything else, can make you *genuinely need* microservices because nobody can touch anything without breaking something.

What I advocate for is a **modular monolith**: module boundaries enforced as strictly as service boundaries, while keeping communication in-process instead of adding network latency and wire serialization.

- Modules interact through explicit interfaces, never by reaching into another module's database tables
- Each module can be read, tested, and understood in isolation
- Dependencies flow strictly in one direction (such as usecase -> repository, never cyclical)

There is proof in that same tracking project: migrating from Laravel to Go was done **without a big-bang rewrite**. Both backends ran in parallel, and endpoints moved route by route through a reverse proxy. That worked because the module boundaries and contracts were clean from the start. Boundaries that can move across runtimes can later move across services.

## When I Would Split the System

"Microservices later" is not just a way to put off a decision. There are concrete signals that would prompt me to split a system, none of them "because that is the current trend":

1. **Deployments are genuinely stepping on each other**: Different teams must release distinct components at different cadences, and cross-team coordination bottlenecks surface every single week.
2. **Severely skewed workload profiles**: One module demands fundamentally different resource tiers (for example, heavy computation jobs that merit scaling independently from lightweight HTTP APIs).
3. **Failure isolation has proven genuinely painful**: Crashes in one non-critical module repeatedly bring down the entire system, and not because of a bug that can simply be patched.
4. **The organization is already structurally divided**: Distinct teams with autonomous ownership, independent release schedules, or entirely different target runtimes.

When those signals arrive, I would not start over. I would use the **strangler pattern**: extract the most mature module as the first service, route traffic through the proxy, and move the rest only if needed. Extraction is cheap only when module boundaries are already clear. A tangled monolith will not magically become clean microservices; it will only spread its mess across the network.

The sequence is not "monolith first, microservices once you are a senior engineer." It is **modular first, distributed only when required**. A clean modular monolith is the path to well-designed microservices, not their adversary.

## When Microservices Make Sense From Day One

There are circumstances where microservices make sense from day one, and I would choose them without hesitation:

- Hard organizational boundaries mandated by compliance or regulation (personal data restricted to specific jurisdictions, independent audit silos, tenants requiring physical hardware isolation)
- Polyglot systems that are inherently federated runtimes by design, such as an ingestion pipeline running Python ML models, Go network handlers, and JVM batch jobs simultaneously with disparate lifecycles
- The business product is explicitly a multi-team platform on day one (a large-scale marketplace with independent business units)

All three are **real external constraints**, not imagined technical optimizations. If your reason boils down to "team / regulation / runtime", microservices may be right. If it starts with "to look modern", go back to the drawing board.

## A Simpler Default

I once wrote that [choosing a tech stack is a business decision, not an ego trip](/en/writing/2026/tech-stack-ego-vs-business/). Architecture is the same decision at a larger scale. Microservices cost complexity; modular monoliths cost discipline. For most teams and problems, discipline costs less. Clear module boundaries also leave room to add complexity when it is needed. The reverse is much harder.

## CTA

If you've split a system for different reasons, you can [contact me](/en/contact/). You can also subscribe to [RSS](/en/writing/index.xml) to follow future posts.
