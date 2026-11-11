---
title: "Why One Bug Can Take Three Days"
description: "Notes on why fixing one small bug can take days, and how I explain it to non-technical people so nobody ends up confused."
author: "Faiq Najib Al-Aziz"
date: 2026-04-16
lastmod: 2026-09-11T09:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - communication
  - soft-skill
  - teaching
---

_"This is just a small bug, right? Should take 5 minutes."_

Ever heard this one? Or its cousins: _"Just change one line, right?"_ and _"How can it take a whole day to fix this?"_

If you're a developer, you've probably heard it from a boss, a project manager, or a client. I have, a few times, and my first reaction used to be a sour little smile hehe. But they really don't need to know what an N+1 query is. All they need to know is **why something that looks simple can take so long**.

So, let me tell you what can hide behind a seemingly simple bug, and how I explain it.

## Anatomy of "1 Bug = 3 Days"

Say **report data isn't showing up on the dashboard**. At first glance it looks easy: just fix the display, right?

Turns out, after digging in:

1. **The data doesn't exist**: it's not a display issue. The query that's supposed to save data to the database doesn't run under certain conditions.
2. **The query has a problem**: there's a race condition when 2 users access it at the same time.
3. **The database schema needs to change**: to handle that race condition, we need a new constraint.
4. **Existing data must be migrated**: the schema changed, so the old data has to be adjusted too.
5. **It needs testing**: not just new test cases, but also making sure the old features didn't break.

So what looked like _"data not showing up"_ is really a chain: **bug in query → race condition → schema change → data migration → end-to-end testing**. From "change one line" to touching 4 layers of the system. Well... that's a lot, hahaha.

### The Leaky House Analogy

Imagine you tell the homeowner: _"Sir, there's a stain on the wall."_

The homeowner thinks: _"Just repaint it. 30 minutes, done."_

But after inspection, it turns out:

- The stain is there because a **pipe behind the wall is leaking**
- The pipe is leaking because the **joint has rusted**
- The joint rusted because **the attic ventilation is blocked**, so moisture piles up
- To fix everything, you have to **open the roof first**, then replace the pipe, then repaint the wall

The homeowner sees a stain. The plumber sees pipes, joints, ventilation, and a roof. Same problem, but each of them sees something different.

Same thing when a boss and a developer talk about a bug.

## Three Steps to Explain Technical Problems

After a few mix-ups (and some private grumbling), I found a pattern that helps: **Translate, Visualize, Connect**. I made up the names myself, so don't go looking for them in any book.

### 1. Translate: From Technical Language to Risk Language

Don't stop at the technical terms. Explain the impact.

**Less effective:**
> _"There's an N+1 query on the report endpoint. Every time it loads, it queries the database one by one. If there are 1000 rows, that's 1001 queries. That's why it's slow."_

Instead of just naming the number of queries, tell them **what it means for the business**.

**More effective:**
> _"The system currently fetches data one at a time, but there could be hundreds of records. So the more data, the slower it gets. If left alone, once users reach a thousand, the report page could take 30 seconds to load. Users will think it's broken and leave."_

For example:

| Developer Language | Business Language |
|---|---|
| N+1 query | The more data, the slower |
| 1001 queries | Load time up to 30 seconds |
| Needs refactoring | If left alone, users will leave |

You're not dumbing the problem down, you're **translating its consequences**.

### 2. Visualize: Use Analogies, Not Architecture Diagrams

If your listener isn't used to architecture diagrams (and honestly, most people aren't), everyday analogies help a lot more.

Some analogies I often use:

- **Refactoring** = renovating a house that's already standing. You can't just swap the floor without checking the foundation first.
- **Technical debt** = a bank loan. You can take a shortcut now, but someday you pay it back, with interest.
- **Testing** = a seatbelt. The car doesn't get faster, but a crash doesn't turn into a disaster.
- **Race condition** = two people trying to go through the same door from opposite sides. Without a rule on who goes first, they block each other.
- **Deployment** = changing a car tire while driving. Be careful so the passengers don't notice.

The trick: the analogy has to come from a world that's **familiar** to the listener. If your boss is in finance, use investment analogies. If they're in marketing, use campaign analogies.

### 3. Connect to Their Priorities

Tie your explanation to what they actually have to decide, like **deadlines, budget, and risk**:

- _"If we fix this now, it takes 2 days, and we prevent downtime that could cost 10x more later."_
- _"This isn't about building a new feature, it's about making sure the existing ones don't suddenly die."_
- _"The risk: if we leave it, report data could be inaccurate. And that report data is what drives business decisions."_

## A Practical Template

When I have to explain a technical problem to non-technical people, I use this short template:

> **What happened?** (1-2 sentences, no jargon)
>
> **What's the impact?** (to users / to business / to timeline)
>
> **How long to fix?** (a realistic estimate, not the optimistic one)
>
> **What's the plan?** (just the big steps, no technical details)
>
> **What's the risk if we delay?** (this often makes decisions faster)

Example:

> **What happened?** The monthly report isn't showing data entered after the 15th.
>
> **What's the impact?** Managers can't see complete data for this month's decisions.
>
> **How long?** 2-3 days.
>
> **What's the plan?** Fix how the system stores data, adjust the existing data, and make sure other features aren't affected.
>
> **Risk of delaying?** More data could go missing, and the fix takes longer because there's more data to adjust.

## From Bug to Impact

The two report examples above roughly show how: start with the missing data, then describe the impact and the plan to fix it. If you've had a similar experience explaining a technical problem, [get in touch](/contact/). Maybe we can swap stories hehe.

---

_Tags: [communication](/tags/communication/) · [soft-skill](/tags/soft-skill/) · [teaching](/tags/teaching/)_
