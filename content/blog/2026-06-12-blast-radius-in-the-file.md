---
slug: blast-radius-in-the-file
title: "The blast radius is part of the file"
tag: Security
date: 2026-06-12
published: 2026-07-05
receipts:
  - https://github.com/supernovae-st/nika-spec/commit/11c58d9692621de99c5cfb2ed1a5f8581182489d
  - https://github.com/supernovae-st/nika/commit/7c6cd9ceb9350355e899bc454b08ec34c0319290
description: "The workflow declares its effect boundary before execution. Static checks explain the fit; runtime sinks enforce what the host can prove."
---

Ask an agent framework what its agent may touch, and the honest answer is usually: whatever the process may touch. The permission model is the operating system's, the audit is a log file, and the log is written after the damage.

Nika's public permits contract landed on June 11. Runtime enforcement reached the process sink on June 12. The two commits matter together: a declaration without enforcement is documentation, and enforcement without a declaration is ambient policy a reviewer cannot see in the workflow.

In Nika, the boundary is a block in the file you review:

```yaml daily-brief.nika.yaml
nika: daily-brief

permits:
  fs:
    read: [ ./notes/* ]
    write: [ ./brief.md ]
  tools: [ "nika:read", "nika:write" ]

tasks:
  notes:
    invoke:
      tool: "nika:read"
      args:
        path: ./notes/today.md

  save:
    with:
      notes: ${{ tasks.notes.output }}
    invoke:
      tool: "nika:write"
      args:
        path: ./brief.md
        content: "${{ with.notes }}"
```

## Declaration and enforcement are different jobs

**`permits:` is the workflow's declared list.** It is not a suggestion or a profile name. Once the block is present, unlisted capabilities are denied within the categories and host enforcement the current runtime supports: files, tools, programs and network destinations.

A reviewer reads that declared blast radius in the diff, next to the logic it serves. The checker compares statically visible effects with the declaration. Runtime sinks judge the effective operation again when the task reaches them. The operating system provides the outer process boundary where the platform adapter supports it.

Those layers must not be collapsed into one claim. A path that fits a YAML pattern is not automatically a held file descriptor. A declared host is not proof that every child process has network confinement. A production guide must therefore name both the workflow boundary and the host prerequisite.

**Denied means before.** A step that reaches outside the list fails with a typed error, `NIKA-SEC-004`, before the effect happens. Not logged after the fact, not flagged for Monday's incident review: the write to `~/.ssh/config` simply never runs.

The phrase “before the effect” is the important part. A green task followed by a warning would not be a permission system. The refusal has to occur at the sink that owns the operation, before the process spawn, file change or admitted network request.

## Inference proposes, review decides

`nika check --infer-permits` reads the statically visible plan and proposes a boundary. It also has to remain honest about dynamic paths, redirected requests and values that cannot be resolved before execution. The result is a starting point for review, not a proof that every future runtime value has been discovered.

That order is deliberate:

1. the workflow states its effects;
2. the checker derives what it can see;
3. a person reviews any widening and any unknown;
4. runtime enforcement judges the effective operation;
5. the trace records the verdict.

An agent may help draft the list. It does not get to turn an unknown target into permission by describing it confidently.

Capability declarations next to intent. It is one of the oldest ideas in security, applied to the newest way of doing work.
