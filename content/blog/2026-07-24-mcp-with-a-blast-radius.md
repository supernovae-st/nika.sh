---
slug: mcp-with-a-blast-radius
title: "MCP with a blast radius"
tag: Security
date: 2026-07-24
published: 2026-08-21
description: "An MCP tool is executable foreign capability. Put its server, network, environment, tool ids and schema pin under separate review, then let the trace record the call."
---

MCP makes tools easy to discover. It does not make them safe to run.

An MCP server is a process or remote service that publishes names and argument schemas. Once connected, it can read inputs, call APIs, touch databases and return content to the next step. That is useful precisely because it has authority. Treating its tool list as a menu of harmless functions confuses discoverability with trust.

Nika puts an MCP call through several independent boundaries. Each answers a different question:

- Which server process did the project configure?
- May that process use the network, and what environment does it actually receive?
- Which tool ids may this workflow invoke?
- Which tools may one `agent:` task choose during its loop?
- Is the tool schema the one a person previously approved?
- What did the server return during this run?

The important word is *independent*. A tool allowlist is not a network policy. A network policy is not a schema pin. A trace is not a preflight. Collapsing them into one “MCP enabled” switch gives every layer more meaning than it can enforce.

## Start with the server process

Nika's engine-side MCP registry is project-local at `.nika/mcp_servers.json`. A minimal stdio entry looks like this:

```json
{
  "mcp_servers_format": 1,
  "servers": {
    "github": {
      "command": "github-mcp-server",
      "args": ["stdio"],
      "network": { "allowlist": ["api.github.com"] }
    }
  }
}
```

The `github` key becomes the server segment in `mcp:github/<tool>`. `command` and `args` are part of the server identity. Repoint either and the previous approval no longer describes the process being started.

Network access is a separate local grant. If `network` is absent, the stdio child starts with network denied. A fully local server needs no exception. `"network": "allow"` is the explicit escape hatch. The object form records a host set, but the v0.111.0 client names an important limitation on every connection: until the MCP egress proxy lands, that allowlist is confined exactly like `allow`. It is reviewable intent, not host-granular enforcement yet. Treat a networked stdio server as broadly network-capable in the current release.

The current client path supports stdio servers for execution and pinning. A registry entry containing a remote URL is parsed but refuses honestly because the remote client transport is not wired yet. “Configured” never gets to masquerade as “supported”.

## Name the exact tool in the workflow

The workflow refers to an MCP tool through the same `invoke:` verb used for builtins. The namespace is closed and the slash matters:

```yaml issue-digest.nika.yaml
nika: issue-digest

permits:
  tools: ["mcp:github/search_issues", "nika:write"]
  fs:
    write: ["./issue-digest.json"]

tasks:
  issues:
    invoke:
      tool: "mcp:github/search_issues"
      args:
        query: "repo:supernovae-st/nika is:issue is:open"

  save:
    with:
      issues: ${{ tasks.issues.output }}
    invoke:
      tool: "nika:write"
      args:
        path: "./issue-digest.json"
        content: "${{ with.issues }}"

outputs:
  digest: ${{ tasks.issues.output }}
```

`permits.tools` is the workflow-wide ceiling. The file may invoke only those two tool ids. A wildcard such as `mcp:github/*` is legal when the workflow genuinely needs a changing family, but the exact id is the better review unit when one call will do.

Notice what the block does not say. It does not grant the GitHub process network access. That lives in the project registry because it governs the child process on this machine. It does not pass a token from the operator's shell either. The current stdio spawn clears the ambient environment and re-admits only the small runner floor. Provider keys and session tokens stay behind. The registry has no general-purpose environment map, and `permits.env` is not a back door into the MCP approval process.

For an `agent:` task, there is one more ceiling. The task's `tools:` list scopes what the model may choose during that loop:

