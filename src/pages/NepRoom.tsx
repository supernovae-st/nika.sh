import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { useHead } from '@unhead/react'
import { articleLd, crumbLd, ldScript } from '../lib/ld'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead } from '../content'
import { BlogBody } from '../lib/blog-render'
import type { BlogToken } from '../content/blog.generated'
import { Island } from '../lib/ssg-island'
import { islandJson } from '../lib/island-json'
import { useIslandPayload } from '../lib/use-island-payload'
import { ssrNeps, loadNeps, ssrNepTokens, loadNepTokens } from '../lib/neps-access'
import type { Nep } from '../content/neps.generated'
import '../sections/v4-home.css'
import './page-chrome.css'
import './how-page.css'
import './blog-post.css'
import './tool-detail.css'

/* ─── /language/governance/:slug · one proposal, whole ───────────────────────
   The status is printed FIRST and verbatim: most of these are drafts, and a
   reader who lands from a search must know that before the argument starts.
   The site never decides a NEP's status; it reads the document's own header
   block at the spec pin. */

const REPO = 'https://github.com/supernovae-st/nika-spec/blob/main/governance'

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02 })
  const { pathname } = useLocation()
  const slug = pathname.split('/')[3] ?? ''

  const recPayload = useIslandPayload(
    `nep-rec-${slug}`,
    (() => {
      const m = ssrNeps()
      if (!m) return null
      const at = m.neps.findIndex((n) => n.slug === slug)
      return JSON.stringify({
        row: at >= 0 ? m.neps[at] : null,
        prev: at > 0 ? m.neps[at - 1] : null,
        next: at >= 0 && at < m.neps.length - 1 ? m.neps[at + 1] : null,
        total: m.neps.length,
      })
    })(),
    async () => {
      const m = await loadNeps()
      const at = m.neps.findIndex((n) => n.slug === slug)
      return JSON.stringify({
        row: at >= 0 ? m.neps[at] : null,
        prev: at > 0 ? m.neps[at - 1] : null,
        next: at >= 0 && at < m.neps.length - 1 ? m.neps[at + 1] : null,
        total: m.neps.length,
      })
    },
  )
  const rec = useMemo(
    () =>
      recPayload
        ? (JSON.parse(recPayload) as { row: Nep | null; prev: Nep | null; next: Nep | null; total: number })
        : null,
    [recPayload],
  )
  const nep = rec?.row ?? undefined

  const payload = useIslandPayload(
    `nep-${slug}`,
    (() => {
      const all = ssrNepTokens()
      /* islandJson, not JSON.stringify: these documents are full of permit
         globs, regex and shell, and the SSG assembly reads `$&` as a
         replacement pattern */
      return all ? islandJson(all[slug] ?? []) : null
    })(),
    async () => islandJson((await loadNepTokens())[slug] ?? []),
  )
  const tokens = useMemo<BlogToken[]>(
    () => (payload ? (JSON.parse(payload) as BlogToken[]) : []),
    [payload],
  )

  const known = Boolean(nep)
  const title = known ? `NEP-${nep?.n} · ${nep?.headline} · Nika` : `${slug} · Not a proposal · Nika`
  const description = known
    ? `${nep?.title} Status: ${nep?.status}. A Nika Enhancement Proposal, read whole at the spec pin.`
    : `${slug} names no proposal in the governance record.`

  useHead({
    title,
    link: routeHead(`/language/governance/${slug}`).link,
    meta: [
      ...routeHead(`/language/governance/${slug}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: known
      ? [
          ldScript([
            crumbLd([
              { name: 'The language', path: '/language' },
              { name: 'Governance', path: '/language/governance' },
              { name: `NEP-${nep?.n}` },
            ]),
            articleLd({
              path: `/language/governance/${slug}`,
              name: `NEP-${nep?.n} · ${nep?.headline}`,
              description,
              partOfName: 'The Nika Enhancement Proposals',
              partOfPath: '/language/governance',
            }),
          ]),
        ]
      : [],
  })

  return (
    <main className="theme-dark tp-page td-page">
      <section ref={ref} aria-labelledby="nep-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <Island id={`nep-rec-${slug}`} payload={recPayload ?? ''} />
          <Island id={`nep-${slug}`} payload={payload ?? ''} />

          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/language/governance" className="td-crumb-link">
              ← the proposals
            </Link>
            {nep && (
              <span className="tp-cat">
                {nep.status} · {nep.type}
              </span>
            )}
          </nav>

          {!known ? (
            <>
              <h1 id="nep-title" className="v4sec-title" data-rise>
                Not a proposal.
              </h1>
              <p className="v4sec-lede" data-rise>
                <code>{slug}</code> names no NEP.{' '}
                <Link to="/language/governance">The register</Link> lists every one, in order.
              </p>
            </>
          ) : (
            <>
              <p className="v4sec-fig" data-rise>
                NEP-{nep?.n}
              </p>
              <h1
                id="nep-title"
                className="v4sec-title"
                data-rise
                style={{ ['--rise-delay' as string]: '60ms' }}
              >
                {nep?.headline}
              </h1>
              {/* the status FIRST · a reader landing from a search must know
                  they are reading a proposal before the argument starts */}
              <p className="wf-pin mono" data-rise>
                {nep?.status} · {nep?.type}
                {nep?.created ? ` · opened ${nep.created}` : ''} · {nep?.words} words
              </p>

              <div className="bp-body" data-rise style={{ ['--rise-delay' as string]: '140ms' }}>
                {tokens.length > 0 ? <BlogBody tokens={tokens} /> : <p>Loading the proposal…</p>}
              </div>

              <nav className="td-nav" aria-label="Governance walk" data-rise>
                {rec?.prev ? (
                  <Link className="td-nav-link" to={`/language/governance/${rec.prev.slug}`}>
                    <span className="td-nav-label">← previous</span>
                    NEP-{rec.prev.n}
                  </Link>
                ) : (
                  <span />
                )}
                <Link className="td-nav-link td-nav-link--all" to="/language/governance">
                  <span className="td-nav-label">all {rec?.total}</span>
                  the proposals
                </Link>
                {rec?.next ? (
                  <Link className="td-nav-link td-nav-link--next" to={`/language/governance/${rec.next.slug}`}>
                    <span className="td-nav-label">next →</span>
                    NEP-{rec.next.n}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>

              <div className="v4doclinks" data-rise>
                <a className="v4doclink" href={`${REPO}/${nep?.file ?? ''}`}>
                  This proposal in the spec repo
                  <span aria-hidden className="v4doclink-arrow"> →</span>
                </a>
                <Link to="/language/spec" className="v4doclink">
                  The specification it amends
                  <span aria-hidden className="v4doclink-arrow"> →</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
