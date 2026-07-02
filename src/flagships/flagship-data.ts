/* ─── the flagship corpus · THE files the whole home page tells ───────────────
   V5 law #1: ONE story, ONE file — the SELECTED one. The hero tabs offer the
   flagships below; the selected file drives EVERYTHING downstream (the run
   replay · the plan · the boundary beat). Nothing else on the page shows a
   different workflow except the use-case gallery (explicitly a gallery).

   HONESTY CONTRACT (non-negotiable):
   · every `yaml` here is BYTE-IDENTICAL to the file that actually ran in the
     trace lab (`nika run <file> --json`) — one body per filename, forever.
   · every trace under ./traces/ is the VERBATIM NDJSON the engine streamed
     during that run — a real local model (ollama/llama3.2:3b), real files
     written, real durations. Nothing staged, nothing simulated.
   · schema-truth + trace↔file coherence are enforced by src/test tests
     (ajv against public/schema/workflow.json · derived plan == yaml-lib
     parse · every trace task exists in the file with the same verb).

   Data-only module (react-refresh: components-only files must not export
   data — the faq-data / hero-files pattern). */

import dailyBriefTrace from './traces/daily-brief.ndjson?raw'
import prRiskReviewTrace from './traces/pr-risk-review.ndjson?raw'
import meetingActionsTrace from './traces/meeting-actions.ndjson?raw'

export interface Flagship {
  id: string
  filename: string
  /** the short tab label (the basename — the extension renders separately) */
  label: string
  /** the tab's one-line story (what the highlighted lines demonstrate) */
  gloss: string
  /** inclusive 1-based line range the hero editor emphasizes */
  highlight: [number, number]
  /** what the run produced (the verdict card's artifact line) */
  artifact: string
  /** the raw NDJSON the engine streamed for THIS file (verbatim) */
  traceNdjson: string
  yaml: string
}

export const FLAGSHIPS: Flagship[] = [
  {
    id: 'daily_brief',
    filename: 'daily-brief.nika.yaml',
    label: 'daily-brief',
    /* consumer-first: « blast radius » is earned 3 beats later by TheBoundary —
       the default tab must not open on unexplained jargon (P2-13a) */
    gloss: 'permits: the file says what it may touch',
    highlight: [5, 7],
    artifact: 'wrote brief.md',
    traceNdjson: dailyBriefTrace,
    yaml: `nika: v1
workflow: daily-brief
model: ollama/llama3.2:3b     # local · your notes never leave

permits:                      # the file IS the blast radius
  fs: { read: [ ./notes/* ], write: [ ./brief.md ] }
  tools: [ "nika:read", "nika:write" ]

tasks:
  - { id: notes,    invoke: { tool: "nika:read", args: { path: ./notes/today.md } } }
  - { id: inbox,    invoke: { tool: "nika:read", args: { path: ./notes/inbox.md } } }
  - { id: calendar, invoke: { tool: "nika:read", args: { path: ./notes/calendar.md } } }

  - id: triage
    depends_on: [inbox]
    infer: { prompt: "Flag what is urgent: \${{ tasks.inbox.output }}", max_tokens: 300 }
  - id: agenda
    depends_on: [calendar]
    infer: { prompt: "Plan the day around: \${{ tasks.calendar.output }}", max_tokens: 300 }

  - id: draft
    depends_on: [notes, triage, agenda]
    infer:
      prompt: "Write the morning brief. Notes: \${{ tasks.notes.output }} Urgent: \${{ tasks.triage.output }} Plan: \${{ tasks.agenda.output }}"
      max_tokens: 500

  - id: save
    depends_on: [draft]
    invoke:
      tool: "nika:write"
      args: { path: ./brief.md, content: "\${{ tasks.draft.output }}" }

outputs:
  brief: "\${{ tasks.draft.output }}"
`,
  },
  {
    id: 'pr_risk_review',
    filename: 'pr-risk-review.nika.yaml',
    label: 'pr-risk-review',
    gloss: 'when: the probe only fires on real risk',
    highlight: [23, 30],
    artifact: 'wrote review.md',
    traceNdjson: prRiskReviewTrace,
    yaml: `nika: v1
workflow: pr-risk-review
model: ollama/llama3.2:3b     # local · the diff never leaves

permits:                      # the file IS the blast radius
  exec: [ git ]
  fs: { write: [ ./review.md ] }
  tools: [ "nika:read", "nika:write" ]

tasks:
  - id: diff
    exec: { command: [ git, diff, main ] }

  - id: risk
    depends_on: [diff]
    timeout: "120s"
    infer:
      prompt: "Score this diff's blast radius from 0 to 10: \${{ tasks.diff.output }}"
      schema:
        type: object
        required: [score, reasons]
        properties:
          score: { type: number }
          reasons: { type: array, items: { type: string } }
      max_tokens: 400

  - id: probe
    depends_on: [risk]
    when: \${{ tasks.risk.output.score >= 7 }}
    agent:
      prompt: "Trace the risky call paths behind: \${{ tasks.risk.output.reasons }}"
      tools: [ "nika:read" ]
      max_turns: 3

  - id: report
    depends_on: [risk]
    invoke:
      tool: "nika:write"
      args: { path: ./review.md, content: "\${{ tasks.risk.output }}" }

outputs:
  review: "\${{ tasks.risk.output }}"
`,
  },
  {
    id: 'meeting_actions',
    filename: 'meeting-actions.nika.yaml',
    label: 'meeting-actions',
    gloss: 'schema: the output is a contract, not prose',
    highlight: [17, 28],
    artifact: 'wrote action-items.json',
    traceNdjson: meetingActionsTrace,
    yaml: `nika: v1
workflow: meeting-actions
model: ollama/llama3.2:3b     # local · the recording stays yours

permits:                      # the file IS the blast radius
  fs: { read: [ ./transcript.txt ], write: [ ./action-items.json ] }
  tools: [ "nika:read", "nika:write" ]

tasks:
  - id: transcript
    invoke: { tool: "nika:read", args: { path: ./transcript.txt } }

  - id: extract
    depends_on: [transcript]
    infer:
      prompt: "Extract every action item with its owner: \${{ tasks.transcript.output }}"
      schema:
        type: object
        required: [actions]
        properties:
          actions:
            type: array
            items:
              type: object
              required: [owner, task]
              properties:
                owner: { type: string }
                task: { type: string }
      max_tokens: 400

  - id: save
    depends_on: [extract]
    invoke:
      tool: "nika:write"
      args: { path: ./action-items.json, content: "\${{ tasks.extract.output }}" }

outputs:
  actions: "\${{ tasks.extract.output }}"
`,
  },
]
