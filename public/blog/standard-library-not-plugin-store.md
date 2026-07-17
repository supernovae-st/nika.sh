---
slug: standard-library-not-plugin-store
title: "A standard library, not a plugin store"
tag: Language
date: 2026-05-14
description: "28 builtins in the binary, allow-listed, nothing to install. The library grows, the language holds still."
---

A workflow language lives or dies on its tools, and the industry default is a marketplace: search, install, and trust someone's package with your filesystem. We shipped a standard library instead.

**28 builtins ride the binary**, across five families: files, data, web, media, flow. Read, write, fetch, jq and their siblings. They are reached the same way as everything else callable, with `invoke:`, they are versioned with the engine, and there is nothing to install. Nothing to install also means nothing to typosquat, no postinstall script, no supply chain roulette on a Tuesday.

**One builtin, 9 honest shapes.** `nika:fetch` turns a page into typed output nine ways: article, markdown, text, links, metadata, selector, sitemap, feed, jq. Read-only by design. The point is not the feature count. The point is that a fetch inside a reviewed file has a declared, typed result, so the step after it knows exactly what it is holding.

```yaml headlines.nika.yaml
nika: v1
workflow:
  id: headlines

tasks:
  page:
    invoke:
      tool: "nika:fetch"
      args:
        url: "https://nika.sh"

  save:
    with:
      page: ${{ tasks.page.output }}
    invoke:
      tool: "nika:write"
      args:
        path: "./page.md"
        content: "${{ with.page }}"
```

Everything beyond the library arrives through MCP: name a `mcp:` tool id and any server you already run is reachable, but only if the file allow-lists it. Growth belongs in the toolbelt, not in the grammar.

The library grows. The language holds still. That trade is the design.
