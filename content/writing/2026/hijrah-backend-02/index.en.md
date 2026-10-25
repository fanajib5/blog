---
title: "Hijrah Backend (2): Anatomy of a 15-Second Endpoint"
description: "Episode 2 of the Hijrah Backend series: forensics on an endpoint that took 15 seconds, four wrong hypotheses, one correct config line, and the lesson of reading logs before theorizing."
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

In [the previous episode](/en/writing/2026/hijrah-backend-01/) I mentioned an endpoint that took 15 seconds per call. What made the investigation memorable wasn't its technical complexity; it was how confidently I settled on several wrong explanations.

## One Click, Seventeen Seconds

One click on the fuel-estimation-per-vehicle-group endpoint, then a wait of about 17 seconds. For a dashboard people open every day, it felt like waiting on dial-up.

For weeks, the investigation had a soundtrack: _"Faiq, why is it erroring?" "Faiq, why is it slow?"_ Relax, sir, I am tracing it hehe.

The endpoint runs one CTE query[^1] against a device-summary table holding tens of millions of rows. I had my first suspect.

## Suspect #1: The Query, Obviously

_If it's slow, it's the query._ Every developer's reflex. Including mine.

So I opened EXPLAIN. And EXPLAIN answered: your query is fine, sir. The execution plan used the indexes properly, and its most expensive step still ran in tens of milliseconds. To be extra sure, I ran the same query straight against the database via CLI: 78 milliseconds, _including_ a round-trip across thousands of kilometers.

Seventy-eight milliseconds. The endpoint: 17,000 milliseconds. Suspect #1, dismissed. Oops hehe.

## Suspect #2: Geography

This part is embarrassing, but important: the architecture I inherited ran the application in a European cloud region while its main database lived in Indonesia. Thousands of kilometers apart, every MySQL query paid a toll of about 190 milliseconds one way. The users and database were both in Indonesia, but the data took a detour through Europe.

With that setup, theory two sounded very reasonable: a small connection pool making requests queue up for expensive round-trips. So I enlarged the pool, added timeouts, tuned idle connections. Deployed with hope.

Result: 16.57 seconds became 15.64 seconds. I suspected the drop was just noise. The pool change hadn't explained the problem.

## Suspect #3: Connection Age

Still on the same track, theory three arrived: the database server kills idle connections at the ten-minute mark, while the application believed its connections lived for 30. An age mismatch = zombie connections = failures mid-flight.

This theory wasn't entirely wrong, the mismatch was real, and fixing it was worthwhile anyway. But it also didn't answer the main mystery: the number stayed above 15 seconds. Three accusations, three misses. Time to stop theorizing and start listening.

## The Logs Speak, Every Theory Collapses

That night I opened the application logs:

```text
GetGasEstimationByGroups query failed: invalid connection
```

Not a slow 200. **A failing 500.** The endpoint wasn't stingy with time, it was erroring out, the database driver auto-retrying, each retry paying the cross-continent reconnect cost, failing again, until giving up. The frontend retried too. And to the user, all of it looked like... "slowness".

After that, two clues I'd missed became clear:

1. CTE queries always failed; simple queries in the same pool always succeeded.
2. The same gas query, run through the CLI, sailed through in 0.7 seconds.

What differs between the app and the CLI? **The protocol.** My app was using prepared statements (the MySQL binary protocol, three round-trips per query), while the CLI speaks the text protocol (one round-trip). And on that binary path, the server was resetting the connection mid-execution. The road itself wasn't bare internet either: the connection to the database servers in Indonesia crossed a VPN tunnel, and inside that corridor the binary-protocol CTE queries were killed mid-flight, while the slim text-protocol queries slipped through without a scratch.

## One Line That Ended It All

The final fix was a single DSN line:

```go
InterpolateParams: true,
```

In plain words: send queries over the text protocol, the driver interpolates parameters client-side (with proper escaping, so it's still injection-safe as long as you keep using placeholders, never manual string concatenation), exactly like that CLI which never failed.

Deployed. Clicked the dashboard. And _invalid connection_ never appeared again. Alhamdulillah. Weeks of battle, and the final blow turned out to be one line long hehe.

## What's Proven, What's Still a Guess

Now for the part rarely written down: separating what's **proven** from what's still a **guess**.

**Proven**: over a VPN tunnel to the database, binary-protocol CTE queries were killed mid-flight repeatedly; the text-protocol path avoids it; the one-line fix eliminated the errors entirely in production.

**Still a guess, to this day**: why exactly that tunnel punishes the binary path on complex CTE queries (and only them). There are candidate explanations, but I never obtained definitive proof, and I think admitting that in a public post is fine hahaha. Honest debugging doesn't have to end in total certainty; it just has to end with the problem gone.

Oh, and those two "wrong" fixes along the way (pool size and connection lifetime)? I kept both, they happen to be best practices anyway. So not a total loss, right? hehe~

## Lessons

1. **Measure before accusing.** One EXPLAIN killed a theory that nearly made me rewrite an innocent query.
2. **Read the logs before building theories.** The answer had been sitting in the logs for weeks while I was busy judging queries, geography, and connection ages.
3. **Asymmetry is a golden clue.** What always fails vs. what always succeeds, once you underline that line, the cause reveals itself.
4. **"Slow" is sometimes really "failing repeatedly".** Odd latency always deserves suspicion of stacked retries.

As I write this, the lighter endpoints in that system still have a floor of about 2-3 seconds because of the same transcontinental architecture. The remaining latency is a story of its own.

[^1]: CTE (Common Table Expression), a way to write layered queries with named sub-results, starting with `WITH`. Pleasant to read; occasionally makes the database think very hard.

[^2]: Infrastructure details (provider names, exact locations, capacity figures) are deliberately rounded or omitted, this series is about the lessons, not the addresses.
