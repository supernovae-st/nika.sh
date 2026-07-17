---
slug: the-mcp-server-you-didnt-build
title: "The MCP server you didn't have to build"
tag: Engine
date: 2026-07-11
description: "Everyone is learning how to build an MCP server. For your workflows, skip the tutorial: the nika binary already is one. Read-only tools let any agent audit a plan and learn the language from the thing that enforces it."
---

"How to build an MCP server" is this year's most-searched developer tutorial, and the ecosystem's answer is a scaffold: pick an SDK, define your tools, wire the transport, keep the schema in sync with the thing it describes, forever. Before you build one for your workflow tooling, check whether it already exists. If the workflow tool is Nika, it does, and it shipped inside the binary you already installed:

```text
❯ claude mcp add nika -- nika mcp
❯ claude mcp list

  nika: nika mcp - ✔ Connected
```

One line for Claude Code; for Cursor, Claude Desktop, or anything else that speaks MCP over stdio, the config block is the same five words:

```json
{ "mcpServers": { "nika": { "command": "nika", "args": ["mcp"] } } }
```

No separate package, no port, no server process to babysit. `nika mcp` speaks the protocol over stdio (five revisions negotiated, current through 2026) and exposes 9 tools. They divide into exactly two jobs.

**Job one: the agent validates before anything runs.** `nika_check` and `nika_explain` are [the same static audit](/blog/injection-goes-nowhere) the CLI runs (schema, DAG, permits, secrets, cost), reached as a tool call. We did not mock this for the post: the workflow below was audited by a real agent, over MCP, mid-session. Handed a plan whose `save` step reaches for `~/.ssh/authorized_keys`, the human CLI prints the red `PERMITS ✖` console you have seen before. The MCP surface returns the same verdict *as data*:

```json
"capability_escapes": [
  {
    "task": "save",
    "category": "fs",
    "detail": "`nika:write` path `~/.ssh/authorized_keys` is outside permits.fs.write",
    "fix": "add \"~/.ssh/authorized_keys\" to permits.fs.write"
  }
]
```

Same audit, two registers. The CLI speaks human; the MCP surface speaks agent: task, category, detail, and the fix as a machine-readable field. An agent holding that response does not parse a console with a regex; it reads `fix`, edits one line, and re-checks. (Whether to *apply* that fix is exactly the review conversation from [the two-agent experiment](/blog/written-by-agents). The loop is write, audit, fix, and the audit's structured voice is what makes the loop cheap.)

**Job two: the agent learns the language instead of guessing it.** `nika_schema` serves the JSON Schema. `nika_examples` and `nika_template` serve real, runnable shapes to start from: the same embedded showcase the frontier agent cribbed in the last post, which is why its first draft was audit-green. `nika_catalog` and `nika_tools` name what exists: providers, models, builtins. And `nika_canon` returns the language's locked registry: the counts and names that every doc is a projection of. Its own description states the discipline: *cite it, never a remembered number*. A 14B local model inventing a `steps:` field is what guessing looks like; a model that can call `nika_examples` does not have to invent.

Now the architecture note, because it is a decision and not an accident: **the MCP server is a read-only oracle.** Look at the tool list again: there is no `nika_run`. The server will audit any plan, explain any file, serve any schema, and it cannot execute anything, spend a token, or touch a file. Execution stays where your [permits](/blog/injection-goes-nowhere) and your terminal are. An agent wired to this server can get everything right *about* the run without ever being able to cause one. The capability boundary is not a setting on the server. It is the absence of the tool. If you are sketching your own MCP server architecture, that is the line worth stealing: separate the surface that knows from the surface that acts, and give agents the first one.

The deeper reason this beats the server you would have built: **it cannot drift.** A hand-built MCP server describing your tool is documentation wearing a protocol. The schema it serves and the binary it describes are two artifacts, and two artifacts diverge. `nika mcp` is the binary. The schema comes from the structs that parse your file; the audit is the audit; the canon is compiled in. When the engine updates, the oracle updates, because they are the same release of the same executable. [`nika init`](/blog/written-by-agents) taught your agent the loop in prose; `nika mcp` is the other half: the loop's questions, answered by the thing that will enforce the answers.
