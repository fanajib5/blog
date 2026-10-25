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

In some jobs, large numbers can start to feel ordinary. I saw hundreds of millions and tens of billions every day. Then one day I found a **Rp8 billion** difference in a bond worksheet. My first reaction was, _"Oh, another mismatch. Let me check it for a minute."_

That reaction stuck with me.

**Rp8 billion is not a small number**. But after seeing large figures so often, it briefly felt closer to **Rp8 million**. The calculation was still wrong, of course. What bothered me was that the alarm in my head was not loud enough. So the calculation was not the only thing that needed a look. The process around it did too.

This is not a step-by-step UiPath Studio tutorial. I just want to talk about how a miscalculation in a bond workpaper changed the way I think about business process automation. For me, automation is not about picking a flashy tool. It is about **helping people deal with fatigue, bias, and the habit of treating high-risk numbers as routine**.

## It Started with Repetitive Manual Work

The workflow repeated in a similar format each period, but still needed careful work. Data came from several sources, was copied into worksheets, validated, recalculated, then used for reporting or the next decision.

It looked simple on paper. Doing it was another story. There was a lot of manual copy-paste, checks relied on eyesight and habit, process knowledge lived with particular people, and time pressure could turn a recheck into a ritual. Every small step left room for error. Stack enough of those chances together and the difference can get large.

I did not see this as one careless person's fault. The process itself had gaps. It all looked like it was "still working" until a number showed up that was too large to ignore.

## When the Rp8 Billion Difference Showed Up

I still remember the unease. One figure did not match during reconciliation. After tracing it, I found a difference of **around Rp8 billion**, not millions or even hundreds of millions.

I stopped for a few seconds. Not because I did not know what to do, but because my brain did not immediately register the figure as "huge". Even though, yes, it clearly was.

It may sound absurd, but looking at large figures every day can shift your sense of scale. A number that should make you stop and pay attention starts to look like another work item. Something like, _"Fine, we will check it later."_

My answer was not simply "be more careful." That is easy advice to give, but it does not help much. **People can get used to risk**, and when that happens, a process cannot depend only on human alertness.

## Why I Started Looking at Automation

After the incident, I did not see it as one person's mistake. To me, it showed that some parts of the process should not be handled entirely by hand.

The same questions kept coming back:

- Why did important validation still depend on visual checking?
- Why did data need to be moved so many times across files or systems?
- Why did material differences become visible only after the process had already gone far enough?
- Why did the real controls exist more in people's heads than in the workflow itself?

Those questions led me to take **RPA (Robotic Process Automation)** seriously, especially **UiPath**. I was not chasing the latest trendy tool. I wanted something to help close gaps in a repetitive workflow that could make people let their guard down.

## Why I Chose UiPath at the Time

I was not looking for the flashiest solution. I wanted something that made sense for the situation.

### It Fit Into the Existing Process

We were not in a position to redesign every system from scratch. UiPath was attractive because it could be introduced into existing workflows without waiting for every application to become ideal.

### I Could Show the Value Sooner

For tasks full of repetitive inputs, routine checks, and value comparisons, automation could show its value fairly quickly. That mattered because stakeholders could lose interest if results took too long to appear.

### It Could Add Another Control Layer

I was not just looking for a bot that could "help with clicks." I needed an additional control layer: consistent data reading, cross-validation, exception marking, and a clearer audit trail.

For that kind of use case, UiPath made sense.

## How I Approached It

I did not build one giant bot to do everything. That would be risky and hard to maintain. I broke the problem into smaller pieces instead.

### I Mapped What Actually Happens

I mapped the work as it actually happened, not just the tidy SOP version in the documents. That meant including shortcuts, habits, skipped steps, and checks that relied on an operator's instinct.

This mattered. A process can look clean on paper while the day-to-day work is full of improvisation.

### Then I Picked the Checks That Mattered Most

I did not need to automate every step at once. I focused on the steps most likely to fail and most costly to miss:

- source-data capture
- reconciliation across values
- out-of-tolerance flagging
- exception-summary generation

That way, automation was not just about speed. It also clarified where human attention was needed.

### I Assumed Something Would Go Wrong

This changed how I thought about bots. If a flow only works when every input is ideal, it is not ready for real use. It is just a demo.

From the start, I preferred to design flows on the assumption that these things would happen:

- file formats change
- some fields are blank
- field names differ slightly but matter a lot
- calculations do not match
- target systems are slow or fail to open

The bot needs to know when to continue, when to stop, and when to call a human.

### And the Logs Had to Be Readable

Automation can be painful not because the core logic is bad, but because when something breaks, people cannot tell where to look.

Since then, I have become more convinced that **clear logs are worth more than fancy workflows that become opaque the moment something goes wrong**.

## What I Noticed Afterward

Once the process became more stable, I noticed more than a speed improvement. What stood out to me was:

- **the team became more alert again**, because exceptions were easier to see
- **the discussion shifted from "who entered this wrong" to "why did this control let it pass"**
- **rechecks became more focused**, because people were no longer drained by copy-paste work
- **big numbers started feeling big again**, because the system helped flag anomalies earlier

That last part matters to me. Automation is not always about saving time. Here, it helped us notice risk again.

## What I Still Remember

That Rp8 billion difference came from a chain of small steps that had become routine. People can be careful, but they also get tired, bored, or rushed. If a process matters, its controls need to live in the system, not just in someone's head. Automation takes repetitive work off people's hands so they can focus on judgment, analysis, and exceptions. But before building a bot, I still need to understand the process. If the workflow is unclear, a robot will only speed up the chaos.

I still remember seeing that Rp8 billion difference and briefly treating it as an ordinary number. It was a louder alarm than any error message. That was when I realized how repetitive manual work can dull our sense of risk.

For me, UiPath RPA is not just a way to speed things up. It can also help keep the process disciplined when people are tired or distracted.

If you want the broader version of how I think about business process automation with UiPath RPA, I also wrote a [separate note](/en/writing/2026/business-process-automation-with-rpa-uipath/) that covers the approach and implementation side more generally.

If you are evaluating automation for a workflow where numbers, validation, and operational risk matter, you can [get in touch](/en/contact/) or look at the [services](/en/services/) I offer.

---

_Tags: [notes](/en/tags/notes/) · [rpa](/en/tags/rpa/) · [automation](/en/tags/automation/) · [uipath](/en/tags/uipath/)_
