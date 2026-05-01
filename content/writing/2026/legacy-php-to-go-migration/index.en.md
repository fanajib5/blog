---
title: "Migrating Legacy PHP to Go: Why, How, and Lessons Learned"
description: "Notes from converting a backend system from PHP (CodeIgniter 3 & Laravel) to Go, 370+ endpoints, 33 entities, and 194K lines of code migrated incrementally."
author: "Faiq Najib"
date: 2026-04-04
lastmod: 2026-04-04
draft: false
toc: true
comments: false
tags:
  - go
  - php
  - architecture
  - migration
---

I've been in a position where a PHP codebase had grown beyond its limits, new features were harder to add, bugs appeared more frequently, and every deployment felt like flipping a coin. Not because PHP is bad, but because a system built over years without clear architecture eventually becomes its own worst enemy. I remember one day having to rollback three times in a single afternoon because of a "simple" deploy. My stress level that day... yeah, let's not go there hahaha.

_So anyway_, this article isn't a "_Go is better than PHP_" or "_PHP is dead_" rant. Nope. These are field notes from my experience migrating a backend system from PHP (CodeIgniter 3 and Laravel) to Go, based on an actual project I worked on. Not a tutorial, not propaganda either. Just personal notes, maybe someone out there is going through something similar and can learn from my mistakes hehe~

## The Problem Isn't the Language, It's the Architecture

The system I handled looked like this:

- **370+ API endpoints**: yes, not a typo[^1]
- **33 database entities** with complex relationships
- **~194,000 lines** of PHP code ~~lovingly~~ written over the years mixing CodeIgniter 3 and Laravel
- Testing? Well... let's just say the coverage was _best left undiscussed_ hehe

The real problem wasn't the programming language. PHP is actually fine. The problems were:

1. **No layer separation**: controllers querying the database directly, business logic mixed with presentation logic. Picture a plate of fried rice where you can't tell what's what, that was the codebase hahaha.
2. **Hard to test**: tightly coupled code made unit testing a nightmare. Want to test one function? You'd have to set up a database, mock three dependencies, and pray it works.
3. **Declining developer experience**: onboarding new developers took longer, bug fixes carried more risk. The last new developer we brought in said, _"So... this is an... interesting architecture."_ Translation: chaotic hehe~

Bottom line: this system didn't just need a language change, it needed a **re-architecture**.

## Why Go?

If you ask why not just refactor in PHP, the answer: **absolutely possible**. But in this case, there were reasons Go was the better fit. Not because I was swept up by Go hype, but because there were some pretty solid considerations (at least I thought so hehe):

### 1. Type Safety Saves Debug Time

PHP is dynamically typed[^2], meaning many bugs only surface at runtime. Go's static typing catches errors at compile time. Simple concept, huge impact, bugs that used to appear in production now get caught during build. And trust me, you sleep a lot better knowing type-related bugs won't randomly wake you up at 2 AM hahaha.

### 2. Concurrency for Free

This system handles many simultaneous requests, from real-time GPS tracking to report generation. Goroutines in Go make concurrent programming significantly simpler compared to other approaches I've tried. Honestly, the first time I used goroutines I thought, _"Wait, it's really this simple?"_ hehe~

### 3. Clean Deployment

One binary. No dependency hell, no `composer install` on the server, no PHP version conflicts. Build locally, deploy one file. Done. Back with PHP deployments, you had to make sure all composer dependencies installed correctly, the PHP version matched, the right extensions were there... now it's just `scp` one file and done. Simple life is the best life hehe.

### 4. Measurable Performance

It's not about benchmark numbers, it's about **predictable resource usage**. Go's consistent memory usage makes capacity planning much easier. The old PHP system would randomly spike memory for no clear reason. Now memory usage is flat and predictable. Peace of mind, priceless hahaha.

Not that Go is perfect, its error handling is verbose (all those `if err != nil`... well, you get used to it)[^3], and the ecosystem is smaller than PHP's. But for this use case, the trade-offs were worth it. Every tool has its strengths and weaknesses, you just have to pick the one that fits best hehe~

## Migration Approach: Per-Module, Not Big Bang

One of the biggest mistakes in migration is _"let's rewrite everything from scratch."_ I've heard horror stories about teams spending 2 years on a big-bang rewrite and... never finishing. Reasons varied: burnout, scope creep, or business requirements that changed halfway through. God forbid that ever happens hahaha.

The approach I used:

### 1. Module Mapping

First, map all endpoints and entities into clear modules. From 370+ endpoints, I grouped them into several domains: authentication, tracking, reporting, user management, and so on. The process was... well, pretty tedious. It took a few days just to ~~suffer through building~~ build a spreadsheet mapping all the endpoints. But trust me, this step was absolutely worth it hehe.

