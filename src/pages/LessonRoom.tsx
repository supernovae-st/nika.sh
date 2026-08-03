import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { useHead } from '@unhead/react'
import { codeLd, crumbLd, ldScript } from '../lib/ld'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead } from '../content'
import { CodeFile } from '../components/CodeFile'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { LESSONS, LESSONS_PIN } from '../content/lessons.generated'
import { ssrLessonYaml, loadLessonYaml } from '../lib/lessons-access'
import '../sections/v4-home.css'
import './page-chrome.css'
import './how-page.css'
import './workflows-page.css'

/* ─── /workflows/path/:slug · one step of the teaching path ───────────────────
   The whole file, verbatim at the spec pin, with its own sha256 beside it —
   and the two steps around it, because the path is the point: this page only
   means something as a step between the one before and the one after.

   The YAML rides the async chunk (lessons-access): thirteen workflow files
   are 44KB, and a room needs exactly one of them. */

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02 })
  const { pathname } = useLocation()
  const slug = pathname.split('/')[3] ?? ''
  const at = LESSONS.findIndex((l) => l.slug === slug)
  const lesson = at >= 0 ? LESSONS[at] : undefined
  const prev = at > 0 ? LESSONS[at - 1] : undefined
  const next = at >= 0 && at < LESSONS.length - 1 ? LESSONS[at + 1] : undefined

  /* the file itself · SSG writes it into the island, a SPA hop pulls the chunk */
  const payload = useIslandPayload(
    `lesson-${slug}`,
    (() => {
      const all = ssrLessonYaml()
      return all ? (all[slug] ?? '') : null
    })(),
    async () => (await loadLessonYaml())[slug] ?? '',
  )
  const yaml = useMemo(() => payload, [payload])

  const known = at >= 0
  const headline = lesson?.headline ?? slug
  const title = known ? `${headline} · The path · Nika` : 'Not a step on the path · Nika'
  const description = known
    ? `Step ${lesson?.step} of the Nika teaching path, whole: ${headline} Read at the spec pin, with its own sha256.`
    : `${slug} names no step on the teaching path.`
  useHead({
    title,
    link: routeHead(`/workflows/path/${slug}`).link,
    meta: [
      ...routeHead(`/workflows/path/${slug}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-workflows.png' },
      { property: 'og:image:alt', content: 'The Nika corpus: the path that teaches, the jobs that prove, the skeletons that start yours.' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: 'https://nika.sh/og-workflows.png' },
    ],
    /* a step is a FILE a reader can run · it declares itself as source, the
       way the jobs and the skeletons already do (2026-08-02: all 13 bare) */
    script: known
      ? [
          ldScript([
            crumbLd([
              { name: 'Workflows', path: '/workflows' },
              { name: 'The path', path: '/workflows#path' },
              { name: headline },
            ]),
            codeLd({
              path: `/workflows/path/${slug}`,
              name: lesson?.file ?? slug,
              description,
            }),
          ]),
        ]
      : [],
  })

  if (!known) {
    return (
      <main className="theme-dark tp-page td-page">
        <section className="v4sec v4-in">
          <div className="v4sec-wrap">
            <nav className="td-crumb" aria-label="Breadcrumb">
              <Link to="/workflows" className="td-crumb-link">
                ← the corpus
              </Link>
            </nav>
            <h1 className="v4sec-title">Not a step on the path.</h1>
            <p className="v4sec-lede">
              <code>{slug}</code> names no step. <Link to="/workflows">The path</Link> lists all{' '}
              {LESSONS.length} of them, in order.
            </p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="theme-dark tp-page td-page">
      <section ref={ref} aria-labelledby="ls-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <Island id={`lesson-${slug}`} payload={payload} />
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/workflows" className="td-crumb-link">
              ← the corpus
            </Link>
            <span className="tp-cat" title="where this step sits on the path">
              step {at + 1} of {LESSONS.length}
            </span>
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the path · {String(lesson?.step).padStart(2, '0')}
          </p>
          <h1 id="ls-title" className="v4sec-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            {headline}
          </h1>
          {lesson?.description && (
            <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
              {lesson.description}
            </p>
          )}

          <p className="wf-run mono" data-rise style={{ ['--rise-delay' as string]: '150ms' }}>
            <span className="how-limit-key">run it</span>
            <span>nika try {slug}</span>
          </p>

          {/* the file, whole · the same bytes the conformance gate runs on */}
          <div className="wf-file" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
            {yaml ? (
              <CodeFile yaml={yaml} filename={lesson?.file} wrap tips />
            ) : (
              <p className="how-body">Loading the file…</p>
            )}
          </div>
          <p className="wf-pin mono" data-rise>
            nika-spec@{LESSONS_PIN.spec_commit.slice(0, 9)} · sha256 {lesson?.sha256.slice(0, 16)}…
          </p>

          {/* the path is the point · the steps on either side */}
          <nav className="wf-walk" aria-label="The path" data-rise>
            {prev ? (
              <Link to={`/workflows/path/${prev.slug}`} className="wf-walk-link">
                <span className="wf-walk-key mono">← before</span>
                <span>{prev.headline ?? prev.slug}</span>
              </Link>
            ) : (
              <span className="wf-walk-link wf-walk-link--none">
                <span className="wf-walk-key mono">← before</span>
                <span>this is where the path starts</span>
              </span>
            )}
            {next ? (
              <Link to={`/workflows/path/${next.slug}`} className="wf-walk-link wf-walk-link--next">
                <span className="wf-walk-key mono">after →</span>
                <span>{next.headline ?? next.slug}</span>
              </Link>
            ) : (
              <span className="wf-walk-link wf-walk-link--next wf-walk-link--none">
                <span className="wf-walk-key mono">after →</span>
                <span>the path ends here</span>
              </span>
            )}
          </nav>
        </div>
      </section>
    </main>
  )
}
