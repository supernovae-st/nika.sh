import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
/* lz-string is CJS — named ESM imports break the Node prerender (SSG);
   import the default and destructure (the /play precedent). */
import lz from 'lz-string'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { CodeFile } from '../components/CodeFile'
import { TOOLS, TOOL_CATEGORIES, TOOL_INDEX } from '../content/tools.generated'
import { TOOL_USAGE } from '../content/tool-usage.generated'
import { CATEGORY_GLOSS } from '../content/tools-meta'
import { PartEgg } from '../scene/parts/PartEgg'
import { layoutDrum } from '../scene/tools-hud/slot-layout'
import { TOOL_SOURCES } from '../content/sources'
import { SourcesRail } from '../components/SourcesRail'
import { SPEC, SITE, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'
import './tool-detail.css'

const { compressToEncodedURIComponent } = lz

/* ─── /tools/:name · one builtin, one room (theme-dark) ───────────────────────
   The register (/tools) stays the vocabulary at a glance; each name now owns
   a real room: the arg contract, the tool INSIDE a real workflow, the
   skeletons that ship it, the check gates that name it, its family, and the
   prev/next walk. Detail without prose-drift — everything on the page is a
   projection:

     · contract        tools.generated.ts (the binary's own `nika catalog --tools --json`)
     · usage panel     tool-usage.generated.ts — a VERBATIM task excerpt from
                       a conformance-gated spec skeleton (real line numbers,
                       CodeFile firstLine law: the same body, partially shown)
                       or a complete crafted file, `nika check` green, schema-
                       re-validated by the drift gate on every test run
     · cross-refs      templates.generated (routing order) + errors registry
                       (code existence asserted at compile time)

   Same-file laws: the /errors · /providers · /templates register precedent
   for the head grammar; the poster law (v4-in baked); unknown names get the
   honest miss with recovery links, never a dead end.

   SSR-safe: every /tools/<name> page prerenders (TOOL_PATHS in
   site.config.ts); the playground handoff is a pure string compress at
   render. No effects beyond the shared reveal. */

/* the archetype the family wears in the parts catalog (part-model.ts) */
const ARCHETYPE_NAME: Record<string, string> = {
  core: 'regulator',
  file: 'cabinet',
  data: 'prism bench',
  network: 'dish',
  introspection: 'periscope',
  media: 'projector',
}

function ArgsContract({ bare }: { bare: string }) {
  const entry = TOOL_INDEX[bare]
  if (!entry || entry.args.length === 0) {
    return <p className="td-none">takes no arguments — the call itself is the signal.</p>
  }
  return (
    <dl className="tp-args td-args">
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
  )
}

function SectionHead({ id, title, count }: { id: string; title: string; count?: string }) {
  return (
    <div className="cl-year-head">
      <h2 id={id} className="td-h2">
        {title}
      </h2>
      <span className="cl-year-rule" aria-hidden />
      {count && <span className="cl-year-count">{count}</span>}
    </div>
  )
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { name: rawName } = useParams()
  const name = (rawName ?? '').toLowerCase().replace(/^nika:/, '')
  const hit = TOOL_INDEX[name]
  const usage = hit ? TOOL_USAGE[hit.bare] : undefined

  const family = useMemo(() => TOOLS.filter((t) => hit && t.category === hit.category), [hit])
  /* the drum's slot (register order — the pin drum's own reading) */
  const slot = useMemo(
    () => layoutDrum(TOOLS, TOOL_CATEGORIES).slots.find((s) => s.bare === name),
    [name],
  )
  const at = useMemo(() => TOOLS.findIndex((t) => t.bare === name), [name])
  const prev = at > 0 ? TOOLS[at - 1] : undefined
  const next = at >= 0 && at < TOOLS.length - 1 ? TOOLS[at + 1] : undefined
  const required = hit ? hit.args.filter((a) => a.required) : []

  /* the playground handoff — only a COMPLETE file is honest to open there
     (a skeleton excerpt alone would check red); template excerpts hand you
     the full skeleton room instead. */
  const playHref =
    usage && usage.source.kind === 'crafted'
      ? `/play?y=${compressToEncodedURIComponent(usage.yaml)}`
      : undefined

  const title = hit ? `${hit.name} · Nika standard library` : 'Standard library · Nika'
  const description = hit
    ? `${hit.name} — ${hit.description} Args: ${hit.args.map((a) => a.name + (a.required ? '*' : '')).join(', ')}. In a real file, with the skeletons that ship it.`
    : `nika:${name} is not a builtin the engine ships — the nika: namespace is closed. The register lists all of them.`

  useHead({
    title,
    link: routeHead(`/tools/${name}`).link,
    meta: [
      ...routeHead(`/tools/${name}`).meta,
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
    script: hit
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Standard library',
                    item: `${SITE}/tools`,
                  },
                  { '@type': 'ListItem', position: 2, name: hit.name },
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'DefinedTerm',
                name: hit.name,
                description: hit.description,
                url: `${SITE}/tools/${hit.bare}`,
                inDefinedTermSet: {
                  '@type': 'DefinedTermSet',
                  name: 'Nika standard library',
                  url: `${SITE}/tools`,
                },
              },
            ]),
            // unhead: don't HTML-escape JSON (keeps it valid ld+json, not &quot;)
            processTemplateParams: false,
          },
        ]
      : [],
  })

  return (
    <main className="theme-dark tp-page td-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section
        ref={ref}
        aria-labelledby="td-title"
        className="v4sec v4-in"
        data-tool={hit?.bare}
      >
        <div className="v4sec-wrap">
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/tools" className="td-crumb-link">
              ← the standard library
            </Link>
            {hit && (
              <span className="tp-cat" title={CATEGORY_GLOSS[hit.category] ?? ''}>
                {hit.category}
              </span>
            )}
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the standard library
          </p>
          <h1
            id="td-title"
            className="v4sec-title tp-title"
            data-rise
            style={{ ['--rise-delay' as string]: '80ms' }}
          >
            {hit ? hit.name : `nika:${name}`}
          </h1>

          {!hit && (
            <div className="tp-miss" role="status" data-rise>
              <p className="tp-miss-name">nika:{name}</p>
              <p>
                is not a builtin the engine ships — the <code>nika:</code> namespace is{' '}
                <em>closed</em> (engine-specific tools route through <code>mcp:</code> servers
                instead). Walk <Link to="/tools">the register</Link>, check{' '}
                <a href="/tools/catalog.json">the machine catalog</a> or the{' '}
                <a href={`${SPEC}/blob/main/spec/06-stdlib-contract.md`}>stdlib contract</a>.
              </p>
            </div>
          )}

          {hit && usage && (
            <div className="td-hero">
              <div className="td-hero-main">
              <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
                {hit.description} One of {TOOLS.length} builtins in the closed{' '}
                <code>nika:</code> namespace — {CATEGORY_GLOSS[hit.category]}.
              </p>

              {/* the room's dimensions, at a glance */}
              <StampStrip
                items={[
                  { n: hit.category, label: 'family', sub: `${family.length} tools` },
                  { n: hit.args.length, label: 'args', sub: 'declared contract' },
                  {
                    n: required.length,
                    label: 'required',
                    sub: required.length > 0 ? 'check teaches a miss' : 'all optional',
                  },
                  usage.templates.length > 0
                    ? { n: usage.templates.length, label: 'skeletons', sub: 'ship this tool' }
                    : { n: 'crafted', label: 'usage file', sub: 'check-green below' },
                ]}
              />

              {/* ── the contract · every arg the schema declares ─────────────── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
                <SectionHead
                  id="td-contract"
                  title="the contract"
                  count={`${hit.args.length} args · ${required.length} required`}
                />
                <p className="td-gloss">
                  A missing required arg is a <code>nika check</code> finding{' '}
                  <b>before anything runs</b> — the vocabulary below comes from the binary itself
                  (<code>nika catalog --tools --json</code>), not from prose.
                </p>
                <ArgsContract bare={hit.bare} />
              </div>

              {/* ── the tool in a real file ──────────────────────────────────── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '220ms' }}>
                <SectionHead
                  id="td-usage-h"
                  title="in a real file"
                  count={
                    usage.source.kind === 'template'
                      ? `from the ${usage.source.template} skeleton`
                      : 'a complete workflow'
                  }
                />
                <div className="td-usage">
                  <CodeFile
                    yaml={usage.yaml}
                    filename={usage.source.file}
                    firstLine={usage.source.kind === 'template' ? usage.source.firstLine : undefined}
                  />
                </div>
                {usage.source.kind === 'template' ? (
                  <p className="td-pin">
                    a verbatim excerpt — real line numbers from{' '}
                    <a href={`${SPEC}/blob/main/templates/${usage.source.file}`}>
                      {usage.source.file}
                    </a>
                    , conformance-gated upstream on every spec push.{' '}
                    <Link to={`/templates/${usage.source.template}`}>
                      open the full skeleton →
                    </Link>
                  </p>
                ) : (
                  <p className="td-pin">
                    a complete file, <code>nika check</code> green — the drift gate re-validates
                    this copy against <a href="/schema/workflow.json">the schema</a> on every test
                    run. <a href={playHref}>open it in the playground →</a>
                  </p>
                )}
              </div>

              {/* ── cross-references · skeletons + the check gates ───────────── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '260ms' }}>
                <SectionHead id="td-refs" title="cross-references" />
                <div className="td-refs">
                  <div>
                    <p className="td-ref-k">ships in skeletons</p>
                    {usage.templates.length > 0 ? (
                      <ul className="td-chips">
                        {usage.templates.map((t) => (
                          <li key={t}>
                            <Link className="td-chip" to={`/templates/${t}`}>
                              {t}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="td-none">
                        no skeleton ships it — the crafted file above is the reference.
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="td-ref-k">the check gates</p>
                    <ul className="td-chips">
                      {usage.errorCodes.map((c) => (
                        <li key={c}>
                          <Link className="td-chip" to={`/errors/${c}`}>
                            {c}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="td-ref-k">where it lives</p>
                    <SourcesRail links={TOOL_SOURCES} />
                  </div>
                </div>
              </div>

              {/* ── the family · siblings in the same bucket ─────────────────── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '300ms' }}>
                <SectionHead
                  id="td-family"
                  title={`the ${hit.category} family`}
                  count={`${family.length} tools`}
                />
                <p className="td-gloss">{CATEGORY_GLOSS[hit.category]}.</p>
                <ul className="td-chips">
                  {family.map((t) =>
                    t.bare === hit.bare ? (
                      <li key={t.bare}>
                        <span className="td-chip td-chip--here" aria-current="page">
                          {t.name}
                        </span>
                      </li>
                    ) : (
                      <li key={t.bare}>
                        <Link className="td-chip" to={`/tools/${t.bare}`}>
                          {t.name}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              {/* ── the walk · alphabetical, the register in the middle ──────── */}
              <nav className="td-nav" aria-label="Standard library walk" data-rise>
                {prev ? (
                  <Link className="td-nav-link" to={`/tools/${prev.bare}`}>
                    <span className="td-nav-label">← previous</span>
                    {prev.name}
                  </Link>
                ) : (
                  <span />
                )}
                <Link className="td-nav-link td-nav-link--all" to="/tools">
                  <span className="td-nav-label">all {TOOLS.length}</span>
                  the register
                </Link>
                {next ? (
                  <Link className="td-nav-link td-nav-link--next" to={`/tools/${next.bare}`}>
                    <span className="td-nav-label">next →</span>
                    {next.name}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>

              <p className="tp-foot" data-rise>
                Machines read the same vocabulary at{' '}
                <a href="/tools/catalog.json">/tools/catalog.json</a>; the contract lives in{' '}
                <a href={`${SPEC}/blob/main/spec/06-stdlib-contract.md`}>spec 06 · stdlib</a>.{' '}
                <Link to="/install">Install</Link> and ask the binary itself:{' '}
                <code>nika catalog --tools</code>. <Link to="/spec">Read the spec →</Link>
              </p>
              </div>

              {/* THE PART · the room's berth (≥1100px) — this builtin's own
                  machine, removed from the ship: the family names the
                  archetype, the ports ARE the args (bright = required).
                  Every room a different part, one ink (the parts catalog). */}
              <aside className="td-hero-berth" data-rise>
                <PartEgg id={hit.bare} />
                <p className="tdrum-caption">
                  part {String((slot?.index ?? 0) + 1).padStart(2, '0')}/{TOOLS.length} · the{' '}
                  {hit.category} {ARCHETYPE_NAME[hit.category]} · ports are the args — bright =
                  required
                </p>
                {/* the part's provenance — the sources, right under the machine */}
                <SourcesRail links={TOOL_SOURCES.slice(0, 3)} dense />
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
