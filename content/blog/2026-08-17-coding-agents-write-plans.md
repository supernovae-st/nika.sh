---
slug: coding-agents-write-plans
title: "Let coding agents write plans, not policy"
tag: Agents
date: 2026-08-17
published: 2026-08-21
description: "Codex, Claude Code, Cursor and other coding agents can author Nika workflows while the checker, the human review and the runner keep separate authority."
---

Coding agents are good at turning an intention into a first draft. They inspect a repository, find the relevant files, imitate local conventions and revise from diagnostics. That makes them natural authors of repeatable AI workflows.

It does not make them the authority on whether those workflows are safe, affordable or approved to run.

The useful architecture separates four roles:

1. The coding agent proposes a workflow file.
2. The Nika checker judges the file against the released language and catalogs.
3. A human reviews the diff and grants the operational decision.
4. The runner executes the approved bytes inside the declared boundary.

Each role has a different power. The agent can write. The checker can refuse. The reviewer can approve. The runner can act. Combining them into one autonomous loop makes the demonstration smoother and the production system harder to trust.

## Nika does not replace the coding agent

Codex, Claude Code, Cursor and similar tools already understand repositories. They can edit source, run commands and respond to test failures. Nika supplies a small language for one particular artifact inside that repository: the repeatable AI plan.

The relationship resembles an agent writing a CI workflow or an infrastructure definition. The coding agent does not need to become the scheduler, policy engine or trace store. It authors a file for a tool that owns those jobs.

This division keeps model choice open. One team can use a frontier coding agent to write a workflow that runs on a local Ollama model. Another can author locally and run one task through a cloud provider. The intelligence used to create the plan and the intelligence selected by the plan are separate decisions.

## Teach the repository, not every conversation

An agent performs better when the rules live beside the code. Nika's `init` command scaffolds repository instructions for several agent and editor conventions, including `AGENTS.md` and a Nika authoring skill. Those files teach a repeatable loop:

1. Read real examples before writing.
2. Choose one verb for each task.
3. Bind data dependencies with `with:`.
4. Derive and review a tight `permits:` block.
5. Run `nika check --native-strict`.
6. Resolve paid-run guidance before using a paid model.

The important part is not a brand-specific prompt. It is a project-level contract that survives a new session and can be reviewed like any other repository rule.

Run the scaffold from the project root:

```bash
nika init
```

Existing files are preserved unless the operator deliberately chooses an overwrite path. The repository remains the source of truth. A future agent reads the same instructions the current agent used.

## Ask for the artifact and the proof

“Automate our weekly summary” is too broad for a reliable handoff. It lets the agent choose the sources, destination, model, permissions and test strategy without making those choices explicit.

A better request names the artifact and the gates:

> Read AGENTS.md and the Nika authoring skill. Start from two shipped examples. Create `workflows/weekly-summary.nika.yaml` that reads the two named source files and writes one report. Use a local model, derive the permit block, and stop only when `nika check --native-strict` is clean. Do not run paid models or publish anything.

That prompt gives the agent room to solve the task while reserving operational authority. It also produces evidence a reviewer can inspect: the source file, the checker result and a diff.

The resulting workflow may look like this:

```yaml weekly-summary.nika.yaml
nika: weekly-summary

model: ollama/llama3.2:3b

permits:
  tools: ["nika:read", "nika:write"]
  fs:
    read: ["./notes/progress.md", "./notes/blockers.md"]
    write: ["./reports/weekly.md"]

tasks:
  progress:
    invoke:
      tool: "nika:read"
      args: { path: "./notes/progress.md" }

  blockers:
    invoke:
      tool: "nika:read"
      args: { path: "./notes/blockers.md" }

  summary:
    with:
      progress: ${{ tasks.progress.output }}
      blockers: ${{ tasks.blockers.output }}
    infer:
      prompt: |
        Write a concise weekly summary from the two project notes.
        Preserve named owners and dates. Do not invent missing status.

        PROGRESS
        ${{ with.progress }}

        BLOCKERS
        ${{ with.blockers }}
      max_tokens: 900

  save:
    with:
      summary: ${{ tasks.summary.output }}
    invoke:
      tool: "nika:write"
      args:
        path: "./reports/weekly.md"
        content: "${{ with.summary }}"
        create_dirs: true

outputs:
  report: ${{ tasks.summary.output }}
```

