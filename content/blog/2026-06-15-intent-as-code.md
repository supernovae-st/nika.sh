---
slug: intent-as-code
title: "Intent as Code: why your AI work should be a file"
tag: Manifesto
date: 2026-06-15
description: "Chats evaporate, files compound. The case for writing AI work down as source you own — your best prompts, versioned like code."
---

Think about the best thing you did with an AI last month. The careful prompt, the back-and-forth, the result that finally clicked. **Where is it now?** For most people the honest answer is: gone. Buried in a chat history you will never scroll back through, on a server you don't control.

We've accepted a strange deal: the more useful the work, the more disposable the container. Nobody would write software in a text box that forgets everything. Yet that's exactly how most AI work happens today.

**Nika's bet is simple: useful AI work is worth writing down.** Not as a transcript, as *source*. A small YAML file that says what you want: fetch this, think about that, run this command, save the result. The file is the workflow. Run it again tomorrow and it does the same thing. Change a line and `git diff` shows exactly what changed.

Four verbs cover the whole space: **infer** (call a model), **exec** (run a process), **invoke** (use a tool), **agent** (let it work a loop). Everything else is data flowing between tasks. The order falls out of the dependencies. Write `depends_on` and independent branches run in parallel, for free.

And it runs on **your machine**. One Rust binary. Your model keys, your files, your git history. No cloud between you and your own work, and a license (AGPL) that guarantees it stays that way.

Chat is a great place to *figure out* what you want. It is a terrible place to *keep* it. Explore in chat. Then write the intent down, and own it forever.
