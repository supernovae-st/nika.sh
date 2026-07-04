# The Nika blog, as a folder

This directory **is** the blog at [nika.sh/blog](https://nika.sh/blog). Each post is one Markdown file; the site compiles them at build time (`scripts/build-blog.mjs` → `src/content/blog.generated.ts`) and prerenders one page per post. Same words here and there — reading it on GitHub is reading the blog.

## Posts

| date | post | file |
|---|---|---|
| 2026-06-22 | Four verbs are enough | [`2026-06-22-four-verbs.md`](./2026-06-22-four-verbs.md) |
| 2026-06-15 | Intent as Code: why your AI work should be a file | [`2026-06-15-intent-as-code.md`](./2026-06-15-intent-as-code.md) |

Feed: [nika.sh/rss.xml](https://nika.sh/rss.xml)

## The format

```markdown
---
slug: url-slug            # /blog/<slug>
title: "The title"
tag: Manifesto | Language | Engine | Sovereignty
date: 2026-01-01
description: "One honest sentence for the card + the feed."
---

Body in plain Markdown. A fenced ```yaml block may carry a filename
after the language (```yaml file.nika.yaml) — the site renders it as
the product's editor panel, copy button included.
```

Two conventions the build enforces:

- **Counts derive from the spec.** A number that comes from the language canon is wrapped in `<!-- canon:… -->N<!-- /canon -->` markers; the compiler verifies it against `canon.yaml` and the build fails on drift. Never hand-type a count.
- **YAML is spec-correct.** Fenced workflow examples are real, runnable shapes, never pseudo-code.

Typos, clarity fixes, better examples: PRs welcome. Post *ideas* are best opened as a [discussion](https://github.com/supernovae-st/nika/discussions).
