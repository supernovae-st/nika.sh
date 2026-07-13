---
slug: written-by-agents
title: "Written by agents, reviewed by you"
tag: Agents
date: 2026-07-11
description: "nika init teaches the language to whatever agent you already run. Then two real agents write the same workflow: one invents a schema the audit refuses, one goes green first shot. The human review is a two-line diff."
---

Your agent already writes code you review. That contract (the agent drafts, the diff is the meeting point, nothing merges unread) is the only reason agents are allowed near serious codebases at all. Then the same agent proposes to *run* something, and the contract quietly dissolves: the plan lives in chat scrollback, execution is whatever the loop decides in the moment, and "review" means watching it happen. [The file already made prompts reviewable](/blog/prompts-are-code); this post is about the division of labor that falls out of it: the agent writes the file, a machine audits it, and you review a diff instead of a transcript.

`nika init` sets the table. In an empty repo:

```text
❯ nika init

  ✔ created .vscode/settings.json
  ✔ created AGENTS.md
  ✔ created .cursor/rules/nika.mdc
  ✔ created .agents/skills/nika-authoring/SKILL.md
  ✔ created .github/copilot-instructions.md
  ✔ created CLAUDE.md
```

One scaffold, every harness: Claude Code, Cursor, Copilot, and anything else that reads `AGENTS.md` (opencode does). The 75-line `AGENTS.md` is the piece that matters. It teaches the loop (*write the workflow as a file, audit it with `nika check`, fix the findings, only then run*), and the generated `CLAUDE.md` says out loud that the contract "stays parity-tested against the binary". Run `nika init` twice and the second pass prints six `skipped (exists · --force to overwrite)` lines: the scaffold does not overwrite files it did not write.

So we ran the experiment. Same scaffolded repo, three standup notes under `./notes/`, and the same one-sentence ask to two very different agents, worded naturally, no schema smuggled into the prompt:

