---
title: "Why One Bug Can Take Three Days"
description: "Why fixing one small bug can take days — and how to explain it to non-technical people so misunderstandings don't happen."
author: "Faiq Najib"
date: 2026-04-16
lastmod: 2026-04-16
draft: false
toc: true
comments: false
tags:
  - communication
  - soft-skill
  - teaching
---

_"This is just a small bug, right? Should take 5 minutes."_

Ever heard this one? Or maybe its variants: _"Just change one line of code, right?"_, _"How can it take a whole day to fix this?"_

If you're a developer, you almost certainly have. And that line usually comes from a boss, project manager, or client — someone who doesn't need to know what an N+1 query is, but needs to understand **why something that looks simple takes a non-simple amount of time**.

This isn't about blaming anyone. It's about **why this communication gap happens and how to bridge it**.

## Anatomy of "1 Bug = 3 Days"

Here's the story. There's a bug: **report data isn't showing up on the dashboard**. On the surface, it looks simple — just fix the display, right?

Turns out, after investigation:

1. **The data doesn't exist** — it's not a display issue, but a query that should be saving data to the database isn't running under certain conditions
2. **The query has a problem** — there's a race condition that appears when 2 users access simultaneously
3. **The database schema needs to change** — to handle that race condition, a new constraint is needed
4. **Existing data must be migrated** — schema changes mean data that's already there needs to be adjusted
5. **It needs testing** — and not just new test cases, but also making sure existing features don't break

So what looks like _"data not showing up"_ is actually: **bug in query → race condition → schema change → data migration → end-to-end testing**. From "change one line" to "touch 4 layers of the system."

### The Leaky House Analogy

Imagine you report to the homeowner: _"There's a stain on the wall."_

The homeowner thinks: _"Just repaint it. 30 minutes, done."_

But after inspection, it turns out:

- The stain on the wall is because a **pipe behind the wall is leaking**
- The pipe is leaking because the **joint has rusted**
- The joint rusted because **the attic ventilation is blocked**, so moisture accumulates
- To fix everything, you have to **open the roof first**, then replace the pipe, then repaint the wall

The homeowner sees a stain. The plumber sees pipes, joints, ventilation, and the roof. Both are looking at the same problem, but at **different depths**.

This is exactly what happens between a boss and a developer.

## Three Steps to Explain Technical Problems

After experiencing several miscommunications (and learning from mistakes), I found a pattern that consistently helps. I call it **Translate, Visualize, Connect**.

### 1. Translate: From Technical Language to Risk Language

The most common mistake: explaining technical problems using technical terms.

**Not effective:**
> _"There's an N+1 query on the report endpoint. Every time it loads, it queries the database one by one. If there are 1000 rows, that's 1001 queries. That's why it's slow."_

Your boss doesn't care about the number of queries. What they care about: **what's the business impact?**

**More effective:**
> _"The system currently fetches data one at a time, but there could be hundreds of records. So the more data, the slower it gets. If left unfixed, when users reach a thousand, the report page could take 30 seconds to load — users will think the system is broken and leave the app."_

Notice the shift:

| Developer Language | Business Language |
|---|---|
| N+1 query | The more data, the slower |
| 1001 queries | Load time up to 30 seconds |
| Needs refactoring | If left alone, users will leave |

It doesn't mean you're oversimplifying — you're **translating the consequences**.

### 2. Visualize: Use Analogies, Not Architecture Diagrams

Architecture diagrams are great for fellow developers. For non-technical people, analogies are far more powerful.

Some analogies I frequently use:

- **Refactoring** = renovating a standing house. You can't just replace the floor without checking the foundation first.
- **Technical debt** = bank loan. You can take a shortcut now (debt), but someday it must be paid — with interest.
- **Testing** = seatbelt. It doesn't make the car faster, but it prevents accidents from becoming disasters.
- **Race condition** = two people trying to enter the same door from opposite directions. Without rules on who goes first, they block each other.
- **Deployment** = changing a car tire while driving. You have to be careful so passengers don't feel it.

The key: analogies must come from a world that's **familiar** to your listener. If your boss comes from finance, use investment analogies. If from marketing, use campaign analogies.

### 3. Connect to Their Priorities

Bosses have different priorities than developers. Our priorities: clean code, maintainable, scalable. Their priorities: **deadlines, budget, risk**.

So when explaining, connect to their priorities:

- _"If we fix this now with 2 days, we prevent downtime that could cost 10x more later."_
- _"This isn't about building new features — it's about making sure existing features don't suddenly stop working."_
- _"The risk: if left unhandled, report data could be inaccurate. And that report data is what drives business decisions."_

The phrase _"technical debt"_ might not move your boss. But _"if we don't handle this now, we could lose transaction data"_ — that gets heard.

## A Practical Template

When I need to explain a technical problem to non-technical people, I use this simple template:

> **What happened?** (1–2 sentences, no jargon)
>
> **What's the impact?** (to users / to business / to timeline)
>
> **How long to fix?** (realistic estimate, not optimistic)
>
> **What's the plan?** (high-level steps, no technical details)
>
> **What's the risk if we delay?** (this often makes decisions faster)

Example:

> **What happened?** The monthly report isn't showing data entered after the 15th.
>
> **What's the impact?** Managers can't see complete data for this month's decisions.
>
> **How long?** 2–3 days.
>
> **What's the plan?** Fix how the system stores data, adjust existing data, and make sure other features aren't affected.
>
> **Risk of delaying?** More data could go missing, and the fix could take longer because there's more data to adjust.

Short, clear, and — most importantly — **no technical terms**.

## Communication Is a Skill

Many developers — including me, back then — think that if the code is good, the work is done. But the reality is, **if it can't be explained, it won't be supported**. And without support — whether it's time, resources, or trust — even the best code will never get deployed.

Communication isn't a talent. It's a skill that can be trained, exactly like writing code. Every time you explain a technical problem to a non-technical person, you sharpen that skill. It might feel awkward at first. But over time, it becomes a reflex.

And that reflex is incredibly useful — not just at work, but also when teaching. Because teaching, fundamentally, is explaining complex things in an accessible way.

If you're interested in teaching and technical communication, or have similar experiences you'd like to discuss, [get in touch](/contact/).

---

_Tags: [communication](/tags/communication/) · [soft-skill](/tags/soft-skill/) · [teaching](/tags/teaching/)_
