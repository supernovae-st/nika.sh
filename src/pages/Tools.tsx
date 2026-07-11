import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { TOOLS, TOOL_INDEX, TOOL_CATEGORIES, type ToolEntry } from '../content/tools.generated'
import { CANON } from '../canon.generated'
import { SPEC, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'

/* ─── /tools + /tools/:name · the standard library register (theme-dark) ──────
   Every `nika:` builtin as an anchored row — the vocabulary an author reaches
   for under `invoke:`. One register page, not 27 thin ones (the /errors
   precedent): the :name deep-link prerenders its own static landing, scrolls
   to its row and highlights it. Unknown names get an honest miss with the
   recovery links (never a dead end).

   Spec truth: rows come from src/content/tools.generated.ts — a compiled
   projection of public/tools/catalog.json, itself derived from the engine's
   own `nika tools --json` vocabulary (name · category · description · args
   with per-arg descriptions and the required set). The machine reads the
   JSON; humans read this register. Same artifact, two renderings — the page
   can never drift from what the binary answers.

   SSR-safe: /tools AND every /tools/<name> page prerender (PATHS +
   TOOL_PATHS in site.config.ts — DO's error_document beats the catchall, so
   a deep link must own its static landing to serve a 200). Highlight + the
   deep-link scroll stay client effects. */

const CATEGORY_GLOSS: Record<string, string> = {
  core: 'control flow and run-stream primitives',
  file: 'workspace files — read, write, search (permits.fs-gated)',
  data: 'pure JSON/data transforms — no I/O',
  network: 'network egress (permits.net-gated)',
  introspection: 'the workflow looking at itself',
  media: 'images, audio, charts — assets, not blobs',
}

function ToolRow({ entry, active }: { entry: ToolEntry; active: boolean }) {
  const required = entry.args.filter((a) => a.required)
  return (
    <li id={entry.bare} className={`tp-row${active ? ' tp-row--active' : ''}`}>
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
  const { name: rawName } = useParams()
  const name = rawName?.toLowerCase().replace(/^nika:/, '')
  const hit = name ? TOOL_INDEX[name] : undefined
  const miss = Boolean(name) && !hit

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

  const title = hit ? `${hit.name} · Nika standard library` : 'Standard library · Nika'
  const description = hit
    ? `${hit.name} — ${hit.description} Args: ${hit.args.map((a) => a.name + (a.required ? '*' : '')).join(', ')}.`
    : `Every nika: builtin the engine ships — ${CANON.builtins} tools across ${TOOL_CATEGORIES.length} families, one closed namespace, no plugin store to audit. Machine twin: /tools/catalog.json.`

  useHead({
    title,
    link: routeHead(name ? `/tools/${name}` : '/tools').link,
    meta: [
      ...routeHead(name ? `/tools/${name}` : '/tools').meta,
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

  /* the deep-link lands ON its row (client effect — prerender unaffected) */
  useEffect(() => {
    if (!hit) {
      return
    }
    const el = document.getElementById(hit.bare)
    el?.scrollIntoView({ block: 'center', behavior: 'instant' }) /* the smooth-hijack law: an arrival is not a travel */
  }, [hit])

  return (
    <main className="theme-dark tp-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="tp-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            the standard library
          </p>
          <h1 id="tp-title" className="v4sec-title tp-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            {hit ? hit.name : 'Tools.'}
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Everything callable is a tool under <code>invoke:</code> — and the engine ships its own.
            One closed <code>nika:</code> namespace, <b>no plugin store to audit</b>: these tools
            version with the spec and pass the same review as your file. Machines read the same
            vocabulary at <a href="/tools/catalog.json">/tools/catalog.json</a>; the contract lives
            in <a href={`${SPEC}/blob/main/spec/06-stdlib-contract.md`}>spec 06 · stdlib</a>.
          </p>

          {miss && (
            <div className="tp-miss" role="status" data-rise>
              <p className="tp-miss-name">nika:{name}</p>
              <p>
                is not a builtin the engine ships — the <code>nika:</code> namespace is{' '}
                <em>closed</em> (engine-specific tools route through <code>mcp:</code> servers
                instead). Check <a href="/tools/catalog.json">the machine catalog</a> or the{' '}
                <a href={`${SPEC}/blob/main/spec/06-stdlib-contract.md`}>stdlib contract</a>.
              </p>
            </div>
          )}

          {/* the library's dimensions, at a glance */}
          <StampStrip
            items={[
              { n: TOOLS.length, label: 'builtins', sub: 'one namespace' },
              { n: groups.length, label: 'families', sub: 'core → media' },
              { n: requiredTaught, label: 'required args', sub: 'check teaches' },
              { n: CANON.mcpTools, label: 'mcp tools', sub: 'the other lane' },
            ]}
          />

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
                  <ToolRow key={t.bare} entry={t} active={t.bare === name} />
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
