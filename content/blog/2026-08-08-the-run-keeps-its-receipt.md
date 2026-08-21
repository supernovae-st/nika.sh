---
slug: the-run-keeps-its-receipt
title: "The run keeps its receipt"
tag: Engine
date: 2026-08-08
description: "A trace is more than a log: it can replay without effects, resume verified work, expose one task, export to OpenTelemetry and assemble a redacted evidence pack."
---

A successful AI workflow leaves two questions behind.

The first is operational: what happened, in what order, with which model, tools, permissions, outputs and cost? The second is adversarial: why should anyone trust the record that answers the first?

Plain logs answer neither well. They mix human decoration with machine state, lose graph relationships and make edits hard to detect. A hosted run page can preserve structure, but custody moves to the vendor and replay usually means “run it again”, which is the last thing an auditor wants from an evidence viewer.

Nika writes a local NDJSON journal for every run by default. One event per line, typed from the opening manifest to the closing verdict. That one artifact supports several different acts: read, replay, verify, resume, compare, export and package. The commands stay separate because each act carries a different authority.

Start with a small file whose effect is obvious:

```yaml receipt-demo.nika.yaml
nika: receipt-demo

permits:
  exec: ["echo"]

tasks:
  message:
    exec:
      command: ["echo", "the run happened"]

outputs:
  message: ${{ tasks.message.output }}
```

Run it normally:

```text
nika check receipt-demo.nika.yaml
nika run receipt-demo.nika.yaml
nika trace ls
```

The run prints its trace path. `trace ls` treats `.nika/traces/` as a workspace store and shows age, size, workflow and terminal state. The newest resumable trace for each workflow is marked so default retention never collects the one record most likely to continue interrupted work.

## Read without causing another effect

The safest property of the trace interface is stated in the help itself: **replay means re-render, never re-execute**.

```text
nika trace replay .nika/traces/<run>.ndjson
nika trace show .nika/traces/<run>.ndjson
```

`replay` rebuilds the live run presentation from recorded events. It may compress time, but it does not call a model, start a process, contact an MCP server or write the workflow's outputs again. `show` skips the journey and renders the final card.

That boundary matters. An incident responder can open a failed deployment trace without deploying again. A reviewer can watch an MCP call sequence without reconnecting to the MCP server. A colleague can inspect a paid inference run without buying a second answer. Viewing evidence should not need the authority that produced it.

Several narrower readers avoid dumping the whole journal:

```text
nika trace outputs <trace>
nika trace peek <trace> message
nika trace session <trace>
nika trace flow <trace> receipt-demo.nika.yaml
```

`outputs` lists bounded per-task previews. `peek` reads one task's full value and identity. `session` derives waves, waits and spend only where the journal has enough evidence to claim them. `flow` joins the recorded output sizes to the workflow's bindings so the data waterfall remains connected to the authored plan.

The division is useful for disclosure. “Show me the verdict” and “show me the entire model response” are not the same request. A tooling surface that always answers the first with the second will eventually leak something.

## Verify before trusting

Every modern trace line participates in a tamper-evidence chain. Edit, insert, drop or reorder a line and recomputation diverges at a named point:

```text
nika trace verify .nika/traces/<run>.ndjson
```

The chain proves internal consistency. By itself it does not stop someone with write access from rebuilding an entire chain. Nika says that boundary plainly and then offers stronger, separately named tiers.

A sealed run carries a signature that can be checked against a custody key. An anchored run has a detached sidecar tied to the post-seal journal head and public timestamp material. A replayed verification compares the recorded journal with a fresh run you provide. `trace verify` reports the highest honestly attained tier rather than turning every file into a generic green badge.

The refusals are equally specific. A changed line is tampered. Lines chained after the seal are a buried seal, because appending requires only file write access. A sidecar that vouches for nothing is an anchor forgery. A seal whose public key is unavailable is unattributable, which is a missing input, not proof of forgery.

External anchoring is always an explicit network act:

```text
nika trace anchor .nika/traces/<run>.ndjson
```

