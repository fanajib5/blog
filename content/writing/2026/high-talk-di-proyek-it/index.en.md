---
title: "A Stepladder for IT Projects"
description: "My notes on technical jargon that can make an IT project conversation feel like a hike without a map."
author: "Faiq Najib Al-Aziz"
date: 2026-05-17
lastmod: 2026-09-11T09:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - soft-skill
  - notes
  - personal
---

Some conversations make me pause, furrow my brow, and nod as if I understand. In my head, I’m already asking for a stepladder.

I call the person a _high-talker_. Not because they speak loudly, but because their explanation can feel like an invitation to climb Mount Everest without gear or a map. I only just learned the term, so maybe I’m pretending to sound clever too hehe.

Somehow, I run into this type most often in IT projects.

## How Does That Happen?

I’ve wondered why technical conversations end up this way. From the projects I’ve seen, there can be a few reasons.

Some people spend years immersed in microservices, event-driven architecture, CQRS, or distributed tracing, then forget that not everyone wakes up and goes to sleep with those terms. They speak like they’re writing technical documentation: detailed, precise, and confusing if you don’t have enough context yet hehe.

Some people also want to sound like the most knowledgeable person in the room. This one’s a bit sensitive. Sometimes, overusing jargon isn’t a habit but a choice. Showing off, plainly put. The longer the acronym that rolls off their tongue, the higher they feel their position is. At least in their own head~~

The topic can also just be hard. I have to admit that, fair enough. Not every IT concept fits in two sentences. Dependency injection, race conditions, and eventual consistency can take extra effort to understand.

I’ve noticed that someone who understands a topic can usually find another way to explain it. If the jargon keeps piling up, maybe the speaker doesn’t fully understand it yet. Or maybe I’m the one who’s lost. Both are possible hahaha. Richard Feynman once said:

> _"If you can't explain it simply, you don't understand it well enough."_

## When a Project Conversation Starts Floating Away

I’ve experienced this myself. On one app project, a more senior backend teammate often opened with a pile of new terms, even when the point could fit in a sentence.

_"We need to redesign the flow because there's tight coupling between the domain service and infrastructure layer that's killing testability and will become a bottleneck in the message broker when we try to scale horizontally."_

...I could only nod while whispering internally: _"Sure, mate. Let me go buy a dictionary first."_

In my words, the code needed to be separated so it would be easier to maintain. Quite a journey to get there haha.

When the _high-talker_ is your **boss**, the situation gets trickier. You can still cut in with a light joke when it's a peer, but one wrong move with a manager can come across as rude or unprofessional.

I once sat through a regular meeting where a manager explained the project’s technical direction for about 30 minutes. I waited for a pause to ask a question, but it never came. When the meeting ended, I had one question: _"So what are we doing tomorrow?"_

## Trying to Explain It Again

I recently read a bit more about the [Feynman Technique](https://fs.blog/feynman-technique/).

The short version: try explaining the idea to someone who has never heard of it. If I keep going in circles, maybe I don’t understand it well enough yet.

In a project conversation, I can use this as a listener or a speaker.

**As a listener**, you can ask your teammate or manager to re-explain using a simpler analogy. Some phrases that work well:

- _"Could you give me an analogy first, as if I'm a high schooler just starting to learn coding?"_
- _"Could you give me a real example from our case before going into the theory?"_

If the person understands the topic, they can usually come up with a simpler example. If we’re both confused, we probably need to stop and make sure we mean the same thing first haha.

**As a speaker**, this technique trains you to avoid falling into the same habit. Before explaining something to your team, ask yourself: _if my teammate who just started learning a month ago heard this, would they understand?_

If the answer is not yet, try explaining it another way. I need that reminder too.

For example, instead of saying:

> _"We need to implement Dependency Injection so the coupling is loose and unit tests can be mocked."_

Try:

> _"Imagine your car needs fuel. Usually you fill it up yourself. But with this approach, the car just says 'I need fuel' and someone else provides it. The car doesn't need to know where the fuel comes from. That's the whole idea."_

This analogy might be easier to picture, at least for me.

## When I Start Losing the Thread

When an explanation starts sounding like a walking dictionary, I try to bring it back to the problem we’re discussing.

**A few things to try:**

1. **Ask nicely.** _"That’s interesting, could you give an example from our project?"_ sounds better than _"I don’t understand, just explain it simply."_ Especially when the other person is a manager hehe.

2. **Ask for a written example or diagram.** Sometimes a diagram helps more than a spoken explanation. I can also read it again without having to nod in a hurry.

3. **Try repeating the idea in your own words.** For example, _"So we need to split the system to make it easier to maintain, right?"_ If that’s wrong, the other person can correct me. I often understand better after hearing a simpler version.

4. **If you can, agree on a meeting habit.** For example, whenever a new term comes up, explain it briefly too. It doesn’t have to become a big rule. I just don’t want everyone leaving with the same unanswered question I had.

**What to avoid:**

I try not to pretend I understand just to end the conversation. The question will come back later, usually when the deadline is close and bugs have started multiplying haha.

## I've Been a _High-Talker_, Too

After complaining about this a few times, I realized I’ve been a _high-talker_ too.

When I had just learned about clean architecture or hexagonal patterns, I could get so excited that I brought them up in every conversation. Not everyone needed those terms right then, and I probably hadn’t understood them properly myself. Hehe, there I go.

I’m not writing this to judge anyone. I’m reminding myself that if people don’t understand what I mean, I may need to explain it again. A new term I’ve learned doesn’t have to show up in every conversation. Sometimes one plain sentence is enough, if I can manage to put one together.
