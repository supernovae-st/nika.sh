import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { SITE_MAP, type MapLink } from '../content/sitemap'
import { MAP_LAYERS, MAP_OPENER } from './map-data.generated'
import { ATLAS_CLOCK_DIFF } from '../content/atlas-meta.generated'
import { CanonCount } from '../components/CanonCount'
import { TruthLine } from '../components/TruthLine'
import { SITE, routeHead } from '../content'
import '../sections/v4-home.css'
import './map-page.css'

/* ─── /map · the mother page (theme-dark) ─────────────────────────────────────
   The anatomy of the language at a glance — the entry of everything. Three
   registers, one truth: the LIST is the truth (keyboard path · reading
   order), the CONSTELLATION is a lens over the same atlas (crawlable
   anchors, out of tab order), the EVERY-PAGE registry is the absorbed
   human sitemap (content/sitemap.ts · its coverage gate lives on).

   Derived to the bone: layers/sets/counts from map-data.generated ·
   the drawing from the same compile · the clock line computed · the
   truth line carries the provenance. Zero hand-written figures — every
   count on this page is a CanonCount (a link).

   SSR-safe: static content; the reveal is the shared poster-law hook. */

const diffLine = (() => {
  /* BOTH registers (the swarm's sub-cap catch: providers drift was
     invisible here while /sources showed it) — the agreement claim is
     only honest when every diffed register is read */
  const parts: string[] = []
  for (const register of ['builtins', 'providers'] as const) {
    const d = ATLAS_CLOCK_DIFF[register]
    if (d.ratified_only.length) parts.push(`${register} ratified, ships with the next train: ${d.ratified_only.join(' · ')}`)
    if (d.shipped_only.length) parts.push(`${register} shipped ahead of canon: ${d.shipped_only.join(' · ')}`)
  }
  return parts.length ? parts.join(' — ') : 'the two clocks agree today: everything ratified is shipped'
})()

/* ─── the constellation island · the initial-bundle diet (ToolPage's recipe) ──
   The 39K drawing is this page's heaviest cargo and its only consumer — off
   the initial bundle. SSG awaits the asset in the SSR-only branch (the svg
   lands INLINE in the prerendered HTML: crawlable anchors); hydration reads
   the SIBLING TEXTAREA ISLAND's value back — NEVER the host div's
   innerHTML: the browser re-serializes markup (self-closing tags), so
   innerHTML is never byte-equal to the source (#418, caught by the sweep).
   Why a TEXTAREA and not a <script type="text/plain">: React's hydration
   walker SKIPS script tags in the DOM (extension tolerance), so a
   React-rendered script can never be matched — #418 again, structurally
   (probe-verified). A textarea is RCDATA: renderToString escapes the
   entities, the parser decodes them back, and .value IS the exact source
   bytes — and the matcher sees the element. SPA navigation pulls the
   asset as its own chunk once. */
let SSR_CONSTELLATION: string | null = null
if (import.meta.env.SSR) {
  SSR_CONSTELLATION = (await import('../assets/constellation.generated.svg?raw')).default
}

const CST_ISLAND_ID = 'mp-cst-island'

function useConstellation(): string {
  const [svg, setSvg] = useState<string>(() => {
    if (import.meta.env.SSR) return SSR_CONSTELLATION ?? ''
    const island = document.getElementById(CST_ISLAND_ID) as HTMLTextAreaElement | null
    return island?.value ?? ''
  })
  useEffect(() => {
    if (svg) return
    let live = true
    import('../assets/constellation.generated.svg?raw').then((m) => {
      if (live) setSvg(m.default)
    })
    return () => {
      live = false
    }
  }, [svg])
  return svg
}

