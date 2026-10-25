---
title: "Migrating Legacy PHP to Go: Why, How, and Lessons Learned"
description: "Notes from converting a backend system from PHP (CodeIgniter 3 & Laravel) to Go, 370+ endpoints, 33 entities, and 194K lines of code migrated incrementally."
author: "Faiq Najib Al-Aziz"
date: 2026-04-04
lastmod: 2026-09-11T09:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - php
  - architecture
  - migration
---

The PHP codebase I worked on had become difficult to maintain. New features were harder to add, bugs appeared more often, and every deployment felt like flipping a coin. The problem wasn't PHP. The system had grown for years without a clear architecture. One day, I had to roll back three times after what should have been a simple deploy. It was a stressful afternoon.

This isn't an argument that "_Go is better than PHP_" or "_PHP is dead_." It's an account of a project where I migrated a backend system from PHP (CodeIgniter 3 and Laravel) to Go. This isn't a tutorial or a call for everyone to switch languages. I hope my experience, including the mistakes, helps someone facing a similar situation.

## The Problem Isn't the Language, It's the Architecture

The system I handled looked like this:

- **370+ API endpoints**[^1]
- **33 database entities with complex relationships**
- **~194,000 lines** of PHP code across CodeIgniter 3 and Laravel
- Testing existed, but coverage was very low.

The real problem wasn't the programming language. PHP is actually fine. The problems were:

1. **No layer separation**: controllers queried the database directly, and business logic was mixed with presentation logic. Like fried rice with everything mixed in, it was hard to tell where one concern ended and another began.
2. **Hard to test**: tightly coupled code made unit testing difficult. To test one function, I had to set up a database, mock three dependencies, and hope it worked.
3. **Declining developer experience**: onboarding new developers took longer, and bug fixes carried more risk. One new developer said, _"So... this is an... interesting architecture."_ In other words, chaotic.

The system needed more than a language change. Its architecture needed to be reworked, too.

## Why Go?

If you ask why not just refactor in PHP, the answer is **absolutely possible**. In this case, though, Go was a better fit for several reasons, not simply because of the hype.

### 1. Type Safety Saves Debug Time

PHP is dynamically typed[^2], so many bugs only surface at runtime. Go's static typing can catch type-related errors at compile time, before they reach production.

### 2. Concurrency for Free

This system handles many simultaneous requests, from real-time GPS tracking to report generation. Compared with other approaches I've tried, goroutines make concurrent programming much simpler. The first time I used them, I thought, _"Wait, it's really this simple?"_

### 3. Clean Deployment

Go produces one binary. There is no `composer install` on the server and no PHP version conflict to worry about. PHP deployments meant checking that composer dependencies were installed, the PHP version matched, and the required extensions were available. Now I build locally and use `scp` to send one file.

### 4. Measurable Performance

I wasn't focused on benchmark numbers, but on **predictable resource usage**. Go's consistent memory usage makes capacity planning easier. The old PHP system could have unexplained memory spikes. Now memory usage is flatter and more predictable.

Go isn't perfect. Its error handling is verbose (all those `if err != nil`)[^3], and its ecosystem is smaller than PHP's. For this use case, the trade-offs were worth it.

## Migration Approach: Per-Module, Not Big Bang

One risk in a migration is deciding to rewrite everything at once. I've heard about a team that spent two years on a big-bang rewrite and never finished. The reasons varied: burnout, scope creep, or business requirements that changed along the way.

The approach I used:

### 1. Module Mapping

First, I mapped all endpoints and entities to clear modules. I grouped the 370+ endpoints into domains such as authentication, tracking, reporting, and user management. Building a spreadsheet to map them took a few days. It was tedious, but it helped with the work that followed.

### 2. Service–Repository Pattern

Each module was designed using the **service–repository** pattern:

- **Repository layer**: responsible for data access (database queries)
- **Service layer**: contains business logic, calls the repository

