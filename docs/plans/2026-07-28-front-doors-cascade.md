# The front doors · one line, eleven surfaces

> Status: **draft for operator review**, 2026-07-28. Nothing in this doc has
> been applied. Every surface below lives in a PUBLIC repo; the operator merges
> each one himself.
>
> Relation to `2026-07-28-nika-site-v5-control-spine.md` (same day): that doc
> locked the wedge as CONTROL and marked `llms.txt` + JSON-LD « already right,
> leave ». This doc supersedes its §6 canonical copy and §8 cascade table on
> the positioning-line question only. Its §1-§5 (the legibility defect, the
> spine, what dies) and §7 (the fil-rouge) are untouched and still govern the
> home rebuild. The wedge moves from CONTROL to THE TOOLCHAIN; the spine that
> carries it does not move.
>
> Its §8 also listed « docs.nika.sh landing (audit pending) ». That audit is
> §1.6 below.

---

## 1. The measurement

Eleven surfaces, audited empirically on 2026-07-28 against `nika 0.106.0`
(`/opt/homebrew/bin/nika`). Every quote is verbatim with `file:line`.

### 1.1 `public/llms.txt` (the agents front door)

`(this repo) public/llms.txt:4-8`

```
> Nika is the control layer for AI agents: the agent writes its plan as a
> readable file first (steps, tools, permissions, outputs), you review it, the
> runtime enforces it, then it runs (traced and replayable). An open workflow
> language plus its reference engine in Rust. Apache-2.0 spec ·
> AGPL-3.0-or-later engine. Paris. SuperNovae Studio.
```

### 1.2 Home `<head>` + JSON-LD

`(this repo) src/pages/Home.tsx:79`
(JSON-LD `SoftwareApplication.description`)

```
'The control layer for AI agents. Nika makes an agent write its plan as a readable file first: every step, tool and permission. You review it, the runtime enforces it, then it runs: traced and replayable. One Rust binary, any model, AGPL forever.',
```

The same claim is restated three more times in the same file, each a different
length: `:160` (meta description), `:166` (`og:description`), `:172`
(`twitter:description`). All four open on « The control layer for AI agents ».

### 1.3 Home H1

`(this repo) src/sections/Hero.tsx:303`

```
            Useful AI work shouldn&rsquo;t disappear into chats.
```

Eyebrow above it, `Hero.tsx:298`: `[ INTENT AS CODE ]`.

### 1.4 Engine README

`(supernovae-st/nika) README.md:11-12`

```
> **Intent as Code.** The workflow language for AI: one file, 4 verbs,
> one binary.
```

Body lead, same file `:24-26`, repeats the site's old H1 verbatim:

```
Useful AI work shouldn't disappear into chats. **Nika turns repeatable AI
work into files you can run, review, diff and share.** If you do the same
AI task twice, make it a workflow.
```

### 1.5 Spec README

`(supernovae-st/nika-spec) README.md:10-13`

```
<h1 align="center">Nika · the workflow language for AI</h1>

<p align="center"><strong>A declarative YAML language for orchestrating AI workflows.<br>
Sovereign · multi-provider · local-first.</strong></p>
```

### 1.6 docs.nika.sh landing (the audit that was pending)

Navigation root is `docs.json:130-140`, first tab → first group → first page =
`introduction`. There is no `index.mdx`; **`introduction.mdx` is the landing
page**, and Mintlify renders the frontmatter `title` as the H1, so the page's
visible H1 is the word « Introduction ».

`(supernovae-st/nika-docs) introduction.mdx:2-3`

```
title: "Introduction"
description: "Intent as Code: the workflow language for AI. One file, 4 verbs, one binary. Runs on your laptop."
```

Body lead, `:10-13`:

```
Useful AI work shouldn't disappear into chats. **Nika turns repeatable AI
work into files you can run, review, diff and share**: one `.nika.yaml`
file, four verbs, one Rust binary. If you do the same AI task twice, make
it a workflow.
```

Site-level, `(supernovae-st/nika-docs) docs.json:4`

