---
slug: time-travel-for-real
title: "Time travel, for real"
tag: Engine
date: 2026-07-06
description: "Every debugger replays the past by re-running it. Nika's past is a file — so stepping backward is free, breakpoints live in your YAML, and F5 debugs a run that already happened."
---

Every debugger you have ever used replays the past by **re-running it**. Set a breakpoint, restart the program, hope the bug happens again. If the program spends money, calls an API, or asks a model for tokens — every debugging session spends again, and a flaky failure may never reproduce at all.

Nika's past is not a re-run. It is a **file**.

Every run writes a journal — an append-only record of every task start, settle, output and cost, in `.nika/traces/` beside your workflow. The journal was already the substrate for resume (a paused run continues from it), for replay (the canvas scrubs it), for diffing two runs. As of `nika 0.96.0` it is also the substrate for a **debugger**.

**`nika dap` — the engine is its own debug adapter.** In VS Code (or Cursor, or Windsurf), open a `.nika.yaml` that has a recorded run, set a breakpoint on a task line, press **F5**. The engine speaks the Debug Adapter Protocol over stdio — no extension middleware, no adapter process to install. The debugger attaches to the *recorded run*: `continue` runs to your next breakpointed task, the Variables pane shows each task's **recorded output**, the call stack names the task and its workflow.

And the button most debuggers cannot honestly offer: **step backward**. It is not a trick — stepping back through a re-running debugger means re-executing everything before that point, which is why so few debuggers dare. Stepping back through a journal is just reading the previous line. Replay never re-executes, so time travel is free — no side effects fire twice, no tokens are spent, and the run you debug is exactly the run that happened, deterministically, every time.

The honesty law that makes this work is the same one behind the whole flight recorder: **replay re-renders, never re-executes**. A debugging session on a production incident's journal is a read-only walk through recorded facts.

The same journal has one more exit: **one action exports it to OpenTelemetry** — a local OTLP/JSON file, no collector, no vendor. Drag it into Jaeger and the run appears as a trace: one root span for the workflow, one child span per task, correctly parented, with the run's identity riding standard `gen_ai.*` attributes. Your existing observability stack becomes a nika viewer without a single agent installed.

We proved the whole wire on the shipping binary before writing this post — the raw DAP protocol against `nika 0.96.0`: initialize advertises `supportsStepBack`, breakpoints verify against the YAML, `continue` stops on the breakpointed task, `stepBack` walks home, the session exits clean. The journal your runs already write was the debugger's substrate all along; 0.96.0 just gave it the F5.
