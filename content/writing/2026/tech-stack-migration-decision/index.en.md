---
title: "Decision Journal: When It's Time to Migrate Your Tech Stack"
description: "A decision-making journal, when your existing tech stack needs migration, when refactoring is enough, and how to read the signals from a business perspective."
author: "Faiq Najib Al-Aziz"
date: 2026-04-10
lastmod: 2026-09-11T09:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - notes
  - architecture
  - migration
---

There was a moment where I stopped typing, leaned back in my chair, and realized: _"This isn't about refactoring anymore."_

I was debugging a bug in a GPS tracker system that had been running for years[^1]. The bug was simple, vehicle position reports weren't updating on the dashboard. But to fix it, I had to trace through four different files, two business logic layers tangled together, and one query written without an index. An hour later, the fix was two lines. Two lines.

It wasn't the bug that made me reconsider. It was **the time it took to find those two lines**. It felt like looking for a needle in a haystack, only to find it was in my own pocket the whole time hehe~

_So anyway_, this isn't about a particular language or technical solution. I want to capture the **thinking process** behind a tech stack migration decision: when it makes sense, when it doesn't, and how to weigh the business side too. Technical discussions often turn into Language A vs Language B debates, even when that isn't the source of the problem.

## What the System Looked Like

The GPS tracker project I was handling wasn't ~~exactly~~ small. The numbers were roughly:

- **370+ API endpoints** serving various needs, from real-time tracking to report generation
- **33 database entities** with complex relationships
- **~194,000 lines of code** written over several years by multiple developers[^2]

But the numbers weren't really the problem. The line count looks intimidating; what got in the way were the **symptoms**:

### 1. Features That Should Be Fast, Became Slow

Features that used to ship in two days now took two weeks. Not because the developers were slow, but because every change had unexpected ripple effects. One new field in one entity could propagate to five different files.

From a business perspective, this meant **the speed of delivering value to users was declining**. Features clients asked for took longer to arrive, and the competitive window was shrinking.

### 2. Bugs That Only Appeared in Production

_If it works locally but errors in production, where do I even start looking?_ (A question that's kept me up late scrolling Stack Overflow more times than I'd like to admit hahaha)

This is a classic symptom of a tightly coupled system. Code that runs in one environment doesn't behave the same in another because of unexpected side effects. Debugging wasn't about logic, it was about _why_ the production context differed from expectations. Once I even had to remote into the production server at 2 AM just to check one environment variable that turned out to... simply not be set yet. Facepalm.

From a business perspective, this meant **no certainty**. A client could get a wrong report in the morning, and nobody would know why until noon.

### 3. New Developer Onboarding Took Longer

Back then, a new developer could start contributing within a week. At that point, it took almost a month before they were comfortable coding without fear of breaking something. Not because they lacked skill, but because the codebase required a lot of **context** to understand. I still remember the expression on one new developer's face when they first opened the codebase. It was... well, like someone who just woke up and was immediately asked to run a marathon hehe~

From a business perspective, this meant **the cost of adding team capacity was increasing**. Every new developer needed more time before becoming productive.

### 4. Fear With Every Deploy

Every time we were about to deploy, there was this feeling of "hope nothing breaks this time." Not because there was no testing, but because the existing tests didn't cover all edge cases. And in a tightly coupled system, one small change could have a domino effect. Like pulling one thread from a sweater and watching everything else unravel. Friday afternoon deploys? _God forbid_, don't even think about it hahaha.

From a business perspective, this meant **the team became conservative**. Features that were actually safe to ship got delayed because of fear of side effects. Innovation slowed down not because of a lack of ideas, but because of fear of breaking things.

## The Questions I Asked Myself

After seeing those symptoms, I started asking myself: **could the problem be solved without migrating?**

### "Is the Problem in the Tool or in How We Use It?"

This is the first and most important question. If the problem is in how we write code, for example, no layering, no testing, no code review, then migrating tech stacks won't solve anything. We'd just be moving the problem to a new tool.

In this GPS tracker case, the answer was: **both**. The way code was written did need improvement, but the language and framework being used also had limitations that made writing clean code harder than it should be. A dynamically typed language[^3] without runtime enforcement meant type-related bugs surfaced in production, not during development. And type-related bugs in production... ugh, every error notification made my heart skip a beat hehe.

### "If We Just Refactor, Would That Be Enough?"

The second question: if we invested time in cleaning up the architecture on the existing tech stack, would the results be worth it?

In this case, my rough estimate was that refactoring 370+ endpoints with proper architecture in PHP would take almost as long as migrating to a new stack. The difference: after refactoring in PHP, we'd still be stuck with some fundamental limitations (type safety, concurrency, deployment complexity). Migration would give us new capabilities.

But this was **my case**, right. It doesn't mean refactoring is always the wrong choice. If the system is smaller, or if the stack's limitations aren't too constraining, refactoring is a far wiser choice. Don't read this and immediately start migrating your whole system without thinking it through. You don't want to end up like one horror story I once heard: two years of migration work, only to end up reverting to the old system hahaha.

### "What's the Cost of Doing Nothing?"

This is the question that often gets missed. We often calculate the cost of migration, time, money, risk, but rarely calculate **the cost of standing still**.

In the GPS tracker case:

