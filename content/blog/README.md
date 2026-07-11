# The Nika blog, as a folder

This directory **is** the blog at [nika.sh/blog](https://nika.sh/blog). Each post is one Markdown file; the site compiles them at build time (`scripts/build-blog.mjs` → `src/content/blog.generated.ts`) and prerenders one page per post. Same words here and there — reading it on GitHub is reading the blog.

## Posts

| date | post | file |
|---|---|---|
| 2026-07-11 | The MCP server you didn't have to build | [`2026-07-11-the-mcp-server-you-didnt-build.md`](./2026-07-11-the-mcp-server-you-didnt-build.md) |
| 2026-07-11 | The chain of custody | [`2026-07-11-the-chain-of-custody.md`](./2026-07-11-the-chain-of-custody.md) |
| 2026-07-11 | The forecast is local | [`2026-07-11-the-local-forecast.md`](./2026-07-11-the-local-forecast.md) |
| 2026-07-11 | Written by agents, reviewed by you | [`2026-07-11-written-by-agents.md`](./2026-07-11-written-by-agents.md) |
| 2026-07-10 | The one-task re-run | [`2026-07-10-the-one-task-rerun.md`](./2026-07-10-the-one-task-rerun.md) |
| 2026-07-10 | The run that waits for you | [`2026-07-10-the-run-that-waits.md`](./2026-07-10-the-run-that-waits.md) |
| 2026-07-10 | The resume story | [`2026-07-10-the-resume-story.md`](./2026-07-10-the-resume-story.md) |
| 2026-07-08 | Prompts are code now | [`2026-07-08-prompts-are-code.md`](./2026-07-08-prompts-are-code.md) |
| 2026-07-08 | The prompt injection that goes nowhere | [`2026-07-08-injection-goes-nowhere.md`](./2026-07-08-injection-goes-nowhere.md) |
| 2026-07-07 | The run becomes evidence | [`2026-07-07-the-run-becomes-evidence.md`](./2026-07-07-the-run-becomes-evidence.md) |
| 2026-07-06 | Time travel, for real | [`2026-07-06-time-travel-for-real.md`](./2026-07-06-time-travel-for-real.md) |
| 2026-07-06 | The editor tells the truth | [`2026-07-06-the-editor-tells-the-truth.md`](./2026-07-06-the-editor-tells-the-truth.md) |
| 2026-07-06 | The credentials your pipeline was breaking | [`2026-07-06-the-credentials-your-pipeline-breaks.md`](./2026-07-06-the-credentials-your-pipeline-breaks.md) |
| 2026-07-06 | Media are workflow citizens | [`2026-07-06-media-are-workflow-citizens.md`](./2026-07-06-media-are-workflow-citizens.md) |
| 2026-07-06 | One wire, five servers | [`2026-07-06-one-wire-five-servers.md`](./2026-07-06-one-wire-five-servers.md) |
| 2026-07-05 | The secrets line | [`2026-07-05-the-secrets-line.md`](./2026-07-05-the-secrets-line.md) |
| 2026-07-05 | The cost line | [`2026-07-05-the-cost-line.md`](./2026-07-05-the-cost-line.md) |
| 2026-07-05 | Anatomy of a verb | [`2026-07-05-anatomy-of-a-verb.md`](./2026-07-05-anatomy-of-a-verb.md) |
| 2026-07-05 | The trace you can replay | [`2026-07-05-the-trace-you-can-replay.md`](./2026-07-05-the-trace-you-can-replay.md) |
| 2026-07-02 | No cloud needed | [`2026-07-02-own-your-stack.md`](./2026-07-02-own-your-stack.md) |
| 2026-06-29 | The plan you get for free | [`2026-06-29-dag-for-free.md`](./2026-06-29-dag-for-free.md) |
| 2026-06-22 | Four verbs are enough | [`2026-06-22-four-verbs.md`](./2026-06-22-four-verbs.md) |
| 2026-06-15 | Intent as Code: why your AI work should be a file | [`2026-06-15-intent-as-code.md`](./2026-06-15-intent-as-code.md) |
| 2026-06-04 | The blast radius is part of the file | [`2026-06-04-blast-radius-in-the-file.md`](./2026-06-04-blast-radius-in-the-file.md) |
| 2026-05-14 | A standard library, not a plugin store | [`2026-05-14-standard-library-not-plugin-store.md`](./2026-05-14-standard-library-not-plugin-store.md) |
| 2026-05-01 | An open spec, a copyleft engine | [`2026-05-01-open-spec-copyleft-engine.md`](./2026-05-01-open-spec-copyleft-engine.md) |
| 2026-04-14 | Starting over, on purpose | [`2026-04-14-starting-over-on-purpose.md`](./2026-04-14-starting-over-on-purpose.md) |
| 2026-03-21 | Naming the drum | [`2026-03-21-naming-the-drum.md`](./2026-03-21-naming-the-drum.md) |
| 2025-10-17 | The note that started it | [`2025-10-17-the-note-that-started-it.md`](./2025-10-17-the-note-that-started-it.md) |

Feed: [nika.sh/rss.xml](https://nika.sh/rss.xml)

## The format

```markdown
---
slug: url-slug            # /blog/<slug>
title: "The title"
tag: Origins | Manifesto | Language | Engine | Sovereignty | Security
date: 2026-01-01
description: "One honest sentence for the card + the feed."
series: trace-family       # optional · a reading path (registry in build-blog.mjs)
series_stop: custody       # required with series · this post's station on the line
---

Body in plain Markdown. A fenced ```yaml block may carry a filename
after the language (```yaml file.nika.yaml) — the site renders it as
the product's editor panel, copy button included.
```

Two conventions the build enforces:

- **A series ships complete.** `series:` names a registry entry (SERIES in
  `scripts/build-blog.mjs` — title, claim, ordered stops); `series_stop:` claims one
  stop. Unknown id, unknown stop, a stop claimed twice, or a declared stop with no
  post all fail the build — a reading path is never half-wired.
- **Counts derive from the spec.** A number that comes from the language canon is wrapped in `<!-- canon:… -->N<!-- /canon -->` markers; the compiler verifies it against `canon.yaml` and the build fails on drift. Never hand-type a count.
- **YAML is spec-correct.** Fenced workflow examples are real, runnable shapes, never pseudo-code.

Typos, clarity fixes, better examples: PRs welcome. Post *ideas* are best opened as a [discussion](https://github.com/supernovae-st/nika/discussions).
