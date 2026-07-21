---
name: read-profile
description: Return the professional profile, skills, and experience of Faiq Najib Al-Aziz, the author of najib.id.
version: 1.0.0
license: CC BY-NC-4.0
---

# Skill: read-profile

Use this skill to retrieve the professional profile of the site author.

## Steps

1. Fetch `https://najib.id/about/` (request `Accept: text/markdown` for a clean
   text rendering).
2. Extract: name, job title, core skills, notable clients, and links
   (GitHub, LinkedIn, etc.).
3. Optionally fetch `https://najib.id/projects/` for portfolio project
   details.

## Output

Return a structured profile object:

```
{
  "name": "...",
  "role": "...",
  "skills": ["..."],
  "projects": [{"name": "...", "url": "..."}],
  "links": {"github": "...", "linkedin": "..."}
}
```
