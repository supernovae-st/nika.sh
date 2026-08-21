import { lazy } from 'react'
import { Link, useParams } from 'react-router'
import { SDK_SECTIONS, sdkSection } from '../content/sdk-nav'
import { SsgLazy } from '../lib/ssg-lazy'
import '../sections/v4-home.css'
import './page-chrome.css'
import './sdk-page.css'

const SdkSectionBody = lazy(() => import('../components/SdkSectionBody'))
let ServerSdkSectionBody: typeof import('../components/SdkSectionBody')['default'] | null = null
if (import.meta.env.SSR) ServerSdkSectionBody = (await import('../components/SdkSectionBody')).default

export function Component() {
  const { section: rawSection } = useParams()
  const section = sdkSection(rawSection ?? '')
  const at = SDK_SECTIONS.findIndex((item) => item.id === section?.id)
  const prev = at > 0 ? SDK_SECTIONS[at - 1] : undefined
  const next = at >= 0 && at < SDK_SECTIONS.length - 1 ? SDK_SECTIONS[at + 1] : undefined
  if (!section) {
    return (
      <main className="theme-dark v4page sdk-page">
        <section className="v4sec v4-in sdk-missing" aria-labelledby="sdk-section-missing">
          <div className="v4sec-wrap sdk-wrap">
            <p className="v4sec-fig">SDK · not found</p>
            <h1 id="sdk-section-missing" className="v4sec-title sdk-title">No system at this address.</h1>
            <Link className="sdk-primary" to="/sdk">Open the SDK graph <span aria-hidden>→</span></Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="theme-dark v4page sdk-page sdk-section-page">
      <SsgLazy
        id={`sdk-${section.id}-poster`}
        poster={ServerSdkSectionBody ? <ServerSdkSectionBody section={section} prev={prev} next={next} /> : undefined}
      >
        <SdkSectionBody section={section} prev={prev} next={next} />
      </SsgLazy>
    </main>
  )
}
