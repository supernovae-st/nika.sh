---
slug: starting-over-on-purpose
title: "Starting over, on purpose"
tag: Origins
date: 2026-04-14
description: "We had a working prototype. We rebuilt from scratch anyway: craft, not extraction, one gate at a time."
---

By spring 2026 there was a working prototype. The note from October had become a real engine: files ran, models answered, tools fired. The fastest path from there was obvious: refactor what worked, extract the good parts, ship.

We did the opposite. The first architecture decision record of the current engine says it plainly: **rebuild from scratch, never copy-paste the prototype.** Craft, not extraction.

That sounds romantic. It was actually the cold option.

**A prototype answers a different question.** The prototype existed to learn whether the idea held: can intent live in a file, can a plan be drawn before it runs, can permissions be enforced rather than logged. It answered yes. But code written to *find out* is shaped by the finding-out: shortcuts where the idea was still fuzzy, generosity where discipline was needed later. Extracting it would have meant carrying every one of those youthful decisions into the thing people would trust with their machines.

**Trust infrastructure has a different bar.** An engine that enforces a permission boundary cannot itself be casual about correctness. So the rebuild came with rules the prototype never had: every crate passes a fixed set of admission gates before it enters the workspace; hard caps on file and function size; no unchecked failure paths in source. The gates are boring on purpose. Boring is what you want from the layer that decides whether a write to your disk is allowed to happen.

**The language was frozen before the engine was grown.** Rebuilding gave us the order most projects never get: spec first, engine second. The envelope (`nika: v1`), the four verbs, the permits model were locked as a contract, and then the engine was built *to* the contract, gate by gate. It is why the spec could open under Apache while the engine carries the AGPL: they were separate artifacts from the first day of the rebuild.

The prototype is not disowned; it was the necessary first draft, and drafts are how honest writing works. But you do not ship the draft. You keep what it taught you and write the real sentence.

Starting over cost months. It bought a foundation that will not need to apologize later. In a tool whose whole promise is *the file you write today still runs in ten years*, that trade is not a luxury. It is the product.
