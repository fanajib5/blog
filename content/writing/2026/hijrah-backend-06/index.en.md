---
title: "Hijrah Backend (6): Tidying a Monolith While the Plane Keeps Flying"
description: "Episode 6 of the Hijrah Backend series: restructuring a monolith of tens of thousands of lines into 14 domain modules, census before moving, byte-identical moves, and why not microservices."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:06+07:00
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

After the migration to Go, one inherited mess was still there: all the repositories were piled into two big folders, `repository` and `usecase`. Alerts, billing, geofence, fuel, everything was mixed together. The system worked, technically. But finding one house in that city meant knowing every street.

In this episode, I reorganized that city into 14 domain modules while keeping the endpoints running in production. Tens of thousands of people use the system, so there was no pause button to press.

## Why Not Microservices

Maybe the first question is: if you want to separate domains, why not use microservices right away?

Our team is small. Microservices are not just a folder or diagram choice; they add infrastructure work too. Each service needs deploying and monitoring, and calls that used to be function calls become network communication. For our team, adding six servers just to tidy up folders would be like buying another house to store empty rooms.

I did not need separate processes. I needed clear responsibility boundaries. That is why we chose the **modular monolith**: one binary and one deployment, with clear boundaries between domains inside it.

## A Module Is a House with One Door

The module rule is simple:[^2] one folder per domain, say `geofence`, with its repositories and use cases inside. The `api` folder is the exit, with interfaces that other modules can use. The boundary is enforced by the **compiler**, not just a promise in the README.

The compile-time wall is the whole trick. Module rules that live only in a README are easy to break during a busy sprint. But if a module's internal repos can't be imported from outside its folder, the build turns red on the spot. Architecture violations become things you can't commit, not things you have to remember.

## Census First, Move Later

Before refactoring, I started by counting who uses what. This is the step that is easy to skip when you are eager to start moving folders.

For the biggest module, device, I wrote a census document before touching a single line. The results surprised even me: 51 files outside the module consumed its repositories; the device-family repos offered 321 exported methods... and only **100** were ever called from outside.[^1] More than two-thirds of the stock had no customers. One "god" repository alone carried 122 methods, 49 in use.

The census had its own traps. I counted consumers by searching names, but the suffix "-device" showed up all over: the shared-link-device and user-group-device repos weren't part of the device family. Another repo had a digit in its name, so my letters-only search pattern missed it. I learned to check the census method too. Otherwise, the result can look convincing while counting the wrong things.

## Moves That Are Byte-Identical

I used the principle from [episode four](/en/writing/2026/hijrah-backend-04/) again, this time for my own folders: **moving is not the time to tidy everything up too.**

The working rule: repository files move into their module without changing a single byte, Git itself admits they're 100% identical moves. What changes is only the door map: interfaces in the `api` folder, adapters forwarding to them, and the import paths of consumers. If a diff shows anything other than moves and renames, something has cheated on the plan.

Why keep the moves identical? The review is much lighter. Instead of checking whether the new logic is right, reviewers only need to confirm that nothing changed. Tens of thousands of lines can move without rereading each one. I held off on tempting little fixes like "let’s rename this variable too." One PR, one job.

## Modules Are Allowed to Differ

Not every module got the same recipe. I sealed geofence the tightest: deleted legacy delegation wrappers, removed dozens of dead methods, and exported its error markers through the `api` door so consumers could inspect them without peering into the house. Sharing has its own small distinction: it was the first module that needed to read application config at its door.

The device module, the largest, I deliberately left with an open door for now: its repos remain directly importable, with a written plan for sealing later. That's a conscious exception, like the parity story in [episode four](/en/writing/2026/hijrah-backend-04/): dogma is for textbooks; living projects need documented exceptions.

## Cache Without Redis

About the cache: we use an in-process cache, [ristretto](https://github.com/dgraph-io/ristretto), not Redis. The office does not run Redis, and no one seemed keen to add a service just for caching. It fits the way we deploy: one binary, shift, run. It is fine for the cache to die with its process because it is not the source of truth, just an accelerator. If several instances need to share a cache one day, we can revisit the choice.

## The Debt That Remains

There is still technical debt, as I mentioned in [episode five](/en/writing/2026/hijrah-backend-05/). A few repositories inside modules still read other domains’ tables through direct SQL, and two modules are not sealed yet. I have written it all down. They can be handled one at a time; the whole city does not need to be renovated tonight.

## My Notes

1. **Census before moving.** Consumer counts and actually-used methods decide the shape of a module's door, not guesses, not taste.
2. **Walls enforced by the compiler beat verbal agreements.** An architecture rule that can't be broken without a red build is the only rule that survives busy sprints.
3. **Byte-identical moves make reviews cheap.** Separate "moving" from "fixing", mix them, and both become hard to verify.
4. **Exceptions between modules are fine, as long as they're conscious and documented.** Perfect uniformity looks great in diagrams; living projects need doors with clear policies.

In the next episode, I will follow TCP packets from GPS trackers into rows in a time-series database.

Cheers.

[^1]: Census figures reflect the moment that document was written, and have indeed shifted since. That's fine; a good census always carries a date.

[^2]: Module names and folder structure are kept just enough to tell the story; internal details are altered or simplified.
