---
title: "Hijrah Backend (7): From TCP Packets to a Time-Series Database"
description: "Episode 7 of the Hijrah Backend series: how TCP packets from thousands of GPS trackers become tidy rows, why there's a queue in the middle, a producer that used to throw everything away, and a database that understands time."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:07+07:00
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

Every second, the fleet has something to report. Tens of thousands of GPS trackers send TCP packets with positions, ignition status, and signal strength. The system has to take them all in, around the clock, with no "please send less data" campaign hahaha.

In [episode one](/en/writing/2026/hijrah-backend-01/) I mentioned that the old system received packets and wrote them to the database in one service. The new system separates that work into three parts: a listener receives and decodes packets, a message queue holds them, and a consumer writes them to the database. This episode covers how each part works, including two mistakes I made hehe~

## Why Is There a Queue in the Middle

A fair question: doesn't adding a hop add latency?

Receiving packets and writing them to the database happen at different speeds. The trackers keep sending even when the database is busy. If receiving and writing are tied together, a slow database slows reception too. Any packet that fails to get in can only hope the device sends it again.

The queue keeps those two jobs separate. The listener receives packets and puts them in the queue; the consumer takes them out as fast as the database can write. The buffer absorbs midday spikes. Each new component also brings a new way to fail. I discovered mine the classic way: in production hahaha.

## When the Broker Sleeps: The Producer That Threw Everything Away

A dead queue wasn't a scenario the old system had to handle because it inserted directly. If the database sulked, the device could retry later. My new system had a different problem, and my first answer is one I regret: if the broker connection dropped... **the messages got discarded**.

Quiet, efficient, and horrifying. Customer vehicle positions disappeared just because the infrastructure sneezed.

The fix came in layers. First, don't give up quickly: use stepped retries over several seconds so a broker that's only stalling doesn't cost us packets. Second, if it stays down, don't discard messages quietly. **Make the failure visible** with a clear error log, not a warning someone might find three weeks later. Third, and my favorite, use honest backpressure. My queue holds around 8,000 packets;[^2] when it fills, `Send()` waits. The listener slows down, and the trackers at the other end retry over TCP. The result is almost philosophical: **data isn't lost; it just arrives late.** Making the source wait isn't a failure. To me, it's the cheapest storage there is hehe.

The comment in my producer code documents this chain with some pride: queue full → `Send()` blocks → listener slows → device retries. A chain that once looked like a bug turned out to be a designed safety net.

## Discipline in the Wrong Place

In stage two, the consumer writes thousands of location rows at once (bulk insert). I once made a beautifully ironic mistake here: if one row failed in the mass-write loop, the function returned an error immediately. **Every location after it got thrown away too.**

The funny part is that the old PHP system `continue`d in this case. My Go version, "more disciplined about errors", wasted more data than the version I thought was lax. The first fix took nine letters: change `return` to `continue`, then add a log so failed rows stay visible. I applied the same fix to every other sender. Finally, I increased the consumer buffer tenfold and added more workers to drain it. The config comments record those choices instead of leaving mysterious numbers behind hahaha.[^1]

The lesson stuck with me: **caring about errors is good; giving up entirely because of one error isn't discipline, it's drama.** In a data pipeline, `continue` versus `return` can decide what happens to thousands of rows. It's worth thinking through each time that choice comes up.

## A Database That Understands Time

The final stage stores location data, which is always tied to a time and a place. For that I use PostgreSQL with a time-series extension. The location table becomes a hypertable, partitioned automatically by time.

There are two things the old system never had. First, **compression**: old chunks are compressed automatically. More than a hundred chunks now live that way, and certain indexes can be built directly on the compressed data without unpacking it. Second, **automatic retention**: a weekly policy drops data past a set age. The old system cleaned up old data by hand, with prayers. Now the database keeps the schedule hehe~

Together, they turned "when do we tidy up old data?" from a ritual into a configuration setting.

## Lessons

1. **Every new component has a new way to fail.** Adding a queue means answering from day one: if the broker dies, what happens to the data?
2. **Failing is fine; failing silently is not.** Retry, then fail loudly. A patient warning waiting to be read is a hole.
3. **`continue` vs `return` in bulk loops is a data-life-or-death decision.** One word turns "one row failed" into "a thousand rows discarded".
4. **Backpressure is a feature.** When capacity runs out, letting the source wait is the cheapest storage there is.
5. **Automatic retention replaces ritual.** What used to be a routine manual chore full of prayers is now just a policy that runs itself.

The next episode is the series finale: a look back at almost two years, what I'd do differently, and the part I'm most grateful for.

[^1]: Code snippets and configuration figures are simplified, the originals are longer and carry internal details.

[^2]: Infrastructure capacities (queue size, worker counts, retention windows) are shown as orders of magnitude; what matters for the story is the direction and the reasoning.
