# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Hugo static site generator** blog (not Eleventy - the README.md describes a planned migration that was later reverted based on git history). The blog uses a custom theme called "retro-jib" located in `themes/retro-jib/`.

**Tech Stack**: Hugo (Go-based SSG), SCSS for styling, bilingual (Indonesian/English)

## Common Commands

```bash
# Development server (includes drafts)
hugo server -D

# Production build
hugo

# Build with drafts
hugo -D

# Create new writing post (uses page bundle format)
hugo new writing/my-post/index.md

# Create new gallery
hugo new gallery/YYYY-MM-DD/index.md

# Clean build artifacts
rm -rf public/ resources/
```

## Architecture

### Theme Structure
The `retro-jib` theme in `themes/retro-jib/` contains all layouts:

- `layouts/_default/baseof.html` - Base template with `<head>`, navigation, footer
- `layouts/writing/single.html` - Single blog post layout with TOC, tags, prev/next nav
- `layouts/gallery/single.html` - Photo gallery single view
- `layouts/gallery/list.html` - Gallery listing page
- `layouts/index.html` - Homepage
- `layouts/shortcodes/photo.html` - Custom shortcode for images with EXIF data

### Content Organization
- **Page bundles**: Each post/gallery is a folder with `index.md` plus associated images
- `content/writing/YYYY/post-name/index.md` - Blog posts organized by year
- `content/gallery/YYYY-MM-DD/index.md` - Photo galleries by date
- `content/about.md`, `content/link.md`, `content/uses.md` - Static pages

### Front Matter Pattern
```yaml
---
title: "Post Title"
url: ""
description: "Post description"
author: "Faiq Najib"
date: 2023-07-24T17:32:00+07:00
lastmod: 2023-07-23T11:58:34.039+07:00
draft: false
toc: true
comments: false
images:
tags:
  - tag1
  - tag2
---
```

### Custom Shortcodes
- `{{< photo src="image.webp" alt="..." caption="..." >}}` - Responsive figure with EXIF metadata (camera, focal length, aperture, exposure, ISO)
- `{{< figure ... >}}` - Built-in Hugo figure shortcode (also used in content)

## Key Features

- **Git info**: `enableGitInfo = true` in config - displays lastmod and git author in post footer
- **TOC**: Set `toc: true` in front matter to auto-generate table of contents
- **Bilingual**: Indonesian (default) and English, configured in `config.toml`
- **Syntax highlighting**: Uses `modus-vivendi` theme (see `config.toml`)
- **EXIF data**: Photos automatically display camera metadata when using `photo` shortcode
- **Analytics**: GoatCounter integration in baseof.html

## Important Notes

- The README.md describes an Eleventy migration that was reverted. This is **not** an Eleventy project.
- Theme files are in `themes/retro-jib/` - modify layouts there when adjusting templates.
- SCSS is in `assets/scss/style.scss` and gets processed via Hugo pipes.
