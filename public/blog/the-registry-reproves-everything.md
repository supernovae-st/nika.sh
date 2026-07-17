---
slug: the-registry-reproves-everything
title: "The registry re-proves everything"
tag: Engine
date: 2026-07-14
description: "A workflow registry where nothing is taken on faith: every entry is content-pinned to an exact source revision and re-proven by CI (hash, certificate, advisories). The npm-of-workflows, minus the trust-me."
---

npm taught everyone the failure mode: *install* means *trust the publisher*. A name you recognize, a README that reads well, and a postinstall script runs on your machine with your credentials in reach. Every package ecosystem since has rediscovered the same wound (typosquats, rug-pulled versions, maintainers gone rogue) and patched it with process: more review, more badges, more gatekeepers to trust instead.

The [Nika registry](https://github.com/supernovae-st/nika-registry) starts from the opposite premise, and states it in its own repo description: **trust lives in the artifact, not the gatekeeper.**

It can afford that premise because of what a workflow *is* here. A registry entry does not point at a tarball of code that will do whatever it does at runtime. It points at [a declared file](/blog/the-pipeline-is-a-file) whose blast radius is statically checkable. That changes what a registry can promise. Here is one entry from the live index, whole, in the file's own field order:

```json
{
  "advisories": [],
  "cert": "certs/supernovae-st/ceo-monday-brief/0.1.0.json",
  "cert_summary": {
    "broad": false,
    "clean": true,
    "cost_usd_bounded": null,
    "exec": false,
    "llm_calls": 1,
    "secret_leaks": 0
  },
  "description": "news + repo pulse + KPIs → thinking synthesis → dated brief + cost ping",
  "entry": "registry/workflows/supernovae-st/ceo-monday-brief/0.1.0.toml",
  "license": "Apache-2.0",
  "name": "ceo-monday-brief",
  "publisher": "supernovae-st",
  "sha256": "a566cc5671694d0740ffd315d6d7f8164531f673841e07312a862f33d81de4cb",
  "source": {
    "path": "examples/showcase/t4-ceo-monday-brief.nika.yaml",
    "repo": "supernovae-st/nika-spec",
    "rev": "12157ad949e75859c0cc41806c73876887871fac"
  },
  "spec": "nika/v1",
  "type": "workflow",
  "version": "0.1.0"
}
```

Read it as a threat model, field by field. The `sha256` is a **content pin**: a typosquat can steal a name, it cannot fake a hash. The `source.rev` pins provenance to an exact commit: a rug-pull can rewrite a branch, it cannot rewrite the revision you resolved. The `cert` is the receipt of a **re-proof**: the registry's CI fetched that exact file and ran the same static audit [`nika check` runs on your machine](/blog/injection-goes-nowhere). So the summary you read (`clean`, one LLM call, zero secret leaks, cost honestly *un*bounded) was measured by the conformance oracle, not asserted by the publisher. Publisher honesty is not a required input to the system. And `advisories` is the post-hoc channel: findings attach to the entry after the fact, in the open.

The certificate underneath goes further than the summary. It carries the full inferred permits boundary (a pinned `exec: ["git"]`, nine named tools) and, written into that boundary, the audit's own refusals as review comments: *"task `news` reaches a dynamic URL — `net.http` cannot express 'any host'; add the resolved host(s) before running."* The same honesty [the generative post](/blog/the-generative-workflow) hit with dynamic paths, here in a published artifact. The certificate does not launder what refused to pin into looking pinned: the boundary you download names its own gaps, and the engine that measured it is stamped beside the hash.

Now the part that makes this a protocol instead of a promise. The index carries its own verification instructions, and they are worth quoting exactly. The `verify.how`:

> fetch source.repo@source.rev:source.path · sha256 MUST equal .sha256 · then `nika check <file>` locally

and the `verify.never`:

> install anything an advisory names · **trust this index over your own hash check**

An index that instructs you not to take *its own word* for it. So I didn't. The loop closes in a few lines, no special tooling:

```text
❯ curl -sL raw.githubusercontent.com/supernovae-st/nika-spec/12157ad9…/examples/showcase/t4-ceo-monday-brief.nika.yaml \
    | shasum -a 256
a566cc5671694d0740ffd315d6d7f8164531f673841e07312a862f33d81de4cb  -

# the index says:
"sha256": "a566cc5671694d0740ffd315d6d7f8164531f673841e07312a862f33d81de4cb"
```

Fetched at the pinned revision, hashed locally: match. Then `nika check` on the file re-derives the certificate's claims on *your* machine: the third leg of the protocol, and the one that matters most, because it means the registry's whole trust chain is **reproducible by anyone, from public material, without asking anyone**. The same move as [the trace whose hash chain you can re-derive](/blog/the-chain-of-custody), one level up: there, a run proves itself; here, a *published artifact* does.

The registry's own plumbing follows the same discipline. First-party entries are not hand-curated: they are a projection of the spec's example pack at a pinned spec revision (`SPEC_PIN` in the repo root), regenerated and re-proven when the pin moves. There is an `ENTRY_TEMPLATE.toml` for contributed entries, and an `llms.txt`, because the audience that installs workflows increasingly [reads registries by machine](/blog/the-mcp-server-you-didnt-build), and an agent can run the verify protocol as easily as you can.

Sharing was always the point of making [the intent a file](/blog/intent-as-code): a file can be mailed, diffed, reviewed. And published. The registry is what publishing looks like when the ecosystem refuses to inherit npm's axiom. Nothing is taken on faith; everything is re-derivable; the gatekeeper you don't have to trust is also the gatekeeper who can't betray you.
