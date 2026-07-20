import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { ssrBlogRails, loadBlogRails } from '../lib/blog-rails-access'
import { useHead } from '@unhead/react'
import { useAnchorScroll } from '../lib/use-anchor-scroll'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { ERROR_CODES, ERROR_INDEX, ERROR_NAMESPACES, type ErrorCodeEntry } from '../content/errors.generated'
import { CODE_REFS } from '../content/graph'
import { SPEC, routeHead } from '../content'
import '../sections/v4-home.css'
import './errors-page.css'

/* ─── /errors + /errors/:code · the error register (theme-dark) ───────────────
   The engine stamps `docs_url: https://nika.sh/errors/<CODE>` on every check
   finding (the rustc --explain move) — THIS is the page those links land on.
   One register page, not 50 thin ones: every registered code as an anchored
   row; the :code deep-link scrolls to its row and highlights it. Unknown
   codes get an honest miss with the recovery links (never a dead end).

   Spec truth: rows come from src/content/errors.generated.ts — a compiled
   projection of public/errors/catalog.json (itself projected from the spec's
   canon.yaml). The machine reads the JSON; humans read this register. Same
   artifact, two renderings — the page can never drift from the wire.

   SSR-safe: /errors AND every /errors/<CODE> page prerender (PATHS +
   ERROR_PATHS in site.config.ts — DO's error_document beats the catchall,
   so a deep link must own its static landing to serve a 200). Highlight +
   the deep-link scroll stay client effects. */

const CATEGORY_GLOSS: Record<string, string> = {
  parse_error: 'the YAML itself is malformed',
  validation_error: 'well-formed input, spec-rule violation',
  variable_error: 'reference resolution / substitution',
  budget_error: 'an agent loop budget exhausted',
  provider_error: 'the model provider failed',
  network_error: 'network I/O failed',
  tool_error: 'a tool invocation failed',
  security_error: 'a security policy refused the effect',
  timeout_error: 'a task or step timed out',
  cancelled: 'cancelled before completion',
  internal_error: 'an engine bug; report it',
}

function nsOf(code: string): string {
  return code.split('-').slice(0, 2).join('-')
}

/* the blog's back-references (D5 · the code:* subset only — 2 edges today,
   the register page stays diet: ONE island carries the whole subset, the
   rails module never joins the entry chunk) */
type BlogRefs = Record<string, { slug: string; title: string; date: string }[]>
const codeSubset = (all: Record<string, { slug: string; title: string; date: string }[]>): BlogRefs =>
  Object.fromEntries(
    Object.entries(all)
      .filter(([k]) => k.startsWith('code:'))
      .map(([k, v]) => [k.slice(5), v]),
  )
function useErrorBlogRefs(): BlogRefs {
  const ssr = ssrBlogRails()
  const payload = useIslandPayload(
    'er-blog-rails',
    ssr ? JSON.stringify(codeSubset(ssr.FROM_BLOG)) : null,
    async () => JSON.stringify(codeSubset((await loadBlogRails()).FROM_BLOG)),
  )
  return payload ? (JSON.parse(payload) as BlogRefs) : {}
}

