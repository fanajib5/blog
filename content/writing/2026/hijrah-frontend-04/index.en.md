---
title: "Hijrah Frontend (4): Two UI Libraries, Two Naming Eras"
description: "Episode 4 of the Hijrah Frontend series: primereact and antd coexisting in one application without ever meeting in a single file. About demarcation lines, a UI dictionary in a reducer's pocket, and three styling eras."
author: "Faiq Najib Al-Aziz"
date: 2026-09-24T09:00:00+07:00
lastmod: 2026-09-11T03:30:00+07:00
draft: true
toc: true
comments: false
tags:
  - frontend
  - ui
  - consistency
  - story
series: "Hijrah Frontend"
---

In [episode two](/en/writing/2026/hijrah-frontend-02/) I mentioned the numbers: one UI library is used across 101 files, the other survives in 13. This episode opens them deeper, because inside are two findings that made me laugh alone in front of a screen hehe~

Finding one: the two **never meet in a single file**. Finding two: the less popular library holds the most sought-after goods in town. In order, then.

## Two Civilizations with a Demarcation Line

The first civilization is the majority library: it provides the _paginator_, _button_, _skeleton_, _card_, and even an image _galleria_. It is the foundation of nearly every page; its call can be heard in one hundred and one files.[^1]

The second civilization is smaller, but holds a monopoly. It keeps the _DatePicker_, _TimePicker_, and _Select_, the most sought-after components in town whenever a page needs a report with a calendar. Thirteen files depend on it, mostly report pages.

And what made me relieved and impressed at once: after checking one by one, **zero files use both at the same time**. The two civilizations coexist without ever sharing a room. A demarcation line, written in no document anywhere, yet perfectly honored, by whom and since when, nobody knows hehe~

Lines like this are usually born not from policy but from experience: once, someone tried mixing the two, tasted styles eating each other alive, and the entire team collectively forgot-to-remember. Demarcation with trauma as its notary hahaha.

## A Dictionary in the Reducer's Pocket

The second finding is my favorite. One of those libraries needs a _locale_: calendar labels in Indonesian. Fair enough; everyone deserves a calendar in their own language. What's unusual is where the locale gets imported: **inside a _reducer_**.

The data caretaker, who should be busy with numbers and statuses, turns out to carry the presentation layer's dictionary in its pocket. Three different reducers, the same dictionary three times.

For what? Perhaps so the labels are available when the _state_ is assembled. Perhaps it just came along with an ancient copy-paste. Nobody knows for sure, and does it matter? This is the map-versus-old-town problem: clean architecture lives in a stranger's head, while reality is a city that grew wild but works. A reducer carrying a dictionary is absurd, but it has been pointing people the right way for years, so let it carry its dictionary hahaha.

## Three Eras of Styling

The next layer: how these components dress. The repo has three generations living in peace:

1. **Classic _global CSS_**: forty-eight stylesheets silently influencing anyone who happens to share a _class_ name. The blind-trust era.
2. **UI library defaults**: each civilization's theme, occasionally seeping into the other's territory.
3. **Tailwind**: the new generation, with its own _config_, plus one fix document at the repo root that I already told you about in [episode one](/en/writing/2026/hijrah-frontend-01/), a monument to a cured illness.

The three eras don't erase each other. First-era pages still dress first-era, and so on, like a street with colonial, modern, and contemporary architecture in one row. Messy? Depends who you ask. Full of character? Without debate hahaha.

## What We Did (and Didn't)

To stay faithful to tradition: while this thin port ran, we **standardized nothing** from the list above. No library migration, no separating reducers from their dictionaries, no removing styling eras.

What we guarded was the demarcation line itself: zero mixed files remains the unwritten rule we have now officially written down. Because large-scale standardization during a house move is the _frontend_ edition of [episode four's](/en/writing/2026/hijrah-backend-04/) rule violation. Standardization is real and good; its place is the epilogue, not the suitcase hehe~

## Lessons

1. **Two cohabiting libraries are history, not sin.** As long as the demarcation line is clear, they get along better than many teams.
2. **Forbid mixing at the file level; it's the cheapest effective demarcation.** No tooling required; just discipline and shared trauma.
3. **Layer leakage is a clue.** A UI dictionary in a reducer's pocket is funny to read, and it shows exactly where the layer boundary leaks. Laugh first, write it down after.
4. **Standardizing is the epilogue.** Don't combine moving house with a total renovation; the suitcase will tear mid-journey.

Next episode is the series finale: two sides of one building, what changed after backend and frontend both moved, and which inheritances we chose to keep feeding. See you there.

Cheers.

[^1]: File counts and the component list were measured directly from the repo as this episode was written; minor components aren't all listed.

[^2]: Code examples and file names are simplified; the structure matches, the contents don't matter for the story.
