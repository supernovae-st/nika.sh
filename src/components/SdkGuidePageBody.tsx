import { lazy, Suspense, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import type { SdkGuide } from '../content/sdk'
import { SDK_GUIDE_NAV, SDK_REPO, SDK_SECTIONS, sdkSection, type SdkGuideId } from '../content/sdk-nav'
import { routeHead } from '../content'
import { useRevealOnce } from '../sections/use-reveal-once'
import { crumbLd, ldScript } from '../lib/ld'
import { islandJson } from '../lib/island-json'
import { ssrSdk, loadSdk } from '../lib/sdk-access'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'

const SdkGuideBody = lazy(() => import('./SdkGuideBody'))

function GuideFallback({ guide }: { guide: SdkGuide }) {
  return (
    <div className="sdk-guide-fallback">
      <p>{guide.promise}</p>
      {guide.sections.map((section) => (
        <section key={section.label}>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
          {section.points ? <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul> : null}
          {section.ascii ? <pre tabIndex={0}>{section.ascii}</pre> : null}
          {section.code ? <pre tabIndex={0}><code>{section.code}</code></pre> : null}
        </section>
      ))}
      <nav aria-label="Related SDK documentation">
        {guide.related.map((item) => item.external ? (
          <a key={item.to} href={item.to} target="_blank" rel="noreferrer">{item.label}</a>
        ) : (
          <Link key={item.to} to={item.to}>{item.label}</Link>
        ))}
      </nav>
    </div>
  )
}

export default function SdkGuidePageBody() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })
  const { section: rawSection, guide: rawGuide } = useParams()
  const id = `${rawSection ?? ''}/${rawGuide ?? ''}`
  const at = SDK_GUIDE_NAV.findIndex((item) => item.id === id)
  const guideMeta = at >= 0 ? SDK_GUIDE_NAV[at] : undefined
  const sectionMeta = sdkSection(rawSection ?? '')
  const prev = at > 0 ? SDK_GUIDE_NAV[at - 1] : undefined
  const next = at >= 0 && at < SDK_GUIDE_NAV.length - 1 ? SDK_GUIDE_NAV[at + 1] : undefined
  const path = `/sdk/${guideMeta?.id ?? id}`

  const payload = useIslandPayload(
    `sdk-guide-${id.replace('/', '-')}`,
    (() => {
      const module = ssrSdk()
      return module ? islandJson(module.SDK_GUIDE_INDEX[id as SdkGuideId] ?? null) : null
    })(),
    async () => islandJson((await loadSdk()).SDK_GUIDE_INDEX[id as SdkGuideId] ?? null),
  )
  const guide = useMemo(
    () => (payload && payload !== 'null' ? (JSON.parse(payload) as SdkGuide) : undefined),
    [payload],
  )
  const title = guideMeta ? `${guideMeta.label} · Nika SDK` : 'SDK guide not found · Nika'
  const description = guide?.description ?? (guideMeta
    ? `${guideMeta.label}: ${guideMeta.status} TypeScript SDK guide.`
    : 'This SDK guide does not exist. Open the SDK map to choose a shipped page.')

  useHead({
    title,
    link: routeHead(path).link,
    meta: [
      ...routeHead(path).meta,
      { name: 'description', content: description },
      ...(guide ? [] : [{ name: 'robots', content: 'noindex,follow' }]),
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-integrations.png' },
    ],
    script: guide ? [
      ldScript([
        crumbLd([
          { name: 'SDK', path: '/sdk' },
          { name: sectionMeta?.label ?? guide.section, path: `/sdk/${guide.section}` },
          { name: guide.label },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: guide.title,
          description,
          url: `https://nika.sh${path}`,
          isPartOf: { '@id': 'https://nika.sh/sdk' },
          proficiencyLevel: guide.id === 'start/quickstart' ? 'Beginner' : 'Intermediate',
        },
      ]),
    ] : [],
  })

  if (!guideMeta) {
    return (
      <main className="theme-dark v4page sdk-page">
        <section ref={ref} className="v4sec v4-in sdk-missing" aria-labelledby="sdk-missing-title">
          <div className="v4sec-wrap sdk-wrap">
            <p className="v4sec-fig">SDK · not found</p>
            <h1 id="sdk-missing-title" className="v4sec-title sdk-title">No guide at this address.</h1>
            <p className="v4sec-lede">The SDK map lists every live guide and every preview.</p>
            <Link className="sdk-primary" to="/sdk">Open the SDK map <span aria-hidden>→</span></Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="theme-dark v4page sdk-page sdk-guide-page">
      <section ref={ref} className="v4sec v4-in sdk-guide" aria-labelledby="sdk-guide-title">
        <div className="v4sec-wrap sdk-wrap">
          <Island id={`sdk-guide-${id.replace('/', '-')}`} payload={payload} />
          <nav className="td-crumb sdk-crumb" aria-label="Breadcrumb" data-rise>
            <Link className="td-crumb-link" to="/sdk">← SDK</Link>
            {sectionMeta ? <Link className="td-crumb-link" to={`/sdk/${sectionMeta.id}`}>{sectionMeta.label}</Link> : null}
            <span className="sdk-card-status" data-status={guideMeta.status}>{guideMeta.status}</span>
          </nav>

          <div className="sdk-guide-layout">
            <aside className="sdk-guide-rail" aria-label="SDK guides" data-rise>
              <p>SDK documentation</p>
              {SDK_SECTIONS.map((section) => (
                <div className="sdk-guide-rail-group" key={section.id} data-current={section.id === guideMeta.section || undefined}>
                  <Link className="sdk-guide-rail-section" to={`/sdk/${section.id}`}>
                    <span>{section.index}</span>{section.label}
                  </Link>
                  <ol>{section.guides.map((item) => (
                    <li key={item.id}>
                      <Link to={`/sdk/${item.id}`} aria-current={item.id === guideMeta.id ? 'page' : undefined}>
                        <span className="sdk-guide-rail-label">{item.label}</span>
                        <i data-status={item.status}>{item.status}</i>
                      </Link>
                    </li>
                  ))}</ol>
                </div>
              ))}
              <a href={SDK_REPO} target="_blank" rel="noreferrer">source ↗</a>
            </aside>

            <article className="sdk-guide-article">
              <header className="sdk-guide-head">
                <p className="v4sec-fig" data-rise>{guide?.eyebrow ?? `${guideMeta.status} · SDK`}</p>
                <h1 id="sdk-guide-title" className="v4sec-title sdk-guide-title" data-rise>{guide?.title ?? guideMeta.label}</h1>
                <p className="v4sec-lede sdk-guide-lede" data-rise>{description}</p>
              </header>

              {guide ? (
                <Suspense fallback={<GuideFallback guide={guide} />}><SdkGuideBody guide={guide} /></Suspense>
              ) : (
                <p className="sdk-guide-loading" role="status">Loading the guide contract…</p>
              )}

              <nav className="sdk-guide-walk" aria-label="Adjacent SDK guides" data-rise>
                {prev ? <Link to={`/sdk/${prev.id}`}>← {prev.label}</Link> : <span />}
                {next ? <Link to={`/sdk/${next.id}`}>{next.label} →</Link> : <Link to="/sdk">SDK map →</Link>}
              </nav>
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}
