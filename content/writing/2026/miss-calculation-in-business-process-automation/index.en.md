---
title: "Business Process Automation with UiPath RPA: When an Rp8 Billion Difference Starts Feeling Normal"
description: "Field notes on using UiPath RPA to reduce manual-process risk after a bond worksheet miscalculation of around Rp8 billion stopped feeling as alarming as it should have."
author: "Faiq Najib Al-Aziz"
date: 2026-03-20
lastmod: 2026-09-11T09:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - notes
  - rpa
  - automation
  - uipath
---

In some jobs, your sense of scale can shift without you noticing. I worked with amounts ranging from hundreds of millions to tens of billions every day. Then one day, I spotted a **Rp8 billion** difference in a bond worksheet. My first reaction was not panic. It was more like, _"Alright, another mismatch. Let me check it for a minute."_

That reaction bothered me.

**Rp8 billion is not a small number**. Still, after seeing large figures so often, it briefly felt closer to **Rp8 million**. I knew the calculation was wrong, but my mental alarm was quieter than it should have been. When that alarm goes quiet, the calculation is not the only thing to inspect. The process around it needs attention too.

This is not a step-by-step UiPath Studio tutorial. It is a note on how a miscalculation in a bond workpaper changed the way I looked at business process automation. For me, automation is not about flashy tools. It is about **helping people deal with fatigue, bias, and the habit of treating high-risk numbers as routine**.

## It Did Not Start with a Huge Bug, Just a Process That Was Too Manual

The workflow repeated in a similar format every period, but still required careful work. Data came from multiple sources, was copied into worksheets, validated, recalculated, and then used for reporting or downstream decisions.

On paper, the flow looked simple. Doing the work was less straightforward.

Every small step introduced a chance of error. When those small chances keep adding up, the resulting difference can be large.

The problem was not one careless person. It was the way the process was structured:

1. **Too much manual copy-paste**
2. **Validation relied on eyesight and habit**, not on consistent controls
3. **Process knowledge lived inside specific people**, not inside the workflow
4. **Time pressure** slowly turned rechecks from real verification into mere ritual

As in many operational processes, everything looked like it was "still working" until a number appeared that was too large to ignore.

## That Rp8 Billion Moment

I still remember the unease. One figure did not match during reconciliation. After tracing it, I found a difference of **around Rp8 billion**, not millions or even hundreds of millions.

I paused for a few seconds. Not because I did not know what to do, but because my brain did not immediately register the figure as "huge". Even though it clearly was. Very much so.

It may sound absurd, but seeing large figures every day can shift your perception. A number that should make you stop and pay attention starts to look like just another work item. Almost like, _"Fine, we will review it later."_

The lesson for me was not simply "be more careful." That advice is too shallow. **People can get used to risk**, and when that happens, a process cannot depend only on human alertness.

## Why Automation Was My Next Thought

After the incident, I did not see it as one person's mistake. I saw it as a sign that some parts of the process should no longer be handled entirely by hand.

The same questions kept coming back:

- Why did important validation still depend on visual checking?
- Why did data need to be moved so many times across files or systems?
- Why did material differences become visible only after the process had already gone far enough?
- Why did the real controls exist more in people's heads than in the workflow itself?

Those questions led me to look seriously at **RPA (Robotic Process Automation)**, especially **UiPath**. I was not looking for a trendy tool. I needed something that could help close gaps in a workflow that was repetitive, manual, and could make people let their guard down over time.

## Why UiPath

I was not looking for the most impressive solution. I wanted one that was realistic to put to use.

### 1. It Fit the Existing Process Landscape

We were not in a position to redesign every system from scratch. UiPath was attractive because it could be introduced into existing workflows without waiting for every application to become ideal.

### 2. The Value Could Be Seen Quickly

For tasks full of repetitive inputs, routine checks, and value comparisons, automation could show its value fairly quickly. That mattered because stakeholders could lose interest if results took too long to appear.

### 3. It Could Act as an Extra Control Layer

I was not just looking for a bot that could "help with clicks." I needed an additional control layer: consistent data reading, cross-validation, exception marking, and a clearer audit trail.

For that kind of use case, UiPath made sense.

## The Approach I Took

I did not build one giant bot to do everything. That would have been too risky and hard to maintain. I broke the problem into smaller parts instead.

### 1. Map the As-Is Process Honestly

I mapped the process as it actually happened at the desk, not just the neat SOP version in the documents. That meant including shortcuts, habits, skipped steps, and checks that relied on operator instinct.

This mattered. A process can look clean on paper while the day-to-day work is full of improvisation.

### 2. Identify the Most Critical Control Points

Not every step needed to be automated at once. I focused on the points most likely to fail and most costly if they slipped through:

- source-data capture
- reconciliation across values
- out-of-tolerance flagging
- exception-summary generation

That way, automation was not just about speed. It also clarified where human attention was needed.

### 3. Treat Errors as Normal

This principle changed how I thought about bots. If an automation flow works only when every input is ideal, it is not ready for use. It is just a presentation.

From the start, I preferred to design flows on the assumption that these things would happen:

- file formats change
- some fields are blank
- field names differ slightly but matter a lot
- calculations do not match
- target systems are slow or fail to open

The bot needs to know when to continue, when to stop, and when to call a human.

### 4. Keep Logs That Humans Can Actually Read

Many automation efforts fail not because the core logic is bad, but because when something breaks, people cannot quickly tell where it failed.

Since then, I have become more convinced that **clear logs are worth more than fancy workflows that become opaque the moment something goes wrong**.

## What Changed the Most

Once the process became more stable, I noticed changes beyond speed.

The changes I noticed most:

- **the team became more alert again**, because exceptions were easier to see
- **the discussion shifted from "who entered this wrong" to "why did this control let it pass"**
- **rechecks became more focused**, because people were no longer drained by copy-paste work
- **big numbers started feeling big again**, because the system helped flag anomalies earlier

That last point matters to me. Automation is not always about saving time. Here, what mattered was helping restore our sensitivity to risk.

## Lessons That Stayed with Me

### 1. Big Risks Often Enter Through Small, Ordinary Gaps

That Rp8 billion difference did not come from one dramatic failure. It came from a chain of small steps that had become routine.

### 2. Manual Carefulness Is Not a Scalable Control

People can be careful, but they also get tired, bored, rushed, or too familiar with the same pattern. If a process matters, its controls need to live in the system, not just in someone's head.

### 3. Good Automation Does Not Remove Humans

It does the opposite. It removes repetitive work so humans can focus on judgment, analysis, and exception handling.

### 4. No Tool Can Save a Process You Still Do Not Understand

Before using UiPath, I needed to understand the workflow as it really was. If the process is still unclear, a robot will only speed up the chaos.

## Closing

Seeing an Rp8 billion difference and briefly treating it as an ordinary number was louder than any error message. To me, it showed how repetitive manual work can erode people's sensitivity to risk.

That is where I saw the value of UiPath RPA: not just as a way to speed up work, but as a way to help maintain process discipline when human attention cannot always be relied on.

If you want the broader version of how I think about business process automation with UiPath RPA, I also wrote a [separate note](/en/writing/2026/business-process-automation-with-rpa-uipath/) that covers the approach and implementation side more generally.

If you are evaluating automation for a workflow where numbers, validation, and operational risk matter, you can [get in touch](/en/contact/) or look at the [services](/en/services/) I offer.

---

_Tags: [notes](/en/tags/notes/) · [rpa](/en/tags/rpa/) · [automation](/en/tags/automation/) · [uipath](/en/tags/uipath/)_