```
"description": "Documentation for Nika — the AGPL workflow engine for AI. Semantic YAML, Rust, runs on your laptop.",
```

Three findings here. First, `docs.json` says **engine** where the page says
**language**. Second, « Intent as Code » appears exactly once in the whole docs
repo and only inside a `<meta>` tag, so a human reader never sees it rendered.
Third, « control layer » has **zero occurrences** in the docs repo: the
machine-readable surfaces on nika.sh and the docs site already disagree today.

### 1.7 Surfaces the brief did not list, that a developer hits before nika.sh

These matter more than the six above, because `brew info` and the marketplace
blurb are read *while deciding whether to install*.

| Surface | Verbatim | Location |
|---|---|---|
| Homebrew formula `desc` (what `brew info nika` prints) | `Workflow language for AI - audit pipelines before they run, trace after` | `homebrew/repo/Formula/nika.rb:5` |
| Homebrew README lead | `One command, one binary.` | `homebrew/repo/README.md:12` |
| VS Code `displayName` | `Nika Workflow Language` | `vscode/repo/package.json:3` |
| VS Code marketplace blurb (372 chars) | `See your workflow before it runs: the live DAG canvas for Nika, the workflow language for AI (.nika.yaml). Check-as-you-type diagnostics, run + time-travel replay, and a static audit before a token is spent (cost ceiling · secret-flow · permits). Local-first: Ollama, llama.cpp, vLLM, Mistral + more. For VS Code, Cursor, Windsurf, VSCodium.` | `vscode/repo/package.json:4` |
| VS Code README tagline | `> **See the DAG before you run it. Local traces, your models.**` | `vscode/repo/README.md:18` |
| nika-agents marketplace | `Nika · the workflow language for AI. Author AI workflows as checkable .nika.yaml files.` | `agents/repo/.claude-plugin/marketplace.json:4` |
| nika-agents, Cursor variant (diverges from the Claude one) | `Nika, the workflow language for AI. Author AI workflows as checkable .nika.yaml files: plan first, audit before a token is spent, verify after.` | `agents/repo/.cursor-plugin/marketplace.json:8` |
| `nika welcome` line 1 | `Intent as Code. The workflow language for AI.` | `engine/repo/crates/nika-cli/src/verbs/welcome.rs:178` |
| `nika --help` root about | `nika · the AI workflow engine — operator surface` | binary `--help`, v0.106.0 |
| `nika init` generated `AGENTS.md` | `Nika is a sovereign AI workflow engine. Workflows are *.nika.yaml files, **audited before they run**.` | `engine/repo/crates/nika-onboard/src/briefs.rs:32-33` |
| client-sdk README | `The TypeScript client for Nika, the workflow language for AI.` | `client-sdk/repo/README.md:12` |
| audit-workflow README | `A full SEO + GEO site audit as one workflow file.` | `audit-workflow/repo/README.md:12` |

### 1.8 The count, honestly

Four formulations are in production at once. Ranked by surface count:

| Formulation | Where |
|---|---|
| « the workflow language for AI » | engine README, spec README H1, docs frontmatter, VS Code blurb, all agents manifests, homebrew README, homebrew formula, client-sdk, `nika welcome` |
| « the control layer for AI agents » | `llms.txt`, `Home.tsx` ×4 (JSON-LD + meta + og + twitter) |
| « workflow **engine** » | `docs.json:4`, `nika --help` root, `nika init` AGENTS.md |
| « Useful AI work shouldn't disappear into chats » | Home H1, engine README body, docs body |

The dominant line is already « the workflow language for AI » on nine surfaces.
« The control layer for AI agents » exists on exactly two files, both on the
website, both machine-readable. The v5 plan's §8 read this backwards: it treated
the two machine-readable files as the standard the other nine should follow.
They are the minority.

**`nika init` is the outlier that matters most.** « sovereign AI workflow
engine » appears on no other surface, and it is the file every coding agent
reads first in a Nika repo.

---