function EveryPageRow({ link }: { link: MapLink }) {
  const inner = (
    <>
      <span className="mp-link-label">{link.label}</span>
      {link.hint && <span className="mp-link-hint">{link.hint}</span>}
      {link.external && (
        <span className="mp-ext" aria-label="external" title="external">
          ↗
        </span>
      )}
    </>
  )
  return (
    <li className="mp-link">
      {link.external ? (
        <a href={link.href} target="_blank" rel="noreferrer">
          {inner}
        </a>
      ) : (
        <Link to={link.href}>{inner}</Link>
      )}
    </li>
  )
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const constellation = useConstellation()


  const title = 'The map · every page, one graph · Nika'
  const description =
    'The anatomy of the Nika language at a glance: seven layers, every set counted, every member accountable to the spec. The whole site derives from one graph.'

  useHead({
    title,
    link: routeHead('/map').link,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-map.png' },
      { property: 'og:image:alt', content: 'The Nika language constellation: seven layers, every set.' },
      ...routeHead('/map').meta,
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              '@id': `${SITE}/map`,
              name: title,
              description,
            },
            {
              '@type': 'ItemList',
              name: 'The seven layers of the Nika language',
              itemListElement: MAP_LAYERS.map((l, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: l.title,
                ...(l.exists ? { url: `${SITE}${l.hub}` } : {}),
              })),
            },
          ],
        }),
        // unhead: don't HTML-escape JSON (keeps it valid ld+json, not &quot;)
        processTemplateParams: false,
      },
    ],
  })

  return (
    <main className="theme-dark mp-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="mp-title" className="v4sec v4-in">
        <div className="v4sec-wrap mp-wrap">
          <header className="mp-head">
            <p className="v4-kick">the map</p>
            <h1 id="mp-title" className="v4-h2 mp-title">
              Every page, one graph
            </h1>
            <p className="mp-opener">{MAP_OPENER}</p>
            <p className="mp-clock" data-agree={diffLine.startsWith('the two clocks')}>
              {diffLine}
            </p>
          </header>

          <div className="mp-body">
            {/* the LIST is the truth — DOM-first everywhere (mobile law:
                list before drawing · desktop: two columns, drawing right) */}
            <nav className="mp-anatomy" aria-labelledby="mp-anatomy-title" id="anatomy">
              <h2 id="mp-anatomy-title" className="mp-sec-title">
                The anatomy
              </h2>
              <ol className="mp-layers">
                {MAP_LAYERS.map((l) => (
                  <li key={l.id} className="mp-layer" data-layer={l.id}>
                    <div className="mp-layer-head">
                      {l.exists ? (
                        <Link className="mp-layer-link" to={l.hub}>
                          {l.title}
                        </Link>
                      ) : (
                        <span className="mp-layer-link mp-layer-link--soon">
                          {l.title}
                          <span className="mp-soon">soon</span>
                        </span>
                      )}
                    </div>
                    <p className="mp-layer-opener">{l.opener}</p>
                    <ul className="mp-sets">
                      {l.sets.map((s) => (
                        <li key={s.id} className="mp-set">
                          {s.slot || !s.exists ? (
                            /* a chip only links a served page — wave slots
                               and landing-later hubs render the honest soon
                               (the sweep's dead-link catch) */
                            <span
                              className="mp-set-chip mp-set-chip--slot"
                              title={s.slot ? `ships with the ${s.slot} wave` : 'landing soon'}
                            >
                              {s.title}
                              <span className="mp-soon">soon</span>
                            </span>
                          ) : (
                            /* the Inspector door (round-1): on a fine desktop
                               pointer the chip SELECTS (the readout opens, the
                               page stays alive — the room door lives in the
                               panel); mobile and modifier-clicks keep the
                               straight navigation until the sheet lands */
                            <Link
                              className="mp-set-chip"
                              to={s.url}
                              data-node-id={`set:${s.id}`}
                              onClick={(e) => {
                                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                                e.preventDefault()
                                window.dispatchEvent(new CustomEvent('insp:open', { detail: { id: `set:${s.id}` } }))
                              }}
                            >
                              {s.title}
                              <CanonCount setId={s.id} className="mp-set-count" plain />
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </nav>

            <figure
              className="mp-figure"
              aria-label="The constellation drawing (a lens over the same list)"
              onClick={(e) => {
                /* the stars select too (round-1 step 3): the svg anchors are
                   aria-hidden COURTESY doors — a plain click opens the
                   readout (the Inspector resolves the href to its node);
                   modifier-clicks keep the real navigation */
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                const a = (e.target as Element).closest('a')
                /* STARS only — the figcaption's real links and the +N
                   aggregate doors keep their navigation (swarm finding [10]) */
                if (!a || !a.closest('.cst-star')) return
                const href = a.getAttribute('href')
                if (!href || !href.startsWith('/')) return
                e.preventDefault()
                window.dispatchEvent(new CustomEvent('insp:open', { detail: { href } }))
              }}
            >
              {/* safe sink ×2: static build-time bytes from our own compiler
                  emission (scripts/atlas/build-atlas.mjs · committed asset ·
                  the render guard refuses a closing-script sequence) — no
                  user input ever reaches these innerHTMLs (the MegaIcon
                  precedent). The script island carries the EXACT source
                  bytes for hydration; the div is the visible drawing. */}
              {/* the byte island: RCDATA round-trips exactly (see the recipe
                  note above) · display:none inline so no stylesheet race can
                  ever flash a wall of svg source text */}
              <textarea
                id={CST_ISLAND_ID}
                value={constellation}
                readOnly
                hidden
                tabIndex={-1}
                aria-hidden
                style={{ display: 'none' }}
              />
              {/* suppressHydrationWarning: React 19 validates innerHTML at
                  hydration and the browser RE-SERIALIZES markup (self-closing
                  svg tags), so the DOM can never be byte-equal to the source
                  string — the mismatch is structural, not a bug; the island
                  textarea above carries the exact bytes for state, and this
                  flag is the tool React ships for exactly this adoption. */}
              <div
                className="mp-constellation"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: constellation }}
              />
              <figcaption className="mp-figcap">
                the same atlas, drawn · members link their rooms · <a href="/map/constellation.svg">the file</a>
              </figcaption>
            </figure>
          </div>

          <section className="mp-everypage" aria-labelledby="mp-everypage-title" id="every-page">
            <h2 id="mp-everypage-title" className="mp-sec-title">
              Every page
            </h2>
            <div className="mp-groups">
              {SITE_MAP.map((g) => (
                <section key={g.kick} className="mp-group" aria-label={g.kick}>
                  <h3 className="mp-kick">{g.kick}</h3>
                  <p className="mp-gloss">{g.gloss}</p>
                  <ul className="mp-links">
                    {g.links.map((l) => (
                      <EveryPageRow key={l.href + l.label} link={l} />
                    ))}
                  </ul>
                  {g.dense && (
                    <ul className="mp-dense">
                      {g.dense.map((l) => (
                        <li key={l.href}>
                          <Link to={l.href}>{l.label}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </section>

          <footer className="mp-foot">
            <TruthLine nodeId="surface:map" />
          </footer>
        </div>
      </section>
    </main>
  )
}
