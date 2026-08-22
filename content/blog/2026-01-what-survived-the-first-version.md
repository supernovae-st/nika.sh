---
slug: what-survived-the-first-version
title: "What survived the first version"
tag: Origins|Engine
date: 2026-01
published: 2026-08-21
receipts:
  - https://github.com/supernovae-st/nika.sh/commit/3ab8bdd4e10e7c285120cef8363333b1292836c5
  - https://github.com/supernovae-st/nika/commit/0cc7b74235c896f16d326795786a7f7b40241c43
description: "Strip away the early claims and four technical bets remain: file, graph, model choice and a local engine."
series: origin-ledger
series_stop: kernel
---

Early products collect ideas. Real products survive subtraction.

Remove the first page's speed claim. Remove the production badge, the extra verb and the original license story. Compare what remains with the engine that later replaced it.

Four bets survive.

They did not survive unchanged. Survival here means that the later system still needs the same responsibility, even after the first implementation and its vocabulary are gone.

## 1. The workflow is an artifact

The first version already put the job in YAML. The current language is far stricter, but the ownership model is unchanged: the workflow belongs in the project, not in a remote editor or a conversation account.

That plain-text artifact can be reviewed before execution. It can travel through Git. An agent can author it and a human can inspect the exact bytes. Another runtime can read it without asking the original service for permission.

The syntax was replaceable. The artifact was not.

The current envelope is evidence of that distinction. It no longer uses the first page's shape. Identity now sits directly on `nika:`, and retired wrapper keys refuse at parse time. A stricter grammar did not weaken the file bet. It removed ways for the same idea to be written twice.

## 2. The dependencies form a graph

Useful workflows already contain ordering. Some tasks need another task's output. Others can run together. Hiding those relationships in a prompt does not remove the graph. It only makes the machine infer one in the dark.

Nika kept the graph and removed the spectacle around it. A task declares what it follows. The engine derives the execution plan. The same structure can be checked, rendered, costed and traced.

That is one quiet advantage of Intent as Code: the plan exists before anything acts. It is not a diagram reconstructed after the run.

The graph also became a judging surface. A missing dependency, a cycle or a reference to a task that does not exist can fail before dispatch. The visual plan and the runtime no longer need separate hand-maintained descriptions of order.

## 3. The model is a selection

The first page named several cloud and local model families. The names aged quickly. The separation did not.

A workflow should not need a new shape when the model changes. The task says what kind of work it needs. The `model:` field says where that work is sent. The runtime owns the provider-specific mechanics.

This does not pretend all models behave alike. It keeps provider glue from swallowing the workflow. A different seat may change latency, cost and output. The plan still exposes which seat was requested.

## 4. The engine is something you can hold

Rust appeared in the first public story and remained through the rebuild. The important point is not a language benchmark. It is custody.

A local binary can parse, check and run a workflow without making a hosted control plane the owner of the file. It can expose the same engine to a terminal, a scheduler or a server adapter. It can enforce the boundary on the machine where the effects occur.

This bet became more valuable as Nika grew. A remote API may project the runtime, but it should not replace it. A scheduler may decide when work begins, but it should not invent a second execution engine. The local executable keeps those doors honest.

## The reset began with an empty workspace

The current engine's first public commit arrived on April 13. Its Cargo workspace deliberately had no members.

That detail is a better receipt than a finished architecture diagram. The commit added the workspace policy, toolchain pin, dependency policy and nine CI ratchets before it admitted a crate. The first current-engine artifact was a set of conditions for future code, not a pile of code asking to be trusted.

The empty workspace also separates continuity from reuse. The December page proves the four bets above were already public. The April commit proves the current engine chose to re-earn them under a new architecture rather than treat the prototype as inherited proof.

What crossed that boundary was not source code. It was a set of obligations:

- the workflow remains an owned artifact;
- the graph remains explicit;
- model choice stays outside task semantics;
- execution remains available through a local binary.

Everything else had to justify its place again.

## The kernel

There is no single January commit that declares these four laws. This chapter is a retrospective comparison between the first public page and the engine repository that begins in April. The survival test is the evidence.

The kernel fits in one sentence: **write the work in a file, make its dependencies visible, choose the model without rewriting the plan, and run it through an engine you can hold.**

Then the public record goes quiet. The next chapter keeps that silence instead of filling it with invented progress.
