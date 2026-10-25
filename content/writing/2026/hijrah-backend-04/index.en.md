---
title: "Hijrah Backend (4): Old Code as an Executable Spec"
description: "Episode 4 of the Hijrah Backend series: parity-first, why a migration isn't the time for improvements, the story of an 'improvement' I ended up deleting myself, and the dependency talk behind 22 lines of go.mod."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:04+07:00
lastmod: 2026-09-10T23:30:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - migration
  - architecture
  - story
series: "Hijrah Backend"
---

If I had to boil down the one rule that ran this whole migration, I'd say: **the old system is right.**[^2]

Annoying, I know. You're trusted to move a system to a new language, and rule number one is: change nothing. Not faster, not cleaner, not better. **Identical.** But after living with it, I get why this anticlimactic rule makes sense.

## Why the New System Must Stay Loyal to the Old One

Not nostalgia. The reasons are very practical.

First, **trust**. Tens of thousands of users have trusted the old system's output for years: same numbers, same formats, same quirks. A migration that quietly changes results is spending that trust without permission.

Second, **debugging**. If the new system's output differs from the old one, there's exactly one suspect: the port. The logic has been tested in production for years. But if I "improve" the logic while switching languages, every new bug has two suspects: the new logic, or the translation. [Episode two](/en/writing/2026/hijrah-backend-02/) already showed how expensive debugging with the wrong suspect gets.

Third, the one people forget most: **documentation can lie, code can't**. The system I inherited had almost no documentation. All the knowledge lived in one person's head, and when that person wasn't around, the legacy app was an old city without a map. The old code is the only spec you can actually run, and a runnable spec can't lie. It always admits what it really does, warts included.

Honest, yes, but sometimes it talks in riddles. The old system loved repeating the same query inside loops when one combined query would do. Then there's the framework's signature magic: write `$this->device()`, and a method appears, defined who-knows-where and since who-knows-when. What gets me is that it successfully returns data. PHP considers that normal. In Go, everything that got conjured has to be written out explicitly, one by one. At first it felt like losing shortcuts, but eventually I knew what was in the kitchen.

## The Rules: What Must Match, What's Free

Parity doesn't mean everything has to be twins. The split looks like this:

**Must be identical**: business logic, response shape down to field names and edge-case behavior, rounding rules, odd defaults, and yes, quirks.

**Free to differ**: how the data is fetched. My favorite example is in [episode two](/en/writing/2026/hijrah-backend-02/): an endpoint that ran hundreds of small chained queries in PHP became a single CTE query in Go. The result must match, the road there is up to me.

This split kept the migration fun. I wasn't photocopying a dictionary, I was building a new bridge with the exact same town square at each end.

## The Story: The "Improvement" I Had to Delete Myself

My favorite part, because it was an expensive lesson.

One vehicle-history endpoint in the old system returned a few extra fields: alarm history, geofence activity, and driving-behavior incidents. My first Go version filled all of them properly: speed-limit alarms, SOS, and geofence entries and exits. Richer and more useful, or so I thought at the time. _Ehem._

Then I traced through the old system and found what is now my favorite picture in this whole codebase:[^1]

```php
//get data alarm history
// $history_alarms = $device->getHistoryAlarm($start_date, $end_date, ...);
$history_alarms = [];
```

The original query had been **commented out by someone**. Not deleted, but commented out, then replaced with an empty array. So those three fields had been returning empty in production for years. And when I checked the frontend: not one of them was used.

The decision came out as a sentence that sounds odd coming from an engineer: _"delete my improvement, match the old system, keep it empty."_

It felt strange, deliberately lowering your own code's "quality" to stay faithful to the system you're replacing. But **silent improvements are poison in a migration**. If that alarm data ever needs filling, decide that separately, don't smuggle it into the migration.

## Small Quirks That Must Be Copied

Parity goes down to things that look trivial. A real example: when a vehicle's total moving time is zero, the old system shows a dash `'-'`, not "0 min". The reason is simple: a helper in the old code was only called for positive values, so zero never got formatted. My first version showed "0 min". Technically more correct, but in production terms it's different, so it's wrong.

One more edge case: unreasonable date ranges (say, an end date in the future). The old system replies with a specially-shaped empty envelope, while my first version replied with a bare array. Normal users would never notice, until the day their response-parsing script does hahaha.

