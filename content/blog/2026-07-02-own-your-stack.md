---
slug: own-your-stack
title: "No cloud needed"
tag: Sovereignty
date: 2026-07-02
description: "One Rust binary, your models, your files. Run LLMs locally and see what local-first actually buys you."
---

Local-first gets said a lot, and it means anything from "we cache" to "we sync, eventually". Here is what it means in Nika, concretely.

**The engine is one Rust binary.** No daemon, no account, no telemetry phoning home. Brew or curl, and the whole runtime is on your disk. Air-gapped is a supported install path, not an afterthought.

**<!-- canon:providersLocal -->5<!-- /canon --> of the <!-- canon:providers -->14<!-- /canon --> model providers are local runtimes**: Ollama, LM Studio, llama.cpp, LocalAI, vLLM. The model is one line of the file; swap it and nothing else changes.

```yaml hello-ai.nika.yaml
nika: v1
workflow: hello-ai
model: ollama/llama3.2:3b

tasks:
  - id: greet
    infer:
      prompt: "Say hello in one sentence."
```

What that buys, concretely. **Privacy that is structural, not contractual**: with a local model the data path never leaves the machine, so there is nothing to trust and nothing to audit. **A free drafting loop**: iterate on prompts and plans at zero marginal cost, then point the same file at a bigger model only when the task earns it. **Custody**: a provider deprecating a model is a one-line edit to your file, not a rewrite of your workflow.

Cloud stays a real choice: <!-- canon:providersCloud -->8<!-- /canon --> cloud providers, bring your own keys, and every key stays yours. The point was never no-cloud. The point is that cloud is **optional**: per file, per task, visible in the diff.

Your first run needs no key at all. That is not a trial mode. That is the architecture.
