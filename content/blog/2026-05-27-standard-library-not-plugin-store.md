---
slug: standard-library-not-plugin-store
title: "A standard library, not a plugin store"
tag: Language
date: 2026-05-27
published: 2026-07-05
receipts:
  - https://github.com/supernovae-st/nika-spec/commit/7ce582d2302a392f621dffcad835ca2375cc6511
description: "Builtins ship with the engine and stay separate from the four verbs. External tools remain explicit dependencies, not new grammar."
---

A workflow language lives or dies on its tools, and the industry default is a marketplace: search, install, and trust someone's package with your filesystem. Nika gives common operations a smaller home: the standard library.

The first machine-readable registry for that contract landed on May 27. It recorded the verbs and builtins separately, so adding a callable operation no longer implied adding a new way for the language to execute.

## The binary carries the common floor

**<!-- canon:builtins -->28<!-- /canon --> builtins are part of the current language contract**, across five families: files, data, web, media, flow. Read, write, fetch, jq and their siblings are reached the same way as everything else callable, with `invoke:`. The reference engine ships its builtin implementation with the binary, so those operations do not require a per-workflow package install.

That removes one supply-chain decision from the common path. It does not make every external tool built in. MCP servers, processes and provider services remain separate dependencies with their own installation, identity and authority boundaries.

**One builtin, <!-- canon:extractModes -->9<!-- /canon --> honest shapes.** `nika:fetch` turns a page into typed output nine ways: article, markdown, text, links, metadata, selector, sitemap, feed, jq. Read-only by design. The point is not the feature count. The point is that a fetch inside a reviewed file has a declared, typed result, so the step after it knows exactly what it is holding.

```yaml headlines.nika.yaml
nika: headlines

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

## Three extension lanes

Keeping the grammar small requires more than a builtin list. It requires clear lanes for growth:

- **Common operation with a stable Nika contract:** a builtin owned by the engine release.
- **Typed external tool:** MCP, owned by the operator who configures the server.
- **Ordinary executable:** `exec`, owned by the host and workflow boundary.

An MCP tool is not automatically trusted because it is discoverable. The server must be configured, its tool must fit the workflow's declared permits and the process still runs under the host boundary Nika can enforce. A command remains a process, even when it is convenient.

This separation keeps a new integration from becoming a new language keyword. It also keeps the builtin contract reviewable. A builtin can specify arguments, result shape and refusal behavior without importing an open-ended package manager into every run.

## Why `fetch` belongs here

The first public page counted `fetch` as a verb. The spec corrected that on May 22: fetching does not create a distinct execution model. It is one callable operation under `invoke`, with bounded modes and a typed result.

That subtraction is the design in miniature. The language names ways of acting. The library names things that can be called. The graph names order. Once those roles are separate, each can grow without impersonating the others.

The library grows. The language holds still. That trade is the design.