- Features shipping slower = clients might switch to competitors
- Bugs appearing in production = client trust decreases
- Longer onboarding = effective recruitment costs increase
- Fear during deploys = innovation slows down

If the total cost of inaction over one year **exceeds** the estimated cost of migration, from a business perspective, the decision is pretty clear.

### "Can Our Team Handle the Migration?"

Tech stack migration requires new skills. The team needs to learn a stack they might not be familiar with. There's ramp-up time. Mistakes will happen.

The question isn't "can we?" but "do we have the **room** to do it?" If the team is already overwhelmed with deadlines and bug fixes, migration will only add burden. But if there's a window, whether between projects, or when capacity is sufficient, that's the right time to start.

In my case, we didn't migrate everything at once. We started with one module, one endpoint at a time, while still running business as usual. _Slow and steady wins the race_, as my colleague put it hehe. The technical details are in [my separate migration notes](/en/writing/2026/legacy-php-to-go-migration/).

### "How Do We Know the Migration Succeeded?"

If we don't have a definition of "success," we can't know when to stop. For me, the success criteria were:

1. **New features can be shipped faster** than before
2. **Production bugs decrease measurably**
3. **New developers can onboard faster**
4. **Deploys are no longer feared**

If after migration, these numbers improve, then the migration succeeded. If not, then we need to reevaluate.

## A Thinking Framework: It's Not About the Language, It's About Momentum

Those questions led me to a simple framework: **three conditions that must be met** before migration makes sense.

### 1. The Problem Is Structural, Not a Skill Gap

If the problem is just "we don't know how to use this tool well", then the solution is learning, not switching. Migration only makes sense when **the system architecture itself** is the bottleneck, not the team's capability.

### 2. The Cost of Inaction Is Measured and Real

Not a feeling of "it seems like it's getting slower", but **data**. Features that used to take 2 days now take 2 weeks. Production bugs increased 30% in 6 months. Onboarding takes 4 weeks instead of 1. If the data isn't there, collect it first. Don't migrate based on assumptions.

### 3. The Team Has the Capacity to Execute

Migration requires time, energy, and focus. If the team is in peak season, or if there's no budget for the learning curve, it's better to wait. A migration forced at the wrong time can be more damaging than a legacy codebase.

---

If all three conditions are met, **migration makes sense**. If even one isn't, it's better to refactor or wait until the conditions support it.

## The Decision and What Happened

I decided to migrate. Not a decision made overnight, but a process of several weeks after gathering data and discussing with the team. There was a moment where I wavered, honestly, _"Do we really need to migrate? Can't we just refactor?"_ But after looking at the data, the decision was made.

The result? _Alhamdulillah_. Features that used to take two weeks could now be shipped in days. Production bugs decreased. New developer onboarding was faster. And most importantly: deploys were no longer feared. Now even Friday afternoon deploys are... well, still a little nerve-wracking, but nowhere near as bad as before hahaha.

I cover the per-module approach, patterns, and technical lessons in a [separate write-up](/en/writing/2026/legacy-php-to-go-migration/).

## Lessons Learned

### 1. Collect Data First, Decide Later

Don't migrate because "it feels like we need to" or because a new tech stack is trending[^4]. Collect the data: how long new features take to ship, how often bugs appear, and how long onboarding takes. Evidence makes the decision easier to explain to stakeholders. Telling your boss _"we should migrate because Go is cool"_ won't work. But _"features that used to take 2 days now take 2 weeks, here's the data"_? Now that's a conversation hehe.

### 2. Migration Is a Business Decision, Not Just a Technical One

Migration discussions often get stuck on "language A is better than language B." But the question that should be asked is: "does the current tech stack still allow us to deliver value at the speed we need?" If the answer is no, then it's time to talk migration. Because the end goal is to build something useful for users, not to win arguments on developer forums hahaha.

### 3. Refactoring vs Migration Isn't Binary

It's not a choice between "refactor everything" or "migrate everything." Sometimes the answer is refactor first, then migrate incrementally. Sometimes refactoring alone is enough. Context and system scale determine the answer; technical decisions are rarely black and white hehe~

### 4. Also Calculate the Cost of Doing Nothing

We often focus on "how much does migration cost" and forget to ask "how much does it cost if we don't migrate?" Sometimes, the cost of standing still is far more expensive in the long run. Like the saying goes, better to visit the dentist early than to tough it out until it's serious. Is that actually a saying? Well, you get the point hahaha.

## Closing Thoughts

A tech stack migration decision is personal: it depends on context, team, timeline, and other factors. No framework applies to every situation. Asking the right questions and gathering enough data can lead to a sounder decision than simply following hype.

I hope these notes are useful if you're weighing a migration. If you'd like to discuss a similar dilemma, [get in touch](/en/contact/) or check out my [services](/en/services/).

[^1]: A GPS tracker system that had been running for several years, with various feature additions and patches layered on top over time.

[^2]: Many developers had come and gone over the years, each with their own coding style. So the result was... well, a mixed bag hehe.

[^3]: Not saying dynamically typed languages are bad, of course. It's just that for certain cases, static typing really helps a lot.

[^4]: Tech FOMO (_Fear of Missing Out_) is real. But don't let technical decisions be driven by fear of being left behind on the latest trend.

---

_Tags: [notes](/en/tags/notes/) · [architecture](/en/tags/architecture/) · [migration](/en/tags/migration/)_
