import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { ssrBlogRails, loadBlogRails } from '../lib/blog-rails-access'
import { ERROR_CODES, ERROR_INDEX } from '../content/errors.generated'
import { CODE_REFS } from '../content/graph'
import { CATEGORY_GLOSS, nsOf } from './errors-shared'
import { SITE, SPEC, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'
import './tool-detail.css'
import './errors-page.css'

/* ─── /errors/:code · one refusal, one room (theme-dark) ──────────────────────
   The engine stamps `docs_url: https://nika.sh/errors/<CODE>` on every
   check finding (the rustc --explain move) — THIS page is where that link
   lands now: a room ABOUT the code, not the whole register re-served with
   a highlight (the duplicate-content class the 2026-07-24 audit named).
   Everything derived: the row from errors.generated (the served catalog's
   projection), the named-by rails from the rooms' own data (CODE_REFS ·
   graph.ts inversion), the blog rail from the D5 island. Unknown codes
   keep the honest miss with recovery doors. Every room prerenders
   (ERROR_PATHS) — deep links land on a real 200. */

type BlogRef = { slug: string; title: string; date: string }
const islandId = (code: string) => `err-room-${code}`

function useCodeBlogRefs(code: string): BlogRef[] {
  const ssr = ssrBlogRails()
  const payload = useIslandPayload(
    islandId(code),
    ssr ? JSON.stringify(ssr.FROM_BLOG[`code:${code}`] ?? []) : null,
    async () => JSON.stringify((await loadBlogRails()).FROM_BLOG[`code:${code}`] ?? []),
  )
  return payload ? (JSON.parse(payload) as BlogRef[]) : []
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { code: rawCode } = useParams()
  const code = (rawCode ?? '').toUpperCase()
  const hit = ERROR_INDEX[code]
  const blogRefs = useCodeBlogRefs(hit?.code ?? '')

  const ns = hit ? nsOf(hit.code) : ''
  const kin = useMemo(() => ERROR_CODES.filter((e) => nsOf(e.code) === ns), [ns])
  const seat = kin.findIndex((e) => e.code === code)
  const at = useMemo(() => ERROR_CODES.findIndex((e) => e.code === code), [code])
  const prev = at > 0 ? ERROR_CODES[at - 1] : undefined
  const next = at >= 0 && at < ERROR_CODES.length - 1 ? ERROR_CODES[at + 1] : undefined
  const refs = hit ? CODE_REFS[hit.code] : undefined

  const title = hit
    ? `${hit.code} · ${hit.failure} · Nika`
    : 'Not a registered code · Nika'
  const description = hit
    ? `${hit.code}: ${hit.failure} (${hit.category}${hit.transient ? ' · transient' : ''}). A typed refusal with a stable code — route on it, never on prose.`
    : `${code} is not a registered Nika error code. The register lists all of them.`

  useHead({
    title,
    link: routeHead(`/errors/${code}`).link,
    meta: [
      ...routeHead(`/errors/${code}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-errors.png' },
      {
        property: 'og:image:alt',
        content: 'The Nika error register: every refusal has a name, a category and a fix shape.',
      },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: hit
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'The error register', item: `${SITE}/errors` },
                  { '@type': 'ListItem', position: 2, name: hit.code },
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'DefinedTerm',
                '@id': `${SITE}/errors/${hit.code}`,
                name: hit.code,
                description,
                url: `${SITE}/errors/${hit.code}`,
                inDefinedTermSet: {
                  '@type': 'DefinedTermSet',
                  name: 'The Nika error register',
                  url: `${SITE}/errors`,
                },
              },
            ]),
            // unhead: don't HTML-escape JSON (keeps it valid ld+json, not &quot;)
            processTemplateParams: false,
          },
        ]
      : [],
  })

  return (
    <main className="theme-dark tp-page td-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="err-title" className="v4sec v4-in" data-code={hit?.code}>
        <div className="v4sec-wrap">
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/errors" className="td-crumb-link">
              ← the error register
            </Link>
            {hit && (
              <span className="tp-cat" title={CATEGORY_GLOSS[hit.category] ?? 'see spec 05 · errors'}>
                {hit.category}
                {hit.transient ? ' · transient' : ''}
              </span>
            )}
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the error register
          </p>
          <h1
            id="err-title"
            className="v4sec-title tp-title"
            data-rise
            style={{ ['--rise-delay' as string]: '80ms' }}
          >
            {hit ? hit.code : code}
          </h1>

          {!hit && (
            <div className="tp-miss" role="status" data-rise>
              <p className="tp-miss-name">{code}</p>
              <p>
                is not a registered code. The registry is closed and versioned: if the engine
                raised it, the binaries disagree — <code>nika --version</code> against{' '}
                <a href="/errors/catalog.json">the served catalog</a>. Walk{' '}
                <Link to="/errors">the register</Link> or <a href={`${SPEC}/blob/main/spec/05-errors.md`}>read spec 05</a>.
              </p>
            </div>
          )}

          {hit && (
            <>
              <Island id={islandId(hit.code)} payload={JSON.stringify(blogRefs)} />

              <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
                {hit.failure}. A typed refusal, one of {ERROR_CODES.length} the registry names:
                stable code, spec category, the transient flag the retry machinery reads. The
                engine stamps this page's address on the finding itself — route on the code,
                never on prose. Machines read <a href="/errors/catalog.json">the catalog</a>.
              </p>

              {/* the code's dimensions, at a glance — every figure derived */}
              <StampStrip
                items={[
                  { n: hit.category, label: 'category', sub: CATEGORY_GLOSS[hit.category] ?? 'spec 05' },
                  hit.transient
                    ? { n: 'transient', label: 'a retry can help', sub: 'network · 503 · rate limit' }
                    : { n: 'stable', label: 'a retry cannot help', sub: 'fix the file, not the timing' },
                  { n: seat + 1, label: `of ${kin.length} in ${ns}`, sub: 'prev / next walk the registry' },
                  { n: ERROR_CODES.length, label: 'registered codes', sub: 'closed · versioned' },
                ]}
              />

              {/* ── hear it from the binary ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
                <div className="cl-year-head">
                  <h2 id="err-explain" className="td-h2">
                    hear it from the binary
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                </div>
                <p className="td-gloss">
                  <code>nika explain {hit.code}</code> answers offline with the failure, the fix
                  shape and this page's address — the same text the check finding carries. A code
                  is a contract: never renamed, never repurposed, safe to route on in{' '}
                  <Link to="/language/on_codes">on_codes</Link> and{' '}
                  <Link to="/language/retry">retry</Link> policy.
                </p>
              </div>

              {/* ── the graph around the code ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '220ms' }}>
                <div className="cl-year-head">
                  <h2 id="err-refs" className="td-h2">
                    cross-references
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                </div>
                <div className="td-refs">
                  {(refs?.words.length || refs?.tools.length) ? (
                    <div>
                      <p className="td-ref-k">the pages that name it</p>
                      <ul className="td-chips">
                        {refs.words.map((w) => (
                          <li key={`w:${w}`}>
                            <Link className="td-chip" to={`/language/${w}`}>
                              {w}
                            </Link>
                          </li>
                        ))}
                        {refs.tools.map((t) => (
                          <li key={`t:${t}`}>
                            <Link className="td-chip" to={`/tools/${t}`}>
                              nika:{t}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="td-none">
                      no word or tool room names this code yet; the registry row is the whole
                      story today.
                    </p>
                  )}
                  {blogRefs.length > 0 && (
                    <div>
                      <p className="td-ref-k">written about</p>
                      <ul className="td-chips">
                        {blogRefs.map((b) => (
                          <li key={b.slug}>
                            <a className="td-chip" href={`/blog/${b.slug}`}>
                              {b.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="td-ref-k">the family it sits in</p>
                    <ul className="td-chips">
                      <li>
                        <Link className="td-chip" to={`/error-namespaces/${ns}`}>
                          {ns}
                        </Link>
                      </li>
                      <li>
                        <Link className="td-chip" to={`/error-categories/${hit.category}`}>
                          {hit.category}
                        </Link>
                      </li>
                      <li>
                        <a className="td-chip" href={`${SPEC}/blob/main/spec/05-errors.md`}>
                          spec 05 · errors
                        </a>
                      </li>
                      <li>
                        <a
                          className="td-chip"
                          href={`https://github.com/search?q=repo%3Asupernovae-st%2Fnika+${hit.code}&type=code`}
                          title="where the engine raises it — live code search"
                        >
                          the engine's own source ↗
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ── the namespace, walked ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '260ms' }}>
                <div className="cl-year-head">
                  <h2 id="err-kin" className="td-h2">
                    the {ns} codes
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                  <span className="cl-year-count">
                    {kin.length} {kin.length === 1 ? 'code' : 'codes'}
                  </span>
                </div>
                <ul className="td-chips">
                  {kin.map((e) => (
                    <li key={e.code}>
                      {e.code === hit.code ? (
                        <span className="td-chip td-chip--here" aria-current="page">
                          {e.code}
                        </span>
                      ) : (
                        <Link className="td-chip" to={`/errors/${e.code}`}>
                          {e.code}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── the walk ── */}
              <nav className="td-nav" aria-label="Error register walk" data-rise>
                {prev ? (
                  <Link className="td-nav-link" to={`/errors/${prev.code}`}>
                    <span className="td-nav-label">← previous</span>
                    {prev.code}
                  </Link>
                ) : (
                  <span />
                )}
                <Link className="td-nav-link td-nav-link--all" to="/errors">
                  <span className="td-nav-label">all {ERROR_CODES.length}</span>
                  the register
                </Link>
                {next ? (
                  <Link className="td-nav-link td-nav-link--next" to={`/errors/${next.code}`}>
                    <span className="td-nav-label">next →</span>
                    {next.code}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>

              <p className="tp-foot" data-rise>
                Break a file on purpose in the <Link to="/play">playground</Link> and watch the
                code arrive typed. <Link to="/boundary">The boundary</Link> teaches the security
                family. <Link to="/spec">Read the spec →</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
