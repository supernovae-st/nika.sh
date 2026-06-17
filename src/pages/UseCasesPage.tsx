import { useEffect, useState } from 'react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { CodeFile } from '../components/CodeFile'
import { verbGlyph, type NikaVerb } from '../components/codefile-highlight'
import {
  UC_TABS,
  verbsFor,
  yamlFor,
  fileFor,
  docsFor,
  type UC,
  type UCTab,
} from '../sections/usecases-data'
import { SHOWCASE_YAML } from '../sections/usecases-yaml.generated'
import { REPO, SPEC, routeHead } from '../content'
import '../sections/v4-home.css'
import './usecases-page.css'

/* ─── /use-cases · the full editorial gallery (theme-light · blueprint) ────────
   Design doc §7 (Routes · /use-cases) + FIG 6.0. The HOME teaser (UseCasesV4)
   shows ONE métier at a time with ONE open YAML panel; THIS page is the fuller
   gallery — every métier, every workflow, each with its title + outcome + verb
   chips + its real YAML open inline. A reader can scan the whole showcase surface
   on one page instead of clicking tab-by-tab.

   Same light-theme blueprint register as the home section (FIG numbering,
   hairline rules, tabular-nums, the monochrome verb-glyph whisper). A sticky
   métier rail lets you jump; each workflow card opens its file via <CodeFile>.

   Spec truth: every YAML comes from SHOWCASE_YAML (projected from nika-spec
   showcase via the projector · never hand-typed). The verb chips DERIVE from the
   projected DAG (verbsFor) — never hand-listed. The data (UC_TABS, helpers) is
   reused from usecases-data.ts, not duplicated.

   SSR-safe: pure DOM (CodeFile renders static <pre>/<code> · all files live in
   the prerendered HTML for SEO + an instant paint). The reveal is an
   IntersectionObserver added on mount, content visible by default. Per-route
   <head> via useHead → prerendered into dist/use-cases/index.html. */

/* the 4 verb hues → the per-chip --vh custom prop (drives the glyph whisper). */
const VERB_HUE: Record<NikaVerb, string> = {
  infer: 'var(--verb-infer)',
  exec: 'var(--verb-exec)',
  invoke: 'var(--verb-invoke)',
  agent: 'var(--verb-agent)',
}

/* a single workflow · its title, outcome, verb chips, and its real open YAML. */
function WorkflowCard({ uc, fig }: { uc: UC; fig: string }) {
  const cardVerbs = verbsFor(uc) as NikaVerb[]
  const yaml = yamlFor(uc)
  return (
    <article className="ucp-wf">
      <header className="ucp-wf-head">
        <span className="ucp-wf-fig">{fig}</span>
        <h3 className="ucp-wf-title">{uc.title}</h3>
        <span className="ucp-wf-tier" title={`Complexity tier ${uc.tier.slice(1)} of 4`}>
          {uc.tier}
        </span>
      </header>

      <p className="ucp-wf-body">{uc.body}</p>

      <span className="ucp-verbs">
        {cardVerbs.map((v) => (
          <span key={v} className="ucp-verb" style={{ ['--vh' as string]: VERB_HUE[v] }}>
            <span className="ucp-verb-glyph" aria-hidden>
              {verbGlyph(v)}
            </span>
            {v}
          </span>
        ))}
      </span>

      <div className="ucp-wf-file">
        <div className="ucp-wf-filemeta">
          <span className="ucp-wf-filename">
            <span aria-hidden className="ucp-wf-prompt">
              ❯{' '}
            </span>
            <b>{fileFor(uc)}</b>
          </span>
          <a className="ucp-wf-walk" href={docsFor(uc)} target="_blank" rel="noreferrer">
            walkthrough ↗
          </a>
        </div>
        <div className="ucp-wf-code">
          <CodeFile yaml={yaml} />
        </div>
      </div>

      <p className="ucp-wf-outcome">
        <span className="ucp-arrow" aria-hidden>
          →
        </span>
        {uc.outcome}
      </p>
    </article>
  )
}

