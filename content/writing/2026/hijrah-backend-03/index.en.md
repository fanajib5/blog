---
title: "Hijrah Backend (3): Porting Dozens of GPS Protocol Parsers Without Stopping the Fleet"
description: "Episode 3 of the Hijrah Backend series: a one-month sprint porting 21 binary GPS parsers, a parked car reading 66 km/h, a band-aid that lived less than a day, and the single character that fixed it all."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T015:30:00+07:00
lastmod: 2026-09-11T01:00:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - parser
  - gps
  - story
series: "Hijrah Backend"
---

Let's start with the most confusing report I've ever handled: a vehicle parked with its engine off, while the system read its speed as **66 km/h**. Satellites healthy, data flowing in. If you've ever wondered how one wrong punctuation mark can make a parked car speed, this story is for you hehe~

## Rewind: January 2025

As covered in [episode one](/en/writing/2026/hijrah-backend-01/), the migration mandate had been waiting since before I was even hired. One of its largest chunks landed on my desk: the protocols. The front door for all fleet data.

It looked like this: dozens of GPS tracker types, each vendor speaking its own binary dialect, and the old system had one parser per dialect. My job was rewriting all of them in Go while the fleet kept transmitting every second. There was no "let's shut it down for tonight" window.

So my daily routine in January 2025: read a PHP parser, write a Go parser, repeat. The office even bought me a premium AI subscription of that era to speed up the conversion.

The trail still exists today: my first conversation with the mandate holder is timestamped January 2nd, three in the afternoon, containing the project folder location; and my first work sentence there was a request to convert the first CodeIgniter file to Go. The sprint's result is also officially recorded in the bosses' group chat: the listener conversion finished ten days ahead of the timeline. The only part of that mandate that arrived early hahaha. Everyone has their own way of spending late nights; mine happened to be rewriting twenty-one parser variants hehe~

## The Luck Nobody Talks About

Before the misunderstanding in this story, let me note the luck: for every Go parser I wrote, the original PHP code was available to compare against. Porting became a 1:1 exercise, not guesswork from protocol specs.

The method was simple but strict: compare the GPS read offsets, the IO-element read structure (the starting position), and the branch counts, file by file. Twenty-one variants, one at a time. Not all at once, not "the pattern is probably the same". Because, as you're about to see, the "same" pattern almost defeated me hahaha.

## The Parked Car That Was Speeding

The symptom surfaced later, in one parser family: trackers on a certain codec read 66 km/h while actually stationary. One field: speed.

My first theory sounded very reasonable. The parser had a branch overwriting the GPS-block speed with the value of IO element number 24. "Ah, IO-24 is overwriting it wrongly! Just remove the overwrite." So I removed it, across nine parsers at once, because "the pattern is the same".

That patch survived less than a day. On re-checking: the overwrite branch was actually correct, the PHP version had it too, and removing it broke other cases. Reverted the same day hahaha. The commit history records it gracefully: fix at this hour, revert at that one.

## Data Detective: Device or Parser?

Before accusing anyone again, I studied how to tell apart two suspects that constantly get mixed up: a broken tracker, or a broken parser.

The heuristics turned out simple and dependable:

- **Frozen GPS time**, identical across packets sent at different hours? That's the device. A parser is deterministic; it cannot freeze time.
- **Random location offsets**, sometimes ahead, sometimes behind, no pattern? That's GPS drift on the device.
- **Offsets consistent and exact**? Now the parser deserves suspicion.

Then I compared the same packet on the old and new systems: same time, same coordinates, same satellite count. One difference: speed. The old system read 9; mine read 66. Not the device. My parser. Proven on paper, not just by vibe hehe.

## The One Character That Moved the Car

The root cause finally surfaced, and it's my favorite part: the original PHP code read `startPosition =+ startRecord`.[^1] Yes, `=+`. In PHP that parses as a plain assignment with a unary plus. My hands, already growing used to Go, wrote it back as `+=`, which means add-and-assign.

One character of difference. The consequence: the IO-element read start shifted by a few bytes, so the parser "found" IO elements that weren't there, including IO-24 carrying the number 66. Parked cars everywhere got drafted into running without their consent hahaha.

The fix: one character, two files. Both commits landed that same day, alongside the band-aid's funeral. Weeks of forensic struggle, closed out by the difference between `=` and `+=` hehe.

## The Laundry: Returning 514,380 Rows

Correct code isn't enough. The data that had gone wrong also had to come home.

For the two contaminated weeks, I pulled archives from the old system, matched packet by packet, and corrected 514,380 location rows in the new system.[^2] The match rate was 100%: not a single row failed to return. And the old glitch was verified gone, at the same timestamps, 66 became 9.

This part isn't glamorous and appears in no tutorial: a migration isn't just about new code being right, it's also about cleaning up the wrong footprints the old code left behind. Data shouldn't leave the past in a broken state.

## Honestly, About the Word "Done"

This sprint was part of a three-month period that collected its payment from my mental health. That's a fact, and I'm writing it as it was.

And about the word "done": back then I declared it done with half-confident swagger, because parity verification wasn't 100%. And indeed, even as I write this episode, parser fixes still trickle in now and then. I've made peace with it: "done" is a spectrum, not a button. What matters isn't the claim; it's treating every new report as data, not as an insult hahaha.

## Lessons

1. **Porting binary code means one byte of difference = a different world.** Compare file by file; never generalize patterns across files that merely "look the same".
2. **Understand first, patch later.** A band-aid spread across nine files had to be reverted the same day. The cost wasn't the hours; it was the confidence.
3. **Pattern consistency is a detector.** Frozen = device, random = drift, exactly-consistent = suspect the parser.
4. **"Done" is a hypothesis until verified.** That's normal; what's not normal is stopping the verification.
5. **Migrations include old data.** Correct new code must be followed by cleanup of the wrong traces left behind.

Next episode we unpack the philosophy holding all the previous ones up: why "the old system is right", and what happens when an "improvement" has to be deleted by its own author. See you there.

Cheers.

[^1]: Code snippets are simplified; protocol and IO field names kept just enough to tell the story.

[^2]: Row and device counts are shown as measured at the time; other infrastructure scale stays undisclosed for anonymity.
