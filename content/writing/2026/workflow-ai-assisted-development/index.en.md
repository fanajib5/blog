---
title: "AI-Assisted Development Workflow: Kilo, Claude Code, and Friends"
description: "How I work alongside AI coding agents daily: not a feature review, but a real-world workflow with cross-session memory, receipt-driven verification, and lessons from confidently wrong AI."
author: "Faiq Najib Al-Aziz"
date: 2026-10-13
lastmod: 2026-10-13
draft: true
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

Those two stories are two sides of the same coin, and this post is about the coin itself: **how to work with AI coding agents without becoming a casualty of their own strengths.**

## Shifting the Mental Model

The wrong way to use AI: treating it as a _confident autocomplete_, accepting its output, copy-pasting, and moving on. The right way, in my experience: treat it as a **junior engineer who is blazingly fast, extraordinarily well-read, and structurally overconfident**.

A junior like that is immensely valuable if you are a senior willing to do the review. And that fundamentally shifts my job as a backend developer: I used to write code and occasionally ask for a review; now **the AI writes and I verify**. My working hours have shifted from typing to reading, testing, and making decisions.

The practical consequence: the skill gaining the most value is not "prompt engineering", it is **verification**. The ability to write tests that cannot be fooled, track down authoritative sources, and spot when a fluent answer is completely hollow.

## My Daily Stack

Not a sponsored pitch, just context. Here is what actually lives on my workstation, and why each piece is there:

**CLI Agents (Kilo Code, Claude Code).** I find myself far more productive with an agent running in the terminal than an IDE plugin: it composes cleanly with `git`, `docker`, `psql`, and whatever local dev server is running. Every non-trivial task ends up in the shell; an agent living directly in the shell needs no bridge.

**Serena (MCP, semantic navigation).** For large Laravel or Go codebases, finding definitions and symbol references via LSP is far more precise than plain grep, and vastly more economical on the _context window_. An agent reading 3 targeted symbols performs significantly better than one ingesting 3 entire files.

**Memory server (per-project knowledge graph).** This is the answer to the first incident above. AI has no native cross-session memory, so I gave it one: architectural decisions, resolved incidents, and traps previously encountered are stored as a per-project graph and queried at the start of each task. Since introducing this protocol, "rewriting what already exists" has practically vanished.

**Living documentation (context7).** Framework APIs move faster than model training cutoffs. Before writing code touching version-specific APIs, I direct the agent to fetch up-to-date documentation. The subtlest hallucination is an API that used to be correct _in the past_.

**Thinking checkpoints (sequential thinking).** For multi-layer debugging (a Dockerfile clashing with a reverse proxy clashing with environment variables), I enforce an explicit reasoning chain that can be revised mid-stream. It does not make the AI smarter; it simply makes it harder for the model to jump to reckless conclusions.

## A Proven Workflow (and Why It Works)

The [GPS Backend](/en/writing/2026/memahami-gps-protocol/) series running on this blog serves as the clearest benchmark for this workflow: six technical deep-dives, with all code written and verified collaboratively alongside the AI. The pattern looks like this:

1. **Plan first, generate second.** One roadmap document plus one master doc acting as the _single source of truth_. An AI working without a map produces scattered output that looks great in isolation but falls apart as a whole.
2. **Consult memory before starting.** Review past decisions and prior failures. Fifty thousand well-targeted context tokens easily outperform five million noisy ones.
3. **Verify means run, not read.** A strict rule: sample code must execute before it enters an article. The GT06 decoder was tested with 13 assertions against datasheet vectors. The TimescaleDB SQL ran inside a container populated with 155,000 rows. The WebSocket was benchmarked with 50 concurrent clients plus one intentionally sabotaged client. The results were telling: bugs that were _invisible_ upon code review (data races around `RLock`, off-by-one speed offsets, timeouts conflicting with heartbeat intervals) were all caught simply because the code was executed.
4. **Log decisions upon completion.** Lessons learned flow straight back into memory. The next session picks up right here, rather than starting from scratch.

Pay attention to step 3. That is the core of everything. Unexecuted code is merely a hypothesis, regardless of who authored it, human or machine.

## AI Failure Modes (and Mitigations)

Four recurring failure patterns I encounter most:

**Confident hallucinations.** The datasheet incident earlier is the most dangerous variety: wrong yet fluent, wrapped in polished formatting. Mitigation: factual claims must bring _receipts_: test vectors, source links, or reproducible machine outputs. "The AI said so" is never an acceptable source.

**Amnesia.** Without external memory, every session starts from a blank slate, endlessly duplicating work. Mitigation: memory protocols alongside status files (roadmaps tracking item-level status). It is cheap, and it transforms the AI from a guesser into a successor.

**Yes-boss syndrome.** Ask for a solution, and it hands you one, even when five distinct approaches exist with conflicting trade-offs. Mitigation: demand alternatives and their respective trade-offs before executing, especially for architectural choices. A great agent pushes back with options, rather than quietly conforming to a single path.

**Context bloat.** Shoveling a massive problem all at once degrades generation quality silently along the way. Mitigation: decompose into atomic tasks backed by SSoT documents, exactly the way we break down an epic into tickets, for the exact same reason.

## So, Is This Cheating?

The question inevitably comes up: writing technical articles with AI assistance, is that cheating?

My stance: what matters is not who types the keys, but **who owns the responsibility for the answers**. The GPS series was written with AI assistance, and I disclose it openly, because every claim can be audited: the CRC was brute-force verified, the SQL queries have `EXPLAIN ANALYZE` metrics, and the numbers reflect actual benchmarks. If anything, this workflow raises the bar higher than writing purely from memory (remember the second story? the AI was the one being confidently wrong, but the exact same trap catches humans who skip verification).

If you want to adopt this approach, begin with just one discipline: **refuse to settle until the code actually runs**. Everything else (memory, living docs, reasoning checkpoints) will follow naturally once you catch an AI drafting a 16-digit IMEI with a straight face.

## What's Next

I will follow up with another practical piece on AI: automating Google Apps Script with AI assistance for non-coding operational tasks. Follow along via [RSS](/en/writing/index.xml) or [reach out](/en/contact/) if there are specific AI workflows you would like to discuss.

## CTA

Share this article if you found it useful. For further discussion, visit [Contact](/en/contact/) or subscribe via [RSS](/en/writing/index.xml).
