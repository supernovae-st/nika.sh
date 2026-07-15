import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useHydrated } from '../lib/use-hydrated'
import { parsePlan, type ParsedPlan } from '../lib/parse-plan'
import { DagView } from '../components/DagView'
/* lz-string is CJS — named ESM imports break the Node prerender (SSG);
   the default-import + destructure form works in both worlds */
import lz from 'lz-string'
const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = lz
import { track } from '../lib/track'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { checkNika, type LintDiag } from '../lib/nika-lint'
import { useAurora } from '../fx/aurora-context'
import { routeHead } from '../content'
import { TEMPLATES_YAML, SHOWCASE_YAML } from '../sections/usecases-yaml.generated'
import { NIKA_VERBS, verbGlyph, type NikaVerb } from '../components/codefile-highlight'
import { InstallCommand } from '../components/InstallCommand'
import '../sections/v4-home.css'
import '../components/codefile.css'
import './page-chrome.css'
import { NikaDots } from '../fx/dotmatrix/NikaDots'
import './play-page.css'

/* the editor (CodeMirror + @codemirror/*) is its own chunk · loaded client-side
   only, so it never rides the shared main bundle that every route eager-loads.
   The prerendered /play already has zero .cm-editor DOM, so this is a pure win. */
const PlayEditor = lazy(() => import('./PlayEditor'))

/* the placeholder shown while the editor chunk loads. It is ALSO what the
   prerenderer and the client's first paint render (the lazy/Suspense subtree is
   gated behind `mounted` below), so SSR HTML === first client render exactly —
   no Suspense boundary is emitted at build time. Without this gate, renderToString
   can't resolve the lazy import and ships a FAILED boundary (<!--$!-->), which
   the client then can't reconcile → React #419. Mounting the editor only after
   the hydrating render (via useHydrated below) keeps hydration byte-identical. */
const EditorFallback = (
  <div className="play-editor-fallback" aria-hidden="true">
    <NikaDots id="anim/loading" size={44} step={90} />
    loading editor…
  </div>
)

/* hydration-safe client detector → shared src/lib/use-hydrated (W12a) */

/* ─── /play · the playground (theme-dark · blueprint register) ────────────────
   Edit real Nika in the browser · the validator's own NIKA codes appear live
   (the TS port of the conformance cross-refs + the eight hard rules). Client-
   only — nothing leaves the tab. Seeds = the spec's templates (slot-marked
   skeletons) + the showcase workflows, all projected from the spec (counts
   live in the projector, never here).

   The editor is dressed in the SAME chrome as the static CodeFile (the .cf-*
   window dressing · traffic-light dots · filename tab · gutter divider · teal
   accent) so the playground reads as the same editor the rest of the site shows
   — only this one is live. The page is the v4 blueprint register: a FIG masthead,
   hairline-pill seeds, and a verdict rail in the spec permits-denials register. */

const TEMPLATE_ORDER = ['chain', 'gate-and-act', 'fanout', 'etl-state', 'agent-loop', 'human-gated-ship']

const VERB_HUE: Record<NikaVerb, string> = {
  infer: 'var(--verb-infer)',
  exec: 'var(--verb-exec)',
  invoke: 'var(--verb-invoke)',
  agent: 'var(--verb-agent)',
}

