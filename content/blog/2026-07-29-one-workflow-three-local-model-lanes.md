---
slug: one-workflow-three-local-model-lanes
title: "One workflow, three local model lanes"
tag: Sovereignty
date: 2026-07-29
description: "Ollama, LM Studio and vLLM expose different operating experiences, but Nika keeps the workflow contract unchanged: one model string selects the local seat."
---

“Run it locally” is not one setup. A laptop developer wants a model up in minutes. A desktop user may want a visual model library and a server button. A team with GPUs wants batching, concurrency and an endpoint that survives the person who launched it.

Ollama, LM Studio and vLLM answer those needs differently. Nika does not flatten their operational differences. It gives them the same place in a workflow: the provider prefix of one model string.

```yaml local-brief.nika.yaml
nika: local-brief
model: ollama/llama3.2:3b

inputs:
  notes:
    type: string
    required: true

tasks:
  brief:
    infer:
      prompt: |
        Turn these notes into five concise bullets.

        ${{ inputs.notes }}
      max_tokens: 500

outputs:
  brief: ${{ tasks.brief.output }}
```

The file says what the model must do, how much output it may produce and what the workflow returns. It does not carry a base URL or a launch command. Those are properties of the runtime on the machine, not portable workflow intent.

Run the same file through each lane by changing only the model seat:

```text
nika run local-brief.nika.yaml --var 'notes=release notes here' --model ollama/llama3.2:3b
nika run local-brief.nika.yaml --var 'notes=release notes here' --model lmstudio/qwen3.5-4b
nika run local-brief.nika.yaml --var 'notes=release notes here' --model vllm/Qwen/Qwen3-8B
```

That is not a claim that the outputs will match. Different models, quantizations, samplers and runtimes can produce different text. It is a claim that the **contract around the inference** stays reviewable: same task graph, same prompt, same output budget, same input and same trace shape.

## Ollama: the short first lane

Ollama is the easiest default when the goal is to prove the workflow on one machine. The Nika catalog expects its local server on port 11434 and requires no provider key. Pull a model, make sure the server is available, then run:

```text
ollama pull llama3.2:3b
nika try 01-hello --model ollama/llama3.2:3b
```

The model suffix is the tag Ollama knows. Nika's catalog carries `llama3.2:3b` as a seed, not a closed allowlist. A local server may host models added after the Nika release, so unknown local model names pass through verbatim. That keeps local ownership real. The catalog can teach a starting point without becoming a gatekeeper over files on your disk.

Ollama fits the authoring loop well. Start with a model small enough to answer quickly. Iterate on the file at zero API spend. Use `nika check` to catch graph, permission and cost-shape problems independently of model quality. Move to a larger local model or a cloud seat only when the task has earned the change.

The common mistake is to interpret “local” as “free”. Nika labels local work **unpriced**. Your API invoice may be zero, but the machine, electricity and operator time are not. The distinction matters in reports: an absent market price is missing cost data, never evidence of no cost. The [energy register](/catalog/energy) follows the same rule and only shows measurements backed by a published receipt.

## LM Studio: the visible workstation lane

LM Studio is useful when model selection is a desktop activity. A person can download a model, choose a quantization, load it, then expose an OpenAI-compatible server. Nika's provider profile targets the default port 1234 and does not require a key.

The workflow model id must match the name the loaded server exposes. The catalog's current seed is:

```yaml lm-studio-brief.nika.yaml
nika: lm-studio-brief
model: lmstudio/qwen3.5-4b

tasks:
  explain:
    infer:
      prompt: "Explain why an AI workflow should be reviewed before it runs."
      max_tokens: 350

outputs:
  answer: ${{ tasks.explain.output }}
```

There is no extra “LM Studio mode” in the language. The provider adapter handles its wire shape. If a teammate uses a different loaded model, that difference belongs in the model string or the explicit `--model` override, where it appears in terminal history and the run trace.

The visual server makes one class of failure easier to diagnose: nothing is loaded even though the application is open. `nika doctor` checks local server reachability and names the next step. That is better than turning a connection failure into a model failure. A provider prefix that resolves but has no live server is an access problem, not bad inference.

LM Studio is also a good review bridge. A teammate who does not operate a model daemon every day can see which artifact is loaded and when the local API is enabled. The workflow remains plain text beside the code; the workstation UI remains the machine-specific control surface.

## vLLM: the server lane

vLLM serves the case where local means your infrastructure rather than your laptop. Nika's profile targets an OpenAI-compatible server on port 8000. The catalog seed uses a Hugging Face model id:

```yaml gpu-brief.nika.yaml
nika: gpu-brief
model: vllm/Qwen/Qwen3-8B

tasks:
  classify:
    infer:
      prompt: "Classify this incident as availability, integrity or confidentiality: database writes were silently dropped."
      max_tokens: 120

outputs:
  class: ${{ tasks.classify.output }}
```

vLLM changes the operating questions. Which GPUs does the service own? How is concurrency bounded? Which model revision is loaded? Who restarts the process? Does the endpoint stay on loopback, a private network or a controlled gateway? Nika does not answer those deployment questions for vLLM. It makes sure they do not leak into the workflow grammar as provider-specific fields.

For repeatable runs, record the server deployment beside the workflow's trace: model artifact revision, quantization, vLLM version and relevant sampling configuration. Nika's journal records the provider and model string used by the task. The external service still owns facts below that wire. Reproducibility cannot be created by omitting those facts.

The same honesty applies to throughput. vLLM is designed for server workloads, but this post gives no universal speed number. GPU model, tensor parallelism, sequence length, batch shape and quantization all change the result. Benchmark the actual workload on the actual machine and publish the receipt if the number will guide a decision.

## What stays the same

Across the three lanes, the workflow keeps the properties worth reviewing:

- The model selection is one `<provider>/<name>` string.
- A task may override the workflow default explicitly.
- `max_tokens` remains part of the task, independent of the server.
- Inputs, dependencies and outputs keep the same syntax.
- `nika check` runs before inference and does not need the model to rewrite the file.
- Every run records the selected provider and model in its trace.
- `--access local` can pin the path and refuse rather than substitute a cloud route.

The surrounding operations differ because the tools solve different problems. Ollama optimizes the first local run. LM Studio makes a workstation model visible. vLLM makes a GPU service usable by several callers. Those are legitimate differences, not abstraction leaks to hide.

## A practical promotion path

Start with the cheapest failure you can learn from:

1. Run `nika check local-brief.nika.yaml` before starting any model.
2. Prove the graph and prompt shape with `--model mock/echo` if no runtime is ready.
3. Use Ollama for the first real local answer.
4. Use LM Studio when model and quantization selection need a workstation UI.
5. Move to vLLM when the workflow needs a maintained GPU service.
6. Keep a representative trace from each lane and compare outcomes with `nika trace reproduce` only when the inputs and workflow identity are genuinely comparable.

Swapping the provider is easy. Deciding that the new output is good enough remains product work. The workflow helps because the comparison has a stable frame: the plan did not disappear into three SDKs and three scripts.

Local-first is not a demand that every team run a datacenter. It is the ability to choose custody per workflow and per task, without asking a framework to translate the plan. Three operating lanes, one file.

Use the [local model guide](/install/local-models), browse every [provider room](/catalog/providers), or continue with [No cloud needed](/blog/own-your-stack).
