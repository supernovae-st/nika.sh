import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
/* lz-string is CJS — named ESM imports break the Node prerender (SSG);
   the default import is the law (Play.tsx · ScrollMorph.tsx) */
import lz from 'lz-string'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { CodeFile } from '../components/CodeFile'
import { PlanMap } from '../components/PlanMap'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { ssrShowcaseYaml, loadShowcaseYaml } from '../sections/showcase-yaml-access'
import { buildLibrary, verbsOf, BROWSE_SLUGS, type LibraryItem } from '../flagships/library'
import { SITE, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'
import './tool-detail.css'

/* ─── /library/:id · one library file, one room (theme-dark) ──────────────────
   The hero's picking corpus (wave K) earns real pages: ten files, each a
   room — the file whole, its plan in the site's ONE plan grammar
   (PlanMap), and the honesty contract on its face: a recorded flagship
   may say « recorded from a real nika run »; a browse-only file reads
   with `nika run <file>` as the honest affordance, never a fabricated
   replay. The browse yamls ride the showcase island (register-diet law ·
   Home's own recipe). Every room prerenders (LIBRARY_PATHS). */

const islandId = (id: string) => `lib-room-${id}`
const browseSubset = (all: Record<string, string>): Record<string, string> =>
  Object.fromEntries(BROWSE_SLUGS.map((s) => [s, all[s] ?? '']).filter(([, y]) => y))

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { id: rawId } = useParams()
  const id = rawId ?? ''

  const ssrDict = ssrShowcaseYaml()
  const browseJson = useIslandPayload(
    islandId(id),
    ssrDict && JSON.stringify(browseSubset(ssrDict)),
    async () => JSON.stringify(browseSubset(await loadShowcaseYaml())),
  )
  const library = useMemo(
    () => buildLibrary(browseJson ? (JSON.parse(browseJson) as Record<string, string>) : {}),
    [browseJson],
  )
  const at = library.findIndex((x) => x.id === id)
  const hit: LibraryItem | undefined = at >= 0 ? library[at] : undefined
  const prev = at > 0 ? library[at - 1] : undefined
  const next = at >= 0 && at < library.length - 1 ? library[at + 1] : undefined
  const verbs = hit ? verbsOf(hit.plan) : []
  const recorded = Boolean(hit?.flagship)

  const title = hit
    ? `${hit.label} · ${hit.blurb} · Nika`
    : 'Not a library file · Nika'
  const description = hit
    ? `${hit.filename}: ${hit.blurb}. ${recorded ? 'Recorded from a real nika run — the home page replays its trace.' : `A pack showcase file, shown whole to read; nika run ${hit.filename} is the honest affordance.`}`
    : `${id} names no file in the library.`

  useHead({
    title,
    link: routeHead(`/library/${id}`).link,
    meta: [
      ...routeHead(`/library/${id}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-library.png' },
      {
        property: 'og:image:alt',
        content: 'The Nika library: real files, recorded runs, the honesty contract.',
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
                  { '@type': 'ListItem', position: 1, name: 'The library', item: `${SITE}/library` },
                  { '@type': 'ListItem', position: 2, name: hit.filename },
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'SoftwareSourceCode',
                '@id': `${SITE}/library/${hit.id}`,
                name: hit.filename,
                description,
                url: `${SITE}/library/${hit.id}`,
                programmingLanguage: 'YAML',
              },
            ]),
            processTemplateParams: false,
          },
        ]
      : [],
  })

  return (
    <main className="theme-dark tp-page td-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="lr-title" className="v4sec v4-in" data-library={hit?.id}>
        <div className="v4sec-wrap">
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/library" className="td-crumb-link">
              ← the library
            </Link>
            {hit && (
              <span className="tp-cat" title="the honesty contract, on its face">
                {recorded ? 'recorded · a real trace' : 'browse-only · run it yourself'}
              </span>
            )}
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the workflow library
          </p>
          <h1
            id="lr-title"
            className="v4sec-title tp-title"
            data-rise
            style={{ ['--rise-delay' as string]: '80ms' }}
          >
            {hit ? hit.label : id}
          </h1>

          {!hit && (
            <div className="tp-miss" role="status" data-rise>
              <p className="tp-miss-name">{id}</p>
              <p>
                names no file in the library. <Link to="/library">The shelf</Link> lists all of
                them; the <Link to="/use-cases">showcase</Link> carries the wider gallery.
              </p>
            </div>
          )}

          {hit && (
            <>
              <Island id={islandId(id)} payload={browseJson ?? ''} />

              <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
                {hit.blurb}.{' '}
                {recorded ? (
                  <>
                    This file carries a <b>real recorded trace</b> — the{' '}
                    <Link to="/">home page</Link> replays it, beat for beat, from the run record.
                  </>
                ) : (
                  <>
                    A pack showcase file, shown whole to read;{' '}
                    <code>nika run {hit.filename}</code> is the honest affordance — this site
                    never fabricates a replay for it.
                  </>
                )}
              </p>

              {/* the file's dimensions, at a glance — every figure derived */}
              <StampStrip
                items={[
                  { n: hit.plan.tasks.length, label: hit.plan.tasks.length === 1 ? 'task' : 'tasks', sub: 'the plan below walks them' },
                  { n: hit.plan.waveCount, label: hit.plan.waveCount === 1 ? 'wave' : 'waves', sub: 'run together when they can' },
                  { n: verbs.join(' · ') || '—', label: verbs.length === 1 ? 'verb' : 'verbs', sub: 'the whole grammar it speaks' },
                  recorded
                    ? { n: 'recorded', label: 'a real run', sub: 'the trace is the proof' }
                    : { n: 'browse', label: 'read, then run', sub: 'no fabricated replay' },
                ]}
              />

              {/* ── the plan · the site's one grammar for « a plan » ── */}
              {hit.plan.tasks.length > 0 && (
                <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
                  <div className="cl-year-head">
                    <h2 id="lr-plan" className="td-h2">
                      the plan
                    </h2>
                    <span className="cl-year-rule" aria-hidden />
                    <span className="cl-year-count">derived from the file, never drawn by hand</span>
                  </div>
                  <PlanMap
                    tasks={hit.plan.tasks.map((t) => ({ id: t.id, verb: t.verb, wave: t.wave, gate: t.when }))}
                    waves={hit.plan.waveCount}
                    well={`lib-${hit.id}`}
                  />
                </div>
              )}

              {/* ── the file, whole ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '220ms' }}>
                <div className="cl-year-head">
                  <h2 id="lr-file" className="td-h2">
                    the file, whole
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                  <span className="cl-year-count">{hit.filename}</span>
                </div>
                {hit.yaml ? (
                  <>
                    <div className="td-usage">
                      <CodeFile yaml={hit.yaml} filename={hit.filename} />
                    </div>
                    <p className="td-pin">
                      lines {hit.highlight[0]}–{hit.highlight[1]}: {hit.gloss}. Source:{' '}
                      {hit.sourceUrl.startsWith('/') ? (
                        <a href={hit.sourceUrl}>the served copy</a>
                      ) : (
                        <a href={hit.sourceUrl}>the spec pack</a>
                      )}
                      {recorded && ' · byte-pinned to the recorded trace by the honesty suite'} ·{' '}
                      <Link to={`/play?y=${lz.compressToEncodedURIComponent(hit.yaml)}`}>
                        open it in the playground →
                      </Link>
                    </p>
                  </>
                ) : (
                  <p className="td-gloss">loading the file…</p>
                )}
              </div>

              {/* ── the walk ── */}
              <nav className="td-nav" aria-label="Library walk" data-rise>
                {prev ? (
                  <Link className="td-nav-link" to={`/library/${prev.id}`}>
                    <span className="td-nav-label">← previous</span>
                    {prev.label}
                  </Link>
                ) : (
                  <span />
                )}
                <Link className="td-nav-link td-nav-link--all" to="/library">
                  <span className="td-nav-label">all {library.length}</span>
                  the shelf
                </Link>
                {next ? (
                  <Link className="td-nav-link td-nav-link--next" to={`/library/${next.id}`}>
                    <span className="td-nav-label">next →</span>
                    {next.label}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>

              <p className="tp-foot" data-rise>
                Watch the recorded one replay on <Link to="/">the home page</Link>, walk{' '}
                <Link to="/use-cases">the showcase gallery</Link>, or{' '}
                <Link to="/install">install</Link> and run the file yourself.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
