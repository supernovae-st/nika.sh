---
slug: prompts-are-code
title: "Prompts are code now"
tag: Language
date: 2026-07-08
description: "Prompt versioning without a platform: the prompt lives in the workflow file, so git diffs it, a PR reviews it, git reverts it. The engine itself names an edited prompt when two runs diverge."
---

Ask a team where their prompts live. A chat window. A doc titled `PROMPT_v2_FINAL_really`. An f-string three layers deep in a glue script. Then ask the question that matters during an incident: **which prompt produced this output?**

The usual answer is a prompt-management platform: another dashboard, another account, another place your logic lives that is not your repo. Nika's answer is shorter. **The prompt is a line in the workflow file.**

```yaml release-notes.nika.yaml
nika: v1
workflow:
  id: release-notes
# local model · nothing leaves this machine
model: ollama/llama3.2:3b

permits:
  fs: { read: [ ./commits.txt ], write: [ ./notes.md ] }
  tools: [ "nika:read", "nika:write" ]

tasks:
  commits: { invoke: { tool: "nika:read", args: { path: ./commits.txt } } }

  draft:
    depends_on: [ commits ]
    infer:
      prompt: "Write release notes from these commits: ${{ tasks.commits.output }}"
      max_tokens: 200

  save:
    depends_on: [ draft ]
    invoke: { tool: "nika:write", args: { path: ./notes.md, content: "${{ tasks.draft.output }}" } }

outputs:
  notes: "${{ tasks.draft.output }}"
```

One reviewable artifact: the model (a local one here), the permits, the plan, and the prompt. Which means the prompt inherits every tool your code already has, starting with the one you trust most.

**Git diffs it.** We ran the file once, then tightened the prompt, the kind of change teams make every week and then lose track of forever:

```text
$ git diff
diff --git a/release-notes.nika.yaml b/release-notes.nika.yaml
index 06134b3..253fa1e 100644
--- a/release-notes.nika.yaml
+++ b/release-notes.nika.yaml
@@ -13,7 +13,7 @@ tasks:
   draft:
     depends_on: [ commits ]
     infer:
-      prompt: "Write release notes from these commits: ${{ tasks.commits.output }}"
+      prompt: "Write release notes from these commits. Exactly three bullets, plain words, no hype: ${{ tasks.commits.output }}"
       max_tokens: 200

   save:
```

A prompt change as a one-line diff. It gets a commit message. It goes through a pull request, a colleague reads it, and someone can `git revert` it at 2am without archaeology.

**The diff shows up in the artifact.** Same three commits in, first prompt out:

```text
Release Notes

We are pleased to announce the availability of our latest release,
featuring several exciting updates and improvements.

**New Features**

* Added support for `--json` output when running the CLI command with
  the `check` option. This allows users to easily view check results
  in a JSON format.
* Expanded coverage of local models in our Quick Start documentation,
  providing more comprehensive guidance for getting started with
  [project name].
```

It keeps going like that: ceremony, section headers, and a helpful placeholder for a project name we never gave it. After the one-line diff:

```text
Here are the release notes based on the commits:

Release Notes v0.1

* Resolved an issue with parser where anchors were resolved after merge keys.
* Added a new command-line option (--json) to output JSON data during check.
* Updated documentation to include coverage of using local models in the quickstart guide.
```

Still a 3B model: it kept its little preamble. But the three bullets are there, plain, and they will be there on every future run, because the constraint lives in the file, not in a chat's short-term memory.

**Every run pins the prompt that produced it.** The run closes with its trace and the journal records the workflow's content identity:

```text
  🦋 nika · release-notes · 3 tasks
     permits ✓ declared boundary · default-deny

  ✔  commits  invoke · nika:read           0ms
  ✔  draft    infer · ollama/llama3.2:3b  1.5s
  ✔  save     invoke · nika:write          0ms
  ── 3/3 done · $0.00 · elapsed 1.5s ─────────────────────────────
    trace: .nika/traces/2026-07-08T09-52-43Z-22c6.ndjson · 11 events · chain 03ad7a3f2bf1c6a92481b8483b9942ab
```

The old run stays exactly as it happened, replayable after the edit: `nika trace replay` re-renders the recorded events, it never re-executes. So "which prompt produced this output?" has a literal answer, the one recorded with the run.

**And the engine names an edit.** Hand `nika trace reproduce` the runs from before and after the diff:

```text
$ nika trace reproduce .nika/traces/2026-07-08T09-52-15Z-e90b.ndjson .nika/traces/2026-07-08T09-52-43Z-22c6.ndjson
  reproduced       commits
  AUTHORED         draft — the task changed
  ENVIRONMENT      save — inputs differ

DIVERGED — 1 AUTHORED · 1 ENVIRONMENT · 1 reproduced
  engine: 0.97.0/macos/aarch64 (both runs)
```

`AUTHORED — the task changed`. Not "the model is being weird today": a classified, named fact that the divergence came from your edit. You can watch it propagate too, the downstream `save` diverging as `ENVIRONMENT` because its input changed. Prompt versioning is not just storage; it is being able to say, between any two runs, *this changed because we changed it*.

No platform. No prompt registry with its own login. A text file in your repo, the versioning tool you have used for fifteen years, and one binary as the witness.

Every transcript in this post was captured verbatim against the released `nika 0.97.0` (`brew install supernovae-st/tap/nika`), on a local model, for $0.00.
