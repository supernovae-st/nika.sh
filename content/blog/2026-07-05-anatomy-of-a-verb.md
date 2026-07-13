---
slug: anatomy-of-a-verb
title: "Anatomy of a verb"
tag: Language
date: 2026-07-05
description: "infer, exec, invoke, agent: what makes the four verbs genuinely different execution models, in the engine's own verdicts."
---

The language locks at four verbs, and the [earlier post](/blog/four-verbs) made the case for why. This one is about the *what*: the rule says a verb is a distinct execution model, so it should be possible to point at the engine and show the distinction. Here is one file that uses all four, and what the audit actually says about each.

```yaml verbs-probe.nika.yaml
nika: v1
workflow: verbs-probe
model: ollama/llama3.2:3b

tasks:
  - id: think
    infer: { prompt: "one word", max_tokens: 8 }

  - id: run
    exec: { command: ["echo", "ok"] }

  - id: use
    depends_on: [run]
    invoke: { tool: "nika:read", args: { path: ./notes.md } }

  - id: loop
    depends_on: [think]
    agent: { prompt: "say done", tools: ["nika:read"], max_turns: 2 }

outputs:
  a: ${{ tasks.use.output }}
  b: ${{ tasks.loop.output }}
```

**infer generates.** Its execution model is a single model call: prompt in, text out. Because it spends tokens, it lives on the audit's COST line, and its budget knob is `max_tokens`: a ceiling on one generation. The audit even notices *wasted* generation: leave an infer's output unread and `nika check` raises a dead-spend hint, because a generation nothing consumes is money by definition.

**exec runs a process.** Its model is the operating system's: a program, arguments, an exit code. The honest form is the argv array `["echo", "ok"]`: the program and its arguments as data, not a shell string to quote-escape. It costs $0.00 on the COST line, and its permit is the `exec:` allow-list: which *programs* may start.

**invoke calls a tool and returns.** One request, one typed response: a builtin (`nika:read`) or any `mcp:` server, with declared args the audit checks key by key (the ARGS line). Its permit is the `tools:` allow-list, and when the tool touches the filesystem, the file pattern itself lands in `fs:`.

**agent loops.** The model *drives*: it thinks, picks a tool from its allow-list, reads the result, and goes again until the job is done or the leash ends. Two leashes, both in the file: `tools:` (what it may reach) and `max_turns` (how long it may drive). And its budget knob is different from infer's in exactly the way the semantics differ: `max_tokens_total`, a ceiling on the *whole loop*, because an agent that budgets per-call could still run forever.

The proof that these are four models and not four flavors is in the permits. Ask the checker to derive the boundary for the file above and it answers in three registers:

```text
permits:
  fs:
    read: ["./notes.md"]
  exec: ["echo"]
  tools: ["nika:read"]
```

Programs for exec. Tools for invoke and agent. Files for whatever touches disk. Each verb's blast radius has its own shape, which is precisely why the language needs them to be distinct words. A permission system can only be this legible when the execution models it guards are this separate.

Four verbs, four failure surfaces, four budget shapes, one readable file. That is the anatomy.
