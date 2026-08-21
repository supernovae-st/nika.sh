---
slug: the-two-clocks-behind-a-model-string
title: "The two clocks behind a model string"
tag: Language
date: 2026-08-03
description: "A provider name can be part of the stable language while its models, prices and access paths keep changing. Nika resolves those truths on separate clocks and records the result."
---

The line `model: anthropic/claude-sonnet-4-6` looks complete.

It is complete as authored intent. It is not the whole runtime decision.

The prefix names a provider family. The suffix names the model requested from that provider. To admit a run, an engine still has to know whether the provider belongs to the language it implements, whether this release knows the model and its limits, which access paths are available on this machine, and which price table will judge the budget.

Those facts do not change together. Treat them as one global “model list” and reproducibility becomes impossible to explain. Freeze the whole list forever and the product cannot follow the market. Nika separates the problem into two data clocks, then records the machine-local access decision at run admission.

## Clock one: the standard

The standard clock is the language canon. It defines the stable provider ids a conforming Nika implementation recognizes and which of them are local, cloud or test seats. It also defines the verbs, builtins, namespaces and other closed language sets.

This clock changes with the specification. A provider id is therefore more than a logo in a UI. It is part of the syntax and semantics of `<provider>/<name>`. `ollama/...` selects a local runtime family. `anthropic/...` selects a cloud provider family. `mock/...` selects a test path. A typo in the prefix is not a late HTTP error. It fails model resolution as an unknown provider.

The website imports those names and counts from generated canon projections. The engine compiles the same source. Docs do not get to remember a number and hope the language stayed still.

The standard deliberately does **not** attempt to freeze every model sold by every provider. That inventory changes too quickly and includes operational facts the language specification should not own: context windows, output limits, API dialects, default seats, price rows and data-policy sources.

## Clock two: the release catalog

The release clock is the concrete catalog vendored into an engine version. It joins provider seats to known models and carries the facts that can be verified for that release:

- provider display and aliases;
- environment key requirements;
- default and lower-cost seed models;
- API dialects and local endpoints;
- context and output limits;
- exact-match price rules with source dates;
- measured energy rows where a receipt exists;
- data-policy claims with their primary source.

This clock moves when the engine ships. The current site's [catalog](/catalog) is pinned to the current engine release, and its release room exposes the artifacts and digests that carry that catalog. A model can belong to a standard provider family but be absent from an older release's concrete rows. That is not a contradiction. It means the provider grammar is stable while the installed market snapshot is older.

The separation also keeps missing data honest. A model without a price row is unpriced, not free. A model without an energy measurement is unmeasured, not efficient. A model absent from the catalog may still be accepted by an open local server, but the engine cannot invent its context window or cost.

## The model string joins the clocks

Consider one portable workflow:

```yaml review-change.nika.yaml
nika: review-change
model: anthropic/claude-sonnet-4-6

inputs:
  diff:
    type: string
    required: true

tasks:
  review:
    infer:
      prompt: |
        Review this diff for one correctness risk and one missing test.
        Quote no more than the line needed to identify each finding.

        ${{ inputs.diff }}
      max_tokens: 900

outputs:
  review: ${{ tasks.review.output }}
```

At check time, the provider prefix is judged against the language and the model row is looked up in the release catalog. Known output pricing lets the checker compute the static floor implied by `max_tokens`. A missing price row cannot become a fake zero-dollar guarantee. A known reasoning model may trigger a hint if its output budget leaves no explicit room for thinking.

At run admission, the machine resolves the **access path**. The model still chooses the intelligence. Access chooses how this host reaches it. The candidate can be local, mock, harness, OAuth or API, depending on what the release and machine expose. The resolver is deterministic and carries a witness for every candidate it drops.

An operator can make that choice a contract:

```text
nika run review-change.nika.yaml --access api --var 'diff=the patch text'
```

If the API path is unavailable, the run refuses before the prologue. It does not substitute an OAuth session, local server or another model. Without a pin, resolution follows its stable ordering and the selected path is still recorded.

This access decision is not a third documentation clock. It is live machine state. That is why the correct place for it is the admission record, not the workflow source or the release catalog. The same engine release can run the same model through a different path on another host. The trace must say which one happened.

## Reproducibility begins with the manifest

The opening event of a Nika trace records the engine version and platform, workflow identity, specification pin, permits boundary, pricing snapshot and access plan. Model task events record the provider, model, access and billing class actually used.

Those fields prevent four common rewrites of history:

**“The same model name means the same run.”** It does not. A provider can update the served weights behind an API id. A local operator can replace a quantized file. The trace proves the requested seat and access path, not facts the provider never exposed. Reproducibility stays an evidence claim, not branding.

**“Today's price explains yesterday's budget verdict.”** It may not. Price tables change. The trace records the pricing snapshot identity used by the run, so an auditor does not silently re-price old work against today's catalog and call the result verification.

**“A model override is only a convenience flag.”** It changes the admitted seat. A resumed run keeps the recorded model context, and a silent seat swap refuses. Cross-version resume also refuses unless the operator explicitly attests compatibility with the recorded engine version.

**“Local means no provenance is needed.”** Local removes provider egress, which is valuable. It does not identify the weights on disk. For a decision that depends on exact reproduction, keep the model artifact digest and server configuration with the evidence pack. The Nika trace covers what crossed its boundary; it should not claim facts below a server wire it cannot observe.

## Why the website shows both clocks

The [catalog resolution instrument](/catalog) places the standard clock beside the release clock. The first answers “which provider families are part of this language?” The second answers “which concrete seats and facts does this released binary know?” The model string sits between them because it is the join key.

That layout prevents several misleading product claims. A marketing integration list can grow without pretending each item is a language primitive. A price update can ship without implying a spec change. A spec addition cannot appear on the public site before the current engine actually carries its generated projection. Release assets and their digests remain the outer provenance boundary.

For operators, the practical rule is simple:

1. Write an explicit `<provider>/<model>` string.
2. Run `nika check` with the engine version that will execute the file.
3. Read catalog warnings as missing evidence, not cosmetic lint.
4. Pin `--access` when the path affects billing, custody or authentication.
5. Keep the trace and verify its chain.
6. Record model artifacts below the provider wire when exact weights matter.

The model market will keep moving. A workflow language does not become reproducible by denying that motion. It becomes reproducible by separating what is stable, what is released, what is live on this machine and what the run can actually prove.

Browse the [model register](/catalog/models), inspect the current [release record](/releases/v0.111.0), or continue with [Clean is not ready to spend](/blog/clean-is-not-ready-to-spend).
