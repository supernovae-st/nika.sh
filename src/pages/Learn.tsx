import { useState } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { REPO, SPEC, DOCS, routeHead } from '../content'
import { CodeFile } from '../components/CodeFile'
import '../sections/v4-home.css'
import '../shell/shell.css'
import './page-chrome.css'
import './learn-page.css'

/* ─── /learn · one file, line by line (theme-dark · blueprint register) ───────
   The five-minute annotated walkthrough, brought up to the home + /spec
   register: a near-black blueprint plate, a FIG-numbered masthead, a hairline-
   ruled step register (each step = a numbered head + the plain-words story +
   the premium CodeFile of its real YAML), a HUD frame on the reading column,
   and the typed-error block (the differentiator) rendered in the CodeFile too.

   Every YAML/JSON fragment is spec-correct (nika-spec 01-envelope · 03-dag ·
   05-errors) and now reads through the SAME editor surface as the rest of the
   site. The divergent v3 cosmic chrome (cyan eyebrows · .code-well <pre> ·
   .skeuo CTA) is retired.

   SSR-safe: pure DOM (CodeFile is server-rendered · every fragment lives in the
   prerendered HTML); the reveal is one IntersectionObserver on mount, content
   visible by default. Per-route <head> via useHead → dist/learn/index.html. */

interface Step {
  n: string
  title: string
  plain: string
  yaml: string
  file: string
  note?: string
}

const STEPS: Step[] = [
  {
    n: 'L.1',
    title: 'Two lines make it real',
    plain:
      'Every workflow starts by naming the language and itself. That header is the whole ceremony: no project setup, no boilerplate, no config files.',
    file: 'weekly-radar.nika.yaml',
    yaml: `nika: v1
workflow: weekly-radar`,
    note: 'nika: v1 pins the language contract. Additions are additive; the value never churns.',
  },
  {
    n: 'L.2',
    title: 'Declare what can change',
    plain:
      'Inputs live in vars. A bare value is a default you can override from the command line; a typed var documents itself and gets validated before anything runs.',
    file: 'vars',
    yaml: `vars:
  output_dir: "./radar"
  topic:
    type: string
    required: true
    description: "Subject to research"`,
    note: 'Use it anywhere as ${{ vars.topic }}. Change the input, not the file.',
  },
  {
    n: 'L.3',
    title: 'Pick a brain. Any brain.',
    plain:
      'One line chooses the default model. Local or cloud, same file. Start on your own machine — no key, no cloud — and swap to any cloud provider when you want; nothing else changes.',
    file: 'model',
    yaml: `# fully local · no cloud needed
model: ollama/llama3.1

# or swap to any cloud provider
model: mistral/mistral-large`,
  },
  {
    n: 'L.4',
    title: 'A task is a verb',
    plain:
      'Each task does exactly one thing, with one of the four verbs. This one thinks: it sends a prompt to the model and keeps the answer as its output.',
    file: 'tasks',
    yaml: `tasks:
  - id: digest
    infer:
      prompt: "Summarize in 5 bullets: \${{ tasks.fetch_news.output }}"`,
    note: 'infer thinks · exec runs a command · invoke uses a tool · agent works on its own.',
  },
  {
    n: 'L.5',
    title: 'Order is one word. The graph is free.',
    plain:
      'depends_on is all you write. Tasks with no dependency between them run in parallel automatically. You never schedule anything; the graph falls out of the file.',
    file: 'depends_on',
    yaml: `- id: fetch_news
  invoke:
    tool: "nika:fetch"

- id: repo_log
  exec:
    command: "git log --since='1 week'"

- id: digest
  depends_on: [fetch_news, repo_log]   # waits for BOTH
  infer:
    prompt: "Cross-reference news with our work…"`,
    note: 'fetch_news and repo_log run at the same time. digest waits for both.',
  },
  {
    n: 'L.6',
    title: 'Branch like an adult',
    plain:
      'when: makes a task conditional: a boolean over what already happened. Success-gating is free (depends_on already does it) — when: is for conditions BEYOND it, like a value check.',
    file: 'when',
    yaml: `- id: alert
  depends_on: [check]
  when: \${{ tasks.check.output.errors > 0 }}
  invoke:
    tool: "nika:notify"`,
  },
  {
    n: 'L.7',
    title: 'When things fail, you get data',
    plain:
      'Errors are typed structures: a stable code, a category, and whether retrying could help. Tasks declare their own retry policy and a fallback. No stack-trace archaeology.',
    file: 'retry · on_error',
    yaml: `- id: research
  retry:
    max_attempts: 3
    backoff_ms: 1000
  on_error:
    recover: \${{ tasks.cache.output }}
  infer:
    prompt: "…"`,
    note: 'A failed call retries with backoff; if it still fails, the cached result steps in.',
  },
  {
    n: 'L.8',
    title: 'Name what comes out',
    plain:
      'output: binds pieces of a task result to names; the workflow declares what it returns. Downstream tasks (and you) read clean names, not raw API responses.',
    file: 'output · outputs',
    yaml: `- id: digest
  infer:
    prompt: "…"
  output:
    result: ".choices[0].message.content"

outputs:
  brief: \${{ tasks.digest.output.result }}`,
  },
]

const ERROR_JSON = `{
  "code": "NIKA-INFER-001",
  "category": "provider_error",
  "message": "the model call failed",
  "transient": true,
  "details": {
    "provider": "ollama",
    "status_code": 503,
    "retry_after_secs": 30
  },
  "task_id": "research",
  "attempt": 2
}`

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

const INSTALL_CMD = 'brew install supernovae-st/tap/nika'

/* the monochrome install affordance · the hero's .v4install pattern (shell.css) */
function InstallRow() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(INSTALL_CMD)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="v4install" style={{ marginTop: 18 }}>
      <span className="v4install-cmd">
        <span className="v4install-dollar" aria-hidden>
          ❯
        </span>
        {INSTALL_CMD}
      </span>
      <button
        type="button"
        onClick={copy}
        className="v4install-copy"
        data-copied={copied}
        aria-label={copied ? 'Copied: install command' : 'Copy install command'}
      >
        {copied ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  )
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })

  useHead({
    title: 'Learn · Nika',
    link: routeHead('/learn').link,
    meta: [
      ...routeHead('/learn').meta,
      {
        name: 'description',
        content:
          'One file, line by line. A five-minute annotated walkthrough of a real Nika workflow — every YAML fragment is spec-correct.',
      },
      { property: 'og:title', content: 'Learn · Nika' },
      {
        property: 'og:description',
        content: 'One file, line by line — the five-minute Nika walkthrough.',
      },
      { name: 'twitter:title', content: 'Learn · Nika' },
      {
        name: 'twitter:description',
        content: 'One file, line by line — the five-minute Nika walkthrough.',
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
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Eight small ideas and you can read and write any Nika workflow. Every fragment below
            is <b>real</b>, spec-correct YAML — read through the same editor surface you&apos;ll
            use in the playground.
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
                    <span className="lrn-step-n">{s.n}</span>
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
              <span className="v4block-fig">FIG L.9</span>
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
              playground and validate as you type.
            </p>
            <InstallRow />
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
            8 steps · 4 verbs · every fragment spec-correct — projected, never hand-waved
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
