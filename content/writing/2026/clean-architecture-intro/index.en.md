---
title: "Clean Architecture: From Spaghetti Code to Readable Code"
description: "My notes on Clean Architecture, using an example from a GPS tracker project I worked on."
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

I once wrote code that made sense at the time. The logic was clear, the flow was neat, and the variable names were descriptive. Three months later I opened the same file and thought, _"what was this even supposed to do?"_ Turns out I can confuse myself with my own code too hehe.

On a GPS tracker project I worked on, one function did everything: queried the database, updated a vehicle's status and position, sent notifications, and generated reports. Practical at first? Maybe. As the code grew, it started to show.

## Recognizing "Spaghetti Code"

Spaghetti code isn't a formal technical term. It describes **code that's tangled and hard to separate**, like spaghetti noodles that are difficult to pick up one at a time.

Here's roughly what that function looked like (pseudocode):

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

## Clean Architecture, in a Nutshell

Robert C. Martin (Uncle Bob) popularized the term "Clean Architecture". The short version is this: **business logic should not depend on technical details like a database, framework, or API.** No need to make it sound more complicated than that.

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

The responsibilities are usually explained with these three layers:

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

## Trying It on the GPS Tracker Example

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

## What If the Project Is Small?

You might be thinking, _"This is for big projects. My thesis is just a small app."_ Fair enough. Clean Architecture can easily be overkill for a small app. Still, keeping business logic separate from technical details can help when the code needs tests or its implementation changes.

When explaining a thesis design, an advisor might ask _"why did you design the system this way?"_ An answer like _"because my business logic doesn't depend on the database"_ is clearer than _"because the tutorial I followed did it this way."_

### When You Don't Need the Extra Layers

Clean Architecture isn't a silver bullet. There are times you don't need it:

- **Prototypes**: if you just want a proof of concept, write it fast. Don't overthink.
- **Small scripts**: if it's just 50 lines to scrape data, no need for layers.
- **Still learning basics**: if you're not comfortable with OOP or design patterns yet, learn those first. Clean Architecture needs that foundation.

Use it when the project actually needs it, not just because the name sounds cool. Otherwise you might spend more time building layers than solving the problem hehe.

## A Few Things I Took Away

### Spaghetti code happens

Spaghetti code can show up when code keeps growing without clear responsibilities. No need to panic or judge the old code right away. Start by finding which parts are tangled together.

### Separate "what" from "how"

Business logic says what the system does. The database, API, and framework are the technical means of doing it. To me, that separation is the main idea.

### If it's hard to test, check the boundaries

Difficulty writing unit tests can be a sign that the boundaries need another look. In this example, Entity and Use Case can be tested without connecting to a database or email service.

### It's a tool, not a rulebook

Clean Architecture is a tool, not a religion (worth repeating before anyone adds layer after layer). Understand the idea, then use it when it fits the project.

## So, Where Does That Leave Us?

So, it's not about how many layers or fancy patterns you have. The point is to keep responsibilities from getting mixed up, so a few months later we can still understand our own code. I have personally failed at that last part hehe.

If you want to see how it played out in a real project, including a PHP to Go migration with 370+ endpoints, I wrote a [separate post](/writing/2026/legacy-php-to-go-migration/).

To discuss applying these ideas or ask for help, [get in touch](/en/contact/) or browse my [services](/en/services/).

---

_Tags: [notes](/en/tags/notes/) · [architecture](/en/tags/architecture/)_
