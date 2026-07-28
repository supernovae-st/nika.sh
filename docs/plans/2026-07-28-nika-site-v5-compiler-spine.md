# nika.sh — v5 · the compiler spine (home rebuild + the three front doors)

> Status: **locked direction**, 2026-07-28. Operator-confirmed: the wedge is
> **THE COMPILER**, the home is re-argued from scratch, the cascade covers
> nika.sh + README engine + README spec + docs.nika.sh.
> Supersedes the *implementation* of `2026-06-17-nika-site-v4.1-control-narrative.md`
> — and now also supersedes that doc's **wedge** (see §0).
> Companion (aesthetic, unchanged): `2026-06-17-nika-site-v4-trust-landing-design.md`.
>
> **Renamed.** This file was published an hour earlier as
> `docs/plans/2026-07-28-nika-site-v5-control-spine.md`. That path is gone; this
> is the same document with §3 · §4 · §6 · §7 · §8 · §9 re-decided. Citations to
> the old filename resolve here.

---

## 0. The wedge, replaced

The hour-old version of this doc sold **CONTROL** — H1 « Review the plan before
your agent runs it. » The operator killed it with one question: *does anyone
actually want to review a plan?*

They do not, and the proof is in-house. `dx/.claude/rules/auto-vs-confirm.md:27`
records the operator's own written policy — « Thibaut opère majoritairement en
**bypass / acceptEdits permission mode** » — with `:36` budgeting ~90% of actions
to silent TRUST. The man who *built* the control layer runs everything on
bypass. Every permission prompt ever shipped converges on "allow always".
« Review the plan » sells a chore, and a chore is not a wedge.

**The plan's value was never that a human reads it. It is that a machine can —
and Nika's machine reads it better than any human would.**

That machine exists, it ships today, and the site does not mention it above the
fold. `nika 0.106.0` is a **language toolchain**: a compiler (`nika check`), a
test runner (`nika test`), a debugger (`nika dap`), a language server
(`nika lsp`). The site sells a file format.

Everything below is measured against `nika 0.106.0` (Homebrew, `/opt/homebrew/bin/nika`)
and the tree at `c35bf07`.

### 0.1 · What the compiler actually does (all output real, `--plain`)

Run on a plausible PR-review workflow with four ordinary defects:

