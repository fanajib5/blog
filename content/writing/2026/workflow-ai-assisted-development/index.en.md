---
title: "AI-Assisted Development Workflow: Kilo, Claude Code, and Friends"
description: "How I work alongside AI coding agents daily: not a feature review, but a real-world workflow with cross-session memory, receipt-driven verification, and lessons from confidently wrong AI."
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

Two incidents from my recent work sessions, both genuinely happened, both involving the same AI:

First: I asked the AI assistant to continue some content work. It worked diligently, putting together a roadmap, writing a master doc, and drafting the opening article for a series. Neat, convincing, and **a complete duplicate**: that draft article already existed, written the previous week, sitting quietly in a folder. The AI had no clue, because nothing preserved its memory.

Second: in an article covering GPS protocols, the AI wrote out sample packets from a "datasheet" with utter confidence: serial numbers, CRC values, all the way to a 16-digit IMEI (IMEIs have 15 digits; it couldn't even manage basic digit counting). Wrong byte order, wrong values, wrong length. And it stood by its answer until my test suite flatly rejected it. Only after brute-forcing every CRC variant against the original datasheet PDF did the correct answer emerge, from the exact same machine, once handed actual _receipts_ to verify against.

Those two incidents changed how I work with AI coding agents. My takeaway: **the output is only useful once I know how to check it.**

## What Changed in My Approach

I no longer treat AI as a _confident autocomplete_: accept its output, copy it, and move on. In my experience, it makes more sense to treat it as a **junior engineer who is very fast, widely read, and capable of being very sure while wrong**.

For me, an assistant like that is useful as long as I still review its work. As a backend developer, I used to write code and occasionally ask for a review; now **the AI writes and I verify**. My work has shifted from typing to reading, testing, and making decisions.

That is why I rely less on "prompt engineering" than on **verification**: writing tests, finding trustworthy sources, and checking whether a fluent answer is actually correct.

## My Daily Stack

Not a sponsored pitch, just context. Here is what actually lives on my workstation, and why each piece is there:

**CLI Agents (Kilo Code, Claude Code).** I find myself far more productive with an agent running in the terminal than an IDE plugin: it composes cleanly with `git`, `docker`, `psql`, and whatever local dev server is running. Every non-trivial task ends up in the shell; an agent living directly in the shell needs no bridge.

**Serena (MCP, semantic navigation).** In large Laravel or Go codebases, LSP helps me find symbol definitions and references directly. It is more precise than text search with grep, and the agent can read only the relevant symbols instead of loading many files into context.

**Memory server (per-project knowledge graph).** This is my answer to the first incident. I store architectural decisions, resolved incidents, and previously encountered traps in a per-project graph, then query it at the start of each task. Since then, I have repeated work far less often.

**Living documentation (context7).** Before writing code that uses a specific API version, I ask the agent to read the current documentation. This helps avoid answers that rely on an API that used to be correct.

**Thinking checkpoints (sequential thinking).** When debugging several interacting layers, such as a Dockerfile, reverse proxy, and environment variables, I use an explicit reasoning process that can be revised along the way. It does not make the AI smarter, but it helps me hold off on a conclusion until each layer has been checked.

## The Routine I Use

The [GPS Backend](/en/writing/2026/memahami-gps-protocol/) series on this blog gives me a concrete example: six technical articles with code written and verified alongside AI. While working on them, I used this routine:

1. **Plan first, generate second.** One roadmap and one master doc serve as the _single source of truth_. This map keeps each article aligned with the series, rather than merely looking good on its own.
2. **Consult memory before starting.** I review earlier decisions and failures so a new session does not repeat them. Relevant context is more useful than a lot of unrelated context.
3. **Verify means run, not read.** A strict rule: sample code must execute before it enters an article. The GT06 decoder was tested with 13 assertions against datasheet vectors. The TimescaleDB SQL ran inside a container populated with 155,000 rows. The WebSocket was benchmarked with 50 concurrent clients plus one intentionally sabotaged client. Those tests caught bugs that were _invisible_ upon code review (data races around `RLock`, off-by-one speed offsets, timeouts conflicting with heartbeat intervals).
4. **Log decisions upon completion.** I add what I learned to memory so the next session can continue from decisions already made.

Step 3 matters most to me. Code that has not been run is still a hypothesis, whoever wrote it.

## Patterns I Watch For

I see four patterns recur in my sessions, along with the ways I address them:

**Confident hallucinations.** The datasheet example above was wrong, but presented in a convincing format. For factual claims, I look for _receipts_: test vectors, source links, or reproducible machine outputs. "The AI said so" is not a source.

**Amnesia.** When a session lacks earlier context, it can repeat work that is already done. I save decisions in memory and track work status in the roadmap so I can see what has been completed.

**Yes-boss syndrome.** When a decision has consequences, I ask for several options and their trade-offs before choosing. That lets me assess the alternatives instead of simply accepting the first solution.

**Context bloat.** A large task is easier to handle when it is split into parts that can be checked one at a time. I use reference documents to keep those parts connected.

## So, Is This Cheating?

The question inevitably comes up: writing technical articles with AI assistance, is that cheating?

My stance: what matters is not who types the keys, but **who is responsible for the content**. I disclose that the GPS series was written with AI assistance because its claims can be checked: the CRC was brute-force verified, the SQL has `EXPLAIN ANALYZE` results, and the numbers come from actual tests. AI can be confidently wrong, but people can fall into the same trap when they rely on memory and skip verification.

If you want to start, choose one habit: **do not treat code as correct until it has been run**. Memory, documentation, and checkpoints help me, but they all start with being willing to check the output, even when an AI confidently writes a 16-digit IMEI.

## What's Next

I will follow up with another practical piece on AI: automating Google Apps Script with AI assistance for non-coding operational tasks. Follow along via [RSS](/en/writing/index.xml) or [reach out](/en/contact/) if there are specific AI workflows you would like to discuss.

## CTA

If you spot an error in the packet examples or test results, [contact me](/en/contact/). You can also subscribe via [RSS](/en/writing/index.xml) to follow future articles.
