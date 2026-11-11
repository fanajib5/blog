---
title: "Hijrah Frontend (3): Type Chaos, Numbers, Empty Strings, and Pages with Different Opinions"
description: "Episode 3 of Hijrah Frontend: the same field sent as a number, an empty string, or a plain string. PHP used to forgive it, Go did not, and I found 194 traces."
author: "Faiq Najib Al-Aziz"
date: 2026-09-23T09:00:03+07:00
lastmod: 2026-09-23T21:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - frontend
  - typescript
  - type-safety
  - story
series: "Hijrah Frontend"
---

Three pages sent the same field in different ways. One sent a number, another sent an empty string when there was no value, and the third wrapped a number in a string. These habits lasted for years, until the receiver changed to a system that would not guess.

That is how _type chaos_ showed up. Nobody planned it, but I can still count the traces in our repo.

## PHP Used to Let It Slide

Back then the receiver was PHP, a very forgiving language when it comes to data types. Send `"123"`, and it reads 123. Send `""`, and it treats it as empty. Send `null`, and it acts as though it didn't see it. For years, the pages didn't need to think much about types because the language didn't make an issue of them.

Each page sent things its own way, the backend accepted them, and life felt simple. Later I realized that quiet did not mean the system was healthy. The receiver just never complained.

## Then Go Showed Up

Then the backend moved to Go, which sees types differently: **a type is a contract**. If the contract says number, a number must arrive. An empty string claiming to be a number gets turned away at the door, along with a long and thoroughly unfunny decoding error.

Go didn't create the chaos; it simply stopped forgiving it. Three habits that had never caused trouble suddenly became violations:

1. Got a value? Send a **number**. Empty? Send an **empty string**.[^2]
2. Another page for a similar function sends a **string**, straight from its core.
3. And no two pages ever sat down together to agree on any of it.

There are no villains here. Each page is consistent in its own way. The _chaos_ built up over years; nobody set out to create it.

## I Could Count the Scars

The interesting part is that this chaos isn't just something you can describe. You can count it, too.

As I went through the new repo, I found nearly two hundred `String()` calls scattered across the pages, plus more than twenty `Number()` calls.[^1] Some serve a real purpose. Others are **scars** from the chaos era: little safety nets that let values of uncertain types keep moving.

The safety nets are not wrong. They helped keep the transition moving. But their number is a clue too: if the data types were trustworthy, there would not be so many places that had to guess.

## Let's Make the Contract Clear

The long-term fix isn't adding a 400th safety net. We need to change the question from _"what shape is this value today?"_ to _"what does the contract say?"_

One field, one promised type, followed by every page that sends it. An empty string claiming to be a number can be rejected earlier, somewhere that can explain the problem. A simple written list of contracts could settle debates the frontend had left open for years.

## What I'm Taking Away

What I have learned is that a forgiving language can hide type debt until the receiver changes. Each page may make sense by itself, while the whole system does not. The contract needs to be written down, and normalization should happen at one boundary. Scattered safety nets help, but they are not the end goal.

Those nearly two hundred conversion calls are not all problems, but enough of them hint at uncertainty about types. Next episode I will look at a more visible inheritance: two UI libraries and two eras of naming in one application.

[^1]: Patterns and figures were measured directly from the repo as this episode was written; not every conversion call is a scar, and not every scar got counted.

[^2]: Endpoint details, field names, and error shapes are simplified; only the shape of the problem is preserved.
