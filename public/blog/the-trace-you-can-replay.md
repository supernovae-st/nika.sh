---
slug: the-trace-you-can-replay
title: "The trace you can replay"
tag: Engine
date: 2026-07-05
description: "Every run leaves a flight recorder: a deterministic AI audit trail you can replay like a film, never re-execute by accident."
series: trace-family
series_stop: replay
---

Ask most AI tooling what happened during a run and you get logs: interleaved, truncated, gone at the next rotation. Ask what *exactly* happened, in what order, at what cost, and the honest answer is usually a shrug.

Nika treats the question as part of the product. Every run can leave a **flight recorder**: a stream of typed events, one JSON object per line, from `workflow_started` to the final verdict.

```text
❯ nika run daily-brief.nika.yaml --json > run.ndjson
```

That file is the audit trail. Plain NDJSON on your disk: each event carries its id, timestamp, kind (`task_scheduled`, `task_started`, `task_finished`…) and typed fields. It is greppable, diffable, versionable: the same properties the workflow file itself has, extended to what the workflow *did*.

And then the part that makes it a recorder rather than a log:

```text
❯ nika trace replay run.ndjson
```

The run plays back **live**, in the same renderer as the original: the plan, the waves lighting up, the verdict card. The engine's own help text states the law in five words: *replay = re-render, NEVER re-execute*. Watching a trace can not fire a request, write a file, or spend a token. The recorder is read-only by construction, which is what makes it safe to hand to a colleague, attach to an incident, or open six months later.

`nika trace show` prints just the final card when you only need the verdict.

Why this matters compounds with everything else in the file:

**Same file, same steps, same order.** The plan is derived from the wiring, `with:` and `after:`, before anything runs, so two runs of the same file schedule identically. The trace makes that claim checkable: run it again, record it again, and diff the two NDJSON files like code. Determinism stops being a promise and becomes a property you can verify with tools you already have.

**The boundary is in the recording.** The trace opens by stating the permits context the run started under. An auditor reading the file sees not only what happened but what was *allowed* to happen: the blast radius and the actions, in one artifact.

**It closes the loop the site keeps drawing.** The workflow is a file you review before it runs. The trace is a file you review after it ran. Between the two, there is no moment where the work lives only in someone's scrollback.

Chats evaporate. Files compound. It turns out that holds for the runs, too.
