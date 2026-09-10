---
title: "Hijrah Frontend (1): When a Backend Engineer Is Told to Touch the Frontend"
description: "Episode 1 of the Hijrah Frontend series: after the GPS backend moved to Go, it's the neighboring building's turn. A backend engineer's first impressions of an inherited frontend, and the thin-port decision."
author: "Faiq Najib Al-Aziz"
date: 2026-09-24T09:00:00+07:00
lastmod: 2026-09-11T02:45:00+07:00
draft: true
toc: true
comments: false
tags:
  - frontend
  - nextjs
  - story
series: "Hijrah Frontend"
---

The [Hijrah Backend](/en/writing/2026/hijrah-backend-01/) series has graduated. The GPS backend now stands on Go, 14 domain modules are in order, and the endpoint that used to eat 15 seconds has recovered.

Now it's the neighboring building's turn.

I am a backend engineer. My world: queries, indexes, binary packet parsers, and database welfare. The frontend is a country I visit occasionally, on a tourist visa. This episode is about the day that tourist visa got revoked and replaced with a resident ID hehe~

## First Impressions: A Backend Nose Works Fine

When I first opened the inherited frontend, one thing registered immediately: even someone who isn't a frontend expert could smell its spaghetti, armed with nothing but a programmer's mental model and years of reading code other people loved. You don't need to be a chef to know the soup is seven days old; a working nose suffices.

And that smell isn't an accusation. The frontend is what it is: built over years, touched by many hands with many tastes, surviving while serving tens of thousands of users daily. Exactly like the backend I once migrated. How can a different building smell exactly the same? Because the caretaker is the same: **time and urgency** hehe~

## The Decision: Fork, Not Rewrite

After the experience of [migrating the backend](/en/writing/2026/hijrah-backend-01/), one belief stuck: total rewrites are attractive on slides and terrifying in production.

So for the frontend, the decision was similar: **fork the old system, port it thin**. Not redrawing from scratch with the trendiest framework, but moving the old application into the new house as-is first. The repo even kept its exact old name; as if it hasn't been informed that it changed course hahaha.

And on day one in the new house, I started counting the closets:

- **76 pages** in the app router,[^2] of which 60 are JSX, 15 are JS, and one backup file sleeps among them[^1]
- Two major UI libraries living side by side in the same application
- A legacy state management layer that has been gardener and electrician at once for years
- A document named `TAILWIND_FIX.md` at the repo root: a small monument to an illness that got cured hehe~

Sixty of those pages are JSX. Not a complaint; just a reminder that this country speaks another language. I, who used to shout `if err != nil`, now have to learn to weave _className_s hahaha.

## Why Thin Port, Not Redesign

The same question as on the backend: why not rebuild everything at once, all tidy, all modern?

The same answer, too: users don't care about your internal architecture; they care that the buttons they press every day keep behaving the same. Redesigning the looks while moving the house is two changes at once, and [episode four of the backend series](/en/writing/2026/hijrah-backend-04/) already priced the cost of fixing while migrating: silent improvements are poison.

So, frontend edition of parity: looks and behavior get carried over as-is first, internal structure gets tidied later, one decision at a time. Legacy code that boards the train gets recorded, not hidden. Episode two covers exactly what boarded that train, and why some of it had to board despite the smell hehe~

## The Map

This **Hijrah Frontend** series contains five episodes:

2. **The thin port and the inheritance that boarded**: what came along from the old house, consciously.
3. **Type chaos: numbers, empty strings, and pages with different opinions**: how the same field gets sent with different types depending on the page, and how a strict world receives that.
4. **Two UI libraries, two naming eras**: the cohabiting legacy, and conventions that changed with every new caretaker.
5. **Two sides of one building**: the closing, reflections, and what changed after the neighboring building became home.

If you came from the backend series: welcome back, same building, we just changed floors. If you're new: [the opening episode of the other series](/en/writing/2026/hijrah-backend-01/) is the best place to start, or just stay here; this story stands on its own hehe~

## Closing

The tourist visa is revoked. From today, this inherited frontend is officially my responsibility too: spaghetti and all, two UI libraries and all, and seventy-six pages waiting to be recounted.

Next episode: the inventory of the inheritance that boarded the train. See you there.

Thanks for stopping by and reading hehe. Have a great day!

Cheers.

[^1]: That file is nobody's fault; it's a loyal backup corpse, the same kind as the commented-out corpses I once met on the backend.

[^2]: Page counts and format details were measured directly from the repo as this episode was written; other stack details are simplified for storytelling.
