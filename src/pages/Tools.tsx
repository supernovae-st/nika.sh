import { useMemo } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { TOOLS, TOOL_CATEGORIES, type ToolEntry } from '../content/tools.generated'
import { CATEGORY_GLOSS } from '../content/tools-meta'
import { DrumEgg } from '../scene/tools-hud/DrumEgg'
import { CANON } from '../canon.generated'
import { SPEC, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'

/* ─── /tools · the standard library register (theme-dark) ─────────────────────
   Every `nika:` builtin as an anchored row — the vocabulary an author reaches
   for under `invoke:`, at a glance. Each name now owns a real room at
   /tools/<name> (ToolPage.tsx: the contract, the tool in a real file, the
   skeletons that ship it, the check gates) — this page stays the register:
   scan the families, open a room.

   Spec truth: rows come from src/content/tools.generated.ts — a compiled
   projection of public/tools/catalog.json, itself derived from the engine's
   own `nika tools --json` vocabulary (name · category · description · args
   with per-arg descriptions and the required set). The machine reads the
   JSON; humans read this register. Same artifact, two renderings — the page
   can never drift from what the binary answers.

   SSR-safe: /tools prerenders (PATHS in site.config.ts); the rooms own
   TOOL_PATHS. Rows keep their id anchors — /tools#fetch still lands. */

function ToolRow({ entry }: { entry: ToolEntry }) {
  const required = entry.args.filter((a) => a.required)
  return (
    <li id={entry.bare} className="tp-row">
      <div className="tp-row-head">
        <a className="tp-name" href={`/tools/${entry.bare}`}>
          {entry.name}
        </a>
        <span
          className="tp-cat"
          title={CATEGORY_GLOSS[entry.category] ?? 'see the stdlib contract'}
        >
          {entry.category}
        </span>
        {required.length > 0 && (
          <span
            className="tp-required"
            title={`required: ${required.map((a) => a.name).join(' · ')} — a miss is a nika check finding, not a runtime surprise`}
          >
            {required.length} required
          </span>
        )}
      </div>
      <p className="tp-desc">{entry.description}</p>
      {entry.args.length > 0 && (
        <dl className="tp-args">
          {entry.args.map((a) => (
            <div className="tp-arg" key={a.name}>
              <dt className={`tp-arg-name${a.required ? ' tp-arg-name--required' : ''}`}>
                {a.name}
                {a.required && (
                  <span className="tp-arg-star" title="required" aria-label="required">
                    *
                  </span>
                )}
              </dt>
              <dd className="tp-arg-desc">
                {a.type && <code className="tp-arg-type">{a.type}</code>}
                {a.desc}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  )
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })

  const groups = useMemo(
    () =>
      TOOL_CATEGORIES.map((category) => ({
        category,
        entries: TOOLS.filter((t) => t.category === category),
      })).filter((g) => g.entries.length > 0),
    [],
  )
  const requiredTaught = useMemo(
    () => TOOLS.reduce((n, t) => n + t.args.filter((a) => a.required).length, 0),
    [],
  )

  const title = 'Standard library · Nika'
  const description = `Every nika: builtin the engine ships — ${CANON.builtins} tools across ${TOOL_CATEGORIES.length} families, one closed namespace, no plugin store to audit. Machine twin: /tools/catalog.json.`

  useHead({
    title,
    link: routeHead('/tools').link,
    meta: [
      ...routeHead('/tools').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-tools.png' },
      {
        property: 'og:image:alt',
        content: 'The Nika standard library. Every tool the engine ships, one closed namespace.',
      },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
  })

  return (
    <main className="theme-dark tp-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="tp-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            the standard library
          </p>
          <h1 id="tp-title" className="v4sec-title tp-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            Tools.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Everything callable is a tool under <code>invoke:</code> — and the engine ships its own.
            One closed <code>nika:</code> namespace, <b>no plugin store to audit</b>: these tools
            version with the spec and pass the same review as your file. Every name opens its own
            room — the contract, the tool in a real file, the skeletons that ship it. Machines read
            the same vocabulary at <a href="/tools/catalog.json">/tools/catalog.json</a>; the
            contract lives in{' '}
            <a href={`${SPEC}/blob/main/spec/06-stdlib-contract.md`}>spec 06 · stdlib</a>.
          </p>

          {/* the library's dimensions, at a glance */}
          <StampStrip
            items={[
              { n: TOOLS.length, label: 'builtins', sub: 'one namespace' },
              { n: groups.length, label: 'families', sub: 'core → media' },
              { n: requiredTaught, label: 'required args', sub: 'check teaches' },
              { n: CANON.mcpTools, label: 'mcp tools', sub: 'the other lane' },
            ]}
          />

          {/* THE PIN DRUM · the library as one closed machine — every builtin
              a row, every pin a REAL argument (the drum of liberation plays,
              and what it plays is the vocabulary) */}
          <div data-rise style={{ ['--rise-delay' as string]: '170ms' }}>
            <DrumEgg mode="register" />
            <p className="tdrum-caption">
              the pin drum · {TOOLS.length} tools · {groups.length} arcs · pins are arguments —
              bright = required · hover a row to turn it
            </p>
          </div>

          {groups.map((group, gi) => (
            <div className="tp-family" key={group.category} data-rise style={{ ['--rise-delay' as string]: `${180 + gi * 30}ms` }}>
              <div className="cl-year-head">
                <span className="cl-year-n tp-family-n">{group.category}</span>
                <span className="cl-year-rule" aria-hidden />
                <span className="cl-year-count">
                  {group.entries.length} {group.entries.length === 1 ? 'tool' : 'tools'}
                </span>
              </div>
              <p className="tp-family-gloss">{CATEGORY_GLOSS[group.category]}</p>
              <ol className="tp-list">
                {group.entries.map((t) => (
                  <ToolRow key={t.bare} entry={t} />
                ))}
              </ol>
            </div>
          ))}

          <p className="tp-foot" data-rise>
            A missing required arg is a <code>nika check</code> finding <b>before anything runs</b> —
            the engine teaches its own vocabulary. Try one in the{' '}
            <Link to="/play">playground</Link>, or <Link to="/install">install</Link> and ask the
            binary itself: <code>nika tools</code>. <Link to="/spec">Read the spec →</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