Copying odd behavior and writing it into tests with a straight face feels kind of unique. I know it isn't "the right way", it's "the way that's already trusted". In a migration, the second one wins.

## The Parity Tax: Fields by the Bucketful

Another inherited habit: JSON responses in the old system tended to ship by the bucketful. One endpoint answering with dozens of fields, some nested deep, not all of them used by the frontend. In PHP, handing over a bucketful feels cheap. In Go, famously efficient, serializing that bucketful is a real cost paid on every request. Parity made me carry it as-is first. That's the price of faithfulness hehe.

The bucketful was also born from a habit that spread: the frontend wasn't consistent about which endpoint a field came from, sometimes from here, sometimes from there, depending on the taste of the era. Naming conventions drifted between eras too. The result: the existing app feels like a patchwork house. But honestly, for a patchwork house it's sturdy, years of use by tens of thousands of people hahaha.

The inconsistency didn't stop at data sources. Types improvised too: the same field might arrive as a number, or, when empty, as an empty string. To PHP, a difference that small is too polite to notice. To strictly typed Go, an empty string claiming to be a number stands at the door and refuses to fill in the form hahaha.

It gets more creative: the same field, sent from different pages to similar endpoints, arrived once as a number and once as a string. PHP accepted both with a smile. Go rejected both with a lengthy decoding error.

One more that's almost a running joke among developers: the old system loved answering empty results with HTTP 200 carrying `[]` or `null`. Another status code could have said the data wasn't there, but the frontend had relied on `[]` for years. The parity rule says: copy it. So my Go system also reports "all clear" while carrying empty news.

Since I knew my responses would be bucketfuls, I built the evidence tool: a small audit that checks the frontend for every field, which ones are actually read and which are just passing through. That audit became the receipt when cleanup time came. It also helped with the alarm-history story above: nobody was reading any of it.

## Parity Is Not Dogma

By now this might sound like a cult of faithfulness. Relax, parity has exceptions.

The old system had one timezone adjustment that was plainly a bug, shifting data back an hour or two in certain timezones. That one I did not copy. The difference from the alarm case: I took this exception consciously, wrote down the reasoning, and I'm ready to defend it. **Parity is the default, not dogma.** Exceptions are fine as long as they're conscious, documented, and explainable.

## The Other Side of the Spec: Dependencies

In the early months, I got one piece of advice from the senior leading this project: _"stick to the standard library as much as possible."_

My reaction inside my head: skeptical. I thought a rule like that was too rigid, what matters is whether we're aware the libraries we use might have breaking changes, right? But I nodded along. The reason is simple and a bit embarrassing: I was afraid that if my repo got inspected and I hadn't followed instructions, I'd get a talking-to hehe.

Funny thing is, months into the project, that inspection never came. And reality spoke for itself: as of this writing, my `go.mod` has **22 direct dependencies**: a web framework, database drivers, a cache, structured logging, config, and friends.

The principle I actually ended up following isn't "standard library only", but something looser and also more demanding: **every dependency must be able to answer one question, why isn't the standard library enough for this?** An HTTP framework? The stdlib genuinely isn't comfortable there. Date/time handling? The stdlib is enough, so no extra library. It's not about the count, it's that every line has a reason.

A rule enforced through fear might get obeyed, but a rule nobody understands won't last. Luckily I found a healthier principle than just obeying.

## Takeaways

1. **The best spec for a migration is the old code itself.** Always up to date, can't lie, and runnable as a comparison.
2. **Being faithful matters more than being better.** Improvements can come later, once the new system is stable, as separate decisions.
3. **Parity exceptions must be conscious and documented.** The default is copy, and whatever you don't copy needs a reason you can say out loud.
4. **A good dependency rule contains reasons, not numbers.** "Standard library only" sounds disciplined, but "every dependency needs a reason" is the one that's actually workable.

Next episode we go to the database kitchen: a query with a good index that chooses not to use it, and a `DATE()` wrapper that slows down a table with tens of millions of rows.

Cheers.

[^1]: Code snippets in this post are simplified from their originals, field names and structure kept just enough to tell the story; internal details altered.

[^2]: "The old system is right" applies during the migration. Once the new system is stable and verified, it passes the exam and earns the right to chart its own changes.
