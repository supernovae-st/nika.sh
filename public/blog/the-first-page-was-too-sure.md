---
slug: the-first-page-was-too-sure
title: "The first page was too sure"
tag: Origins
date: 2025-12-30
published: 2026-08-21
receipts:
  - https://github.com/supernovae-st/nika.sh/commit/3ab8bdd4e10e7c285120cef8363333b1292836c5
description: "On December 30, Nika became public and immediately overclaimed. The first page preserves both the idea and the correction."
series: origin-ledger
series_stop: first-page
---

The receipt is a public commit dated December 30, 2025. It introduced the first `nika.sh` landing page.

That page already carried the durable center of the project: workflows in YAML, a Rust command-line tool, a task graph and a choice of model providers.

It also called the product production-ready, promised a ten-times speedup, treated `fetch` as a semantic verb and displayed a permissive license the current engine no longer uses.

The idea was real. The confidence was ahead of the evidence.

## A number needs a receipt

“10x faster” looked precise. The page named no baseline, workload, machine or benchmark report. Without those, the number was decoration wearing a lab coat.

The current site treats numbers differently. Language counts are generated from the canonical specification. Release pages list actual assets and digests. A performance claim needs a workload someone else can run.

That standard matters because Nika asks people to write claims that machines will act on. The website cannot demand precision from workflow authors while granting itself an exemption.

## Ready for which production?

A local summarization task and an unattended server do not carry the same risk. A model-only task and a shell command do not need the same authority. A successful demo proves none of crash recovery, secret confinement or replay safety.

The early page collapsed those questions into one badge. The project later learned to give each claim an owner:

- the language defines whether a file is valid;
- the checker judges what can be known before a run;
- the runtime executes the graph;
- permits bound effects;
- the trace records what happened;
- deployment guidance names what the host must provide.

“Production-ready” cannot make those facts true. Mechanisms and tests can.

## The vocabulary needed subtraction

The first page advertised `fetch` as a verb. The current language keeps `infer`, `exec`, `invoke` and `agent`. Fetching moved into the standard library, where it no longer competes with tool invocation as a second expression of the same effect.

That subtraction made the language easier to teach and harder to misread. The first page captured an exploration. The later specification had to capture a law.

The license split became more precise too. The specification is permissive so other people can implement the language. The engine is copyleft so a networked fork cannot quietly turn shared infrastructure into a private dead end. That is architecture, not a badge.

## Keep the page

The old landing page is not an embarrassment to hide. It is a baseline.

It shows which ideas survived before the current engine existed. It also shows why public copy needs the same discipline as public code. Claims drift. Counts drift. Vocabulary tightens. A page without a source of truth becomes a second product.

The correction was not to become timid. It was to make confidence follow evidence.

January posed the harder question: after removing the claims, the extra verb and the early certainty, what was still worth building?