### 2. Service–Repository Pattern

Each module was designed using the **service–repository** pattern:

- **Repository layer**: responsible for data access (database queries)
- **Service layer**: contains business logic, calls the repository

Why separate them? Because with this separation:

- Repositories can be mocked when testing services
- Business logic can be tested without a database
- Adding features doesn't break other parts

Simply put, we're creating clear layers so each part's concerns don't bleed into each other. At first it feels like over-engineering, but after a few months running with it, oh man, it makes such a difference hehe~

### 3. One Endpoint at a Time

The process was roughly:

1. Take one endpoint from PHP
2. Write test cases based on existing behavior[^4]
3. Implement in Go using the service–repository pattern
4. Test until passing
5. Deploy and monitor
6. Repeat

Yes, it's slow. But **predictable**. Each migrated endpoint is incremental, measurable progress. And importantly, stakeholders can actually see it moving. _"This week we migrated 5 endpoints"_ is far more reassuring than _"we're still working on the migration"_ for months on end hehe.

## Measurable Results

Some numbers from this project:

- **370+ endpoints** successfully migrated
- **33 entities** converted from MySQL to PostgreSQL[^5]
- **194K+ lines** of PHP transformed into a cleaner Go architecture
- **More consistent response times**: no more unexpected spikes
- **Test coverage increased significantly**: from almost nothing to a respectable number
- **Faster developer onboarding**: clear code structure lets new developers contribute sooner

The unmeasurable but very real benefit: **peace of mind during deployment**. No more "hope nothing breaks this time" feeling. Now deploys are... well, still a little nerve-wracking, but not the kind that keeps you up at night hahaha.

## Lessons Learned

A few things I learned from this process:

### 1. Understand the Existing System First

Before writing a single line of Go code, I spent considerable time understanding the behavior of the existing system. Not just reading the code, understanding **why** certain decisions were made. Sometimes, code that looks "weird" has a perfectly reasonable explanation in its original context. Don't just label legacy code as bad code. Maybe there was a constraint back then that forced that decision hehe~

### 2. Big Bang Rewrite Is a Trap

_If you can do it incrementally, why go all at once?_ The incremental approach feels slow, but the risk is much lower. Every successfully migrated endpoint is progress you can show to stakeholders. And crucially, the system keeps running normally through the whole process. Business as usual, that's the goal hehe.

### 3. Test First, Then Migrate

Writing tests for legacy systems is boring, right? But tests are the **safety net** ensuring the system behaves the same after migration. Without tests, you're not migrating, you're gambling. And trust me, deploying with solid test coverage is way more relaxing than deploying while saying your prayers hahaha.

### 4. Don't Prematurely Optimize

I was initially tempted to jump straight into microservices, message queues, and fancy architecture. But reality check: a system without stable architecture doesn't need microservices, it needs **a solid foundation**. A well-structured monolith beats chaotic microservices any day. KISS (_Keep It Simple, Stupid_)[^6] is genuinely timeless wisdom hehe~

## Closing Thoughts

Migrating from PHP to Go isn't about "_language A is better than language B_." It's about **choosing the right tool for the problem at hand**, and in this case, Go with its static typing, concurrency model, and deployment simplicity was the right choice.

Does every PHP system need to be migrated to Go? _Not at all_. If your PHP system runs well, the architecture is clear, and your team is comfortable with PHP, just keep going. Don't migrate just because of hype. Migrate because there's a clear business value and measurable benefit to it hehe~

If you have a legacy system that's becoming unwieldy and want to discuss the right migration approach, [get in touch](/en/contact/). Or check out my [services](/en/services/) to see how I can help.

That's all. Cheers.

[^1]: I seriously double-checked that number the first time I counted. Turns out, yes, that many hahaha.

[^2]: PHP 7+ does have type hints and strict types, but it's still not as strict as Go which is statically typed from the ground up.

[^3]: In the early days of using Go, I was genuinely annoyed by all the `if err != nil`. But after getting used to it, you just accept it. Besides, verbose but clear beats concise but hidden error handling any day.

[^4]: Writing tests based on existing behavior is important. The last thing you want is the migration accidentally changing behavior that users already depend on.

[^5]: The MySQL to PostgreSQL migration is a whole story on its own. Maybe I'll write about it someday hehe.

[^6]: Keep It Simple, Stupid, a principle that often gets forgotten when we get too excited about new technology.

---

_Tags: [go](/en/tags/go/) · [php](/en/tags/php/) · [architecture](/en/tags/architecture/) · [migration](/en/tags/migration/)_
