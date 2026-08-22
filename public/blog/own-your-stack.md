---
slug: own-your-stack
title: "No cloud needed"
tag: Sovereignty
date: 2026-07-02
published: 2026-07-05
description: "One Rust binary, your models, your files. Run LLMs locally and see what local-first actually buys you."
---

Local-first gets said a lot, and it means anything from "we cache" to "we sync, eventually". Here is what it means in Nika, concretely.

**The engine is one Rust binary.** A local run does not require an account or a resident daemon. Brew or curl puts the runtime on your disk. `nika serve` may stay resident when scheduling or a local service needs it, but that mode projects the same binary rather than becoming a mandatory hosted control plane.

**5 of the 17 model providers are local runtimes**: Ollama, LM Studio, llama.cpp, LocalAI, vLLM. The model is one line of the file; swap it and nothing else changes.

```yaml hello-ai.nika.yaml
nika: hello-ai
model: ollama/llama3.2:3b

tasks:
  greet:
    infer:
      prompt: "Say hello in one sentence."
```

## What local changes

With a local model, prompts and outputs do not need to cross a cloud-provider boundary. That removes one egress path. It does not remove trust from the machine: the local model server, model artifact, operating system and any tools the workflow invokes remain part of the boundary.

Local also changes the cost evidence. There may be no vendor invoice, but the run still consumes hardware time, memory and energy. Nika calls a model unpriced when the catalog has no price row. It does not turn missing billing data into “free.”

Custody is the third change. A provider deprecating a model can become a model-selection edit instead of a workflow rewrite. The replacement may behave differently, so the next run needs new evidence. Portability preserves the plan, not identical generations.

## What local does not change

The workflow still needs boundaries. A local model can call a dangerous tool as easily as a remote model if the runtime grants it. A local process can still read the wrong file. A model artifact can still be mislabeled.

Keep the same questions:

- Which exact workflow bytes ran?
- Which local server and model seat answered?
- Which files, tools and processes were admitted?
- What did the trace observe?
- Which model provenance facts remain below the server wire?

Local-first is an ownership choice, not a waiver for evidence.

Cloud stays a real choice: 11 cloud providers, with credentials supplied through the runtime's secret boundary rather than written into the workflow. The point was never no-cloud. The point is that cloud is **optional**: per workflow or task, visible in the requested model seat.

A first run can need no provider key when a supported local model server and model are already available. That is not a trial mode. It is one execution lane beside the cloud lanes.
