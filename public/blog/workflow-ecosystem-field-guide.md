---
slug: workflow-ecosystem-field-guide
title: "A field guide to the Nika workflow ecosystem"
tag: Engine
date: 2026-08-19
description: "Choose deliberately among model providers, local runtimes, builtins, MCP servers and coding-agent surfaces without turning the workflow into vendor glue."
---

A modern AI workflow sits at the intersection of several ecosystems. There are model providers, local runtimes, built-in tools, MCP servers, coding agents, editors and CI runners. Each offers a way to make the system more capable. Each can also become a source of accidental complexity.

The practical question is not “which ecosystem wins?” It is “which layer owns this decision?”

Nika keeps the workflow language small while letting the catalogs grow. The file describes intent with four execution models: infer, exec, invoke and agent. A model identifier selects intelligence. A builtin or MCP identifier selects a callable capability. Repository and client integrations help people and agents author the file. The runner enforces the plan.

This field guide gives each layer one job and a decision rule.

## Start with the job, not the provider

Write the task graph before choosing a model vendor.

For a document brief, the stable plan may be: read a source, extract facts, draft a summary, validate the artifact and write it. That graph does not become a different workflow because the inference runs through Ollama, OpenAI or another compatible provider.

Provider-first design creates unnecessary coupling. Prompts begin to mention SDK objects. Error handling follows one HTTP dialect. Credentials leak into helper code. Switching the model then requires a rewrite of the orchestration rather than a deliberate change to one seat.

In Nika, the default seat is a model string:

```text
model: ollama/llama3.2:3b
```

A production run can preview or override that seat from the command line:

```bash
nika check workflow.nika.yaml --model openai/gpt-5-mini
nika run workflow.nika.yaml --model openai/gpt-5-mini
```

The first command asks the installed catalog to resolve and price the proposed seat without changing the file. The second launches the same graph on that seat. A task-level model can still pin an exception when one job genuinely needs different capabilities.

This separation gives review a clean question: did the plan change, or did only the intelligence seat change?

## Use the installed catalog as the source

Provider names, model identifiers, environment keys, capabilities and prices change. Memory is a bad registry.

Ask the binary that will run the workflow:

```bash
nika catalog
nika catalog --json
```

The human view helps discovery. The JSON view supports tools, audits and CI. The public [provider rooms](/catalog/providers) and [model catalog](/catalog/models) project the released engine catalogs for web browsing, while the installed binary remains the admission-time authority for a local run.

Check several properties before selecting a seat:

- Does the provider require a credential, and which environment key does it use?
- Does the model support the structured output or media capability the task needs?
- Is there a sourced price row for the exact identifier?
- Is the context window appropriate for the actual input size?
- Is the runtime local, remote or reached through an access layer?

A missing price does not mean a free run. It means the compute is unpriced by the current catalog. The [pricing register](/catalog/pricing) and [energy register](/catalog/energy) keep financial and physical cost as separate clocks because one should not be inferred from the other.

## Choose local and cloud by constraint

Local and cloud are not opposing identities. They are execution choices with different constraints.

Choose a local runtime when data residency, offline operation, predictable access or hardware ownership dominates. The current catalog includes local server families such as Ollama, LM Studio, llama.cpp, LocalAI and vLLM. Their exact available models depend on the runtime you operate.

Choose a cloud provider when the task needs a model capability, scale or service level that the local seat does not provide. Keep the provider credential scoped to the run step, review the input volume and set a hard cost ceiling.

Use `mock/echo` for the third lane: deterministic rehearsal. It is not a weak production model. It is a test seat that exercises the workflow without a key or bill.

The same source can move between all three. Here is a complete local-first brief:

```yaml ecosystem-brief.nika.yaml
nika: ecosystem-brief

model: ollama/llama3.2:3b

permits:
  tools: ["nika:read", "nika:write"]
  fs:
    read: ["./sources/ecosystem.md"]
    write: ["./out/ecosystem-brief.md"]

tasks:
  source:
    invoke:
      tool: "nika:read"
      args: { path: "./sources/ecosystem.md" }

  brief:
    with:
      source: ${{ tasks.source.output }}
    infer:
      prompt: |
        Write a factual field note from this source.
        Separate observed changes from recommendations.
        Do not invent dates, benchmarks or adoption claims.

        ${{ with.source }}
      max_tokens: 900

  save:
    with:
      brief: ${{ tasks.brief.output }}
    invoke:
      tool: "nika:write"
      args:
        path: "./out/ecosystem-brief.md"
        content: "${{ with.brief }}"
        create_dirs: true

outputs:
  brief: ${{ tasks.brief.output }}
```

Rehearse it with `--model mock/echo`. Run it locally as written. Preview a cloud seat with `nika check --model ...` before supplying the provider key. The graph and file boundary stay constant.

## Reach for builtins before subprocesses

Builtins are the standard library inside the Nika binary. They cover common workflow operations across files, data, network access, introspection and media.

Use the live tool catalog rather than guessing an argument:

```bash
nika catalog --tools
nika catalog --tools --json
```

The native-first order is deliberate:

