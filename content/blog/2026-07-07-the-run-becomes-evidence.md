---
slug: the-run-becomes-evidence
title: "The run becomes evidence"
tag: Engine
date: 2026-07-07
description: "Every journal line now carries a hash chain — verify names the first broken link, reproduce classifies every task, and the journal attests which engine wrote it. Trust, but verify. Then verify."
series: trace-family
series_stop: evidence
---

A workflow journal is a nice story until someone asks the auditor's question: **how do I know this record is what actually happened?**

Logs get edited. Files get truncated. A colleague "cleans up" a trace before attaching it to the incident report. Most systems answer the auditor with process — *nobody would do that here*. As of `nika 0.97.0`, the journal answers for itself.

**Every line carries a hash chain.** Each journal line records the SHA-256 of the previous line's exact bytes (the first line chains from a fixed genesis). Change one byte anywhere — an output, a timestamp, a status — and every line after it stops adding up. The run's closing line prints the head:

```
✔  draft   infer · mock/echo   14ms
── 2/2 done · $0.00 · elapsed 0.9s ─────────────────────────────
  trace: .nika/traces/2026-07-07T15-54-48Z-aab5.ndjson · 8 events · chain 941a7616dcbb915b5c507a42f2c3715e
```

**`nika trace verify` walks the chain** and tells you, precisely, where trust ends:

```
$ nika trace verify .nika/traces/2026-07-07T15-54-48Z-aab5.ndjson
OK — 8 events · chain intact · head 941a7616dcbb915b5c507a42f2c3715e365c0ba8beab6ebf3008ab2cd64e2762
  internally consistent (tamper-evident, not tamper-proof) — compare the head
  against the one the run printed to close the loop
```

We flipped one byte in a recorded output — `two` became `TWO` — and asked again:

```
$ nika trace verify tampered.ndjson
BROKEN at line 6 — recorded chain bb39ee148c6f8306 · computed 275e80498927009c
  every line from here on is unverified (edited, inserted, dropped or reordered)
$ echo $?
2
```

Note the engine's own wording: **tamper-evident, not tamper-proof**. A hash chain cannot stop someone from rewriting the whole file, chain included — that would take signatures and a trusted clock, and pretending otherwise would be a lie. What it *can* do is make partial edits impossible to hide and give you a four-word head to write down at run time. Honest cryptography beats theatrical cryptography.

**`nika trace reproduce` answers the second auditor's question:** *would this run happen the same way again?* It re-runs nothing by itself — you hand it the recorded journal and a fresh one, and it classifies every task:

```
$ nika trace reproduce recorded.ndjson fresh.ndjson
  reproduced       draft
  reproduced       gather

REPRODUCED — 2 reproduced
  engine: 0.97.0/macos/aarch64 (both runs)
```

And when a run is *not* reproducible, it names the exact ingredient instead of shrugging:

```
$ nika trace reproduce flaky-1.ndjson flaky-2.ndjson
  NONDETERMINISTIC stamp — same def, same inputs, different output

DIVERGED — 1 NONDETERMINISTIC
$ echo $?
2
```

The taxonomy is the point: **reproduced** · **nondeterministic** (same definition, same inputs, different output — the model changed its mind) · **authored** (you edited the workflow between runs) · **environment** (a var or file differed) · **status-changed**. "It's flaky" becomes a named, classified fact with an exit code CI can gate on.

That `engine: 0.97.0/macos/aarch64 (both runs)` line is the third piece: **the journal attests its writer.** Every `workflow_started` now records the engine version and platform. A failure report that crosses a team boundary answers "which binary, where" before anyone asks.

Two smaller honesty upgrades ride the same release. The journal records the **content identity** of your workflow — so the drift warning ("workflow changed since this run") can finally tell a real edit from your editor re-encoding line endings; a CRLF↔LF save no longer cries wolf. And `nika check --json` now carries **per-model rates** from a 602-rule catalog refreshed from models.dev — the VS Code extension's preflight shows `$in/$out per 1M` for every model in your workflow *before the first token is spent*. Priced, then run — never the other way around.

Every transcript in this post was captured verbatim against the released `nika 0.97.0` tarball — SHA-verified, same binary `brew install supernovae-st/tap/nika` gives you. The journal was already your flight recorder. Now it can testify.