```
 X  CONFORM  [NIKA-VAR-001] unknown field `tasks.diff.stdout` — not a result-record field or declared binding
   fix: nika explain NIKA-VAR-001 · https://nika.sh/errors/NIKA-VAR-001
  --> broken.nika.yaml:26:10
   |
26 |       d: ${{ tasks.diff.stdout }}
   |          ^
 !  COST     $0.0000 – $0.0000 FLOOR (unbounded tasks present)
   judge  anthropic/claude-sonnet-4-20250514  UNBOUNDED — no max_tokens declared
 ok SECRETS  no information-flow escapes
 ok TYPES    every deep output reference fits its declared shape
 X  TOOLS    `nika:writ` (task `post`) is not a canonical builtin · fix: did you mean `nika:wait`?
 ok SCHEMA   every authored schema: is satisfiable
 ok GATES    every task is statically reachable · status literals in vocabulary
 X  PERMITS  [NIKA-SEC-004 · tools] task `post` · invoke tool `nika:writ` is outside permits.tools
 ok TRIFECTA no lethal trifecta without a dominating human gate
 ↳ HINT     [NIKA-DRIFT-001 · drift] `permits.fs.read` entry `./src/**` matches no path the body reads — remove the entry
 ↳ HINT     [dead-spend] no task or output consumes `tasks.judge.output` — every token this infer spends is unread; consume it or remove the task
```

Twelve named gates — `CONFORM · PLAN · MODELS · COST · SECRETS · TYPES · TOOLS ·
ARGS · SCHEMA · GATES · PERMITS · TRIFECTA` — over `CANON.errorCodes` diagnostics
in `CANON.errorNamespaces` declared namespaces (`src/canon.generated.ts`;
`public/errors/catalog.json` carries codes in 23 of them today). Every finding
carries `code · gate · severity · span · docs_url` in `nika check --json`
(`report_version: 1`), and **every `docs_url` points at `https://nika.sh/errors/<CODE>`**
— the site is already the compiler's error surface. It just never says so on the
front page.

Four capabilities no reviewer-facing pitch can claim:

| Capability | Verified output |
|---|---|
| **Lethal trifecta** | `X TRIFECTA [NIKA-SEC-009] lethal trifecta complete · human gate required — untrusted content from \`untrusted\` reaches egress task \`post\` while private read + untrusted ingress + external egress are all permitted, and no blocking \`invoke: nika:prompt\` dominates every path to it · fix: gate the egress path behind a human prompt task (NEP-0002 · the Rule of Two as a check)` |
| **Honest cost floor** | `! COST $0.0000 – $0.0000 FLOOR (unbounded tasks present)` — never a fake $0 |
| **Permission drift** | `↳ HINT [NIKA-DRIFT-001 · drift] \`permits.net.http\` entry \`api.github.com\` matches no host the body reaches — remove the entry` |
| **The repair loop** | `nika check --fix` applies the typed rename repairs, rewrites the file, re-audits (`nika check --help`: « the in-binary repair loop (`clippy --fix` shape) ») |

And `nika check --infer-permits` prints the boundary it derived, plus what it
refuses to guess:

```
permits:
  fs:
    read: ["./private/salaries.csv"]
  net: { http: ["news.example.com"] }
  exec: false
  tools: ["nika:fetch", "nika:notify", "nika:read"]

# review — effects too dynamic to pin statically:
#   · task `post` reaches a dynamic URL — `net.http` cannot express 'any host'; add the resolved host(s) before running
```

### 0.2 · The two tools the site has never once shown

Both real, both verified end-to-end, both absent from every argument on the site.

**`nika test`** — golden tests under the `mock` provider. Offline, deterministic,
zero tokens:

```
$ nika test --update golden.nika.yaml
ok golden written · golden.nika.yaml.golden.json
  review it once, commit it — `nika test` now guards this workflow
$ nika test golden.nika.yaml
ok golden match · 1 key · 21B · golden.nika.yaml.golden.json
```

Its refusal is a design statement worth quoting: « nika test: the mock run failed
(exit 1) — a golden pins a GREEN run · fix the workflow (or its var defaults) first ».

**`nika dap`** — Debug Adapter Protocol over stdio (`nika dap --help`, verbatim):
« time-travel a recorded run under a debugger UI: breakpoints on task lines · step
forward AND back through settles · outputs in the variables pane. **Replay
re-renders, never re-executes** ».

Today they appear on nika.sh in exactly two places, both ship-log rows:
`src/content/changelog.ts:220` (dap) and `:254` (test). Neither is ever an
argument. Screens 04 and 05 of §4 fix that.

### 0.3 · The second unsold value · consistency across items

A chat re-decides per item; on forty PRs it invents forty rubrics. A file decides
once. The proof is already projected and already on the site's data surface —
`t3-pr-review-fanout` in `src/sections/usecases-yaml.generated.ts:1521`:

```yaml
    for_each: ${{ with.files }}
    max_parallel: 4
    fail_fast: false
    agent:
      tools:
        - "nika:read"                  # read-only swarm · least privilege
        - "nika:done"
      schema:
        properties:
          findings:
            items:
              properties:
                severity: { type: string, enum: [blocker, high, med, low] }
```

One rubric — a four-value severity enum — applied to every changed file, four at
a time, errors collected instead of aborting the swarm, each reviewer granted
read-only. Its siblings `t3-localization-factory` (`:1440`) and
`t3-resume-screener` (`:1625`) carry the same shape. The site renders all three
as gallery cards and never once says what they prove.

---

## 1. Why this doc exists · the drift, named

**This section is unchanged in substance from the hour-old version. Every claim
re-verified at `c35bf07`; two corrected below.**

v4.1 locked the control pivot on 2026-06-17. The implementation drifted back to
the anti-chat pitch:

| v4.1 locked | shipped today | file:line | verdict |
|---|---|---|---|
| H1 « See what your AI will do. Before it does it. » | « Useful AI work shouldn't disappear into chats. » | `src/sections/Hero.tsx:303` | drifted |
| enemy = **the agentic black box** | enemy = the chat | `src/sections/Wedge.tsx:7` (« THE anti-chat chapter ») | drifted |
| FIG 3.0 « Beyond the black box » | absorbed into the anti-chat wedge; 1 surviving mention | `src/sections/Wedge.tsx:95` | dissolved |
| FIG 4.0 « Be the human in the loop » | **0 occurrences in `src/`** | — | never built |
| fil-rouge `t3-resume-screener` | `daily_brief` is `FLAGSHIP_ENTRIES[0]` | `src/flagships/flagship-data.ts:46` | drifted |
| FIG 3.5 permits | `TheBoundary` `fig="02"` | `src/sections/boundary/TheBoundary.tsx:77` | ✅ shipped |

The machine-readable surfaces never drifted. `public/llms.txt:4` and the home
JSON-LD (`src/pages/Home.tsx:79`) both still say *« The control layer for AI
agents … You review it, the runtime enforces it »*, as do all three `<meta>`
descriptions (`index.html:9,19,35`).

**Correction 1 (the hour-old doc overstated the H1 gap).** The hero *sub* did not
drift — `src/sections/Hero.tsx:316-325` already reads « **audited before a token
is spent** … the runtime **enforces it as a contract**: permits default-deny, the
trace hash-chained, cost capped. » The defect is that the H1 above it argues a
different case than the sentence below it. Under v5 the sub is nearly right for
the compiler wedge too; it is the H1 that must move.

**Correction 2 (the drift reached docs.nika.sh).** The hour-old doc marked the
docs landing « audit pending ». It is not pending: `nika-docs/introduction.mdx`
opens with the identical drifted line, « Useful AI work shouldn't disappear into
chats. » Two surfaces, one wrong sentence. §8 now treats it as a known cascade,
not an unknown.

## 2. The legibility defect (operator, 2026-07-28: « on se perd »)

**Unchanged in substance. All four causes re-measured at `c35bf07`; the fourth is
now sharper than reported.**

1. **Two spines running in parallel.** `TheBoundary` (boundary = control,
   `src/pages/Home.tsx:271`) and `Wedge` (wedge = anti-chat, `:279`) are two
   different arguments for two different enemies, **eight lines apart** in the
   same file.
2. **A catalogue plateau inside the argument.** `Verbs` (154) → `Toolbelt` (326)
   → `WhereItFits` (86) → `UseCasesV4` (249) = **815 LOC** of four consecutive
   « here is the surface area » sections, wedged between the thesis and the
   proof. Nothing is at stake for four screens.
3. **The numbers land twice.** `ProofStrip` (`src/sections/ProofStrip.tsx:25-27`)
   and `Proof` (`src/sections/Proof.tsx:26,31,38`) render the same
   `CANON.verbs` / `CANON.builtins` / `CANON.providers`, with eight sections
   between them (`Home.tsx:274` → `:309`).
4. **The figure numbering is a broken promise.** Not merely « FIG 01→14 »: the
   rendered `fig=` values on the home are `01.1 · 01.2 · 02 · 04 · 05 · 06 · 07 ·
   08 · 10 · 11 · 12 · 13` — **03 and 09 do not exist**, because `Wedge` and
   `EditorCanvas` carry no `SectionHead`, and `ProofStrip`'s own header comment
   still calls itself « FIG 3.5 » (`src/sections/ProofStrip.tsx:6`) while sitting
   between 02 and the un-numbered wedge. The stamping promises a figure sequence,
   delivers a catalogue, and drops two numbers on the floor.

## 3. The law of the v5 spine

> **One question per screen. Every screen must create the question the next one
> answers.** A section that answers a question nobody is asking yet is deleted or
> moved past the argument.

Three riders, binding on every subagent:

- **The argument runs uninterrupted from screen 00 to 06.** No catalogue, no
  numbers band, no ship-log may sit inside that stretch.
- **Catalogues are allowed only after the argument is won** — screens 07+.
- **The tail still obeys the law.** The last screen answers and creates nothing;
  every screen before it creates the next one's question, including the on-ramp.
  This is why the objections now come *before* the ask (§4, screens 10→11): today
  the site asks for an install at `fig="12"` and only answers the doubts at
  `fig="13"`.

## 4. The spine

| # | Screen | Answers | Creates | Source |
|---|---|---|---|---|
| 00 | **THE COMPILER** — the broken file goes green | *what is this?* | *what could a machine possibly know about an AI task?* | `Hero` (rebuilt copy) · `public/hero/pr-review.broken.nika.yaml` + its fixed twin |
| 01 | **ONE FINDING, IN FULL** — span, caret, did-you-mean, `--fix` | *what does it catch?* | *typos, fine. What about the things that actually hurt?* | **NEW** — the `check` capture promoted out of `RunExplains` + `CodeFile` |
| 02 | **WHAT IT REFUSES TO SHIP** — trifecta · secret flows · cost floor · drift | *can it see the dangerous things?* | *all of that is before it runs. Does it hold when it runs?* | `TheBoundary` widened (keeps `permits:` + `NIKA-SEC-004` + `--infer-permits`) |
| 03 | **THE RUN, RECORDED** — the film, re-beat to WRITE→CHECK→RUN→RECORD | *does it run, and is the recording real?* | *and when it does the wrong thing?* | `ScrollMorph` (1912 LOC · kept, re-captioned) + the `epilogue`/`trace` captures |
| 04 | **STEP BACKWARDS** ⚡ — `nika dap` | *how do I debug it?* | *once it's right, how does it STAY right?* | **NEW** — the debugger's first appearance outside the changelog |
| 05 | **IT STAYS FIXED** — `nika test`, offline, zero tokens | *how does it stay right?* | *fine for one file. What about forty?* | **NEW** — the test runner's first appearance outside the changelog |
| 06 | **THE SAME JUDGEMENT, FORTY TIMES** — one rubric, `for_each` | *does it hold at my volume?* | *so what am I actually writing?* | **NEW** — `t3-pr-review-fanout`, projected |
| 07 | **THE LANGUAGE** — 4 verbs + what they may reach | *what's in it?* | *where does it sit next to what I already have?* | `Verbs` + `Toolbelt` **merged** (carries the one CANON band) |
| 08 | **WHERE IT FITS + THE GALLERY** | *does it replace my agent?* | *what's it like to hold?* | `WhereItFits` + `UseCasesV4` **merged** |
| 09 | **IN YOUR EDITOR** — `nika lsp` · F5 into `nika dap` | *what's it like to use?* | *what's the catch?* | `EditorCanvas` |
| 10 | **THE CATCH** — the real objections | *what's the catch?* | *alright — how do I start?* | `Faq` + the VERSUS ledger, folded in |
| 11 | **GET STARTED + CLOSE** | *how do I start?* | — | `GetStarted` + `FinalCTA` |

14 → 12, and the **seven** screens that carry the argument are consecutive.

### 4.1 · Why the argument is ordered this way

00 asserts a category (*a compiler*) that a cold reader does not believe. 01 pays
the smallest possible debt — one finding, rendered in full, so the claim is no
longer a claim. 02 escalates from *syntax* to *danger*, which is the only place
the reader's own fear lives. 03 is where the argument would collapse if the
compiler were the whole story, so it answers *and it runs, and the recording is
tamper-evident*. 04 and 05 are the two screens the site has never had: the loop
after the first green run. 06 is the volume argument that turns a personal tool
into a professional one, and it is the last thing the reader needs before they
will tolerate a catalogue.

### 4.2 · Screen 00 · the broken file that goes green

The hero's file is **broken on arrival**. The twins have landed (second agent):

- `public/hero/pr-review.broken.nika.yaml` — served, and it really fails
- `public/hero/pr-review.nika.yaml` — served, and it really passes

The hero shows the broken one, the diagnostics land, the twin replaces it, the
ladder goes green. Findings are **not authored**: they are captured from the real
binary into `src/content/hero-check.generated.ts` by
`scripts/build-hero-check.mjs` (`nika check --json`), which also stamps
`HERO_ENGINE` — the engine version the page states.

Honesty constraint: nothing executes. This is `nika check` output on two real
files, captured from the real binary. No run, no tokens, no simulation. The
caption says so.

### 4.3 · Screen 04 · the debugger (`nika dap`)

The one screen that shows *time going backwards*. Breakpoints on task lines, step
forward and back through settles, outputs in the variables pane. The line to lead
with is the engine's own, verbatim from `nika dap --help`: **« Replay re-renders,
never re-executes. »** That sentence is why a debugger over an AI run is possible
at all, and no competitor can say it.

Register: a terminal/editor capture in the `RunExplains` poster family
(`${MEDIA}/posters/*.webp`) — not a fabricated debugger UI.

### 4.4 · Screen 05 · the test runner (`nika test`)

The golden loop, two commands, real output (§0.2). Lead line: **« Your prompt
chain has no tests. This one does. »** The mock provider makes it offline and
deterministic; the golden is a committed file; the refusal message —
« a golden pins a GREEN run » — is the discipline, stated by the tool.

### 4.5 · Screen 06 · consistency

Not « it's fast ». **It's the same decision, every time.** Show the enum, the
`for_each`, the `max_parallel`, the `fail_fast: false`, the two-tool read-only
grant — all real lines sliced from `t3-pr-review-fanout` as already projected
(never hand-typed, never re-projected here).

## 5. What dies

| Dies | Why | Where it goes |
|---|---|---|
| `Wedge` (anti-chat chapter) | the enemy is neither the chat nor the black box — it is *finding out at runtime*. Two enemies is why we lose people; three is a rout | the VERSUS ledger folds into screen 10; the capture-split retires |
| `ProofStrip` | the counts land twice | one band only, on screen 07 |
| `Proof` (`fig="11"`) | its « guarantees » ARE screens 01→06 now — restating them reads as marketing | the counts survive; the claims do not |
| `ChangelogPreview` | a ship log is not an argument — and it is currently the *only* place `nika test` and `nika dap` exist (`src/content/changelog.ts:220,254`), which is the defect, not the fix | footer link → `/changelog`; the two tools graduate to screens 04 + 05 |
| `Toolbelt` as its own section | it answers a question screen 07 already opened | merged into 07 |
| `WhereItFits` as its own section | same, for 08 | merged into 08 |
| `RunExplains` as a seven-tab section | seven questions on one screen is the legibility defect in miniature | its captures are **redistributed**: `check` → 01 · `inspect` + `epilogue` + `trace outputs` + `trace flow` → 03 · `kill → resume` + `human gate` → 10 |

## 6. Canonical copy (use verbatim · tighten for fit, never drift)

- **H1** — « **Nobody reads the plan. Nika compiles it.** »
- **sub (desktop)** — « Your agent writes what it intends to do as a file. Nika
  reads it like a compiler: unknown fields with the line and the column, secrets
  traced to every place they could flow, the worst-case bill, the permission your
  file no longer uses. All of it before a token is spent. Then it runs it,
  records it, and you can step backwards through the recording. »
- **sub (phone)** — « Your agent's plan is a file. Nika compiles it before a
  token is spent: types, secret flows, cost ceiling, blast radius. »
- **eyebrow** — `[ INTENT AS CODE ]` (AGENTS.md §5 keeps the brand kicker; it is
  never the explainer — v4.1 §2 already ruled this)
- **CTA pair** — `↓ See what it caught` · `curl -fsSL nika.sh/install.sh | sh`

**The punch lines** (new, minted for this wedge):

- « **The plan isn't for you to read. It's for a compiler to read.** »
- « **A chat re-decides every time. A file decides once.** »
- « **Every other tool finds out at runtime.** »
- « **Replay re-renders, never re-executes.** » (verbatim from `nika dap --help`)
- « **Your prompt chain has no tests. This one does.** »

**The surviving v4.1 lines** (still true, still usable):

- « Seeing the steps is not the same as enforcing them. »
- « A README is documentation. Nika is an executable contract. »

**Banned as the lead.** v4.1 §2's list stands — « YAML runtime », « workflow
engine », « open standard ». Add: « chats evaporate » (the anti-chat drift), and
now also « **review the plan** » / « **be the human in the loop** » / « **the
control layer** » *as the H1*. The control claims remain true and remain in the
`<meta>` and `llms.txt` (§8); they are simply not the thing that makes a stranger
stop, because they sell a chore. Control is the *consequence* of the compiler,
never the hook.

**The one-line answer to « what is Nika? »**, for any surface that needs a single
sentence: **« A compiler, a test runner and a debugger for the work you hand to
an AI. »**

**Every canonical line above is em-dash-free by construction** (AGENTS.md §5).
When a subagent tightens one for fit, it stays that way: colon, period or comma,
never an em-dash. The em-dashes in the *captured CLI output* quoted in §0 are
verbatim engine output and are never rewritten.

## 7. The fil-rouge

**One story, three scales — PR review.** This satisfies « ONE story, ONE file »
(`src/pages/Home.tsx:114`, V5 law #1) while letting the argument change altitude.

| Scale | File | Screens |
|---|---|---|
| **one file, broken** | `public/hero/pr-review.broken.nika.yaml` and its twin `public/hero/pr-review.nika.yaml` | 00 · 01 |
| **one file, bounded** | the twin's `permits:` block, sliced at its real line numbers via `CodeFile firstLine` | 02 · 03 · 04 · 05 |
| **forty files, one rubric** | `t3-pr-review-fanout`, projected (`src/sections/usecases-yaml.generated.ts:1521`) | 06 |

`t3-resume-screener` (`:1625`) supplies the **sharpest single permits proof** on
screen 02 — a local model (`ollama/*`) screening CVs with **no `net:` category at
all**, so PII cannot leave the machine even if a CV hijacks the model. It appears
once, as evidence, explicitly labelled a second file. Its YAML comments are
spec-projected, not copy.

Note the reversal from v4.1, and keep it: the screener is no longer the hero
file. A PR review is the situation the reader is already in.

## 8. The cascade — the three front doors

One line, four surfaces. Today they say four different things, and two of them
say the same *wrong* thing.

| Surface | Today | v5 |
|---|---|---|
| `public/llms.txt:4` | « the control layer for AI agents … » | ✅ **leave** — true, and crawler-facing copy should state the consequence, not the hook |
| home `<head>` + JSON-LD (`index.html:9,19,35` · `Home.tsx:79`) | « The control layer for AI agents. » | ✅ **leave** — same reason |
| **home H1** (`src/sections/Hero.tsx:303`) | « Useful AI work shouldn't disappear into chats. » | **the compiler line** (§6) |
| **README engine** (`nika/README.md:12`) | « **Intent as Code.** The workflow language for AI: one file, 4 verbs, one binary. » | **the one-line answer** (§6), *then* the language. Its readers arrive from GitHub search with « why not just a script? » — the toolchain answers it; « workflow language » does not |
| **README spec** (`nika-spec/README.md:13`) | « Sovereign · multi-provider · local-first. » | **the one-line answer**, then the licence split (Apache-2.0 spec / AGPL engine) |
| **docs.nika.sh landing** (`nika-docs/introduction.mdx`) | « Useful AI work shouldn't disappear into chats. » — **the same drifted line** | **the compiler line**, then the install |

The metadata/H1 split is deliberate and should be stated wherever it is
questioned: `llms.txt` and JSON-LD describe **what Nika is in the system**
(a control layer); the H1 describes **why a stranger should stop** (it compiles).
Both are true; only one of them is a hook.

## 9. Gates

`pnpm check && pnpm lint && pnpm build && pnpm test`, zero warnings, then
`pnpm visual` re-baked per-OS. Screens 01 · 04 · 05 · 06 must clear `a11y-sweep`
and `e2e-sweep` (`scripts/`, per AGENTS.md).

Every YAML fragment stays spec-projected; every count stays `CANON` — including
the diagnostic totals, which are `CANON.errorCodes` / `CANON.errorNamespaces`
(`src/canon.generated.ts`) and are **never** typed into copy. AGENTS.md §1 notes
the precedent: that file itself once said 13 providers after the canon moved
to 14.

**Three gates this wedge needs** — the compiler pitch is only as honest as its
capture pipeline. Gates 1 and 3 are **already in flight**; gate 2 generalises
them to every remaining screen.

1. ✅ **The hero twins must be true — the broken file must actually fail
   `nika check`, the twin must actually pass.** Shipping as
   `scripts/build-hero-check.mjs` (captures `nika check --json`,
   `report_version: 1`) + `src/test/hero-check.test.ts` (the drift gate; skips
   where `nika` is absent). Without it, an engine release silently turns screen
   00 into a lie. **Keep it, and extend the same shape to screens 04 · 05 · 06.**
2. **Every diagnostic string shown on the site is a real capture or a projected
   code row.** Codes and messages come from `public/errors/catalog.json`; ladder
   output comes from a captured `--plain` run. Never a hand-typed `NIKA-*` line —
   the same law `TheBoundary` already follows
   (`src/sections/boundary/TheBoundary.tsx:18-20`: « The denial row is the real
   catalog row … the example is labeled as an example »). Note the capture-time
   rule the hero generator already established and every other screen inherits:
   **environmental findings (`kind: inputs`) are dropped**, because they describe
   the filesystem `check` ran against, not the file, and would read on the page as
   a claim about the reader's own disk.
3. ✅ **The binary version is pinned and visible.** `HERO_ENGINE` in
   `src/content/hero-check.generated.ts` (`0.106.0` at capture). Any screen
   rendering CLI output states the version it was captured from; the version
   stamp is what makes the drift gate meaningful.

## 10. Out of scope

The private strategy canon (`ventures/nika/01-product/strategy/`). If the
product's canonical pitch moves too, that is a separate operator decision — as
v4.1 §8 flagged and the hour-old v5 already called overdue. The engine README is
the surface where the public pitch and the private canon actually meet, and §8
moves it; the canon itself is not this repo's business.

---

*Commits touching this spine carry `Co-Authored-By: Nika 🦋 <nika@supernovae.studio>`.*
