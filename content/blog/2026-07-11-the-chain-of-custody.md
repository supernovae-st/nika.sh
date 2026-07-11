---
slug: the-chain-of-custody
title: "The chain of custody"
tag: Engine
date: 2026-07-11
description: "A recorded run is a text file, and text files can be edited. nika trace verify recomputes the hash chain: one changed word in history breaks every line after it, and the run's printed head closes the loop."
series: trace-family
series_stop: custody
---

Your pipeline ran last Tuesday. The trace says five tasks went green, the summary came from a local model, and the whole thing cost nothing. Now the compliance question: *prove it*. The trace is an NDJSON file — plain text, one event per line, sitting in `.nika/traces/`. Plain text is wonderful for `grep` and terrible for trust, because anyone with write access can make last Tuesday say anything.

So every trace Nika writes is a hash chain: each event line carries a hash computed over itself and the hash before it, and the run prints the chain's head as its last word:

```text
❯ nika run digest.nika.yaml

  ...
  trace: .nika/traces/2026-07-11T10-30-24Z-2cfb.ndjson · 11 events
         · chain eb7b4e422cec1a51d44da4741f240d45732105bd7ebd05dd3bab419af9c95c0b
```

Later — next week, next audit — anyone holding the file can recompute the whole chain:

```text
❯ nika trace verify .nika/traces/2026-07-11T10-30-24Z-2cfb.ndjson

OK — 11 events · chain intact · head eb7b4e422cec1a51d44da4741f240d45732105bd7ebd05dd3bab419af9c95c0b
  internally consistent (tamper-evident, not tamper-proof) — compare the head
  against the one the run printed to close the loop
```

Same head, character for character — the file you hold is the file the run wrote. That is the loop closing: the head the run printed (in your CI log, your journal, your ticket) is the anchor, and the file re-derives it or it does not.

Now let's lie to it. Say the résumé needs padding: last Tuesday's run should have used a bigger model. One word in one recorded event, `llama3.2:3b` becomes `llama3.2:70b`:

```text
❯ sed 's/llama3.2:3b/llama3.2:70b/' trace.ndjson > padded.ndjson
❯ nika trace verify padded.ndjson

BROKEN at line 8 — recorded chain 359cc6ff152b6272 · computed b98b3157197e443f
  every line from here on is unverified (edited, inserted, dropped or reordered)

❯ echo $?
2
```

The chain names the exact line where history diverged, shows the hash it recorded against the hash the bytes actually produce, and declares everything downstream unverified — because that is what a chain means: the help says it plainly, *"any edited, inserted, dropped or reordered line breaks every hash after it"*. And it exits `2`, so a CI step can gate on it. (Exit `3` is reserved for traces older than the chain itself — an honest code for "this predates the guarantee", not a fake pass.)

Read the parenthesis in the OK output again, because the tool is underclaiming on purpose: **tamper-evident, not tamper-proof**. An attacker who can rewrite the whole file can rewrite the whole chain; what the hashes prove is internal consistency, and what turns that into custody is the head you kept somewhere else — the one the run printed. This is the same register as the [forecast's](/blog/the-local-forecast) `low confidence (n<10)` and its refusal to price local models, the same as the audit's `COST UNBOUNDED`: the engine states what it knows, states what it cannot know, and leaves the difference in your hands. A tool that overclaims trust is how you end up trusting nothing.

The quiet economy here is that this is not a new artifact. The trace being verified is the same flight recorder that [makes the run evidence](/blog/the-run-becomes-evidence), the same journal [resume reads to skip finished work](/blog/the-resume-story), the same history [the forecast prices your next run from](/blog/the-local-forecast). One recorded file, five jobs — evidence, replay, resume, forecast, custody — and the fifth is the one that lets you believe the other four after the fact.

`nika trace verify <file>` — put it after every run your compliance story depends on. The audit trail now audits itself.
