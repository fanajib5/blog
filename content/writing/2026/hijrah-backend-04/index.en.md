---
title: "Hijrah Backend (4): Old Code as an Executable Spec"
description: "Episode 4 of the Hijrah Backend series: parity-first in full, why a migration is not the moment for improvements, the story of an 'improvement' I had to delete myself, and the dependency philosophy behind 22 lines of go.mod."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T015:30:00+07:00
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

If I had to compress the one rule that governed this entire migration, it would be this: **the old system is right.**[^2]

I know how that sounds. You're trusted to move a system to a new language, and rule number one is: nothing changes. Not faster. Not cleaner. Not better. **Identical.** This episode unpacks why the most anticlimactic rule turned out to be the sanest decision I've ever worked under hehe~

## Why the New System Must Stay Loyal to the Old One

Not nostalgia. Three very pragmatic reasons.

First, **trust**. Tens of thousands of users have spent years trusting the old system's output, same numbers, same shapes, same quirks. A migration that quietly changes results is a migration spending trust nobody authorized it to spend.

Second, **the debugging surface**. If the new system's output differs from the old one, there's exactly one suspect: the port. The logic has been battle-tested in production for years. But if I "improve" the logic while switching languages, every new bug comes with two suspects: the new logic, or its translation. [Episode two](/en/writing/2026/hijrah-backend-02/) already demonstrated how expensive debugging with the wrong suspect gets.

Third, and most often forgotten: **documentation lies, code doesn't**. The system I inherited had almost no documentation, all the knowledge lived in one person's head, and when that person wasn't around, the legacy app was an old city without a map. The old code is the only specification that can be executed. An executable spec cannot lie; it always admits exactly what it does, warts included.

One footnote about this spec, though: it is honest, but sometimes it speaks in riddles. The old system loved repeating the same query inside loops when one combined query would do. And then there is the framework's signature magic: you write `$this->device()`, and suddenly a method exists, defined who-knows-where, since who-knows-when, and, most mind-boggling of all, it successfully returns data. PHP treats all that as normal. In Go, every conjured trick has to be written out explicitly, one by one. At first it felt like losing shortcuts; eventually it felt like finally knowing what is in the kitchen hehe.

## The Rules: What Must Match, What's Free

Parity doesn't mean everything is a twin. I drew the line like this:

**Must be identical**: business logic, response shape down to field names and edge-case behavior, rounding rules, odd defaults, and yes, quirks.

**Free to differ**: how the data is fetched. My favorite example is in [episode two](/en/writing/2026/hijrah-backend-02/): an endpoint that ran hundreds of small chained queries in PHP became a single CTE query in Go. The result must match; the road there is free.

That split is what kept the migration interesting: you're not photocopying a dictionary, you're building a new bridge with an exactly identical town square at each end.

## The Story: The "Improvement" I Had to Delete Myself

This is my favorite part, because it was an expensive lesson.

One vehicle-history endpoint in the old system returned a few extra fields: alarm history, geofence activity, and driving-behavior incidents. My first Go version filled all three properly, speed-limit alarms, SOS, geofence entries and exits. Richer, more useful. I felt briefly heroic.

Then I traced the old system and found the view that is now my favorite picture in this whole codebase:[^1]

```php
//get data alarm history
// $history_alarms = $device->getHistoryAlarm($start_date, $end_date, ...);
$history_alarms = [];
```

The original query had been **commented out by someone**. Not deleted, commented, then replaced with an empty array. All three of those fields had returned empty in production for years. And when I checked the frontend: not one of them was used.

So the decision came out as a sentence that sounds strange coming from an engineer: _"delete my improvement. Match the old system: keep it empty."_

And it felt exactly as strange as it sounds. Deliberately lowering your own code's "quality" to stay faithful to the system you're replacing. But that's the point: **silent improvements are poison in a migration**. If filling that alarm data ever becomes necessary, it should be an explicit, separate decision, not a surprise that slipped through alongside the migration. Improvements are allowed; surprises are not hehe~

## Small Quirks That Must Be Copied

Parity goes all the way down to things that look trivial. A real example: when a vehicle's total moving time is zero, the old system displays a dash `'-'`, not "0 min". The reason is beautifully simple: a helper in the old code was only ever called for positive values, so zero never got formatted. My first version showed "0 min", technically more correct, and in production terms: different, therefore wrong.

One more edge case: unreasonable date ranges (say, an end date in the future). The old system replies with a specially-shaped empty envelope; my first version replied with a bare array. No user would ever notice, until the day their response-parsing script does hahaha.

