---
slug: intent-as-code-engineering-discipline
title: "Intent as Code is an engineering discipline"
tag: Manifesto
date: 2026-08-11
published: 2026-08-21
description: "The useful part of AI work is not the chat. It is the intent, boundary, plan and evidence that a team can review before and after a run."
---

The first version of an AI task is often a conversation. You explain the problem, add context, correct a misunderstanding and keep going until the answer becomes useful. That is a good way to discover the work. It is a poor way to operate the work again.

A month later, the durable part is rarely the final message. It is the set of decisions that produced it: which sources counted, which model handled the ambiguous step, which tool wrote the artifact, what the model was forbidden to touch, how much output it could generate and what proved the run actually followed the plan.

Intent as Code is the discipline of putting those decisions in a file before execution. Nika is one implementation of that discipline. The larger idea does not depend on a vendor, a model or a user interface. It starts with a simple question: **can a reviewer understand what this AI work will do without watching it happen?**

If the answer lives in chat history, the task is still a session. If it lives in a checked file, the task has become an engineering artifact.

## Source is different from a transcript

A transcript records a path someone took. Source declares a path that can be inspected and taken again.

That distinction is familiar in software. A terminal history is not a build system. A production log is not an infrastructure definition. A screen recording of an analyst is not a data pipeline. Each may help explain what happened, but none is the owned, reviewable instruction for what should happen next time.

AI work needs the same separation. The conversation remains useful for exploration. Once the task repeats, the stable parts move into source:

- the inputs and fixed values;
- the model and its output ceiling;
- the tasks and the data passed between them;
- the files, hosts, programs and tools the run may reach;
- the output that makes the job complete.

The source should be smaller than the conversation because it carries the decisions, not every discarded thought. That compression is a feature. It turns a long session into a diff another person can review.

## The smallest useful file makes four claims

Consider a weekly brief that reads one note, asks a local model for a summary and writes one report:

```yaml weekly-brief.nika.yaml
nika: weekly-brief

model: ollama/llama3.2:3b

permits:
  tools: ["nika:read", "nika:write"]
  fs:
    read: ["./notes/week.md"]
    write: ["./out/brief.md"]

tasks:
  source:
    invoke:
      tool: "nika:read"
      args: { path: "./notes/week.md" }

  summarize:
    with:
      note: ${{ tasks.source.output }}
    infer:
      prompt: |
        Summarize this weekly note in three factual paragraphs.
        Keep named owners, dates and unresolved blockers.

        ${{ with.note }}
      max_tokens: 700

  save:
    with:
      brief: ${{ tasks.summarize.output }}
    invoke:
      tool: "nika:write"
      args:
        path: "./out/brief.md"
        content: "${{ with.brief }}"
        create_dirs: true

outputs:
  brief: ${{ tasks.summarize.output }}
```

This file makes four claims a chat cannot make reliably.

First, it names the job. `nika: weekly-brief` gives the plan an identity that can live in a repository, a review and a trace.

Second, it names the graph. The summary consumes the read result, and the save consumes the summary. The `with:` bindings are data edges, not prose about what should happen next.

Third, it names the authority. The run may read one path, write one path and call only the explicitly named builtins. Everything else is outside the declared boundary.

Fourth, it names completion. The brief is a declared output, not a useful-looking sentence somewhere in a terminal stream.

Those four claims turn “summarize this note” from a request into a reviewable unit of work.

## The graph should exist before the model does

Many AI systems discover their plan during execution. That is sometimes necessary. Research, debugging and open-ended investigation may require a model to choose the next step after seeing the last result.

Most recurring work is not like that. A release note still needs sources, a draft and a saved artifact. A support digest still needs records, classification and a report. A model may supply judgment inside one step, but the surrounding shape is known.

Declaring that shape first produces immediate benefits. Independent tasks can run together. Missing dependencies can be found before execution. A reviewer can see whether a publishing step depends on a validation step. A checker can determine which effects are reachable and estimate the output ceiling. None of this requires a model call.

When the task really is open-ended, Nika gives the dynamic loop its own `agent` verb and requires bounds on turns, tokens and available tools. The dynamic part remains visible as one bounded task inside a larger declared plan. The exception does not erase the structure around it.

This is a core principle of Intent as Code: uncertainty belongs where the judgment is needed, not everywhere by default.

## Authority belongs beside purpose

An AI task is not fully described by what it should produce. It is also described by what it may touch while trying.

In ordinary scripts, authority arrives from the process environment. If the CI runner can read the repository and reach the network, the script often can too. The permission review happens indirectly through runner configuration, credentials and convention.

A declared workflow can make the boundary part of the same diff as the intent. Add a second output file, and the write grant changes beside the new task. Add a network source, and the exact host appears beside the fetch. Remove the tool, and its authority disappears from the file.

That proximity changes review. “Why does this summarizer need a shell?” becomes a concrete question. “Can this report leave the machine?” has an answer in source. An absent permission is not documentation debt. It is a refusal before the effect.

The [blast radius belongs in the file](/blog/blast-radius-in-the-file) because purpose without authority is incomplete. Two workflows can produce the same paragraph while carrying radically different operational risk.

## Cost is part of correctness

A task that returns the right answer at an unbounded price is not correct enough for production.

Intent as Code makes spend review possible by placing the model choice and output ceiling in the plan. The checker can price the part the catalog knows before execution. The runner can enforce a maximum cost at launch. Local compute stays honestly unpriced rather than being relabeled as free.

The distinction matters most when an agent authors the workflow. A model can propose an impressive plan with a large fan-out, generous generations and repeated research calls. The proposal may parse and still be a bad place to spend money. Nika 0.111.0 separates the legal verdict from `paid_ready`, the signal that paid-run guidance has been resolved. [Clean is not ready to spend](/blog/clean-is-not-ready-to-spend), and the file gives a team somewhere to enforce the difference.

Cost review also exposes input size. A small output ceiling does not make a huge fetched document cheap. The static ceiling covers what it can prove, and a human still reviews how much context enters each prompt. Honest partial knowledge is better than a precise number that hides the expensive half.

## The run needs a receipt, not a memory

Source answers what should happen. A trace answers what did happen.

Every meaningful run should leave enough evidence to connect the two. Which workflow bytes ran? Which tasks completed? Which model seat answered? Which outputs were reused on resume? What was spent? Did the journal remain intact after the fact?

Nika records runs under `.nika/traces/` and links journal events through a hash chain. Verification reports the proof level actually reached. A local chain is not called an external attestation. A replay is not implied merely because the original run succeeded.

This matters when results are disputed. The team does not reconstruct the event from screenshots and chat. It reads the source, verifies the trace and finds the exact task where the observed run departed from expectation. The [run becomes evidence](/blog/the-run-becomes-evidence) because the plan and the record share stable identities.

## The discipline compounds

The first workflow saves a prompt. The tenth creates an operating system for repeated AI work.

Files can share review rules. CI can check every changed workflow. Editors can offer completion from the same schema the engine uses. Coding agents can author plans against repository instructions, then call a read-only checker without receiving run authority. Teams can compare traces across model changes instead of trusting impressions. Useful patterns can become templates without becoming another framework dependency.

The compounding effect comes from ownership. A workflow committed today remains readable after a provider changes, a chat product disappears or the original author leaves. The model string may change. The task graph, boundary and definition of done can survive.

That is why Intent as Code is more than prompt versioning. A prompt is one component. The discipline covers the whole unit of work: values, judgment, tools, authority, cost, outputs and evidence.

Explore in conversation. Keep the useful decisions in source. Check the file before it runs, and keep the receipt after it finishes. That is the engineering loop.