## 2. Pressure-testing « a compiler for AI work »

The wedge (the toolchain: check, test, dap, lsp, plus the runtime and the
trace) is not in question here. Only the wording is.

### 2.1 The substance is real, and I verified it

Run on a deliberately broken file, `nika check` printed named passes, not a
blob: `CONFORM`, `PLAN`, `MODELS`, `COST`, `SECRETS`, `TYPES`, `TOOLS`, `ARGS`,
`SCHEMA`, `GATES`, `PERMITS`, then `HINT` lines. Each finding carried a code, a
source span with a caret, and a fix command:

```
 ✖ CONFORM  [NIKA-VAR-021] task `a3` a verb field references `tasks.a2` — outside the boundary; hoist it into `with:` and read `${{ with.<name> }}` (`nika check --fix` applies it)
   fix: nika explain NIKA-VAR-021 · https://nika.sh/errors/NIKA-VAR-021
   ╭▸ bad.nika.yaml:15:15
```

That is a compiler diagnostic in every respect that matters. The lethal-trifecta
check is real and static: `NIKA-SEC-009`, described in
`spec/repo/canon.yaml:393` as « the Rule of Two as a static check » (NEP-0002
v2.0). The `UNBOUNDED` cost floor is real and printed per task.

### 2.2 The three strongest objections

**« Compiles to what? »** A compiler emits an artifact. Nika emits nothing: it
reads, refuses, and hands the file to an interpreter. The honest answer is that
Nika has a compiler *front-end* (parse, resolve, typecheck, dataflow, refuse)
and an interpreter back-end, and the front-end is the part being sold. Shortest
honest answer: **« It doesn't compile down, it refuses up. Same front-end, no
codegen: parse, resolve, typecheck, information-flow, then it declines to
run. »**

**« AI is nondeterministic. You can't typecheck a prompt. »** Correct, and Nika
does not claim to. It checks the program *around* the model: the graph, the
types at the seams between tasks, the permission boundary, the secret flows, the
spend ceiling. Shortest honest answer: **« It doesn't check what the model will
say. It checks everything the model is wired to. »**

**« My linter already does this. »** It does not, and this is the demo. A linter
cannot see a secret reaching an egress-capable task, an unreachable task, or an
unbounded spend, because those are dataflow and graph properties, not syntax.
Shortest honest answer: **« Name a linter that catches a secret reaching the
network through three hops. That's `NIKA-SEC-007`, and it runs before you pay. »**

**A fourth, strategic, that no developer will say out loud:** « compiler » is a
contested word in AI right now. DSPy calls its prompt optimizer a « compiler »
and means something unrelated. Leading with the noun invites the wrong
comparison from the exact audience most likely to have heard of DSPy.

### 2.3 Where I push back

Keep the wedge. **Do not make « compiler » the noun in first position.** Three
reasons, in order of weight: the codegen objection lands in under two seconds
and costs you the sentence; the DSPy collision is live; and « the workflow
language for AI » is already the incumbent on nine surfaces, so replacing the
*noun* is a nine-surface rewrite while replacing the *promise* is additive.

The move that costs least and carries most: **keep the category noun, and let
the compiler behaviour be the promise attached to it.** One adjective does the
work.

- **Category noun (replaces nothing, adds one word):** « the **checked**
  workflow language for AI »
- **The promise (the H1 register):** « Your agent writes the workflow. Nika
  reads it back. »
- **The analogy, second position only, never first:** « A compiler front-end
  for AI work: it parses the plan, types the seams, tracks the secrets, prices
  the spend, and names every fix. »

« Checked » is the whole wedge in one adjective. It is what a cold developer
already understands from `tsc`, and it is the word that makes « language » stop
meaning « YAML dialect » and start meaning « thing with a type system ». It also
survives the codegen objection completely, because a checker owes no artifact.

The « you don't review plans » insight belongs in the sub, where it can be said
plainly: **« You read four findings, not a hundred lines. »**

### 2.4 One claim to drop

