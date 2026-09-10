---
title: "Hijrah Frontend (3): Type Chaos, Numbers, Empty Strings, and Pages with Different Opinions"
description: "Episode 3 of the Hijrah Frontend series: the same field sent as a number, an empty string, and a plain string depending on the page. About PHP that forgave, Go that didn't, and 194 measured scars."
author: "Faiq Najib Al-Aziz"
date: 2026-09-24T09:00:00+07:00
lastmod: 2026-09-11T03:15:00+07:00
draft: true
toc: true
comments: false
tags:
  - frontend
  - typescript
  - type-safety
  - story
series: "Hijrah Frontend"
---

One identical field, sent by three different pages, carrying three different beliefs about what it is. The first page sends a number. The second page, when empty, sends an empty string. The third sends a number wrapped in a string. All three lived in peace for years, until one day the receiver changed to a system that refuses to guess hehe~

This episode is about _type chaos_: how it was born without anyone's intent, why it survived for years, and its scars, still measurable in our repo today.

## The World That Forgave

Back then, the receiver of this story was PHP. And PHP, to data types, is the most forgiving friend one could ask for. Send `"123"`, it reads 123. Send `""`, it reads empty. Send `null`, it politely pretends not to see. For years, not a single page felt the need to think about types, because the language never made them an issue.

This world ran peacefully. Every page sent things its own way, the backend received with a smile, and life felt simple. What we didn't realize: the peace existed not because the system was healthy, but because the main witness never testified hehe~

## The Perfectionist Next Door

Then the backend moved to Go, and Go holds a very different view of types: **a type is a contract**. If the contract says number, what arrives must be a number; an empty string claiming to be a number gets turned away at the door, with a decoding error that is long and not funny.

That's when the chaos finally took shape. Not because Go created it; Go simply stopped forgiving it. Three beliefs that had lived in peace suddenly became three violations:

1. Got a value? Send a **number**. Empty? Send an **empty string**.[^2]
2. Another page for a similar function sends a **string**, straight from its core.
3. And no two pages ever sat down together to agree on any of it.

There are no villains in this story. Every page is consistent with itself, for its entire lifetime. The chaos is _emergent_: born from years of freedom, not from anyone's malice hahaha.

## The Measured Scars

My favorite part of this episode: the chaos isn't just tellable, it's countable.

When I swept through the new repo, one pattern stood out clearly: nearly two hundred `String()` calls scattered across the pages, plus twenty-something `Number()` calls.[^1] Some of them are on official duty; many more are **scars** from the chaos era: small safety nets installed so that values of unpredictable types could still be processed.

Those two hundred safety nets aren't wrong; they're silent heroes that kept the transition moving. But their presence is the most honest measurement of the problem: if data types were trusted, there wouldn't be two hundred spots feeling the need to guess hehe~

## Contracts, Not Guessing Games

The long-term fix isn't adding safety net number four hundred. It's changing the question: from _"what shape is this value today?"_ to _"what does the contract say?"_

One field, one promised type, honored by every page that sends it. The empty string claiming to be a number no longer gets rejected at the far end with an error; it gets rejected earlier, in a place that can explain itself politely. And that contract list became the most useful document the frontend had ignored for years: simple, written down, and ending all the debates hahaha.

## Lessons

1. **A forgiving language hides type debt.** It doesn't solve the problem; it defers it until the receiver changes.
2. **Chaos is emergent, not intentional.** Every page is locally correct; only the system as a whole is wrong.
3. **A strict receiver is a blessing, even when it feels like an intruder.** It forces the contract that should have existed from day one.
4. **Normalize at one door, don't scatter guards.** Two hundred scattered safety nets aren't architecture; they're installments.

Next episode we climb to the more visible layer: two UI libraries living side by side in one application, and naming that changed with every change of caretaker. See you there.

Cheers.

[^1]: Patterns and figures were measured directly from the repo as this episode was written; not every conversion call is a scar, and not every scar got counted.

[^2]: Endpoint details, field names, and error shapes are simplified; only the shape of the problem is preserved.
