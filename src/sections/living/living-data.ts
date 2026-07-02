import { type ShowcaseDag } from '../usecases-yaml.generated'

/* the Living File data · the flagship daily-brief (react-refresh:
   components-only files must not export data — the DAG + YAML live here). */

/* the fil-rouge · a DAILY BRIEF everyone gets. FOUR sources gathered AT ONCE,
   each read by a LOCAL model in parallel, THEN a sequential chain writes ·
   critiques · polishes · saves. Two parallel waves of 4 + a 4-step pipeline —
   parallel AND « à la suite ». Relatable + the control story (local model ·
   scoped net · the write stays within permits · your data never leaves). */
export const DAG: ShowcaseDag = {
  waves: 6,
  outputs: ['brief'],
  tasks: [
    // wave 0 · GATHER everything at once (4 parallel)
    { id: 'inbox', verb: 'invoke', deps: [], wave: 0, gate: 'default', gloss: 'read your email', flags: [], line0: 11, line1: 11 },
    { id: 'calendar', verb: 'invoke', deps: [], wave: 0, gate: 'default', gloss: "today's events", flags: [], line0: 12, line1: 12 },
    { id: 'news', verb: 'invoke', deps: [], wave: 0, gate: 'default', gloss: 'top headlines', flags: [], line0: 13, line1: 13 },
    { id: 'signals', verb: 'invoke', deps: [], wave: 0, gate: 'default', gloss: 'PRs & mentions', flags: [], line0: 14, line1: 14 },
    // wave 1 · the model READS each, in parallel (4 parallel)
    { id: 'triage', verb: 'infer', deps: ['inbox'], wave: 1, gate: 'default', gloss: 'flag what’s urgent', flags: [], line0: 16, line1: 16 },
    { id: 'agenda', verb: 'infer', deps: ['calendar'], wave: 1, gate: 'default', gloss: 'plan the day', flags: [], line0: 17, line1: 17 },
    { id: 'digest', verb: 'infer', deps: ['news'], wave: 1, gate: 'default', gloss: 'summarise', flags: [], line0: 18, line1: 18 },
    { id: 'highlights', verb: 'infer', deps: ['signals'], wave: 1, gate: 'default', gloss: 'what needs you', flags: [], line0: 19, line1: 19 },
    // waves 2-5 · the SEQUENTIAL chain (draft → review → polish → save)
    { id: 'draft', verb: 'infer', deps: ['triage', 'agenda', 'digest', 'highlights'], wave: 2, gate: 'default', gloss: 'write the brief', flags: ['typed output'], line0: 21, line1: 21 },
    { id: 'review', verb: 'infer', deps: ['draft'], wave: 3, gate: 'default', gloss: 'critique it', flags: [], line0: 22, line1: 22 },
    { id: 'polish', verb: 'infer', deps: ['review'], wave: 4, gate: 'default', gloss: 'apply the edits', flags: [], line0: 23, line1: 23 },
    { id: 'save', verb: 'invoke', deps: ['polish'], wave: 5, gate: 'default', gloss: 'save brief.md', flags: [], line0: 24, line1: 28 },
  ],
}
export const FILENAME = 'daily-brief.nika.yaml'

/* ── the ENFORCE beat data · shared by BOTH renderings (desktop choreography +
   the mobile vertical flow). The runtime checks every effect against the
   declared `permits:`; an out-of-bounds WRITE on the terminal `save` node is
   DENIED with `NIKA-SEC-004` (effect outside the permits capability boundary).
   Real catalog row (public/errors/catalog.json). */
export const DENY_NODE = 'save'
export const SEC_004 = {
  code: 'NIKA-SEC-004',
  category: 'security_error',
  transient: false,
  message: 'effect outside the declared permits: capability boundary (fs/net/exec/tool)',
} as const
/* the REAL .nika file the editor renders (the CodeFile tokenises + colours it).
   Schema-TRUE against public/schema/workflow.json (depends_on · object verbs ·
   namespaced invoke.tool · array permits) — enforced by
   src/test/onpage-yaml.test.ts, which also pins each DAG task's line0/line1
   to the exact line its `id:` sits on (the choreography's line map).
   Flow-style tasks keep one task per line so each block maps to one DAG node. */
export const YAML = `nika: v1
workflow: daily-brief
model: ollama/llama3.1        # local · your data never leaves

permits:                      # the file IS the blast radius
  net: { http: [ mail.google.com, calendar.google.com, news.ycombinator.com, api.github.com ] }
  fs: { write: [ ./brief.md ] }
  tools: [ "mcp:gmail/*", "mcp:gcal/*", "mcp:news/*", "mcp:github/*", "nika:write" ]

tasks:
  - { id: inbox,      invoke: { tool: "mcp:gmail/unread" } }
  - { id: calendar,   invoke: { tool: "mcp:gcal/today" } }
  - { id: news,       invoke: { tool: "mcp:news/top" } }
  - { id: signals,    invoke: { tool: "mcp:github/notifications" } }

  - { id: triage,     depends_on: [inbox],    infer: { prompt: "flag what's urgent" } }
  - { id: agenda,     depends_on: [calendar], infer: { prompt: "plan the day" } }
  - { id: digest,     depends_on: [news],     infer: { prompt: "summarise" } }
  - { id: highlights, depends_on: [signals],  infer: { prompt: "what needs you" } }

  - { id: draft,      depends_on: [triage, agenda, digest, highlights], infer: { prompt: "write the brief" } }
  - { id: review,     depends_on: [draft],    infer: { prompt: "critique it" } }
  - { id: polish,     depends_on: [review],   infer: { prompt: "apply the edits" } }
  - id: save
    depends_on: [polish]
    invoke:
      tool: "nika:write"
      args: { path: ./brief.md, content: "\${{ tasks.polish.output }}" }

outputs:
  brief: "\${{ tasks.polish.output }}"
`