1. Use a `nika:*` builtin when the operation is in the standard library.
2. Use an `mcp:<server>/<tool>` call when an external product exposes the capability.
3. Use `exec` for a real program when neither tool path fits.

This is not style preference. A builtin exposes typed arguments to the checker, participates directly in permits and leaves structured task evidence. A shell helper that wraps the same operation hides those facts behind process execution.

Common replacements are straightforward. File reads and writes use `nika:read` and `nika:write`. HTTP uses `nika:fetch`. JSON shaping uses `nika:jq`. Search uses `nika:glob` or `nika:grep`. Dates, hashes, UUIDs, validation and conversion have their own builtins. Inspect the catalog for the current argument schema before authoring.

An `exec` remains appropriate for tools such as a compiler, `git` or a product CLI with no callable surface. Prefer argv form so interpolated values remain one argument and cannot become shell syntax. If a shell is truly required, make that boundary explicit.

## Use MCP for product capabilities, not invisible authority

MCP lets a workflow call capabilities supplied by another server without importing its SDK into the workflow language. The task still uses `invoke`; the tool identity simply lives under the `mcp:` namespace.

The [MCP catalog](/catalog/mcp) is a discovery map, not an automatic allowlist. Installing or configuring a server does not grant every workflow access to every tool. The workflow permit block names the tool, and the server process runs inside the applicable child boundary.

Before adding an MCP task, answer five questions:

1. Is the server version or installation source reviewed?
2. What exact tool is needed?
3. Which filesystem, network and environment effects can the child require?
4. What data crosses into the server, including private inputs and secrets?
5. Can a builtin perform the same job with a smaller boundary?

Do not build a Python or shell wrapper around a product HTTP API merely to avoid MCP configuration. That creates a private protocol with no shared schema and moves credentials into glue. If no trustworthy server exists, `nika:fetch` with an exact host and governed header may still be clearer than a helper script.

MCP is also how a coding agent can query Nika itself. The binary's own MCP server exposes a read-only oracle for checks and catalog information. It deliberately does not expose run authority. An agent can understand and repair the plan without receiving a tool that executes it.

## Keep coding-agent integrations at the authoring layer

The ecosystem includes more than runtimes. Coding agents and editors need a way to learn the language and obtain diagnostics.

Nika uses three complementary surfaces:

- `nika init` writes repository instructions and authoring guidance;
- the editor extension draws and validates the workflow while it is edited;
- `nika mcp` gives compatible clients structured access to the released checker and catalogs.

The exact installation path depends on the client. Some load a native plugin, some read repository instructions, and some connect only through MCP. The live [integrations matrix](/integrations) records those differences and names whether a path is proven, wired or still reconnaissance.

Keep the architecture stable despite those client differences. The client helps author. The binary checks. The terminal or protected CI job runs. A new agent UI should not require a new workflow dialect.

## Make access selection visible

Model identity and access path are related but distinct. A provider/model name says which intelligence is requested. The access layer says how the runner can reach an acceptable seat in the current environment.

Nika's released access resolver considers available paths in a strict order and records why candidates were accepted or dropped. The `--access` launch option can pin the required class rather than allowing a silent substitution. If the requested path is unavailable, refusal is more honest than quietly sending the task somewhere else.

This matters for sovereignty. “Use this model” does not prove the request stayed local. “Use this model through a local access path” is a stronger operational claim, and the resolver witness makes it inspectable.

It also matters for CI. A pull request rehearsal may use mock access, while a protected job requires an API or local server seat. Those are deployment decisions around one workflow, not forks of the source.

## Review the whole data journey

The most capable workflow can also have the largest information path. A local file enters a prompt. A model output enters an MCP tool. A secret becomes an HTTP header. A generated artifact is written and later published.

Review the journey end to end:

- source and trust level of every input;
- tasks that transform or classify it;
- model and tool destinations;
- local files and external hosts reached;
- output retained after the run;
- trace material retained as evidence.

The permit block answers which effects are allowed. Secret egress declarations answer where credentials may travel. The lethal-trifecta check looks for paths combining private reads, untrusted ingress and external egress without the required human gate. No single provider setting replaces this workflow-level view.

## A durable selection sequence

When a new workflow request arrives, use the same sequence:

1. Draw the tasks and data edges without selecting a vendor.
2. Mark which tasks need language judgment, deterministic tools, real programs or an open-ended loop.
3. Inspect `nika catalog --tools` before writing any `exec`.
4. Inspect `nika catalog` before choosing a model identifier.
5. Pick mock, local or cloud access from the task's operating constraints.
6. Add MCP only for exact product capabilities and review the child boundary.
7. Derive permits from the body, then tighten them in review.
8. Check with the installed binary, rehearse with mock or local access, and require paid readiness before spend.
9. Launch with explicit secrets and a hard cost ceiling.
10. Retain the declared output and the trace as different artifacts.

The ecosystem can expand without making the workflow language sprawl. Providers add intelligence seats. Builtins add trusted primitives. MCP adds product capabilities. Coding agents add authoring leverage. None needs to own the whole system.

The plan stays the stable center. Choose each surrounding layer for one reason, make that reason visible, and keep the path from intent to evidence reviewable.
