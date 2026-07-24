import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { TruthLine } from '../components/TruthLine'
import { StampStrip } from '../components/StampStrip'
import { MEMBER_ROOM_FAMILIES } from '../content/member-rooms.generated'
import { WORD_INDEX } from '../content/language.generated'
import { ssrReadout, loadReadout } from '../lib/member-room-access'
import type { Readout } from '../shell/inspector-readout'
import { Island } from '../lib/ssg-island'
import { SITE, routeHead } from '../content'
import '../sections/v4-home.css'
import './hubs-page.css'
import './rooms-page.css'

/* ─── the generic member room · one route, every family ──────────────────────
   (rooms universelles · operator verdict 2026-07-18: « chaque élément a sa
   page ») Every member of a roomed register gets a REAL served page at
   `${family}/${id}` — the body is the inspector's own readout (readoutFor ·
   ONE renderer, never a fork) rendered full-page: the per-set meta table,
   the load-bearing links as rails, the parent register as the door up,
   prev/next chaining the set, and the TruthLine. The graph stays a lazy
   chunk (member-room-access); the prerendered HTML carries the whole
   readout as bytes (deep links land on content, not on a fetch). An
   unknown family or member renders the honest miss. The chrome speaks the
   register grammar (the /providers · /tools · /errors family). */

const islandId = (family: string, id: string) => `mr-${family}-${id}`

/* the family's OG card (the register's own card carries its rooms — a room
   without one fell back to the HOME card with the home alt, a mismatch) */
const FAMILY_OG: Record<string, { img: string; alt: string }> = {
  namespaces: { img: 'og-language', alt: 'The Nika language register: every schema-declared word, one page.' },
  types: { img: 'og-language', alt: 'The Nika language register: every schema-declared word, one page.' },
  edges: { img: 'og-flow', alt: 'How execution flows: two doors, one graph — the DAG falls out.' },
  predicates: { img: 'og-flow', alt: 'How execution flows: two doors, one graph — the DAG falls out.' },
  families: { img: 'og-tools', alt: 'The Nika standard library: versioned capability, no plugin store.' },
  modes: { img: 'og-tools', alt: 'The Nika standard library: versioned capability, no plugin store.' },
  permits: { img: 'og-boundary', alt: 'The boundary is declared: permits, secrets, the always-on floor.' },
  secrets: { img: 'og-boundary', alt: 'The boundary is declared: permits, secrets, the always-on floor.' },
  conformance: { img: 'og-proof', alt: 'Nothing on faith: conformance, the oracle, hash-chained traces.' },
  mcp: { img: 'og-proof', alt: 'Nothing on faith: conformance, the oracle, hash-chained traces.' },
  'error-namespaces': { img: 'og-errors', alt: 'The Nika error register: every refusal has a name, a category and a fix shape.' },
  'error-categories': { img: 'og-errors', alt: 'The Nika error register: every refusal has a name, a category and a fix shape.' },
  truth: { img: 'og-sources', alt: 'How this site tells the truth: pinned sources, two clocks, verify it yourself.' },
  providers: { img: 'og-providers', alt: 'Nika providers. Local first, bring your own keys, no lock-in.' },
}


