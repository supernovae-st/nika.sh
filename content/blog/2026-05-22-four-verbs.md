---
slug: four-verbs
title: "Four verbs are enough"
tag: Language
date: 2026-05-22
published: 2026-07-05
receipts:
  - https://github.com/supernovae-st/nika-spec/commit/34987bf7a9ff6eb9ca3e3bd2bc67a1223f6e3bbd
description: "A verb is a distinct execution model, not a feature. Why the language locks at four, forever."
---

Every workflow language faces the same temptation: keep adding verbs. A verb for HTTP. A verb for files. A verb for email, for SQL, for whatever last week's integration needed. Ten years later the language is a catalog nobody can hold in their head, and every file is written in a different dialect of it.

The first public spec draft still had five. Later on May 22, one commit completed the correction across the specification: `fetch` became `nika:fetch`, a tool under `invoke`.

Nika locks the count at four. The rule that makes this possible is strict: **a verb is a distinct execution model**, not a feature. **infer** generates with a model. **exec** runs a process. **invoke** calls a tool and returns. **agent** runs a bounded loop with tools. Four genuinely different ways for a machine to act.

```yaml morning-brief.nika.yaml
nika: morning-brief

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
      fetch_news: success
      build: success
    infer:
      prompt: "Summarize what changed"

outputs:
  brief: ${{ tasks.digest.output }}
```

## The subtraction test

The test case was fetch. Surely getting a web page deserves its own verb? It does not, and the reason is the whole design: **fetching is not a distinct execution model.** It is a tool call. So `nika:fetch` lives in the standard library, reached through invoke, next to read, write, jq and the other <!-- canon:builtins-4 -->24<!-- /canon --> builtins.

The same test handles future pressure:

- If it calls a bounded tool and returns, it belongs under `invoke`.
- If it starts an operating-system process, it belongs under `exec`.
- If it asks one model generation for a result, it belongs under `infer`.
- If the model chooses a bounded sequence of tools, it belongs under `agent`.

HTTP, SQL, email, browser control and a future database connector do not become verbs merely because they are useful. They are callable capabilities with contracts.

## Ordering is not a verb either

Parallelism, retries and waiting can look like actions in a visual builder. In Nika they are graph or policy facts around an action. `with:` carries data edges. `after:` carries control edges. Retry changes how an admitted task is attempted; it does not create a fifth execution model.

This separation keeps the checker legible. It can ask one question about how a task acts, another about when it becomes eligible and another about what authority the effect requires. A single keyword does not have to answer all three.

## Why `agent` remains distinct

An agent is not merely a long `infer`. One model response is requested up front under `infer`. An agent loop chooses tools and continues across turns until a bounded stop condition. That difference changes cost, authority, cancellation and trace shape. It earns a separate verb because the runtime physics are different.

A closed verb set is a feature you can feel. You can learn the four execution models, then treat new integrations as tools rather than dialect changes. Tools can grow in the standard library, through MCP or behind ordinary processes while the execution grammar keeps one shape.

That stillness is the promise. It does not mean every field around the verbs is frozen or that no migration will ever happen. It means new product features do not get to rename the basic ways a task can act.
