---
slug: dag-for-free
title: "The plan you get for free"
tag: Engine
date: 2026-06-29
description: "The wiring is all you write: with: for data, after: for order. The plan falls out of the file: parallel waves, drawn before anything runs."
---

Every orchestration tool eventually grows a scheduler dialect: stages, barriers, fan-in nodes, retry graphs. You learn its vocabulary, you maintain its diagrams, and one day the diagram and the code disagree.

**Nika has two doors: `with:` and `after:`.** A task names the data it consumes, or the state it waits on, and each declaration is an edge. That is the entire scheduling surface. Everything else is derived: tasks whose edges are satisfied run together, waves form on their own, and your file's maximum parallelism is a fact the engine computes, not a number you tune.

```yaml release-radar.nika.yaml
nika: v1
workflow:
  id: release-radar

tasks:
  changelog:
    invoke:
      tool: "nika:fetch"
      args:
        url: "https://nika.sh/changelog"

  repo_log:
    exec:
      command: ["git", "log", "--since='1", "week'"]

  digest:
    with:
      changelog: ${{ tasks.changelog.output }}
      repo_log: ${{ tasks.repo_log.output }}
    infer:
      prompt: "What changed this week: ${{ with.changelog }} ${{ with.repo_log }}"
```

Nothing in that file says parallel. `changelog` and `repo_log` start together because nothing orders them; `digest` waits because its bindings say so. The data and the edge are one declaration: naming what you consume is what draws the graph. Add a third source tomorrow and the plan redraws itself: no stage to renumber, no barrier to move.

The plan is also drawn **before anything runs**. It is the first verdict `nika check` prints for that exact file:

```text
 ✔ PLAN     2 wave(s) · 3 task(s) · max parallelism 2
```

A cycle is not a hang, it is a typed error naming its members. A ghost name in a `with:` binding is caught in the same pass. The graph the engine runs is the graph you read, and both come from three verbs and their wiring.

You never scheduled anything. The plan was in the file all along.
