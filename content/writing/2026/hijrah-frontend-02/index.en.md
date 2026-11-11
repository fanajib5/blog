---
title: "Hijrah Frontend (2): The Thin Port and the Inheritance That Boarded"
description: "Episode 2 of the Hijrah Frontend series: 76 pages in, 76 pages out. Why nothing got left behind, what was in the first boxes I opened, and one big plan that never happened."
author: "Faiq Najib Al-Aziz"
date: 2026-09-23T09:00:02+07:00
lastmod: 2026-09-23T21:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - frontend
  - nextjs
  - migration
  - story
series: "Hijrah Frontend"
---

The move from [episode one](/en/writing/2026/hijrah-frontend-01/) is finally done. On handover day, the manifest had just one important number: **seventy-six boxes in, seventy-six boxes out. Not a single page left behind.**

Nothing got left behind because that's what we decided. Some things were brought on purpose, some boarded without an invitation, and one big plan was dropped in the end. Let me tell you one by one.

## Why Zero Pages Were Left Behind

If you've ever moved house, you know the relief of saying, "just throw this one away". A frontend migration has the same temptation. Deleting a page feels like tidying up the product while you're at it.

The catch: deciding whether a page lives or dies during a move means making two decisions at once, migrating the app and changing the product's scope. [The neighboring series](/en/writing/2026/hijrah-backend-04/) already taught me how expensive that combination is. So the rule was clear: **seventy-six in, seventy-six out**, checked page by page, with no script for throwing things away.

The result isn't dramatic, but the numbers match: the new repo has 76 pages, same as the old one, and the folder lists line up one by one. Pages with names that make you wonder, like demo, docs, and special-purpose routes, came along too. Not because every one of them matters, but because deciding to delete them wasn't part of this phase.

## The First Boxes I Opened

The first boxes I opened held the two UI libraries that have lived side by side for a long time. In the new house, the count is easy to see: one library appears in **101 files**, while the other survives in just **13 files**.[^1]

The numbers show two eras: one library dominated, the other arrived later, and both live in the same app without open warfare. We brought both. Removing a library means changing every file that imports it, and changing every file during a move breaks the rules from [episode four](/en/writing/2026/hijrah-backend-04/).

The legacy state management connection came along too. Only one connection point is left in the new app router, but it's still the heart of the pages that use it. Cutting it now means changing something else again, and that's not this move's job.

## Carried Knowingly, Written Down

A few smaller pieces of inheritance also got noted as they boarded:

- **JSX without types**: this country doesn't speak _TypeScript_ yet. Not this episode's decision, just noted for another decision on another day.[^2]
- **Two eras of naming**: some names start with capital letters, others follow a different taste. We didn't standardize during the move. Standardizing is the epilogue's job, not the suitcase's.
- **One `page.backup`**: one page brought along its own backup corpse. I laughed when I found it, because [it has a sibling](/en/writing/2026/hijrah-backend-04/) in the building next door hahaha.

There's a difference between bringing something knowingly and discovering it after the move. The first has a note, a reason, and a turn for cleanup later. The second is easy to miss, and then it multiplies.

## The Big Plan That Didn't Happen

Like in the neighboring series, there's one plan worth recording even though it never ran: replacing the legacy state management with a new one.

It wasn't dropped because it failed. Priorities shifted toward work users would feel more. Calling off a plan before it eats your energy is a kind of _quality control_ for your own plans. Well... let's call it that hehe.

## Takeaways

1. **Move 1:1 first, decide scope later.** Deleting pages during a move means two decisions at once.
2. **Count what's in the boxes.** The 76-to-76 and 101-to-13 numbers make the inheritance concrete, not just a matter of taste.
3. **Two libraries living together mark two different eras.** Each has its own reason for still being in the app.
4. **A plan canceled before it burns resources is also a good decision.** Write down why, so it's clear when to revisit it.

The next box doesn't contain a library, but inconsistent data types: the same field sent as a number, an empty string, or a plain string depending on the page. That's where the _type chaos_ starts to show.

[^1]: File, page, and library usage figures were measured directly from the repo as this episode was written, with internal details separated out for storytelling.

[^2]: Library, framework, and folder structure names are kept just enough; whatever the story doesn't need goes unmentioned.
