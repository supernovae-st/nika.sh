---
slug: open-spec-copyleft-engine
title: "An open spec, a copyleft engine"
tag: Sovereignty
date: 2026-05-22
published: 2026-07-05
receipts:
  - https://github.com/supernovae-st/nika-spec/commit/7d471abfd1930bef255fe7b3ee050317fc1b3718
  - https://github.com/supernovae-st/nika/commit/0cc7b74235c896f16d326795786a7f7b40241c43
description: "The language contract is Apache-2.0. The reference engine is AGPL-3.0-or-later. The split keeps adoption and implementation custody separate."
---

On May 22, the Nika language contract entered its own public repository under Apache-2.0. The reference engine was already rebuilding under AGPL-3.0-or-later.

Two licenses for one project is a choice you should be able to interrogate, so here is the argument and its limit.

## Two artifacts, two jobs

**The spec is the part you adopt.** The envelope, the four verbs, the task shape, the JSON schema, the conformance suite: all Apache-2.0, with a patent grant. Published copies remain available under those terms, and any team can build a competing runtime from them. A language you might write hundreds of files in should not have a single implementation as its ceiling. This is the GraphQL shape: an open contract, many possible engines.

**The engine is the reference implementation.** AGPL-3.0-or-later allows use, modification and commercial operation while requiring corresponding source to remain available in the situations covered by the license, including modified network use. It does not force every independent service around Nika to adopt the same license. It keeps modifications to the covered engine from becoming an invisible dependency for its users.

The split draws a useful line:

- **Workflow language and conformance material, Apache-2.0.** This protects implementation freedom and carries a patent grant.
- **Reference Rust engine, AGPL-3.0-or-later.** This protects source access for users of modified covered software under the license terms.

That line is more precise than saying “Nika is open source” and leaving readers to discover later that different parts carry different obligations.

## The first spec was not the final spec

The May 22 receipt is strong evidence for the license split and the existence of a standalone language contract. It is not evidence that every field in that first draft survived.

The initial draft still treated `fetch` as a peer of `infer`, `exec`, `invoke` and `agent`, and used an older envelope. The same day, `fetch` moved from the verb set into the standard library. Later revisions tightened task shape, permits, identity and conformance. The current website projects language facts from the current spec instead of copying the first draft into permanent marketing prose.

That evolution is the point of separating contract from implementation. A language repository can show its amendments, fixtures and machine-readable schema. An engine repository can show which contract snapshot it implements. One does not have to pretend to be the other.

## What the split does not promise

Licensing does not guarantee that every future implementation will behave identically. Conformance evidence does that work. Plain text does not make migration free if a workflow depends on a particular builtin, provider or host policy. A copyleft engine does not remove the need to back up your own files and artifacts.

It does improve the exit boundary. The workflow lives in the project. The language contract can be implemented without asking the reference-engine author for permission. The covered engine source cannot quietly disappear behind a modified network service where the license requires an offer of source.

Licenses are boring until the Friday they are not. The split cannot promise that one binary runs forever. It can keep the file, the contract and the reference implementation available for the people who have to make the next binary.