function CodeRow({
  entry,
  active,
  blogRefs,
}: {
  entry: ErrorCodeEntry
  active: boolean
  blogRefs?: { slug: string; title: string; date: string }[]
}) {
  return (
    <li id={entry.code} className={`er-row${active ? ' er-row--active' : ''}`}>
      <div className="er-row-head">
        <a className="er-code" href={`/errors/${entry.code}`}>
          {entry.code}
        </a>
        <span
          className={`er-cat er-cat--${entry.category}`}
          title={CATEGORY_GLOSS[entry.category] ?? 'see spec 05 · errors'}
        >
          {entry.category}
        </span>
        {entry.transient && (
          <span className="er-transient" title="a retry might succeed (network · 503 · rate limit)">
            ↻ transient
          </span>
        )}
      </div>
      <p className="er-failure">{entry.failure}</p>
      {/* the graph, closed: the words and tools whose pages NAME this code
          point back from here (derived by inverting the rooms' own data —
          graph.ts; a code nothing names carries no line) */}
      {(CODE_REFS[entry.code]?.words.length || CODE_REFS[entry.code]?.tools.length) ? (
        <p className="er-refs mono">
          <span className="er-refs-k">named by</span>
          {CODE_REFS[entry.code].words.map((w) => (
            <Link key={`w:${w}`} className="er-ref" to={`/language/${w}`}>
              {w}
            </Link>
          ))}
          {CODE_REFS[entry.code].tools.map((t) => (
            <Link key={`t:${t}`} className="er-ref" to={`/tools/${t}`}>
              nika:{t}
            </Link>
          ))}
        </p>
      ) : null}
      {/* the sister rail: the posts that write ABOUT this code (D5 inverted ·
          same island the whole register shares) */}
      {blogRefs?.length ? (
        <p className="er-refs mono">
          <span className="er-refs-k">written about</span>
          {blogRefs.map((b) => (
            <Link key={b.slug} className="er-ref" to={`/blog/${b.slug}`}>
              {b.title}
            </Link>
          ))}
        </p>
      ) : null}
    </li>
  )
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { code: rawCode } = useParams()
  const code = rawCode?.toUpperCase()
  const hit = code ? ERROR_INDEX[code] : undefined
  const miss = Boolean(code) && !hit
  const blogByCode = useErrorBlogRefs()

  const groups = useMemo(
    () =>
      ERROR_NAMESPACES.map((ns) => ({
        ns,
        entries: ERROR_CODES.filter((e) => nsOf(e.code) === ns),
      })),
    [],
  )
  const transientCount = useMemo(() => ERROR_CODES.filter((e) => e.transient).length, [])
  const categoryCount = useMemo(() => new Set(ERROR_CODES.map((e) => e.category)).size, [])

  const title = hit
    ? `${hit.code} · Nika error register`
    : code
      ? `${code} · Nika error register`
      : 'Error register · Nika'
  const description = hit
    ? `${hit.code}: ${hit.failure} (${hit.category}${hit.transient ? ' · transient' : ''}). Every Nika error is a typed structure with a stable code.`
    : 'Every registered Nika error code: stable identifiers, categories, and the transient flag the retry machinery reads. Machine twin: /errors/catalog.json.'

  useHead({
    title,
    link: routeHead(code ? `/errors/${code}` : '/errors').link,
    meta: [
      ...routeHead(code ? `/errors/${code}` : '/errors').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
  })

  /* the deep-link lands ON its row — re-aimed until layout settles
     (the one-shot scroll drifted on slow devices · use-anchor-scroll) */
  useAnchorScroll(hit?.code)

  return (
    <main className="theme-dark er-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts):
          on a one-section page the observer armed everything at hydration anyway;
          baking moves the arm to HTML time and the hero stops being a 4.7s LCP. */}
      <section ref={ref} aria-labelledby="er-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
            <Island id="er-blog-rails" payload={JSON.stringify(blogByCode)} />
          <p className="v4sec-fig" data-rise>
            the error register
          </p>
          <h1 id="er-title" className="v4sec-title er-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            {hit ? hit.code : 'Errors.'}
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Every error Nika emits is a <b>typed structure</b>: a stable code, a category, and a{' '}
            <code>transient</code> flag the retry machinery reads. <code>nika check</code> findings
            link here per code. Machines read the same registry at{' '}
            <a href="/errors/catalog.json">/errors/catalog.json</a>; the taxonomy lives in{' '}
            <a href={`${SPEC}/blob/main/spec/05-errors.md`}>spec 05 · errors</a>.
          </p>

          {miss && (
            <div className="er-miss" role="status" data-rise>
              <p className="er-miss-code">{code}</p>
              <p>
                is not a <em>registered</em> code. Engines may mint codes inside a namespace&apos;s
                001-099 range beyond the normative floor below. Check{' '}
                <a href="/errors/catalog.json">the machine registry</a> or the{' '}
                <a href={`${SPEC}/blob/main/spec/05-errors.md`}>spec chapter</a>.
              </p>
            </div>
          )}

          {/* the register's dimensions, at a glance */}
          <StampStrip
            items={[
              { n: ERROR_CODES.length, label: 'codes', sub: 'registered' },
              { n: ERROR_NAMESPACES.length, label: 'namespaces', sub: 'NIKA-*' },
              { n: categoryCount, label: 'categories', sub: 'typed' },
              { n: transientCount, label: 'transient', sub: 'retry-able' },
            ]}
          />

          {groups.map((group, gi) => (
            <div className="er-ns" key={group.ns} data-rise style={{ ['--rise-delay' as string]: `${180 + gi * 30}ms` }}>
              <div className="cl-year-head">
                <span className="cl-year-n er-ns-n">{group.ns}</span>
                <span className="cl-year-rule" aria-hidden />
                <span className="cl-year-count">
                  {group.entries.length} {group.entries.length === 1 ? 'code' : 'codes'}
                </span>
              </div>
              <ol className="er-list">
                {group.entries.map((e) => (
                  <CodeRow key={e.code} entry={e} active={e.code === code} blogRefs={blogByCode[e.code]} />
                ))}
              </ol>
            </div>
          ))}

          <p className="er-foot" data-rise>
            Codes are <b>stable identifiers</b>: never renamed, never repurposed. Route on them
            (<code>retry.on_codes</code> · <code>on_error.on_codes</code>) and they keep meaning the
            same failure forever. <Link to="/spec">Read the spec →</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
