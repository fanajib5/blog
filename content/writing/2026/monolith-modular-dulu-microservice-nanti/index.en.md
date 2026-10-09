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

There is an interview question I hear more and more often, and every time I hear it, I feel like asking back: "why isn't your system on microservices yet?" Delivered not as an inquiry, but as an accusation. As if architecture were a ladder of prestige: starting from the embarrassing monolith, climbing up to the decent "modular monolith", and graduating to demigod status once your database tables are split across twenty services tied together by a service mesh.

My stance in this article is simple, and I will defend it with practical experience rather than dogma: **a modular monolith is the correct default choice for the vast majority of backends, and microservices are the answer to problems you must actually have before paying to solve them.**

## A System That Pays Its Bills

To keep this from sounding like abstract theory, here is the system I run: a GPS fleet tracking backend that continuously ingests real-time location data from device fleets, stores millions of telemetry points per day in TimescaleDB, serves hundreds of API endpoints, plus billing and geofencing. Workloads that textbook theory routinely claims "definitely require microservices."

The architecture? **A single Go binary.**

Inside, there is strict discipline: packages like `listener`, `decoder`, `ingest`, `api`, and `ws`. Clear module boundaries, communication through explicit internal contracts, and clean usecase/repository layers. Deploying it takes a single container, observability needs just one log stream, and debugging requires one distributed trace at most. And that system, exactly as recounted in my [GPS Backend series](/en/writing/2026/memahami-gps-protocol/), effortlessly handles the very workload people worry can only survive on a fleet of separate services.

Not because we are anti-microservice. But because we did the math.

## What Microservices Actually Buy You

Microservices rarely solve technical problems that cannot be solved within a monolith. What they almost always solve are **organizational problems**:

- Multiple teams stepping on each other's deployments -> deployment independence
- Codebases too massive to fit into one team's collective head -> ownership boundaries
- Conway's law already fracturing the organization -> architecture reflecting team structure

Those are real problems, for companies with dozens or hundreds of engineers. If your team has five people and you deploy twice a week, you do not have those problems. What you have is an aspiration to have them, and that aspiration is paid for today with the **distributed system tax**: network failures between services you now have to handle, data consistency that is no longer free, distributed tracing that requires its own dedicated infrastructure, deployment pipelines multiplied by the number of services, and a single bug that once took one stack trace to find now scattered across five different log aggregators.

That tax is no myth. It is a monthly bill that arrives right when a small engineering team is at its busiest trying to build product value.

## A Modular Monolith Is Not a Sloppy Monolith

Let's be honest: advocating for a monolith is **not** the same as defending an unbounded, spaghetti codebase. A decaying monolith, with 2,000-line controllers where every file imports everything else, is the quickest way to ensure you will one day *genuinely need* microservices, simply because nobody can touch anything without breaking everything.

What I advocate for is a **modular monolith**: module boundaries enforced just as strictly as service boundaries, minus the network latency and wire serialization in between.

- Modules interact through explicit interfaces, never by reaching into another module's database tables
- Each module can be read, tested, and understood in isolation
- Dependencies flow strictly in one direction (such as usecase -> repository, never cyclical)

Proof that these boundaries are real, from that very same tracking project: migrating from Laravel to Go was done **without a big-bang rewrite**. Both backends ran in parallel, with endpoints migrated route by route through a reverse proxy. This was possible precisely because module boundaries and contracts were clean from the start. Boundaries that can move across runtimes can just as easily move across services when the time comes.

## When I Will Actually Graduate

"Microservices later" is not a hollow excuse. There are concrete signals that would prompt me to split a system, and none of them involve "because that is the current trend":

1. **Deployments are genuinely stepping on each other**: Different teams must release distinct components at different cadences, and cross-team coordination bottlenecks surface every single week.
2. **Severely skewed workload profiles**: One module demands fundamentally different resource tiers (for example, heavy computation jobs that merit scaling independently from lightweight HTTP APIs).
3. **Failure isolation has proven genuinely painful**: Crashes in one non-critical module repeatedly bring down the entire system, and not because of a bug that can simply be patched.
4. **The organization is already structurally divided**: Distinct teams with autonomous ownership, independent release schedules, or entirely different target runtimes.

When those signals arrive, the playbook is not starting over from scratch, but applying the **strangler pattern**: extract the most mature module into the first standalone service, point the proxy to route traffic, and let the rest follow when needed. Here is the catch: extraction is cheap only if module boundaries are already well defined. A tangled ball of yarn inside a monolith will not magically turn into clean microservices; you will only distribute your chaos across the network.

So the right sequence is not "monolith first, microservices once you are a senior engineer." The sequence is: **modular first, distributed only when required**. A clean modular monolith is the runway toward proper microservices, not its adversary.

## Healthy Room for Agreement

To keep this from being a one-sided polemic: there are circumstances where microservices are genuinely warranted from day one, and I would choose them without hesitation:

- Hard organizational boundaries mandated by compliance or regulation (personal data restricted to specific jurisdictions, independent audit silos, tenants requiring physical hardware isolation)
- Polyglot systems that are inherently federated runtimes by design, such as an ingestion pipeline running Python ML models, Go network handlers, and JVM batch jobs simultaneously with disparate lifecycles
- The business product is explicitly a multi-team platform on day one (a large-scale marketplace with independent business units)

Notice the pattern: all of these are **real external constraints**, not imaginary technical optimizations. As long as your justification can be formulated in a single sentence where the subject is "team / regulation / runtime", microservices make total sense. If the subject is "to look modern", head straight back to the drawing board.

## Closing Thoughts

I once wrote that [choosing a tech stack is a business decision, not an ego trip](/en/writing/2026/tech-stack-ego-vs-business/) and system architecture is simply the large-scale version of that same statement. Microservices are paid for with complexity; modular monoliths are paid for with discipline. For the teams and challenges most of us deal with, discipline is vastly cheaper. Moreover, you can convert discipline into architectural complexity whenever you genuinely need it, but you can rarely do the reverse.

Complexity purchased prematurely does not disappear. It merely waits to collect its monthly bill during the very months you are busiest building what truly matters.

## CTA

Share this article if you found it useful. For further discussions, check out [Contact](/en/contact/) or subscribe via [RSS](/en/writing/index.xml).
