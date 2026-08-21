---
slug: the-first-page-was-too-sure
title: "The first page was too sure"
tag: Origins
date: 2025-12-30
published: 2026-08-21
receipts:
  - https://github.com/supernovae-st/nika.sh/commit/3ab8bdd4e10e7c285120cef8363333b1292836c5
description: "The first nika.sh landing page went live with a real idea and claims the code had not earned. Keeping both facts is part of the history."
series: origin-ledger
series_stop: first-page
---

The first public `nika.sh` landing page landed on December 30, 2025. The commit still exists. So does the page it replaced.

It already contained the durable center of Nika: workflows in YAML, a Rust command-line tool, a task graph and a choice of model providers. It also called the product production-ready, promised a ten-times speedup, treated `fetch` as a semantic verb and displayed a permissive license that the current engine no longer uses.

The idea was real. The confidence was ahead of the evidence.

That is not an unusual first website. A young product page tries to compress possibility into certainty. The mistake is leaving the certainty unexamined once the product becomes something people may trust with credentials, files and money.

## A number without a measurement is decoration

“10x faster” looked precise. It had no named baseline, workload, machine or benchmark report on the page. Without those, the number did not tell a reader anything they could reproduce.

The current site treats numbers differently. Language counts are generated from the canonical specification instead of being typed into marketing copy. Release pages list actual assets and digests. Performance claims need a workload and a receipt. If the measurement changes, the projection changes with it.

This is a stricter standard because Nika is a tool for writing claims that machines will act on. The website cannot ask workflow authors to be precise while granting itself an exemption.

## “Production-ready” hid several questions

Ready for which production?

A local summarization job and an unattended server process do not carry the same risk. A model-only task and a shell command do not need the same authority. A successful demo does not prove crash recovery, secret confinement or replay semantics.

The early page collapsed those questions into one badge. The project later learned to separate them:

- the language says whether a file is valid;
- the checker judges what can be known before a run;
- the runtime executes the graph;
- permits bound effects;
- the trace records what happened;
- deployment guidance names what the host must provide.

None of those facts becomes true because a page says “production-ready.” Each needs its own mechanism and test.

## The vocabulary had not earned its shape either

The first page advertised `fetch` as a verb. The current language keeps `infer`, `exec`, `invoke` and `agent`. Fetching became a standard-library operation rather than a second way to express tool use.

That subtraction matters. A language is easier to teach when each concept has one obvious home. It is easier to implement when two paths do not compete for the same effect. The first page captured an exploration. The later specification had to capture a law.

The license changed for the same reason. “Open source” was not specific enough for the promise Nika wanted to make. The specification became permissive so anyone can implement the language. The engine became copyleft so improvements to a networked fork remain available. The current split is an architectural decision, not a badge.

## Keep the first page

We could treat the old landing page as an embarrassment and bury it. It is more useful as a baseline.

It shows which ideas survived before the current engine existed. It also shows why public copy needs the same discipline as public code. Claims drift. Counts drift. Product vocabulary tightens. A page without a source of truth quietly becomes a second product.

The first page was too sure. The correction was not to become timid. It was to make confidence follow evidence.
