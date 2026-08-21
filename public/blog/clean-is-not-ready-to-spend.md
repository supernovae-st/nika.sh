---
slug: clean-is-not-ready-to-spend
title: "Clean is not ready to spend"
tag: Engine|Security
date: 2026-08-21
description: "A valid AI workflow can still waste money. Nika now separates legal files from workflows that are ready for a paid run."
---

An AI workflow can pass validation and still be a bad place to spend money.

That distinction matters. A parser can prove that a file is legal. A schema can prove that its fields have the right shapes. Neither proves that the workflow's expensive decisions are backed by deterministic checks, that its output limits make sense, or that the author has resolved every warning that matters before a paid model runs.

Nika v0.111.0 gives that difference a name: `paid_ready`.

The short answer is simple. **Clean means the workflow is valid. Paid-ready means no paid-run hint remains unresolved.** A team can keep using `nika check` as the normal authoring loop, then require `paid_ready: true` at the boundary where real model spend begins.

## Validation and readiness answer different questions

Traditional validation asks whether a document belongs to a language. Does it parse? Are required keys present? Does every reference resolve? Are the declared permissions sufficient for the requested effects?

Those are hard requirements. If any of them fail, the workflow should not start.

Readiness asks a second set of questions:

- Is a model being asked to make a decision that a deterministic task should enforce?
- Is the workflow claiming a law without carrying a fixture that proves the law?
- Do structured outputs use types that preserve the meaning of the data?
- Does a broad file pattern hide the real read boundary?
- Is a powerful introspection tool present but disconnected from the task that should consume it?

A workflow may be legal while the honest answer to one of those questions is still no. Treating both states as the same green check makes the signal less useful precisely when a run becomes expensive.

This is the design reason for two verdicts. `clean` remains the language verdict. `paid_ready` is the operational verdict for a paid execution boundary.

## The check result is now an authoring interface

Three fields close the loop in v0.111.0:

- `paid_ready` states whether any paid-run hint remains.
- `compiled` states whether the workflow's law has been proven.
- `next` names the first repair to make.

The important field is not only the boolean. `next` turns a verdict into an ordered editing loop. An author, editor extension or agent does not have to interpret a wall of findings and guess where to begin. It can apply the first repair, run the checker again, and continue until the readiness signal is quiet.

```text
nika check path/to/workflow.nika.yaml --json
```

That command is useful to a person, but the JSON contract also makes the result usable in CI and in an agent's own revision loop. The checker remains the authority. The model can propose a change, but it does not get to declare its own work safe.

## A model should extract facts, not enforce the law

The most common workflow design mistake is to ask one model call to do everything: read evidence, choose a verdict, explain it and format the final artifact. The result can look coherent while the rule itself remains untested.

A stronger plan separates three jobs:

1. A model extracts typed facts from messy source material.
2. A deterministic task applies the rule to those facts.
3. A fixture asserts that the rule behaves correctly on a known case.

For example, an editorial workflow may ask a model to list unsupported claims and broken links. A deterministic expression then decides that publication is allowed only when both counts are zero. A fixed fixture proves that the expression refuses a deliberately bad audit result.

The model handles ambiguity. The deterministic task owns the gate. The fixture proves the gate is wired.

This arrangement is less dramatic than asking an agent to "make sure the post is good." It is also reviewable. A teammate can inspect the rule without reading a prompt, and a future model swap cannot quietly redefine the publication threshold.

## Cost controls need an honest scope

Output ceilings are useful, but they are not a complete cost estimate. A low `max_tokens` value bounds generated output. It does not erase the cost of a large input, cached context, tool results, reasoning tokens or a provider's pricing rules.

That is why cost policy belongs beside workflow structure rather than inside marketing copy. Before a paid run, review at least four things:

- the selected provider and model;
- the maximum output for every model task;
- the amount of research or file content flowing into each prompt;
- the static cost ceiling used by the runner.

Local models need the same honesty. Unpriced is not the same as free. A local run consumes time, memory and energy even when no vendor invoice exists.

`paid_ready` does not pretend to predict every possible bill. It gives teams a stronger, machine-readable boundary: the checker has no remaining paid-run guidance for this file under the released rules.

## Put the distinction into CI

A practical policy can stay small:

1. Run `nika check` on every workflow change.
2. Refuse any non-clean result.
3. For workflows allowed to call paid models, also require `paid_ready`.
4. Keep the JSON verdict as a build artifact.
5. Review cost and permission changes like code changes.

The split avoids two bad outcomes. It does not weaken validation to accommodate advisory findings, and it does not pretend that an advisory is a syntax error. Each signal keeps one meaning.

It also improves review. A pull request can show that a file is legal while still blocking a production promotion because the paid-readiness work is unfinished. The reviewer sees the exact gap instead of a generic red state.

## The workflow can now inspect and revise itself

The same release adds two pieces that make this loop useful inside agentic authoring.

`nika:inspect` is available from the first task and updates after every wave. A workflow can read its DAG, records, spend and threads while it runs. `nika:compose` stays inside an agent loop after `nika:done`, so a model can draft a workflow, read the complete checker verdict and revise it without making the checker execute the draft.

That separation is essential. Composition proposes. Checking judges. Running performs effects. Combining those authorities would make a generated file prove itself by acting, which is exactly the boundary a checked workflow language is meant to avoid.

## Ready is a stronger word than valid

The useful mental model is not "more validation." It is staged confidence.

A valid file belongs to the language. A compiled law carries its proof. A paid-ready workflow has resolved the checker guidance that matters before money is spent. A successful run then produces its own trace and receipt.

Each stage adds evidence without rewriting the meaning of the previous one.

That is the deeper change in v0.111.0. The checker is no longer only a gate that says yes or no. It is an authoring protocol that tells a person, an editor or an agent what is true now and what to repair next.

Read the [v0.111.0 release](https://github.com/supernovae-st/nika/releases/tag/v0.111.0), see the complete [Nika changelog](/changelog), or continue with [The cost line](/blog/the-cost-line).
