---
slug: intent-as-code
title: "Intent as Code: why your AI work should be a file"
tag: Manifesto
date: 2026-06-15
published: 2026-07-05
description: "Chats evaporate, files compound. The case for writing AI work down as source you own: your best prompts, versioned like code."
---

Think about the best thing you did with an AI last month. The careful prompt, the back-and-forth, the result that finally clicked. **Where is it now?** For many people the honest answer is: buried in a chat history they will not scroll back through, on a service that owns the surrounding interface.

We've accepted a strange deal: the more useful the work, the more disposable the container. Nobody would write software in a text box that forgets everything. Yet that's exactly how most AI work happens today.

**Nika's bet is simple: useful AI work is worth writing down.** Not as a transcript, as *source*. A small YAML file says what you want: fetch this, think about that, run this command, save the result. The file is the workflow. Run it again tomorrow and it follows the same declared plan. A model may return different words; the diff still shows what you asked the system to change.

## Source is not a promise of determinism

Calling a workflow source code does not make a model deterministic. It makes the parts under the author's control reviewable.

The file can pin the requested model seat, input values, task graph, output limits and effect boundary. A trace can record the route and result the runtime observed. Neither can prove facts a provider does not expose, such as an unannounced change to weights behind an API name.

That boundary is useful. Reproducibility stops being one vague badge and becomes a set of answerable questions:

- Were the same workflow bytes admitted?
- Were the same declared inputs resolved?
- Which model and access path were requested?
- Which events and outputs were recorded?
- Which facts remain outside the runtime's evidence?

Intent as Code does not erase uncertainty. It gives uncertainty an address.

Four verbs cover the execution models: **infer** calls a model, **exec** runs a process, **invoke** uses a tool, **agent** runs a bounded tool loop. Everything else is data and control flowing between tasks. The order falls out of the wiring: `with:` names what a step consumes, the binding is the edge, and independent branches become eligible together.

## The file gives each concern one home

A useful workflow carries more than a prompt:

- Requested work lives in the task body.
- A data dependency lives in `with:`.
- A control dependency lives in `after:`.
- The external effect ceiling lives in `permits:`.
- Model choice lives in `model:`.
- The public result lives in `outputs:`.

The separation is not ceremony. It prevents a prompt from becoming a second scheduler, a second permission policy and a second output schema at once.

And the reference engine can run on **your machine** as one Rust binary. Your workflow and Git history remain local artifacts. You may choose a local model or call a cloud provider with your own credentials. The file keeps that choice visible; it does not pretend every provider route is local.

The license split protects a different boundary. The language contract is Apache-2.0. The reference engine is AGPL-3.0-or-later. Those licenses keep the contract implementable and the covered engine source available under their terms. They do not replace operational control over keys, hosts and backups.

Chat is a good place to figure out what you want. It is a poor place to keep the final method. Explore in chat. Then write the intent down, review the file and keep the evidence from each run beside it.
