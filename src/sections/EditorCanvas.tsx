import { useEffect, useRef, useState } from 'react'
import { useRevealOnce } from './use-reveal-once'
import { VSCODE_EXT_URL, OPENVSX_EXT_URL } from '../content/install'
import './v4-home.css'

/* ─── FIG 9.5 · In your editor — the file becomes a canvas ────────────────────
   The extension beat, INTERACTIVE: a working miniature of the nika-lang
   canvas in the site's own register (the extension took its design system
   FROM this page — same near-black field, verb LED hues, mono voice — so
   a DOM replica is the honest move here, not a pastiche).

   The miniature is a real diamond DAG (fetch → write ∥ image → publish):
   press ▶ mock and it lights wave by wave — the two middle cards run IN
   PARALLEL with different durations, which is the whole canvas argument.
   Hover a card and its lineage stays lit (the extension's lineage mode,
   at postcard scale). Click a card and the YAML panel highlights the
   exact lines it came from — the node IS the content.

   HONESTY CONTRACT: the YAML below is a REAL workflow — it passes
   `nika check` clean (exit 0 · waves [[0],[1,2],[3]] · the onpage-yaml
   suite validates it against the live schema). Every element of the
   miniature exists in the shipped extension. The model is LOCAL per the
   presentation-order lock; the ceiling reads $0.00 because it IS $0.00
   on a local model. Durations are illustrative (labeled as a mock run).

   Motion: the run animation is motion-safe only — with reduced motion
   the ▶ press jumps straight to the finished state. SSR-safe: the
   prerendered frame is the idle state (all cards pending, YAML visible);
   no effects run at mount. */

export const EXTENSION_SHOWCASE_YAML = `nika: v1
workflow: release-notes

model: ollama/qwen3.5:4b

tasks:
  - id: fetch_commits
    invoke:
      tool: "nika:fetch"
      args:
        url: "https://api.github.com/repos/acme/app/commits?since=v1.4.0"

  - id: write_notes
    depends_on: [fetch_commits]
    infer:
      max_tokens: 800
      prompt: "Write the release notes from \${{ tasks.fetch_commits.output }} — grouped, human, no hype."

  - id: hero_image
    depends_on: [fetch_commits]
    invoke:
      tool: "nika:image_generate"
      args:
        provider: local
        prompt: "A minimal banner for the v1.5 release"
        aspect_ratio: "16:9"
        output_dir: "media/"

  - id: publish
    depends_on: [write_notes, hero_image]
    exec:
      command: "gh release create v1.5.0 --notes-file notes.md"
`

type TaskId = 'fetch_commits' | 'write_notes' | 'hero_image' | 'publish'
type Status = 'pending' | 'running' | 'done'

interface CardDef {
  id: TaskId
  verb: 'invoke' | 'infer' | 'exec'
  glyph: string
  fact: [string, string]
  /* position in the stage, % of width/height (card top-left) */
  x: number
  y: number
  /* mock-run duration, ms (write ∥ image differ on purpose — the point) */
  dur: number
  meta: string
}

const CARDS: CardDef[] = [
  { id: 'fetch_commits', verb: 'invoke', glyph: '◆', fact: ['tool', 'nika:fetch'], x: 30, y: 2, dur: 600, meta: '0.6s' },
  { id: 'write_notes', verb: 'infer', glyph: '◇', fact: ['model', 'ollama/qwen3.5:4b'], x: 2, y: 37, dur: 1700, meta: '1.7s' },
  { id: 'hero_image', verb: 'invoke', glyph: '◆', fact: ['tool', 'nika:image_generate'], x: 58, y: 37, dur: 1100, meta: '1.1s' },
  { id: 'publish', verb: 'exec', glyph: '▷', fact: ['$', 'gh release create v1.5.0'], x: 30, y: 72, dur: 800, meta: '0.8s' },
]

/* the diamond's wires — the edge that CARRIES a binding (`\${{ tasks.x }}`)
   is SOLID, a pure depends_on edge is DASHED: the extension's data story */
const WIRES: Array<{ from: TaskId; to: TaskId; data: boolean; d: string }> = [
  { from: 'fetch_commits', to: 'write_notes', data: true, d: 'M 250 64 C 215 108 165 112 125 146' },
  { from: 'fetch_commits', to: 'hero_image', data: false, d: 'M 310 64 C 345 108 395 112 435 146' },
  { from: 'write_notes', to: 'publish', data: false, d: 'M 125 206 C 165 244 215 250 252 286' },
  { from: 'hero_image', to: 'publish', data: false, d: 'M 435 206 C 395 244 345 250 308 286' },
]

const WAVES: TaskId[][] = [['fetch_commits'], ['write_notes', 'hero_image'], ['publish']]

const IDLE: Record<TaskId, Status> = {
  fetch_commits: 'pending',
  write_notes: 'pending',
  hero_image: 'pending',
  publish: 'pending',
}