The brief describes « 96 diagnostic codes before a token is spent ». The 96 is
projected and correct: `spec/repo/canon.yaml:299` declares `count: 96`, a YAML
parse of `error_codes.items` returns exactly 96 unique codes, and
`website/src/canon.generated.ts:32` carries `errorCodes: 96`.

But **the catalog is not all check-time.** It includes `NIKA-TIMEOUT`,
`NIKA-CANCEL`, `NIKA-EXEC`, `NIKA-INFER`, `NIKA-AUTH` runtime paths. Attaching
« before a token is spent » to the full 96 is an overclaim, and there is no
projected check-time subset to substitute: `canon/diagnostics/registry.yaml`
does carry a `plane` field, but it currently reads `check: 16, unclassified: 91`
with `status` at `reserved: 96, active: 11`, so it is a forward-looking registry
mid-migration, not a source you can quote today.

Say the two facts separately, never multiplied: **a 96-code diagnostic catalog**,
and **`nika check` runs before a token is spent**. Both are true and projected.
If a check-time count is wanted as copy later, the `plane` field is the place to
earn it, once it is classified and active.

---

## 3. The drafts

Each in its own register. Structure preserved, only the load-bearing sentence
moves.

### 3.1 `public/llms.txt` (dense, machine-readable, **no em-dashes**)

The website voice gate (`src/test/voice.test.ts`) scans `public/llms.txt` for
em-dashes and the file is currently clean. The draft keeps it clean.

```diff
--- a/public/llms.txt
+++ b/public/llms.txt
@@ -4,8 +4,9 @@
-> Nika is the control layer for AI agents: the agent writes its plan as a
-> readable file first (steps, tools, permissions, outputs), you review it, the
-> runtime enforces it, then it runs (traced and replayable). An open workflow
-> language plus its reference engine in Rust. Apache-2.0 spec ·
-> AGPL-3.0-or-later engine. Paris. SuperNovae Studio.
+> Nika is the checked workflow language for AI: your agent writes the plan as a
+> readable file, and `nika check` reads it back before a token is spent (types,
+> secret flows, cost floor, permits boundary), naming the fix for every finding.
+> A compiler front-end for AI work plus its reference engine in Rust: check,
+> test offline, run, then time-travel the trace. Apache-2.0 spec ·
+> AGPL-3.0-or-later engine. Paris. SuperNovae Studio.
```

### 3.2 `src/pages/Home.tsx` (four descriptions, four lengths)

```diff
--- a/src/pages/Home.tsx
+++ b/src/pages/Home.tsx
@@ -79 +79 @@ JSON-LD SoftwareApplication.description
-        'The control layer for AI agents. Nika makes an agent write its plan as a readable file first: every step, tool and permission. You review it, the runtime enforces it, then it runs: traced and replayable. One Rust binary, any model, AGPL forever.',
+        'The checked workflow language for AI. Your agent writes the plan as a readable file; nika check reads it back before a token is spent: types, secret flows, cost floor, permits boundary, every finding naming its fix. Then run it, and time-travel the trace. One Rust binary, any model, AGPL forever.',
@@ -160 +160 @@ meta description
-          'The control layer for AI agents: the plan is a file you review before it runs, permissions enforced, every run replayable. One binary, any model, AGPL.',
+          'The checked workflow language for AI: your agent writes the plan, nika check reads it back before a token is spent, types and secret flows and spend included. One binary, any model, AGPL.',
@@ -166 +166 @@ og:description
-          'The control layer for AI agents. Review the plan before it acts, enforce its permissions, replay the trace. One file, four verbs, one binary.',
+          'The checked workflow language for AI. Your agent writes the workflow, Nika reads it back and names every fix, before a token is spent. One file, four verbs, one binary.',
@@ -172 +172 @@ twitter:description
-          'The control layer for AI agents. Review before it acts, enforce its permissions, replay the trace.',
+          'The checked workflow language for AI. Your agent writes the workflow. Nika reads it back, before a token is spent.',
```

