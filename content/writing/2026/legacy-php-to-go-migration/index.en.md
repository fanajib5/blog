---
title: "Migrating Legacy PHP to Go: Why, How, and Lessons Learned"
description: "My story of migrating a PHP backend (CodeIgniter 3 and Laravel) to Go, one endpoint at a time."
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

The PHP codebase I worked on had become hard to maintain. New features were harder to add, bugs showed up more often, and every deploy felt like flipping a coin. PHP itself wasn't the culprit. The system had grown for years without a clear architecture. One day I had to roll back three times after a deploy that should have been simple. That was a stressful afternoon.

I'm not here to argue that "_Go is better than PHP_" or "_PHP is dead_." This is my account of migrating a backend system from PHP (CodeIgniter 3 and Laravel) to Go. It's not a tutorial, and definitely not a call for everyone to switch languages. Maybe my experience, mistakes included, will help someone dealing with something similar.

## What Made It Hard: The Architecture

The system I handled looked like this:

- **370+ API endpoints**[^1]
- **33 database entities with complex relationships**
- **~194,000 lines** of PHP code across CodeIgniter 3 and Laravel
- Testing existed, but coverage was very low.

PHP wasn't the problem by itself. PHP is perfectly usable. The trouble spots in this system were:

1. **No layer separation**: controllers queried the database directly, and business logic was mixed with presentation logic. Like fried rice with everything mixed in, it was hard to tell where one concern ended and another began.
2. **Hard to test**: tightly coupled code made unit testing difficult. To test one function, I had to set up a database, mock three dependencies, and hope it worked.
3. **Declining developer experience**: onboarding new developers took longer, and bug fixes carried more risk. One new developer said, _"So... this is an... interesting architecture."_ In other words, chaotic.

So changing languages alone wasn't going to be enough. The architecture needed work too.

## Why I Picked Go

If you ask why I didn't just refactor in PHP, the answer is: **I could have**. For this project, Go felt like a better fit for a few reasons. Not just because people were talking about it.

### 1. Type Safety Saves Debug Time

PHP is dynamically typed[^2], so many bugs only surface at runtime. Go's static typing can catch type-related errors at compile time, before they reach production.

### 2. Goroutines Helped with Concurrency

This system handles many simultaneous requests, from real-time GPS tracking to report generation. Compared with other approaches I've tried, goroutines make concurrent programming much simpler. The first time I used them, I thought, _"Wait, it's really this simple?"_

### 3. A Simpler Deploy

Go produces one binary. There is no `composer install` on the server and no PHP version conflict to worry about. PHP deployments meant checking that composer dependencies were installed, the PHP version matched, and the required extensions were available. Now I build locally and use `scp` to send one file.

### 4. More Predictable Resource Use

I wasn't focused on benchmark numbers, but on **predictable resource usage**. Go's consistent memory usage makes capacity planning easier. The old PHP system could have unexplained memory spikes. Now memory usage is flatter and more predictable.

Go isn't perfect. Its error handling is verbose (all those `if err != nil`)[^3], and its ecosystem is smaller than PHP's. For this use case, the trade-offs were worth it.

## How I Migrated: Module by Module

One migration risk is deciding to rewrite everything at once. I once heard about a team that spent two years on a big-bang rewrite and never finished. Burnout, scope creep, changing business requirements, you name it. Projects can wander off in plenty of ways.

The approach I used:

### 1. Module Mapping

First, I mapped all endpoints and entities to clear modules. I grouped the 370+ endpoints into domains such as authentication, tracking, reporting, and user management. Building a spreadsheet to map them took a few days. It was tedious, but it helped with the work that followed.

### 2. Service-Repository Pattern

I designed each module using the **service-repository** pattern:

- **Repository layer**: responsible for data access (database queries)
- **Service layer**: contains business logic, calls the repository

That separation helped with a few things:

- Repositories can be mocked when testing services
- Business logic can be tested without a database
- Adding features doesn't break other parts

With clear layers, each part has its own job. The pattern felt like over-engineering at first. After a few months of using it, I could see the point.

### 3. One Endpoint at a Time

The process was roughly:

1. Take one endpoint from PHP
2. Write test cases based on existing behavior[^4]
3. Implement in Go using the service-repository pattern
4. Test until passing
5. Deploy and monitor
6. Repeat

The process is slow, but **predictable**. Each migrated endpoint is measurable progress that stakeholders can see. _"This week we migrated 5 endpoints"_ is clearer than saying _"we're still working on the migration"_ for months without visible results.

## What Changed

A few numbers from the project:

- **370+ endpoints** successfully migrated
- **33 entities** converted from MySQL to PostgreSQL[^5]
- **194K+ lines** of PHP transformed into a cleaner Go architecture
- **More consistent response times**: no more unexpected spikes
- **Test coverage increased significantly**: from almost nothing to a respectable number
- **Faster developer onboarding**: clear code structure lets new developers contribute sooner

One benefit that doesn't show up in the numbers is a calmer deployment process. I no longer go into a deploy hoping nothing breaks. It can still be nerve-wracking, but it doesn't keep me up at night.

## Things I Learned Along the Way

I came away with a few lessons:

### Get to Know the Old System First

Before writing Go, I spent time learning how the existing system behaved. I read the code and tried to figure out **why** certain decisions had been made. Code that looks "weird" might have made sense in its original context. So I try not to call legacy code bad too quickly. There may be a constraint I can no longer see.

### Don't Rewrite Everything at Once

_If you can do it in pieces, why do it all at once?_ Incremental work feels slower, but it carries less risk. You can show stakeholders each finished endpoint, and the existing system keeps running.

### Test Before Moving Things Over

Writing tests for a legacy system can be tedious (I know). But tests are a safety net against quietly changing behavior after migration. Without them, you might change something users already rely on.

### Don't Make It Complicated Too Soon

I was tempted to jump into microservices, message queues, and all sorts of elaborate architecture. But a system without a stable architecture needs a foundation first, not more moving parts. A well-structured monolith is easier to live with than chaotic microservices. KISS (_Keep It Simple, Stupid_)[^6] still comes in handy.

## So, Should You Move to Go?

For me, moving from PHP to Go isn't a contest over which language is better. It's about **choosing a tool that fits the problem**. In this project, Go's static typing, concurrency model, and simpler deployment made sense.

Does every PHP system need to move to Go? _Nope_. If your system runs well, the architecture is clear, and the team is comfortable with PHP, switching just because it is trendy will only create more work. I think migration makes sense when the business value is clear and the benefits can be measured.

If the legacy system you work on is becoming difficult to maintain and you'd like to discuss a migration approach, [get in touch](/en/contact/). You can also learn more about my [services](/en/services/).

[^1]: I seriously double-checked that number the first time I counted. Turns out, yes, that many hahaha.

[^2]: PHP 7+ does have type hints and strict types, but it's still not as strict as Go which is statically typed from the ground up.

[^3]: In the early days of using Go, I was genuinely annoyed by all the `if err != nil`. But after getting used to it, you just accept it. Besides, verbose but clear beats concise but hidden error handling any day.

[^4]: Writing tests based on existing behavior is important. The last thing you want is the migration accidentally changing behavior that users already depend on.

[^5]: The MySQL to PostgreSQL migration is a whole story on its own. Maybe I'll write about it someday hehe.

[^6]: Keep It Simple, Stupid, a principle that often gets forgotten when we get too excited about new technology.

---

_Tags: [go](/en/tags/go/) · [php](/en/tags/php/) · [architecture](/en/tags/architecture/) · [migration](/en/tags/migration/)_
