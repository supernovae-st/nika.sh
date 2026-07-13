---
slug: the-one-task-rerun
title: "The one-task re-run"
tag: Engine
date: 2026-07-10
description: "Regenerate one block without re-running the world: --task scopes a fresh run to a task and its upstream, --from re-rolls what the hashes cannot see."
---

Every pipeline has this moment: one block is wrong. The page rendered from stale data, one summary came out weird, one artifact needs regenerating. And the tool gives you exactly one lever: run it all again. Every upstream API call re-billed, every finished artifact rewritten, ten minutes of pipeline for one second of fix.

Make solved this for C files in 1976. Nika gives the same move to AI pipelines, with two levers instead of one, because "re-run one block" is actually two different requests.

Here is a small build with a diamond in it: fetch feeds render feeds index, and an asset-packing branch that depends on none of them.

```yaml site-build.nika.yaml
nika: v1
workflow:
  id: site-build
  description: "Fetch the data, render the page, index it - and pack assets on the side"

permits:
  fs:
    read: ["./data.txt", "./page.txt", "./assets.txt"]
    write: ["./data.txt", "./page.txt", "./index.txt", "./assets.gz"]
  exec: ["date", "cat", "wc", "gzip"]

tasks:
  fetch_data:
    exec:
      command: ["date", "-u", "+data@%H:%M:%S"]

  render_page:
    depends_on: [fetch_data]
    exec:
      command: ["cat", "./data.txt"]

  build_index:
    depends_on: [render_page]
    exec:
      command: ["wc", "-c", "./page.txt"]

  # independent branch - no deps on the chain above
  compress_assets:
    exec:
      command: ["gzip", "-kf", "./assets.txt"]

outputs:
  index: "${{ tasks.build_index.output }}"
```

**Lever one: regenerate this block.** `--task` scopes a fresh run to one task and its transitive upstream. Nothing else exists for this run:

```text
❯ nika run site-build.nika.yaml --task render_page

  🦋 nika · site-build · 2 tasks
     permits ✓ declared boundary · default-deny

  ✔  fetch_data   exec · date  5ms
  ✔  render_page  exec · cat  3ms
  ── 2/2 done · $0.00 · elapsed 0.0s ─────────────────────────────
```

Read the header: **2 tasks**. The full file declares four; the scoped plan re-derives to the ancestor sub-DAG: `fetch_data` because `render_page` needs it, and nothing more. `build_index` (downstream) never runs. `compress_assets` (the independent branch) never runs. The cost line re-derives for exactly what will run, and the workflow's `outputs:` are skipped, since they may read tasks that are not part of this run and the engine will not fabricate them.

**Lever two: trust nothing from here on.** Resume normally skips finished work by identity, [the task as written](/blog/the-resume-story). But some changes live outside the hashes: a rotated secret, external state that moved, an inference you want to re-roll. `--from` forces a task *and its transitive downstream* to re-run even on an identity match:

```text
❯ nika run site-build.nika.yaml \
    --resume full.ndjson --from render_page

  ↷  fetch_data       cache hit (resume)
  ↷  compress_assets  cache hit (resume)
  ✔  render_page      exec · cat  3ms
  ✔  build_index      exec · wc  2ms
  ── 4/4 done · $0.00 · elapsed 0.0s ─────────────────────────────

  resumed · 2 skipped (cache hit) · 2 ran live
```

The mirror image of lever one. Upstream stays cached (`↷`, by name, visibly), the forced task and everything that depends on it runs live. The independent branch stays cached too: `compress_assets` never depended on the render, so distrusting the render says nothing about it. The DAG is the blast radius of your doubt.

Note what `--from` requires: `--resume <trace>`. That is not ceremony. It is the same pairing law the [approval gate](/blog/the-run-that-waits) rides: a re-roll is always *relative to a specific recorded run*, and there is no such thing as "re-run from here" of nothing in particular. The trace names what "here" means.

And the two levers are deliberately disjoint: the CLI refuses `--task` with `--resume`. They answer different questions at different moments. `--task` is *before*: build me this block, fresh, minimum footprint. `--from` is *after*: that recorded run is fine up to here, and from here I trust nothing. One is a scalpel for the plan, the other a scalpel for the past.

Both levers read the same file everyone reviewed. Nobody wrote a `--skip-steps 3,4,7` incantation in a runbook; nobody commented out half the pipeline to nurse one block through. The dependency graph you already declared *is* the re-run logic. That is the quiet payoff of intent as code: you stop maintaining two descriptions of the same pipeline, one for the tool and one for the emergencies.
