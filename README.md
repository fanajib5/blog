# Blogfolio Najib - Eleventy Version

Migrasi dari Hugo ke Eleventy.

## Quick Start

```bash
npm install
npm run dev
```

Build untuk production:
```bash
npm run build
```

## Struktur Project

```
blog-eleventy/
├── src/
│   ├── _data/
│   │   └── site.json          # Config (setara config.toml)
│   ├── _includes/
│   │   ├── layouts/
│   │   │   ├── base.njk       # Base template
│   │   │   ├── home.njk       # Homepage
│   │   │   ├── page.njk       # Generic pages
│   │   │   ├── post.njk       # Writing single
│   │   │   ├── writing-list.njk
│   │   │   ├── gallery-list.njk
│   │   │   └── gallery-single.njk
│   │   └── partials/
│   │       └── comments.njk
│   ├── assets/
│   │   ├── scss/
│   │   │   ├── style.scss
│   │   │   ├── _syntax.scss
│   │   │   └── partials/
│   │   ├── img/
│   │   └── docs/
│   ├── writing/               # Blog posts
│   ├── gallery/               # Photo galleries
│   ├── about/
│   └── index.md
├── .eleventy.js               # Eleventy config
└── package.json
```

## Panduan Migrasi dari Hugo

### 1. Content Files

Copy semua file markdown dari Hugo:

```bash
# Writing posts
cp -r hugo-blog/content/writing/* blog-eleventy/src/writing/

# Gallery
cp -r hugo-blog/content/gallery/* blog-eleventy/src/gallery/

# Static pages
cp hugo-blog/content/about.md blog-eleventy/src/about.md
cp hugo-blog/content/link.md blog-eleventy/src/link.md
```

### 2. Front Matter Conversion

**Hugo Format:**
```yaml
---
title: "Judul Post"
date: 2023-07-24T17:32:00+07:00
lastmod: 2023-07-23T11:58:34.039+07:00
draft: false
toc: true
comments: false
tags:
  - academic
  - personal
---
```

**Eleventy Format:**
```yaml
---
title: "Judul Post"
date: 2023-07-24
lastmod: 2023-07-23
draft: false
toc: true
comments: false
tags:
  - academic
  - personal
---
```

Perubahan utama:
- `date` tidak perlu timezone format, cukup `YYYY-MM-DD`
- Tidak perlu `layout` di setiap file (sudah di-set via directory data file)
- `url: ""` dari Hugo tidak diperlukan

### 3. Page Bundles

Hugo dan Eleventy sama-sama support page bundles. Struktur folder tetap sama:

```
writing/
  2023/
    my-post/
      index.md
      image1.webp
      image2.webp
```

Eleventy akan otomatis copy gambar dengan config passthrough di `.eleventy.js`.

### 4. Shortcodes Conversion

**Hugo:**
```go
{{< photo src="image.webp" alt="Alt text" caption="Caption" >}}
```

**Eleventy:**
```njk
{% photo "image.webp", "Alt text", "Caption" %}
```

### 5. Static Files

Copy static files:

```bash
cp -r hugo-blog/static/img/* blog-eleventy/src/assets/img/
cp -r hugo-blog/static/docs/* blog-eleventy/src/assets/docs/
```

### 6. SCSS/CSS

Copy dan sesuaikan SCSS:

```bash
cp -r hugo-blog/assets/scss/* blog-eleventy/src/assets/scss/
```

### 7. Templates Mapping

| Hugo | Eleventy |
|------|----------|
| `layouts/_default/baseof.html` | `_includes/layouts/base.njk` |
| `layouts/_default/single.html` | `_includes/layouts/post.njk` |
| `layouts/_default/list.html` | `_includes/layouts/writing-list.njk` |
| `layouts/index.html` | `_includes/layouts/home.njk` |
| `layouts/partials/*.html` | `_includes/partials/*.njk` |
| `layouts/shortcodes/*.html` | Defined in `.eleventy.js` |

### 8. Template Syntax Conversion

**Variables:**
| Hugo | Eleventy (Nunjucks) |
|------|---------------------|
| `{{ .Title }}` | `{{ title }}` |
| `{{ .Content }}` | `{{ content \| safe }}` |
| `{{ .Date }}` | `{{ date }}` |
| `{{ .Site.Title }}` | `{{ site.title }}` |
| `{{ .Params.author }}` | `{{ author }}` |

**Loops:**
```go
// Hugo
{{ range .Pages }}
  <h2>{{ .Title }}</h2>
{{ end }}
```

```njk
{# Eleventy #}
{% for post in collections.writing %}
  <h2>{{ post.data.title }}</h2>
{% endfor %}
```

**Conditionals:**
```go
// Hugo
{{ if .Params.toc }}
  {{ .TableOfContents }}
{{ end }}
```

```njk
{# Eleventy #}
{% if toc %}
  {{ content | toc | safe }}
{% endif %}
```

### 9. Menu

Hugo menu di `config.toml` → Eleventy di `src/_data/site.json`

### 10. Taxonomies (Tags)

Tags di Eleventy otomatis generate collection. Buat halaman tags:

```md
---
layout: layouts/page.njk
title: Posts tagged "{{ tag }}"
pagination:
  data: collections
  size: 1
  alias: tag
  filter:
    - all
    - writing
    - gallery
permalink: /tags/{{ tag | slugify }}/
---

{% for post in collections[tag] %}
...
{% endfor %}
```

## Deployment

### Netlify

Buat `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "_site"

[build.environment]
  NODE_VERSION = "20"
```

### Vercel

Buat `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "_site"
}
```

## Resources

- [Eleventy Documentation](https://www.11ty.dev/docs/)
- [Nunjucks Templates](https://mozilla.github.io/nunjucks/)
- [Markdown-it](https://github.com/markdown-it/markdown-it)
