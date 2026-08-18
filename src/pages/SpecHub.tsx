import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead, SPEC } from '../content'
import { StampStrip } from '../components/StampStrip'
import { CHAPTERS, CHAPTERS_PIN } from '../content/chapters.generated'
import '../sections/v4-home.css'
import './page-chrome.css'
import './how-page.css'
import './workflows-page.css'
import './chapter-page.css'
import { collectionLd, ldScript } from '../lib/ld'

/* ─── /language/spec · the specification, chapter by chapter ─────────────────
   The old /spec was one page for the whole document: eighteen chapters in a
   single scroll, a 3D machine for a hero, and no citable address for any
   chapter. The machine is gone with the page (the operator's nuke mandate)
   and the pack is a register now — which is what a specification is.

   Every figure derives from the vendored pack at the pin. */

const WORDS = CHAPTERS.reduce((n, c) => n + c.words, 0)
const SECTIONS = CHAPTERS.reduce((n, c) => n + c.sections.length, 0)

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02 })
  const title = 'The specification · Nika'
  const description =
    'The Nika language specification, chapter by chapter: the envelope, the four verbs, the flow, variables, errors, conformance. Every chapter citable, read at the pin, with its own digest.'
  useHead({
    title,
    link: routeHead('/language/spec').link,
    script: [
      ldScript([
        collectionLd({
          path: '/language/spec',
          name: 'The Nika workflow language specification',
          description,
          total: CHAPTERS.length,
          members: CHAPTERS.slice(0, 8).map((c) => ({
            name: c.title,
            path: `/language/spec/${c.slug}`,
          })),
        }),
      ]),
    ],
    meta: [
      ...routeHead('/language/spec').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      /* the reference hub wears the reference card (2026-08-04 og arbitrage) */
      { property: 'og:image', content: 'https://nika.sh/og-spec.png' },
      { property: 'og:image:alt', content: 'The nika language reference: the contract an agent must satisfy before it acts.' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
  })

  return (
    <main className="theme-dark tp-page td-page">
      <section ref={ref} aria-labelledby="sp-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/language" className="td-crumb-link">
              ← the language
            </Link>
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the specification
          </p>
          <h1 id="sp-title" className="v4sec-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            One envelope, four verbs, one graph.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            The whole language, written down: the nine-key envelope and everything under it. Each chapter has
            its own page and its own digest, so you can cite the paragraph you mean instead of
            linking a document and hoping. Read at the pin, never retyped.
          </p>

          <StampStrip
            items={[
              { n: CHAPTERS.length, label: 'chapters', sub: 'each citable' },
              { n: SECTIONS, label: 'sections', sub: 'anchored' },
              { n: WORDS, label: 'words', sub: 'normative' },
            ]}
          />

          <ol className="wf-path" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
            {CHAPTERS.map((c) => (
              <li key={c.slug}>
                <Link to={`/language/spec/${c.slug}`} className="wf-step">
                  <span className="wf-step-n">{String(c.n).padStart(2, '0')}</span>
                  <span className="wf-step-copy">
                    <span className="wf-step-title">{c.title}</span>
                    {c.lede && <span className="ch-row-lede">{c.lede}</span>}
                    <span className="wf-step-file mono">
                      {c.sections.length} sections · {c.words} words
                    </span>
                  </span>
                  <span className="how-sub-go" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          <p className="wf-pin mono" data-rise>
            read at nika-spec@{CHAPTERS_PIN.spec_commit.slice(0, 9)} · every chapter carries its own
            sha256 ·{' '}
            <a href={SPEC} target="_blank" rel="noreferrer">
              the pack upstream
            </a>
          </p>

          <div className="v4doclinks" data-rise>
            <Link to="/language" className="v4doclink">
              Every word the schema declares
              <span aria-hidden className="v4doclink-arrow"> →</span>
            </Link>
            <Link to="/workflows/path/01-hello" className="v4doclink">
              Or start from a file
              <span aria-hidden className="v4doclink-arrow"> →</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