export function Component() {
  const [seed, setSeed] = useState('chain')
  const [code, setCode] = useState(TEMPLATES_YAML['chain'] ?? '')
  const [diags, setDiags] = useState<LintDiag[]>(() => checkNika(TEMPLATES_YAML['chain'] ?? ''))
  /* the LIVE PLAN (W12b·E1) · parsePlan on a 150ms debounce; an unparseable
     mid-edit source keeps the LAST VALID plan on screen, dimmed ([data-stale])
     — the picture never flickers while you type */
  const [plan, setPlan] = useState<ParsedPlan | null>(() => parsePlan(TEMPLATES_YAML['chain'] ?? ''))
  const [stale, setStale] = useState(false)
  const planTimer = useRef(0)
  /* THE RUN-SIM (E2) · a user-triggered replay of the ORDER — wave by wave,
     pending → running → ✓ done. Honesty law: order and parallelism are TRUE
     (derived from the real DAG); no fabricated durations are ever shown.
     Editing or switching seeds cancels the sim (the plan changed). */
  const [simWave, setSimWave] = useState<number | undefined>(undefined)
  const simTimer = useRef(0)
  /* the sim beats THE MACHINED FRAME's drum like the home film does — one
     run grammar site-wide: the ring appears at runStart, draws with the
     waves, each wave beats on its lead verb, the verdict completes it.
     (The sim only runs a check-green plan, so the verdict is success.) */
  const aurora = useAurora()
  const stopSim = () => {
    window.clearInterval(simTimer.current)
    setSimWave(undefined)
    /* only abort the drum when a sim is actually live — stopSim also fires
       on EVERY edit keystroke (onCode), and idle runStops would churn
       timers on the frame for nothing */
    if (simWave !== undefined) aurora.runStop()
  }
  const runSim = () => {
    if (!plan || stale) return
    track('play-run')
    window.clearInterval(simTimer.current)
    setSimWave(0)
    aurora.runStart()
    aurora.verbTick(plan.waves[0]?.[0]?.verb ?? 'invoke')
    let w = 0
    simTimer.current = window.setInterval(() => {
      w += 1
      if (w > plan.waves.length) {
        window.clearInterval(simTimer.current)
        return
      }
      setSimWave(w)
      if (w === plan.waves.length) {
        aurora.runEnd('success')
      } else {
        aurora.verbTick(plan.waves[w]?.[0]?.verb ?? 'invoke')
        aurora.runProgress(w / plan.waves.length)
      }
    }, 850)
  }
  /* unmount mid-sim: without runStop the lit ring outlives the page — the
     frame is site chrome and survives navigation (the class runStop exists
     for). The interval dies with it. */
  const stopSimRef = useRef(stopSim)
  useEffect(() => {
    stopSimRef.current = stopSim
  })
  useEffect(() => () => stopSimRef.current(), [])

  /* SHARE (E2) · the file as a link — ?y= carries the yaml (lz-string), so
     a playground state is one URL. Loaded post-hydration (SSG stays the
     template truth); Share copies the canonical link. */
  const [shared, setShared] = useState(false)
  useEffect(() => {
    /* deferred one frame — the effect body only wires the external read
       (the repo lint bans synchronous setState in effects) */
    const raf = requestAnimationFrame(() => {
      const y = new URLSearchParams(window.location.search).get('y')
      if (!y) return
      const src = decompressFromEncodedURIComponent(y)
      if (!src) return
      setSeed('shared')
      setCode(src)
      setDiags(checkNika(src))
      setPlan(parsePlan(src))
      setStale(false)
    })
    return () => cancelAnimationFrame(raf)
  }, [])
  const share = () => {
    const url = `${window.location.origin}/play?y=${compressToEncodedURIComponent(code)}`
    window.history.replaceState(null, '', url)
    void navigator.clipboard?.writeText(url).then(() => {
      setShared(true)
      window.setTimeout(() => setShared(false), 1600)
    })
  }
  const onCode = (v: string) => {
    stopSim()
    setCode(v)
    window.clearTimeout(planTimer.current)
    planTimer.current = window.setTimeout(() => {
      const next = parsePlan(v)
      if (next) {
        setPlan(next)
        setStale(false)
      } else {
        setStale(true)
      }
    }, 150)
  }
  /* false on the server AND on the client's first (hydrating) render → the lazy
     editor is never in the tree during hydration, so SSR HTML matches the first
     client paint exactly. Flips true on the next client render → editor mounts. */
  const mounted = useHydrated()

  useHead({
    title: 'Playground · Nika',
    link: routeHead('/play').link,
    meta: [
      ...routeHead('/play').meta,
      {
        name: 'description',
        content:
          'Write a workflow in the browser and watch it get checked as you type. Nothing leaves the tab. Then run the same file on your machine.',
      },
      { property: 'og:title', content: 'Playground · Nika' },
      {
        property: 'og:description',
        content: 'Write a workflow in the browser: checked as you type, nothing leaves the tab.',
      },
      { property: 'og:image', content: 'https://nika.sh/og-play.png' },
      {
        property: 'og:image:alt',
        content:
          'Nika playground · write Nika, checked live. Edit, watch the plan, simulate the order.',
      },
      { name: 'twitter:title', content: 'Playground · Nika' },
      {
        name: 'twitter:description',
        content: 'Write a workflow in the browser: checked as you type, nothing leaves the tab.',
      },
      { name: 'twitter:image', content: 'https://nika.sh/og-play.png' },
    ],
  })

  useEffect(() => {
    /* the smooth-hijack law: a route-mount reset is an arrival, never a travel */
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const pick = (slug: string) => {
    stopSim()
    const src = TEMPLATES_YAML[slug] ?? SHOWCASE_YAML[slug] ?? ''
    setSeed(slug)
    setCode(src)
    setDiags(checkNika(src))
    setPlan(parsePlan(src))
    setStale(false)
  }

  const valid = diags.length === 0

  return (
    <main className="theme-dark v4page">
      <section className="v4sec">
        <div className="v4sec-wrap">
          {/* the masthead */}
          <p className="v4sec-fig">the playground</p>
          <h1 id="play-title" className="v4sec-title play-title">
            Write Nika, checked live.
          </h1>
          {/* the punch lede (F7) · the catchy line ABOVE the consumer TL;DR */}
          <p className="v4punch">Try it right here.</p>
          <p className="v4sec-lede">
            Real Nika, validated as you type: the same <code className="mono">NIKA</code> codes
            the engine raises, with their fixes. Everything runs in this tab; <b>nothing is sent
            anywhere</b>.
          </p>

          {/* ── the seed picker · templates (pills) then showcase (a select) ── */}
          <div className="play-seeds">
            <span className="play-seeds-label">Templates</span>
            {TEMPLATE_ORDER.filter((t) => t in TEMPLATES_YAML).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => pick(t)}
                className="play-seed"
                aria-pressed={seed === t}
              >
                {t}
              </button>
            ))}
            <span className="play-seeds-label">Showcase</span>
            <select
              value={seed in SHOWCASE_YAML ? seed : ''}
              onChange={(e) => e.target.value && pick(e.target.value)}
              className="play-seed-select"
              aria-label="Pick a showcase workflow"
            >
              <option value="">pick a real job…</option>
              {Object.keys(SHOWCASE_YAML).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* ── the stage · the live editor + the verdict rail ── */}
          <div className="play-stage">
            {/* the editor · wrapped in the CodeFile chrome (the .cf-* titlebar) */}
            <div className="play-editor cf-panel">
              <div className="cf-chrome">
                <span className="cf-ticks" aria-hidden>
                  <span className="cf-tick" />
                  <span className="cf-tick" />
                  <span className="cf-tick" />
                </span>
                <span className="cf-tab" title={`${seed}.nika.yaml`}>
                  <span className="cf-tab-name">{seed}.nika.yaml</span>
                </span>
                <button
                  type="button"
                  className="play-share-btn"
                  onClick={share}
                  aria-label="Copy a shareable link to this file"
                >
                  {shared ? 'link copied' : 'share'}
                  <span role="status" className="sr-only">
                    {shared ? 'Link copied to clipboard' : ''}
                  </span>
                </button>
                <span
                  className="play-editor-status"
                  data-valid={valid}
                  aria-live="polite"
                >
                  <span className="play-editor-status-dot" aria-hidden />
                  {valid ? 'valid' : `${diags.length} issue${diags.length > 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="play-editor-body">
                {/* SSR + first client paint render EditorFallback directly (no
                    Suspense boundary → no #419). After hydration `mounted` flips
                    and the lazy editor loads, its own Suspense fallback bridges
                    the chunk fetch. */}
                {mounted ? (
                  <Suspense fallback={EditorFallback}>
                    <PlayEditor value={code} onChange={onCode} onDiags={setDiags} />
                  </Suspense>
                ) : (
                  EditorFallback
                )}
              </div>
            </div>

            {/* the right column · THE LIVE PLAN over the verdict rail (E1) */}
            <div className="play-right">
            <div className="play-panel play-dag" data-stale={stale || undefined}>
              <p className="play-panel-head play-dag-head">
                <span className="play-dag-live" aria-hidden />
                The plan · live
                <span className="play-dag-state" aria-live="polite">
                  {simWave !== undefined && plan
                    ? simWave >= plan.waves.length
                      ? 'order verified · simulated'
                      : `wave ${String(simWave + 1).padStart(2, '0')}/${String(plan.waves.length).padStart(2, '0')}`
                    : stale
                      ? 'waiting for valid yaml…'
                      : plan
                        ? `${plan.tasks.length} task${plan.tasks.length > 1 ? 's' : ''} · ${plan.waves.length} wave${plan.waves.length > 1 ? 's' : ''}`
                        : '—'}
                </span>
                <button
                  type="button"
                  className="play-sim-btn"
                  onClick={simWave !== undefined ? stopSim : runSim}
                  disabled={!plan || stale}
                  aria-label={simWave !== undefined ? 'Stop the run-order simulation' : 'Simulate the run order'}
                >
                  {simWave !== undefined ? '■ stop' : '▶ simulate'}
                </button>
              </p>
              {plan ? (
                <DagView plan={plan} stale={stale} simWave={simWave} />
              ) : (
                <p className="play-dag-empty">add a `tasks:` list and the plan draws itself</p>
              )}
              {simWave !== undefined && plan && simWave >= plan.waves.length && (
                <p className="play-sim-note">
                  order + parallelism are real · timings are not simulated:{' '}
                  <code>nika run</code> records the truth
                </p>
              )}
            </div>

            {/* THE BLAST RADIUS (E3) · the file's declared boundary, live —
                the Boundary section's grammar on YOUR yaml. Default-deny is
                the headline; absence is an honest empty state, not silence. */}
            <div className="play-panel play-permits" data-stale={stale || undefined}>
              <p className="play-panel-head">
                <span className="play-permits-glyph" aria-hidden>⌗</span>
                The blast radius
              </p>
              {plan?.permits ? (
                <>
                  <dl className="play-permits-rows">
                    <div className="play-permits-row">
                      <dt>fs read</dt>
                      <dd>{plan.permits.fsRead.length ? plan.permits.fsRead.map((g) => <code key={g}>{g}</code>) : <span className="play-permits-none">nothing</span>}</dd>
                    </div>
                    <div className="play-permits-row">
                      <dt>fs write</dt>
                      <dd>{plan.permits.fsWrite.length ? plan.permits.fsWrite.map((g) => <code key={g}>{g}</code>) : <span className="play-permits-none">nothing</span>}</dd>
                    </div>
                    <div className="play-permits-row">
                      <dt>tools</dt>
                      <dd>{plan.permits.tools.length ? plan.permits.tools.map((g) => <code key={g}>{g}</code>) : <span className="play-permits-none">none</span>}</dd>
                    </div>
                    <div className="play-permits-row">
                      <dt>exec</dt>
                      <dd>{plan.permits.exec === true ? <code>any program</code> : Array.isArray(plan.permits.exec) && plan.permits.exec.length ? plan.permits.exec.map((g) => <code key={g}>{g}</code>) : <span className="play-permits-none">denied</span>}</dd>
                    </div>
                    <div className="play-permits-row">
                      <dt>net.http</dt>
                      <dd>{plan.permits.hosts.length ? plan.permits.hosts.map((g) => <code key={g}>{g}</code>) : <span className="play-permits-none">no hosts</span>}</dd>
                    </div>
                  </dl>
                  <p className="play-permits-law">everything not listed is denied · before it runs</p>
                </>
              ) : (
                <p className="play-permits-empty">
                  no <code>permits:</code> declared. Add one and the file becomes its own
                  blast radius (try the <b>human-gated-ship</b> template)
                </p>
              )}
            </div>

            {/* the verdict rail · the validator read-out + the verb legend */}
            <aside className="play-rail">
              <div className="play-panel">
                <p className="play-panel-head" data-valid={valid}>
                  <span className="play-panel-head-dot" aria-hidden />
                  Validator · {valid ? 'green' : 'speaking'}
                </p>
                {valid ? (
                  <div className="play-pass">
                    <p className="play-pass-line">
                      <b>✓ This file passes</b> the playground&apos;s static checks: envelope,
                      verbs, edges, namespaces, providers, expressions. The engine&apos;s{' '}
                      <code>nika check</code> runs the full audit. Ship it with{' '}
                      <code>nika run {seed}.nika.yaml</code>.
                    </p>
                    {(seed === 'human-gated-ship' || seed === 'resume-screener') && (
                      <p className="play-pass-experiment">
                        Experiment · this file declares <code>permits:</code> · its whole blast
                        radius, in-file. Remove an entry from <code>permits.tools</code> and watch{' '}
                        <code>NIKA-SEC-004</code> fire: once the boundary is declared, the body must
                        fit it.
                      </p>
                    )}
                  </div>
                ) : (
                  <ul className="play-diags">
                    {diags.slice(0, 8).map((d, i) => (
                      <li key={i} className="play-diag">
                        <span className="play-diag-id">
                          L{d.line} · {d.code}
                        </span>
                        <span className="play-diag-msg">{d.message}</span>
                        <span className="play-diag-fix">{d.fix}</span>
                      </li>
                    ))}
                    {diags.length > 8 && (
                      <li className="play-diag-more">+{diags.length - 8} more…</li>
                    )}
                  </ul>
                )}
              </div>

              <div className="play-panel">
                <p className="play-verbs-head">The four verbs</p>
                <div className="play-verbs">
                  {NIKA_VERBS.map((v) => (
                    <span key={v} className="play-verb" style={{ ['--vh' as string]: VERB_HUE[v] }}>
                      <span className="play-verb-glyph" aria-hidden>
                        {verbGlyph(v)}
                      </span>
                      <span className="play-verb-name">{v}</span>
                    </span>
                  ))}
                </div>
                <p className="play-verbs-note">
                  Fill the <code># SLOT:</code> lines: structure is instantiated, never invented.
                  The{' '}
                  <a
                    href="https://docs.nika.sh/guides/agent-authoring"
                    target="_blank"
                    rel="noreferrer"
                  >
                    protocol
                  </a>{' '}
                  and the{' '}
                  <a href="https://docs.nika.sh/guides/patterns" target="_blank" rel="noreferrer">
                    patterns guide
                  </a>{' '}
                  is the long form.
                </p>
              </div>
            </aside>
            </div>
          </div>

          {/* the local-run hint · mono machine truth + the copyable install pill.
              The same file you just checked runs on your machine, offline. */}
          <div className="play-local">
            <span className="play-local-label">runs locally:</span>
            <InstallCommand />
            <span className="play-local-then">→ nika run {seed}.nika.yaml</span>
          </div>

          {/* the close · the doc dimension line + forward links */}
          <p className="v4docnote">
            client-only · nothing leaves the tab · the engine&apos;s own NIKA codes, live
          </p>
          <div className="v4doclinks">
            <Link to="/learn" className="v4doclink">
              Learn the file, line by line
              <span aria-hidden className="v4doclink-arrow">
                {' '}
                →
              </span>
            </Link>
            <Link to="/use-cases" className="v4doclink v4doclink--dim">
              See real workflows
              <span aria-hidden className="v4doclink-arrow">
                {' '}
                →
              </span>
            </Link>
            <Link to="/spec" className="v4doclink v4doclink--dim">
              Read the spec
              <span aria-hidden className="v4doclink-arrow">
                {' '}
                →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