/* a métier section · the hook + the grid of its workflows. */
function MetierSection({ tab, index }: { tab: UCTab; index: number }) {
  return (
    <section id={tab.id} className="ucp-metier scroll-mt-28" aria-labelledby={`m-${tab.id}`}>
      <div className="ucp-metier-head">
        <p className="ucp-metier-fig">
          FIG 6.{index + 1}
          <span className="ucp-metier-count">
            {tab.cases.length} {tab.cases.length === 1 ? 'workflow' : 'workflows'}
          </span>
        </p>
        <h2 id={`m-${tab.id}`} className="ucp-metier-title">
          {tab.label}
        </h2>
        <p className="ucp-metier-hook">{tab.hook}</p>
      </div>

      <div className="ucp-grid">
        {tab.cases.map((uc, i) => (
          <WorkflowCard key={uc.slug} uc={uc} fig={`6.${index + 1}.${i + 1}`} />
        ))}
      </div>
    </section>
  )
}

export function Component() {
  /* reveal the page once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -6% 0px' })
  const [active, setActive] = useState(UC_TABS[0]?.id ?? '')

  useHead({
    title: 'Use cases · Nika',
    link: routeHead('/use-cases').link,
    meta: [
      ...routeHead('/use-cases').meta,
      {
        name: 'description',
        content:
          'Real Nika plans across five métiers — builders, research, content, ops and business. Each is reviewable before it acts and permission-bound, projected from the spec showcase: title, outcome, verbs and the exact YAML that runs it.',
      },
      { property: 'og:title', content: 'Use cases · Nika' },
      {
        property: 'og:description',
        content:
          'Real Nika workflows across five métiers, each with the exact spec-valid YAML that runs it.',
      },
      { name: 'twitter:title', content: 'Use cases · Nika' },
      {
        name: 'twitter:description',
        content:
          'Real Nika workflows across five métiers, each with the exact spec-valid YAML that runs it.',
      },
    ],
  })

  /* highlight the rail anchor for the métier currently in view (scroll-spy) */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sections = UC_TABS.map((t) => document.getElementById(t.id)).filter(
      (el): el is HTMLElement => el != null,
    )
    if (sections.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.target.id) setActive(e.target.id)
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  const total = Object.keys(SHOWCASE_YAML).length

  return (
    <main className="theme-light ucp-page">
      <section ref={ref} aria-labelledby="ucp-title" className="v4sec">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            FIG 6.0 · the gallery
          </p>
          <h1
            id="ucp-title"
            className="v4sec-title ucp-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            Real plans you&apos;d review.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Anything you&apos;d ask an AI to do more than once belongs in a file you can{' '}
            <b>read before it acts</b> — reviewable, permission-bound, replayable. Every workflow
            below is <b>real</b>, projected from <code className="mono">nika-spec</code> and passing
            the conformance gate. Five métiers, {total} workflows, each with the exact YAML that
            runs it.
          </p>

          {/* the métier rail · sticky anchor jumps (scroll-spy highlights the
              section in view). Plain in-page anchors → no JS needed to navigate. */}
          <nav className="ucp-rail" aria-label="Métiers" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
            {UC_TABS.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="ucp-rail-link"
                aria-current={active === t.id ? 'true' : undefined}
              >
                {t.label}
                <span className="ucp-rail-n">{t.cases.length}</span>
              </a>
            ))}
          </nav>

          {/* every métier, every workflow — the full gallery */}
          <div className="ucp-metiers" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
            {UC_TABS.map((t, i) => (
              <MetierSection key={t.id} tab={t} index={i} />
            ))}
          </div>

          {/* the close · the spec-truth dimension line + forward links */}
          <p className="ucp-note">
            {total} workflows · four tiers ·{' '}
            <a
              href="https://github.com/supernovae-st/nika-spec/tree/main/examples/showcase"
              target="_blank"
              rel="noreferrer"
            >
              nika-spec/examples/showcase
            </a>{' '}
            — schema, DAG cross-refs and stdlib surface all gated
          </p>

          <div className="ucp-links">
            <a href={SPEC} target="_blank" rel="noreferrer" className="ucp-link">
              Read the spec
              <span aria-hidden className="ucp-link-arrow">
                {' '}
                ↗
              </span>
            </a>
            <Link to="/play" className="ucp-link ucp-link--dim">
              Try one in the playground
              <span aria-hidden className="ucp-link-arrow">
                {' '}
                →
              </span>
            </Link>
            <a href={REPO} target="_blank" rel="noreferrer" className="ucp-link ucp-link--dim">
              <span aria-hidden className="ucp-link-glyph">
                ★
              </span>
              Star on GitHub
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
