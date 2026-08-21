---
slug: retire-the-prompt-glue
title: "Retire the prompt glue"
tag: Language
date: 2026-08-13
published: 2026-08-21
description: "A practical migration from brittle shell and Python prompt chains to a checked workflow whose graph, authority, cost and outputs are visible before it runs."
---

Prompt glue usually begins as a useful ten-line script.

Read a file. Call a model. Parse the answer. Write the result. The first version is fast, familiar and completely reasonable. Then the task becomes important. A second source arrives. A retry appears. Someone adds a shell command. CI needs the result as JSON. The provider changes. The script now owns orchestration, policy, cost control, secret handling and recovery, but still looks like a small utility.

The problem is not that Python or shell are weak languages. The problem is that a general-purpose program hides the properties a workflow reviewer needs most. The graph is mixed with control flow. Authority comes from the process. Model budgets live in request options. A partial write can occur before a later exception. The only proof of what happened may be a log assembled by the same code under review.

Migration should not translate every line into YAML. It should recover the plan that the glue had been performing implicitly.

## Start with effects, not syntax

Before changing code, make an inventory of what the script can do.

For a typical “read notes and write a launch brief” job, the inventory may be:

- read two Markdown files;
- ask a model for risks and another model call for opportunities;
- combine both outputs;
- write one report;
- return the report path to the caller.

That list already reveals the workflow better than the original call stack. Two reads are independent. Two analyses depend on the same source material and can run together. The merge waits for both. The save waits for the merge.

Now list authority separately:

- file reads under `./inputs/`;
- one write under `./out/`;
- no network tool, shell or arbitrary program;
- one model provider selected by the `model:` value.

If the script also calls `curl`, `jq`, `cat` or `mkdir`, do not copy those commands automatically. Nika has builtins for HTTP, files, structured data and directories. The native tool exposes its arguments to the checker and participates in the permit boundary. A subprocess is appropriate for a real external program, not for plumbing the workflow language already understands.

## Draw tasks around jobs, not functions

A helper function is not automatically a workflow task. A task should perform one job with one execution model.

Use `invoke` when a builtin or MCP tool already performs the operation. Use `infer` when language or judgment is required. Use `exec` for a real process that cannot be reached through a tool. Use `agent` only when the number of steps cannot be declared up front.

Here is the recovered plan for the launch brief:

```yaml launch-brief.nika.yaml
nika: launch-brief

model: ollama/llama3.2:3b

permits:
  tools: ["nika:read", "nika:write"]
  fs:
    read: ["./inputs/release.md", "./inputs/incidents.md"]
    write: ["./out/launch-brief.md"]

tasks:
  release:
    invoke:
      tool: "nika:read"
      args: { path: "./inputs/release.md" }

  incidents:
    invoke:
      tool: "nika:read"
      args: { path: "./inputs/incidents.md" }

  risks:
    with:
      release: ${{ tasks.release.output }}
      incidents: ${{ tasks.incidents.output }}
    infer:
      prompt: |
        Identify concrete launch risks supported by these two sources.
        Do not invent missing incidents, dates or owners.

        RELEASE
        ${{ with.release }}

        INCIDENTS
        ${{ with.incidents }}
      max_tokens: 900

  opportunities:
    with:
      release: ${{ tasks.release.output }}
    infer:
      prompt: |
        Extract the user-visible improvements in this release.
        Keep product names and version numbers exactly as written.

        ${{ with.release }}
      max_tokens: 700

  assemble:
    with:
      risks: ${{ tasks.risks.output }}
      opportunities: ${{ tasks.opportunities.output }}
    infer:
      prompt: |
        Write a launch brief with two headings: What changed and What to watch.
        Use only the supplied analyses.

        IMPROVEMENTS
        ${{ with.opportunities }}

        RISKS
        ${{ with.risks }}
      max_tokens: 1000

  save:
    with:
      brief: ${{ tasks.assemble.output }}
    invoke:
      tool: "nika:write"
      args:
        path: "./out/launch-brief.md"
        content: "${{ with.brief }}"
        create_dirs: true

outputs:
  brief: ${{ tasks.assemble.output }}
```

The file does not say “run these analyses in parallel.” It says what each task consumes. The engine derives the waves from those bindings. `release` and `incidents` can start together. `risks` and `opportunities` can run together once their inputs exist. `assemble` waits for both analyses. This is the [plan you get from the data edges](/blog/dag-for-free), not a scheduler hidden in glue.

## Separate values by who controls them

Prompt scripts often mix four kinds of value in one environment dictionary: user input, deployment configuration, constants and credentials. That makes review harder because everything looks equally changeable.

