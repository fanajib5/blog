---
title: "Hijrah Backend (7): From TCP Packets to a Time-Series Database"
description: "Episode 7 of the Hijrah Backend series: how TCP packets from thousands of GPS trackers become tidy rows, why there's a queue in the middle, a producer that used to throw everything away, and a database that understands time."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T015:30:00+07:00
lastmod: 2026-09-11T00:30:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - infrastructure
  - rabbitmq
  - timescaledb
series: "Hijrah Backend"
---

Every second, the fleet talks. Tens of thousands of GPS trackers send TCP packets carrying positions, ignition status, signal strength, and the system must swallow all of it, around the clock, with no "please send less data" campaign hahaha.

In [episode one](/en/writing/2026/hijrah-backend-01/) I mentioned it briefly: the old system received and wrote within a single service. The new system splits that into three stages: a listener that only receives and decodes packets; a message queue in the middle; and a consumer that writes to the database. This episode walks through each stage, including two moments where I tripped, classically hehe~

## Why Is There a Queue in the Middle

A fair question: doesn't an extra hop mean extra latency?

Here's the logic: the speed of receiving packets and the speed of writing to the database are two different speeds. The fleet doesn't care if the database is busy, trackers keep sending. If receiving and writing are chained together, a slow database slows reception down, and failed data can only hope the device politely resends.

The queue separates those two speeds. The listener receives as fast as the fleet talks and drops packets into the queue; the consumer pulls from the queue as fast as the database allows. Midday spikes get absorbed by the buffer. But, and this is the big lesson of this episode, every new component brings a new way to fail. And I found mine in the most classic way possible: directly in production hahaha.

## When the Broker Sleeps: The Producer That Threw Everything Away

A scenario the old system never had: what if the queue itself dies? The old system had no such failure mode, it inserted directly; if the database sulked, the device would just retry later. My new system's first answer, which I now regret: if the broker connection dropped... **the messages got discarded**.

Silent, efficient, and horrifying. Customer vehicle positions, thrown away quietly because infrastructure sneezed.

The fix came in layers. First: don't give up quickly, stepped retries over several seconds, so a briefly stumbling broker costs zero packets. Second: if it stays down longer, don't discard quietly, **throw loudly**: a clear error log, not a warning someone might find three weeks later. Third, and my favorite: honest backpressure. My queue holds around 8,000 packets;[^2] when it fills, `Send()` waits, the listener slows down automatically, and the trackers on the other end start TCP retries. The net effect is almost philosophical: **data isn't lost, it just arrives late.** A source that waits isn't failure; it's the cheapest storage ever invented hehe.

The comment in my producer code documents this chain with some pride: queue full → `Send()` blocks → listener slows → device retries. A chain that once looked like a bug turned out to be a designed safety net.

## Discipline in the Wrong Place

Stage two: the consumer writing thousands of location rows at once (bulk insert). Here I once made a beautifully ironic mistake: inside the mass-write loop, if one row failed, the function returned an error immediately, and **all remaining locations in that pile got thrown away with it**.

The funny part: the old PHP system actually `continue`d in this case. My Go version, "more disciplined about errors", turned out to be more wasteful with data than the version I considered lax. The first fix was nine letters: `return` became `continue`, plus a log so failed rows stay visible. Then the same treatment went to every other sender, capped by tuning: the consumer buffer grew tenfold with more workers to drain it, all recorded in config comments as decisions, not mysterious numbers hahaha.[^1]

The lesson stuck: **caring about errors is good; giving up entirely because of one error isn't discipline, it's drama.** In a data pipeline, choosing between `continue` and `return` is a data-life-or-death decision, and it deserves to be taken seriously every time it appears.

## A Database That Understands Time

The final stage: location data is time data, its value is the link (when, where), and its rows are born without pause. For this I use PostgreSQL with a time-series extension: the location table becomes a hypertable, partitioned automatically by time.

Two luxuries the old system never had. First, **compression**: aged data chunks get compressed automatically, more than a hundred chunks now live frugally, and certain indexes are built directly over the compressed form without unpacking it. Second, **retention that runs itself**: a weekly policy drops data older than a set age. The old system cleaned up old data manually, back then, with prayers. Now the database owns the calendar hehe~

Together they turned "when do we tidy up old data?" from a ritual into a configuration.

## Lessons

1. **Every new component has a new way to fail.** Adding a queue means answering from day one: if the broker dies, what happens to the data?
2. **Failing is fine; failing silently is not.** Retry, then fail loudly. A patient warning waiting to be read is a hole.
3. **`continue` vs `return` in bulk loops is a data-life-or-death decision.** One word turns "one row failed" into "a thousand rows discarded".
4. **Backpressure is a feature.** When capacity runs out, letting the source wait is the cheapest storage there is.
5. **Automatic retention replaces ritual.** What used to be a routine manual chore full of prayers is now just a policy that runs itself.

The next episode is the last of this series: a retrospective of almost two years, what I'd do differently, and the part I'm most grateful for. See you at the finale.

Cheers.

[^1]: Code snippets and configuration figures are simplified, the originals are longer and carry internal details.

[^2]: Infrastructure capacities (queue size, worker counts, retention windows) are shown as orders of magnitude; what matters for the story is the direction and the reasoning.
