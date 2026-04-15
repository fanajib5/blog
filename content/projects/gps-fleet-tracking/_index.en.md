---
title: "GPS Fleet Tracking API — Laravel to Go"
description: "Full-stack backend conversion of a GPS fleet tracking system from Laravel (PHP) to Go with PostgreSQL — 370+ endpoints, 33 entities, clean architecture."
date: 2024-06-01
lastmod: 2026-04-15T00:00:00+07:00
draft: false
comments: false
project_type: "Production System"
tech_stack: ["Go", "PostgreSQL", "TimescaleDB", "Apache Kafka", "Docker"]
live_url: ""
repo_url: ""
---

## The Problem

A GPS fleet tracking system handling real-time vehicle tracking was built on Laravel (PHP) with MySQL. As the number of devices and location data volume grew, the system experienced bottlenecks:

- **Response times** getting progressively slower on reporting and history endpoints
- **Database connections** frequently exhausted by complex queries on the massive device data table
- **Expensive maintenance** — every change required understanding an increasingly complex PHP codebase

## The Solution

Full backend conversion from **Laravel → Go** using Clean Architecture pattern, with a database migration from **MySQL → PostgreSQL + TimescaleDB**.

### Architecture

```
Request → Controller → UseCase → Repository → PostgreSQL/TimescaleDB
                       ↕
                    Gateway → External API / Kafka
```

Each layer has clear responsibilities:
- **Entity**: 33 domain models (device, geofence, vehicle, driver, invoice, etc.)
- **UseCase**: 40 business logic layers
- **Repository**: 82 data access files (read/write split, master-slave aware)
- **Route**: 370+ API endpoints

### Tech Stack

| Component | Technology |
|-----------|------------|
| Language | Go 1.24 |
| HTTP Framework | GoFiber v2 |
| Database | PostgreSQL + TimescaleDB (hypertable for device data) |
| ORM/Driver | pgx/v5 (raw SQL performance) |
| Messaging | Apache Kafka (Sarama) |
| Cache | Ristretto (in-memory) |
| Migration | golang-migrate |
| Validation | go-playground/validator |
| Auth | JWT + unified auth |

### Key Features

- **Real-time tracking** — device location data processed and stored in TimescaleDB hypertable
- **Geofencing** — entry/exit alerts, scheduled geofences
- **Dashboard & reporting** — device summary, route history, fuel monitoring
- **Fleet management** — vehicle, driver, device assignment
- **Billing** — invoice, partner, payment integration (BCA VA)
- **Multi-tenancy** — enterprise, user group, shared link
- **IoT Hub** — device commands, incident tracking

## Results

- **~194K lines of Go code** replacing the PHP codebase
- **370+ API endpoints** with full parity against the Laravel version
- **Automatic read/write split** — heavy queries routed to slave DB
- **TimescaleDB hypertable** for the device data table receiving millions of records per day
- Efficient build time and binary — single binary deployment via Docker

## Lessons Learned

1. **Clean Architecture enables gradual migration** — each endpoint could be converted one by one without breaking changes, allowing v2 (Laravel) and v3 (Go) to run in parallel during the transition
2. **pgx/v5 > ORM for high-throughput** — full control over SQL queries delivers more predictable performance compared to ORM abstractions
3. **TimescaleDB is a game-changer** — hypertable + continuous aggregate replaced reporting queries that previously took minutes with sub-second results