Nika's current envelope keeps three authorities:

- `inputs:` for caller or deployment supplied values;
- `const:` for fixed values committed in the workflow;
- `secrets:` for governed references such as an environment key.

Classify by role. A report date supplied with `--var` is an input. A fixed output path is a constant or literal. An API token is a secret. A process environment name that a child must see belongs in the permit boundary too.

Do not turn every old environment variable into an input without thinking. That preserves the ambiguity rather than removing it. The migration is a chance to state who is allowed to choose each value.

Static paths are easier to verify than dynamic ones. If a caller supplies a path that reaches a file effect, the runtime must re-check the resolved value against the declared boundary. Keep the grant narrow and use a `lift` only when a deployment-controlled value genuinely needs to cross the taint law. A broad wildcard is not a substitute for classification.

## Make data edges explicit

Glue scripts pass values through local variables, mutable objects, temporary files and implicit process output. A migration should turn each meaningful transfer into a visible `with:` binding.

The rule is simple: if a task reads another task's result, bind it. Inside the task, read the alias under `with`, not the global task namespace. The binding is both the data contract and the dependency edge.

Use `after:` only when order matters but no value crosses. Cleanup after a terminal outcome is a good example. “Run B after A because B needs A's output” is a data edge and should be written as one.

This distinction removes accidental serial work. In an imperative script, lines execute in source order even when no dependency exists. In a declared graph, independent tasks are visible and may run together. Migration can make a repeated job faster without adding concurrency code.

## Replace hand-built plumbing with native tools

The most common migration mistake is wrapping old commands inside `exec`:

```text
curl URL | jq .items > out.json
```

That preserves a shell-shaped blind spot. The checker sees a process and, if `shell:` is used, a command language inside a string. It cannot reason about the URL, transformation and write with the same precision as three typed operations.

The native shape is `nika:fetch` for HTTP, `nika:jq` for the value transformation and `nika:write` for the artifact. Each task names its arguments. Each effect appears in `permits:`. Each result can be inspected in the trace.

The same rule covers `cat`, `tee`, `cp`, `find`, `grep`, `date`, UUID generation, hashing, conversion and schema validation. Run `nika catalog --tools` against the installed binary before keeping a subprocess. If a product exposes an MCP tool, prefer that tool over a local helper that wraps its HTTP API.

An `exec` that remains should name a real tool such as `git`, a compiler or a release CLI. Use argv form, one argument per item. A shell is an explicit language boundary, not the default string form.

## Turn hidden policy into deterministic tasks

A prompt often contains both extraction and policy:

> Read the release, decide whether it is safe, and write the announcement.

That asks a model to define the evidence, apply the rule and produce the artifact. The result may sound decisive while the actual threshold remains impossible to test.

Split the jobs. Let a model extract typed facts. Apply the publication rule with `nika:jq`, `nika:decide` or `nika:assert`. Prove the rule against a fixed known case. A second model should not be the judge of the first model's work when the decision can be expressed deterministically.

This is also where retries belong. A transient provider error may justify a bounded retry. A weak prompt does not. Retrying an unclear instruction spends more money on the same ambiguity.

## Migrate in three passes

Do not rewrite a critical script and switch production in one motion.

**Pass one: shape.** Start from two shipped examples that cover the graph. Recreate tasks and data edges with `mock/echo` or a local model. Run `nika check` until the file is clean.

**Pass two: boundary.** Derive a candidate with `nika check --infer-permits`, then review every path, host, tool and executable. Dynamic paths and redirects still require human attention because static inference cannot know their resolved targets.

**Pass three: proof.** Pin a deterministic rehearsal with `nika test <file> --update`, then run the old script and new workflow on the same fixed inputs. Compare the artifacts. Keep the trace from the workflow and document any deliberate difference.

Only after those passes should a paid model replace the mock or local seat. Require both a clean native-strict check and `paid_ready: true`. Then use `--max-cost-usd` on the run boundary and remember that the static ceiling covers output tokens, not every possible input cost.

## Delete the glue when the plan owns the job

A successful migration has a clear finish line.

The workflow file names every job, every data edge, every effect, every model ceiling and the final output. CI checks the same bytes production runs. A mock or local rehearsal is pinned. The old script no longer owns retries, provider calls or file plumbing. It can be deleted rather than kept as a second implementation “just in case.”

The result may be longer than the first ten-line prototype. It is smaller than the system the prototype had quietly become. More importantly, the operational truth is now visible before execution. That is what the glue could never provide.
