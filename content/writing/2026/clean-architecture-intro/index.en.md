---
title: "Clean Architecture: From Spaghetti Code to Readable Code"
description: "An introduction to Clean Architecture for students, from spaghetti code to structured code, with real examples from a GPS tracker project."
author: "Faiq Najib"
date: 2026-04-15
lastmod: 2026-04-15
draft: false
toc: true
comments: false
tags:
  - notes
  - architecture
---

I once wrote code that made perfect sense at the time. The logic was clear, the flow was neat, the variables were descriptive. Three months later, I opened the same file, _"what was this even supposed to do?"_

If you've ever felt the same way, welcome. You're not alone hehe.

This article isn't a formal lecture on software architecture. It's my notes on **Clean Architecture**, explained in a way I wish someone had told me when I was still in university, not with jargon that makes your head spin.

## What Is "Spaghetti Code" and Why We've All Written It

Spaghetti code isn't a formal technical term. But every developer knows what it means: **code that's tangled and hard to separate**, like spaghetti noodles you can't pick up one without pulling the rest.

A real example from a GPS tracker project I once handled. There was a function that looked roughly like this (pseudo-code, by the way):

```
function handleUpdatePosition(request):
    // Directly query the database
    vehicle = db.query("SELECT * FROM vehicles WHERE id = ?", request.vehicleId)

    if not vehicle:
        return error("Vehicle not found")

    // Business logic mixed in here
    if vehicle.status == "inactive":
        vehicle.status = "active"
        vehicle.lastActivation = now()

    // Update position
    db.query("UPDATE positions SET lat = ?, lng = ?, time = ? WHERE vehicleId = ?",
             request.lat, request.lng, now(), request.vehicleId)

    // Send notification directly from here
    if vehicle.hasAlert:
        email.send(vehicle.ownerEmail, "Alert: " + vehicle.name)
        sms.send(vehicle.ownerPhone, "Alert from " + vehicle.name)

    // Generate report directly
    report = generateDailyReport(vehicle)
    db.query("INSERT INTO reports ...", report)

    return success(vehicle)
```

See? One function handles **everything**, read database, process business logic, send email, send SMS, generate report. At the time, it seemed practical. But imagine:

- **Want to change how notifications are sent**: you have to edit this function
- **Want to test business logic**: you need to set up a database and email server
- **Want to switch databases**: you have to update all queries scattered everywhere
- **There's a bug in the report**: you have to trace through this long function

```
┌─────────────────────────────────────────────────┐
│              Spaghetti Flow                      │
│                                                  │
│  Request ──► [Database + Logic + Email + Report] │
│                         │                        │
│                         ▼                        │
│              Everything fused together.          │
│              Change one thing, risk breaking all. │
└─────────────────────────────────────────────────┘
```

Bottom line: **change one thing, risk breaking something else**.

## Clean Architecture: The Core Idea Is Actually Simple

The term "Clean Architecture" was popularized by Robert C. Martin (Uncle Bob). But don't panic, you don't need to read his book to start understanding the idea.

The core idea in one sentence: **code that matters (business logic) should not depend on technical details (database, framework, API).**

Why? Because business logic is what **doesn't change**, the rules for calculating distance, determining if a vehicle is active, setting speed limits. The database, framework, how emails are sent, those are **details** that can change.

### The Dependency Rule

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ┌─────────────────────────────────────────────┐   │
│   │              Entity                          │   │
│   │   Core business rules. Innermost layer.      │   │
│   │   Depends on nothing.                        │   │
│   │                                              │   │
│   │   ┌──────────────────────────────────────┐  │   │
│   │   │          Use Case                     │  │   │
│   │   │   What the system does.               │  │   │
│   │   │   Depends on Entity, not on DB.       │  │   │
│   │   │                                       │  │   │
│   │   │   ┌───────────────────────────────┐  │  │   │
│   │   │   │     Infrastructure             │  │  │   │
│   │   │   │   Database, API, Email, SMS.   │  │  │   │
│   │   │   │   Technical details. Outermost. │  │  │   │
│   │   │   └───────────────────────────────┘  │  │   │
│   │   └──────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────┘   │
│                                                      │
│   Arrow direction: outer ──► inner                  │
│   Outer depends on inner. Inner does NOT depend      │
│   on outer.                                          │
└──────────────────────────────────────────────────────┘
```

The rule is simple: **arrows may only point inward**. Entity knows nothing about the database. Use Case doesn't know how to send emails. Infrastructure knows the technical details.

This means: if you want to switch from MySQL to PostgreSQL, Entity and Use Case **don't change at all**. Only Infrastructure changes.

### Three Important Layers

For students, I think these three layers are the most important to understand:

**1. Entity, Core Business Rules**

This is what **shouldn't change** regardless of whatever technology you use. In the GPS tracker project:

```
class Vehicle:
    id, name, status, currentSpeed, speedLimit

    function isSpeeding():
        return currentSpeed > speedLimit

    function activate():
        if status == "inactive":
            status = "active"
            lastActivation = now()
```

Notice: no database query, no HTTP request, no framework. This is pure **business logic**, whether a vehicle is speeding, how to activate a vehicle. Even if you switch programming languages tomorrow, this logic stays the same.

**2. Use Case, What the System Does**

Use cases define **what** the system does, without caring about **how** the details work.

```
class UpdatePositionUseCase:
    function execute(vehicleId, lat, lng):
        // 1. Find the vehicle
        vehicle = vehicleRepository.findById(vehicleId)
        if not vehicle:
            return error("Vehicle not found")

        // 2. Update position
        vehicle.updatePosition(lat, lng)

        // 3. Save
        vehicleRepository.save(vehicle)

        // 4. If speeding, trigger alert
        if vehicle.isSpeeding():
            alertService.sendSpeedAlert(vehicle)
