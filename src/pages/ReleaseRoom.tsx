import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { useHead } from '@unhead/react'
import { articleLd, crumbLd, ldScript } from '../lib/ld'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead, ENGINE_VERSION } from '../content'
import { CHANGELOG } from '../content/changelog'
import type { EngineRelease } from '../content/releases.generated'
import { ssrReleases, loadReleases } from '../lib/releases-access'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import '../sections/v4-home.css'
import './page-chrome.css'
import './how-page.css'
import './tool-detail.css'

/* ─── /releases/:tag · one version, whole ────────────────────────────────────
   The record half of world ⑦: the installable artifacts of ONE release with
   the digests GitHub recorded at upload, joined to the ship log's narrative
   entry when one exists. The notes stay at the release — one voice, never a
   second copy that can drift. */

const ENGINE_RE = /^v(\d+\.\d+\.\d+) · /

const fmtSize = (b: number) =>
  b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02 })
  const { pathname } = useLocation()
  const tag = pathname.split('/')[2] ?? ''

  const payload = useIslandPayload(
    `release-${tag}`,
    (() => {
      const m = ssrReleases()
      return m ? JSON.stringify({ row: m.releases.find((r) => r.tag === tag) ?? null }) : null
    })(),
    async () => {
      const m = await loadReleases()
      return JSON.stringify({ row: m.releases.find((r) => r.tag === tag) ?? null })
    },
  )
  const rel = useMemo(
    () => (payload ? (JSON.parse(payload) as { row: EngineRelease | null }).row : null),
    [payload],
  )

  /* the narrative twin, joined by tag (already in the bundle: /changelog owns it) */
  const story = useMemo(
    () => CHANGELOG.find((e) => e.title.match(ENGINE_RE)?.[1] === tag.slice(1)),
    [tag],
  )

  const known = Boolean(rel)
  const title = known
    ? `${story?.title ?? `${tag} · engine release`} · Nika`
    : `${tag} · Not a release room · Nika`
  const description = known
    ? `The ${tag} engine release, whole: ${rel?.assets.length ?? 0} assets with their recorded sha256 digests, published ${rel?.date}.${tag === ENGINE_VERSION ? ' The catalog this site serves reads this release.' : ''}`
    : `${tag} names no published release. The register lists every one.`

  useHead({
    title,
    link: routeHead(`/releases/${tag}`).link,
    meta: [
      ...routeHead(`/releases/${tag}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: known
      ? [
          ldScript([
            crumbLd([{ name: 'Releases', path: '/releases' }, { name: tag }]),
            articleLd({
              path: `/releases/${tag}`,
              name: story?.title ?? `${tag} · engine release`,
              description,
              partOfName: 'The Nika engine release record',
              partOfPath: '/releases',
            }),
          ]),
        ]
      : [],
  })

  return (
    <main className="theme-dark tp-page td-page">
      <section ref={ref} aria-labelledby="rel-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <Island id={`release-${tag}`} payload={payload ?? ''} />

          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/releases" className="td-crumb-link">
              ← the releases
            </Link>
            {rel && <span className="tp-cat">published {rel.date}</span>}
          </nav>

          {!known ? (
            <>
              <h1 id="rel-title" className="v4sec-title" data-rise>
                Not a release room.
              </h1>
              <p className="v4sec-lede" data-rise>
                <code>{tag}</code> names no published release the record carries.{' '}
                <Link to="/releases">The register</Link> lists every one.
              </p>
            </>
          ) : (
            <>
              <p className="v4sec-fig" data-rise>
                {tag}
              </p>
              <h1
                id="rel-title"
                className="v4sec-title"
                data-rise
                style={{ ['--rise-delay' as string]: '60ms' }}
              >
                {story ? story.title.replace(ENGINE_RE, '') : 'An engine release.'}
              </h1>
              <p className="wf-pin mono" data-rise>
                published {rel?.date} · {rel?.assets.length}{' '}
                {rel?.assets.length === 1 ? 'asset' : 'assets'}
                {tag === ENGINE_VERSION ? ' · the catalog this site serves' : ''}
              </p>

              {story ? (
                <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '100ms' }}>
                  {story.body}
                </p>
              ) : (
                <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '100ms' }}>
                  This version predates the ship log's release entries; its notes live at the
                  release itself, one voice, linked below.
                </p>
              )}

              <div className="how-subs" data-rise>
                <p className="how-fig mono">the artifacts</p>
                <h2 className="how-h1">
                  {rel?.assets.length} {rel?.assets.length === 1 ? 'asset' : 'assets'}, each with
                  its recorded digest
                </h2>
                <p className="how-body">
                  The sha256 beside each artifact is the digest GitHub recorded when the release
                  train uploaded it: re-derivable by anyone, fabricated by no one. Verify a
                  download against it, or against the <span className="mono">SHA256SUMS</span>{' '}
                  asset the train signs.
                </p>
                <ol className="td-args tp-args">
                  {(rel?.assets ?? []).map((a) => (
                    <li className="tp-arg" key={a.name} style={{ listStyle: 'none' }}>
                      <span className="tp-arg-name mono">{a.name}</span>
                      <span className="tp-arg-desc">
                        <span className="mono">
                          {fmtSize(a.size)}
                          {a.sha256 ? ` · sha256 ${a.sha256.slice(0, 16)}…` : ' · no recorded digest'}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <p className="wf-pin mono" data-rise>
                vendored from the public release record · re-vendored at the train cadence
              </p>

              <div className="v4doclinks" data-rise>
                <a className="v4doclink" href={rel?.url}>
                  The notes, at the release
                  <span aria-hidden className="v4doclink-arrow"> →</span>
                </a>
                <Link to="/releases" className="v4doclink">
                  Every version, its assets
                  <span aria-hidden className="v4doclink-arrow"> →</span>
                </Link>
                {tag === ENGINE_VERSION && (
                  <Link to="/catalog" className="v4doclink">
                    What this release knows
                    <span aria-hidden className="v4doclink-arrow"> →</span>
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
