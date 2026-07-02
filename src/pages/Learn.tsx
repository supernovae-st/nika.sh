import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { REPO, SPEC, DOCS, routeHead } from '../content'
import { CodeFile } from '../components/CodeFile'
import { STEPS, ERROR_JSON } from '../content/learn'
import { InstallCommand } from '../components/InstallCommand'
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

   Every YAML/JSON fragment is spec-correct (nika-spec 01-envelope · 03-dag ·
   05-errors) AND parses as standalone YAML/JSON (validated in
   src/test — fragments are shown through the same editor surface as the
   playground). The divergent v3 cosmic chrome is retired.

   SSR-safe: pure DOM (CodeFile is server-rendered · every fragment lives in the
   prerendered HTML); the reveal is one IntersectionObserver on mount, content
   visible by default. Per-route <head> via useHead → dist/learn/index.html. */



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

  useHead({
    title: 'Learn — Nika',
    link: routeHead('/learn').link,
    meta: [
      ...routeHead('/learn').meta,
      {
        name: 'description',
        content:
          'A workflow is a file you can read. Eight small ideas, five minutes — learn to read and write any Nika workflow, one line at a time.',
      },
      { property: 'og:title', content: 'Learn — Nika' },
      {
        property: 'og:description',
        content: 'A workflow is a file you can read — the five-minute walkthrough.',
      },
      { name: 'twitter:title', content: 'Learn — Nika' },
      {
        name: 'twitter:description',
        content: 'A workflow is a file you can read — the five-minute walkthrough.',
      },
    ],
  })

  return (
    <main className="theme-dark v4page">
      <section ref={ref} aria-labelledby="lrn-title" className="v4sec">
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
            FIG L · learn · 5 minutes
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
            A workflow is <b>a file you can read</b>, and eight small ideas make you fluent in
            it. Every fragment below is <b>real</b>, spec-correct YAML, read through the same
            editor surface you&apos;ll use in the playground.
          </p>
          <p className="v4page-stamp" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
            8 steps · spec-correct
          </p>

          {/* the walkthrough · a hairline-ruled step register */}
          <ol className="lrn-steps" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
            {STEPS.map((s) => (
              <li key={s.n} className="lrn-step">
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
                  <CodeFile yaml={s.yaml} filename={s.file} />
                </div>
              </li>
            ))}
          </ol>

          {/* errors are data · the differentiator (a FIG block) */}
          <div className="v4block" data-rise>
            <div className="v4block-head-line">
              <span className="v4block-fig">09 · the failure object</span>
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
                <CodeFile yaml={ERROR_JSON} filename="error.json" lang="json" />
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

          {/* the close · the on-ramp (blueprint, not the .skeuo-brand pill) */}
          <div className="lrn-cta" data-rise>
            <h2 className="lrn-cta-title">That&apos;s the whole language.</h2>
            <p className="lrn-cta-body">
              Eight ideas, four verbs, one file. Install it, write one, run it — or open the
              playground and check your file as you type.
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
              <a href={SPEC} target="_blank" rel="noreferrer" className="v4doclink v4doclink--dim">
                Read the full spec
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
            8 steps · 4 verbs · every fragment spec-correct — real YAML, never pseudo-code
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
