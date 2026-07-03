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
import priceWatchTrace from './traces/price-watch.ndjson?raw'
import socialRepurposeTrace from './traces/social-repurpose.ndjson?raw'
import standupDigestTrace from './traces/standup-digest.ndjson?raw'
import etlQuarantineTrace from './traces/etl-quarantine.ndjson?raw'

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
    /* the lit band is the caption's EVIDENCE, nothing more: the probe task's
       head + its when: gate (the schema block above is a different story). */
    highlight: [27, 29],
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
  {
    id: 'price_watch',
    filename: 'price-watch.nika.yaml',
    label: 'price-watch',
    /* the zero-model tab: not every workflow needs an LLM · the DAG, two
       builtins and one CEL compare do the whole job deterministically. */
    gloss: 'when: zero model · plain data opens the gate',
    highlight: [22, 24],
    artifact: 'wrote price-alert.md',
    traceNdjson: priceWatchTrace,
    yaml: `nika: v1
workflow: price-watch

# zero model · two tools and one CEL compare do the whole job
permits:                      # the file IS the blast radius
  fs: { read: [ ./price.json ], write: [ ./price-alert.md ] }
  tools: [ "nika:read", "nika:jq", "nika:write" ]

vars:
  alert_below: 899            # your threshold · plain data

tasks:
  - id: snapshot
    invoke: { tool: "nika:read", args: { path: ./price.json } }

  - id: price
    depends_on: [snapshot]
    invoke:
      tool: "nika:jq"
      args: { input: "\${{ tasks.snapshot.output }}", expression: "fromjson | .price" }

  - id: alert
    depends_on: [price]
    when: \${{ tasks.price.output < vars.alert_below }}
    invoke:
      tool: "nika:write"
      args:
        path: ./price-alert.md
        content: "Price drop: now \${{ tasks.price.output }} (target \${{ vars.alert_below }})"

outputs:
  price: "\${{ tasks.price.output }}"
`,
  },
  {
    id: 'social_repurpose',
    filename: 'social-repurpose.nika.yaml',
    label: 'social-repurpose',
    /* the parallelism tab: one read fans out into three rewrites (no deps
       between them → the engine runs them concurrently) and one merge. */
    gloss: 'depends_on: three parallel rewrites, one merge',
    /* the lit band = the caption's evidence: the bundle head + the fan-in
       depends_on line that literally lists the three parallel rewrites. */
    highlight: [26, 27],
    artifact: 'wrote social-bundle.md',
    traceNdjson: socialRepurposeTrace,
    yaml: `nika: v1
workflow: social-repurpose
model: ollama/llama3.2:3b     # local · your draft never leaves

permits:                      # the file IS the blast radius
  fs: { read: [ ./post.md ], write: [ ./social-bundle.md ] }
  tools: [ "nika:read", "nika:write" ]

tasks:
  # one read · three parallel rewrites · one merge
  - id: post
    invoke: { tool: "nika:read", args: { path: ./post.md } }

  - id: thread
    depends_on: [post]
    infer: { prompt: "Turn this post into a 6-tweet thread, keep the voice: \${{ tasks.post.output }}", max_tokens: 400 }

  - id: linkedin
    depends_on: [post]
    infer: { prompt: "Rewrite this post for LinkedIn, hook first: \${{ tasks.post.output }}", max_tokens: 400 }

  - id: newsletter
    depends_on: [post]
    infer: { prompt: "Write a 3-sentence newsletter blurb for this post: \${{ tasks.post.output }}", max_tokens: 300 }

  - id: bundle
    depends_on: [thread, linkedin, newsletter]
    invoke:
      tool: "nika:write"
      args:
        path: ./social-bundle.md
        content: "\${{ tasks.thread.output }}\\n\\n---\\n\\n\${{ tasks.linkedin.output }}\\n\\n---\\n\\n\${{ tasks.newsletter.output }}"

outputs:
  bundle: "\${{ tasks.bundle.output }}"
`,
  },
  /* ── the library wing · recorded in the same trace lab (wave K) ─────────────
     Hand-shaped from their embedded-pack cousins (nika-pack examples/showcase
     t1-standup-digest · t2-etl-quarantine) exactly like the five above were:
     permits added, model pinned local, then RUN — the yaml below is the byte
     file that ran, the trace is the verbatim stream. They live in the library
     panel (not the 5-tab strip) and carry the full recorded story. */
  {
    id: 'standup_digest',
    filename: 'standup-digest.nika.yaml',
    label: 'standup-digest',
    /* the grounding tab: the note starts from `git log`, not from what a
       model remembers — the lit lines are the exec task that fetched truth. */
    gloss: 'exec: the note starts from real commits, not memory',
    highlight: [15, 16],
    artifact: 'wrote standup-note.md',
    traceNdjson: standupDigestTrace,
    yaml: `nika: v1
workflow: standup-digest
model: ollama/llama3.2:3b     # local · your commits never leave

permits:                      # the file IS the blast radius
  exec: [ git ]
  fs: { write: [ ./standup-note.md ] }
  tools: [ "nika:date", "nika:write" ]

tasks:
  # no dependency between these two · the engine runs them together
  - id: today
    invoke: { tool: "nika:date", args: { op: now } }

  - id: history
    exec: { command: [ git, log, --since=yesterday, --oneline, --no-merges ] }

  - id: digest
    depends_on: [today, history]
    infer:
      prompt: |
        Date: \${{ tasks.today.output }}
        Commits since yesterday:
        \${{ tasks.history.output }}

        Write my standup note, 3 bullets: done / doing / blocked.
        Plain words, no fluff.
      max_tokens: 300

  - id: save
    depends_on: [digest]
    invoke:
      tool: "nika:write"
      args: { path: ./standup-note.md, content: "\${{ tasks.digest.output }}" }

outputs:
  note: "\${{ tasks.digest.output }}"
`,
  },
  {
    id: 'etl_quarantine',
    filename: 'etl-quarantine.nika.yaml',
    label: 'etl-quarantine',
    /* the resilience tab: zero model · a validate gate splits the batch and
       the lit lines are the on_error recover that keeps the pipeline alive. */
    gloss: 'on_error: a bad batch degrades, the run survives',
    highlight: [22, 23],
    artifact: 'wrote daily-totals.json',
    traceNdjson: etlQuarantineTrace,
    yaml: `nika: v1
workflow: etl-quarantine

# zero model · a schema gate splits the batch · bad rows quarantine, the night survives
permits:                      # the file IS the blast radius
  fs: { read: [ ./data/incoming/* ], write: [ ./data/* ] }
  tools: [ "nika:read", "nika:convert", "nika:validate", "nika:jq", "nika:write" ]

tasks:
  # a deterministic empty fallback · the recover target if parsing dies
  - id: empty_batch
    invoke: { tool: "nika:jq", args: { input: [], expression: "." } }

  - id: raw
    invoke: { tool: "nika:read", args: { path: ./data/incoming/orders.csv } }

  - id: rows
    depends_on: [raw]
    invoke:
      tool: "nika:convert"
      args: { input: "\${{ tasks.raw.output }}", from: csv, to: json, has_header: true }
    on_error:
      recover: \${{ tasks.empty_batch.output }}   # malformed CSV → empty batch · the pipeline lives

  - id: check
    depends_on: [rows]
    invoke:
      tool: "nika:validate"
      args:
        data: "\${{ tasks.rows.output }}"
        format: json
        schema:
          type: array
          items:
            type: object
            required: [order_id, amount, currency]
            properties:
              order_id: { type: string }
              amount: { type: string }
              currency: { type: string, enum: [EUR, USD, GBP] }

  - id: good
    depends_on: [rows, check]
    when: \${{ tasks.check.output.valid == true }}
    invoke:
      tool: "nika:jq"
      args:
        input: "\${{ tasks.rows.output }}"
        expression: 'group_by(.currency) | map({currency: .[0].currency, orders: length, total: (map(.amount | tonumber) | add)})'

  - id: quarantine
    depends_on: [rows, check]
    when: \${{ tasks.check.output.valid == false }}
    invoke:
      tool: "nika:write"
      args:
        path: ./data/quarantine/rejected.json
        content: "\${{ tasks.check.output.errors }}"
        create_dirs: true

  - id: report
    depends_on: [good]
    when: \${{ tasks.good.output != null && size(tasks.good.output) > 0 }}
    invoke:
      tool: "nika:write"
      args:
        path: ./data/daily-totals.json
        content: "\${{ tasks.good.output }}"
        create_dirs: true

outputs:
  totals: "\${{ tasks.good.output }}"
`,
  },
]
