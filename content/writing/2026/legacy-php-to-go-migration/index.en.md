---
title: "Migrating Legacy PHP to Go: Why, How, and Lessons Learned"
description: "Notes from converting a backend system from PHP (CodeIgniter 3 & Laravel) to Go — 370+ endpoints, 33 entities, and 194K lines of code migrated incrementally."
author: "Faiq Najib"
date: 2026-04-15
lastmod: 2026-04-15
draft: false
toc: true
comments: false
tags:
  - go
  - php
  - architecture
  - migration
---

I've been in a position where a PHP codebase had grown beyond its limits — new features were harder to add, bugs appeared more frequently, and every deployment felt like flipping a coin. Not because PHP is bad, but because a system built over years without clear architecture eventually becomes its own worst enemy.

So, this article isn't a "_Go is better than PHP_" or "_PHP is dead_" rant. Nope. This is a field notes from my experience migrating a backend system from PHP (CodeIgniter 3 and Laravel) to Go, based on an actual project I worked on.

## The Problem Isn't the Language, It's the Architecture

The system I handled looked like this:

- **370+ API endpoints** — yes, not a typo
- **33 database entities** with complex relationships
- **~194,000 lines** of PHP code mixing CodeIgniter 3 and Laravel
- Testing? Well... let's just say the coverage was _best left undiscussed_ hehe

The real problem wasn't the programming language. The problems were:

1. **No layer separation** — controllers querying the database directly, business logic mixed with presentation logic
2. **Hard to test** — tightly coupled code made unit testing a nightmare
3. **Declining developer experience** — onboarding new developers took longer, bug fixes carried more risk

Bottom line: this system didn't just need a language change — it needed a **re-architecture**.

## Why Go?

If you ask why not just refactor in PHP, the answer: **absolutely possible**. But in this case, there were reasons Go was the better fit:

### 1. Type Safety Saves Debug Time

PHP is dynamically typed, meaning many bugs only surface at runtime. Go's static typing catches errors at compile time. Simple concept, huge impact — bugs that used to appear in production now get caught during build.

### 2. Concurrency for Free

This system handles many simultaneous requests — from real-time GPS tracking to report generation. Goroutines in Go make concurrent programming significantly simpler compared to other approaches I've tried.

### 3. Clean Deployment

One binary. No dependency hell, no `composer install` on the server, no PHP version conflicts. Build locally, deploy one file. Done.

### 4. Measurable Performance

It's not about benchmark numbers — it's about **predictable resource usage**. Go's consistent memory usage makes capacity planning much easier.

Not that Go is perfect — its error handling is verbose (all those `if err != nil`... well, you get used to it), and the ecosystem is smaller than PHP's. But for this use case, the trade-offs were worth it.

## Migration Approach: Per-Module, Not Big Bang

One of the biggest mistakes in migration is "_let's rewrite everything from scratch_." I've heard horror stories about teams spending 2 years on a big-bang rewrite and... never finishing.

The approach I used:

### 1. Module Mapping

First, map all endpoints and entities into clear modules. From 370+ endpoints, I grouped them into several domains: authentication, tracking, reporting, user management, and so on.

### 2. Service–Repository Pattern

Each module was designed using the **service–repository** pattern:

- **Repository layer** — responsible for data access (database queries)
- **Service layer** — contains business logic, calls the repository

Why separate them? Because with this separation:

- Repositories can be mocked when testing services
- Business logic can be tested without a database
- Adding features doesn't break other parts

### 3. One Endpoint at a Time

The process was roughly:

1. Take one endpoint from PHP
2. Write test cases based on existing behavior
3. Implement in Go using the service–repository pattern
4. Test until passing
5. Deploy and monitor
6. Repeat

Yes, it's slow. But **predictable**. Each migrated endpoint is incremental, measurable progress.

## Measurable Results

Some numbers from this project:

- **370+ endpoints** successfully migrated
- **33 entities** converted from MySQL to PostgreSQL
- **194K+ lines** of PHP transformed into a cleaner Go architecture
- **More consistent response times** — no more unexpected spikes
- **Test coverage increased significantly** — from almost nothing to a respectable number
- **Faster developer onboarding** — clear code structure lets new developers contribute sooner

The unmeasurable but very real benefit: **peace of mind during deployment**. No more "hope nothing breaks this time" feeling.

## Lessons Learned

A few things I learned from this process:

### 1. Understand the Existing System First

Before writing a single line of Go code, I spent considerable time understanding the behavior of the existing system. Not just reading the code — understanding **why** certain decisions were made. Sometimes, code that looks "weird" has a perfectly reasonable explanation in its original context.

### 2. Big Bang Rewrite Is a Trap

_If you can do it incrementally, why go all at once?_ The incremental approach feels slow, but the risk is much lower. Every successfully migrated endpoint is progress you can show to stakeholders.

### 3. Test First, Then Migrate

Writing tests for legacy systems is boring, right? But tests are the **safety net** ensuring the system behaves the same after migration. Without tests, you're not migrating — you're gambling.

### 4. Don't Prematurely Optimize

I was initially tempted to jump straight into microservices, message queues, and fancy architecture. But reality check: a system without stable architecture doesn't need microservices — it needs **a solid foundation**. A well-structured monolith beats chaotic microservices any day.

## Closing Thoughts

Migrating from PHP to Go isn't about "_language A is better than language B_." It's about **choosing the right tool for the problem at hand** — and in this case, Go with its static typing, concurrency model, and deployment simplicity was the right choice.

If you have a legacy system that's becoming unwieldy and want to discuss the right migration approach, [get in touch](/en/contact/). Or check out my [services](/en/services/) to see how I can help.

---

_Tags: [go](/en/tags/go/) · [php](/en/tags/php/) · [architecture](/en/tags/architecture/) · [migration](/en/tags/migration/)_