The default local run does not contact a transparency service. The operator chooses when a run's custody story warrants that step.

## Resume from evidence, not memory

The journal is also a checkpoint. A resumed run verifies the chain before trusting a recorded success:

```text
nika run receipt-demo.nika.yaml --resume .nika/traces/<run>.ndjson
```

Each completed task carries an identity derived from its definition and resolved inputs. If that identity still matches, the engine emits a visible cache hit and skips the effect. Edit the task or change its input and the match breaks. The task runs live.

This is not blind memoization. The trace's engine version is judged too. Resuming under another version refuses unless the operator explicitly attests compatibility with the recorded version. If the chain is broken, resume refuses unless `--resume-unverified` is present, and that waiver is recorded in the new journal. An exception becomes evidence, not folklore.

Sometimes the hashes cannot see the reason to rerun. A rotated secret or changed external database may leave the task definition and authored inputs untouched. `--from <task>` forces that task and its transitive downstream to run again while eligible siblings still reuse their records. `--task <task>` takes the opposite cut and runs one task plus its transitive upstream.

These controls work because the trace preserves task identity and the workflow preserves the graph. “Try from about here” becomes a deterministic subgraph operation.

## Compare two runs without pretending models are deterministic

`nika trace reproduce` compares a recorded journal with a fresh one:

```text
nika trace reproduce recorded.ndjson fresh.ndjson
```

It does not return only same or different. It classifies each task as reproduced, nondeterministic, authored, environment, status-changed or unverifiable. That vocabulary separates several causes teams often call “flakiness”.

A model producing different text under the same task and inputs is nondeterministic. A changed prompt is authored. A different file or environment input is environmental. A success becoming a failure is status-changed. An older record without enough identity material is unverifiable. The comparison refuses to infer evidence the journals do not carry.

This is especially useful when evaluating a provider or model change. Keep the workflow and inputs controlled, run each seat, then compare traces. The result still does not tell you which answer is better. It tells you where execution identity or outputs diverged, which is the stable substrate for a real evaluation.

## Export structure without exporting content by accident

The journal is local and Nika keeps observability vendor-neutral. `trace export` projects it to OTLP JSON lines:

```text
nika trace export .nika/traces/<run>.ndjson
```

The projection carries span structure and current GenAI semantic attributes such as provider and requested model. Recorded task content stays out unless `--include-content` is explicitly set. The output can be opened in an OpenTelemetry-compatible viewer or posted through your own collector later. Export does not make a network call on its own.

For a review or audit handoff, use the evidence pack:

```text
nika trace evidence <trace> --workflow receipt-demo.nika.yaml
```

The default pack combines the journal, manifest, receipt and verification instructions in redacted form. It proves run integrity without automatically disclosing model outputs, tool results or file reads. `--full` is the operator's deliberate widening when content is required.

The receipt has a readable projection, but the command naming keeps the trust boundary visible: `nika trace receipt explain` **explains** a receipt; `nika trace verify` proves what can be proved. Human-friendly text is a reading, not the evidence itself.

## A retention policy is part of operations

Evidence that grows forever becomes an unmanaged data store. Evidence deleted too early stops being evidence. Nika's project file can set trace retention, while command-level removal protects paused runs unless the operator forces deletion. `--no-trace-file` exists for a run whose policy forbids a journal, but it also gives up replay, resume and the local receipt.

Choose retention from the workflow's data class, not disk anxiety alone. A trace can hold prompts, tool responses and file-derived values. Use redacted evidence packs for sharing. Keep full journals under the same access and deletion rules as the source data they record.

The design economy is the final point. The journal is not one feature among many. It is the substrate that lets replay stay effect-free, resume stay evidence-based, comparison stay classified, OpenTelemetry stay portable and audit packs stay re-verifiable. One run leaves one receipt. Every later reader chooses the smallest authority needed to understand it.

Continue with [The chain of custody](/blog/the-chain-of-custody), [The resume story](/blog/the-resume-story), or [The run becomes evidence](/blog/the-run-becomes-evidence).