`Home.tsx:146` and `:162` (`title: 'Nika · Intent as Code'`) stay. The brand
kicker is not the explainer, per v4.1 §2, still binding.

### 3.3 `src/sections/Hero.tsx` (the H1)

```diff
--- a/src/sections/Hero.tsx
+++ b/src/sections/Hero.tsx
@@ -303 +303 @@
-            Useful AI work shouldn&rsquo;t disappear into chats.
+            Your agent writes the workflow. Nika reads it back.
```

Eyebrow at `:298` stays `[ INTENT AS CODE ]`.

Sub copy (the JSX at `:315` onward is heavily annotated and its shape is the
operator's; this is the copy only):

> Every step, every tool, every permission, checked **before a token is
> spent**: unresolved references, secret flows, unbounded spend, a permits
> boundary the file cannot honor. You read four findings, not a hundred lines.

The existing sub's three receipts (permits default-deny, the hash-chained trace,
`--max-cost-usd`) survive unchanged; they now land as the *after* half of a
before/after pair rather than as the whole pitch.

### 3.4 Engine README (the tagline blockquote, then the body lead)

```diff
--- a/README.md
+++ b/README.md
@@ -11,2 +11,2 @@
-> **Intent as Code.** The workflow language for AI: one file, 4 verbs,
-> one binary.
+> **Intent as Code.** The checked workflow language for AI: one file,
+> 4 verbs, one binary, audited before a token is spent.
@@ -24,3 +24,4 @@
-Useful AI work shouldn't disappear into chats. **Nika turns repeatable AI
-work into files you can run, review, diff and share.** If you do the same
-AI task twice, make it a workflow.
+Your agent writes the workflow. **Nika reads it back before a token is
+spent** and names every fix: unresolved references, secret flows, unbounded
+spend, a permits boundary the file cannot honor. You read four findings,
+not a hundred lines.
```

The paragraph that follows (« **The pipeline is a file.** ... The way SQL pairs
with PostgreSQL, or the Dockerfile with Docker. ») stays verbatim. It already
carries « audits that file **before a token is spent** », so the new lead sets
up a promise the next paragraph already pays.

### 3.5 Spec README (the language repo: it *defines* the checks, it does not run them)

```diff
--- a/README.md
+++ b/README.md
@@ -12,2 +12,2 @@
-<p align="center"><strong>A declarative YAML language for orchestrating AI workflows.<br>
-Sovereign · multi-provider · local-first.</strong></p>
+<p align="center"><strong>A declarative YAML language for AI workflows, specified to be checked before it runs.<br>
+Sovereign · multi-provider · local-first.</strong></p>
```

« specified to be checked », not « checked »: this repo is Apache-2.0 and owns
the diagnostic taxonomy (`spec_owns_errors` is already a registered canonical
phrase, home `spec/05-errors.md`); the engine implements it. Overclaiming here
would break the licence-split story the H1 exists to tell.

`README.md:10` (`<h1>Nika · the workflow language for AI</h1>`) gains one word:

```diff
-<h1 align="center">Nika · the workflow language for AI</h1>
+<h1 align="center">Nika · the checked workflow language for AI</h1>
```

### 3.6 docs.nika.sh

```diff
--- a/introduction.mdx
+++ b/introduction.mdx
@@ -3 +3 @@
-description: "Intent as Code: the workflow language for AI. One file, 4 verbs, one binary. Runs on your laptop."
+description: "Intent as Code: the checked workflow language for AI. One file, 4 verbs, one binary, audited before a token is spent."
@@ -10,4 +10,4 @@
-Useful AI work shouldn't disappear into chats. **Nika turns repeatable AI
-work into files you can run, review, diff and share**: one `.nika.yaml`
-file, four verbs, one Rust binary. If you do the same AI task twice, make
-it a workflow.
+Your agent writes the workflow. **Nika reads it back before a token is
+spent**: one `.nika.yaml` file, four verbs, one Rust binary. Types, secret
+flows, cost floor, permits boundary, and a named fix for every finding.
+You read four findings, not a hundred lines.
```

