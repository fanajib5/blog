---
title: "MIS-APAR, Fire Extinguisher Management System"
description: "Management information system for sales, inventory, and maintenance of portable fire extinguishers (APAR), the first product of PT Akordium Digital Berkah."
date: 2026-01-01
lastmod: 2026-04-15T00:00:00+07:00
draft: false
comments: false
project_type: "Freelance / Product"
tech_stack: ["Laravel", "Livewire", "Alpine.js", "Tailwind CSS", "MySQL", "Redis"]
live_url: ""
repo_url: "https://github.com/fanajib5/mis-apar"
---

## The Problem

CV Andika Jaya Infinite was managing their fire extinguisher (APAR) sales and maintenance business manually, from stock recording, sales, to maintenance scheduling. This manual process caused:

- Discrepancy between physical stock and system records
- Difficulty tracking expired maintenance contracts
- Slow and error-prone financial reports

## The Solution

Built MIS-APAR (Management Information System for Fire Extinguishers) as the **first product of PT Akordium Digital Berkah**, my sole proprietorship company.

### Key Features

An ERP-style system covering the entire APAR business operations:

- **Master data**: customers, products, pricing
- **Sales workflow**: sales orders, invoices, delivery
- **Maintenance management**: maintenance contracts, scheduling, tracking
- **Bookkeeping**: payments, financial reports
- **Document management**: generate transaction-related documents

### Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Laravel |
| Frontend | Livewire + Alpine.js |
| Styling | Tailwind CSS + Flux UI |
| Database | MySQL |
| Cache | Redis |

Optimized for **non-technical users**, 4 admin users and the owner operate the system for daily business activities.

## Results

- Digitized the entire APAR business operations that were previously manual
- User-friendly interface for non-technical users
- Complete ERP-style workflow from sales to maintenance contracts

## Lessons Learned

1. **User-centric design for non-technical users**: choosing Livewire + Alpine.js (not an SPA framework) accelerated development while still providing sufficient interactivity for admin users
2. **ERP-style complexity management**: the APAR business has more complex domain logic than it appears (pricing tiers, maintenance scheduling, document generation), understanding the business domain is far more important than technology choices
3. **First product lessons**: building the first product for a real client teaches the true meaning of "build what matters" vs "build what's cool"
