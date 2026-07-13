---
slug: the-secrets-line
title: "The secrets line"
tag: Security
date: 2026-07-05
description: "Information-flow, audited before it flows: how the checker proves a secret cannot leak into a prompt, a file, or a host."
---

Every leaked credential has the same timeline: the key ends up in a log, a prompt, or a third-party host, and the grep that finds it runs after it is already there. The standard tooling answer is a scanner that hunts for strings shaped like keys, post hoc, best effort.

Nika asks the question before the run exists. The third verdict `nika check` prints, right under the cost line, is the secrets line:

```text
 ✔ SECRETS  no information-flow escapes
```

For that line to be provable, a secret has to be something the language can see:

```yaml billing-brief.nika.yaml
nika: v1
workflow:
  id: billing-brief
model: ollama/llama3.2:3b

# a secret is a reference to a store, never a value
secrets:
  stripe_key:
    source: env
    key: STRIPE_KEY
    # the complete flow policy: where this key may go
    egress:
      - to: "nika:fetch"
        host: "api.stripe.com"
      # the response stays tainted until its sink is sanctioned
      - to: "infer"

permits:
  net: { http: [ "api.stripe.com" ] }
  tools: [ "nika:fetch" ]

tasks:
  charges:
    invoke:
      tool: "nika:fetch"
      args:
        url: "https://api.stripe.com/v1/charges?limit=20"
        headers:
          Authorization: "Bearer ${{ secrets.stripe_key }}"

  brief:
    depends_on: [ charges ]
    infer:
      prompt: "One short paragraph: what moved in these charges? ${{ tasks.charges.output }}"
      max_tokens: 300

outputs:
  brief: ${{ tasks.brief.output }}
```

The `secrets:` block is not a place to hide strings. A literal value there is a parse error; the reference is the point. And `egress` is the key's complete flow policy: `stripe_key` may ride one tool to one host, and the model may see what comes back. Write it anywhere else, a prompt, a shell argv, a file write, an agent brief, and the audit refuses the workflow with one grammar: `leak into infer`, `leak into exec`, `leak into invoke`, `leak into agent`, each naming its task and its secret. Exit code 2; nothing ran.

Three details make the line proof rather than pattern-matching:

**The audit follows the data, not the variable.** Delete the `- to: "infer"` sanction from the file above and the checker does not just refuse, it prints the path the secret would have walked:

```text
 ✖ SECRETS  leak into infer (task `brief`) — secrets.stripe_key → tasks.charges.output
```

The key was only ever typed in the fetch header, but the response of a call that carried a secret is tainted until its destination is sanctioned too. Laundering it through a capture, a downstream task, or a workflow `outputs:` does not wash it; the arrow in the verdict is the taint trace.

**Declassification only narrows.** The sanction is per-sink and per-host: same key against a different host refuses, same key in a different tool refuses. And `egress` can never widen the boundary. Sanction a host that `permits.net.http` does not list and both lines go red at once, the secrets line and the permits line, each printing its own fix.

**The audit never holds the key.** `source: env` resolves at run time, so `nika check` passes with the variable unset: a reviewer can audit the flow policy without possessing the secret. And once the run does hold it, the value never surfaces: not in the task lines, not in the `--json` events, not in the trace a `--resume` replays. We probed with a marker token and grepped every surface: zero occurrences.

The [cost line](/blog/the-cost-line) bounded the spend before the meter started. The secrets line does the same for information: where a key may go is written in the file, reviewable in the diff, and proven before a single byte moves. The postmortem grep becomes a pre-flight verdict.
