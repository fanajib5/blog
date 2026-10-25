---
title: "Clean Architecture: From Spaghetti Code to Readable Code"
description: "An introduction to Clean Architecture for students, from spaghetti code to structured code, with real examples from a GPS tracker project."
author: "Faiq Najib Al-Aziz"
date: 2026-04-15
lastmod: 2026-09-11T09:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - notes
  - architecture
---

I once wrote code that made sense at the time. The logic was clear, the flow was neat, and the variable names were descriptive. Three months later, I opened the same file and wondered, _"what was this even supposed to do?"_

Here, I introduce **Clean Architecture** through an example from a GPS tracker project I once worked on. I'll focus on the idea, not jargon.

## Recognizing "Spaghetti Code"

Spaghetti code isn't a formal technical term. It describes **code that's tangled and hard to separate**, like spaghetti noodles that are difficult to pick up one at a time.

In a GPS tracker project I worked on, one function looked roughly like this:

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

## Clean Architecture: The Core Idea Is Actually Simple

Robert C. Martin (Uncle Bob) popularized the term "Clean Architecture". The main idea is simple: **code that matters (business logic) should not depend on technical details (database, framework, API).**

Business logic tends to be more stable than technical details. It includes rules for calculating distance, determining whether a vehicle is active, and setting speed limits. The database, framework, and email delivery are **details** that can change.

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

**Arrows may only point inward.** Entity knows nothing about the database, and Use Case doesn't know how to send emails. Infrastructure handles the technical details.

If the repository contract stays the same, switching from MySQL to PostgreSQL doesn't require changes to Entity or Use Case. The Infrastructure implementation changes.

### Three Important Layers

These three layers help explain how responsibilities are divided:

**1. Entity, Core Business Rules**

This holds core business rules that don't depend on a particular technology. In the GPS tracker project:

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

There are no database queries, HTTP requests, or frameworks here. This is **business logic**: whether a vehicle is speeding and how to activate it.

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

The use case calls `vehicleRepository` and `alertService`, but **doesn't know** whether their implementations use MySQL or PostgreSQL, or send alerts by email or SMS. It only knows _"find vehicle"_, _"save"_, and _"send alert"_.

As long as the repository contract stays the same, you can change databases without changing the use case.

**3. Infrastructure, Technical Details**

This is where implementation details live: database, API, framework, and email service.

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

Here's the "clean" version of the original flow:

### Before: Spaghetti

One function handles everything: reading from the database, processing logic, sending notifications, and generating reports.

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

Each layer can be tested separately: `Vehicle` without a database, `UpdatePositionUseCase` with a mock repository, and `MySQLVehicleRepository` on its own.

## Clean Architecture in Small Projects

You might think, _"This is for big projects. My thesis is just a small app."_ For a small app, Clean Architecture can be overkill. Still, separating business logic from technical details can help when the code needs testing or its implementation details change.

When explaining a thesis design, an advisor might ask _"why did you design the system this way?"_ An answer like _"because my business logic doesn't depend on the database"_ is clearer than _"because the tutorial I followed did it this way."_

### When It's Okay NOT to Use Clean Architecture

Clean Architecture isn't a silver bullet. There are times you don't need it:

- **Prototypes**: if you just want a proof of concept, write it fast. Don't overthink.
- **Small scripts**: if it's just 50 lines to scrape data, no need for layers.
- **Still learning basics**: if you're not comfortable with OOP or design patterns yet, learn those first. Clean Architecture needs that foundation.

Use it when the project's complexity calls for it, not just because the name sounds cool.

## Lessons Learned

### 1. Spaghetti Code Is Normal, Staying There Is Not

Spaghetti code can emerge as code grows without clear separation of responsibilities. Recognizing which parts are tangled is the first step toward fixing them.

### 2. Separate "What" from "How"

Separate what the system does (business logic) from how it does it (database, API, framework). That's the essence of Clean Architecture.

### 3. Testability Is a Sign of Good Architecture

Difficulty writing unit tests can signal that the separation of responsibilities needs another look. In this example, Entity and Use Case can be tested without connecting to a database or email service.

### 4. Don't Be Dogmatic

Clean Architecture is a tool, not a religion. Understand the principles, then use them when the project calls for it.

## Closing Thoughts

Clean Architecture isn't about the number of layers or fancy patterns. It separates responsibilities so code is easier to understand, change, and test, including when you open it again months later.

If you're interested in seeing how Clean Architecture was applied in a real project (migrating from PHP to Go, 370+ endpoints), I have a [separate write-up](/writing/2026/legacy-php-to-go-migration/) for the implementation side.

Use [get in touch](/en/contact/) to reach me; the [services](/en/services/) page describes what I offer.

---

_Tags: [notes](/en/tags/notes/) · [architecture](/en/tags/architecture/)_
