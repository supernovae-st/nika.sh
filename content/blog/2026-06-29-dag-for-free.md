---
slug: dag-for-free
title: "The plan you get for free"
tag: Engine
date: 2026-06-29
description: "depends_on is all you write. The orchestration falls out of the graph: parallel waves, drawn before anything runs."
---

Every orchestration tool eventually grows a scheduler dialect: stages, barriers, fan-in nodes, retry graphs. You learn its vocabulary, you maintain its diagrams, and one day the diagram and the code disagree.

**Nika has one word: `depends_on`.** A task lists what it waits for. That is the entire scheduling surface. Everything else is derived: tasks whose dependencies are met run together, waves form on their own, and your file's maximum parallelism is a fact the engine computes, not a number you tune.

```yaml release-radar.nika.yaml
nika: v1
workflow: release-radar

tasks:
  - id: changelog
    invoke:
      tool: "nika:fetch"
      args:
        url: "https://nika.sh/changelog"

  - id: repo_log
    exec:
      command: "git log --since='1 week'"

  - id: digest
    depends_on: [changelog, repo_log]
    infer:
      prompt: "What changed this week: ${{ tasks.changelog.output }} ${{ tasks.repo_log.output }}"
```

Nothing in that file says parallel. `changelog` and `repo_log` start together because nothing orders them; `digest` waits because it says so. Add a third source tomorrow and the plan redraws itself: no stage to renumber, no barrier to move.

The plan is also drawn **before anything runs**. It is the first verdict `nika check` prints for that exact file:

```text
 ✔ PLAN     2 wave(s) · 3 task(s) · max parallelism 2
```

A cycle is not a hang, it is a typed error naming its members. A ghost name in `depends_on` is caught in the same pass. The graph the engine runs is the graph you read, and both come from three verbs and a list.

You never scheduled anything. The plan was in the file all along.