const ALL_DONE: Record<TaskId, Status> = {
  fetch_commits: 'done',
  write_notes: 'done',
  hero_image: 'done',
  publish: 'done',
}

/* upstream cone per card (lineage-lite: hover keeps the cone lit) */
const CONE: Record<TaskId, TaskId[]> = {
  fetch_commits: ['fetch_commits'],
  write_notes: ['fetch_commits', 'write_notes'],
  hero_image: ['fetch_commits', 'hero_image'],
  publish: ['fetch_commits', 'write_notes', 'hero_image', 'publish'],
}

const STATUS_GLYPH: Record<Status, string> = { pending: '·', running: '◌', done: '✓' }

export default function EditorCanvas() {
  const ref = useRevealOnce<HTMLElement>()
  const [status, setStatus] = useState<Record<TaskId, Status>>(IDLE)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [hovered, setHovered] = useState<TaskId | null>(null)
  const [selected, setSelected] = useState<TaskId | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const runMock = (): void => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStatus(ALL_DONE)
      setPhase('done')
      return
    }
    setStatus(IDLE)
    setPhase('running')
    let at = 120
    let end = 0
    for (const wave of WAVES) {
      const waveStart = at
      for (const id of wave) {
        const def = CARDS.find((c) => c.id === id)
        if (!def) { continue }
        timers.current.push(window.setTimeout(() => {
          setStatus((s) => ({ ...s, [id]: 'running' }))
        }, waveStart))
        timers.current.push(window.setTimeout(() => {
          setStatus((s) => ({ ...s, [id]: 'done' }))
        }, waveStart + def.dur))
        end = Math.max(end, waveStart + def.dur)
      }
      at = end + 140
    }
    timers.current.push(window.setTimeout(() => { setPhase('done') }, end + 200))
  }

  const reset = (): void => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setStatus(IDLE)
    setPhase('idle')
  }

  const cone = hovered ? CONE[hovered] : null

  return (
    <section
      ref={ref}
      id="editor"
      aria-labelledby="editor-title"
      className="theme-dark v4sec scroll-mt-24"
    >
      <div className="v4sec-wrap">
        <p className="v4sec-fig" data-rise>
          09
        </p>

        <h2 id="editor-title" className="v4wedge-thesis" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
          <b>The file becomes a canvas.</b> Open any <code className="mono">.nika.yaml</code>{' '}
          in VS Code or Cursor — prompts sit on the cards, a run lights the
          graph wave by wave, and every canvas edit lands back in the file.
          This miniature works: press <b>▶ mock</b>.
        </h2>

        <div className="v4edx-duo" data-rise style={{ ['--rise-delay' as string]: '140ms' }}>
          {/* THE MINIATURE · a working diamond, in the extension's register */}
          <div
            className={`v4ed-frame v4edx-stage-frame${phase === 'done' ? ' v4edx-frame--verdict' : ''}`}
            aria-label="A miniature of the Nika canvas: four task cards in a diamond — fetch_commits, then write_notes and hero_image in parallel, then publish — with a mock-run control. Activating a card highlights its lines in the YAML panel."
          >
            <p className="v4ed-tab">
              release-notes.nika.yaml · canvas
              <span className="v4edx-tab-hint">hover a card — its lineage stays lit</span>
            </p>

            <div className="v4edx-stage" role="group" aria-label="Workflow graph">
              <svg className="v4edx-wires" viewBox="0 0 560 400" aria-hidden preserveAspectRatio="none">
                {WIRES.map((w) => {
                  const active = status[w.to] === 'running'
                  const dimmed = cone !== null && !(cone.includes(w.from) && cone.includes(w.to))
                  return (
                    <path
                      key={`${w.from}-${w.to}`}
                      d={w.d}
                      className={[
                        'v4edx-wire',
                        w.data ? 'v4edx-wire--data' : 'v4edx-wire--dep',
                        active ? 'v4edx-wire--active' : '',
                        dimmed ? 'v4edx-wire--dim' : '',
                      ].filter(Boolean).join(' ')}
                    />
                  )
                })}
              </svg>

              {CARDS.map((c) => {
                const st = status[c.id]
                const dimmed = cone !== null && !cone.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={[
                      'v4edx-card',
                      `v4edx-card--${c.verb}`,
                      `v4edx-card--${st}`,
                      dimmed ? 'v4edx-card--dim' : '',
                      selected === c.id ? 'v4edx-card--selected' : '',
                    ].filter(Boolean).join(' ')}
                    style={{ left: `${c.x}%`, top: `${c.y}%` }}
                    onMouseEnter={() => { setHovered(c.id) }}
                    onMouseLeave={() => { setHovered(null) }}
                    onFocus={() => { setHovered(c.id) }}
                    onBlur={() => { setHovered(null) }}
                    onClick={() => { setSelected((cur) => (cur === c.id ? null : c.id)) }}
                    aria-pressed={selected === c.id}
                    aria-label={`Task ${c.id} (${c.verb}) — ${st}. Show its YAML.`}
                  >
                    <span className="v4edx-tile" aria-hidden>{c.glyph}</span>
                    <span className="v4edx-body">
                      <span className="v4edx-id">{c.id}</span>
                      <span className="v4edx-fact">
                        <span className="v4edx-fact-k">{c.fact[0]}</span>
                        <span className="v4edx-fact-v">{c.fact[1]}</span>
                      </span>
                    </span>
                    <span className={`v4edx-dot v4edx-dot--${st}`} aria-hidden>
                      {STATUS_GLYPH[st]}
                      {st === 'done' && phase !== 'idle' ? <em className="v4edx-meta"> {c.meta}</em> : null}
                    </span>
                  </button>
                )
              })}
            </div>

            <p className="v4ed-pill v4edx-pill">
              {phase !== 'done' ? (
                <button type="button" className="v4ed-run v4edx-runbtn" onClick={runMock} disabled={phase === 'running'}>
                  ▶ mock
                </button>
              ) : (
                <button type="button" className="v4ed-run v4edx-runbtn v4edx-runbtn--again" onClick={reset}>
                  ↺ again
                </button>
              )}
              <span className="v4ed-cost" aria-live="polite">
                {phase === 'done'
                  ? '✓ 4 tasks · 2 ran in parallel · $0.00'
                  : phase === 'running'
                    ? 'wave by wave — watch the middle two'
                    : '$0.00 ceiling · local model · audited before it runs'}
              </span>
            </p>
          </div>

          {/* THE FILE · the same workflow, as the text it really is */}
          <div className="v4edx-yaml" aria-label="The workflow file this canvas renders">
            <p className="v4ed-tab">release-notes.nika.yaml</p>
            <pre className="v4edx-pre">
              {splitYamlByTask(EXTENSION_SHOWCASE_YAML).map((seg) => (
                <span
                  key={seg.key}
                  className={
                    seg.task && selected === seg.task
                      ? 'v4edx-yaml-hl'
                      : seg.task && selected
                        ? 'v4edx-yaml-dim'
                        : undefined
                  }
                >
                  {seg.text}
                </span>
              ))}
            </pre>
          </div>
        </div>

        {/* the three claims — each one ships today, no roadmap verbs */}
        <ul className="v4ed-claims" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
          <li>
            <b>The engine's judgment, as you type.</b> Diagnostics, completions
            and hovers come from <code className="mono">nika check</code> and
            the schema — codes, fixes and positions are the binary's, not the
            extension's. Even this demo file passes the real{' '}
            <code className="mono">nika check</code>, exit 0.
          </li>
          <li>
            <b>Run, replay, scrub.</b> The run streams onto the graph live;
            any recorded run replays with a time-travel scrubber.
          </li>
          <li>
            <b>Audited before a token is spent.</b> Cost ceiling, permits
            boundary and secret flows are static facts on the cards — read
            them before you press Run.
          </li>
        </ul>

        <div className="v4ed-ctas" data-rise style={{ ['--rise-delay' as string]: '260ms' }}>
          {/* the Deno pattern: a vscode: deep link opens the extension page
              INSIDE the editor — the https store links stay as fallbacks */}
          <a href="vscode:extension/supernovae.nika-lang" className="v4every-link v4edx-cta-primary">
            Install in VS Code
          </a>
          <a href={VSCODE_EXT_URL} target="_blank" rel="noreferrer" className="v4every-link">
            Marketplace
            <span aria-hidden> ↗</span>
          </a>
          <a href={OPENVSX_EXT_URL} target="_blank" rel="noreferrer" className="v4every-link">
            Open VSX · Cursor / Windsurf
            <span aria-hidden> ↗</span>
          </a>
        </div>
      </div>
    </section>
  )
}

/* split the YAML into per-task segments so the panel can highlight the
   exact lines a clicked card came from (keys stay stable across renders) */
function splitYamlByTask(yaml: string): Array<{ key: string; task: TaskId | null; text: string }> {
  const ids: TaskId[] = ['fetch_commits', 'write_notes', 'hero_image', 'publish']
  const lines = yaml.split('\n')
  const segs: Array<{ key: string; task: TaskId | null; text: string }> = []
  let current: TaskId | null = null
  let buf: string[] = []
  const flush = (): void => {
    if (buf.length > 0) {
      segs.push({ key: `${segs.length}-${current ?? 'head'}`, task: current, text: buf.join('\n') + '\n' })
      buf = []
    }
  }
  for (const line of lines) {
    const m = line.match(/^ {2}- id: (\w+)/)
    if (m && ids.includes(m[1] as TaskId)) {
      flush()
      current = m[1] as TaskId
    }
    buf.push(line)
  }
  flush()
  return segs
}
