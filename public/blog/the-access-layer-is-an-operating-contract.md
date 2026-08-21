---
slug: the-access-layer-is-an-operating-contract
title: "The access layer is an operating contract"
tag: Engine
date: 2026-08-20
description: "From v0.108.0 to v0.111.0, Nika separated the model you choose from the path that reaches it, cut the workflow language to its durable core, added an explicit scheduler and turned check into an authoring loop."
---

Four releases landed in two weeks, and reading only the feature names makes them look unrelated. Access paths. A smaller envelope. An arming registry. A richer check response. Underneath, they are one change: **the path from authored intent to an effect became explicit enough to inspect, pin and refuse.**

The quickest way to see it is a command that arrived in v0.108.0:

```text
nika run brief.nika.yaml --access local
```

The workflow still chooses its intelligence with `model:`. The new flag chooses how the engine may reach that intelligence. That distinction sounds small until one model can be available through several routes: a local runtime, a test double, an agent harness, an OAuth session or a provider API. A model name answers *what*. An access path answers *how*.

Before the access layer, those answers could collapse into one provider branch. If the preferred route was unavailable, a runtime had a dangerous temptation: try another. That is convenient right until the substitute has a different billing account, trust boundary or custody story. Nika's pin refuses that temptation. If the requested access path is not satisfied on this machine, the run stops before its prologue, before a trace event and before spend. A pin never means “best effort”.

Without a pin, the admission-time resolver uses a deterministic order. It does not depend on enum order or whichever probe returned first. Every rejected candidate carries a witness that says which dimension failed and what the operator can do next. `nika check --json` exposes the plan, `nika explain` renders it for a person, and the run header names an explicit pin. The same decision is visible before, during and after the run.

That was v0.108.0: `model:` chooses the intelligence; access chooses the path. The release also closed a security hole in the zero-authority scan. A shell-string `exec:` without `permits:` had been deferred to runtime because the checker could not extract a safe program allowlist from a string. The correction was conceptual: the checker may not know the program, but it does know the workflow requests the `exec` capability. Both the argv and shell forms now require declared authority. Unknown detail may defer. A known capability category may not.

## The language gets smaller

v0.109.2 applied the same discipline to the file itself. The workflow envelope became:

```text
nika · model · inputs · const · secrets · permits · run · tasks · outputs
```

The identity moved onto the first line:

```yaml identity.nika.yaml
nika: identity

permits:
  tools: ["nika:jq"]

tasks:
  answer:
    invoke:
      tool: "nika:jq"
      args:
        expression: "."
        input: "the file names itself"
```

There is no `workflow:` wrapper, no duplicate `id:`, and no description field whose prose never changed execution. Deployment values became optional typed inputs with defaults. Output extraction moved next to the verb that produces it. Cleanup became a real task on an `unwind` edge, so it passes through the same graph laws as every other task. Fan-out controls moved inside `for_each:`, where their scope is visible.

This was a pre-1.0 flag day. The release did not pretend an old file meant the new thing. `nika check --fix` migrates only transformations it can make without guessing, such as the identity and older task-map shapes. It stops on changes that require authorial judgment. Converting a cleanup mini-language into a task or deciding whether a former config value is really an input is not formatting. The refusal teaches the destination and leaves the source untouched.

Two security fixes explain why this subtraction mattered. Expressions stopped seeing the ambient process environment, so a “pure” computation sees only its declared input. Receipt fields were terminal-escaped before rendering, closing a clipboard-control path from third-party evidence. A smaller grammar is not only easier to teach. It leaves fewer shadow authorities where data or behavior can hide.

v0.109.2 also added the project file, `nika.yaml`. A workflow says what one run means. A project file holds decisions shared by runs: the default cost ceiling, trace retention, the minimum registry policy and the team's future scheduling declarations. It deliberately does not carry a model seat or workflow permits. Those belong to the portable workflow, not the checkout that happens to contain it.

One project-level change is especially important on servers. If a workflow declares `permits:` and starts an `exec` or stdio MCP child, the default sandbox policy no longer degrades silently when the host has no confinement backend. It refuses. On Linux, `nika doctor` names the missing bubblewrap installation. An explicit `NIKA_SANDBOX=off` waiver remains possible, but the trace records that waiver. The system distinguishes “the contract was enforced” from “the operator chose to bypass it”.

## The file proposes; the machine disposes

v0.110.0 gave the project file an `arm:` registry. The French keys are intentional because the sentence governing the design is precise: *le fichier propose, la machine dispose*. The file proposes a cadence. The machine still decides whether a tick is due, within budget, allowed to overlap and eligible for catch-up.

No schedule is armed by writing a cron string alone. Each beat must name its workflow, cadence, execution place, per-tick ceiling and missed-run policy. The cost ceiling and miss policy have no defaults because choosing either would choose who pays or which deliverable disappears. A suspended beat must carry a reason and an end date. Silence is never the status of scheduled work.

All launch doors converge on one firer. A direct `nika arm fire`, a generated launchd or systemd unit, and the resident `nika serve` loop ask the same due-window, lock, overlap and ceiling logic. This prevents the operational version of a split brain where a manual run obeys one policy and a daemon another. The arming release also made its limits explicit: unsupported overlap, catch-up and cloud-placement policies refuse instead of approximating a behavior.

That is access control at a different scale. v0.108 chooses the route to a model. v0.109.2 chooses the authority of a run and the defaults of a project. v0.110 chooses when the machine may turn a proposed beat into an admitted run. Each layer is inspectable before it acts.

## Check becomes a conversation

v0.111.0 closed the loop for the author. A valid workflow is not necessarily ready for a paid run. `nika check --json` now separates those states with `paid_ready`, `compiled` and `next`.

`compiled` means the file's law was proven by the checker. `paid_ready` stays false while a paid-run hint remains unresolved. `next` is the first concrete repair. An editor, a CI job or an agent no longer has to scrape prose and guess which warning matters first. The machine answer says what is true now and the next smallest move toward a stronger state.

The release also made `nika:inspect` live. A running workflow can read the DAG that was seeded at run start, then observe records and spend after each wave. Inspection is not a second scheduler. It is a read surface over the same shared run state the dispatcher updates. `nika:compose` was added only inside an agent loop and only after `nika:done` is granted. The model may draft a child workflow, receive the full check response and iterate until valid. A standalone invoke refuses. Checking a draft never executes it.

Put the releases together and the product direction becomes clearer:

1. The author chooses a model, and the engine exposes the access path separately.
2. The workflow carries only the language fields that affect meaning.
3. The project proposes schedules without smuggling in run authority.
4. The checker returns a repair protocol, not just a Boolean.
5. The trace records the path, policy and waivers that actually admitted the run.

This is what “Intent as Code” needs after the syntax is solved. Code is not valuable only because it can execute. It is valuable because resolution, admission, authority and history can all be reviewed at their proper layer. The access layer makes those layers visible. The releases after it make them operable.

Read the [v0.108.0](/releases/v0.108.0), [v0.109.2](/releases/v0.109.2), [v0.110.0](/releases/v0.110.0) and [v0.111.0](/releases/v0.111.0) release records, or see why a green parse can still be [not ready to spend](/blog/clean-is-not-ready-to-spend).
