---
slug: the-editor-tells-the-truth
title: "The editor tells the truth"
tag: Engine
date: 2026-07-06
description: "A green badge is a claim. We audited the editor extension against the engine the way you'd audit a client against a server — and found the badge lying. Here is the contract that keeps it honest now."
---

The Nika extension paints `nika check` verdicts in the margin as you type: a green badge on the file tree, audit chips on the canvas cards, squiggles under the exact byte span. All of it is a projection of one JSON report the binary emits. Which raises the only question that matters about any projection: **what happens when the source grows a field the projection doesn't know?**

We found out this week, the honest way — by auditing our own client against our own server.

**The badge lied by omission.** The engine's check report carries finding families: secret leaks, permits escapes, unknown tools, schema defects. The extension folded seven of them. But the engine had grown three more — a required tool arg that's missing, an arg key that's a typo (`data:` where `nika:jq` wants `input:`), a `when:` gate that is provably dead. All three fail `nika check`: exit code 2, `clean: false`. The extension read none of them. So a workflow calling `nika:log` without its `message` showed a **green badge, a clean canvas, and a quiet Problems panel** — while the CLI, on the same file, refused it.

Worse: our AI-generate loop uses `nika check` as its oracle — draft, check, repair, until clean. Its definition of *clean* was «zero findings I can count». Three families it couldn't count meant it could ship a draft the binary rejects, and call it done.

**The fix is a contract, not a patch.** The three families now fold into every surface — with the engine's own `did you mean` suggestions and byte spans riding along. But the load-bearing change is smaller and harder-won:

```text
clean  =  parsed  ∧  zero findings  ∧  exit code 0
```

The last clause is the belt. The client's count mirrors the engine's `is_clean` list *today*; the exit code guarantees the verdict stays honest even when the engine grows a family the client hasn't learned yet. A future finding class can make the editor's count wrong — it can no longer make the editor's **verdict** wrong. The binary's exit outranks anything the client believes.

**The same audit killed the tmp-file dance.** Every keystroke-fresh check used to write your dirty buffer to a temp file, spawn the binary against it, and unlink. The engine now reads the Unix dash — `nika check - --json` — so unsaved work pipes straight to stdin and never touches the disk. And the extension doesn't gate that on a version number: it reads the binary's own `check --help` for the `-` line, because a dev build from main carries the feature while still reporting last week's version. **Probe what the binary does, never what it says it is.**

None of this is editor-specific. It's the discipline for any client of any audited system: mirror the server's definition of clean, carry its evidence (codes, spans, fixes) instead of paraphrasing it, and when the server gives you a verdict bit — trust it over your own bookkeeping. The margin paint is nice. The exit code is the truth.
