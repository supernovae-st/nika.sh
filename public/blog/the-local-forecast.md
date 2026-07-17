---
slug: the-local-forecast
title: "The forecast is local"
tag: Engine
date: 2026-07-11
description: "explain --forecast computes duration and cost priors from your own recorded runs: stats over .nika/traces/, honest ranges at two runs, percentiles at five. Never a model call, never the network."
series: trace-family
series_stop: forecast
---

Two questions decide whether a pipeline is safe to re-run: how long will it take, and what will it cost? The industry's answer is a dashboard: ship your telemetry to somebody's cloud, and they will sell your own history back to you as graphs. Nika's answer is a flag:

```text
❯ nika explain site-build.nika.yaml --forecast

  FORECAST · based on last 5 runs (window 50 runs / 30 days) · low confidence (n<10)
    fetch_data       3ms–24ms               —          1 cache hit
    render_page      ~8ms (p90 11ms)        —
    build_index      ~5ms (p90 16ms)        —
    compress_assets  4ms–13ms               —          1 cache hit
    ─────────────────────────────────────────────────
    run              ~30ms (p90 53ms)       —
    estimates vary with `when` branches, inputs, and provider latency
```

That is [the four-task build from the re-run post](/blog/the-one-task-rerun), run five times on a laptop. Every number in the table is a statistic over those five recorded runs, nothing else. Per task: the typical duration and the p90 tail. Per task, too: how often a run never paid for it at all (`1 cache hit` means resume skipped it). At the bottom, the whole run's prior. And the last line is the tool lowering your confidence on purpose: estimates vary, branches branch, providers have moods.

The numbers are *earned*, and the table says how much. At two runs you get honest ranges (`42.0s–1m00s`: the min and max, because two points make an interval, not a distribution). At five, the percentiles arrive. The header names its own weight the whole way, `based on last 5 runs · low confidence (n<10)`, and the window it reads: the last 50 runs, the last 30 days, whichever ends first. A forecast that tells you how little it knows is worth more than a confident one that won't.

It prices inference the same way. Here is a three-task digest that reads a status file, runs one small `infer` on a local model, and writes the result:

```yaml digest.nika.yaml
nika: v1
workflow:
  id: digest
  description: "Read the notes, draft a one-line digest, save it"

model: ollama/llama3.2:3b

permits:
  fs:
    read: ["./notes.txt"]
    write: ["./digest.md"]
  exec: false
  tools: ["nika:read", "nika:write"]

tasks:
  notes:
    invoke:
      tool: "nika:read"
      args: { path: "./notes.txt" }

  draft:
    with:
      notes: ${{ tasks.notes.output }}
    infer:
      prompt: |
        One sentence, plain prose, summarizing this status file:
        ${{ with.notes }}
      max_tokens: 200

  save:
    with:
      draft: ${{ tasks.draft.output }}
    invoke:
      tool: "nika:write"
      args: { path: "./digest.md", content: "${{ with.draft }}" }

outputs:
  digest: ${{ tasks.draft.output }}
```

Five runs later:

```text
❯ nika explain digest.nika.yaml --forecast

  FORECAST · based on last 5 runs (window 50 runs / 30 days) · low confidence (n<10)
    notes  ~0ms (p90 14ms)        —
    draft  ~11.5s (p90 41.8s)     ≥ —        unpriced: local_model
    save   ~4ms (p90 17ms)        —
    ───────────────────────────────────────
    run    ~11.6s (p90 41.9s)     ≥ —
    estimates vary with `when` branches, inputs, and provider latency
```

Two details in the `draft` row are the whole philosophy. The cost column says `≥ —` with `unpriced: local_model`: a local model has no catalog price, and the forecast refuses to invent one. Unpriced compute is not free compute, it is compute whose bill is your electricity and your patience. (The [static audit](/blog/injection-goes-nowhere) says the same thing before the first run ever happens; the forecast says it from experience.) And the p90 remembers what the average forgets: 11.5s typical, 41.8s tail. My first run loaded the model into memory cold, and that forty-second truth stays in the prior, because it will be true again.

Now the part that should be table stakes and is not. The `--forecast` help, verbatim: duration, cost and risk priors come *"from YOUR local traces (stats over `.nika/traces/` · never a model call · never the network)"*. Two nevers. Never a model call: the forecast is arithmetic over NDJSON, not an LLM guessing how long LLMs take; it costs nothing to consult. Never the network: your run history never leaves the machine it was made on. The traces feeding it are the same flight recorder that [resume reads to skip finished work](/blog/the-resume-story) and [the audit trail is made of](/blog/the-run-becomes-evidence). One recorded artifact, four jobs: evidence, replay, resume, and now foresight.

The cloud version of this feature exists everywhere, and it is a fine business: your usage, their database, a monthly invoice for the mirror. The local version is not just more private. It is more *yours* in kind. It prices your machine, your models, your inputs, your cache behavior. Run any workflow five times and ask: `nika explain <file> --forecast`. The history you already own starts working for you.
