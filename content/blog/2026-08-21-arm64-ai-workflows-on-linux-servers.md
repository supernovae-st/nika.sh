---
slug: arm64-ai-workflows-on-linux-servers
title: "AI workflows on ARM64 Linux servers, without the missing safety step"
tag: Engine|Sovereignty
date: 2026-08-21
description: "A practical path from a native ARM64 Nika binary to checked, sandboxed and traceable AI workflows on a headless Linux host."
---

An ARM64 server does not need a separate workflow language, a container full of glue, or a weaker security story. It needs a native binary, a visible enforcement backend, a preflight check, and a trace that survives after the job exits. Nika treats those as separate facts, which makes the operating path easier to review.

The current Nika release publishes native archives for Linux ARM64 and macOS ARM64. The public installer recognizes both `arm64` and `aarch64`, selects the matching archive, verifies it against `SHA256SUMS`, and only then extracts the binary. That solves packaging. It does not, by itself, prove that a workflow is safe to run on a remote machine.

The missing step on many server guides is enforcement. On Linux, Nika uses bubblewrap for the process boundary around `exec` and MCP children. If bubblewrap is absent, the installer says so. A workflow that declares `permits:` refuses the unjailed path with `NIKA-1710` instead of presenting an unenforced boundary as a successful run.

That distinction is the whole article: native support and enforced authority are two different checks.

## Start with the release asset, not an architecture assumption

Run the architecture probe on the machine that will execute the workflow:

```bash
uname -sm
```

On an ARM64 Linux host, the output commonly contains `Linux aarch64`. On Apple silicon it contains `Darwin arm64`. The installer normalizes either ARM spelling to the `arm64` release target.

The normal install path is one command:

```bash
curl -LsSf https://nika.sh/install.sh | sh
nika --version
```

For the current release, the archive set and recorded digests are visible in the [v0.111.0 release room](/releases/v0.111.0). The [ARM64 install guide](/install/arm64) prints the exact Linux and macOS asset names projected from that release identity. A test compares those names with the vendored release record, so the page cannot quietly promise an archive the train did not publish.

This is useful beyond installation. It separates three questions that are often mixed together:

1. Does a native binary exist for this CPU and operating system?
2. Was the downloaded archive checked before extraction?
3. Can this host enforce the authority declared by the workflow?

The first two belong to the release. The third belongs to the runtime environment.

## Make the Linux sandbox a deployment prerequisite

On macOS, the operating system supplies the Seatbelt enforcement path. On Linux, a headless host needs bubblewrap available to Nika. Check it explicitly:

```bash
command -v bwrap
bwrap --version
```

Install the `bubblewrap` package from the Linux distribution that owns the host, then keep this probe in the machine image or provisioning check. The point is not to make a package manager part of Nika. The point is to make the enforcement dependency visible before a scheduled run reaches a model, a shell command, or an MCP server.

The [server and headless guide](/install/servers) names the failure mode directly. Without `bwrap`, process children are unjailed. Nika does not silently turn a declared `permits:` block into documentation. A strict workflow refuses because the host cannot keep the boundary the file claims.

That refusal is more useful than a green task followed by a security footnote. It can fail a machine-image test, stop a deployment, and give the operator one concrete missing prerequisite.

## Check the same file the scheduler will run

The preflight command is not a dry marketing preview. It compiles the workflow into the plan, cost, secret-flow, type, tool, argument, schema, gate, write, execution, permit, trifecta and journey judgments the installed binary can make before execution.

```bash
nika check workflow.nika.yaml
```

Run it from the same checkout and with the same generated workflow bytes that the server job will use. A check performed on one file followed by a run of a templated or rewritten copy proves the wrong input.

The file should declare the authority it needs. A server job that writes one report should not inherit the entire repository. A model task that calls no tool should not receive an ambient tool universe. A cloud model should be visible as a provider destination. A local model should remain unpriced compute, not be described as zero-cost infrastructure.

The [boundary page](/how/boundary) explains how permits and secrets fit together. The [proof page](/how/proof) explains what remains in the run record. They are separate pages because a declared boundary and a recorded outcome answer different questions.

## Keep architecture and model choice independent

ARM64 selects the Nika executable. It does not select the model provider.

The same workflow can use a local Ollama seat on an ARM development machine, a vLLM service on an internal GPU host, or a cloud provider on a CPU-only server. The `model:` string changes. The graph, token ceilings, tools, permits, outputs and trace discipline do not need a second format.

For a small local rehearsal:

```bash
ollama pull llama3.2:3b
nika try 01-hello --model ollama/llama3.2:3b
```

The current binary also carries the built-in local model command tree. Inspect the installed surface before choosing that lane:

```bash
nika model --help
```

The [local model guide](/install/local-models) connects those options to the [provider register](/catalog/providers), the [model catalog](/catalog/models), and the [energy register](/catalog/energy). The catalog calls a local seat unpriced when no sourced price exists. It never turns a missing billing row into a claim that compute is free.

## Design headless workflows to finish without a hidden person

A server job has no terminal operator unless the workflow explicitly creates a handoff.

That matters for approval prompts. A blocking `nika:prompt` with no default pauses in an interactive session and fails closed in an unattended one. This is correct for a release gate, but wrong for a nightly job that was expected to complete automatically.

Choose the behavior in the file:

- A fully automatic job should avoid a human prompt and keep every decision deterministic.
- A review workflow may generate a candidate and stop before publication.
- An irreversible action should wait for an explicit approval tied to that recorded run.
- A scheduler should own when a workflow starts. The workflow should own what happens after it starts.

The result is easier to operate because “waiting for a person” is a task state, not a process hanging for an unknown reason.

## Return machine output and keep the trace

For a server caller, return the declared outputs as JSON:

```bash
nika run workflow.nika.yaml --output json
```

The JSON is the callable result. The local trace is the evidence record. They serve different consumers and neither should be scraped from the other.

After a run that matters, verify its trace:

```bash
nika trace verify .nika/traces/<run>.ndjson
```

The journal is hash-chained, so a changed event breaks the chain after it. A sealed or anchored run can reach stronger proof levels, but the verifier reports the level actually attained. It does not promote a local chain to an attestation just because the workflow finished successfully.

## The operating checklist

The full server path fits in a short review:

1. Confirm the host reports ARM64 or x64 as expected.
2. Install the native release and verify `nika --version`.
3. Ensure `bwrap` exists on Linux before enabling scheduled runs.
4. Run `nika check` against the exact workflow bytes that will execute.
5. Choose the model provider independently from the CPU architecture.
6. Make every human gate explicit and fail closed when unattended.
7. Use `--output json` for the caller and retain the trace for evidence.

ARM64 support is the first line of that checklist, not the last. The useful deployment story is native bytes plus an enforceable boundary plus a verifiable run. Remove any one of the three and the server may still execute a workflow, but the operator can no longer prove the claim the file was meant to make.
