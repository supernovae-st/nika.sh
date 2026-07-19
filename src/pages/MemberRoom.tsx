import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { TruthLine } from '../components/TruthLine'
import { MEMBER_ROOM_FAMILIES } from '../content/member-rooms.generated'
import { ssrReadout, loadReadout } from '../lib/member-room-access'
import type { Readout } from '../shell/inspector-readout'
import { Island } from '../lib/ssg-island'
import { SITE, routeHead } from '../content'
import '../sections/v4-home.css'
import './hubs-page.css'

/* ─── the generic member room · one route, every family ──────────────────────
   (rooms universelles · operator verdict 2026-07-18: « chaque élément a sa
   page ») Every member of a roomed register gets a REAL served page at
   `${family}/${id}` — the body is the inspector's own readout (readoutFor ·
   ONE renderer, never a fork) rendered full-page: the per-set meta table,
   the load-bearing links as rails, the parent register as the door up,
   prev/next chaining the set, and the TruthLine. The graph stays a lazy
   chunk (member-room-access); the prerendered HTML carries the whole
   readout as bytes (deep links land on content, not on a fetch). An
   unknown family or member renders the honest miss. */

const islandId = (family: string, id: string) => `mr-${family}-${id}`

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

  useHead({
    title,
    link: routeHead(`/${family}/${id}`).link,
    meta: [
      ...routeHead(`/${family}/${id}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
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
      <main className="theme-dark hub-page">
        <section className="v4sec v4-in">
          <div className="v4sec-wrap hub-wrap">
            <p className="v4-kick">the registers</p>
            <h1 className="v4-h2">Not a registered member</h1>
            <p className="hub-opener">
              `{family}/{id}` names nothing in the atlas.{' '}
              {fam ? (
                <>
                  The register lists every member: <Link to={fam.hub}>{fam.title}</Link>.
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
    <main className="theme-dark hub-page">
      <section ref={ref} aria-labelledby="mr-title" className="v4sec v4-in">
        <div className="v4sec-wrap hub-wrap">
          <Island
            id={islandId(family, id)}
            payload={readout ? JSON.stringify(readout) : ''}
          />
          <header>
            <p className="v4-kick">
              <Link to={fam.hub} className="mr-up">
                {fam.title}
              </Link>{' '}
              · {at + 1}/{fam.members.length}
            </p>
            <h1 id="mr-title" className="v4-h2 mono">
              {readout?.kindGlyph ? <span className="mr-glyph">{readout.kindGlyph} </span> : null}
              {member.title}
            </h1>
            {readout?.opener && <p className="hub-opener">{readout.opener}</p>}
            {readout?.status && (
              <p className="hub-authority st-mark mono" data-status={readout.status}>
                {readout.status} · derived from the pinned spec and the released engine ·
                re-proven at every push
              </p>
            )}
          </header>

          {readout && readout.rows.length > 0 && (
            <section className="hub-sec" id="facts" aria-label="The member's facts">
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

          {readout?.door && (
            <p className="hub-sec-note">
              <Link to={readout.door.href}>{readout.door.label}</Link>
            </p>
          )}

          <nav className="hub-sec" id="siblings" aria-label="Neighbours in the register">
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
              <Link className="hub-rail" to={fam.hub}>
                <span className="hub-rail-kind">all</span>
                {fam.title}
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
