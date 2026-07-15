import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { REPO, SPEC, DOCS, routeHead } from '../content'
import { CodeFile } from '../components/CodeFile'
import { DecodeText } from '../fx/DecodeText'
import { tokenize } from '../components/codefile-highlight'
import { STEPS, ERROR_JSON, DICT, FULL_FILE, FULL_FILE_TRANSCRIPT } from '../content/learn'
import { LearnCheck } from '../components/LearnCheck'
import { InstallCommand } from '../components/InstallCommand'
import { TermCapture } from '../components/TermCapture'
import { track } from '../lib/track'
import '../sections/v4-home.css'
import '../shell/shell.css'
import './page-chrome.css'
import './learn-page.css'

/* ─── /learn · one file, line by line (theme-dark · blueprint register) ───────
   The five-minute annotated walkthrough in the consumer register: it starts
   from « a workflow is a file you can read », every concept is glossed in
   plain words BEFORE its term is used (per the consumer glossary — verbs
   always glossed · the DAG is « the plan »), and each step carries a
   museum-plate number (`01 · the file`, `05 · the plan` …).

   Step 06 (« the waves ») is the 2D-DAG comprehension anchor: a hand-authored
   static SVG of the weekly-radar plan, node-for-node the YAML beside it
   (5 tasks · verb-hued dots · wave bracket · thin blue dependency arrows),
   aria-described for readers who never see the drawing.

   Every YAML/JSON fragment is spec-correct (nika-spec 01-envelope · 03-dag ·
   05-errors) AND parses as standalone YAML/JSON (validated in
   src/test — fragments are shown through the same editor surface as the
   playground). The divergent v3 cosmic chrome is retired.

   SSR-safe: pure DOM (CodeFile is server-rendered · every fragment lives in the
   prerendered HTML); the reveal is one IntersectionObserver on mount, content
   visible by default. Per-route <head> via useHead → dist/learn/index.html. */



/* ── LearnFile · the /learn-scoped plain-words hover dictionary ───────────────
   A Learn-only wrapper around CodeFile (the component defaults stay
   untouched): hovering any known key or verb token inside the panel shows a
   one-line anyone-words gloss in a seam-kit micro-panel, and a row of
   focusable term chips under the panel carries the SAME glosses to keyboard
   and touch readers (focus a chip · the tooltip is a polite live region, so
   the gloss is announced). Terms come from the tokenizer itself — a chip
   exists only for a key that really appears in the fragment. */
