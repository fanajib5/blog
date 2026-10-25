---
title: "Hijrah Backend (2): Anatomy of a 15-Second Endpoint"
description: "My notes from digging into an endpoint that felt like 15 seconds, including the wrong theories I was very confident about."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:02+07:00
lastmod: 2026-09-10T23:00:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - debugging
  - database
  - story
series: "Hijrah Backend"
---

In [the previous episode](/en/writing/2026/hijrah-backend-01/) I mentioned an endpoint that could take 15 seconds per call. What I remember most wasn't the technical part, but how confident I was in explanations that turned out to be wrong. Ahem.

## One Click, Then a Wait

One click on the fuel-estimation-per-vehicle-group endpoint, then a wait of about 17 seconds. If you open that dashboard every day, the wait feels like going back to dial-up.

For weeks, the investigation had a soundtrack: _"Faiq, why is it erroring?" "Faiq, why is it slow?"_ Relax, sir, I am tracing it hehe.

The endpoint runs one CTE query[^1] against a device-summary table holding tens of millions of rows. I had my first suspect.

## Suspect #1, The Query

_If it's slow, it's the query._ Every developer's reflex. Including mine.

So I opened EXPLAIN. And EXPLAIN answered: your query is fine, sir. The execution plan used the indexes properly, and its most expensive step still ran in tens of milliseconds. To be extra sure, I ran the same query straight against the database via CLI: 78 milliseconds, _including_ a round-trip across thousands of kilometers.

Seventy-eight milliseconds. The endpoint: 17,000 milliseconds. Suspect #1, dismissed. Oops hehe.

## Suspect #2, The Distance

This part is embarrassing, but important: the architecture I inherited ran the application in a European cloud region while its main database lived in Indonesia. Thousands of kilometers apart, every MySQL query paid a toll of about 190 milliseconds one way. The users and database were both in Indonesia, but the data took a detour through Europe.

With that setup, theory two sounded very reasonable: a small connection pool making requests queue up for expensive round-trips. So I enlarged the pool, added timeouts, tuned idle connections. Deployed with hope.

Result: 16.57 seconds became 15.64 seconds. I suspected the drop was just noise. The pool change hadn't explained the problem.

## Suspect #3, An Old Connection

Still on the same track, theory three arrived: the database server kills idle connections at the ten-minute mark, while the application believed its connections lived for 30. An age mismatch = zombie connections = failures mid-flight.

This theory wasn't entirely wrong, the mismatch was real, and fixing it was worthwhile anyway. But it also didn't answer the main mystery: the number stayed above 15 seconds. Three accusations, three misses. Time to stop theorizing and start listening.

## Then I Read the Logs

That night I opened the application logs:

```text
GetGasEstimationByGroups query failed: invalid connection
```

Not a slow 200. **A failing 500.** The endpoint wasn't stingy with time, it was erroring out, the database driver auto-retrying, each retry paying the cross-continent reconnect cost, failing again, until giving up. The frontend retried too. And to the user, all of it looked like... "slowness".

After that, two clues I'd missed became clear:

1. CTE queries always failed; simple queries in the same pool always succeeded.
2. The same gas query, run through the CLI, sailed through in 0.7 seconds.

What differs between the app and the CLI? **The protocol.** My app was using prepared statements (the MySQL binary protocol, three round-trips per query), while the CLI speaks the text protocol (one round-trip). And on that binary path, the server was resetting the connection mid-execution. The road itself wasn't bare internet either: the connection to the database servers in Indonesia crossed a VPN tunnel, and inside that corridor the binary-protocol CTE queries were killed mid-flight, while the slim text-protocol queries slipped through without a scratch.

## One Config Line

The final fix was a single DSN line:

```go
InterpolateParams: true,
```

In plain words: send queries over the text protocol, the driver interpolates parameters client-side (with proper escaping, so it's still injection-safe as long as you keep using placeholders, never manual string concatenation), exactly like that CLI which never failed.

Deployed. Clicked the dashboard. And _invalid connection_ never appeared again. Alhamdulillah. Weeks of battle, and the final blow turned out to be one line long hehe.

## What's Proven, What's Still a Guess

Now I want to separate what's **proven** from what's still a **guess**.

**Proven**: over a VPN tunnel to the database, binary-protocol CTE queries were killed mid-flight repeatedly; the text-protocol path avoids it; the one-line fix eliminated the errors entirely in production.

**Still a guess, to this day**: why exactly that tunnel punishes the binary path on complex CTE queries (and only them). There are candidate explanations, but I never obtained definitive proof, and I think admitting that in a public post is fine hahaha. Honest debugging doesn't have to end in total certainty; it just has to end with the problem gone.

Oh, and those two "wrong" fixes along the way (pool size and connection lifetime)? I kept both, they happen to be best practices anyway. So not a total loss, right? hehe~

## What I Took Away

1. **Measure before accusing.** One EXPLAIN saved an innocent query from a rewrite. It had done nothing wrong hehe.
2. **Read the logs.** The answer had been there for weeks while I was busy blaming the query, distance, and connection age.
3. **Compare what fails with what works.** Once I noticed the CTE query always failed while the simple one worked, the clue was hard to miss.
4. **"Slow" can mean failing over and over.** If the latency looks odd, I now wonder whether retries are piling up.

As I write this, the lighter endpoints in that system still have a floor of about 2-3 seconds because of the same transcontinental architecture. The remaining latency is a story of its own.

[^1]: CTE (Common Table Expression), a way to write layered queries with named sub-results, starting with `WITH`. Pleasant to read; occasionally makes the database think very hard.

[^2]: Infrastructure details (provider names, exact locations, capacity figures) are deliberately rounded or omitted, this series is about the lessons, not the addresses.
