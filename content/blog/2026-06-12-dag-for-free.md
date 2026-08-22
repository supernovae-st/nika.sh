---
slug: dag-for-free
title: "The plan you get for free"
tag: Engine
date: 2026-06-12
published: 2026-07-05
receipts:
  - https://github.com/supernovae-st/nika/commit/c929ee0dd9cd9c63ea1f207fb6148c009e6e441f
description: "The wiring is all you write: with: for data, after: for order. The plan falls out of the file: parallel waves, drawn before anything runs."
---

Every orchestration tool eventually grows a scheduler dialect: stages, barriers, fan-in nodes, retry graphs. You learn its vocabulary, you maintain its diagrams, and one day the diagram and the code disagree.

On June 12, the checker learned to compute exact parallel width and the points where a graph narrows. The useful part was not a new scheduler setting. It was a measurement derived from the workflow's existing edges.

**Nika has two edge doors: `with:` and `after:`.** A task names the data it consumes, or the state it waits on, and each declaration is an edge. Tasks whose edges are satisfied become eligible together. Waves, maximum width and pinch points are derived facts, not a second plan the author has to maintain.

```yaml release-radar.nika.yaml
nika: release-radar

tasks:
  changelog:
    invoke:
      tool: "nika:fetch"
      args:
        url: "https://nika.sh/changelog"

  repo_log:
    exec:
      command: ["git", "log", "--since=1 week"]

  digest:
    with:
      changelog: ${{ tasks.changelog.output }}
      repo_log: ${{ tasks.repo_log.output }}
    infer:
      prompt: "What changed this week: ${{ with.changelog }} ${{ with.repo_log }}"
```

Nothing in that file says parallel. `changelog` and `repo_log` become eligible together because nothing orders them; `digest` waits because its bindings say so. The data and the edge are one declaration: naming what you consume is what draws the graph. Add a third source tomorrow and the plan redraws itself. There is no stage to renumber or barrier to move.

## Data and control are not interchangeable

`with:` means the downstream task receives a value from another task. `after:` means it waits for a named terminal condition without importing that task's output.

The distinction matters during review. If a task only needs to run after cleanup, a data binding would invent a dependency on bytes it does not use. If a task consumes a result, a control edge alone would hide the value flow. Keeping both relations explicit lets the checker explain why an edge exists.

It also keeps failure semantics visible. A control edge can name the status it accepts. A data edge cannot pretend that a failed producer returned a valid value.

## The plan is a preflight result

The plan is drawn **before anything runs**. It is a verdict `nika check` can print for that exact file:

```text
 ✔ PLAN     2 wave(s) · 3 task(s) · max parallelism 2
```

A cycle is not a hang. It is a typed error naming its members. A ghost name in a `with:` binding is caught in the same pass. Width is bounded before dispatch rather than guessed from the number of tasks.

The runtime still owns concurrency limits and resource availability. Two tasks may be graph-eligible together without receiving CPU or provider capacity at the same instant. The derived plan describes dependency truth, not a timing guarantee.

## One source, several projections

The same graph can feed a terminal plan, a static diagram, cost analysis and runtime dispatch. Those are projections of one typed structure. If a UI rebuilt the graph from human log lines, it would create a second scheduler story and drift as soon as the renderer changed.

This is what “for free” means here. The plan is not free to execute, and concurrency is not unlimited. The author gets a reviewable plan without maintaining separate scheduling markup.

You never scheduled anything. The plan was in the file all along.
