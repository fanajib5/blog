---
title: "Hijrah Frontend (1): When a Backend Engineer Is Told to Touch the Frontend"
description: "Episode 1 of the Hijrah Frontend series: after the GPS backend moved to Go, it's the neighboring building's turn. A backend engineer's first impressions of an inherited frontend, and the thin-port decision."
author: "Faiq Najib Al-Aziz"
date: 2026-09-23T09:00:01+07:00
lastmod: 2026-09-23T21:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - frontend
  - nextjs
  - story
series: "Hijrah Frontend"
---

The [Hijrah Backend](/en/writing/2026/hijrah-backend-01/) series is finally done. The GPS backend now runs on Go, its 14 domain modules are in order, and the endpoint that used to take 15 seconds is much faster. Alhamdulillah.

Nah, now it's the neighboring building's turn: the frontend.

I'm a backend engineer. Most days I'm dealing with queries, indexes, binary packet parsers, and database welfare. The frontend is somewhere I usually visit as a tourist. Then I got asked to help take care of it. Not just stop by anymore, hehe~

## First Impressions: The Smell of Spaghetti

When I opened the inherited frontend, I could see the spaghetti almost immediately. I'm no frontend expert, but I've read enough other people's code to know spaghetti when I see it. You don't need to be a chef to tell that soup has been sitting out too long, right? Looking is enough.

Oh, I'm not accusing anyone, okay? The app was built over years, touched by many hands with different tastes, and kept serving tens of thousands of users every day. The backend I migrated had a similar story. Different building, same cause: **time and emergencies**.

## The Decision: Fork, Not Rewrite

My experience [migrating the backend](/en/writing/2026/hijrah-backend-01/) made me even more convinced that total rewrites look great on slides and feel scary in production.

For the frontend, we took a similar path: **fork the old system, then do a thin port**. We moved the app to its new home as-is instead of redrawing it from scratch with the trendiest framework. Even the repo kept its old name; maybe nobody had told it about the move yet.

I spent my first day in the new house counting closets:

- **76 pages** in the app router,[^2] of which 60 are JSX, 15 are JS, and one backup file sleeps among them[^1]
- Two major UI libraries living side by side in the same application
- A legacy state management layer that has been gardener and electrician at once for years
- A document named `TAILWIND_FIX.md` at the repo root: a small monument to an illness that got cured hehe~

Sixty pages use JSX. Not a complaint, just a reminder that I'm learning another language. I used to shout `if err != nil`, now I have to learn how to weave `className`s (slowly... very slowly).

## Why Thin Port, Not Redesign

Same question as with the backend: why not rebuild everything while we're at it, make it tidy and trendy?

Simple answer: users just want the buttons they press every day to keep working. Redesigning the interface while moving house means changing two things at once. In [episode four of the backend series](/en/writing/2026/hijrah-backend-04/), I learned how costly silent improvements can be during a migration.

So for the frontend, looks and behavior stay as they are for now. The internal structure can be tidied later, one decision at a time. Legacy code that comes along gets written down, not hidden. In episode two I'll go through what boarded the train and why some of it couldn't be left behind.

## Episode Plan

This **Hijrah Frontend** series is planned for five episodes (the first one is what you're reading):

2. **The thin port and the inheritance that boarded**: what came along from the old house, consciously.
3. **Type chaos: numbers, empty strings, and pages with different opinions**: the same field gets sent with different types depending on the page, and how a strict world takes that.
4. **Two UI libraries, two naming eras**: the cohabiting legacy, and conventions that changed with every new caretaker.
5. **Two sides of one building**: the closing, reflections, and what changed after the neighboring building became home.

If you came from the backend series: welcome back, same building, we just changed floors. If you're new, you can start from [the opening episode of the other series](/en/writing/2026/hijrah-backend-01/), or just stay here. This one stands on its own, hehe~

## Living Next Door Now

I came as a tourist, but this inherited frontend is now my responsibility too. The contents are already clear: spaghetti, two UI libraries, and 76 pages that must keep working after the move.

Next I start writing down what boarded the train. The list turned out longer than I expected.

[^1]: That file is nobody's fault; it's a loyal backup corpse, the same kind as the commented-out corpses I once met on the backend.

[^2]: Page counts and format details were measured directly from the repo as this episode was written; other stack details are simplified for storytelling.
