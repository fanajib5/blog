---
title: "Business Process Automation with UiPath RPA: When an Rp8 Billion Difference Starts Feeling Normal"
description: "Field notes on using UiPath RPA to reduce manual-process risk after a bond worksheet miscalculation of around Rp8 billion stopped feeling as alarming as it should have."
author: "Faiq Najib"
date: 2020-10-12
lastmod: 2020-10-12
draft: false
toc: true
comments: false
tags:
  - notes
  - rpa
  - automation
  - uipath
---

There is a phase in some jobs where your sense of scale shifts without asking for permission. When you look at billions, tens of billions, and hundreds of millions every day, something strange can happen: one day you see a **Rp8 billion** difference in a bond worksheet, and your first reaction is not panic. It is more like, _"Alright, another mismatch. Let me check it for a minute."_

That was the disturbing part.

Because **Rp8 billion is not a small number**. But in my head at that time, after being exposed to large nominal figures so often, it briefly felt closer to **Rp8 million** than to a real operational alarm. Still wrong, obviously. But mentally, the danger signal had gone dull. And when your danger signal goes dull, the issue is no longer just calculation. The issue is the process around it.

This is not a step-by-step UiPath Studio tutorial. These are my notes on how a bond-workpaper miscalculation changed the way I looked at business process automation. For me, automation was not about flashy tools. It was about **protecting people from fatigue, bias, and the habit of treating high-risk numbers as routine**.

## It Did Not Start with a Huge Bug, Just a Process That Was Too Manual

The context was roughly this: a recurring workflow, similar format every period, but still requiring high precision. Data came from multiple sources, got copied into worksheets, validated, recalculated, and then used for reporting or downstream decisions.

On paper, the flow looked simple. In practice, well... not that simple hehe.

Because every small step introduced a small chance of error. And if you keep stacking those small chances every day, the end result can become very large.

The main problem was not that one person was careless. The problem was more structural:

1. **Too much manual copy-paste**
2. **Validation relied on eyesight and habit**, not on consistent controls
3. **Process knowledge lived inside specific people**, not inside the workflow
4. **Time pressure** slowly turned rechecks from real verification into mere ritual

And like many operational processes, everything looked like it was "still working" until one day a number showed up that was too large to ignore.

## That Rp8 Billion Moment

I still remember the uneasy feeling. One number did not line up during reconciliation. After tracing it, the difference was not in the millions. Not even in the hundreds of millions. It was **around Rp8 billion**.

At that point I paused for a few seconds. Not because I did not know what to do, but because my brain strangely did not register it as "huge" immediately. Even though it clearly was huge. Very huge.

It may sound absurd, but that is what repeated exposure to large nominal values can do. Perception shifts. A number that should have made your heart jump instead starts looking like just another work item. Almost like, _"Fine, we will review it later."_

For me, the lesson from that moment was not simply "be more careful." Advice like that is too shallow. The real lesson was this: **humans can adapt even to risk**, and when that happens, a process cannot depend only on human alertness.

## Why Automation Was My Next Thought

After that incident, I did not see it as a single person's miscalculation. I saw it as a sign that some parts of the process should no longer be handled entirely by manual effort.

A few questions kept coming back:

- Why did important validation still depend on visual checking?
- Why did data need to be moved so many times across files or systems?
- Why did material differences become visible only after the process had already gone far enough?
- Why did the real controls exist more in people's heads than in the workflow itself?

That is when I seriously started looking at **RPA (Robotic Process Automation)**, especially **UiPath**. Not because I was hunting for a trendy tool, but because I needed something that could close the gaps in a workflow that was too repetitive, too manual, and too good at making people less sensitive over time.

## Why UiPath

At that point, I was not looking for the most impressive solution. I was looking for the most realistic one.

### 1. It Fit the Existing Process Landscape

We were not in a position to redesign every system from scratch. UiPath was attractive because it could be introduced into existing workflows without waiting for every application to become ideal.

### 2. The Value Could Be Seen Quickly

