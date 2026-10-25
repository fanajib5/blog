---
title: "Hijrah Backend (7): From TCP Packets to a Time-Series Database"
description: "My experience moving GPS packets through a queue into TimescaleDB, including the messages I used to discard and a small choice that nearly dropped even more data."
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

In [episode one](/en/writing/2026/hijrah-backend-01/) I mentioned that the old system received packets and wrote them to the database in one service. The new setup splits the work: a listener receives and decodes packets, a queue holds them, and a consumer writes them to the database. Here’s how the pieces fit together, plus a mistake or two I made hehe~

## Why Is There a Queue in the Middle

Maybe you’re wondering: doesn’t adding a hop add latency?

Receiving packets and writing them to the database happen at different speeds. Trackers keep sending even when the database is busy. If receiving and writing are tied together, a slow database slows the listener too. A packet that fails to get in can only hope the device tries again.

The queue gives packets a place to wait. The listener can keep receiving while the consumer takes messages as fast as the database can write. The buffer helps with midday spikes. A new component also means a new way for things to fail. I found that out the classic way: in production hahaha.

## When the Broker Goes Down, Messages Go Too

The old system didn’t have to worry about a dead queue because it inserted directly. If the database sulked, the device could try again later. My new system had a different problem. My first answer was to discard messages when the broker connection dropped. **Yes, just throw them away.** I still wonder why that seemed reasonable at the time.

The broker connection dropped without warning, and customer vehicle positions disappeared too. The infrastructure sneezed, and the data went down with it.

I fixed it in a few steps. A broker that’s only stalled gets retries for a few seconds. If it stays down, the error needs to show up in a log instead of sitting quietly until someone finds it weeks later. Then I added backpressure. The queue holds around 8,000 packets;[^2] when it fills, `Send()` waits. The listener slows down and the trackers try again over TCP. So **the data isn’t lost, it just arrives late**. Making the source wait turns out to be cheaper than losing packets hehe.

The producer comment now records the chain: queue full → `Send()` blocks → listener slows → device retries. It looked like a bug at first, but it can work as a safety net.

## Discipline in the Wrong Place

Next, the consumer writes thousands of location rows at once (bulk insert). I made a pretty ironic mistake here: if one row failed in the loop, the function returned an error immediately. **Every location after it got thrown away too.**

The old PHP system actually used `continue` here. My Go version, supposedly "more disciplined about errors", wasted more data. The first fix was simple: replace `return` with `continue`, then log failed rows. I made the same change in the other senders, increased the consumer buffer tenfold, and added workers. The config comments explain those numbers instead of leaving them mysterious hahaha.[^1]

That taught me that choosing `continue` or `return` in a loop isn’t just a style preference. One error can stop thousands of rows from being processed. I try to think through the effect before picking the option that looks more disciplined.

## A Database That Understands Time

The final stage stores location data, which is always tied to a time and a place. For that I use PostgreSQL with a time-series extension. The location table becomes a hypertable, partitioned automatically by time.

There are two things the old system never had. First, **compression**: old chunks are compressed automatically. More than a hundred chunks now live that way, and certain indexes can be built directly on the compressed data without unpacking it. Second, **automatic retention**: a weekly policy drops data past a set age. The old system cleaned up old data by hand, with prayers. Now the database keeps the schedule hehe~

Now if someone asks when old data gets cleaned up, I can just point to the policy hehe.

## A Few Notes From Me

The biggest change here wasn’t that a queue or a new database sounded exciting. I had to decide what the system should do when one piece failed, and make sure the failure was visible. `continue` and `return` both have their place. Pick the wrong one, and a lot of rows can disappear.

On the storage side, backpressure makes the source wait instead of dropping data. Compression and automatic retention also mean less manual cleanup. Some of the jobs I used to do with a prayer are now just database policies hehe.

Next is the series finale. I’ll look back at almost two years, what I’d do differently, and the part I’m most grateful for.

[^1]: Code snippets and configuration figures are simplified, the originals are longer and carry internal details.

[^2]: Infrastructure capacities (queue size, worker counts, retention windows) are shown as orders of magnitude; what matters for the story is the direction and the reasoning.
