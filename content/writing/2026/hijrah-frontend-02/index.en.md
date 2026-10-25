---
title: "Hijrah Frontend (2): The Thin Port and the Inheritance That Boarded"
description: "Episode 2 of the Hijrah Frontend series: 76 pages in, 76 pages out. Why zero pages were left behind, what the first opened boxes contained, and one big plan that chose not to happen."
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

The move from [episode one](/en/writing/2026/hijrah-frontend-01/) is done. On handover day, the manifest had one important number: **seventy-six boxes in, seventy-six boxes out. Not a single page left behind.**

Nothing was left behind because we decided to bring it all. Some things were deliberate, some boarded without an invitation, and one big plan was eventually dropped. Here's how it went.

## Why Zero Pages Were Left Behind

Anyone who has moved house knows the relief of saying, "just throw this one away". A frontend migration comes with the same temptation. Deleting a page can feel like tidying up the product at the same time.

But deciding whether a page lives or dies during a move combines two separate decisions: migrating the app and changing the product's scope. [The neighboring series](/en/writing/2026/hijrah-backend-04/) taught me how costly that combination can be. So we set a clear rule: **seventy-six in, seventy-six out**, checked page by page, with no discard script.

The result isn't dramatic, but the numbers match: the new repo has 76 pages, just like the old one, and the folder lists line up one by one. Pages with names that invite questions, like demo, docs, and special-purpose routes, came along too. Not because every one of them matters, but because deciding to delete them wasn't part of this phase.

## The First Boxes We Opened

The first boxes we opened held the two UI libraries that have long lived side by side. In the new house, the numbers are clear: one library appears in **101 files**, while the other survives in just **13 files**.[^1]

The numbers show two eras: one library dominated, the other arrived later, and both still live in the same app without open warfare. We brought both along. Removing a library means changing every file that imports it, and changing every file during a move violates [episode four's](/en/writing/2026/hijrah-backend-04/) rules.

The legacy state management connection came along too. There is only one connection point left in the new app router, but it's still at the heart of the pages that use it. Removing it would mean changing something else during the move.

## Carried Consciously, Recorded

We also made a note of a few smaller pieces of inheritance as they came aboard:

- **JSX without types**: this country doesn't speak _TypeScript_ yet. Not this episode's decision; it's on record for another decision, another day.[^2]
- **Two eras of naming**: some things are titled with capital letters, others follow a different taste. We didn't standardize during the move; standardizing is the epilogue's job, not the suitcase's.
- **One `page.backup`**: one page brought along its own backup corpse. I laughed when I found it, because [it has a sibling](/en/writing/2026/hijrah-backend-04/) in the neighboring building hahaha.

There's a difference between bringing something deliberately and discovering it after the move. The first has a note, a reason, and a turn for cleanup later. The second is easy to miss, and can multiply.

## The Big Plan That Didn't Happen

In keeping with the neighboring series' honesty, there's one plan worth recording even though it never happened: replacing the legacy state management with something new.

It wasn't canceled because it failed. Priorities shifted toward work users would notice more. Calling off a plan before it consumes resources is also _quality control_ for your own plans.

## Lessons

1. **Move 1:1 first, decide scope later.** Deleting pages during a move means making two decisions at once.
2. **Count what's in the boxes.** The 76-to-76 and 101-to-13 figures make the inheritance concrete, rather than a matter of taste.
3. **Two libraries living together point to two different eras.** Each has its own reason for still being in the app.
4. **Canceling a plan before it burns resources can be the right call.** Write down why, so it's clear when to revisit it.

The next box doesn't contain a library. It holds inconsistent data types: the same field sent as a number, an empty string, or a plain string depending on the page. That's where _type chaos_ starts to show.

[^1]: File, page, and library usage figures were measured directly from the repo as this episode was written, with internal details separated out for storytelling.

[^2]: Library, framework, and folder structure names are kept just enough; whatever the story doesn't need goes unmentioned.