```yaml issue-research.nika.yaml
nika: issue-research
model: ollama/llama3.2:3b

permits:
  tools: ["mcp:github/search_issues", "mcp:github/get_issue"]

tasks:
  research:
    agent:
      system: "Read issue metadata. Do not modify the repository."
      prompt: "Find the three oldest open bugs and explain their current blockers."
      tools: ["mcp:github/search_issues", "mcp:github/get_issue"]
      max_turns: 6
      max_tokens_total: 6000

outputs:
  report: ${{ tasks.research.output }}
```

The agent list cannot widen `permits.tools`. It can only narrow the workflow's ceiling for one task. This prevents a prompt from negotiating for a capability the file did not grant. A runtime permit refusal is not fed back to the model as another problem to talk around.

## Pin the published schema

Tool names are not stable merely because the server command is stable. A server upgrade can add a tool, remove an argument, broaden a schema or change a description that steers agent selection.

Nika records approved tool definitions in `.nika/mcp_pins.json`. The pin includes the server identity and the published `tools/list` definitions. If the current list drifts, connection refuses and names the remediation. Re-approval is an explicit human act:

```text
nika mcp approve github
```

That command is not “accept whatever changed”. It fetches the current definitions, shows the new pin set and writes the reviewed state. The distinction matters for supply-chain review. Pinning only a package version misses a server that selects behavior from another installed binary. Pinning only a tool schema misses a registry command that now starts a different package. The identity and the advertised surface belong together.

This is also why a catalog entry is not runtime trust. The public [MCP catalog](/catalog/mcp) helps you discover packages, transport and security metadata. Your project registry names what this checkout will start. Your local pin names what that process promised when you approved it. The workflow names what one plan may call. Discovery, installation, approval and authority stay separate.

## Refuse a credential channel you cannot review

Do not put an API token in `mcp_servers.json`, an argument list or the workflow. Process arguments are visible to operating-system inspection and often copied into logs. Inline workflow values enter version control and review surfaces.

For external MCP servers, the current release deliberately clears ambient credentials but does not yet offer a general secret injection field in the project registry. That means some credentialed servers are not safely expressible through this path today. Prefer a server with an explicit, reviewable credential source that works inside the project sandbox. If it only accepts an ambient token, do not smuggle that token into argv. The honest result is “not operational through this lane yet”.

The server's network arm is equally important for credentials. A token restricted to a child that may call any host is not much of a restriction. In v0.111.0, choose `deny` for servers that can stay local. For a networked server, review the child as broadly network-capable because the host-granular MCP proxy is not enforced yet. The connect note says so. Hidden openness is worse than explicit openness.

## The trace is the receipt, not the guard

Every successful MCP task lands in the same hash-chained run journal as model calls and builtins. The trace records the task, tool, timing, outcome and the values the run retains. `nika trace verify` checks the chain. `nika trace replay` renders the recorded events without contacting the server again. `nika trace flow` shows which recorded output fed which downstream task.

This is evidence after the effect. It does not replace the gates before it. A perfect log of an over-broad call is still a perfect log of an over-broad call. The safe order is:

1. Configure one server identity in the project.
2. Deny network by default; if the child needs it, review the current grant as broad.
3. Approve and pin the server's published tool schemas.
4. Declare exact workflow tool and environment permits.
5. Narrow an agent loop again with its own tool list.
6. Run `nika check` before the server starts.
7. Keep and verify the trace after it returns.

There are two MCP directions in Nika, and they should not be confused. A Nika workflow can act as an MCP **client** through `mcp:<server>/<tool>`, which is the authority-heavy path described here. The `nika mcp` command also makes Nika an MCP **server** for editors and agents. That in-binary server exposes the checker, schema, examples and catalog as a read-only oracle. It intentionally exposes no run tool.

The split is the larger lesson. A surface that helps an agent understand a plan does not need the authority to execute it. A surface that executes foreign tools needs more than a connection dialog. MCP provides the wire. The file, the project registry, the pin and the trace provide the operating contract around it.

Continue with [The MCP server you didn't have to build](/blog/the-mcp-server-you-didnt-build), inspect the live [MCP catalog](/catalog/mcp), or read [The blast radius is part of the file](/blog/blast-radius-in-the-file).
