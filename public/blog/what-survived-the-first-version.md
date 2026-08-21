---
slug: what-survived-the-first-version
title: "What survived the first version"
tag: Origins|Engine
date: 2026-01
published: 2026-08-21
receipts:
  - https://github.com/supernovae-st/nika.sh/commit/3ab8bdd4e10e7c285120cef8363333b1292836c5
  - https://github.com/supernovae-st/nika/commit/0cc7b74235c896f16d326795786a7f7b40241c43
description: "The early product carried too many promises. Four technical bets survived every rewrite because they kept answering the same user problem."
series: origin-ledger
series_stop: kernel
---

There is no single January commit that declares the kernel of Nika. This is a retrospective comparison between the first public page and the system that exists now. The interesting parts are the ones that survived several opportunities to be removed.

Four bets made it through.

## 1. The workflow is a plain-text artifact

The first version already put the job in YAML. The current language is much stricter, but the ownership model is unchanged: the workflow belongs in the project, not in a remote editor or a conversation account.

This choice keeps paying rent. A plain-text plan can be reviewed before execution. It can travel through Git. An agent can author it and a human can inspect the exact artifact. A future runtime can read it without asking the original service for permission.

The syntax was replaceable. The artifact was not.

## 2. Dependencies should be visible as a graph

The early page promised DAG execution because useful workflows already contain ordering. Some tasks need the output of another. Others can run together. Hiding those relationships in a prompt does not remove the graph. It only makes the scheduler guess.

Nika kept the graph and removed the spectacle around it. A task declares what it follows. The engine derives the execution plan. The same structure can be checked, rendered, costed and traced.

This is one of the quiet advantages of Intent as Code. The plan is not a screenshot generated after the run. It is present before anything acts.

## 3. Model choice is a parameter, not the architecture

The first version named several cloud and local model families. Some of those model names aged almost immediately. The separation did not.

A workflow should not need a new shape when the model changes. The task says what kind of work it needs. The `model:` selection says where that work is sent. The runtime owns provider-specific mechanics.

That boundary is what lets one file move between a local rehearsal and a cloud model without becoming two products. It also makes the destination reviewable. Provider independence is not a promise that all models behave identically. It is a promise that the rest of the workflow does not have to become provider glue.

## 4. The runner should be a local executable

Rust was present in the first public story and stayed through the rebuild. The important part is not a language benchmark. It is distribution and custody.

A single local binary can parse, check and run a workflow without making a hosted control plane the owner of the file. It can expose the same engine to a terminal, a scheduler or a server adapter. It can fail on the machine where the boundary must be enforced.

That choice became more important as Nika grew. A remote API may be useful, but it should project the runtime rather than replace it. A scheduler may decide when work begins, but it should not invent a second execution engine. Local is the foundation that keeps those doors honest.

## Survival is a better origin story than certainty

The first version also contained ideas that did not survive. Some were redundant language. Some were controls without enough enforcement beneath them. Some were marketing claims without a measurement.

Removing them was not loss of vision. It was how the vision became testable.

The durable kernel can be stated without a feature count: write the work in a file, make its dependencies visible, choose the model without rewriting the plan, and run it through an engine you can hold. Everything else has to justify itself against that center.
