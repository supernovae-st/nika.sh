import { lazy, Suspense } from 'react'
import { useHead } from '@unhead/react'
import { Link, useParams } from 'react-router'
import { PLATFORM_GUIDE_NAV } from '../content/platform-guides-nav'
import { routeHead } from '../content'
import { useRevealOnce } from '../sections/use-reveal-once'
import { useHydrated } from '../lib/use-hydrated'
import '../sections/v4-home.css'
import './page-chrome.css'
import './platform-guide.css'

const PlatformGuideExperience = lazy(() => import('../components/PlatformGuideExperience'))

export function Component() {
  const hydrated = useHydrated()
  const { guide: guideId } = useParams()
  const guide = PLATFORM_GUIDE_NAV.find(([id]) => id === guideId) ?? PLATFORM_GUIDE_NAV[0]
  const [id, shortTitle, eyebrow, heading, description] = guide
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.03, rootMargin: '0px 0px -5% 0px' })
  const path = `/install/${id}`
  const title = `${shortTitle} · install Nika`
  const canonical = routeHead(path)

  useHead({
    title,
    link: canonical.link,
    meta: [
      ...canonical.meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-install.png' },
    ],
  })

  return (
    <main className="theme-dark v4page pg-page">
      <section ref={ref} aria-labelledby="pg-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <nav className="td-crumb" aria-label="Breadcrumb">
            <Link className="td-crumb-link" to="/install">Install</Link>
          </nav>
          <header className="pg-head">
            <p className="v4sec-fig">{eyebrow}</p>
            <h1 id="pg-title" className="v4sec-title pg-title">{heading}</h1>
            <p className="v4sec-lede">{description}</p>
          </header>
          {hydrated ? (
            <Suspense fallback={null}>
              <PlatformGuideExperience />
            </Suspense>
          ) : null}
        </div>
      </section>
    </main>
  )
}
