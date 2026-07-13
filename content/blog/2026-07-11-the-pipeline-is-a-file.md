---
slug: the-pipeline-is-a-file
title: "The pipeline is a file"
tag: Language
date: 2026-07-11
description: "An llm pipeline is a graph of model calls, tools and processes. A graph is declared, not programmed: forty lines of YAML replace the orchestration framework. Diffable, auditable, replayable."
---

An llm pipeline is a graph of model calls, tools and processes, wired by data dependencies. That is the whole definition. And the industry's default answer to "how do I build one" is a framework: pick an SDK, learn its abstractions, write the glue code that calls the model, passes the output, handles the retry. That is a program which *performs* the graph, step by imperative step.

But look at what a pipeline actually *is* for a second. The model call does not care what called it. The file write does not care what wrote the content. The only real structure is which task needs whose output. That is not behavior, that is a **shape**. Shapes are declared, not programmed.

Here is a release-notes pipeline, whole. It reads a changelog, summarizes it on a local model, saves the notes, and, on a separate branch, counts the changelog into a badge. Three verbs, two branches, zero glue:

```yaml release-notes.nika.yaml
nika: v1
workflow: release-notes
description: "Fetch the changelog, summarize it, badge the repo — one reviewable file"

model: ollama/llama3.2:3b

permits:
  fs:
    read: ["./CHANGELOG.md"]
    write: ["./notes.md", "./badge.json"]
  exec: ["wc"]
  tools: ["nika:read", "nika:write"]

tasks:
  - id: changelog
    invoke:
      tool: "nika:read"
      args: { path: "./CHANGELOG.md" }

  - id: size
    exec:
      command: ["wc", "-l", "./CHANGELOG.md"]

  - id: notes
    depends_on: [changelog]
    infer:
      prompt: |
        Turn this changelog into three plain sentences for release notes:
        ${{ tasks.changelog.output }}
      max_tokens: 300

  - id: save
    depends_on: [notes]
    invoke:
      tool: "nika:write"
      args: { path: "./notes.md", content: "${{ tasks.notes.output }}" }

  - id: badge
    depends_on: [size]
    invoke:
      tool: "nika:write"
      args: { path: "./badge.json", content: "${{ tasks.size.output }}" }

outputs:
  notes: ${{ tasks.notes.output }}
```

Now watch what the engine derives from that shape, before a single token is spent:

```text
❯ nika check release-notes.nika.yaml

 ✔ PLAN     3 wave(s) · 5 task(s) · max parallelism 2
      wave 1 changelog (invoke · nika:read) · size (exec · wc)
      wave 2 notes (infer · ollama/llama3.2:3b) · badge (invoke · nika:write)
      wave 3 save (invoke · nika:write)
 ✔ MODELS   1 model resolves in this binary
 ⚠  COST     $0.0000 – $0.0000 FLOOR (unbounded tasks present)
   notes  ollama/llama3.2:3b  UNBOUNDED — no catalog price (local/unknown model)
 ✔ SECRETS  no information-flow escapes
 ✔ PERMITS  body fits the declared boundary
 ✔ audited · 5 task(s) · 3 wave(s) · permits declared · est ≥$0.0000 · 0 hints
```

Read wave 2. An inference and a file write run *together*, because the graph says they can: `badge` descends from `size`, not from the model call. Nobody wrote a scheduler, a thread pool, an `asyncio.gather`. [The plan was always in the file](/blog/dag-for-free); declaring the shape is what lets the engine find it. And the same derivation prices the run (a local model, [honestly unpriced](/blog/the-local-forecast)) and checks every effect against the declared boundary. The audit is possible *because* the pipeline is data, not code. You cannot statically audit glue.

Go down the feature list of any orchestration framework and watch each one collapse into a line of this file. Model routing? `model:` is one line: swap `ollama/llama3.2:3b` for a cloud model and nothing else changes. Guardrails? The `permits:` block, [enforced before and during the run](/blog/injection-goes-nowhere). Cost tracking? The `COST` line, per task, at check time. Retries, timeouts? Fields on the task. Observability, resume, caching? The recorded trace: one file that is [evidence](/blog/the-run-becomes-evidence), [resume state](/blog/the-resume-story), forecast and custody at once. None of these are features *of a framework*; they are consequences of the pipeline being an artifact the engine can reason about.

The honest boundary: some agent work is genuinely dynamic. The model decides mid-flight what to do next, and no static graph can hold that. Nika gives that its own verb, `agent`, with a tool whitelist and a turn budget: the dynamic part is *contained in a task*, and the pipeline around it stays declared. What never needed to be dynamic (and it is most of what pipelines do all day) never needed to be code.

The payoff compounds because a file is a *thing*. It diffs: the review of a pipeline change is two red lines and one green line, not a walkthrough of a Python module. It replays: the run that used this file is a trace you can [verify line by line](/blog/the-chain-of-custody). It travels: mail it, commit it, hand it to a teammate. There is no environment to reproduce. And [your agent can write it](/blog/written-by-agents), because the format it has to learn is forty lines of YAML with four verbs, not a framework API.

The next pipeline you sketch, try writing the *shape* first: the tasks, and who needs whose output. You will find the file was the whole program.
