---
title: "Hijrah Frontend (2): The Thin Port and the Inheritance That Boarded"
description: "Episode 2 of the Hijrah Frontend series: 76 pages in, 76 pages out. Why zero pages were left behind, what the first opened boxes contained, and one big plan that chose not to happen."
author: "Faiq Najib Al-Aziz"
date: 2026-09-24T09:00:00+07:00
lastmod: 2026-09-11T03:00:00+07:00
draft: true
toc: true
comments: false
tags:
  - frontend
  - nextjs
  - migration
  - story
series: "Hijrah Frontend"
---

The move from [episode one](/en/writing/2026/hijrah-frontend-01/) is finished, and handover day has arrived. The manifest is short and boring, exactly like the best moving manifests: **seventy-six boxes in, seventy-six boxes out. Zero pages left behind.**

That's not luck. That's a decision. And this episode is about that decision: what we consciously carried up, what turned out to board without an invitation, and one big plan that chose not to happen hehe~

## Why Zero Pages Were Left Behind

If you've ever moved houses, you know the most liberating moment: deciding "just throw this one away". A frontend migration has the same moment with a bigger temptation, because discarding pages feels like tidying up the product at the same time.

God forbid, again. Deciding a page's life or death during a house move is two decisions fused into one: move, and reshape the product's scope. [The neighboring series](/en/writing/2026/hijrah-backend-04/) already paid the tuition for that combination. So the rule was simple: **seventy-six in, seventy-six out**, page by page, one at a time, no discard script.

The result is boringly verified: the new repo counts 76 pages, the old repo counts 76, and the folder lists match one by one. Even the pages whose names raise eyebrows, like the demo and docs and special-purpose routes, boarded too. Not because they matter; because discarding them wasn't this moment's authority hahaha.

## The First Boxes We Opened

The first two boxes: the two UI libraries that have long cohabited. In the new house, the count is honest and measurable: one library is used across **101 files**, while the other survives in just **13 files**.[^1]

Those numbers tell their own story: an era of dominance and an era of leftovers, side by side inside one application, without open warfare. Both still had to be carried, because removing a library means touching every file that imports it, and touching every file while moving houses violates [episode four's](/en/writing/2026/hijrah-backend-04/) rules.

One more wire boarded: the legacy state management connection. In the new app router it's down to a single connection point, but that one live point is still the heart for the pages that use it. Cut it now? Also not this moment's authority hahaha.

## Carried Consciously, Recorded

Beyond the big boxes, some small inheritances were consciously noted while boarding:

- **JSX without types**: this country doesn't speak _TypeScript_ yet. Not this episode's decision; it's on record for another decision, another day.[^2]
- **Two eras of naming**: some things are titled with capital letters, others follow a different taste. We didn't standardize during the move; standardizing is the epilogue's job, not the suitcase's.
- **One `page.backup`**: one page brought along its own backup corpse. I laughed when I found it, because [it has a sibling](/en/writing/2026/hijrah-backend-04/) in the neighboring building hahaha.

The note is simple: inheritance carried consciously has a different fate from inheritance that slips through. The conscious kind has a record, a reason, and a turn for cleanup later. The slipping kind tends to multiply.

## The Big Plan That Didn't Happen

To stay fair to the honest tradition of the neighboring series: one big plan chose to withdraw before it started, namely replacing the legacy state management with something new.

It wasn't canceled because it failed; priorities shifted toward what users would actually feel. And I'm at peace with that: a plan canceled before it consumes resources isn't a failure, it's _quality control_ on your own plans hehe~

## Lessons

1. **Move 1:1 first, decide scope later.** Discarding pages while moving is two decisions in one breath; separate them.
2. **Count the boxes with numbers.** 76 to 76, 101 to 13; those figures keep the inheritance conversation from turning into a taste war.
3. **Two cohabiting libraries are two eras, not two choices.** Don't judge the old one; it has won more battles than the new one.
4. **A plan canceled before burning cost is a win.** Record it on the didn't-happen list, head held high.

Next episode we open the thorniest box: _type chaos_, where the same field gets sent as a number, an empty string, and a plain string, depending on which page is doing the sending. See you there.

Cheers.

[^1]: File, page, and library usage figures were measured directly from the repo as this episode was written, with internal details separated out for storytelling.

[^2]: Library, framework, and folder structure names are kept just enough; whatever the story doesn't need goes unmentioned.
