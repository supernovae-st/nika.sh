---
slug: the-agent-workflow-spectrum
title: "The agent workflow spectrum"
tag: Language
date: 2026-07-11
description: "An ai agent workflow is any pipeline where a model chooses some of the steps. Every design sits between a declared graph and a free loop. Where yours lands decides which safety you can even ask for."
---

An ai agent workflow is any pipeline where a model chooses some of the steps. That single property splits the whole design space into a spectrum with two poles. At one end, the **declared graph**: every task and edge written down before anything runs, [the pipeline that is a file](/blog/the-pipeline-is-a-file), which an engine can schedule, price and audit statically. At the other, the **free loop**: the model reads, decides, acts, repeats. Maximally flexible, and nothing about it can be known in advance, which is why its failures make headlines.

Neither pole is "the right way to build agents." The design question is narrower and more useful: *which of your steps actually need a model's judgment at runtime?* Most steps do not: read these files, call this tool, save that output. Some genuinely do: triage, research, review, anything where the path depends on what the content turns out to say. The spectrum is not a choice of tool. In a Nika file it is a per-task choice of verb: `infer` when you know the shape of the step, `agent` when you do not.

What makes the dynamic end shippable is that the freedom is **contained in a task**. Here is the workflow this post ran, instantiated from the engine's own `agent-loop` template (`nika new --from agent-loop`), whose header states the doctrine outright: *"Three leashes (NEVER ship an unleashed agent): `tools:` default-deny — grant the MINIMUM; `max_turns` + `max_tokens_total` — the worst case is bounded; `schema:` — the final message is TYPED, prose is not a contract."*

```yaml notes-triage.nika.yaml
nika: v1
workflow:
  id: notes-triage
  description: "Read the status notes, return a typed triage"

model: ollama/llama3.2:3b

permits:
  fs:
    read: ["./notes.txt"]
  exec: false
  tools: ["nika:assert", "nika:done", "nika:read"]

vars:
  goal:
    type: string
    required: true
    description: "What the agent must accomplish"

tasks:
  plan:
    infer:
      prompt: "Break '${{ vars.goal }}' into at most 4 concrete steps."
      max_tokens: 400
      schema:
        type: object
        required: [steps]
        additionalProperties: false
        properties:
          steps: { type: array, items: { type: string } }

  execute:
    with:
      steps: ${{ tasks.plan.output.steps }}
    agent:
      model: ollama/qwen2.5:14b
      system: "Work the plan step by step. Read ./notes.txt with nika:read, then call nika:done with your final answer."
      prompt: "Plan · ${{ with.steps }}"
      tools:
        - "nika:read"
        - "nika:done"
      max_turns: 6
      max_tokens_total: 20000
      schema:
        type: object
        required: [findings]
        additionalProperties: false
        properties:
          findings: { type: array, items: { type: string } }

  confirm:
    with:
      findings: ${{ tasks.execute.output.findings }}
    invoke:
      tool: "nika:assert"
      args:
        condition: "${{ size(with.findings) > 0 }}"
        message: "Agent returned no findings, do not trust an empty run"

outputs:
  findings:
    value: ${{ tasks.execute.output.findings }}
```

Read the shape of the spectrum in one file. `plan` is an `infer`: the step's shape is known, so it gets a schema and a 400-token ceiling. `execute` is the `agent`: a 14B with exactly two tools, six turns, twenty thousand tokens, and a typed final-message contract. `confirm` is a plain assert that refuses an empty triage. Even the first draft's sloppiness was caught before running: `nika check` opened with five hints (a missing token ceiling, two schemas that admitted undeclared keys, no permits boundary) and closed at one after the tightening. The audit coaches the leashes on.

Then we ran it, and this is the part worth being honest about: **my laptop never produced a green agent run.** What it produced was better evidence.

Run one, the provider's HTTP ceiling killed the model call. The failure came back typed, `NIKA-INFER-001 · provider API error (408)`, and the downstream tasks were `⊘ blocked`, not executed on garbage. Run two, a smaller model answered *fast*, with a Python-dict string instead of the declared object. The schema leash refused it at the boundary: *agent final message failed schema validation*. The model was confident; the contract said no. Prose is not a contract, enforced live. Run three, the bigger model got to work. The flight recorder shows the loop's real anatomy, `agent_tools_selected → agent_budget_checkpoint → tool_invoked` (it read the notes, one turn done). Then it hit the provider ceiling mid-loop. Typed again, blocked again.

And threaded through all three: `↷ plan cache hit (resume)`. The finished planning step [never ran twice](/blog/the-resume-story) across a whole afternoon of failures. Total damage from three failed agent runs on an under-powered machine: zero files touched outside the boundary, zero surprise spend, zero mystery. Three traces you can [verify line by line](/blog/the-chain-of-custody), each naming exactly which leash held.

That is the pitch of bounded autonomy, stated without the demo-day gloss: the leashes are not there to make a strong model stronger, they are there to make *trying an agent cheap*. It is [the same division of labor that made a weak model safe to let write](/blog/written-by-agents), extended to letting one act. When the model is too small for the job, you find out through a typed error and a capped bill, not an incident. And when you want the muscle, the upgrade is one line (the `model:` inside the agent task) while every leash stays exactly where it was.

So place your next workflow on the spectrum honestly. Write the steps whose shape you know as `infer`, `exec`, `invoke`: the declared graph does the scheduling, the pricing, the audit. Give the genuinely open-ended step to `agent`, leashed. The file stays reviewable end to end, and the part of it that thinks for itself does so inside a fence you wrote.
