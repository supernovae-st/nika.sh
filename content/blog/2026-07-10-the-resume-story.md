---
slug: the-resume-story
title: "The resume story"
tag: Engine
date: 2026-07-10
description: "kill -9 a run mid-flight, then resume it: finished work never runs twice. Durability as a file property, shown from the real journal."
series: trace-family
series_stop: resume
---

Every long pipeline eventually meets a hard death. The laptop lid closes, the CI runner is reaped, someone trips over `Ctrl-C` twice. The question that decides whether that hurts is not *did it crash*. Everything crashes. It is **what happens to the work that already finished?**

In a glue script, the answer is: it re-runs. The API calls you already paid for fire again, the files you already wrote get written again, and if any step is not perfectly idempotent you now have a second problem. In a chat agent, the answer is worse: the plan lived in a context window, and the context window is gone.

Here is a workflow with real work in it: checksum the day's notes, count them, pack a 300 MB asset archive, write a manifest.

```yaml nightly-archive.nika.yaml
nika: v1
workflow: nightly-archive
description: "Hash, count and pack the day's notes into one manifest"

permits:
  fs:
    read: ["./notes/*", "./assets.bin"]
    write: ["./assets.bin.gz"]
  exec: ["shasum", "wc", "gzip", "echo"]

tasks:
  # No deps between these two → the engine runs them in parallel.
  - id: hash_notes
    exec:
      command: ["shasum", "-a", "256", "notes/monday.md", "notes/tuesday.md", "notes/wednesday.md"]

  - id: count_notes
    exec:
      command: ["wc", "-w", "notes/monday.md", "notes/tuesday.md", "notes/wednesday.md"]

  # Pack only once the notes are verified — the checksums gate the archive.
  - id: pack_assets
    depends_on: [hash_notes, count_notes]
    exec:
      command: ["gzip", "-kf9", "assets.bin"]

  - id: manifest
    depends_on: [pack_assets]
    exec:
      command: ["echo", "archive ok"]

outputs:
  checksums: "${{ tasks.hash_notes.output }}"
  words: "${{ tasks.count_notes.output }}"
```

Run it. Five seconds in, while `gzip` is grinding through the archive, kill it the rude way. Not `Ctrl-C`, not a graceful shutdown hook: `SIGKILL`, the signal a process never gets to handle.

```text
❯ nika run nightly-archive.nika.yaml &
❯ sleep 5 && kill -9 $!

  🦋 nika · nightly-archive · 4 tasks
     permits ✓ declared boundary · default-deny

  ✔  hash_notes   exec · shasum  27ms
  ✔  count_notes  exec · wc  3ms ∥
```

That is the whole console. The two checksums finished in milliseconds; the pack was mid-flight when the process died. No cleanup ran, no state was saved on the way down: the engine never saw the signal coming.

But the run was never keeping its state in memory. Every run writes a **journal** as it goes: an append-only NDJSON file in `.nika/traces/` beside your workflow, one typed event per line. Read the journal the crash left behind:

```text
❯ grep -o '"kind":"[a-z_]*"' .nika/traces/2026-07-10T10-41-21Z-0672.ndjson | sort | uniq -c
   1 workflow_started
   4 task_scheduled
   2 task_started
   2 task_completed
```

Two `task_completed` events survived the kill, because they were written the moment the work settled, not at the end of the run, not on shutdown. The journal does not need the process to die politely.

Now the whole point:

```text
❯ nika run nightly-archive.nika.yaml --resume .nika/traces/2026-07-10T10-41-21Z-0672.ndjson

  🦋 nika · nightly-archive · 4 tasks
     permits ✓ declared boundary · default-deny

  ↷  hash_notes   cache hit (resume)
  ↷  count_notes  cache hit (resume)
  ✔  pack_assets  exec · gzip  13.2s
  ✔  manifest     exec · echo  8ms
  ── 4/4 done · $0.00 · elapsed 13.2s ────────────────────────────

  resumed · 2 skipped (cache hit) · 2 ran live
```

`↷` is the engine's glyph for *not doing*. The two tasks whose completion the journal recorded skip visibly, by name, as `cache hit (resume)`, and only the interrupted pack and everything downstream of it run. **Finished work never runs twice.** Had `hash_notes` been an LLM call, those are tokens you do not pay for a second time; had it written a file, that file is not touched again.

The skip is not a guess, and this is the part worth being precise about. A task is skipped only when its **identity** matches a journaled success. Its identity is the task as written: the command, the resolved inputs, the shape of the thing you can read in the file. Edit the task and the match breaks. Change one flag, `shasum -a 256` to `shasum -a 512`, and resume again:

```text
  ✔  hash_notes   exec · shasum  67ms
  ↷  count_notes  cache hit (resume)

  resumed · 1 skipped (cache hit) · 3 ran live
```

The edited task re-runs; its untouched sibling still skips. You cannot accidentally resume yourself into stale results from a plan you have since changed. And a trace with no resumable successes in it is a notice, never an error: the run simply happens live.

Notice what is *absent* from this story: a workflow cluster. A database. A coordinator service that has to stay up so your work can survive. Durable execution is usually sold as infrastructure: stand up a server, keep it healthy, and it will remember your workflows for you. Here, durability is a property of two files sitting in your repo: the plan and the journal. `kill -9` the engine, lose the machine, come back tomorrow on a different one. The pair still knows exactly what is done and what is not.

The same journal is the [flight recorder you can replay](/blog/the-trace-you-can-replay) and the substrate the [time-travel debugger](/blog/time-travel-for-real) steps through. One artifact, three jobs: evidence, replay, resume. Chats evaporate; files compound. It turns out the *crash recovery* compounds too.
