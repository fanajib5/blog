---
title: "Resources"
description: "A collection of free tools, templates, checklists, and resources I built or recommend for backend developers and independent builders."
date: 2024-01-01T00:00:00+07:00
lastmod: 2024-01-01T00:00:00+07:00
author: "Faiq Najib Al-Aziz"
draft: false
toc: true
comments: false
tags:
  - resources
  - tools
  - open-source
  - backend
  - golang
---

This page collects **tools, templates, and free resources** that I built or recommend for backend developers, independent builders, and educators.

## Open Source Tools

### go-starter (Go Project Scaffolder)
CLI tool to scaffold Go projects with a Clean Architecture structure ready for production. Reduces boilerplate and speeds up project initialization.

- **Repository:** [github.com/fanajib5/go-starter](https://github.com/fanajib5/go-starter)
- **Features:** Clean Architecture, Gin/Echo/Fiber options, Docker-ready, CI/CD config
- **Best for:** Backend developers who want to start Go projects with the right structure

### retro-jib-hugo-theme (Developer Blog Theme Fork)
Hugo theme for developer blogs, forked from `retro-jib`. Supports bilingual (ID/EN), SEO-friendly, and lightweight.

- **Repository:** [github.com/fanajib5/retro-jib-hugo](https://github.com/fanajib5/retro-jib-hugo)
- **Features:** Bilingual, responsive, dark mode, SEO optimized
- **Best for:** Developers who want to set up a personal blog with Hugo

## Checklists & Cheatsheets

### Backend Developer Checklist
A checklist to ensure your backend application is production-ready before deployment:

- [ ] Database migrations are versioned (use Goose/Migrate)
- [ ] Environment variables are managed properly (not hardcoded)
- [ ] Structured logging (use zap/logrus)
- [ ] Health check endpoint (`/health` or `/ready`)
- [ ] Graceful shutdown implemented
- [ ] Rate limiting on public endpoints
- [ ] Input validation on all endpoints
- [ ] Consistent error handling (don't expose stack traces to clients)
- [ ] Database connection pooling optimized
- [ ] Backup strategy for database

### PostgreSQL Performance Cheatsheet
Quick guide for PostgreSQL query optimization:

| Issue | Solution |
|-------|----------|
| Slow query | Use `EXPLAIN ANALYZE` to identify bottlenecks |
| Missing index | `CREATE INDEX CONCURRENTLY` to avoid locks |
| N+1 query | Use eager loading (`JOIN` or `IN` clause) |
| Connection exhaustion | Implement connection pooling (PgBouncer) |
| Table bloat | Run `VACUUM FULL` or `pg_repack` |

## Recommended Tutorials

### Migrating PHP to Golang
Practical experience migrating a CodeIgniter 3 system to Go with clean architecture.

- **Read:** [Migrating Legacy PHP to Go](/en/writing/2026/legacy-php-to-go-migration/)

### VPS Setup for Production
Guide to setting up a Hetzner VPS from scratch to production-ready.

- **Read:** [VPS Notes: Setting Up My First VPS (That Wasn't Actually My First)](/en/writing/2023/set-up-first-but-not-first-vps/)

### Clean Architecture for Go
Introduction to Clean Architecture principles and implementation in Go projects.

- **Read:** [Clean Architecture Introduction](/en/writing/2023/clean-architecture-intro/)

## Contributing

If you find a bug or want to add resources, feel free to create an issue or pull request in the relevant repository. All resources on this page are free for commercial and non-commercial use.

---

*This is an evolving page. I'll keep adding new resources as I learn and build projects.*
