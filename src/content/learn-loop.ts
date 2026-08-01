import type { TermLine } from '../components/TermFrame'

/* ─── the teaching loop · try → new → check → run → trace (G-6) ──────────────
   /learn taught the FILE (nine steps, line by line) and never the LOOP: the
   five doors V5 collapsed the grammar into. This is that missing chapter.

   Every transcript below was captured from a real sandbox on 2026-08-02 at
   v0.107.0 — one arc, one directory, in order: `nika try 01-hello` (offline
   rehearsal), `nika new 01-hello hello.nika.yaml` (it becomes yours), `nika
   check` (the audit BEFORE a token is spent), `nika run` (the live seat,
   ollama/qwen3.5:4b answering « Bonjour ! »), `nika trace show` (the flight
   recorder reading itself back). Nothing here is illustrative: the cost
   warning is the real unbounded verdict a local seat earns, and the 14.0s is
   what that machine took.

   The honesty law: these bytes are re-captured at every release (the
   TermCapture stamp reads ENGINE_VERSION), and cli-grammar.test.ts refuses
   any command here the pinned binary would not answer. */

export type LoopDoor = {
  n: string
  verb: string
  /** the one-line promise, in anyone-words */
  title: string
  /** what this door is FOR — why the loop has it at all */
  plain: string
  command: string
  lines: TermLine[]
  /** the sentence the transcript proves */
  proves: string
}

export const LOOP_DOORS: LoopDoor[] = [
  {
    n: '01',
    verb: 'try',
    title: 'See it work before you own anything',
    plain:
      'The showroom. A canonical workflow runs offline against a mock model · no keys, no flags, nothing written to your disk. Bare, with no slug, it lists the shelf: thirteen teaching steps and twenty-six real jobs.',
    command: 'nika try 01-hello',
    lines: [
      { kind: 'cmd', text: 'nika try 01-hello' },
      { kind: 'out', text: '  🦋 nika · hello · 1 task' },
      { kind: 'dim', text: '     permits ✓ declared boundary · default-deny' },
      { kind: 'ok', text: '  ✔  greet  infer · mock/echo  1ms' },
      { kind: 'dim', text: '  ── 1/1 done · ≥ $0.00 (1 unpriced) · elapsed 0.0s ──────────────' },
      { kind: 'out', text: '    said "mock(echo) · Say hello in French, in one sh…"' },
      { kind: 'soft', text: '    rehearsal · a mock model echoed the prompt — not a real answer' },
    ],
    proves:
      'The rehearsal says it is a rehearsal. A mock model echoing your prompt is never dressed up as an answer.',
  },
  {
    n: '02',
    verb: 'new',
    title: 'One door to create',
    plain:
      'Describe the job in plain words and it routes; name a slug or a skeleton and it lands verbatim, ingredients included. Asking it with a lone question mark lists the skeletons the pack ships.',
    command: 'nika new 01-hello hello.nika.yaml',
    lines: [
      { kind: 'cmd', text: 'nika new 01-hello hello.nika.yaml' },
      { kind: 'out', text: 'hello.nika.yaml ← example `01-hello` · yours now — `nika check hello.nika.yaml` then `nika run hello.nika.yaml`' },
    ],
    proves: 'The door that creates the file also names the next two doors. The loop teaches itself.',
  },
  {
    n: '03',
    verb: 'check',
    title: 'The audit runs before a token is spent',
    plain:
      'Twelve verdicts over the file as written: the cost ceiling, where secrets can flow, the types, the tools, the permits boundary. Every finding teaches its own fix.',
    command: 'nika check hello.nika.yaml',
    lines: [
      { kind: 'cmd', text: 'nika check hello.nika.yaml' },
      {
        kind: 'warn',
        text: ' ⚠  COST     bounded portion $0.0000 no total ceiling · 1 unpriced task · prompts, exec + mcp unpriced · prices 2026-07-28',
      },
      { kind: 'dim', text: '   greet  ollama/qwen3.5:4b  UNBOUNDED — no catalog price (local/unknown model)' },
      { kind: 'soft', text: ' ○ ENERGY   unpriced — no sourced Wh figure for any task model · a local model draws your watts · never 0 Wh' },
      { kind: 'ok', text: ' ✔ SECRETS  no declared secret reaches an effect · model echo untracked' },
      { kind: 'ok', text: ' ✔ TYPES    deep references fit the shapes tasks declare' },
      { kind: 'ok', text: ' ✔ PERMITS  literal + const: args fit the boundary' },
      { kind: 'ok', text: ' ✔ TRIFECTA no lethal trifecta over the declared permits: without a human gate' },
      {
        kind: 'ok',
        text: ' ✔ JOURNEY internal · 0 sources · 0 destinations · 1 model endpoint · no secret reaches a cloud destination',
      },
      {
        kind: 'warn',
        text: ' ⚠ audited · 1 task · 1 wave · permits declared · est unbounded · 1 unpriced task · 0 hints · risk unbounded',
      },
    ],
    proves:
      'A local model is unpriced, not free · it draws your watts, and the audit refuses to print a comfortable zero.',
  },
  {
    n: '04',
    verb: 'run',
    title: 'The same audit runs first, then the work',
    plain:
      'A run is not a second, looser path: the audit runs again inside it. Then the real seat answers, the ceiling is enforced while it does, and a trace lands on disk.',
    command: 'nika run hello.nika.yaml',
    lines: [
      { kind: 'cmd', text: 'nika run hello.nika.yaml' },
      { kind: 'out', text: '  🦋 nika · hello · 1 task' },
      { kind: 'dim', text: '     permits ✓ declared boundary · default-deny' },
      { kind: 'dim', text: 'still running · greet · 10s · ollama/qwen3.5:4b' },
      { kind: 'ok', text: '  ✔  greet  infer · ollama/qwen3.5:4b  14.0s' },
      { kind: 'dim', text: '  ── 1/1 done · ≥ $0.00 (1 unpriced) · elapsed 14.0s ─────────────' },
      { kind: 'out', text: '    said "Bonjour !"' },
      {
        kind: 'soft',
        text: '    trace: .nika/traces/2026-08-01T23-15-06Z-de62.ndjson · 5 events · chain 0f8618ad1d3f…',
      },
    ],
    proves:
      'The run hands back the trace path and its hash chain unasked. Evidence is the default, not a flag.',
  },
  {
    n: '05',
    verb: 'trace',
    title: 'The run explains itself, afterwards',
    plain:
      'The flight recorder. Show prints the final card, outputs browses what each task returned, peek opens one whole, flow draws which output fed which task, and replay re-renders a run without ever re-executing it.',
    command: 'nika trace show',
    lines: [
      { kind: 'cmd', text: 'nika trace show' },
      { kind: 'dim', text: 'nika trace: reading .nika/traces/2026-08-01T23-15-06Z-de62.ndjson (the workspace latest)' },
      { kind: 'out', text: '  ╭─ nika ✓ hello ───────────────────────────────────────────╮' },
      { kind: 'out', text: '  │  ◆    1 task · 1 wave · 0 retries                        │' },
      { kind: 'out', text: '  │  14.0s · 163 tok · ≥ $0.00 (1 unpriced) · ollama/qwen3…  │' },
      { kind: 'out', text: '  │  said "Bonjour !"                                        │' },
      { kind: 'out', text: '  ╰──────────────────────────────────────────────────────────╯' },
    ],
    proves:
      'Replay re-renders, it never re-executes. What you read afterwards is what happened, not a fresh guess at it.',
  },
]
