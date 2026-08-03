import { useMemo } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead, SITE, ENGINE_VERSION } from '../content'
import { StampStrip } from '../components/StampStrip'
import { CHANGELOG } from '../content/changelog'
import type { EngineRelease } from '../content/releases.generated'
import { ssrReleases, loadReleases } from '../lib/releases-access'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { crumbLd, ldScript } from '../lib/ld'
import { cadence, kindChips, fmtWeight } from './releases-lib'
import '../sections/v4-home.css'
import './releases-page.css'
import './page-chrome.css'
import './how-page.css'
import './tool-detail.css'

/* ─── /releases · every version, its assets, its digests ─────────────────────
   World ⑦ of the eight-worlds target, the last unbuilt register: /changelog
   stays the NARRATIVE twin (what each release means), this page is the
   RECORD (what each release IS — the installable artifacts and the digests
   GitHub wrote down when the train uploaded them).

   Every row derives from the vendored release record (public/releases/
   catalog.json · re-vendored deliberately at the train cadence, never probed
   at build). Nothing is typed. */

const ENGINE_RE = /^v(\d+\.\d+\.\d+) · /

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02 })
  const payload = useIslandPayload(
    'releases-register',
    (() => {
      const m = ssrReleases()
      return m ? JSON.stringify(m) : null
    })(),
    async () => JSON.stringify(await loadReleases()),
  )
  const rec = useMemo(
    () => (payload ? (JSON.parse(payload) as { releases: EngineRelease[] }) : null),
    [payload],
  )
  const RELEASES = useMemo(() => rec?.releases ?? [], [rec])

  /* the narrative twin joins by tag — the ship log entry names what a
     version MEANS; the record stays the authority on what it IS */
  const storyByTag = useMemo(() => {
    const m = new Map<string, string>()
    for (const e of CHANGELOG) {
      const hit = e.title.match(ENGINE_RE)
      if (hit) m.set(`v${hit[1]}`, e.title)
    }
    return m
  }, [])

  const digested = RELEASES.reduce(
    (n, r) => n + r.assets.filter((a) => a.sha256).length,
    0,
  )
  const assetsTotal = RELEASES.reduce((n, r) => n + r.assets.length, 0)
  const weight = RELEASES.reduce((n, r) => n + r.assets.reduce((m, a) => m + a.size, 0), 0)
  const strip = useMemo(() => cadence(RELEASES), [RELEASES])

  const title = 'Releases · Nika'
  const description = `Every published Nika engine release: ${RELEASES.length} versions, ${assetsTotal} assets, each with the digest GitHub recorded at upload. The served catalog follows ${ENGINE_VERSION}.`

  useHead({
    title,
    link: routeHead('/releases').link,
    meta: [
      ...routeHead('/releases').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-releases.png' },
      { property: 'og:image:alt', content: 'The Nika release record: every published version with the sha256 digests recorded at upload.' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: 'https://nika.sh/og-releases.png' },
    ],
    script: [
      ldScript([
        crumbLd([{ name: 'Releases' }]),
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${SITE}/releases`,
          name: 'The Nika engine release record',
          description,
          numberOfItems: RELEASES.length,
        },
      ]),
    ],
  })

  return (
    <main className="theme-dark tp-page td-page">
      <section ref={ref} aria-labelledby="rel-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <Island id="releases-register" payload={payload ?? ''} />
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/changelog" className="td-crumb-link">
              ← the narrative twin
            </Link>
            <span className="tp-cat">the record</span>
          </nav>

          <p className="v4sec-fig" data-rise>
            the releases
          </p>
          <h1
            id="rel-title"
            className="v4sec-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            Every version, its assets, its digests.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            The ship log tells you what a release means; this register tells you what it is: the
            artifacts a stranger can install, each with the sha256 GitHub recorded when the release
            train uploaded it. Vendored from the public record at the train cadence · never probed
            at build, never typed by hand.
          </p>

          <StampStrip
            items={[
              { n: RELEASES.length, label: 'releases', sub: 'published · installable' },
              { n: assetsTotal, label: 'assets', sub: 'tarballs · sums · attestations' },
              { n: digested, label: 'with digests', sub: 'sha256, recorded at upload' },
              {
                n: ENGINE_VERSION,
                label: 'the pin',
                sub: 'the catalog this site serves',
              },
            ]}
          />

          <div className="how-subs" data-rise>
            <p className="how-fig mono">the cadence</p>
            <h2 className="how-h1">Every release, on the axis of time it shipped in</h2>
            <p className="how-body">
              One tick per published version, seated where its day falls; the bar carries the
              asset count and the lone accent marks the release this site serves. Same-day trains
              keep both ticks: the record never hides a hotfix.
            </p>
            {strip.ticks.length > 1 && (
              <>
                <div
                  className="rl-cadence"
                  role="img"
                  aria-label={`${RELEASES.length} releases across ${strip.spanDays} days · median gap ${strip.medianGapDays} ${strip.medianGapDays === 1 ? 'day' : 'days'}`}
                >
                  {strip.ticks.map((k) => (
                    <Link
                      key={k.tag}
                      to={`/releases/${k.tag}`}
                      className={k.latest ? 'rl-tick rl-tick--latest' : 'rl-tick'}
                      style={{ left: `${k.left}%`, ['--h' as string]: `${k.h}px` }}
                      title={k.label}
                      aria-label={k.label}
                    >
                      <i aria-hidden />
                    </Link>
                  ))}
                  <span className="rl-cadence-label" style={{ left: '0%' }} aria-hidden>
                    {strip.ticks[0]?.tag}
                  </span>
                  <span
                    className="rl-cadence-label rl-cadence-label--latest"
                    style={{ left: '100%' }}
                    aria-hidden
                  >
                    {strip.ticks[strip.ticks.length - 1]?.tag}
                  </span>
                </div>
                <p className="rl-cadence-foot">
                  {RELEASES.length} releases · {strip.spanDays} days ·
                  median gap {strip.medianGapDays} {strip.medianGapDays === 1 ? 'day' : 'days'} ·
                  {' '}{fmtWeight(weight)} shipped
                </p>
              </>
            )}
          </div>

          <div className="how-subs" data-rise>
            <p className="how-fig mono">newest first</p>
            <h2 className="how-h1">The record</h2>
            <ol className="td-args tp-args">
              {RELEASES.map((r) => (
                <li className="tp-arg" key={r.tag} style={{ listStyle: 'none' }}>
                  <span className="tp-arg-name">
                    <Link to={`/releases/${r.tag}`}>{r.tag}</Link>
                  </span>
                  <span className="tp-arg-desc">
                    {storyByTag.get(r.tag) ?? r.name}
                    <br />
                    <span className="mono">
                      {r.date} · {r.assets.length} {r.assets.length === 1 ? 'asset' : 'assets'}
                      {r.tag === ENGINE_VERSION ? ' · the catalog this site serves' : ''}
                    </span>
                    <span className="rl-chips" aria-hidden>
                      {kindChips(r.assets).map((c) => (
                        <span key={c} className="rl-chip">
                          {c}
                        </span>
                      ))}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="how-subs" data-rise>
            <p className="how-fig mono">two registers, one truth</p>
            <h2 className="how-h1">The twin pages</h2>
            <p className="how-body">
              The <Link to="/changelog">changelog</Link> is the narrative: what each release means,
              written with the bump, never after. The <Link to="/catalog">catalog</Link> is what the
              PINNED release knows (models, pricing, MCP servers), vendored at{' '}
              <span className="mono">{ENGINE_VERSION}</span> and re-vendored only when the pin
              advances. The machine copy of this register is served at{' '}
              <a href="/releases/catalog.json">/releases/catalog.json</a>.
            </p>
            <div className="v4doclinks">
              <Link to="/changelog" className="v4doclink">
                What shipped, and when
                <span aria-hidden className="v4doclink-arrow"> →</span>
              </Link>
              <a className="v4doclink" href="https://github.com/supernovae-st/nika/releases">
                The record at GitHub
                <span aria-hidden className="v4doclink-arrow"> →</span>
              </a>
              <Link to="/catalog" className="v4doclink">
                What the pinned release knows
                <span aria-hidden className="v4doclink-arrow"> →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