```diff
--- a/docs.json
+++ b/docs.json
@@ -4 +4 @@
-  "description": "Documentation for Nika — the AGPL workflow engine for AI. Semantic YAML, Rust, runs on your laptop.",
+  "description": "Documentation for Nika · the checked workflow language for AI. Audited before a token is spent, AGPL engine in Rust, runs on your laptop.",
```

Two fixes ride along: `engine` becomes `language` (the page and the site config
disagreed), and the em-dash becomes a middot, matching every other surface.

`introduction.mdx:34` (« A workflow language plus its reference engine. ») is
the one place in the whole estate that already reconciles language-vs-engine.
Leave it, and consider promoting it.

### 3.7 Homebrew formula `desc` (what `brew info nika` prints)

Homebrew's audit rules constrain this string: no leading article, no trailing
period, 80 chars or fewer.

```diff
--- a/Formula/nika.rb
+++ b/Formula/nika.rb
@@ -5 +5 @@
-  desc "Workflow language for AI - audit pipelines before they run, trace after"
+  desc "Checked workflow language for AI - audited before a token is spent"
```

70 chars. Keeps the ASCII hyphen, which is deliberate here and the only surface
that needs it.

### 3.8 VS Code marketplace

`displayName` stays `Nika Workflow Language`: it is the search key, and
renaming it costs marketplace continuity for one adjective.

```diff
--- a/package.json
+++ b/package.json
@@ -4 +4 @@
-  "description": "See your workflow before it runs: the live DAG canvas for Nika, the workflow language for AI (.nika.yaml). Check-as-you-type diagnostics, run + time-travel replay, and a static audit before a token is spent (cost ceiling · secret-flow · permits). Local-first: Ollama, llama.cpp, vLLM, Mistral + more. For VS Code, Cursor, Windsurf, VSCodium.",
+  "description": "See your workflow before it runs: the live DAG canvas for Nika, the checked workflow language for AI (.nika.yaml). Check-as-you-type diagnostics, run + time-travel replay, and a static audit before a token is spent (cost ceiling · secret-flow · permits). Local-first: Ollama, llama.cpp, vLLM, Mistral + more. For VS Code, Cursor, Windsurf, VSCodium.",
```

One word. This blurb is already the best-aligned surface in the estate: it leads
on checking, it names the passes, and its provider list already obeys the
presentation-order lock (local and open-weight first, then Mistral). The README
tagline (`README.md:18`, « See the DAG before you run it. ») is the extension's
own promise, not the product's, and should stay.

### 3.9 `nika-agents` manifests

The Claude and Cursor marketplace descriptions have drifted apart. Converge them
on the Cursor one, which is already the better sentence, plus the adjective:

```diff
--- a/.claude-plugin/marketplace.json
+++ b/.claude-plugin/marketplace.json
@@ -4 +4 @@
-  "description": "Nika · the workflow language for AI. Author AI workflows as checkable .nika.yaml files.",
+  "description": "Nika · the checked workflow language for AI. Author AI workflows as .nika.yaml files: plan first, audit before a token is spent, verify after.",
```

```diff
--- a/.cursor-plugin/marketplace.json
+++ b/.cursor-plugin/marketplace.json
@@ -8 +8 @@
-  "description": "Nika, the workflow language for AI. Author AI workflows as checkable .nika.yaml files: plan first, audit before a token is spent, verify after."
+  "description": "Nika · the checked workflow language for AI. Author AI workflows as .nika.yaml files: plan first, audit before a token is spent, verify after."
```

`.agents/plugins/marketplace.json:4` (`displayName`) takes the same adjective.
`.codex-plugin/plugin.json:3` (`Nika · Intent as Code`) stays: it is the only
manifest carrying the brand kicker, and that is fine in a `displayName`.

### 3.10 `nika welcome` (the CLI greeting)

`engine/repo/crates/nika-cli/src/verbs/welcome.rs:178`

```diff
-        "{} {} — Intent as Code. The workflow language for AI.",
+        "{} {} — Intent as Code. The checked workflow language for AI.",
```

