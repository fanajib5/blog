---
title: "Hijrah Frontend (4): Two UI Libraries, Two Naming Eras"
description: "Episode 4 of the Hijrah Frontend series: primereact and antd coexisting in one application without ever meeting in a single file. About demarcation lines, a UI dictionary in a reducer's pocket, and three styling eras."
author: "Faiq Najib Al-Aziz"
date: 2026-09-23T09:00:04+07:00
lastmod: 2026-09-23T21:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - frontend
  - ui
  - consistency
  - story
series: "Hijrah Frontend"
---

In [episode two](/en/writing/2026/hijrah-frontend-02/) I mentioned the numbers: one UI library is used in 101 files, the other in just 13. This time I looked more closely at how they are used. I found two things worth sharing, including one that made me laugh at my screen hehe.

First, the two **never meet in a single file**. Second, the less-used library has the components people look for most. Here's what I found.

## Two Civilizations with a Demarcation Line

The first library is used on more pages. It provides the _paginator_, _button_, _skeleton_, _card_, and even an image _galleria_. Nearly every page uses one of its components; 101 files call it.[^1]

The second library appears in only 13 files, mostly report pages. But the _DatePicker_, _TimePicker_, and _Select_ are available only there. When a report needs a calendar, those are the components people look for.

After checking the files one by one, I found that **none use both libraries at once**. They coexist behind a boundary I couldn't find documented anywhere. I don't know when that boundary took shape, but the pattern still holds across the files I checked.

## A Dictionary in the Reducer's Pocket

This second finding is my favorite. One library needs a _locale_ so its calendar labels appear in Indonesian. That makes sense. What surprised me was where the locale is imported: **inside a _reducer_**.

Reducers usually handle data such as numbers and statuses. Here, three different reducers each carry the same dictionary for the presentation layer.

Why is the locale there? Perhaps so its labels are available when the _state_ is assembled, or perhaps it came along with an old copy-paste. I couldn't find the answer. The import feels out of place, but it has worked for years. For this port, I made a note of it rather than moving it.

## Three Eras of Styling

There are three generations of _styling_ in the repo:

1. **Classic _global CSS_**: 48 stylesheets that can affect other elements with the same _class_ name.
2. **UI library defaults**: each library's theme, sometimes bleeding into the other's territory.
3. **Tailwind**: the new generation with its own _config_, plus a fix document at the repo root that I mentioned in [episode one](/en/writing/2026/hijrah-frontend-01/).

All three are still in use. Older pages keep their old styling, while others use a UI library or Tailwind. The result isn't uniform, but that's the _frontend_ we ported.

## What We Did (and Didn't)

During the thin port, we **didn't standardize** any of the above. We didn't migrate libraries, separate reducers from their locale, or remove any styling era.

What we kept was the boundary between the libraries: no files mixing the two. We've now written down the rule that used to be unwritten. Large-scale standardization during a move would be the _frontend_ version of [episode four's](/en/writing/2026/hijrah-backend-04/) rule violation. Standardization still matters, but it's better left until after the port.

## Lessons

1. **Two libraries can coexist.** What matters is having a clear boundary between them.
2. **Start with a simple file-level rule.** We don't need special tooling to keep the two from mixing.
3. **A locale import in a reducer points to a leaky layer boundary.** For now, it's enough to note it because the code still works.
4. **Keep the port separate from standardization.** Move first; larger changes can come later.

The next episode closes the series. I'll look at the two sides of one building, what changed after both the _backend_ and _frontend_ moved, and which inheritances we chose to keep. See you there.

Cheers.

[^1]: File counts and the component list were measured directly from the repo as this episode was written; minor components aren't all listed.

[^2]: Code examples and file names are simplified; the structure matches, the contents don't matter for the story.
