---
title: "JITA, Japan Industry Training Academy"
description: "A two-way digital ecosystem bridging Indonesian professional talent with Japanese industry via ICE Center ITB SSO integration, automated Japanese CV builder (Rirekisho), and two-way job matching."
date: 2026-09-01
lastmod: 2026-09-14T00:00:00+07:00
draft: false
comments: false
project_type: "Client Project / Web Platform"
tech_stack: ["React", "TypeScript", "Vite", "Node.js", "Express", "MySQL", "JWT/SSO", "Docker"]
live_url: "https://jijp.akordium.id"
repo_url: ""
results: ["ICE Center ITB SSO integration (JWT RS256)", "Automated Japanese CV Builder (Rirekisho PDF)", "Two-Way Job Matching (Apply & Scout)"]
---

## The Problem

Japanese industry faces a critical demand for skilled professional talent from abroad. However, recruiting and preparing candidates from Indonesia often encounters systemic hurdles:

- **Complex Japanese employment document standards**: Official Japanese Curriculum Vitae (*Rirekisho* / 履歴書) adhere to very strict, standardized layouts. Manual composition by applicants frequently leads to formatting mistakes that compromise interview qualification.
- **Fragmented qualification verification**: Japanese hiring partners (*Mitra Jinzai*) require dependable validation of Japanese language proficiency (JLPT N5–N1), legal identity, and verified training records prior to extending job invitations.
- **Lack of two-way matching channels**: Conventional employment platforms typically operate in one direction (candidates applying to job listings), lacking tools for Japanese employer partners to proactively scout and invite vetted candidates.

## The Solution

Developed the **JITA (Japan Industry Training Academy)** platform (demo: [jijp.akordium.id](https://jijp.akordium.id)) as a comprehensive, two-way digital ecosystem covering the entire candidate career pathway: from training, certification, progress tracking, and document verification to automated Japanese CV generation and job placement.

### Key Features

1. **Integrated Single Sign-On (ICE Center ITB SSO)**:
   - Direct JWT (RS256) Single Sign-On integration with the **ICE Center ITB** portal.
   - Account auto-provisioning and seamless profile synchronization upon first login.

2. **Automated Japanese CV Builder (*Rirekisho* PDF)**:
   - High-precision PDF generation of standard Japanese employment resumes (*Rirekisho* / 履歴書).
   - Full Japanese typography and kanji rendering support using *Noto Sans CJK JP*.

3. **Track Record & Document Vault**:
   - Class calendar schedules, multi-tier module training tracking, and progress metrics.
   - Encrypted document storage for personal credentials (ID card, academic transcripts, JLPT certificates) with manual verification workflows for administrative staff.

4. **Two-Way Job Matching (Apply & Scout)**:
   - **Apply**: Verified candidates browse and apply directly to opportunities posted by Japanese partner companies.
   - **Scout**: Japanese corporate partners can browse vetted talent catalogs and extend interview invitations directly.

### Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express, `mysql2/promise` |
| Database | MySQL |
| Authentication | JWT RS256 (ICE Center ITB SSO) |
| Document Engine | Custom PDF Generator (Noto Sans CJK JP) |
| Notifications | Nodemailer (SMTP), In-App Notifications |
| Infrastructure | Docker, Coolify, Nginx Reverse Proxy |

## Results

- **Frictionless SSO Onboarding**: Enabled smooth access for talent from the ICE Center ITB community without redundant account creation.
- **100% Japanese CV Standardization**: Eliminated layout inconsistencies and formatting errors in *Rirekisho* submissions through automated PDF rendering.
- **Two-Way Recruitment Pipeline**: Accelerated hiring cycles between qualified candidates and Japanese corporate partners.

## Lessons Learned

1. **Cross-cultural document precision**: Building the *Rirekisho* engine demonstrated that Japanese business document formats are strict operational compliance standards, where subtle typographic and tabular alignments directly impact candidate credibility.
2. **Resilient cross-entity SSO design**: Third-party RS256 authentication integrations demand rigorous edge-case handling (token expiration, signature validation, idempotent auto-provisioning) to prevent session dropouts during cross-domain redirection.
3. **Establishing trust through verification layers**: In international labor pipelines, administrative verification dashboards that validate credentials and language scores form the indispensable foundation for employer confidence.