Line 2 at `:184` (`one file · 4 verbs · one binary · audited BEFORE it runs`)
already says the wedge and stays as is.

**Two tests pin the literal** and must be updated in the same commit:
`crates/nika-cli/tests/bin_smoke.rs:1025` and `welcome.rs:511`, both asserting
on `"Intent as Code"`. That substring survives this edit, so both should still
pass; confirm rather than assume.

### 3.11 `nika init` generated `AGENTS.md` (the highest-leverage surface here)

`engine/repo/crates/nika-onboard/src/briefs.rs:32-33`. This is the file every
coding agent reads first inside a Nika repo, and it is the only surface saying
« sovereign AI workflow engine ».

```diff
-Nika is a sovereign AI workflow engine. Workflows are `*.nika.yaml` files,
-**audited before they run**. (This guide is scaffolded by `nika init`.)
+Nika is the checked workflow language for AI. Workflows are `*.nika.yaml`
+files, **audited before a token is spent**: run `nika check <file>` and fix
+every finding it names before you run anything. (This guide is scaffolded
+by `nika init`.)
```

The added imperative is the point: this text is read by the agent that will
write the workflow, so it should issue the instruction, not just describe the
product.

### 3.12 `nika --help` root about

The root about string reads `nika · the AI workflow engine — operator surface`.
It is the third surface saying « engine ». Aligning it is a one-line clap
attribute change in the engine repo; the exact `file:line` was not pinned in
this pass, so it is listed as a follow-up rather than as a diff.

---

## 4. The consistency ledger

One line, eleven surfaces, and the gate that would catch each one drifting.

| # | Surface | The line it will carry | Merged by | Gate that would catch drift | Status |
|---|---|---|---|---|---|
| 1 | `website/public/llms.txt:4` | the checked workflow language for AI, `nika check` reads it back before a token is spent | website | `voice.test.ts` scans this file, **em-dash class only** | 🔴 **no positioning gate** |
| 2 | `website/src/pages/Home.tsx:79,160,166,172` | same, four lengths | website | none | 🔴 **none** |
| 3 | `website/src/sections/Hero.tsx:303` | Your agent writes the workflow. Nika reads it back. | website | none | 🔴 **none** |
| 4 | `engine/repo/README.md:11` | the checked workflow language for AI: one file, 4 verbs, one binary, audited before a token is spent | engine | `check-nika-readme-noise.sh` gates README **noise** (journey vs destination), not the opening line | 🔴 **none for the line** |
| 5 | `spec/repo/README.md:10,12` | the checked workflow language for AI, specified to be checked before it runs | spec | none | 🔴 **none** |
| 6 | `docs/repo/introduction.mdx:3,10` + `docs.json:4` | same | docs | none | 🔴 **none** |
| 7 | `homebrew/repo/Formula/nika.rb:5` | Checked workflow language for AI - audited before a token is spent | homebrew | Homebrew's own `brew audit` (style only, not semantics) | 🔴 **none for the line** |
| 8 | `vscode/repo/package.json:4` | same adjective, blurb otherwise unchanged | vscode | none | 🔴 **none** |
| 9 | `agents/repo/*/marketplace.json` (2 files, currently divergent) | one converged sentence | agents | none | 🔴 **none, and already drifted** |
| 10 | `engine/.../welcome.rs:178` | Intent as Code. The checked workflow language for AI. | engine | `bin_smoke.rs:1025` + `welcome.rs:511` pin the substring `"Intent as Code"` only | 🟠 **partial** |
| 11 | `engine/.../briefs.rs:32` | Nika is the checked workflow language for AI. | engine | `the_scaffolded_agents_md_teaches_the_live_clap_tree` pins the **verb tree**, not the prose | 🔴 **none for the line** |

**Every surface is ungated for the positioning line. All eleven.** That is the
answer to « where will the next drift happen »: anywhere, and it already has
twice (the two `agents` marketplace files diverged from each other; `docs.json`
diverged from its own landing page).

