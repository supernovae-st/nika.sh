import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { TruthLine } from '../components/TruthLine'
import { MEMBER_ROOM_FAMILIES } from '../content/member-rooms.generated'
import { ssrReadout, loadReadout } from '../lib/member-room-access'
import type { Readout } from '../shell/inspector-readout'
import { SITE, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'
import './tool-detail.css'
import './providers-page.css'

/* ─── /<family> · every roomed family owns its ROOT (theme-dark) ──────────────
   The 2026-07-24 hole: /types/:id had ten rooms and /types itself 404'd —
   « chaque élément a sa page » requires « chaque famille a sa racine ».
   One generic root for the 13 member-room families: the set's own opener
   (the graph readout · the lazy chunk, the MemberRoom recipe), the member
   grid (every room, one chip), the door up to the teaching hub. Every
   root prerenders (FAMILY_ROOT_PATHS). */

/* the query-shaped title tails — authored, one line per family */
const ROOT_TITLE: Record<string, string> = {
  namespaces: 'The namespaces · where a value lives',
  types: 'The value types · every declared shape',
  edges: 'The edge kinds · what creates an arrow',
  predicates: 'The gate predicates · after: on state',
  families: 'The tool families · the stdlib, grouped',
  modes: 'The extract modes · fetch returns structure',
  permits: 'The permit families · the declared boundary',
  secrets: 'The secret sources · masked references',
  conformance: 'The conformance levels · what an engine must prove',
  'error-namespaces': 'The error namespaces · who raises what',
  'error-categories': 'The error categories · how refusals group',
  mcp: 'The MCP oracle · nine read-only tools',
  truth: 'The truth words · how this site proves claims',
}

const islandNote = (family: string) => `fr-${family}`

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { pathname } = useLocation()
  const family = pathname.split('/')[1] ?? ''
  const fam = MEMBER_ROOM_FAMILIES[family]
  const setNode = fam ? `set:${fam.set}` : ''

  const [got, setGot] = useState<{ key: string; readout: Readout | null }>(() => {
    if (!fam) return { key: family, readout: null }
    if (import.meta.env.SSR) return { key: family, readout: ssrReadout(setNode) }
    try {
      const el = document.getElementById(islandNote(family)) as HTMLTextAreaElement | null
      return { key: family, readout: el?.value ? (JSON.parse(el.value) as Readout) : null }
    } catch {
      return { key: family, readout: null }
    }
  })
  useEffect(() => {
    if (!fam || (got.key === family && got.readout)) return
    let live = true
    void loadReadout(setNode).then((r) => {
      if (live) setGot({ key: family, readout: r })
    })
    return () => {
      live = false
    }
  }, [family, fam, setNode, got.key, got.readout])
  const readout = got.key === family ? got.readout : null

  const title = fam ? `${ROOT_TITLE[family] ?? fam.title} · Nika` : 'Not a register · Nika'
  const description = fam
    ? `${readout?.opener ?? fam.title}. ${fam.members.length} members, one room each; the teaching lives at ${fam.hub}.`
    : `${family} is not a register this site keeps.`

  useHead({
    title,
    link: routeHead(`/${family}`).link,
    meta: [
      ...routeHead(`/${family}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: fam
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'DefinedTermSet',
              '@id': `${SITE}/${family}`,
              name: fam.title,
              description,
              hasDefinedTerm: fam.members.map((m) => ({
                '@type': 'DefinedTerm',
                name: m.title,
                url: `${SITE}${m.url}`,
              })),
            }),
            processTemplateParams: false,
          },
        ]
      : [],
  })

  if (!fam) {
    return (
      <main className="theme-dark tp-page td-page">
        <section className="v4sec v4-in">
          <div className="v4sec-wrap">
            <p className="v4sec-fig">the registers</p>
            <h1 className="v4sec-title tp-title">Not a register.</h1>
            <p className="v4sec-lede">
              `{family}` names no register on this site. <Link to="/map">The map</Link> lists
              every one.
            </p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="theme-dark tp-page td-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="fr-title" className="v4sec v4-in" data-family={family}>
        <div className="v4sec-wrap">
          <textarea
            id={islandNote(family)}
            value={readout ? JSON.stringify(readout) : ''}
            readOnly
            hidden
            tabIndex={-1}
            aria-hidden
            style={{ display: 'none' }}
          />
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to={fam.hub} className="td-crumb-link">
              ← the teaching hub
            </Link>
            <span className="tp-cat">{fam.members.length} rooms</span>
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the registers
          </p>
          <h1
            id="fr-title"
            className="v4sec-title tp-title"
            data-rise
            style={{ ['--rise-delay' as string]: '80ms' }}
          >
            {fam.title}.
          </h1>

          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            {readout?.opener ??
              `Every member owns a room — derived from the pinned spec and the released engine, re-proven at every push.`}{' '}
            The teaching lives on <Link to={fam.hub}>{fam.hub}</Link>; this root lists the rooms.
          </p>

          <StampStrip
            items={[
              { n: fam.members.length, label: fam.members.length === 1 ? 'member' : 'members', sub: 'one room each' },
              { n: readout?.status ?? 'derived', label: 'the clock', sub: 're-proven at every push' },
              { n: fam.hub, label: 'the teaching hub', sub: 'where the register is taught' },
              { n: family, label: 'the family', sub: 'this root lists its rooms' },
            ]}
          />

          <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
            <div className="cl-year-head">
              <h2 id="fr-rooms" className="td-h2">
                the rooms
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {fam.members.length} {fam.members.length === 1 ? 'door' : 'doors'}
              </span>
            </div>
            {/* label + gloss rows when the graph teaches (the register
                grammar) — bare chips only for the gloss-less families */}
            {fam.members.some((m) => m.gloss) ? (
              <ol className="tp-list">
                {fam.members.map((m) => (
                  <li key={m.id} className="tp-row" id={m.id}>
                    <div className="pv-row-head">
                      <Link className="pv-id" to={m.url} title="open the member's room">
                        {m.title}
                      </Link>
                    </div>
                    {m.gloss && <p className="pv-desc">{m.gloss}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="td-chips">
                {fam.members.map((m) => (
                  <li key={m.id}>
                    <Link className="td-chip" to={m.url}>
                      {m.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="tp-foot" data-rise>
            The whole atlas lives in <Link to="/map">the map</Link>.{' '}
            <Link to="/spec">Read the spec →</Link>
          </p>

          <footer className="hub-foot">
            <TruthLine nodeId={setNode} />
          </footer>
        </div>
      </section>
    </main>
  )
}
