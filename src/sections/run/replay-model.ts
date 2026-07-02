/* ─── replay-model · recorded trace → the replay script ──────────────────────
   PURE LOGIC, no UI. Maps a flagship's REAL trace (trace-parse.ts) onto the
   line script the replay device types out. Grouping is presentational
   (consecutive task_scheduled events collapse into one line) — every fact on
   a line (ids · notes · durations · tokens · details · the exit) is verbatim
   from the recorded run. Pacing compresses the real gaps to reading speed:
   delay = clamp(real dt / 40, 90ms, 1100ms) — the DISPLAYED durations stay
   the real ones. */

import type { FlagshipEntry } from '../../flagships'
import { formatMs, type NikaVerb } from '../../flagships'

export interface ReplayLine {
  kind: 'cmd' | 'workflow' | 'scheduled' | 'start' | 'done' | 'skip' | 'exit'
  /** the ▶ / ✓ / ⊘ / · glyph column */
  glyph: string
  /** the mono line text (word-fade splits on spaces) */
  text: string
  /** the verb whose hue the glyph carries (start lines · sanctioned live-run) */
  verb?: NikaVerb
  /** pacing: ms before this line lands (already reading-speed compressed) */
  delayMs: number
  /** replay progress 0..1 once this line has landed (drives the frame swell) */
  progress: number
}

export interface ReplayVerdict {
  exit: 0 | 1
  totalMs: number
  completed: number
  skipped: number
  artifact: string
  model: string
}

const MIN_DELAY = 90
const MAX_DELAY = 1100
const pace = (dtMs: number) => Math.min(MAX_DELAY, Math.max(MIN_DELAY, Math.round(dtMs / 40)))

export function buildScript(entry: FlagshipEntry): {
  lines: ReplayLine[]
  verdict: ReplayVerdict
} {
  const { trace, plan } = entry
  const verbOf = new Map(plan.tasks.map((t) => [t.id, t.verb]))
  const lines: ReplayLine[] = [
    { kind: 'cmd', glyph: '❯', text: `nika run ${entry.filename}`, delayMs: 0, progress: 0 },
  ]

  let prevAt = 0
  let scheduled: string[] = []
  const flushScheduled = () => {
    if (scheduled.length === 0) return
    lines.push({
      kind: 'scheduled',
      glyph: '·',
      text: `scheduled ${scheduled.length} task${scheduled.length > 1 ? 's' : ''} · ${scheduled.join(' ')}`,
      delayMs: 140,
      progress: 0,
    })
    scheduled = []
  }

  for (const s of trace.steps) {
    const delay = pace(s.atMs - prevAt)
    switch (s.kind) {
      case 'workflow_started':
        lines.push({
          kind: 'workflow',
          glyph: '▶',
          text: `workflow ${plan.workflow}`,
          delayMs: 420,
          progress: 0,
        })
        break
      case 'task_scheduled':
        if (s.task) scheduled.push(s.task)
        break
      case 'task_started':
        flushScheduled()
        lines.push({
          kind: 'start',
          glyph: '▶',
          text: `${s.task}  ${s.note ?? ''}`.trimEnd(),
          verb: s.task ? verbOf.get(s.task) : undefined,
          delayMs: delay,
          progress: 0,
        })
        break
      case 'task_completed': {
        flushScheduled()
        const dur = s.durationMs !== undefined ? formatMs(s.durationMs) : ''
        const tok = s.tokens !== undefined ? ` · ${s.tokens} tok` : ''
        lines.push({
          kind: 'done',
          glyph: '✓',
          text: `${s.task}  ${dur}${tok}`.trimEnd(),
          delayMs: delay,
          progress: 0,
        })
        break
      }
      case 'task_skipped':
        flushScheduled()
        lines.push({
          kind: 'skip',
          glyph: '⊘',
          text: `${s.task}  skipped · ${s.detail ?? s.note ?? 'gate closed'}`,
          delayMs: delay,
          progress: 0,
        })
        break
      case 'workflow_completed':
        flushScheduled()
        lines.push({
          kind: 'exit',
          glyph: '■',
          text: `run complete · exit 0 · ${formatMs(trace.totalMs)}`,
          delayMs: Math.max(delay, 360),
          progress: 0,
        })
        break
      default:
        break
    }
    prevAt = s.atMs
  }

  /* progress · fraction of landed lines (drives the frame swell honestly) */
  lines.forEach((l, i) => {
    l.progress = i / Math.max(1, lines.length - 1)
  })

  return {
    lines,
    verdict: {
      exit: trace.exit,
      totalMs: trace.totalMs,
      completed: trace.completed,
      skipped: trace.skipped,
      artifact: entry.artifact,
      model: plan.model,
    },
  }
}