```

Notice: the use case calls `vehicleRepository` and `alertService`, but **doesn't know** whether it's using MySQL, PostgreSQL, sending via email or SMS. It only knows _"find vehicle"_, _"save"_, _"send alert"_.

This is the main power of Clean Architecture: **you can swap databases without touching use cases**.

**3. Infrastructure, Technical Details**

This is where implementation details live, database, API, framework, email service, etc.

```
class MySQLVehicleRepository:
    function findById(id):
        row = db.query("SELECT * FROM vehicles WHERE id = ?", id)
        return Vehicle(id: row.id, name: row.name, ...)

    function save(vehicle):
        db.query("UPDATE vehicles SET lat = ?, lng = ? WHERE id = ?",
                 vehicle.lat, vehicle.lng, vehicle.id)
```

```
class EmailAlertService:
    function sendSpeedAlert(vehicle):
        email.send(
            to: vehicle.ownerEmail,
            subject: "Speed Alert: " + vehicle.name,
            body: vehicle.name + " is going " + vehicle.currentSpeed
        )
```

This is the part that's **allowed to change**. Want to switch MySQL to PostgreSQL? Change it here. Want to switch email to WhatsApp? Change it here. Entity and Use Case remain untouched.

## Step by Step: Applying It to the GPS Tracker

Now let's compare the spaghetti code from the beginning with the "clean" version:

### Before: Spaghetti

One function handles everything, read DB, process logic, send notification, generate report. All fused together.

### After: Clean

```
// === Entity: Vehicle ===
// (pure business logic, depends on nothing)

class Vehicle:
    function updatePosition(lat, lng):
        this.lat = lat
        this.lng = lng
        this.lastUpdate = now()

    function isSpeeding():
        return this.currentSpeed > this.speedLimit

// === Use Case: UpdatePosition ===
// (what the system does, without caring how)

class UpdatePositionUseCase:
    function execute(vehicleId, lat, lng):
        vehicle = repository.findById(vehicleId)
        if not vehicle:
            return error("Not found")

        vehicle.updatePosition(lat, lng)
        repository.save(vehicle)

        if vehicle.isSpeeding():
            alertService.sendSpeedAlert(vehicle)

        return success(vehicle)

// === Infrastructure ===
// (technical details, can change anytime)

class MySQLVehicleRepository:
    function findById(id):
        return db.query("SELECT ...")

    function save(vehicle):
        db.query("UPDATE ...")

class EmailAlertService:
    function sendSpeedAlert(vehicle):
        email.send(...)
```

### What Changed?

| Aspect | Spaghetti | Clean |
|--------|-----------|-------|
| Test business logic | Need DB + email setup | Just test `Vehicle` class |
| Switch database | Update all queries everywhere | Only change repository |
| Change alert method | Search entire codebase | Only change `AlertService` |
| Onboard new developer | Read one long function | Read per layer, start from Entity |
| Side effects of changes | Domino effect | Isolated per layer |

Notice: **each layer can be tested independently**. `Vehicle` can be tested without a database. `UpdatePositionUseCase` can be tested with a mock repository. `MySQLVehicleRepository` can be tested separately.

## Why This Matters for You

Not Just for Big Projects

You might be thinking, _"This is for big projects. My thesis is just a small app."_ Fair enough, for small apps, Clean Architecture can be overkill. But the principles still apply:

- **Separate what matters from technical details**: this isn't about the number of layers, it's about mindset
- **Write testable code**: even in small projects, this saves time during debugging
- **Think first, code later**: Clean Architecture is about **thinking** about what matters before you start coding

For your thesis, your advisor will definitely ask _"why did you design the system this way?"_ If you can answer _"because my business logic doesn't depend on the database"_, that's a far stronger answer than _"because the tutorial I followed did it this way."_

### When It's Okay NOT to Use Clean Architecture

Clean Architecture isn't a silver bullet. There are times you don't need it:

- **Prototypes**: if you just want a proof of concept, write it fast. Don't overthink.
- **Small scripts**: if it's just 50 lines to scrape data, no need for layers.
- **Still learning basics**: if you're not comfortable with OOP or design patterns yet, learn those first. Clean Architecture needs that foundation.

The takeaway: **use it when complexity demands it**, not because it sounds cool.

## Lessons Learned

### 1. Spaghetti Code Is Normal, Staying There Is Not

Every developer has written spaghetti code, including senior ones. What separates developers is: recognizing when code has become spaghetti, and knowing how to fix it.

### 2. Separate "What" from "How"

What the system does (business logic) should be separate from how the system does it (database, API, framework). This is the essence of Clean Architecture.

### 3. Testability Is a Sign of Good Architecture

If you find it hard to write unit tests for your code, that's a signal that the architecture needs rethinking. Good code is easy to test.

### 4. Don't Be Dogmatic

Clean Architecture is a tool, not a religion. If the context doesn't require it, don't force it. What matters is understanding the principles and knowing when to apply them.

## Closing Thoughts

Clean Architecture, at its core, isn't about the number of layers or fancy patterns. It's about **writing code that can be understood, changed, and tested, by yourself and others**. Even if that's three months later hehe.

If you're interested in seeing how Clean Architecture was applied in a real project (migrating from PHP to Go, 370+ endpoints), I have a [separate write-up](/writing/2026/legacy-php-to-go-migration/) for the implementation side.

If you have questions or want to discuss further, [get in touch](/en/contact/). Or check out my [services](/en/services/) to see how I can help.

---

_Tags: [notes](/en/tags/notes/) · [architecture](/en/tags/architecture/)_
