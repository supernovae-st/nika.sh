---
slug: four-verbs
title: "Four verbs are enough"
tag: Language
date: 2026-06-22
description: "A verb is a distinct execution model, not a feature. Why the language locks at four, forever."
---

Every workflow language faces the same temptation: keep adding verbs. A verb for HTTP. A verb for files. A verb for email, for SQL, for whatever last week's integration needed. Ten years later the language is a catalog nobody can hold in their head, and every file is written in a different dialect of it.

Nika locks the count at four, forever. The rule that makes this possible is strict: **a verb is a distinct execution model**, not a feature. **infer** generates with a model. **exec** runs a process. **invoke** calls a tool and returns. **agent** loops with tools until the job is done. Four genuinely different ways for a machine to act. There is no fifth.

```yaml morning-brief.nika.yaml
nika: v1
workflow:
  id: morning-brief

tasks:
  fetch_news:
    invoke:
      tool: "nika:fetch"          # a tool, not a verb
      args:
        url: "https://hnrss.org/frontpage"

  build:
    exec:
      command: ["cargo", "build", "--release"]

  digest:
    after:
      fetch_news: succeeded
      build: succeeded
    infer:
      prompt: "Summarize what changed"

outputs:
  brief: ${{ tasks.digest.output }}
```

The test case was fetch. Surely getting a web page deserves its own verb? It does not, and the reason is the whole design: **fetching is not a distinct execution model.** It is a tool call. So `nika:fetch` lives in the standard library, reached through invoke, next to read, write, jq and the other 24 builtins. Everything callable is a tool. Everything about ordering is the graph.

A closed language is a feature you can feel. You can finish learning it: four words and the file reads like prose. Your files never rot into an old dialect, because there is no new dialect coming. And tools keep growing where growth belongs, in the library: a new builtin, a new tool server (MCP), a new provider. The language holds still while the toolbelt expands.

That stillness is the promise. The file you write today is the file you run in ten years. Languages that stop moving are the ones you can build on.
