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
import { fmtWeight } from './releases-lib'
import '../sections/v4-home.css'
import './releases-page.css'
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

  /* the room ships its row AND its two neighbours: the delta walks against
     the PREVIOUS release, the nav walks both ways · one island, no second
     fetch (newest-first record: prev = the older sibling) */
  const slice = (m: { releases: EngineRelease[] }) => {
    const i = m.releases.findIndex((r) => r.tag === tag)
    return {
      row: i >= 0 ? m.releases[i] : null,
      prev: i >= 0 ? (m.releases[i + 1] ?? null) : null,
      newer: i > 0 ? { tag: m.releases[i - 1].tag } : null,
    }
  }
  const payload = useIslandPayload(
    `release-${tag}`,
    (() => {
      const m = ssrReleases()
      return m ? JSON.stringify(slice(m)) : null
    })(),
    async () => JSON.stringify(slice(await loadReleases())),
  )
  const rec = useMemo(
    () =>
      payload
        ? (JSON.parse(payload) as {
            row: EngineRelease | null
            prev: EngineRelease | null
            newer: { tag: string } | null
          })
        : null,
    [payload],
  )
  const rel = rec?.row ?? null
  const prev = rec?.prev ?? null
  const delta = useMemo(() => {
    if (!rel || !prev) return null
    const before = new Map(prev.assets.map((a) => [a.name, a.size]))
    const after = new Map(rel.assets.map((a) => [a.name, a.size]))
    const rows: { name: string; move: string; cls: string }[] = []
    for (const [name, size] of after) {
      const was = before.get(name)
      if (was == null) rows.push({ name, move: `+ ${fmtWeight(size)} · new`, cls: 'rl-delta-row--add' })
      else if (was !== size) {
        const d = size - was
        rows.push({
          name,
          move: `${fmtWeight(was)} → ${fmtWeight(size)} (${d > 0 ? '+' : '−'}${Math.abs(Math.round(d / 1024))} KB)`,
          cls: '',
        })
      }
    }
    for (const name of before.keys()) {
      if (!after.has(name)) rows.push({ name, move: 'gone', cls: 'rl-delta-row--del' })
    }
    return rows
  }, [rel, prev])

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
      { property: 'og:image', content: 'https://nika.sh/og-releases.png' },
      { property: 'og:image:alt', content: 'The Nika release record: every published version with the sha256 digests recorded at upload.' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: 'https://nika.sh/og-releases.png' },
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

              {(() => {
                const a =
                  rel?.assets.find((x) => x.name.includes('macos-arm64') && x.sha256) ??
                  rel?.assets.find((x) => x.sha256)
                return a ? (
                  <div className="how-subs" data-rise>
                    <p className="how-fig mono">verify a download</p>
                    <h2 className="how-h1">Two lines, no trust</h2>
                    <p className="how-body">
                      The digest below is this release's own record for{' '}
                      <span className="mono">{a.name}</span>. Paste both lines where the file
                      landed: a silent OK is the proof, anything else is a refusal.
                    </p>
                    <pre className="src-cmd mono">
                      <code>{`echo "${a.sha256}  ${a.name}" | shasum -a 256 -c -`}</code>
                    </pre>
                  </div>
                ) : null
              })()}

              {delta && (
                <div className="how-subs" data-rise>
                  <p className="how-fig mono">the delta</p>
                  <h2 className="how-h1">
                    What moved since {prev?.tag}
                  </h2>
                  {delta.length === 0 ? (
                    <p className="how-body">
                      Same asset set, same bytes recorded: this release changed the code, not the
                      shape of what ships.
                    </p>
                  ) : (
                    <div>
                      {delta.map((d) => (
                        <div key={d.name} className={`rl-delta-row ${d.cls}`.trim()}>
                          <span className="rl-delta-name">{d.name}</span>
                          <span className="rl-delta-move">{d.move}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className="wf-pin mono" data-rise>
                vendored from the public release record · re-vendored at the train cadence
              </p>

              <nav className="td-nav" aria-label="Release walk" data-rise>
                {prev ? (
                  <Link className="td-nav-link" to={`/releases/${prev.tag}`}>
                    <span className="td-nav-label">older</span>← {prev.tag}
                  </Link>
                ) : (
                  <span />
                )}
                <Link className="td-nav-link td-nav-link--all" to="/releases">
                  every release
                </Link>
                {rec?.newer ? (
                  <Link className="td-nav-link td-nav-link--next" to={`/releases/${rec.newer.tag}`}>
                    <span className="td-nav-label">newer</span>{rec.newer.tag} →
                  </Link>
                ) : (
                  <span />
                )}
              </nav>

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
