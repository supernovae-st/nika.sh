---
slug: the-run-that-waits
title: "The run that waits for you"
tag: Engine
date: 2026-07-10
description: "The approval gate is a task in the file, not a Slack thread: a plan fails closed on nika:prompt, and the human's answer rides the resume."
---

Every serious pipeline eventually needs a human in it. Ship the release note, *after someone reads it*. Send the refund, *after someone approves it*. The usual place that approval lives is a Slack thread, a dashboard button, a "reply YES to continue" email: somewhere outside the logic, invisible to review, lost to the audit.

Nika's answer is the same answer it gives everything else: **the gate is a task in the file.**

```yaml gated-release.nika.yaml
nika: v1
workflow: gated-release
description: "Draft the release note, wait for a human yes, only then publish"

permits:
  fs:
    read: ["./CHANGES.md"]
    write: ["./release-note.md"]
  tools: ["nika:read", "nika:write", "nika:prompt"]

tasks:
  - id: draft
    invoke:
      tool: "nika:read"
      args: { path: "./CHANGES.md" }

  # The gate: a human reads the draft and answers. Nothing downstream
  # runs until this task has an answer.
  - id: approve
    depends_on: [draft]
    invoke:
      tool: "nika:prompt"
      args:
        mode: confirm
        message: "Publish this release note?"

  - id: publish
    depends_on: [draft, approve]
    when: "${{ tasks.approve.output == true }}"
    invoke:
      tool: "nika:write"
      args:
        path: "./release-note.md"
        content: "${{ tasks.draft.output }}"

outputs:
  approved: "${{ tasks.approve.output }}"
```

`nika check` reads the gate like any other step: wave 1 drafts, wave 2 asks, wave 3 publishes. The plan a reviewer sees *is* the approval flow. There is no side channel to reverse-engineer.

Run it in a terminal and `approve` simply asks you there, in the console, and blocks until you answer. That is the easy case. The interesting case is the one every approval system actually lives in: **nobody is at the keyboard.** Cron fired the run. CI fired the run. What now?

```text
❯ nika run gated-release.nika.yaml   # headless · no one to ask

  ✔  draft    invoke · nika:read  2ms
  ✖  approve  invoke · nika:prompt
  ↷  publish  when: false
  ── 3/3 done · $0.00 · elapsed 0.0s ─────────────────────────────

  ✖ NIKA-BUILTIN-PROMPT-001 · non-interactive and no `default:` —
    cannot answer without a human
    trace: .nika/traces/2026-07-10T16-04-45Z-aaf0.ndjson
```

The run **fails closed**. Not "assumes yes", not "hangs forever holding a worker": a typed error names exactly what is missing (a human), the gated step is skipped (`when: false`), nothing is written, the exit code is 1. And the journal, the same [journal that survives kill -9](/blog/the-resume-story), recorded the question.

That trace is the pending approval. When a human shows up, the answer rides the resume:

```text
❯ nika run gated-release.nika.yaml \
    --resume .nika/traces/2026-07-10T16-04-45Z-aaf0.ndjson \
    --answer approve=true

  ↷  draft    cache hit (resume)
  ✔  approve  invoke · nika:prompt
  ✔  publish  invoke · nika:write  4ms

  resumed · 1 skipped (cache hit) · 2 ran live
```

`draft` is not re-done: finished work never runs twice. The gate binds your answer, and only then does `publish` touch the disk. The pairing is enforced by the CLI itself: `--answer` *requires* `--resume`. There is no way to pre-answer a question that has not been asked yet; the approval is always attached to a specific recorded run, of a specific file, with a specific draft already in its journal.

And a *no* is not a failure. Answer `--answer approve=false` and the run completes cleanly: the gate carries the refusal, `publish` skips (`when: false`), nothing ships, exit 0. A refused release is a workflow that **worked**: the outcome your reviewer chose, on the record, in the same trace format as everything else.

Three properties fall out of the gate being a task, none of which a Slack-thread approval has:

**It is reviewable before it runs.** The `when:` line on `publish` is the entire policy. A PR reviewer can see that nothing ships without a yes, the same way they [see the blast radius in `permits:`](/blog/injection-goes-nowhere).

**It fails closed by construction.** Headless with no `default:` is an error, not a guess. If you *want* an unattended fallback, you write `default:` into the file: visible, diffable, yours.

**The approval is evidence.** The question, the answer, who-ran-what-when: all of it lands in the run's journal next to every other event. Six months later the trace still shows the release went out because a human said yes.

Chats evaporate. Files compound. Even the "hey, can someone approve this?" is a file now.