> Read AGENTS.md, then write a workflow that reads ./notes/*.md and writes a summary manifest to ./manifest.md. Save it as summarize-notes.nika.yaml.

**The local agent first**: opencode driving qwen2.5:14b on ollama, no cloud anywhere. It read the contract, then wrote confident YAML in a dialect it invented: `steps:` blocks, a `tool: summarize` that exists in no catalog. The audit stopped it at the door:

```text
❯ nika check summarize-notes.nika.yaml

PARSE ✗  [NIKA-PARSE-005] unknown field `steps` in the workflow envelope (strict mode)
```

Fed the error back, the model *described* a fix, and its own example was still wrong (a freshly invented `verb: summarize_notes`). Honest result: a 14B local model does not speak this language yet. But look at what did not happen. Nothing executed. No file was touched. The invented plan died as a parse error, not as a production incident. That is the loop working, not failing: the audit does not require a strong agent, it makes weak agents *safe*.

**The frontier agent next**: `claude -p`, headless; one of several, the scaffold does not care which frontier you call. First shot, audit-green. Here is the file it wrote, shown as reviewed. The two lines we ended up changing are the story of the third act:

```yaml summarize-notes.nika.yaml
nika: v1
workflow:
  id: summarize-notes
  description: "Summarize the three notes under ./notes/ into ./manifest.md"

model: ollama/llama3.2:3b   # local · zero key · swap for anthropic/claude-haiku-4-5

permits:
  fs:
    read: ["./notes/monday.md", "./notes/tuesday.md", "./notes/wednesday.md"]
    write: ["./manifest.md"]
  exec: false
  tools: ["nika:read", "nika:write"]

tasks:
  # No deps between the three reads → the engine runs them in parallel.
  monday:
    invoke:
      tool: "nika:read"
      args: { path: "./notes/monday.md" }

  tuesday:
    invoke:
      tool: "nika:read"
      args: { path: "./notes/tuesday.md" }

  wednesday:
    invoke:
      tool: "nika:read"
      args: { path: "./notes/wednesday.md" }

  summary:
    depends_on: [monday, tuesday, wednesday]
    infer:
      prompt: |
        Three daily standup notes ·

        --- monday ---
        ${{ tasks.monday.output }}

        --- tuesday ---
        ${{ tasks.tuesday.output }}

        --- wednesday ---
        ${{ tasks.wednesday.output }}

        Write ONE paragraph (3-5 sentences) summarizing the week so far ·
        what was shipped, what was fixed, and what comes next.
        Plain prose · no bullets · no headings.
      max_tokens: 2000

  save:
    depends_on: [summary]
    invoke:
      tool: "nika:write"
      args:
        path: "./manifest.md"
        content: "${{ tasks.summary.output }}"

outputs:
  manifest: ${{ tasks.summary.output }}
```

Three things worth reading in a file no human drafted. It did not invent: it started from the embedded showcase example the authoring skill points to, the exact read-summarize-write shape. It built its own cage. The `permits:` block came from `nika check --infer-permits`: reads scoped to exactly three note files, writes scoped to exactly one, `exec: false`, two tools. And handed a free model choice, the cloud agent picked a *local* model for the inference. The sovereignty lives in the file, not in whoever wrote it.

```text
❯ nika check summarize-notes.nika.yaml

 ✔ PLAN     3 wave(s) · 5 task(s) · max parallelism 3
 ✔ MODELS   1 model resolves in this binary
 ⚠  COST     $0.0000 – $0.0000 FLOOR (unbounded tasks present)
   summary  ollama/llama3.2:3b  UNBOUNDED — no catalog price (local/unknown model)
 ✔ SECRETS  no information-flow escapes
 ✔ TOOLS    every nika: tool names a canonical builtin
 ✔ PERMITS  body fits the declared boundary
 ✔ audited · 5 task(s) · 3 wave(s) · permits declared · 0 hints
```

The `COST` warning is honesty, not a defect: a local model has no catalog price, and the audit refuses to pretend unpriced compute is free compute.

**Then the run, and the trap.** The agent's draft named `ollama/qwen3.5:4b` with `max_tokens: 512`. Five tasks, all green, exit 0. And `./manifest.md` was empty. The trace autopsy, one command:

```text
❯ nika trace peek .nika/traces/<run>.ndjson summary

  summary · infer · ollama/qwen3.5:4b
  33.8s · 512 tok · 2B

  ""
```

Two bytes. qwen3.5 is a thinking model: it spent all 512 tokens inside its reasoning block and emitted nothing. The run stayed green, because an empty string is a valid output. First review line: raise `max_tokens` to 2000. Resume re-runs the summary (an edited task [is a different task](/blog/the-resume-story)), and the model thought its way through 2000 tokens to the same two quote marks.

Second review line: swap the model to `llama3.2:3b`. And here the session paid for itself twice, because resume *skipped* the summary: a cache hit on stale, empty output. The task identity covers the task as written and its inputs, but not the envelope `model:` line, so a model swap looks like nothing changed. We filed that upstream as [#409](https://github.com/supernovae-st/nika/issues/409), and the silent empty-but-green infer as [#410](https://github.com/supernovae-st/nika/issues/410). Both were found not by a demo going well but by a trace that names the model, the token count, and the two bytes.

A model swap is precisely a change [the hashes cannot see](/blog/the-one-task-rerun), which is what `--from` is for. Name the distrust and re-roll it:

```text
❯ nika run summarize-notes.nika.yaml --resume last.ndjson --from summary

  ↷  monday     cache hit (resume)
  ↷  tuesday    cache hit (resume)
  ↷  wednesday  cache hit (resume)
  ✔  summary    infer · ollama/llama3.2:3b  6.9s
  ✔  save       invoke · nika:write  3ms

  resumed · 3 skipped (cache hit) · 2 ran live
```

6.9 seconds, 89 tokens, 470 bytes, and `./manifest.md` holds a real paragraph: *"The week started with a promising start as the parser was successfully shipped on Monday…"*. Not Pulitzer material; a 3B wrote it on a laptop. But it is real, it is scoped, and the three reads it depends on never ran twice.

Count what the human actually did in this story. Zero YAML written. One ask, worded like you would say it out loud. Then a review: read a 70-line file and change two lines, a model name and a token budget. The agent wrote the plan; the audit refused the invented one before anything ran; the trace made the silent failure inspectable; the re-run touched only what our doubt named. That is the same division of labor your code already lives under, extended to the work agents want to *run*. The whole contract fits in one file your agent now knows how to write, and `nika init` is where it learns.