function LearnFile({ yaml, filename }: { yaml: string; filename?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<{ term: string; x: number; y: number } | null>(null)

  /* the terms this fragment actually contains (tokenizer truth, not regex) */
  const terms = useMemo(() => {
    const seen = new Set<string>()
    for (const line of tokenize(yaml))
      for (const t of line.tokens)
        if ((t.kind === 'key' || t.kind === 'verb') && DICT[t.text]) seen.add(t.text)
    return [...seen]
  }, [yaml])

  const show = (term: string, el: Element) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const wr = wrap.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const half = Math.min(150, wr.width / 2 - 4)
    const x = Math.min(Math.max(r.left - wr.left + r.width / 2, half), wr.width - half)
    setTip({ term, x, y: r.top - wr.top })
  }

  /* pointer over a known key/verb token inside the panel lights the gloss */
  const onMove = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.lrn-dict')) return // the chips drive their own tip
    const tok = target.closest('.cf-key, .cf-verb')
    const term = tok?.textContent?.replace(/[^a-z_]/g, '') ?? ''
    if (tok && DICT[term]) {
      if (tip?.term !== term) show(term, tok)
    } else if (tip) {
      setTip(null)
    }
  }

  /* Escape dismisses the gloss WITHOUT moving the pointer (WCAG 1.4.13
     dismissable) — the wrapper's own onKeyDown only fires while focus sits
     inside it, which a hover-only reader never grants. Document-level and
     armed only while a tip is open, so the listener costs nothing at rest. */
  useEffect(() => {
    if (!tip) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTip(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [tip])

  return (
    <div
      ref={wrapRef}
      className="lrn-file"
      onPointerMove={onMove}
      onPointerLeave={() => setTip(null)}
    >
      <CodeFile yaml={yaml} filename={filename} wrap tips />
      {terms.length > 0 && (
        <ul className="lrn-dict" aria-label="plain words for the keys in this file">
          {terms.map((term) => (
            <li key={term} className="lrn-dict-item">
              <button
                type="button"
                className="lrn-dict-chip"
                onPointerEnter={(e) => show(term, e.currentTarget)}
                onPointerLeave={() => setTip(null)}
                onFocus={(e) => show(term, e.currentTarget)}
                onBlur={() => setTip(null)}
              >
                {term}
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* the micro-panel · a polite live region (focus announces the gloss) */}
      <div
        className="lrn-tip"
        role="status"
        data-on={tip ? '1' : '0'}
        style={tip ? { left: tip.x, top: tip.y } : undefined}
      >
        {tip && (
          <>
            <b>{tip.term}</b> · {DICT[tip.term]}
          </>
        )}
      </div>
    </div>
  )
}

/* ── the weekly-radar mini-DAG · the 2D comprehension anchor (step 06) ────────
   HONEST: node-for-node the YAML fragment beside it — five tasks, the three
   sources (no wires in) sharing one wave, digest joining them, save closing.
   Hand-authored static SVG (no runtime), verb-hued node dots, thin accent
   dependency arrows, a wave bracket reading « run together ×3 ». Text is real
   SVG text (crisp at every DPR); on narrow screens the plate scrolls inside
   its well exactly like a code panel. */
const DAG_NODES: { id: string; verb: string; x: number; y: number; w: number }[] = [
  { id: 'fetch_news', verb: 'invoke', x: 22, y: 34, w: 172 },
  { id: 'repo_log', verb: 'exec', x: 22, y: 98, w: 172 },
  { id: 'read_notes', verb: 'invoke', x: 22, y: 162, w: 172 },
  { id: 'digest', verb: 'infer', x: 318, y: 98, w: 146 },
  { id: 'save', verb: 'invoke', x: 546, y: 98, w: 118 },
]

/* one dependency arrow per with: wire in the fragment · nothing more */
const DAG_ARROWS = [
  'M196 54 C 246 54, 262 106, 312 108', // fetch_news → digest
  'M196 118 H 312', //                     repo_log   → digest
  'M196 182 C 246 182, 262 130, 312 128', // read_notes → digest
  'M464 118 H 540', //                     digest     → save
]

function WeeklyRadarDag() {
  return (
    <figure className="lrn-dag">
      <div className="lrn-dag-scroll" tabIndex={0} role="group" aria-label="the drawn plan (scrolls sideways on small screens)">
        <svg
          className="lrn-dag-svg"
          viewBox="0 0 680 248"
          role="img"
          aria-labelledby="lrn-dag-t lrn-dag-d"
        >
          <title id="lrn-dag-t">The weekly-radar plan, drawn as a graph</title>
          <desc id="lrn-dag-d">
            fetch_news, repo_log and read_notes wait on nothing, so all three run at the same
            time. digest waits for all three. save waits for digest. Time flows left to right.
          </desc>
          <defs>
            <marker
              id="lrn-dag-head"
              viewBox="0 0 8 8"
              refX="6.6"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path className="lrn-dag-headink" d="M0.8 0.8 L6.8 4 L0.8 7.2" />
            </marker>
          </defs>

          {/* the column captions · what each wave means, in anyone-words */}
          <text className="lrn-dag-cap" x="108" y="18" textAnchor="middle">
            run together ×3
          </text>
          <text className="lrn-dag-cap" x="391" y="18" textAnchor="middle">
            waits for all three
          </text>
          <text className="lrn-dag-cap" x="605" y="18" textAnchor="middle">
            then
          </text>

          {/* the wave bracket · the three steps that share a start line */}
          <path className="lrn-dag-bracket" d="M13 36 H8 V200 H13" />

          {/* the dependency arrows · one per with: wire */}
          {DAG_ARROWS.map((d) => (
            <path key={d} className="lrn-dag-arrow" d={d} markerEnd="url(#lrn-dag-head)" />
          ))}

          {/* the five task nodes · verb-hued dot + mono id + the verb name */}
          {DAG_NODES.map((n) => (
            <g key={n.id}>
              <rect className="lrn-dag-node" x={n.x} y={n.y} width={n.w} height={40} rx={4} />
              <circle
                className="lrn-dag-dot"
                cx={n.x + 16}
                cy={n.y + 20}
                r={3.4}
                style={{ fill: `var(--verb-${n.verb})` }}
              />
              <text className="lrn-dag-id" x={n.x + 27} y={n.y + 24.5}>
                {n.id}
              </text>
              <text className="lrn-dag-verb" x={n.x + n.w - 10} y={n.y + 24} textAnchor="end">
                {n.verb}
              </text>
            </g>
          ))}

          {/* the time axis whisper · left to right is the only direction */}
          <text className="lrn-dag-cap" x="658" y="242" textAnchor="end">
            time →
          </text>
        </svg>
      </div>
      <figcaption className="lrn-dag-capline">
        the plan the runtime draws from this exact file · every arrow points from a step to the
        step that waits for it
      </figcaption>
    </figure>
  )
}

const ERROR_FIELDS: { key: string; gloss: React.ReactNode }[] = [
  {
    key: 'code',
    gloss: 'a stable, greppable identifier. The same failure always has the same name.',
  },
  {
    key: 'transient',
    gloss: 'true means retry might work. The engine retries with backoff before giving up.',
  },
  {
    key: 'details',
    gloss: (
      <>
        structured fields, not prose. Your <code>on_error:</code> can act on them.
      </>
    ),
  },
]

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })

  /* the funnel beat · reaching the close = the walk was completed (A6:
     learn-done). Fires once; track() no-ops when analytics is absent. */
  const ctaRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ctaRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          track('learn-done')
          io.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useHead({
    title: 'Learn · Nika',
    link: routeHead('/learn').link,
    meta: [
      ...routeHead('/learn').meta,
      {
        name: 'description',
        content:
          'A workflow is a file you can read. Nine small ideas, five minutes: learn to read and write any Nika workflow, one line at a time.',
      },
      { property: 'og:title', content: 'Learn · Nika' },
      {
        property: 'og:description',
        content: 'A workflow is a file you can read · the five-minute walkthrough.',
      },
      { property: 'og:image', content: 'https://nika.sh/og-learn.png' },
      {
        property: 'og:image:alt',
        content: 'Learn Nika · one file, line by line. Nine small ideas make you fluent in real, spec-correct YAML.',
      },
      { name: 'twitter:title', content: 'Learn · Nika' },
      {
        name: 'twitter:description',
        content: 'A workflow is a file you can read · the five-minute walkthrough.',
      },
      { name: 'twitter:image', content: 'https://nika.sh/og-learn.png' },
    ],
  })

  return (
    <main className="theme-dark v4page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts):
          on a one-section page the observer armed everything at hydration anyway;
          baking moves the arm to HTML time and the hero stops being a 4.7s LCP. */}
      <section ref={ref} aria-labelledby="lrn-title" className="v4sec v4-in">
        {/* the HUD registration frame on the reading column (decorative) */}
        <div className="v4hud" aria-hidden>
          <span className="v4hud-mark v4hud-mark--tl" />
          <span className="v4hud-mark v4hud-mark--tr" />
          <span className="v4hud-mark v4hud-mark--bl" />
          <span className="v4hud-mark v4hud-mark--br" />
          <span className="v4hud-tick v4hud-tick--l" />
          <span className="v4hud-tick v4hud-tick--r" />
        </div>

        <div className="v4sec-wrap">
          {/* the masthead */}
          <p className="v4sec-fig" data-rise>
            learn · 5 minutes
          </p>
          <h1
            id="lrn-title"
            className="v4sec-title lrn-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            One file, line by line.
          </h1>
          {/* the punch lede (F7) · the catchy line ABOVE the consumer TL;DR */}
          <p className="v4punch" data-rise style={{ ['--rise-delay' as string]: '90ms' }}>
            Read one file. Understand everything.
          </p>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            A workflow is <b>a file you can read</b>, and nine small ideas make you fluent in
            it. Every fragment below is <b>real</b>, spec-correct YAML, read through the same
            editor surface you&apos;ll use in the playground.
          </p>
          <p className="v4page-stamp" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
            9 steps · spec-correct
          </p>

          {/* the walkthrough · a hairline-ruled step register */}
          <ol className="lrn-steps" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
            {STEPS.map((s) => (
              /* id + data-sec: each step is an anchor target AND a wayfinding
                 mark — the site rail reads the list as [ 01 ]…[ 09 ] (the
                 fig falls back to the index; the name comes from the h2) */
              <li key={s.n} className="lrn-step" id={`step-${s.n}`} data-sec="">
                <div>
                  <div className="lrn-step-head">
                    <span className="lrn-step-n">
                      {s.n} · {s.topic}
                    </span>
                    <h2 className="lrn-step-title">{s.title}</h2>
                  </div>
                  <p className="lrn-step-plain">{s.plain}</p>
                  {s.note && <p className="lrn-step-note">{s.note}</p>}
                </div>
                <div className="lrn-step-code">
                  <LearnFile yaml={s.yaml} filename={s.file} />
                </div>
                {s.dag && <WeeklyRadarDag />}
                {/* I7 · the inline check — one per step MAX, only where a
                    misread is likely (the data decides; zero here is fine) */}
                {s.check && <LearnCheck check={s.check} />}
              </li>
            ))}
          </ol>

          {/* errors are data · the differentiator (a FIG block). Unnumbered on
              purpose: it deepens idea 08, it is not a tenth idea — the count
              stays « nine ideas + one file » (the whole-file below is 10). */}
          <div className="v4block" data-rise>
            <div className="v4block-head-line">
              <span className="v4block-fig"><DecodeText text="aside · the failure object" /></span>
              <h2 className="v4block-name">Errors are data, not noise.</h2>
              <span className="v4block-count">typed · greppable</span>
            </div>
            <p className="v4block-cap">
              Every failure is a typed structure with a stable code, a category, and a{' '}
              <code>transient</code> flag that says whether retrying could help. Your workflow can
              read errors the same way it reads any other value, and recover.
            </p>
            <div className="lrn-err-grid">
              <div className="lrn-err-code">
                <CodeFile yaml={ERROR_JSON} filename="error.json" lang="json" wrap />
              </div>
              <ul className="lrn-err-fields">
                {ERROR_FIELDS.map((f) => (
                  <li className="lrn-err-field" key={f.key}>
                    <code className="lrn-err-field-key">{f.key}</code>
                    <span className="lrn-err-field-gloss">{f.gloss}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* the whole file · the nine fragments assembled, checked by the engine.
              The transcript is VERBATIM binary output (content/learn.ts). */}
          <div className="lrn-full" data-rise>
            <p className="lrn-full-fig mono">10 · the whole file</p>
            <h2 className="lrn-full-title">Every idea above, in one file</h2>
            <p className="lrn-full-body">
              The nine fragments compose into the workflow this page has been teaching. This
              exact text passes the engine&apos;s audit; the verdict below is{' '}
              <code className="mono">nika check</code>&apos;s real answer, and its hints are
              your next three lessons.
            </p>
            <div className="lrn-full-pair">
              <div className="lrn-frame v4-frame-canvas">
                <LearnFile yaml={FULL_FILE} filename="weekly-radar.nika.yaml" />
              </div>
              <TermCapture title="what the engine says" lines={FULL_FILE_TRANSCRIPT} command="nika check weekly-radar.nika.yaml" />
            </div>
          </div>

          {/* the close · the on-ramp (blueprint, not the .skeuo-brand pill) */}
          <div ref={ctaRef} className="lrn-cta" data-rise>
            <h2 className="lrn-cta-title">That&apos;s the whole language.</h2>
            <p className="lrn-cta-body">
              Nine ideas, four verbs, one file. Install it, write one, run it, or open the
              playground and check your file as you type. Or send us the task you repeat and
              get it back as a file.
            </p>
            <div style={{ marginTop: 18 }}>
              <InstallCommand />
            </div>
            <div className="v4doclinks">
              <Link to="/play" className="v4doclink">
                Open the playground
                <span aria-hidden className="v4doclink-arrow">
                  {' '}
                  →
                </span>
              </Link>
              <Link to="/convert" className="v4doclink" data-track="convert-open">
                Send us a workflow
                <span aria-hidden className="v4doclink-arrow">
                  {' '}
                  →
                </span>
              </Link>
              <a href={SPEC} target="_blank" rel="noreferrer" className="v4doclink v4doclink--dim">
                Read the full spec
                <span aria-hidden className="v4doclink-arrow">
                  {' '}
                  ↗
                </span>
              </a>
              <a href={`${DOCS}/guides/cost-honesty`} target="_blank" rel="noreferrer" className="v4doclink v4doclink--dim">
                What a run costs, before you run it
                <span aria-hidden className="v4doclink-arrow">
                  {' '}
                  ↗
                </span>
              </a>
              <a href={`${DOCS}/examples/model-bench`} target="_blank" rel="noreferrer" className="v4doclink v4doclink--dim">
                Pick a local model on measured facts
                <span aria-hidden className="v4doclink-arrow">
                  {' '}
                  ↗
                </span>
              </a>
              <a href={DOCS} target="_blank" rel="noreferrer" className="v4doclink v4doclink--dim">
                Full docs
                <span aria-hidden className="v4doclink-arrow">
                  {' '}
                  ↗
                </span>
              </a>
              <a href={REPO} target="_blank" rel="noreferrer" className="v4doclink v4doclink--dim">
                <span aria-hidden className="v4doclink-glyph">
                  ★
                </span>
                Star on GitHub
              </a>
            </div>
          </div>

          {/* the doc dimension line + the page footer */}
          <p className="v4docnote" data-rise>
            9 steps · 4 verbs · every fragment spec-correct · real YAML, never pseudo-code
          </p>
          <footer className="v4docfoot">
            <span className="v4docfoot-brand">
              <img src="/nika.svg" alt="" width={13} height={13} />
              nika · by SuperNovae · AGPL forever
            </span>
            <Link to="/">← supernovae</Link>
          </footer>
        </div>
      </section>
    </main>
  )
}
