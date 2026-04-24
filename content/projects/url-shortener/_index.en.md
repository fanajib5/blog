---
title: "URL Shortener REST API"
description: "Open source URL shortener backend built with Go, Echo, and MySQL with modular architecture."
date: 2021-12-01
lastmod: 2026-04-15T00:00:00+07:00
draft: false
comments: false
project_type: "Open Source"
tech_stack: ["Go", "Echo", "MySQL", "REST API"]
live_url: ""
repo_url: "https://github.com/fanajib5/url_shortener_PA"
---

## The Problem

Needed a simple yet well-structured URL shortener backend, not just a proof of concept, but code that could serve as an architecture reference for other Go projects.

## The Solution

Built using **Go with Echo framework** and **MySQL**, with a clean modular structure:

- **Link creation**: generate short codes for long URLs
- **Redirect handling**: resolve short codes to original URLs
- **Basic analytics**: click count tracking per link
- **RESTful API**: endpoints following best practices

### Architecture

A modular structure separating handler, service, and repository, making it easy to test and extend with new features.

## Results

- Open source on [GitHub](https://github.com/fanajib5/url_shortener_PA)
- Modular architecture that can serve as a template for other Go projects
- Clean endpoint design with consistent error handling

## Lessons Learned

1. **Framework selection matters**: Echo provides lightweight routing and middleware without overhead, ideal for small-to-medium APIs
2. **Modular structure from the start**: even for small projects, proper structure makes adding features (analytics, auth) straightforward without major refactoring