Deliberately copying odd behavior, then writing it into tests with a straight face, is a unique experience. You know it isn't "the right way". You know it's "the way that's already trusted". And in a migration, the second one wins.

## The Parity Tax: Fields by the Bucketful

Another inherited habit: JSON responses in the old system tended to ship by the bucketful. One endpoint answering with dozens of fields, some nested deep, not all of them used by the frontend. In PHP, handing over a bucketful feels cheap. In Go, famously efficient, serializing that bucketful is a real cost paid on every request. Parity made us carry it as-is first; that's the price of faithfulness hehe.

The bucketful was born from a habit that spread: the frontend wasn't consistent about where a given field came from, sometimes from here, sometimes from there, depending on the taste of the era. Naming conventions drifted between eras too. The net result: the existing app feels like a patchwork house. And honestly, for a patchwork house, it's sturdy, years of service to tens of thousands of users hahaha.

And the inconsistency didn't stop at data sources. Types improvised too: the same field might arrive as a number, or, when empty, as an empty string. PHP treats that distinction far too politely to notice. Go, being strictly typed, meets the empty string claiming to be a number at the door and refuses to process its paperwork hahaha.

It gets more creative: the same field, sent from different pages to similar endpoints, arrived once as a number and once as a string. PHP accepted both with a smile. Go rejects both with a lengthy decoding error hahaha.

One more that is almost a joke among developers: the old system loved answering empty results with HTTP 200 carrying `[]` or `null`. It could have returned an honest status code that actually says the data was not found. But the frontend had built its life around that empty `[]` for years, and the parity rule says: copy it. So my Go system also reports "all clear" while carrying empty news hahaha.

Because I knew my responses would be bucketfuls, I also built the evidence tool: a small audit that checks the frontend for every field, which ones are actually read, which ones are just passing through. That audit became the receipt when cleanup time arrived. It also helped me in the alarm-history story above: nobody was reading any of it.

## Parity Is Not Dogma

At this point this might read like a cult of faithfulness. Relax, parity has exceptions.

The old system had one timezone adjustment that was plainly a bug, shifting data back an hour or two in certain timezones. I did not copy that one. The difference from the alarm case: this exception was taken consciously, its reasoning was written down, and I'm ready to defend it. **Parity is the default, not dogma.** Exceptions are allowed, as long as the exceptions know their place: conscious, documented, explainable.

## The Other Side of the Spec: Dependencies

Early on, I received one piece of advice from the senior leading this project: _"stick to the standard library as much as possible."_

My internal reaction at the time: skeptical. Rules like that feel needlessly rigid, what matters is being aware of whether the libraries you use are prone to breaking changes, right? But I agreed. For a simple, slightly embarrassing reason: I was afraid that if my repo got inspected and I wasn't following instructions, I'd get a talking-to hehe.

The funny part: months into the project, that inspection never came. And reality got the last word, as of this writing, my `go.mod` carries **22 direct dependencies**: a web framework, database drivers, a cache, structured logging, config, and friends.

The philosophy I actually ended up living isn't "standard library only". It's looser, and paradoxically stricter: **every dependency must answer one question, why isn't the standard library enough for this?** An HTTP framework? The stdlib genuinely isn't comfortable there. Date/time handling? The stdlib is enough, so no extra library. The rule isn't about counting; it's about every line having a reason.

The small lesson: rules enforced through fear get obeyed, but rules obeyed without understanding don't survive. Luckily the second thing happened to me, and the outcome was healthier than the rule itself hahaha.

## Lessons

1. **The best specification for a migration is the old code itself.** Always up to date, incapable of lying, and runnable as a comparison oracle.
2. **Faithfulness beats superiority.** Improvements can come, after the new system is stable, as explicit, separate decisions.
3. **Parity exceptions must be conscious and documented.** The default is copy; whatever you don't copy needs a reason you can say out loud.
4. **Good dependency rules contain reasons, not numbers.** "Standard library only" sounds disciplined; "every dependency must have a reason" is what actually survives contact with reality.

Next episode we head into the database kitchen: why a query with a perfectly good index can choose not to use it, and how a wrapper as small as `DATE()` can punish a table with tens of millions of rows. See you there.

Cheers.

[^1]: Code snippets in this post are simplified from their originals, field names and structure kept just enough to tell the story; internal details altered.

[^2]: "The old system is right" applies during the migration. Once the new system is stable and verified, it passes the exam and earns the right to chart its own changes.
