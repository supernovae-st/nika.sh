import { useEffect, useRef, useState } from 'react'
import Code from '../Code'
import DagCanvas from '../scene/dag'
import { Plain } from '../components/ui'
import {
  WF_LINES,
  STEPS,
  VERB_COLOR,
  T_TYPE_END,
  T_RUN_START,
  tw,
  type Verb,
} from './transform-data'

const FULL_TEXT = WF_LINES.map((l) => l.text).join('\n')
const LINE_H = 22 // px · locked by .tw-editor .code line-height

/* ─── §transform · the showpiece ──────────────────────────────────────────
   A 280vh sticky scene. As you scroll: the file TYPES ITSELF line by line ·
   each `- id:` materializes a node in the 3D graph · each depends_on draws
   an edge · then the wave runs the DAG in topological order. The whole
   pitch — intent → graph → execution — in one scroll gesture. */
export default function Transform() {
  const sec = useRef<HTMLElement>(null)
  const win = useRef<HTMLDivElement>(null) // the editor window (fixed height)
  const clip = useRef<HTMLDivElement>(null) // the reveal clip (height animated)
  const runLine = useRef<HTMLDivElement>(null)
  const logBox = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    let raf = 0
    let sT = 0
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tick = () => {
      const el = sec.current
      if (el) {
        const r = el.getBoundingClientRect()
        const target = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)))
        sT = reduced ? target : sT + (target - sT) * 0.16
        tw.t = sT
        // typewriter: clip N lines + keep the latest line in view (editor follows)
        const lines = Math.round(Math.min(1, sT / T_TYPE_END) * WF_LINES.length)
        if (clip.current && win.current) {
          const h = lines * LINE_H
          clip.current.style.height = `${h}px`
          win.current.scrollTop = Math.max(0, h - win.current.clientHeight + LINE_H)
        }
        // terminal run line + the action log (the power, made visible)
        const rT = Math.min(1, Math.max(0, (sT - T_RUN_START) / (1 - T_RUN_START)))
        if (runLine.current) {
          runLine.current.style.opacity = String(Math.min(1, rT * 3))
          runLine.current.dataset.done = rT > 0.92 ? '1' : '0'
        }
        if (logBox.current) {
          for (const li of Array.from(logBox.current.children) as HTMLElement[]) {
            const at = Number(li.dataset.at)
            const a = Math.min(1, Math.max(0, (rT - at) / 0.07))
            li.style.opacity = String(a * 0.95)
            li.style.transform = `translateY(${(1 - a) * 6}px)`
            li.dataset.done = rT > at + 0.13 ? '1' : '0'
          }
        }
        // pedagogy rail
        let s = 0
        for (let i = 0; i < STEPS.length; i++) if (sT >= STEPS[i].at) s = i
        setStep((prev) => (prev === s ? prev : s))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section id="transform" ref={sec} className="relative h-[280vh] scroll-mt-24">
      <div className="sticky top-0 flex h-screen flex-col justify-center px-6">
        <div className="mx-auto w-full max-w-6xl">
          <p className="mono mb-3 text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
            § The transform
          </p>
          <h2
            className="mb-8 font-semibold tracking-tight"
            style={{ fontSize: 'clamp(1.7rem, 0.9rem + 2.6vw, 2.9rem)', lineHeight: 1.02 }}
          >
            Watch a file become a running graph.
          </h2>
          <div className="-mt-4 mb-6 hidden md:block">
            <Plain>
              The file becomes a map of steps. The engine follows the map — in parallel when two
              steps don&apos;t depend on each other.
            </Plain>
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.05fr]">
            {/* ── the editor · types itself ── */}
            <div className="skeuo flex flex-col overflow-hidden rounded-2xl">
              <div
                className="flex items-center gap-2 border-b px-4 py-2.5"
                style={{ borderColor: 'var(--hair)' }}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
                <span className="h-3 w-3 rounded-full" style={{ background: '#febc2e' }} />
                <span className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} />
                <span className="mono ml-3 text-[12px] text-[var(--fg-dim)]">
                  weekly-radar.nika.yaml
                </span>
                <span className="mono ml-auto text-[11px] text-[var(--fg-ghost)]">writing…</span>
              </div>
              <div
                ref={win}
                className="tw-editor max-h-[24vh] flex-1 overflow-hidden px-5 py-4 lg:max-h-[46vh]"
              >
                <div ref={clip} className="overflow-hidden" style={{ height: 0 }}>
                  <Code code={FULL_TEXT} />
                </div>
                <span className="tw-cursor" />
              </div>
              {/* the terminal line — appears when the wave runs */}
              <div
                ref={runLine}
                className="tw-run mono border-t px-5 py-3 text-[12.5px]"
                style={{ borderColor: 'var(--hair)', opacity: 0 }}
              >
                <span className="text-[var(--fg-dim)]">$ </span>
                <span className="text-[var(--fg)]">nika run weekly-radar.nika.yaml</span>
                <span className="tw-run-ok ml-3 text-[var(--cyan)]">
                  ✓ 5 tasks · 2 parallel branches · outputs.radar
                </span>
              </div>
              {/* the action log — every step the engine takes, in plain sight */}
              <div
                ref={logBox}
                className="tw-log mono border-t px-5 py-3 text-[11.5px] leading-[1.9]"
                style={{ borderColor: 'var(--hair)' }}
              >
                {[
                  { at: 0.04, txt: 'fetch_news    invoke nika:fetch · 20 headlines pulled', c: '#22d3ee' },
                  { at: 0.04, txt: 'repo_log      exec git log · 20 commits read', c: '#ff7a3c' },
                  { at: 0.3, txt: 'digest        infer llama3.1 · signal summarized', c: '#5b8cff' },
                  { at: 0.3, txt: 'changelog     infer llama3.1 · notes drafted', c: '#5b8cff' },
                  { at: 0.56, txt: 'brief         agent · merged both into weekly-brief.md', c: '#b07bff' },
                ].map((l) => (
                  <div key={l.txt} data-at={l.at} className="tw-log-line flex items-baseline gap-2" style={{ opacity: 0 }}>
                    <span style={{ color: l.c }}>▸</span>
                    <span className="flex-1 text-[var(--fg-mute)]">{l.txt}</span>
                    <span className="tw-log-ok text-[var(--cyan)]">✓</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── the graph · materializes + runs ── */}
            <div className="flex flex-col gap-4">
              <div
                className="glass relative min-h-[24vh] overflow-hidden rounded-2xl lg:min-h-[38vh]"
              >
                <div className="absolute inset-0">
                  <DagCanvas />
                </div>
                {/* verb legend */}
                <div className="mono pointer-events-none absolute bottom-3 left-4 flex gap-4 text-[10.5px] tracking-[0.12em] uppercase">
                  {(Object.keys(VERB_COLOR) as Verb[]).map((v) => (
                    <span key={v} className="flex items-center gap-1.5 text-[var(--fg-dim)]">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: VERB_COLOR[v] }}
                      />
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── the pedagogy rail · 4 beats ── */}
              <div className="hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-4">
                {STEPS.map((s, i) => (
                  <div
                    key={s.title}
                    className="glass rounded-xl px-4 py-3 transition-all duration-500"
                    style={{
                      opacity: i === step ? 1 : 0.38,
                      borderColor: i === step ? 'color-mix(in oklch, var(--cyan) 45%, transparent)' : undefined,
                      transform: i === step ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    <p className="mono mb-1 text-[10px] tracking-[0.18em] text-[var(--cyan)] uppercase">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <p className="text-[13px] leading-snug font-medium text-[var(--fg)]">
                      {s.title}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--fg-mute)]">
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
