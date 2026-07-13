---
slug: the-cost-line
title: "The cost line"
tag: Engine
date: 2026-07-05
description: "The audit prices every token before it is spent: ceilings on generations, budgets on loops, and a $0.00 that means it."
---

Every AI bill has the same shape: you find out what it cost after it cost it. The meter runs during the work, the invoice explains it later, and the only budget control is the sinking feeling.

Nika moves the question to before. The second verdict `nika check` prints, right under the plan, is the cost line:

```yaml cost-probe.nika.yaml
nika: v1
workflow:
  id: cost-probe
model: mistral/mistral-small

tasks:
  bounded:
    infer: { prompt: "one word", max_tokens: 200 }

  loop:
    depends_on: [bounded]
    agent: { prompt: "say done", tools: ["nika:read"], max_turns: 3, max_tokens_total: 4000 }

outputs:
  out: ${{ tasks.loop.output }}
```

```text
 ✔ COST     $0.0025 – $0.0025 worst-case ceiling
   bounded  mistral/mistral-small  ≤200 tk   $0.0001
   loop     mistral/mistral-small  ≤4000 tk  $0.0024
```

That is not an estimate of what the run *will probably* cost. It is a **worst-case ceiling**, computed from the declared budgets and the provider's catalog price, per task, before a single token moves. The file caps the spend; the audit does the multiplication.

Three details make the line honest rather than decorative:

**Each verb budgets in its own shape.** An `infer` caps one generation: `max_tokens`. An `agent` caps the *whole loop*: `max_tokens_total`, because a loop that budgets per-call could still run forever on your card. The two knobs differ exactly where the execution models differ ([the anatomy post](/blog/anatomy-of-a-verb) walks all four).

**Unbounded is a named state, not a silence.** Drop the budgets and the line does not guess: it prints `UNBOUNDED`, names the missing knob, and hints the fix, task by task. Same for a local model with no catalog price. The audit refuses to invent a number it cannot stand behind; it tells you which number is missing instead.

**Waste is caught before it is spent.** Leave an `infer` whose output nothing reads and the audit raises a dead-spend hint: every token that generation would burn is unread by construction. It is a strange kind of luxury, being told about the pointless spend while it is still zero dollars.

And when a workflow has no inference at all, pure `exec` and `invoke`, the line says `$0.00` and means it, because the only things that cost tokens are the verbs that think.

The pattern is the site's whole thesis applied to money. The plan is reviewable before it runs; the permissions are enforced before the effect; and the spend is bounded before the meter starts. A file you can read, with a bill you can read *first*.
