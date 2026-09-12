---
title: "Hijrah Backend (6): Tidying a Monolith While the Plane Keeps Flying"
description: "Episode 6 of the Hijrah Backend series: restructuring a monolith of tens of thousands of lines into 14 domain modules, census before moving, byte-identical moves, and why not microservices."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:00+07:00
lastmod: 2026-09-11T00:15:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - architecture
  - refactoring
  - story
series: "Hijrah Backend"
---

My Go system, fresh out of the migration, was born with one inherited illness. All repositories slept in two giant folders named `repository` and `usecase`, alerts, billing, geofence, fuel, everything mixed into one. Technically nothing was wrong; mentally, it was a big city with no districts. To find any house, you had to memorize the whole town.

This episode is about tidying that city, into 14 domain modules, while its endpoints kept serving production. Because, as you know, there's no pause button for a system used by tens of thousands of people hahaha.

## Why Not Microservices

The first question usually goes: if you want separated domains, why not go straight to microservices?

The answer: our team is small, and microservices aren't an architecture structure, they're an infrastructure decision. Every service means a new deployment, a new monitoring surface, a new set of network problems, plus inter-service communication that used to be free becoming expensive. For a team our size, trading tidy folders for six extra servers is like buying a house to store unused rooms.

What I needed wasn't process separation; it was responsibility separation. That has a name: the **modular monolith**, one binary, one deployment, but inside it every domain has a house with walls.

## A Module Is a House with One Door

My module convention is simple:[^2] one domain folder (say, `geofence`) holding its repositories and use cases; one `api` folder as the only exit, containing interfaces; and walls enforced by the **compiler**, not by good intentions.

The compile-time wall is the whole trick. If module rules live only in a README, they get violated during busy sprints, guaranteed; everyone has lived it. But if a module's internal repos can't be imported from outside its folder, the build turns red on the spot. Architecture violations become things you can't commit, not things you have to remember hehe.

## Census First, Move Later

The step most people skip when refactoring: counting who uses what before moving anything.

For the biggest module, device, I wrote a census document before touching a single line. The results surprised even me: 51 files outside the module consumed its repositories; the device-family repos offered 321 exported methods... and only **100** were ever called from outside.[^1] More than two-thirds of the stock had no customers. One "god" repository alone carried 122 methods, 49 in use.

The census had its own traps, which made me laugh out loud while living them. I counted consumers by name search, and the suffix "-device" turned out to grow everywhere: there was a shared-link-device repo, a user-group-device repo, neither actually family. Another repo had a digit in its name, and my letters-only search pattern walked past it without a glance. The humble conclusion: **a census that doesn't suspect itself will count the wrong world** hehe~

## Moves That Are Byte-Identical

Here the principle from [episode four](/en/writing/2026/hijrah-backend-04/) came back around, and it applies to my own house too: **moving is not the moment for fixing.**

The working rule: repository files move into their module without changing a single byte, Git itself admits they're 100% identical moves. What changes is only the door map: interfaces in the `api` folder, adapters forwarding to them, and the import paths of consumers. If a diff shows anything other than moves and renames, something has cheated on the plan.

Why so strict? Because reviewing a byte-identical move is cheap: you're not checking "is this logic right", you're checking "did anything change at all". Tens of thousands of lines change address with review questions answerable in minutes. The tempting little fixes along the way, "let's also rename this variable", all get postponed. One PR, one intention.

## Modules Are Allowed to Differ

Not every module got the same recipe. Geofence was sealed the tightest: legacy delegation wrappers deleted, dozens of dead methods swept out, and its error markers exported through the `api` door so consumers could inspect them without peering into the house. Sharing quietly made a little history: the first module that needed to read application config at its door.

The device module, the largest, I deliberately left with an open door for now: its repos remain directly importable, with a written plan for sealing later. That's a conscious exception, like the parity story in [episode four](/en/writing/2026/hijrah-backend-04/): dogma is for textbooks; living projects need documented exceptions.

## Cache Without Redis

One infrastructure decision people often ask about: the cache is in-process, [ristretto](https://github.com/dgraph-io/ristretto), not Redis. Partly because the office doesn't run Redis and nobody wanted a new service just for caching; partly because of my deployment philosophy: one binary, shift, run. The cache dying together with its process is fine, it isn't the source of truth, just acceleration. If scale ever demands a shared cache across instances, that decision happily reopens. What matters is that the decision has a living reason, not an inheritance nobody dares touch hahaha.

## The Debt That Remains

To stay faithful to the tradition of [episode five](/en/writing/2026/hijrah-backend-05/), I admit the debt here too: a few repositories inside modules still read other domains' tables through direct SQL, pre-module-era footprints not yet converted to going through the `api` door. Two other modules aren't sealed at all yet. All recorded, all with a turn coming. Cities don't get renovated in one night hahaha.

## Lessons

1. **Census before moving.** Consumer counts and actually-used methods decide the shape of a module's door, not guesses, not taste.
2. **Walls enforced by the compiler beat verbal agreements.** An architecture rule that can't be broken without a red build is the only rule that survives busy sprints.
3. **Byte-identical moves make reviews cheap.** Separate "moving" from "fixing", mix them, and both become hard to verify.
4. **Exceptions between modules are fine, as long as they're conscious and documented.** Perfect uniformity looks great in diagrams; living projects need doors with clear policies.

Next episode we step off the dashboard and onto the highway: how TCP packets from GPS trackers become tidy rows in a time-series database. See you there.

Cheers.

[^1]: Census figures reflect the moment that document was written, and have indeed shifted since. That's fine; a good census always carries a date.

[^2]: Module names and folder structure are kept just enough to tell the story; internal details are altered or simplified.
