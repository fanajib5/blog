---
title: "Hijrah Backend (3): Porting Dozens of GPS Protocol Parsers Without Stopping the Fleet"
description: "Episode 3 of the Hijrah Backend series: a month of porting 21 binary GPS parsers, a parked car reading 66 km/h, a band-aid that lived less than a day, and the one character to blame."
author: "Faiq Najib Al-Aziz"
date: 2026-09-10T15:30:03+07:00
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

The vehicle was parked, its engine off, but the system read its speed as **66 km/h**. Satellites were healthy and data kept arriving. After a good while of head-scratching, the cause turned out to be a single character in the parser. One. Character. Hahaha.

## Rewind: January 2025

As I described in [episode one](/en/writing/2026/hijrah-backend-01/), the migration mandate was waiting before I was hired. One of its biggest tasks was rewriting the protocol parsers, the front door for all fleet data.

Picture this: dozens of GPS tracker types, each vendor speaking its own binary dialect, and the old system had one parser per dialect. My job was rewriting all of them in Go while the fleet kept transmitting every second. There was no "let's shut it down for tonight" window.

My routine throughout January 2025 was simple: read a PHP parser, write a Go parser, repeat. The office even bought me a premium AI subscription that was available at the time, to speed up the conversion.

The trail is still there. My first conversation with the mandate holder is timestamped January 2 at three in the afternoon, and it contains the project folder location. My first work message there asked to convert the first CodeIgniter file to Go. The sprint result is also recorded in the bosses' group chat: the listener conversion finished ten days ahead of schedule. Probably the only part of the mandate that finished early, hehe. I spent those nights rewriting 21 parser variants.

## The Luck Nobody Talks About

One big thing worked in my favor: the original PHP code was there to compare with every Go parser I wrote. So porting could be 1:1, no guessing from protocol specs.

The method was simple but needed patience: compare the GPS read offsets, the IO-element read structure (the starting position), and the branch counts, file by file. I checked all 21 variants one by one, not in one sweep and not with "ah, the pattern must be the same." That assumption nearly led me to the wrong fix.

## The Parked Car That Was Speeding

The symptom showed up later, in one parser family: trackers on a certain codec read 66 km/h while actually stationary. Only one field was off: speed.

My first theory sounded really reasonable. The parser had a branch overwriting the GPS-block speed with the value of IO element number 24. "Ah, IO-24 is overwriting it wrongly! Just remove the overwrite." So I removed it, across nine parsers at once, because "the pattern is the same". (Yes, that's the same assumption as before. I don't learn that fast.)

That patch lived less than a day. On re-checking, the overwrite branch was correct and the PHP version had it too. Removing it broke other cases, so I reverted it the same day. The commit history shows both the fix and the revert on the same day.

## Data Detective: Device or Parser?

Before guessing again, I first learned how to tell apart two possibilities that are easy to mix up: a faulty tracker or a faulty parser.

The heuristics turned out simple and dependable:

- **Frozen GPS time**, identical across packets sent at different hours? That's the device. A parser is deterministic, it can't freeze time.
- **Random location offsets**, sometimes ahead, sometimes behind, no pattern? That's GPS drift on the device.
- **Offsets consistent and exact**? Now the parser deserves suspicion.

Then I compared the same packet on the old and new systems: same time, same coordinates, same satellite count. Only one difference: speed. The old system read 9, mine read 66. Not the device, my parser. Proven on paper, not just by vibes hehe.

## The One Character That Moved the Car

The culprit was in the original PHP code: `startPosition =+ startRecord`.[^1] In PHP, `=+` is a regular assignment with a unary plus. My hands, already getting used to Go, quietly changed it to `+=`, which means add and assign.

One character of difference. The IO-element read start shifted by a few bytes, so the parser "found" IO elements at the wrong position, including IO-24 carrying the number 66. Parked cars seemed to be speeding off without their owners' permission.

The fix was one character in two files. That same day I committed the fix and reverted the band-aid. So all that long investigation ended at the difference between `=` and `+=`. Funny, and also makes you want to bang your head on the desk.

## The Laundry: Returning 514,380 Rows

Correct code alone isn't enough. The data that had gone wrong needed fixing too.

For the two contaminated weeks, I pulled archives from the old system, matched packet by packet, and corrected 514,380 location rows in the new system.[^2] The match rate was 100%: not a single row failed to come back. And the old glitch was verified gone, at the same timestamps, 66 became 9.

This part isn't glamorous and rarely makes it into a tutorial, but a migration isn't only about getting the new code right. Data that was already wrong has to be cleaned up too, it can't just be left there.

## Honestly, About the Word "Done"

This sprint was part of a three-month period that took a real toll on my mental health. I'm just writing it down as it happened.

Back then I declared the work done without full confidence, because parity verification wasn't 100%. Sure enough, parser fixes still come in now and then, even as I write this. I now treat "done" as a spectrum, not a button. Each new report is data to investigate.

## Notes I Took Home

1. **Porting binary code: one byte of difference = a different world.** Compare file by file, and don't carry patterns over between files that merely "look the same".
2. **Understand first, patch later.** A band-aid spread across nine files had to be reverted the same day. The cost wasn't the hours, it was the confidence.
3. **Consistent patterns are a detector.** Frozen = device, random = drift, exactly-consistent = suspect the parser.
4. **"Done" is a hypothesis until verified.** That's normal. What's not normal is stopping the verification.
5. **Migrations include old data.** Correct new code has to be followed by cleaning up the wrong traces left behind.

Episode four picks up a question raised here: when should the old code count as the reference, and what happens when I have to remove my own "improvement"?

[^1]: Code snippets are simplified; protocol and IO field names kept just enough to tell the story.

[^2]: Row and device counts are shown as measured at the time; other infrastructure scale stays undisclosed for anonymity.
