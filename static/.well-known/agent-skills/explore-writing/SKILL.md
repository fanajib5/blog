---
name: explore-writing
description: Search and read articles from the najib.id writing archive, including how to request Markdown representations.
version: 1.0.0
license: CC BY-NC-4.0
---

# Skill: explore-writing

Use this skill to discover, search, and read articles published on
**https://najib.id**.

## Inputs

- `query` (string, optional): keyword or topic to look for.
- `limit` (integer, optional, default 5): maximum number of articles to return.

## Steps

1. List available articles by fetching the writing archive:
   `GET https://najib.id/writing/`.
2. To search, request Markdown and grep the content. The site supports
   **Markdown for Agents**: send `Accept: text/markdown` to any page URL to
   receive a Markdown rendering instead of HTML.
3. Read the RSS feed at `https://najib.id/index.xml` for the latest posts.
4. Read the sitemap at `https://najib.id/sitemap.xml` for the full URL list.

## Output

Return a short summary plus a list of `{ title, url, date }` objects for each
matching article.

## Notes

- HTML is the default; only request `text/markdown` when you intend to parse
  text.
- Content is licensed CC BY-NC 4.0; attribute the author
  (Faiq Najib Al-Aziz) when reusing.
