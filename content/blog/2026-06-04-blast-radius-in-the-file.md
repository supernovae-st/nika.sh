---
slug: blast-radius-in-the-file
title: "The blast radius is part of the file"
tag: Security
date: 2026-06-04
description: "permits: is the whole list, guardrails an agent can't talk past. Everything not on it is denied before it runs, with a named error."
---

Ask an agent framework what its agent may touch, and the honest answer is usually: whatever the process may touch. The permission model is the operating system's, the audit is a log file, and the log is written after the damage.

In Nika, the boundary is a block in the file you review:

```yaml daily-brief.nika.yaml
nika: v1
workflow: daily-brief

permits:
  fs:
    read: [ ./notes/* ]
    write: [ ./brief.md ]
  tools: [ "nika:read", "nika:write" ]

tasks:
  - id: notes
    invoke:
      tool: "nika:read"
      args:
        path: ./notes/today.md

  - id: save
    depends_on: [notes]
    invoke:
      tool: "nika:write"
      args:
        path: ./brief.md
        content: "${{ tasks.notes.output }}"
```

**`permits:` is the whole list.** Not a suggestion, not a default profile. Once the block is present, every category is default-deny: which files it may read and write, which tools it may call, which programs, which hosts. A reviewer reads the blast radius in the diff, right next to the logic it serves.

**Denied means before.** A step that reaches outside the list fails with a typed error, `NIKA-SEC-004`, before the effect happens. Not logged after the fact, not flagged for Monday's incident review: the write to `~/.ssh/config` simply never runs.

And you do not hand-write the list. `nika check --infer-permits` reads the plan and prints the tightest boundary it needs. You loosen it deliberately, line by line, in review, which is where loosening belongs.

Capability declarations next to intent. It is one of the oldest ideas in security, applied to the newest way of doing work.
