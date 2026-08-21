# Daily blog workflow

`daily-blog.nika.yaml` turns one Nika feature or workflow problem into a
research-backed Markdown candidate. Ahrefs measures search demand, Firecrawl
reads the current result set, and Perplexity builds a cited research record.
The workflow then drafts, audits, applies a deterministic quality law, and
writes `out/editorial/daily-blog.md`.

The workflow does not push or deploy. Publication is off by default. With
`publish=true`, a human confirmation is still required before the file is
written into `content/blog`.

## Prerequisites

- Nika 0.111.0 or newer.
- MCP server ids `ahrefs`, `firecrawl`, and `perplexity` configured in
  `.nika/mcp_servers.json` and pinned with `nika mcp approve`.
- `AHREFS_API_KEY`, `FIRECRAWL_API_KEY`, `PERPLEXITY_API_KEY`, and the model
  provider key available to those processes.

Run the operating preflight before the first paid execution and after every
Nika or MCP server update:

```sh
nika doctor
nika check scripts/editorial/daily-blog.nika.yaml --native-strict --plain
```

Review any MCP tool-schema drift before accepting it. Re-pin each reviewed
server with `nika mcp approve <server>`. API keys stay in the environment of
their provider or MCP process. They never belong in the workflow, scheduler
arguments, or a trace.

## One candidate

```sh
nika run scripts/editorial/daily-blog.nika.yaml \
  --var topic="paid-ready AI workflows" \
  --var slug="paid-ready-ai-workflows" \
  --var date="2026-08-21" \
  --max-cost-usd 2
```

Review `out/editorial/daily-blog.md`. To allow the publication gate, repeat the
run with `--var publish=true`. A non-interactive release job can answer the
same gate explicitly with `--answer approve=true`, but should do so only after
its own review step.

## Daily operating contract

The scheduler owns the topic backlog. For every UTC day, it selects one
unpublished topic and slug, then runs the same candidate-only command with
`publish=false` and `--max-cost-usd 2`. A cron, CI, or desktop automation can
use this command body:

```sh
nika run scripts/editorial/daily-blog.nika.yaml \
  --var topic="$NIKA_DAILY_TOPIC" \
  --var slug="$NIKA_DAILY_SLUG" \
  --var date="$(date -u +%F)" \
  --var publish=false \
  --max-cost-usd 2
```

`NIKA_DAILY_TOPIC` and `NIKA_DAILY_SLUG` must come from the reviewed public
editorial backlog. Empty, repeated, or already-published entries are scheduler
errors. The daily job creates a candidate and a trace only. It never commits,
pushes, deploys, or auto-approves publication.

After a run, use `nika trace ls` to locate its receipt and
`nika trace verify <trace>` to check the journal. Export an audit pack with
`nika trace evidence <trace>`. Retention can prune old unstarred runs with
`nika trace rm --older-than <duration>`, after evidence has been archived.

After a post lands, regenerate all three public projections:

```sh
node scripts/build-blog.mjs
node scripts/build-og-card.mjs <slug>
node scripts/build-palette.mjs
```

One scheduled invocation equals one daily candidate. Publication remains a
separate reviewed action.
