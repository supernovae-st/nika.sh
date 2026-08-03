import { useMemo } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead } from '../content'
import { StampStrip } from '../components/StampStrip'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { ssrNeps, loadNeps } from '../lib/neps-access'
import type { Nep } from '../content/neps.generated'
import { collectionLd, crumbLd, ldScript } from '../lib/ld'
import '../sections/v4-home.css'
import './page-chrome.css'
import './how-page.css'
import './tool-detail.css'

/* ─── /language/governance · how the standard changes ────────────────────────
   governance/ shipped inside the spec pack the whole time and the site
   rendered none of it: 18 numbered proposals, the public process by which
   the language evolves. The specification itself cites them by number, so
   chapter 10 carried a normative heading naming NEP-0017 with no address
   behind it.

   Every proposal gets a room even though most carry Status: Draft. That is
   what numbering a proposal is FOR — in a standards process the draft IS the
   artifact you cite. Each room says its status in the first line, verbatim
   from the document; the site never decides it. */

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02 })
  const payload = useIslandPayload(
    'governance',
    (() => {
      const m = ssrNeps()
      return m ? JSON.stringify(m) : null
    })(),
    async () => JSON.stringify(await loadNeps()),
  )
  const rec = useMemo(
    () =>
      payload
        ? (JSON.parse(payload) as {
            neps: Nep[]
            pin: { spec_commit: string }
            counts: Record<string, number>
          })
        : null,
    [payload],
  )
  const neps = rec?.neps ?? []

  const title = 'Governance · How the standard changes · Nika'
  const description = `The ${neps.length} Nika Enhancement Proposals: the numbered, public, git-versioned documents by which the language evolves. Nobody amends the standard directly, the maintainers included.`

  useHead({
    title,
    link: routeHead('/language/governance').link,
    meta: [
      ...routeHead('/language/governance').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      /* the governance register shares the LANGUAGE card — the NEPs are the
         language's own law (2026-08-04 og arbitrage: family, never home) */
      { property: 'og:image', content: 'https://nika.sh/og-language.png' },
      { property: 'og:image:alt', content: 'The Nika language register: every schema-declared word, one page.' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: [
      ldScript([
        crumbLd([{ name: 'The language', path: '/language' }, { name: 'Governance' }]),
        collectionLd({
          path: '/language/governance',
          name: 'The Nika Enhancement Proposals',
          description,
          total: neps.length,
          members: neps.slice(0, 8).map((n) => ({
            name: `NEP-${n.n}`,
            path: `/language/governance/${n.slug}`,
          })),
        }),
      ]),
    ],
  })

  const standards = neps.filter((n) => /standards/i.test(n.type))
  return (
    <main className="theme-dark tp-page td-page">
      <section ref={ref} aria-labelledby="gov-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <Island id="governance" payload={payload ?? ''} />
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/language" className="td-crumb-link">
              ← the language
            </Link>
            <span className="tp-cat">read at the spec pin</span>
          </nav>

          <p className="v4sec-fig" data-rise>
            governance
          </p>
          <h1
            id="gov-title"
            className="v4sec-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            Nobody amends the standard directly.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Every evolution of the language is a NEP: a numbered, public, git-versioned document
            that argues its case before anything changes. The maintainers are bound by it too.
            Most of these carry <b>Draft</b>, and that is the normal state of a proposal in a
            standards process: the number exists so the argument can be cited while it is still
            being had.
          </p>

          <StampStrip
            items={[
              { n: neps.length, label: 'proposals', sub: 'numbered and public' },
              { n: standards.length, label: 'standards track', sub: 'they change the language' },
              { n: neps.length - standards.length, label: 'process', sub: 'they change the process' },
              { n: 'git', label: 'the archive', sub: 'nothing is amended in place' },
            ]}
          />

          <div className="how-subs" data-rise>
            <p className="how-fig mono">the proposals</p>
            <h2 className="how-h1">Read them in order</h2>
            <p className="how-body">
              NEP-0000 is the process itself: what a proposal must argue, who decides, and what
              happens to a rejected one. The rest are numbered in the order they were opened.
            </p>
            <ol className="td-args tp-args">
              {neps.map((n) => (
                <li className="tp-arg" key={n.slug} style={{ listStyle: 'none' }}>
                  <span className="tp-arg-name">
                    <Link to={`/language/governance/${n.slug}`}>NEP-{n.n}</Link>
                  </span>
                  <span className="tp-arg-desc">
                    {n.headline}
                    <br />
                    <span className="mono">
                      {n.status} · {n.type}
                      {n.created ? ` · ${n.created}` : ''} · {n.sections.length} sections
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="v4doclinks" data-rise>
            <Link to="/language/spec" className="v4doclink">
              The specification they amend
              <span aria-hidden className="v4doclink-arrow"> →</span>
            </Link>
            <a
              className="v4doclink"
              href="https://github.com/supernovae-st/nika-spec/tree/main/governance"
            >
              Propose one
              <span aria-hidden className="v4doclink-arrow"> →</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
