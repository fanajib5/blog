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

The [Hijrah Backend](/en/writing/2026/hijrah-backend-01/) series is over. The GPS backend now runs on Go, its 14 domain modules are in order, and the endpoint that used to take 15 seconds is much faster.

Now it's the neighboring building's turn: the frontend.

I'm a backend engineer. Most days I'm dealing with queries, indexes, binary packet parsers, and database welfare. The frontend is somewhere I usually visit as a tourist. Then I was asked to help take care of it, not just stop by hehe~

## First Impressions: The Smell of Spaghetti

When I opened the inherited frontend, I could see the spaghetti almost immediately. I'm no frontend expert, but years of reading code have given me a sense for the pattern. You don't need to be a chef to notice soup that's been sitting out too long; sometimes a look is enough.

I don't mean that as an accusation. The app had been built over years, touched by many hands with different tastes, and kept serving tens of thousands of users every day. The backend I migrated had a similar story. Different building, same cause: **time and emergencies**.

## The Decision: Fork, Not Rewrite

My experience [migrating the backend](/en/writing/2026/hijrah-backend-01/) made me even more convinced that total rewrites look attractive on slides and terrifying in production.

For the frontend, we chose a similar path: **fork the old system, then do a thin port**. We moved the existing app into its new home as-is instead of drawing it again from scratch with the trendiest framework. Even the repo kept its old name; maybe nobody had told it about the move yet.

I spent my first day in the new house counting the closets:

- **76 pages** in the app router,[^2] of which 60 are JSX, 15 are JS, and one backup file sleeps among them[^1]
- Two major UI libraries living side by side in the same application
- A legacy state management layer that has been gardener and electrician at once for years
- A document named `TAILWIND_FIX.md` at the repo root: a small monument to an illness that got cured hehe~

Sixty pages use JSX. That's not a complaint, just a reminder that I'm learning another language. I used to shout `if err != nil`; now I have to learn how to weave `className`s.

## Why Thin Port, Not Redesign

The question is the same as it was for the backend: why not rebuild everything at once and make it tidy and modern?

The answer is simple: users want the buttons they press every day to keep working. Redesigning the interface while moving the app means changing two things at once. In [episode four of the backend series](/en/writing/2026/hijrah-backend-04/), I learned how costly silent improvements can be during a migration.

For the frontend, that means preserving its looks and behavior for now. We can tidy the internal structure later, one decision at a time. We record the legacy code that comes along instead of hiding it. In episode two, I'll go through what boarded the train and why some of it couldn't be left behind.

## The Map

This **Hijrah Frontend** series contains five episodes:

2. **The thin port and the inheritance that boarded**: what came along from the old house, consciously.
3. **Type chaos: numbers, empty strings, and pages with different opinions**: how the same field gets sent with different types depending on the page, and how a strict world receives that.
4. **Two UI libraries, two naming eras**: the cohabiting legacy, and conventions that changed with every new caretaker.
5. **Two sides of one building**: the closing, reflections, and what changed after the neighboring building became home.

If you came from the backend series: welcome back, same building, we just changed floors. If you're new: [the opening episode of the other series](/en/writing/2026/hijrah-backend-01/) is the best place to start, or just stay here; this story stands on its own hehe~

## Settling In Next Door

I came as a tourist, but this inherited frontend is now part of my responsibility too. I've seen what's in the new place: spaghetti, two UI libraries, and 76 pages that still need to work after the move.

Next, I'll start keeping an inventory of what came along. The list was longer than I expected.

[^1]: That file is nobody's fault; it's a loyal backup corpse, the same kind as the commented-out corpses I once met on the backend.

[^2]: Page counts and format details were measured directly from the repo as this episode was written; other stack details are simplified for storytelling.
