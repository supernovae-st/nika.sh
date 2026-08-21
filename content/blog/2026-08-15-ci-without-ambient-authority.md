---
slug: ci-without-ambient-authority
title: "The CI job should know its boundary"
tag: Security
date: 2026-08-15
published: 2026-08-21
description: "Run Nika in CI and on headless servers with the same checked workflow bytes, explicit authority, deterministic rehearsals and a hard launch budget."
---

Continuous integration is where automation becomes authority.

A local experiment can be stopped by the person watching it. A CI job may run at midnight with repository credentials, deployment tokens, network access and write permission across a working tree. If an AI step enters that environment as “one more script,” it quietly inherits a much larger blast radius than the prompt needs.

The safer operating model is to treat the workflow as a release artifact. Check the exact bytes that will run. Make effects explicit. Rehearse without provider keys. Require a separate readiness signal before paid execution. Put the final spend ceiling on the command that launches the run.

Nika supports that loop, but the result still depends on how the CI job is designed. A workflow language cannot repair a runner that gives every step permanent production credentials.

## Keep authoring and execution as separate gates

A useful pipeline has at least two stages.

The first stage is safe to run on every pull request. It validates the workflow, checks native-first guidance and compares a deterministic rehearsal with its golden result. It needs no paid provider key and should not receive deployment credentials.

The second stage is allowed to execute real effects. It runs only after review or on a protected branch, receives the minimum required secrets and launches with an explicit cost cap. A publishing or deployment task may also pause for a recorded human decision before the irreversible step.

This split keeps “the file is valid” separate from “this run is authorized now.” A green parser verdict is not a production approval.

## Check the same bytes you will run

Templating a workflow after validation defeats the check. The checker proves one document while the runner executes another.

Prefer committed workflow files with typed `inputs:` for the values that change per invocation. Pass them with repeated `--var key=value` arguments. The graph and boundary remain in source, while the caller supplies only declared values.

If a build step generates a workflow, preserve that generated artifact and run both `check` and `run` against the same file. Do not check the template and execute a later expansion. Record its digest as a build artifact so a reviewer can identify the exact bytes sent to the runner.

The command sequence for a pull request can stay small:

```bash
nika check --native-strict workflows/release-brief.nika.yaml
nika check --json workflows/release-brief.nika.yaml \
  | jq -e '.clean == true and .paid_ready == true'
nika test workflows/release-brief.nika.yaml
```

The first line applies the strict native-first posture. The second gives CI a machine verdict for legality and paid readiness. The third compares an offline mock run with the committed golden file. A failure in any line should stop before a provider key is introduced.

## Make the workflow hermetic enough to rehearse

CI tests should not depend on a model provider being healthy, cheap or deterministic that morning. Nika's mock model gives the plan a keyless execution path, and `nika test` records the expected task and output structure.

Here is a small workflow suited to that lane:

```yaml release-brief.nika.yaml
nika: release-brief

model: mock/echo

run:
  entropy: none
  clock: virtual

permits:
  tools: ["nika:read"]
  fs:
    read: ["./CHANGELOG.md"]

tasks:
  changes:
    invoke:
      tool: "nika:read"
      args: { path: "./CHANGELOG.md" }

  brief:
    with:
      changes: ${{ tasks.changes.output }}
    infer:
      prompt: |
        Write a factual release brief from this changelog.
        ${{ with.changes }}
      max_tokens: 800

outputs:
  brief: ${{ tasks.brief.output }}
```

`entropy: none` and `clock: virtual` state that the rehearsal should consume neither randomness nor ambient wall time. The file reads one committed source and performs no write. The mock response is not a quality evaluation of the prose. It is a deterministic proof that the workflow compiles, the graph executes and the output contract remains stable.

Create the golden once after review:

```bash
nika test workflows/release-brief.nika.yaml --update
```

Future CI runs use `nika test` without `--update`. A red comparison is a change to investigate, not an invitation to regenerate the expected result automatically.

## Treat permits as the CI capability manifest

The workflow above can read one file through one builtin. It cannot write an artifact, spawn a process or reach a host because those capabilities are absent.

That is more useful than a comment saying the task is read-only. The declared body and the permit block are checked together. If a later change adds `nika:write`, the file becomes red until the reviewer also grants the tool and the destination path.

Derive a starting boundary with:

```bash
nika check --infer-permits workflows/release-brief.nika.yaml
```

