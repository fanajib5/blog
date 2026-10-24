# Editorial Voice Cleanup

**Status:** Approved  
**Date:** 2026-10-24

## Goal

Review article content in the Hugo blog and Akordium website, then revise only passages that read as generic, repetitive, over-polished, or unsupported. Use Faiq's 2023 writing as the voice reference: personal detail, a conversational Indonesian cadence, occasional dry humor, and candid limits. Do not imitate typos or force a personal anecdote into business copy.

## Scope

- Blog articles in `blog/content/writing/`, including their Indonesian and English versions. The 2023 writing is a read-only style reference and will not be rewritten.
- Published Akordium posts in `web/src/content/blog/`.
- Article drafts in `web/content-drafts/`.
- The 2019 poem and non-article pages, site code, layouts, schemas, and README files are out of scope.

## Editing approach

Audit the full scope, but edit selectively. Preserve the blog's first-person, lived-in voice and keep website copy clear and business-appropriate. Remove stock introductions, filler conclusions, repeated points, empty lists, and claims that sound more certain than their evidence allows. Retain useful technical and business detail.

Do not invent experience, client permission, metrics, sources, or technical test results. Check claims against available article context and project documentation; where evidence is unavailable, remove the claim or qualify it rather than substituting a guess. Keep translated versions aligned in meaning, not mechanically identical in wording.

Preserve publication status, dates, front matter, URLs, image references, and page structure unless a directly related content correction requires otherwise. Do not change code or publication behavior.

## Completion checks

- Review every in-scope article and language variant; leave strong passages unchanged.
- Ensure edits retain the author's voice without adding unsupported first-person anecdotes.
- Check ID/EN pairs for consistent meaning and metadata, and check local links and image references in edited articles.
- Run the existing Hugo and Astro content/build checks relevant to the edited files.
- Report which articles changed and flag claims that still require the author's confirmation.
