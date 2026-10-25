---
title: "A Stepladder for IT Projects"
description: "A story about teammates or bosses in IT projects whose way of talking feels like summiting a mountain, and how to deal with it without having to climb alongside them."
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

There's a certain type of person who makes me pause, furrow my brow, and nod along, while internally raising my hand and shouting for a stepladder.

I call them _high-talkers_. Not because their voice is loud. But because the way they speak feels like an invitation to summit Mount Everest... without gear, without a map, and without any physical preparation whatsoever.

And ironically, I run into this type most often in IT projects.

## Why Are They Like This?

I've wondered about this for a while. Across the projects I've worked on, I've noticed three possible reasons.

**First, they're too deep in their field.**

People who've spent years immersed in microservices, event-driven architecture, CQRS, or distributed tracing sometimes forget that not everyone wakes up and goes to sleep with those same terms. They speak like they're writing technical documentation: detailed, precise, and utterly confusing if you don't have enough context yet hehe.

**Second, they want to appear competent.**

This one's a bit sensitive. Sometimes, overusing technical jargon isn't a habit but a choice. Showing off, plainly put. The longer the acronym that rolls off their tongue, the higher they feel their position is. At least in their own head~~

**Third, the topic is genuinely hard.**

And I have to admit this too, fair enough. Not every IT concept can be explained in two sentences. Sometimes dependency injection, race conditions, or eventual consistency genuinely require a bit of extra effort to understand.

The difference is: someone who **truly understands** can simplify it. Someone who **half understands** tends to pile on more terms. As physicist Richard Feynman once said:

> _"If you can't explain it simply, you don't understand it well enough."_

## The Case in IT Projects: Teammates and Bosses

I've experienced this firsthand. In one app development project, a senior backend teammate always opened explanations with ten new terms, even for something that could've been said in one sentence.

_"We need to redesign the flow because there's tight coupling between the domain service and infrastructure layer that's killing testability and will become a bottleneck in the message broker when we try to scale horizontally."_

...I could only nod while whispering internally: _"Sure, mate. Let me go buy a dictionary first."_

The actual point? We need to separate some parts of the codebase so it's easier to maintain. But it took a full paragraph of jargon to get there haha.

When the _high-talker_ is your **boss**, the situation gets trickier. You can still cut in with a light joke when it's a peer, but one wrong move with a manager can come across as rude or unprofessional.

I once sat through a regular meeting where a manager, full of enthusiasm, explained the technical direction of a project for 30 minutes, with barely any pause for questions. And I walked out, or more precisely, clicked "Leave Meeting", with one burning question: _"So... what are we actually doing tomorrow?"_

## The Feynman Technique

I started learning more about the [Feynman Technique](https://fs.blog/feynman-technique/).

The core is simple: if you can't explain a concept to someone who knows absolutely nothing about it, then you don't truly understand it yourself.

In an IT project, the technique has two sides.

**As a listener**, you can ask your teammate or manager to re-explain using a simpler analogy. Some phrases that work well:

- _"Could you give me an analogy first, as if I'm a high schooler just starting to learn coding?"_
- _"Could you give me a real example from our case before going into the theory?"_

Someone who understands can usually answer. If they get even more confused when asked to simplify, maybe the original explanation wasn't helping haha.

**As a speaker**, this technique trains you to avoid falling into the same habit. Before explaining something to your team, ask yourself: _if my teammate who just started learning a month ago heard this, would they understand?_

If the answer is no, simplify first.

For example, instead of saying:

> _"We need to implement Dependency Injection so the coupling is loose and unit tests can be mocked."_

Try:

> _"Imagine your car needs fuel. Usually you fill it up yourself. But with this approach, the car just says 'I need fuel' and someone else provides it. The car doesn't need to know where the fuel comes from. That's the whole idea."_

This analogy is easier to digest, and the message still lands.

## How to Deal With It

When an explanation gets hard to follow, a few approaches can bring the conversation back to the case at hand.

**What works:**

1. **Ask genuinely, not confrontationally.** Something like _"That's interesting, could you give an example from our project?"_ lands far better than _"I don't understand, can you just explain it simply."_ The end result is the same, but the first option doesn't hurt anyone's ego. Especially important when talking to a manager hehe.

2. **Ask for documentation or a diagram.** Sometimes people explain things more clearly in writing or visuals than in conversation. And with documentation, you can re-read at your own pace without pressure. _Win-win._

3. **Validate first, ask second.** Try paraphrasing back: _"So you mean we need to split the system to make it easier to maintain, right?"_ If they agree, you've got the gist. If not, they'll correct you, and their explanation tends to get clearer because they're forced to rethink it haha.

4. **In meetings, establish shared norms.** If your position allows it, suggest a team habit: _"Let's agree that whenever a new technical term comes up, we add a brief plain-language explanation."_ It sounds small, but the impact on team communication quality is significant.

**What to avoid:**

Don't pretend to understand just to keep the peace. Including peace with yourself. Because it only delays the problem. And problems delayed in IT projects tend to compound, then multiply, then turn into a bug you discover a week before the deadline haha.

## I've Been a _High-Talker_, Too

After running into this communication style a few times, I realized I've been a _high-talker_ myself.

There were periods where I was extremely enthusiastic about something I'd just learned, whether it was clean architecture, hexagonal patterns, or whatever concept I'd just found on some foreign blog, and I'd bring it up at every opportunity. Even though not everyone needed to hear it right then. And honestly, I probably hadn't fully mastered it myself~~

I'm not writing this to judge anyone. I need the reminder myself: a term I've just learned doesn't have to come up in every conversation.
