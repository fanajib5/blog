---
title: "Banking Process Automation & Open API Portal"
description: "Automating Treasury and International Banking processes at a national bank using RPA and developing a Mega Open API portal — saving IDR 12 million/month."
date: 2020-11-01
lastmod: 2026-04-15T00:00:00+07:00
draft: false
comments: false
project_type: "Internal System"
tech_stack: ["UiPath RPA", "Laravel", "PHP", "SQL Server", "Linux"]
live_url: ""
repo_url: ""
---

## The Problem

An Indonesian national bank with Treasury and International Banking operations was running repetitive manual processes:

- **Tax reporting** and **bond settlement** required approximately 3 hours per process
- High rate of manual errors on repetitive tasks
- No internal visibility into available banking services
- No standardized access to banking services for external parties

## The Solution

Two parallel tracks: **RPA automation** for backend processes and an **Open API portal** for service access.

### Track 1: Process Automation (RPA)

Using **UiPath** to automate:
- Tax reporting workflow — from data gathering to report generation
- Bond settlement process — from instruction to confirmation
- Credit card dispute workflows — automated processing for selected use cases

### Track 2: Internal Dashboard & Open API

- **Internal dashboard** using Laravel + SQL Server for operational visibility
- **Mega Open API portal** — introducing standardized access to banking services for internal and external use
- **Linux server configuration** — setup and maintenance of deployment environments

## Results

- **Process time reduced from ~3 hours to ~1 hour** per cycle (tax reporting & bond settlement)
- **Savings of IDR 12 million per month** from reduced labor and error-related costs
- **100% time savings** on selected credit card dispute use cases vs manual
- Open API portal improved visibility and access to banking services

## Lessons Learned

1. **RPA isn't a silver bullet** — it works well for repetitive processes with clear rules, but for processes requiring judgment, partial automation is more realistic than full automation
2. **ROI calculation matters** — measuring impact in rupiah (IDR 12 million/month) helps non-technical stakeholders understand the value of technology investment
3. **Banking domain knowledge** — understanding Treasury/Banking regulations and processes is just as important as technical skills in the financial sector