Then read the result. Inference is not permission approval. An interpolated path may be impossible to resolve statically. An HTTP endpoint may redirect to another host. A composed child workflow carries its own effects. These cases need explicit review rather than a broader wildcard.

The runner should reinforce the same boundary at the operating-system layer. On macOS, Nika uses the platform sandbox path. On Linux, headless hosts need bubblewrap for confined process and MCP children. If a strict workflow declares permits and the host cannot enforce the process boundary, refusal is the correct result. The [server guide](/install/servers) keeps this prerequisite visible.

Container isolation is still useful. It limits the entire job. `permits:` limits the workflow inside that job. The controls answer different questions and should be layered rather than substituted for one another.

## Give each stage only the secrets it needs

The check and mock-test stage should receive no model key. This catches accidental dependencies early and prevents an innocent pull request from spending money.

The execution stage receives only the provider or service credentials named by the approved plan. Nika secrets are governed references, not prompt strings. The secret declaration names its source, and any allowed egress belongs in the same reviewed file.

Do not expose every repository secret at job scope. Put each credential on the step that needs it. Use protected environments for production tokens and require the repository's normal approval mechanism before that environment is released.

An MCP child and an `exec` child begin from a cleared environment plus the runner floor and explicitly permitted names. If a tool needs an environment variable, make that dependency visible. A child process should not receive a surprise copy of the host session.

## Put the hard cost cap on the launch

Every `infer` task should have `max_tokens`. Every `agent` task should have both a turn limit and a total token limit. Those fields make the static output ceiling computable.

The runtime boundary adds the final stop:

```bash
nika run workflows/release-brief.nika.yaml \
  --model openai/gpt-5-mini \
  --max-cost-usd 0.25 \
  --output json
```

`--model` previews and selects the production seat without changing the workflow graph. `--max-cost-usd` refuses before the call that would cross the cap. `--output json` gives the CI caller a declared machine result instead of forcing it to scrape terminal prose.

Be precise about what the cap and preflight estimate mean. The static ceiling prices output tokens known to the catalog. Large input documents, provider-specific caching and local compute still need operational review. A local model is unpriced compute, not a zero-cost job.

Composition also requires care. A parent workflow's displayed ceiling does not currently include a child's model work, and a parent's run cap does not automatically become the child's cap. Check and budget each child at its own execution boundary before presenting a composed plan as globally bounded.

## Design human gates for headless reality

CI has no hidden operator.

A blocking `nika:prompt` without a default pauses durably. The run records the question and can resume later with a typed answer. That is appropriate when a release, send or publish step must wait for a person.

A prompt with `default: false` completes unattended and fails closed. That is appropriate when CI should settle the run without taking the irreversible action. A default of true would turn absence into approval and should be treated as a serious policy decision.

Place the gate so it dominates every path to the effect it approves. A question beside one branch does not authorize another branch that can reach the same write or network send. The graph should make the approval relationship visible before the run.

The final task can record an outcome even after failure by using a terminal control edge, but an always-running task should not be the one that performs external egress. Otherwise it may become reachable on a path where the human never approved anything.

## Keep the trace as a CI artifact

The JSON output is for downstream automation. The trace is for evidence.

After a run that matters, retain the matching `.nika/traces/*.ndjson` file with the workflow digest and CI job metadata. Verify it before long-term storage:

```bash
nika trace verify .nika/traces/<run>.ndjson
```

The verifier reports the strongest proof the trace actually carries. Hash-chain integrity, a sealed signature, an anchored sidecar and a fresh replay are different levels. Do not relabel one as another.

Retention makes incident review concrete. A team can see which tasks ran, which outputs were reused, where a refusal happened and whether the record changed after the job. That is more useful than a single green checkmark beside “AI step.”

## The production checklist

A headless Nika job is ready when the answers are explicit:

1. The committed or generated bytes checked are the bytes that will run.
2. `nika check --native-strict` is clean and paid workflows report `paid_ready: true`.
3. A deterministic `nika test` lane runs without provider keys.
4. The permit block names every file, host, tool and executable the body needs.
5. The host can enforce process confinement, including bubblewrap on Linux.
6. The execution step receives only its required secrets.
7. Model and agent tasks carry output and loop bounds.
8. The launch command sets a hard cost ceiling.
9. Human approval is explicit and fail-closed in a headless session.
10. The JSON result and verified trace are retained for their separate purposes.

CI is not merely where a workflow happens to run. It is the boundary where authored intent receives real authority. Make that transfer visible, reviewable and reversible before the first token is spent.
