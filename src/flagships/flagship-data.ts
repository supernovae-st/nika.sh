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
     written, real durations. `?replay` removes only wire fields the film never
     reads; trace.test.ts proves the projected model equals the raw recording.
   · schema-truth + trace↔file coherence are enforced by src/test tests
     (ajv against public/schema/workflow.json · derived plan == yaml-lib
     parse · every trace task exists in the file with the same verb).

   Data-only module (react-refresh: components-only files must not export
   data — the faq-data / hero-files pattern). */

import dailyBriefTrace from './traces/daily-brief.ndjson?replay'
import prRiskReviewTrace from './traces/pr-risk-review.ndjson?replay'
import meetingActionsTrace from './traces/meeting-actions.ndjson?replay'
import priceWatchTrace from './traces/price-watch.ndjson?replay'
import socialRepurposeTrace from './traces/social-repurpose.ndjson?replay'
import standupDigestTrace from './traces/standup-digest.ndjson?replay'
import etlQuarantineTrace from './traces/etl-quarantine.ndjson?replay'

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
  /** exact replay fields projected from this file's verbatim signed NDJSON */
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
    highlight: [6, 8],
    artifact: 'wrote brief.md',
    traceNdjson: dailyBriefTrace,
    /* comment discipline (all 7 files): section comments live on their OWN
       line and stay ≤54ch — a trailing comment past the hero's wrap column
       soft-wraps into a one-word orphan (« leave » · « radius »), which reads
       broken. Comments are display prose; ids/paths/structure stay byte-true
       to the recorded run. */
    yaml: `nika: daily-brief
# local model · your notes never leave
model: ollama/llama3.2:3b

# the file IS the blast radius
permits:
  fs: { read: [ ./notes/* ], write: [ ./brief.md ] }
  tools: [ "nika:read", "nika:assert", "nika:write" ]

tasks:
  notes: { invoke: { tool: "nika:read", args: { path: ./notes/today.md } } }
  inbox: { invoke: { tool: "nika:read", args: { path: ./notes/inbox.md } } }
  calendar: { invoke: { tool: "nika:read", args: { path: ./notes/calendar.md } } }

  triage:
    with:
      inbox: \${{ tasks.inbox.output }}
    infer: { prompt: "Urgent item, 10 words max: \${{ with.inbox }}", max_tokens: 2048 }
  agenda:
    with:
      calendar: \${{ tasks.calendar.output }}
    infer: { prompt: "Three bullets, 8 words max: \${{ with.calendar }}", max_tokens: 2048 }

  draft:
    with:
      notes: \${{ tasks.notes.output }}
      triage: \${{ tasks.triage.output }}
      agenda: \${{ tasks.agenda.output }}
    infer:
      prompt: "Three bullets, 8 words max. No preface. Notes: \${{ with.notes }} Urgent: \${{ with.triage }} Plan: \${{ with.agenda }}"
      max_tokens: 2048

  verify:
    with:
      draft: \${{ tasks.draft.output }}
    invoke:
      tool: "nika:assert"
      args:
        condition: "\${{ size(with.draft) > 0 }}"
        message: "Empty brief. Increase max_tokens or change model."

  save:
    after: { verify: success }
    with:
      draft: \${{ tasks.draft.output }}
    invoke:
      tool: "nika:write"
      args: { path: ./brief.md, content: "\${{ with.draft }}" }

outputs:
  brief: "\${{ tasks.draft.output }}"`,
  },
  {
    id: 'pr_risk_review',
    filename: 'pr-risk-review.nika.yaml',
    label: 'pr-risk-review',
    gloss: 'when: the probe only fires on real risk',
    /* the lit band is the caption's EVIDENCE, nothing more: the probe task's
       head + the with: boundary its when: reads (the schema block above is a
       different story). */
    highlight: [29, 33],
    artifact: 'wrote review.md',
    traceNdjson: prRiskReviewTrace,
    yaml: `nika: pr-risk-review
# local model · the diff never leaves
model: ollama/llama3.2:3b

# the file IS the blast radius
permits:
  exec: [ git ]
  fs: { write: [ ./review.md ] }
  tools: [ "nika:read", "nika:write" ]

tasks:
  diff:
    exec: { command: [ git, diff, main ] }

  risk:
    with:
      diff: \${{ tasks.diff.output }}
    timeout: "120s"
    infer:
      prompt: "Score this diff's blast radius from 0 to 10: \${{ with.diff }}"
      schema:
        type: object
        required: [ score, reasons ]
        properties:
          score: { type: number }
          reasons: { type: array, items: { type: string } }
      max_tokens: 400

  probe:
    with:
      score: \${{ tasks.risk.output.score }}
      reasons: \${{ tasks.risk.output.reasons }}
    when: \${{ with.score >= 7 }}
    agent:
      prompt: "Trace the risky call paths behind: \${{ with.reasons }}"
      tools: [ "nika:read" ]
      max_turns: 3

  report:
    with:
      review: \${{ tasks.risk.output }}
    invoke:
      tool: "nika:write"
      args: { path: ./review.md, content: "\${{ with.review }}" }

outputs:
  review: "\${{ tasks.risk.output }}"`,
  },
  {
    id: 'meeting_actions',
    filename: 'meeting-actions.nika.yaml',
    label: 'meeting-actions',
    gloss: 'schema: the output is a contract, not prose',
    highlight: [19, 30],
    artifact: 'wrote action-items.json',
    traceNdjson: meetingActionsTrace,
    yaml: `nika: meeting-actions
# local model · the recording stays yours
model: ollama/llama3.2:3b

# the file IS the blast radius
permits:
  fs: { read: [ ./transcript.txt ], write: [ ./action-items.json ] }
  tools: [ "nika:read", "nika:write" ]

tasks:
  transcript:
    invoke: { tool: "nika:read", args: { path: ./transcript.txt } }

  extract:
    with:
      transcript: \${{ tasks.transcript.output }}
    infer:
      prompt: "Extract every action item with its owner: \${{ with.transcript }}"
      schema:
        type: object
        required: [ actions ]
        properties:
          actions:
            type: array
            items:
              type: object
              required: [ owner, task ]
              properties:
                owner: { type: string }
                task: { type: string }
      max_tokens: 400

  save:
    with:
      extract: \${{ tasks.extract.output }}
    invoke:
      tool: "nika:write"
      args: { path: ./action-items.json, content: "\${{ with.extract }}" }

outputs:
  actions: "\${{ tasks.extract.output }}"`,
  },
  {
    id: 'price_watch',
    filename: 'price-watch.nika.yaml',
    label: 'price-watch',
    /* the zero-model tab: not every workflow needs an LLM · the DAG, two
       builtins and one CEL compare do the whole job deterministically. */
    gloss: 'when: zero model · plain data opens the gate',
    highlight: [27, 30],
    artifact: 'wrote price-alert.md',
    traceNdjson: priceWatchTrace,
    /* alert_below is an `inputs:` dial with a default: the watch is runnable
       bare, and `--var alert_below=…` overrides it. `config:` died with the
       nine-key envelope (three authorities: inputs · const · secrets). */
    yaml: `nika: price-watch
# zero model · two tools and one CEL compare

# the file IS the blast radius
permits:
  fs: { read: [ ./price.json ], write: [ ./price-alert.md ] }
  tools: [ "nika:read", "nika:jq", "nika:write" ]

inputs:
  # your threshold · a defaulted dial, override with --var
  alert_below:
    type: number
    required: false
    default: 899

tasks:
  snapshot:
    invoke: { tool: "nika:read", args: { path: ./price.json } }

  price:
    with:
      snapshot: \${{ tasks.snapshot.output }}
    invoke:
      tool: "nika:jq"
      args: { input: "\${{ with.snapshot }}", expression: "fromjson | .price" }

  alert:
    with:
      price: \${{ tasks.price.output }}
    when: \${{ with.price < inputs.alert_below }}
    invoke:
      tool: "nika:write"
      args:
        path: ./price-alert.md
        content: "Price drop: now \${{ with.price }} (target \${{ inputs.alert_below }})"

outputs:
  price: "\${{ tasks.price.output }}"`,
  },
  {
    id: 'social_repurpose',
    filename: 'social-repurpose.nika.yaml',
    label: 'social-repurpose',
    /* the parallelism tab: one read fans out into three rewrites (no deps
       between them → the engine runs them concurrently) and one merge. */
    gloss: 'with: three parallel rewrites, one merge',
    /* the lit band = the caption's evidence: the bundle head + the fan-in
       with: block whose bindings literally list the three parallel rewrites
       (the binding IS the edge — W2). */
    highlight: [30, 34],
    artifact: 'wrote social-bundle.md',
    traceNdjson: socialRepurposeTrace,
    yaml: `nika: social-repurpose
# local model · your draft never leaves
model: ollama/llama3.2:3b

# the file IS the blast radius
permits:
  fs: { read: [ ./post.md ], write: [ ./social-bundle.md ] }
  tools: [ "nika:read", "nika:write" ]

tasks:
  # one read · three parallel rewrites · one merge
  post:
    invoke: { tool: "nika:read", args: { path: ./post.md } }

  thread:
    with:
      post: \${{ tasks.post.output }}
    infer: { prompt: "Turn this post into a 6-tweet thread, keep the voice: \${{ with.post }}", max_tokens: 400 }

  linkedin:
    with:
      post: \${{ tasks.post.output }}
    infer: { prompt: "Rewrite this post for LinkedIn, hook first: \${{ with.post }}", max_tokens: 400 }

  newsletter:
    with:
      post: \${{ tasks.post.output }}
    infer: { prompt: "Write a 3-sentence newsletter blurb for this post: \${{ with.post }}", max_tokens: 300 }

  bundle:
    with:
      thread: \${{ tasks.thread.output }}
      linkedin: \${{ tasks.linkedin.output }}
      newsletter: \${{ tasks.newsletter.output }}
    invoke:
      tool: "nika:write"
      args:
        path: ./social-bundle.md
        content: "\${{ with.thread }}\\n\\n---\\n\\n\${{ with.linkedin }}\\n\\n---\\n\\n\${{ with.newsletter }}"

outputs:
  bundle: "\${{ tasks.bundle.output }}"`,
  },
  /* ── the library wing · recorded in the same trace lab (wave K) ─────────────
     Hand-shaped from their embedded-pack cousins (nika-pack examples/
     standup-digest · etl-quarantine) exactly like the five above were:
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
    highlight: [16, 17],
    artifact: 'wrote standup-note.md',
    traceNdjson: standupDigestTrace,
    yaml: `nika: standup-digest
# local model · your commits never leave
model: ollama/llama3.2:3b

# the file IS the blast radius
permits:
  exec: [ git ]
  fs: { write: [ ./standup-note.md ] }
  tools: [ "nika:date", "nika:write" ]

tasks:
  # no dependency · the engine runs them together
  today:
    invoke: { tool: "nika:date", args: { op: now } }

  history:
    exec: { command: [ git, log, --since=yesterday, --oneline, --no-merges ] }

  digest:
    with:
      today: \${{ tasks.today.output }}
      history: \${{ tasks.history.output }}
    infer:
      prompt: |
        Date: \${{ with.today }}
        Commits since yesterday:
        \${{ with.history }}

        Write my standup note, 3 bullets: done / doing / blocked.
        Plain words, no fluff.
      max_tokens: 300

  save:
    with:
      digest: \${{ tasks.digest.output }}
    invoke:
      tool: "nika:write"
      args: { path: ./standup-note.md, content: "\${{ with.digest }}" }

outputs:
  note: "\${{ tasks.digest.output }}"`,
  },
  {
    id: 'etl_quarantine',
    filename: 'etl-quarantine.nika.yaml',
    label: 'etl-quarantine',
    /* the resilience tab: zero model · a validate gate splits the batch and
       the lit lines are the on_error recover that keeps the pipeline alive. */
    gloss: 'on_error: a bad batch degrades, the run survives',
    highlight: [23, 25],
    artifact: 'wrote daily-totals.json',
    traceNdjson: etlQuarantineTrace,
    yaml: `nika: etl-quarantine
# zero model · a schema gate splits the batch

# the file IS the blast radius
permits:
  fs: { read: [ ./data/incoming/* ], write: [ ./data/daily-totals.json, ./data/quarantine/rejected.json ] }
  tools: [ "nika:read", "nika:convert", "nika:validate", "nika:jq", "nika:write" ]

tasks:
  # the deterministic fallback if parsing dies
  empty_batch:
    invoke: { tool: "nika:jq", args: { input: [], expression: "." } }

  raw:
    invoke: { tool: "nika:read", args: { path: ./data/incoming/orders.csv } }

  rows:
    with:
      raw: \${{ tasks.raw.output }}
    invoke:
      tool: "nika:convert"
      args: { input: "\${{ with.raw }}", from: csv, to: json, has_header: true }
    # malformed CSV → empty batch · the run survives
    on_error:
      recover: \${{ tasks.empty_batch.output }}

  check:
    with:
      rows: \${{ tasks.rows.output }}
    invoke:
      tool: "nika:validate"
      args:
        data: "\${{ with.rows }}"
        format: json
        schema:
          type: array
          items:
            type: object
            required: [ order_id, amount, currency ]
            properties:
              order_id: { type: string }
              amount: { type: string }
              currency: { type: string, enum: [ EUR, USD, GBP ] }

  good:
    with:
      rows: \${{ tasks.rows.output }}
      valid: \${{ tasks.check.output.valid }}
    when: \${{ with.valid == true }}
    invoke:
      tool: "nika:jq"
      args:
        input: "\${{ with.rows }}"
        expression: 'group_by(.currency) | map({currency: .[0].currency, orders: length, total: (map(.amount | tonumber) | add)})'

  quarantine:
    with:
      valid: \${{ tasks.check.output.valid }}
      errors: \${{ tasks.check.output.errors }}
    when: \${{ with.valid == false }}
    invoke:
      tool: "nika:write"
      args:
        path: ./data/quarantine/rejected.json
        content: "\${{ with.errors }}"
        create_dirs: true

  report:
    with:
      totals: \${{ tasks.good.output }}   # value edge · passes when good is skipped (reads null)
    when: \${{ with.totals != null && size(with.totals) > 0 }}
    invoke:
      tool: "nika:write"
      args:
        path: ./data/daily-totals.json
        content: "\${{ with.totals }}"
        create_dirs: true

outputs:
  totals: "\${{ tasks.good.output }}"`,
  },
]
