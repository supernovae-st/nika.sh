---
slug: starting-over-on-purpose
title: "Starting over, on purpose"
tag: Origins
date: 2026-04-14
published: 2026-07-05
receipts:
  - https://github.com/supernovae-st/nika/commit/0cc7b74235c896f16d326795786a7f7b40241c43
  - https://github.com/supernovae-st/nika/commit/4cac646e9d99e287654e029831370812280b7754
description: "We had a working prototype. We rebuilt from scratch anyway: craft, not extraction, one gate at a time."
---

By spring 2026 there was a working prototype in the private project chronology. Files ran, models answered and tools fired. The public receipt for that prototype has not survived in the current engine repository, so this chapter treats its behavior as recollection rather than release evidence. The fastest path from there looked obvious: refactor what worked, move the good parts and keep shipping.

The current engine took a harder boundary. Its first public commit on April 13 created an orphan branch with an empty Cargo workspace. The architecture decision published the next day made the rule explicit: **rebuild from scratch, never copy-paste the prototype.** Craft, not extraction.

That sounds romantic. It was actually the cold option.

**A prototype answers a different question.** The prototype existed to learn whether the idea held: can intent live in a file, can a plan be drawn before it runs, and where would effect boundaries have to live? It answered enough of those questions to justify another pass. The public permits contract and its runtime enforcement came later, in June. Code written to find out is shaped by the finding-out: shortcuts where the idea was still fuzzy, generosity where discipline was needed later. Copying it into the new workspace would have admitted those decisions before they were reviewed as architecture.

**Trust infrastructure has a different bar.** An engine that enforces a permission boundary cannot itself be casual about correctness. So the rebuild started with rules the prototype never had: tracked-source size caps, checks for unchecked failure paths, workspace-wide lint policy, dependency review and library tests. The first commit contained nine blocking ratchets and zero admitted crates. The conditions arrived before the code they would judge.

## The chronology is less tidy than the slogan

The rebuild began before the dedicated specification repository. The current engine starts on April 13. The first full public spec draft lands on May 22. That draft still treated `fetch` as a peer of `infer`, `exec`, `invoke` and `agent`, and used an envelope the current parser later retired.

So the honest sequence is not “final spec first, engine second.” It is:

1. create a clean execution workspace with admission rules;
2. separate the language into its own public contract;
3. let specification, conformance and engine correct one another;
4. remove old grammar instead of keeping compatibility layers that would create two languages.

The four-verb model emerged during that work. The permits contract arrived in June. The current compact envelope arrived later still. Each has its own receipt. None should be projected backward into the empty April workspace.

That messier chronology is a better engineering story. The architecture did not begin omniscient. It created a process that could discover a wrong choice and remove it cleanly.

## What “from scratch” did and did not mean

Starting from an orphan branch did not erase what the prototype had taught. Legacy behavior remained available as a reference. What crossed the boundary were tests to re-earn, failure cases to understand and product laws to state again. Source lines did not receive automatic authority merely because they had once worked.

The distinction matters today because “extraction” can also describe a healthy refactor inside the current engine. Moving an already-proven responsibility into a lower crate with preserved history is not the same act as importing prototype code into the rewrite. The April rule concerns the boundary between those two generations.

The prototype is not disowned. It was the necessary first draft, and drafts are how honest writing works. The rebuild kept what it taught and required every new component to show its work again.

Starting over cost months. It also made correction part of the architecture. For a tool that wants today's workflow to remain understandable years from now, that trade is part of the product.
