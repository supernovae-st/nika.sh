import { useHead } from '@unhead/react'
import { routeHead } from '../content'
import { CANON } from '../canon.generated'
import { NIKA_VERB_HEX, NIKA_STATUS, type NikaVerbName } from '../design-tokens.generated'
import { LAYER_HEX, KIND_HEX, KIND_GLYPH, PAPER, MOTION_DUR_MS, MOTION_EASE, STATUS_RECIPE, type AtlasKind } from '../content/design.generated'
import { NK_ICONS, NK_ANIMS, type NikaIconId, type NikaAnimId } from '../icons/manifest'
import { NikaIcon } from '../icons/Icon'
import { NikaDots } from '../fx/dotmatrix/NikaDots'
import { DagNodeCard } from '../components/dag'
import './brand-page.css'

/* ─── /brand · the design system, shown by the system itself ──────────────
   Everything on this page is a PROJECTION: marks come from the served kit
   (/brand/*.svg), icons from the generated manifest (design/icons.yaml →
   NK_ICONS), motion from the anim/* entities (NK_ANIMS → NikaDots). Nothing
   here is hand-placed twice — edit the ontology, this page follows. Verb
   hues appear ONLY in the run-register demos (`live`), per the ink law. */

const NS_SECTIONS: { ns: string; title: string; blurb: string }[] = [
  { ns: 'verb/', title: 'The four verbs', blurb: 'A verb is a distinct native execution model. Hue = alive.' },
  { ns: 'builtin/', title: `The ${CANON.builtins} builtins`, blurb: 'Everything callable is a tool reached through invoke:.' },
  { ns: 'feature/', title: 'Features', blurb: 'The product surface: audit · run · trace · prove.' },
  { ns: 'state/', title: 'Run states', blurb: 'The trace fold: every settle has a face.' },
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
/* the run-register demo cards — LIVE library components (components/dag ·
   the exact DagNodeCard ThePlan renders on the home), one per verb, states
   from the recorded-run grammar. Data is illustrative; the DESIGN is the
   product's. */
const REGISTER_DEMOS: {
  id: string
  verb: NikaVerbName
  target: string
  when?: string
  chip?: { text: string; skipped?: boolean }
}[] = [
  { id: 'triage', verb: 'infer', target: 'ollama/llama3.2:3b', chip: { text: '29.2s' } },
  { id: 'convert', verb: 'exec', target: 'magick brief.png', chip: { text: '412ms' } },
  { id: 'save', verb: 'invoke', target: 'nika:write', chip: { text: '14ms' } },
  {
    id: 'review',
    verb: 'agent',
    target: 'claude · 3 turns max',
    when: 'tasks.triage.output != ""',
    chip: { text: 'skipped · gate closed', skipped: true },
  },
]

/* the shared palette rows — rendered FROM the generated module (the spec
   SSOT projection), never hand-typed: the swatch IS the token. */
const VERB_ROWS = (Object.entries(NIKA_VERB_HEX) as [NikaVerbName, string][]).map(
  ([name, hex]) => ({ name, hex, var: `--verb-${name}` }),
)
const STATUS_ROWS = Object.entries(NIKA_STATUS).map(([name, hex]) => ({ name, hex }))

/* the SITE-side design graph (fenêtre A emissions) — same projection law:
   the swatch IS the emission; the page cannot disagree with the compiler */
const LAYER_ROWS = Object.entries(LAYER_HEX).map(([name, hex]) => ({ name, hex, var: `--layer-${name}` }))
const PAPER_ROWS = Object.entries(PAPER).map(([name, hex]) => ({ name, hex, var: `--paper-${name}` }))
const DUR_ROWS = Object.entries(MOTION_DUR_MS).map(([name, ms]) => ({ name, ms, var: `--dur-${name}` }))
const EASE_NAMES = Object.keys(MOTION_EASE)
const CLOCK_ROWS = Object.entries(STATUS_RECIPE).map(([status, recipe]) => ({ status, recipe }))
const KIND_ROWS = (Object.keys(KIND_HEX) as AtlasKind[]).map((name) => ({
  name,
  hex: KIND_HEX[name],
  glyph: KIND_GLYPH[name],
}))

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
        content: 'Nika · One mark, one ontology: the machine-readable design system.',
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
          motion, declared once in the icon ontology, projected everywhere. Machine-readable:{' '}
          <a href="/brand/icons.json">icons.json</a> · <a href="/brand/icons.ttl">icons.ttl</a> ·{' '}
          <a href="https://docs.nika.sh/reference/design-system">integrator reference</a>.
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

      <section className="brand-sec" aria-labelledby="brand-register">
        <h2 id="brand-register" className="brand-h2">
          The run register · one component library
        </h2>
        <p className="brand-blurb">
          The task card below is the LIVE library component (<code>components/dag</code>): the
          exact one the home renders when a plan settles. The VS Code canvas draws its denser
          editor card from the same generated vocabulary: one source (
          <code>design/tokens.yaml</code>, spec-first), projected into TypeScript on every
          surface, pinned by drift gates. A verb hue appears on the tick only: hue = alive.
        </p>
        <div className="brand-register">
          {REGISTER_DEMOS.map((d) => (
            <DagNodeCard
              key={d.id}
              id={d.id}
              verb={d.verb}
              target={d.target}
              when={d.when}
              chip={d.chip}
            />
          ))}
        </div>
        <div className="brand-palette">
          <div className="brand-palette-group">
            <p className="brand-palette-kick">the four verb hues</p>
            <ul className="brand-swatches">
              {VERB_ROWS.map((r) => (
                <li key={r.name} className="brand-swatch">
                  <span className="brand-swatch-chip" style={{ background: r.hex }} />
                  <span className="brand-swatch-name">{r.name}</span>
                  <code className="brand-swatch-hex">{r.hex}</code>
                </li>
              ))}
            </ul>
          </div>
          <div className="brand-palette-group">
            <p className="brand-palette-kick">the run states</p>
            <ul className="brand-swatches">
              {STATUS_ROWS.map((r) => (
                <li key={r.name} className="brand-swatch">
                  <span className="brand-swatch-chip" style={{ background: r.hex }} />
                  <span className="brand-swatch-name">{r.name}</span>
                  <code className="brand-swatch-hex">{r.hex}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="brand-sec" aria-labelledby="brand-graph">
        <h2 id="brand-graph" className="brand-h2">
          The design graph · declared once, derived everywhere
        </h2>
        <p className="brand-blurb">
          The site side of the vocabulary: seven layer hues resolved from the spec spine, the
          shared paper chrome, motion as tokens, and the two-clocks mark. Every swatch below
          renders from the compiler's emission — this page cannot disagree with the graph.
          Tooling reads the same facts as{' '}
          <a href="/design-tokens.dtcg.json" className="brand-dtcg mono">
            design-tokens.dtcg.json
          </a>{' '}
          (W3C Design Tokens · Apache-2.0).
        </p>
        <div className="brand-palette">
          <div className="brand-palette-group">
            <p className="brand-palette-kick">the seven floors</p>
            <ul className="brand-swatches">
              {LAYER_ROWS.map((r) => (
                <li key={r.name} className="brand-swatch">
                  <span className="brand-swatch-chip" style={{ background: r.hex }} />
                  <span className="brand-swatch-name">{r.name}</span>
                  <code className="brand-swatch-hex">{r.var}</code>
                </li>
              ))}
            </ul>
          </div>
          <div className="brand-palette-group">
            <p className="brand-palette-kick">the paper chrome</p>
            <ul className="brand-swatches">
              {PAPER_ROWS.map((r) => (
                <li key={r.name} className="brand-swatch">
                  <span className="brand-swatch-chip brand-swatch-chip--lined" style={{ background: r.hex }} />
                  <span className="brand-swatch-name">{r.name}</span>
                  <code className="brand-swatch-hex">{r.hex}</code>
                </li>
              ))}
            </ul>
          </div>
          <div className="brand-palette-group">
            <p className="brand-palette-kick">the six kinds</p>
            <ul className="brand-swatches">
              {KIND_ROWS.map((r) => (
                <li key={r.name} className="brand-swatch">
                  <span className="brand-swatch-chip brand-swatch-chip--glyph" style={{ background: r.hex }}>
                    <span aria-hidden>{r.glyph}</span>
                  </span>
                  <span className="brand-swatch-name">{r.name}</span>
                  <code className="brand-swatch-hex">{`--kind-${r.name}`}</code>
                </li>
              ))}
            </ul>
          </div>
          <div className="brand-palette-group">
            <p className="brand-palette-kick">the two-clocks mark</p>
            <ul className="brand-swatches">
              {CLOCK_ROWS.map((r) => (
                <li key={r.status} className="brand-swatch">
                  <span className="st-mark brand-clock" data-status={r.status} />
                  <span className="brand-swatch-name">{r.status}</span>
                  <code className="brand-swatch-hex">{r.recipe}</code>
                </li>
              ))}
            </ul>
          </div>
          <div className="brand-palette-group">
            <p className="brand-palette-kick">motion tokens</p>
            <ul className="brand-swatches">
              {DUR_ROWS.map((r) => (
                <li key={r.name} className="brand-swatch">
                  <span className="brand-dur" style={{ ['--w' as string]: `${r.ms / 12}px` }} />
                  <span className="brand-swatch-name">{r.name}</span>
                  <code className="brand-swatch-hex">{r.ms}ms</code>
                </li>
              ))}
              <li className="brand-swatch">
                <span className="brand-swatch-name">eases</span>
                <code className="brand-swatch-hex">{EASE_NAMES.join(' · ')}</code>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="brand-sec" aria-labelledby="brand-motion">
        <h2 id="brand-motion" className="brand-h2">
          Motion · the dot-matrix register
        </h2>
        <p className="brand-blurb">
          A pattern is an execution model: infer samples, exec scans, invoke round-trips, the
          agent orbits its bounded loop, and the butterfly beats its wings.
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