For tasks full of repetitive inputs, routine checks, and value comparisons, the benefit of automation became visible fairly quickly. That mattered, because if results take too long to show up, stakeholders usually lose interest.

### 3. It Could Act as an Extra Control Layer

I was not just looking for a bot that could "help with clicks." I needed an additional control layer: consistent data reading, cross-validation, exception marking, and a clearer audit trail.

For that kind of use case, UiPath made sense.

## The Approach I Took

I did not start by building one giant robot to do everything. That would have been too risky and too hard to maintain. Instead, I broke the problem into smaller parts.

### 1. Map the As-Is Process Honestly

Not the neat SOP version written in documents, but the version that actually happened at the desk. Including shortcuts, habits, skipped steps, and checks that were really just operator instinct.

This part mattered a lot. Documented processes often look clean, while real processes in the field are full of improvisation.

### 2. Identify the Most Critical Control Points

Not every step needed to be automated at once. I focused on the points that were most likely to fail and most expensive if they slipped through:

- source-data capture
- reconciliation across values
- out-of-tolerance flagging
- exception-summary generation

That way, automation was not only about speed. It also made it clearer where human attention was actually needed.

### 3. Treat Errors as Normal

This principle changed how I thought about bots. If an automation flow only works when all inputs are ideal, that is not production automation. That is a presentation.

So from the start, I preferred flows that assumed these things would definitely happen:

- file formats change
- some fields are blank
- field names differ slightly but matter a lot
- calculations do not match
- target systems are slow or fail to open

The bot needs to know when to continue, when to stop, and when to call a human.

### 4. Keep Logs That Humans Can Actually Read

Funny enough, many automation efforts fail not because the core logic is bad, but because when something breaks, nobody can understand quickly where it failed.

Since then, I have believed more strongly that **clear logs are worth more than fancy workflows that become opaque the moment something goes wrong**.

## What Changed the Most

Once the process became more stable, the change was not only about speed.

What I felt most clearly was this:

- **the team became more alert again**, because exceptions were easier to see
- **the discussion shifted from "who entered this wrong" to "why did this control let it pass"**
- **rechecks became more focused**, because people were no longer drained by copy-paste work
- **big numbers started feeling big again**, because the system helped flag anomalies earlier

For me, that last point matters a lot. Sometimes the biggest benefit of automation is not time savings. Sometimes it is restoring our sensitivity to risk.

## Lessons That Stayed with Me

### 1. Big Risks Often Enter Through Small, Ordinary Gaps

That Rp8 billion difference did not come from one dramatic explosion. It came from a chain of small steps that had been normalized.

### 2. Manual Carefulness Is Not a Scalable Control

People can be careful, but people also get tired, bored, rushed, or too familiar with the same pattern. If the process matters, the control needs to live in the system, not only in someone's head.

### 3. Good Automation Does Not Remove Humans

It does the opposite. It removes repetitive work so humans can focus on judgment, analysis, and exception handling.

### 4. No Tool Can Save a Process You Still Do Not Understand

Before touching UiPath, I had to understand the workflow honestly first. If the process itself is still blurry, a robot will only accelerate the chaos.

## Closing

For me, the moment I saw an Rp8 billion difference and briefly felt it was just another ordinary number was louder than any error message. It was a warning that repetitive manual work can slowly erode human sensitivity to risk.

That is where I saw the value of UiPath RPA: not merely as a speed tool, but as a way to help preserve process discipline when human attention cannot be fully relied on all the time.

If you want the broader version of how I think about business process automation with UiPath RPA, I also wrote a [separate note](/en/writing/2026/business-process-automation-with-rpa-uipath/) that covers the approach and implementation side more generally.

If you are evaluating business process automation in workflows that are sensitive to numbers, validation, and operational risk, [get in touch](/en/contact/). Or check out my [services](/en/services/) to see how I can help.

---

_Tags: [notes](/en/tags/notes/) · [rpa](/en/tags/rpa/) · [automation](/en/tags/automation/) · [uipath](/en/tags/uipath/)_