The human review is concrete. Does the report need both sources? Is the local model appropriate? Are the output ceiling and prompt sufficient? Why can the workflow write only one path? No part of that conversation depends on replaying the agent's hidden reasoning.

## Give the agent an oracle without a run button

The Nika binary can expose its checker and catalog over MCP. This is useful because the coding agent receives structured answers from the same release that will parse the workflow.

The public MCP surface is intentionally read-only. It can check a plan, explain findings and serve language or catalog information. It does not expose a workflow run tool. The agent can learn whether the file is valid without receiving a second path to spend tokens, write files or call external services.

That absence is an architectural feature. A tool that knows how to judge a plan does not also need permission to execute it. The [MCP oracle](/blog/the-mcp-server-you-didnt-build) keeps knowledge and action on separate surfaces.

The current integration registry documents native or wired doors for many clients. The installation gesture differs by client, and those details should be read from the live [integrations rooms](/integrations), not copied from an old blog post. The stable contract is simpler: repository instructions teach authoring, the MCP server exposes the oracle, and the terminal runner owns execution.

## Treat checker findings as the revision protocol

An agent should not improvise around a red check. The finding is part of the authoring interface.

If the parser reports an unknown field, the agent repairs the field rather than inventing an alias. If the boundary is missing an effect, it derives the candidate permit block and asks whether the broader authority is intended. If native-strict flags a helper script that wraps HTTP or file operations, it inspects `nika catalog --tools` before keeping `exec`.

Nika 0.111.0 adds a machine-readable `next` repair in the JSON check result and separates `clean`, `compiled` and `paid_ready`. This gives an agent an ordered loop without giving it permission to declare itself finished:

```bash
nika check --json --native-strict workflows/weekly-summary.nika.yaml
```

The checker remains the authority. The model can apply the first suggested repair and check again. It cannot convert a red verdict into green prose.

This is especially important for cost and deterministic laws. A workflow may parse while still asking a model to make a verdict that should be enforced with `nika:jq` or `nika:decide`. It may contain a rule without a fixed fixture that proves the rule. `paid_ready` stays false until those authoring debts are resolved.

## Keep review focused on decisions

An agent-generated diff can be large. A good workflow review follows a fixed order:

**Identity and inputs.** Is the file solving one named job? Are caller values, constants and secrets classified by role?

**Graph.** Does every task do one job? Are data edges written as `with:` bindings? Is dynamic agent work genuinely dynamic and bounded?

**Authority.** Does the body fit the permit block? Are paths and hosts exact? Is an `exec` a real external program rather than hidden plumbing?

**Cost.** Does every model task have an output ceiling? Does every agent loop have turn and total-token limits? Is the selected provider intentional?

**Policy.** Does a deterministic task own each gate a deterministic task can express? Is irreversible work dominated by a human decision?

**Evidence.** Are outputs declared? Is there a mock or local rehearsal? Will a meaningful run leave a trace that the team retains?

This sequence reduces review fatigue because it asks about system properties before copy style. The perfect prompt inside an overpowered workflow is still the wrong first concern.

## Keep execution outside the authoring loop

An agent often has terminal access, which means it may technically be able to run the file it just wrote. The project contract should still distinguish capability from authorization.

For ordinary authoring, allow safe checks and mock tests. Require a person or a protected CI environment to launch paid providers, send notifications, publish content or deploy software. If a workflow needs a human decision mid-run, represent that decision as a durable prompt task rather than an informal “tell me before you continue” instruction in chat.

The trace then records the answer and the tasks it enabled. A chat promise does not.

The same principle applies when the coding agent itself is working overnight. Long autonomy does not broaden authority. The agent can continue improving source, running local gates and preparing a review. External publication remains a separate operation unless the user explicitly put it in scope and the workflow carries the corresponding boundary.

## Use agents to make the file better

The right conclusion is not that coding agents should be kept away from workflows. They are valuable precisely because the file gives their work a strong meeting point with human review and machine verification.

Let the agent inspect the repository, find the closest examples, draft the graph, tighten the permissions, respond to checker findings and add a deterministic rehearsal. Those are high-leverage tasks. Let the checker decide whether the file belongs to the language. Let the reviewer decide whether its authority and cost are acceptable. Let the runner act only after those two decisions are visible.

The coding agent writes the plan. It does not write the policy by which its own plan becomes trusted. That separation is what makes deeper autonomy practical.
