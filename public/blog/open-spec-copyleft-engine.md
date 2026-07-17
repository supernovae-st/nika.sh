---
slug: open-spec-copyleft-engine
title: "An open spec, a copyleft engine"
tag: Sovereignty
date: 2026-05-01
description: "Two licenses, one argument: the file must outlive every vendor, including us."
---

The nika-spec repository went public this week, under Apache-2.0. The engine that runs it is AGPL-3.0-or-later. Two licenses for one project is a choice you should be able to interrogate, so here is the whole argument.

**The spec is the part you adopt.** The envelope, the four verbs, the task shape, the JSON schema, the conformance suite: all Apache-2.0, with a patent grant. Any team can build a competing runtime on it, and nothing we do later can revoke that. A language you might write hundreds of files in should not have a single implementation as its ceiling. This is the GraphQL shape: an open contract, many possible engines.

**The engine is the part someone would take.** The recent history of open agent tooling is a history of extraction: a permissively-licensed runtime gets wrapped, hosted, improved in private, and the improvements never come home. AGPL closes that door. Run our engine as a service, fork it, build a business next to it: all fine. But the changes ship back. The protection this buys is not ours, it is yours: no fork of the engine can quietly become a closed thing your files depend on.

**Your exit is `cp -r`.** The workflows are plain text in your repo. The spec is Apache. The engine is copyleft. Take the three together and the cost of leaving Nika is copying a folder. Compare that with the cost of leaving wherever your prompts live today.

Licenses are boring until the Friday they are not. We picked ours so the file you write today still runs the day the company that made the runner is gone. That includes us.
