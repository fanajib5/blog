---
title: "Hijrah Backend (3): Porting Dozens of GPS Protocol Parsers Without Stopping the Fleet"
description: "Episode 3 of the Hijrah Backend series: a one-month sprint porting 21 binary GPS parsers, a parked car reading 66 km/h, a band-aid that lived less than a day, and the single character that fixed it all."
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

The vehicle was parked, its engine off, but the system read its speed as **66 km/h**. Satellites were healthy and data kept arriving. It took me a while to find that a single character in the parser explained the number.

## Rewind: January 2025

As I described in [episode one](/en/writing/2026/hijrah-backend-01/), the migration mandate was waiting before I was hired. One of its biggest tasks was rewriting the protocol parsers, the front door for all fleet data.

It looked like this: dozens of GPS tracker types, each vendor speaking its own binary dialect, and the old system had one parser per dialect. My job was rewriting all of them in Go while the fleet kept transmitting every second. There was no "let's shut it down for tonight" window.

My routine throughout January 2025 was simple: read a PHP parser, write a Go parser, repeat. The office even bought me a premium AI subscription available at the time to speed up the conversion.

The trail is still there: my first conversation with the mandate holder is timestamped January 2 at three in the afternoon, and contains the project folder location. My first work message there asked to convert the first CodeIgniter file to Go. The sprint result is also recorded in the bosses' group chat: the listener conversion finished ten days ahead of schedule. It may have been the only part of the mandate to finish early. I spent those nights rewriting 21 parser variants.

## The Luck Nobody Talks About

One thing worked in my favor: I had the original PHP code to compare with every Go parser I wrote. Porting could be a 1:1 exercise instead of guesswork from protocol specs.

The method was simple but required care: compare the GPS read offsets, the IO-element read structure (the starting position), and the branch counts, file by file. I checked all 21 variants individually, not in one sweep or by assuming "the pattern is probably the same." That assumption nearly led me to the wrong fix.

## The Parked Car That Was Speeding

The symptom surfaced later, in one parser family: trackers on a certain codec read 66 km/h while actually stationary. One field: speed.

My first theory sounded very reasonable. The parser had a branch overwriting the GPS-block speed with the value of IO element number 24. "Ah, IO-24 is overwriting it wrongly! Just remove the overwrite." So I removed it, across nine parsers at once, because "the pattern is the same".

That patch survived less than a day. On re-checking, the overwrite branch was correct and the PHP version had it too. Removing it broke other cases, so I reverted the patch the same day. The commit history records both the fix and its reversal.

## Data Detective: Device or Parser?

Before guessing again, I studied how to distinguish two possibilities that are easy to mix up: a faulty tracker or a faulty parser.

The heuristics turned out simple and dependable:

- **Frozen GPS time**, identical across packets sent at different hours? That's the device. A parser is deterministic; it cannot freeze time.
- **Random location offsets**, sometimes ahead, sometimes behind, no pattern? That's GPS drift on the device.
- **Offsets consistent and exact**? Now the parser deserves suspicion.

Then I compared the same packet on the old and new systems: same time, same coordinates, same satellite count. One difference: speed. The old system read 9; mine read 66. Not the device. My parser. Proven on paper, not just by vibe hehe.

## The One Character That Moved the Car

The root cause was in the original PHP code: `startPosition =+ startRecord`.[^1] In PHP, `=+` is a regular assignment with a unary plus. My hands, getting used to Go, changed it to `+=`, which means add and assign.

One character made the difference. The IO-element read start shifted by a few bytes, so the parser "found" IO elements at the wrong position, including IO-24 carrying the number 66. Parked cars seemed to be sent speeding without their owners' permission.

The fix was one character across two files. That same day, I committed the fix and reverted the band-aid. The investigation had narrowed down to the difference between `=` and `+=`.

## The Laundry: Returning 514,380 Rows

Correct code isn't enough. The data that had gone wrong also had to come home.

For the two contaminated weeks, I pulled archives from the old system, matched packet by packet, and corrected 514,380 location rows in the new system.[^2] The match rate was 100%: not a single row failed to return. And the old glitch was verified gone, at the same timestamps, 66 became 9.

This part isn't glamorous and rarely makes it into a tutorial: a migration isn't only about getting the new code right; it also means cleaning up data that was already wrong. Old data can't simply be left that way.

## Honestly, About the Word "Done"

This sprint was part of a three-month period that affected my mental health. I'm writing that down as it happened.

Back then I declared the work done without much confidence because parity verification wasn't 100%. Sure enough, parser fixes still come in now and then, even as I write this episode. I now think of "done" as a spectrum, not a button. Each new report is data to investigate.

## Lessons

1. **Porting binary code means one byte of difference = a different world.** Compare file by file; never generalize patterns across files that merely "look the same".
2. **Understand first, patch later.** A band-aid spread across nine files had to be reverted the same day. The cost wasn't the hours; it was the confidence.
3. **Pattern consistency is a detector.** Frozen = device, random = drift, exactly-consistent = suspect the parser.
4. **"Done" is a hypothesis until verified.** That's normal; what's not normal is stopping the verification.
5. **Migrations include old data.** Correct new code must be followed by cleanup of the wrong traces left behind.

Episode four picks up a question raised here: when should the old code be treated as the reference, and what happens when I have to remove my own "improvement"?

[^1]: Code snippets are simplified; protocol and IO field names kept just enough to tell the story.

[^2]: Row and device counts are shown as measured at the time; other infrastructure scale stays undisclosed for anonymity.
