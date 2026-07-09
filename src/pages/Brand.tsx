import { useHead } from '@unhead/react'
import { routeHead } from '../content'
import { NK_ICONS, NK_ANIMS, type NikaIconId, type NikaAnimId } from '../icons/manifest'
import { NikaIcon } from '../icons/Icon'
import { NikaDots } from '../fx/dotmatrix/NikaDots'
import './brand-page.css'

/* ─── /brand · the design system, shown by the system itself ──────────────
   Everything on this page is a PROJECTION: marks come from the served kit
   (/brand/*.svg), icons from the generated manifest (design/icons.yaml →
   NK_ICONS), motion from the anim/* entities (NK_ANIMS → NikaDots). Nothing
   here is hand-placed twice — edit the ontology, this page follows. Verb
   hues appear ONLY in the run-register demos (`live`), per the ink law. */

const NS_SECTIONS: { ns: string; title: string; blurb: string }[] = [
  { ns: 'verb/', title: 'The four verbs', blurb: 'A verb is a distinct native execution model. Hue = alive.' },
  { ns: 'builtin/', title: 'The 25 builtins', blurb: 'Everything callable is a tool reached through invoke:.' },
  { ns: 'feature/', title: 'Features', blurb: 'The product surface — audit · run · trace · prove.' },
  { ns: 'state/', title: 'Run states', blurb: 'The trace fold — every settle has a face.' },
]

const MARKS: { src: string; label: string; light?: boolean }[] = [
  { src: '/brand/nika-mark-dark.svg', label: 'mark · ice' },
  { src: '/brand/nika-mark-glow.svg', label: 'mark · glow' },
  { src: '/brand/nika-tile.svg', label: 'tile' },
  { src: '/brand/nika-logo-dark.svg', label: 'lockup · dark' },
  { src: '/brand/nika-logo-light.svg', label: 'lockup · light', light: true },
]

/* curated order first (the verbs · the brand beat · the neutral register);
   any anim/* entity added to the ontology later APPENDS instead of hiding —
   the page can't silently under-show the system. */
const MOTION_CURATED: NikaAnimId[] = [
  'anim/infer',
  'anim/exec',
  'anim/invoke',
  'anim/agent',
  'anim/butterfly',
  'anim/loading',
]
const MOTION_ORDER: NikaAnimId[] = [
  ...MOTION_CURATED,
  ...(Object.keys(NK_ANIMS) as NikaAnimId[]).filter((id) => !MOTION_CURATED.includes(id)),
]

export function Component() {
  const head = routeHead('/brand')
  useHead({
    title: 'Brand & design system · Nika',
    link: head.link,
    meta: [
      {
        name: 'description',
        content:
          'The nika design language: the butterfly-supernova marks, the ontology-driven icon library (every verb, builtin, feature and run-state), and the dot-matrix motion register.',
      },
      { property: 'og:image', content: 'https://nika.sh/og-brand.png' },
      {
        property: 'og:image:alt',
        content: 'Nika · One mark, one ontology — the machine-readable design system.',
      },
      { name: 'twitter:image', content: 'https://nika.sh/og-brand.png' },
      ...head.meta,
    ],
  })

  const iconIds = Object.keys(NK_ICONS) as NikaIconId[]

  return (
    <main className="theme-dark brand-page">
      <header className="brand-head">
        <p className="brand-eyebrow">[ DESIGN SYSTEM ]</p>
        <h1 className="brand-title">One mark, one ontology</h1>
        <p className="brand-lede">
          Every Nika verb, builtin, feature and run-state has a canonical glyph, color role and
          motion — declared once in the icon ontology, projected everywhere. Machine-readable:{' '}
          <a href="/brand/icons.json">icons.json</a> · <a href="/brand/icons.ttl">icons.ttl</a>.
        </p>
      </header>

      <section className="brand-sec" aria-labelledby="brand-marks">
        <h2 id="brand-marks" className="brand-h2">
          The marks
        </h2>
        <div className="brand-marks">
          {MARKS.map((m) => (
            <figure key={m.src} className={m.light ? 'brand-markcard brand-markcard--light' : 'brand-markcard'}>
              <img src={m.src} alt="" loading="lazy" />
              <figcaption>{m.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {NS_SECTIONS.map((sec) => {
        let inNs = iconIds.filter((id) => id.startsWith(sec.ns))
        if (sec.ns === 'verb/') {
          const canon = ['verb/infer', 'verb/exec', 'verb/invoke', 'verb/agent']
          inNs = canon.filter((id) => inNs.includes(id as NikaIconId)) as NikaIconId[]
        }
        const live = sec.ns === 'verb/'
        return (
          <section key={sec.ns} className="brand-sec" aria-label={sec.title}>
            <h2 className="brand-h2">{sec.title}</h2>
            <p className="brand-blurb">{sec.blurb}</p>
            <ul className="brand-grid">
              {inNs.map((id) => (
                <li key={id} className="brand-cell">
                  <NikaIcon id={id} size={22} live={live} />
                  <span className="brand-cell-label">{id.slice(sec.ns.length)}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <section className="brand-sec" aria-labelledby="brand-motion">
        <h2 id="brand-motion" className="brand-h2">
          Motion · the dot-matrix register
        </h2>
        <p className="brand-blurb">
          A pattern is an execution model: infer samples, exec scans, invoke round-trips, the
          agent orbits its bounded loop — and the butterfly beats its wings.
        </p>
        <ul className="brand-motion">
          {MOTION_ORDER.map((id) => (
            <li key={id} className="brand-motioncard">
              <NikaDots id={id} size={90} live={id !== 'anim/loading'} />
              <span className="brand-cell-label">{NK_ANIMS[id].label}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