The separation meant:

- Repositories can be mocked when testing services
- Business logic can be tested without a database
- Adding features doesn't break other parts

Clear layers give each part its own responsibility. The pattern felt like over-engineering at first, but after a few months it proved useful.

### 3. One Endpoint at a Time

The process was roughly:

1. Take one endpoint from PHP
2. Write test cases based on existing behavior[^4]
3. Implement in Go using the service–repository pattern
4. Test until passing
5. Deploy and monitor
6. Repeat

The process is slow, but **predictable**. Each migrated endpoint is measurable progress that stakeholders can see. _"This week we migrated 5 endpoints"_ is clearer than saying _"we're still working on the migration"_ for months without visible results.

## Measurable Results

Some numbers from this project:

- **370+ endpoints** successfully migrated
- **33 entities** converted from MySQL to PostgreSQL[^5]
- **194K+ lines** of PHP transformed into a cleaner Go architecture
- **More consistent response times**: no more unexpected spikes
- **Test coverage increased significantly**: from almost nothing to a respectable number
- **Faster developer onboarding**: clear code structure lets new developers contribute sooner

One benefit that doesn't show up in the numbers is a calmer deployment process. I no longer go into a deploy hoping nothing breaks. It can still be nerve-wracking, but it doesn't keep me up at night.

## Lessons Learned

This process taught me a few things:

### 1. Understand the Existing System First

Before writing Go code, I spent time understanding the behavior of the existing system. I didn't just read the code; I tried to understand **why** certain decisions had been made. Code that looks "weird" can make sense in its original context. Don't assume legacy code is bad. There may have been a constraint behind the decision.

### 2. Big Bang Rewrite Is a Trap

_If you can do it incrementally, why go all at once?_ The incremental approach feels slow, but the risk is lower. Each migrated endpoint is progress you can show stakeholders, and the system keeps running throughout the process.

### 3. Test First, Then Migrate

Writing tests for a legacy system can be tedious, but they are the **safety net** that helps ensure the system behaves the same after migration. Without tests, you risk changing behavior that users already depend on.

### 4. Don't Prematurely Optimize

I was tempted to jump straight into microservices, message queues, and more elaborate architecture. But a system without a stable architecture needs **a solid foundation**, not microservices. A well-structured monolith is better than chaotic microservices. KISS (_Keep It Simple, Stupid_)[^6] is still a useful principle.

## Closing Thoughts

Migrating from PHP to Go isn't about "_language A is better than language B_." It's about **choosing a tool that fits the problem**. For this project, Go's static typing, concurrency model, and simpler deployment made it the right choice.

Does every PHP system need to move to Go? _Not at all_. If your system runs well, its architecture is clear, and your team is comfortable with PHP, there is no reason to switch just because of hype. Migrate when there is clear business value and a measurable benefit.

If the legacy system you work on is becoming difficult to maintain and you'd like to discuss a migration approach, [get in touch](/en/contact/). You can also learn more about my [services](/en/services/).

[^1]: I seriously double-checked that number the first time I counted. Turns out, yes, that many hahaha.

[^2]: PHP 7+ does have type hints and strict types, but it's still not as strict as Go which is statically typed from the ground up.

[^3]: In the early days of using Go, I was genuinely annoyed by all the `if err != nil`. But after getting used to it, you just accept it. Besides, verbose but clear beats concise but hidden error handling any day.

[^4]: Writing tests based on existing behavior is important. The last thing you want is the migration accidentally changing behavior that users already depend on.

[^5]: The MySQL to PostgreSQL migration is a whole story on its own. Maybe I'll write about it someday hehe.

[^6]: Keep It Simple, Stupid, a principle that often gets forgotten when we get too excited about new technology.

---

_Tags: [go](/en/tags/go/) · [php](/en/tags/php/) · [architecture](/en/tags/architecture/) · [migration](/en/tags/migration/)_
