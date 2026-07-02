/* the hero editor files · data module (react-refresh: components-only files
   must not export data — the shared arrays live here, faq-data pattern). */

/* ── the hero editor files · the sharp file-tab strip ─────────────────────────
   Three examples, switchable in the header. Tab 0 (daily-brief) is a COMPACT
   slice of the Living File's own file — same filename · same header lines ·
   same task ids — so the scroll into the run below reads as ONE object (the
   run-model is keyed to daily-brief; keeping it the default preserves the
   file→DAG continuity). ALL THREE are schema-true against
   public/schema/workflow.json (depends_on · object verbs · namespaced
   invoke.tool · array permits) — enforced by src/test/onpage-yaml.test.ts.
   Tabs 1-2 show the signature beats: the when:-gated agent probe and the
   typed-output contract. */
export type HeroFile = {
  id: string
  filename: string
  /** the short tab label (the basename — the full filename lives in the
      editor's window chrome right below; three full names don't fit the strip) */
  label: string
  yaml: string
  highlight: [number, number]
  /** what the highlighted lines demonstrate (the tab's one-line story) */
  gloss: string
}

export const HERO_FILES: HeroFile[] = [
  {
    id: 'daily_brief',
    filename: 'daily-brief.nika.yaml',
    label: 'daily-brief',
    gloss: 'permits: · the file IS the blast radius',
    highlight: [5, 8],
    yaml: `nika: v1
workflow: daily-brief
model: ollama/llama3.1        # local · your data never leaves

permits:                      # the file IS the blast radius
  net: { http: [ mail.google.com, calendar.google.com ] }
  fs: { write: [ ./brief.md ] }
  tools: [ "mcp:gmail/*", "mcp:gcal/*", "nika:write" ]

tasks:
  - { id: inbox,    invoke: { tool: "mcp:gmail/unread" } }
  - { id: calendar, invoke: { tool: "mcp:gcal/today" } }
  - { id: triage,   depends_on: [inbox], infer: { prompt: "flag what's urgent" } }
  - { id: draft,    depends_on: [triage, calendar], infer: { prompt: "write the brief" } }
  - id: save
    depends_on: [draft]
    invoke:
      tool: "nika:write"
      args: { path: ./brief.md, content: "\${{ tasks.draft.output }}" }
`,
  },
  {
    id: 'pr_risk_review',
    filename: 'pr-risk-review.nika.yaml',
    label: 'pr-risk-review',
    gloss: 'when: · the agent probe only fires on real risk',
    highlight: [16, 19],
    yaml: `nika: v1
workflow: pr-risk-review
model: ollama/llama3.1        # local · the diff never leaves

permits:                      # the file IS the blast radius
  exec: [ gh ]
  fs: { write: [ ./review.md ] }
  tools: [ "nika:read", "nika:write" ]

tasks:
  - id: diff
    exec: { command: "gh pr diff 482" }
  - id: risk
    depends_on: [diff]
    infer: { prompt: "Score the blast radius · \${{ tasks.diff.output }}" }
  - id: probe
    depends_on: [risk]
    when: \${{ tasks.risk.output.score >= 7 }}
    agent: { prompt: "Trace the risky call paths", tools: [ "nika:read" ] }
  - id: report
    depends_on: [risk, probe]
    invoke:
      tool: "nika:write"
      args: { path: ./review.md, content: "\${{ tasks.risk.output }}" }
`,
  },
  {
    id: 'meeting_actions',
    filename: 'meeting-actions.nika.yaml',
    label: 'meeting-actions',
    gloss: 'schema: · the output is a contract, not prose',
    highlight: [17, 18],
    yaml: `nika: v1
workflow: meeting-actions
model: ollama/llama3.1        # local · the recording stays yours

permits:                      # the file IS the blast radius
  fs: { read: [ ./transcript.txt ], write: [ ./action-items.json ] }
  tools: [ "nika:read", "nika:write" ]

tasks:
  - id: transcript
    invoke:
      tool: "nika:read"
      args: { path: ./transcript.txt }
  - id: extract
    depends_on: [transcript]
    infer:
      prompt: "Every action item · \${{ tasks.transcript.output }}"
      schema: { type: object, required: [actions] }
  - id: save
    depends_on: [extract]
    invoke:
      tool: "nika:write"
      args:
        path: ./action-items.json
        content: "\${{ tasks.extract.output.actions }}"
`,
  },
]
