---
title: "AI-Assisted Development Workflow: Kilo, Claude Code, and Friends"
description: "How I work alongside AI coding agents day to day: cross-session memory, receipt-style verification, and lessons from an AI that was confident and wrong."
author: "Faiq Najib Al-Aziz"
date: 2026-10-13
lastmod: 2026-10-13
draft: false
toc: true
comments: true
images:
  - og.png
tags:
  - ai
  - tools
  - workflow
  - productivity
pillar: "ai-dev"
---

Two things happened in my recent work sessions. Both really happened, and both involved the same AI.

First: I asked the AI assistant to continue some content work. It worked diligently, putting together a roadmap, writing a master doc, and drafting the opening article for a series. Neat, convincing, and **a complete duplicate**. That draft article already existed, I'd written it the previous week, and it was sitting quietly in a folder. The AI had no clue, because nothing reminded it.

Second: in an article about GPS protocols, the AI wrote out sample packets from a "datasheet" with total confidence: serial numbers, CRC values, even a 16-digit IMEI (IMEIs have 15 digits, it couldn't even count digits hahaha). Wrong byte order, wrong values, wrong length. And it would keep defending them until my test code flatly rejected them. Only after I brute-forced every CRC variant against the original datasheet PDF did the same machine give the right answer, and even then only after being handed _receipts_ to verify against.

Those two incidents changed how I work with AI coding agents. The gist: **the output is only useful once I know how to check it.**

## What Changed in My Approach

I no longer treat AI as a _confident autocomplete_: accept the output, copy it, move on. In my experience, it makes more sense to think of it as a **junior engineer who is very fast, reads a lot, and can be extremely sure while being wrong**.

For me, an assistant like that is useful as long as I still review its work. As a backend developer, I used to write code and occasionally ask for a review. Now **the AI writes and I verify**. My job shifted from typing to reading, testing, and deciding.

That's why what I rely on most isn't "prompt engineering" but **verification**: writing tests, finding trustworthy sources, and checking whether a fluent-sounding answer is actually right.

## My Daily Stack

Not an ad, just context. Here's what's actually installed on my work machine, and why:

**CLI Agents (Kilo Code, Claude Code).** I'm more productive with an agent in the terminal than with an IDE plugin. It composes with `git`, `docker`, `psql`, and whatever dev server is running. Every non-trivial task ends up in the shell anyway, so an agent that lives in the shell needs no bridge.

**Serena (MCP, semantic navigation).** In big Laravel or Go codebases, LSP helps me find symbol definitions and references directly. It's more precise than text search with grep, and the agent only reads the relevant symbols instead of loading lots of files into context.

**Memory server (per-project knowledge graph).** This is my answer to the first incident. Architectural decisions, resolved incidents, and traps I've run into get stored as a per-project graph, and I query it at the start of each task. Since then I repeat existing work far less often.

**Living documentation (context7).** Before writing code that touches a specific API version, I tell the agent to read the current docs. It helps avoid answers that use an API that _used to be_ correct.

**Thinking checkpoints (sequential thinking).** When debugging several interacting layers, like a Dockerfile, reverse proxy, and environment variables, I use an explicit reasoning process that can be revised along the way. The AI doesn't get smarter, but I get to hold off on a conclusion until each layer has been checked.

## The Routine I Use

The [GPS Backend](/en/writing/2026/memahami-gps-protocol/) series on this blog is the concrete example: six technical articles with code written and verified alongside AI. While working on them, my routine went like this:

1. **Plan first, generate second.** One roadmap and one master doc serve as the _single source of truth_. This map keeps each article in line with the series, not just looking good on its own.
2. **Check memory before starting.** I review earlier decisions and failures so a new session doesn't repeat them. Well-aimed context beats lots of random context.
3. **Verifying means running, not reading.** A strict rule: sample code must execute before it goes into an article. The GT06 decoder was tested with 13 assertions against datasheet vectors. The TimescaleDB SQL ran in a container with 155,000 rows. The WebSocket was tested with 50 concurrent clients plus one intentionally sabotaged client. Those tests caught bugs that are _invisible_ when you only read the code (a data race around `RLock`, an off-by-one speed offset, a timeout colliding with the heartbeat interval).
4. **Log decisions when done.** I put what I learned into memory so the next session can continue from decisions already made.

Step 3 matters most to me. Code that hasn't been run is still a hypothesis, whoever wrote it.

## Patterns I Watch For

Four patterns keep recurring in my sessions, and here's how I deal with them:

**Confident hallucinations.** The datasheet example above was wrong, but presented in a convincing format. For factual claims, I look for _receipts_: test vectors, source links, or reproducible machine output. "The AI said so" is not a source.

**Amnesia.** When a session doesn't carry earlier context, finished work can get repeated. I save decisions in memory and track work status in the roadmap so I can see what's already done.

**Yes-boss syndrome.** When a decision has consequences, I ask for a few options with their trade-offs before choosing. That way I can judge the alternatives instead of just accepting the first solution.

**Overstuffed context.** A big task is easier to handle when it's split into parts that can be checked one at a time. I use reference documents to keep the parts connected.

## So, Is This Cheating?

The question is bound to come up: writing articles with AI help, is that cheating?

My view: what matters isn't who types, but **who is responsible for the content**. I'm upfront that the GPS series was written with AI help because its claims can be checked: the CRC was verified by brute force, the SQL has `EXPLAIN ANALYZE` results, and the numbers come from real tests. AI can be confidently wrong, but people can fall into the same trap when they rely on memory and skip verification.

If you want to start, pick just one habit: **don't treat code as correct until you've run it**. Memory, docs, and checkpoints help my work, but it all starts with being willing to check the output, even when an AI confidently writes a 16-digit IMEI.

## What's Next

I plan to write a follow-up on AI practice: automating Google Apps Script with AI help for non-coding operational work. Follow along via [RSS](/en/writing/index.xml) or [reach out](/en/contact/) if there's an AI workflow you'd like to ask about.

## CTA

If you spot an error in the packet examples or test results, [contact me](/en/contact/). You're also welcome to subscribe via [RSS](/en/writing/index.xml) to follow future posts.