export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { pathname } = useLocation()
  const family = pathname.split('/')[1] ?? ''
  const { id = '' } = useParams()
  const fam = MEMBER_ROOM_FAMILIES[family]
  const at = fam ? fam.members.findIndex((m) => m.id === id) : -1
  const member = at >= 0 ? fam!.members[at] : undefined

  const [got, setGot] = useState<{ key: string; readout: Readout | null }>(() => {
    const key = `${family}/${id}`
    if (!member) return { key, readout: null }
    if (import.meta.env.SSR) return { key, readout: ssrReadout(member.node) }
    try {
      const el = document.getElementById(islandId(family, id)) as HTMLTextAreaElement | null
      return { key, readout: el?.value ? (JSON.parse(el.value) as Readout) : null }
    } catch {
      return { key, readout: null }
    }
  })
  useEffect(() => {
    const key = `${family}/${id}`
    if (!member || (got.key === key && got.readout)) return
    let live = true
    void loadReadout(member.node).then((r) => {
      if (live) setGot({ key, readout: r })
    })
    return () => {
      live = false
    }
  }, [family, id, member, got.key, got.readout])
  const readout = got.key === `${family}/${id}` ? got.readout : null

  const title = member && fam ? `${member.title} · ${fam.title} · Nika` : 'Not a registered member · Nika'
  const description =
    readout?.opener ??
    (member && fam
      ? `${member.title}, one of ${fam.members.length} in ${fam.title} — every fact derived from the pinned spec and the released engine.`
      : 'This member is not in the register.')

  const og = FAMILY_OG[family]
  useHead({
    title,
    link: routeHead(`/${family}/${id}`).link,
    meta: [
      ...routeHead(`/${family}/${id}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      ...(og
        ? [
            { property: 'og:image', content: `https://nika.sh/${og.img}.png` },
            { property: 'og:image:alt', content: og.alt },
          ]
        : []),
      { name: 'twitter:title', content: title },
    ],
    script: member
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'DefinedTerm',
              '@id': `${SITE}${member.url}`,
              name: member.title,
              description,
              inDefinedTermSet: `${SITE}${fam!.hub}`,
            }),
            processTemplateParams: false,
          },
        ]
      : [],
  })

  if (!fam || !member) {
    return (
      <main className="theme-dark room-page">
        <section className="v4sec v4-in">
          <div className="v4sec-wrap">
            <p className="v4sec-fig">the registers</p>
            <h1 className="v4sec-title">Not a registered member.</h1>
            <p className="v4sec-lede">
              `{family}/{id}` names nothing in the atlas.{' '}
              {fam ? (
                <>
                  The register lists every member: <Link to={`/${family}`}>{fam.title}</Link>.
                </>
              ) : (
                <>
                  <Link to="/map">The map</Link> lists every register.
                </>
              )}
            </p>
          </div>
        </section>
      </main>
    )
  }

  const prev = at > 0 ? fam.members[at - 1] : undefined
  const next = at < fam.members.length - 1 ? fam.members[at + 1] : undefined

  return (
    <main className="theme-dark room-page">
      <section ref={ref} aria-labelledby="mr-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <Island
            id={islandId(family, id)}
            payload={readout ? JSON.stringify(readout) : ''}
          />
          <header>
            <p className="v4sec-fig" data-rise>
              {/* the true breadcrumb: room → family ROOT → teaching hub
                  (the roots were born 2026-07-24 · the hub keeps its own
                  door inside the readout rows) */}
              <Link to={`/${family}`} className="mr-up">
                {fam.title}
              </Link>
            </p>
            <h1 id="mr-title" className="v4sec-title room-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
              {readout?.kindGlyph ? (
                <span className="mr-glyph k-glyph" data-kind={readout.kind ?? undefined}>
                  {readout.kindGlyph}{' '}
                </span>
              ) : null}
              {member.title}
            </h1>
            <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
              {readout?.opener ??
                `One of ${fam.members.length} in ${fam.title.toLowerCase()} — every fact on this page derives from the pinned spec and the released engine, re-proven at every push.`}
            </p>
            {readout?.status && (
              <p className="room-authority st-mark" data-status={readout.status} data-rise>
                {readout.status} · derived from the pinned spec and the released engine ·
                re-proven at every push
              </p>
            )}
          </header>

          {/* the room's dimensions, at a glance — ABOUT the member, never the
              machinery (the meta stamps read as navel-gazing on every room) */}
          <StampStrip
            items={[
              { n: at + 1, label: 'the seat', sub: `of ${fam.members.length} · prev / next walk it` },
              { n: fam.members.length, label: 'in this register', sub: fam.title.toLowerCase() },
              readout?.kind
                ? { n: readout.kind, label: 'the kind', sub: 'the glyph the whole site speaks' }
                : { n: family, label: 'the family', sub: 'one route serves them all' },
              { n: readout?.status ?? 'derived', label: 'the clock', sub: 're-proven at every push' },
            ]}
          />

          {readout && readout.rows.length > 0 && (
            <section
              className="room-band"
              id="facts"
              aria-label="The member's facts"
              data-rise
              style={{ ['--rise-delay' as string]: '180ms' }}
            >
              <div className="cl-year-head">
                <span className="cl-year-n room-band-n">the facts</span>
                <span className="cl-year-rule" aria-hidden />
                <span className="cl-year-count">
                  {readout.rows.length} {readout.rows.length === 1 ? 'row' : 'rows'}
                </span>
              </div>
              <dl className="mr-rows">
                {readout.rows.map((r, i) => (
                  <div className="mr-row" key={i}>
                    <dt className="mr-row-label mono">{r.label}</dt>
                    <dd className="mr-row-value">
                      {r.value}
                      {r.links?.map((l) => (
                        <Link key={l.href} className="mr-row-link" to={l.href}>
                          {l.label}
                        </Link>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* the door renders only when it leads SOMEWHERE ELSE — a member
              whose canonical page IS this room was pointing at itself */}
          {readout?.door && readout.door.href !== member.url && (
            <p className="room-door">
              <Link to={readout.door.href}>{readout.door.label}</Link>
            </p>
          )}

          {/* a namespace that doubles as a language word gets the deeper
              door — the WORD_INDEX guard keeps it honest against the spec
              clock (the set follows canon.namespaceNames; a member the
              schema declares no key for simply shows no door) */}
          {family === 'namespaces' && WORD_INDEX[id] && (
            <p className="room-door">
              <Link to={`/language/${id}`}>the word's own room: {id} →</Link>
            </p>
          )}

          <nav
            className="room-band"
            id="siblings"
            aria-label="Neighbours in the register"
            data-rise
            style={{ ['--rise-delay' as string]: '210ms' }}
          >
            <div className="cl-year-head">
              <span className="cl-year-n room-band-n">neighbours</span>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {fam.members.length} {fam.members.length === 1 ? 'member' : 'members'} in the register
              </span>
            </div>
            <div className="hub-rails">
              {prev && (
                <Link className="hub-rail" to={prev.url}>
                  <span className="hub-rail-kind">prev</span>
                  {prev.title}
                </Link>
              )}
              {next && (
                <Link className="hub-rail" to={next.url}>
                  <span className="hub-rail-kind">next</span>
                  {next.title}
                </Link>
              )}
              <Link className="hub-rail" to={`/${family}`}>
                <span className="hub-rail-kind">all</span>
                {fam.title}
              </Link>
              <Link className="hub-rail" to={fam.hub}>
                <span className="hub-rail-kind">taught at</span>
                {fam.hub}
              </Link>
            </div>
          </nav>

          <footer className="hub-foot">
            <TruthLine nodeId={member.node} />
          </footer>
        </div>
      </section>
    </main>
  )
}