### 4.1 The ratchet that costs least, because it already exists

a phrasing-coherence gate in our private monorepo tooling is a shipped, run-all-wired gate
that reads a `canonical_phrasing:` registry in `spec/repo/canon.yaml` and
verifies each load-bearing sentence still lives verbatim at its canonical home.
It carries ten entries today:

```
verb_definition · callable_is_tool · fetch_not_a_verb · jq_one_data_language
provider_is_prefix · envelope_forever · edges_never_inferred · cel_not_a_dsl
spec_owns_errors · prose_wins
```

The positioning line is simply not registered. Adding an eleventh entry is the
whole fix for the *home*:

```yaml
canonical_phrasing:
  product_category:
    phrase: "the checked workflow language for AI"
    match: "checked workflow language for AI"
    home: README.md
```

One caveat, stated by the gate itself in its own header: every `home` is
spec-repo-relative, and « paraphrase detection across OTHER surfaces is not
statically decidable and stays out of scope ». So the registry pins the home;
it does not cascade. Cascading to the other ten surfaces needs a second, wider
gate: a fixed-string presence check for the `match` anchor across an explicit
file list spanning the public repos. That is a wide gate, near-zero false
positive because it is a fixed string, and it is the thing that does not exist
today in any form.

### 4.2 Three drifts found while auditing, none of them copy

These are not positioning problems. They are live and should be triaged
separately.

**a. The provider count disagrees with itself on three doors of one binary.**

| Door | Says | Denominator |
|---|---|---|
| `CANON.providers` (`src/canon.generated.ts:16`) and `canon.yaml` | **17** | 11 cloud + 5 local + 1 mock |
| `nika check` MODELS hint | **16** runnable | 11 cloud + 5 local |
| `nika welcome` « this binary » | **15** | 10 cloud + 5 local |
| `nika catalog` header | **38** providers · 68 models | the embedded model catalog, a different registry (adds azure, bedrock, cohere, ai21 …) |

The first, second and fourth are reconcilable: different denominators, all
defensible. **The third is a real gap.** `nika doctor` enumerates exactly ten
cloud providers (`mistral anthropic openai gemini deepseek xai groq openrouter
huggingface nvidia`) where `CANON.providerIdsCloud` declares eleven.
**`moonshot` is missing from the doctor probe list**, and `nika welcome`
inherits the gap into a user-visible count. `cli-canon-binary-parity.sh` exists
but gates the `--help` verb surface, not these numbers.

**b. The Homebrew tap is one release behind.** `Formula/nika.rb:7` pins
`version "0.105.0"`; the installed binary and the agents manifests are at
`0.106.0`.

**c. `docs.nika.sh` has no authored `llms.txt`.** Mintlify generates
`/llms.txt` and `/llms-full.txt` at serve time from `docs.json` `description`
plus page frontmatter. So the docs site's agent-facing blurb is *derived* from
surface 6 above and cannot be authored directly. Fixing `docs.json:4` fixes
both.

---

## 5. Sequence

1. **Spec first.** `canon.yaml` gains the `canonical_phrasing.product_category`
   entry and `spec/repo/README.md` becomes its home. The gate is green before
   any consumer moves. (Producer before consumer.)
2. **The engine, the docs, the distribution surfaces.** README, `briefs.rs`,
   `welcome.rs` plus its two test assertions, `docs.json`, `introduction.mdx`,
   the formula `desc`, the VS Code blurb, the two `agents` manifests.
3. **The website last.** `llms.txt`, `Home.tsx` ×4, `Hero.tsx` H1 and sub, then
   `pnpm check && pnpm lint && pnpm build && pnpm test`, then `pnpm visual`
   re-baked per OS (the H1 is in the golden frame).
4. **The wide gate**, once the line has settled and stopped moving.

Item 4.2a (`moonshot`) is independent of all of this and can go first or last.

Commit trailer on every one of these:
`Co-Authored-By: Nika 🦋 <nika@supernovae.studio>`
