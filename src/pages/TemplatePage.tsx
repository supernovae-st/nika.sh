import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { CodeFile } from '../components/CodeFile'
/* lz-string is CJS — named ESM imports break the Node prerender (SSG);
   the default import is the law (Play.tsx · ScrollMorph.tsx) */
import lz from 'lz-string'
import { PlanMap } from '../components/PlanMap'
import { deriveWorkflow } from '../flagships/derive'
import { TEMPLATES, TEMPLATE_INDEX } from '../content/templates.generated'
import { TEMPLATE_GRANTS, TEMPLATE_CARRIES } from '../content/room-rails.generated'
import { SITE, SPEC, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'
import './tool-detail.css'

/* ─── /templates/:name · one skeleton, one room (theme-dark) ──────────────────
   The room ABOUT the skeleton — not the whole register re-served with one
   panel opened (the duplicate-content class the 2026-07-24 audit named).
   Everything derived: the entry from templates.generated (the served
   catalog's projection · sha256-pinned, re-hashed on every test run), the
   grants/carries rails from the atlas compiler (room-rails.generated).
   Unknown names keep the honest miss. Every room prerenders
   (TEMPLATE_PATHS) — deep links land on a real 200. */

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { name: rawName } = useParams()
  const name = (rawName ?? '').toLowerCase()
  const hit = TEMPLATE_INDEX[name]

  /* the routing-order walk (the README's own order · never alphabetical) */
  const at = useMemo(() => TEMPLATES.findIndex((t) => t.name === name), [name])
  const prev = at > 0 ? TEMPLATES[at - 1] : undefined
  const next = at >= 0 && at < TEMPLATES.length - 1 ? TEMPLATES[at + 1] : undefined
  const grants = hit ? (TEMPLATE_GRANTS[hit.name] ?? []) : []
  const carries = hit ? (TEMPLATE_CARRIES[hit.name] ?? []) : []
  /* the site's ONE plan grammar, on the skeleton itself — derived from
     the file (the same deriveWorkflow the library speaks), never drawn */
  const plan = useMemo(() => (hit ? deriveWorkflow(hit.yaml) : null), [hit])

  const title = hit
    ? `${hit.name} · a check-green Nika skeleton · Nika`
    : 'Not a registered skeleton · Nika'
  const description = hit
    ? `The ${hit.name} skeleton: ${hit.intent} ${hit.slots} SLOT decision points, green as-is under nika check, sha256-pinned and re-proven on every push.`
    : `${name} is not a skeleton the pack ships. The register lists all of them.`

  useHead({
    title,
    link: routeHead(`/templates/${name}`).link,
    meta: [
      ...routeHead(`/templates/${name}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-templates.png' },
      {
        property: 'og:image:alt',
        content: 'The Nika skeleton register: routing phrases, SLOT-marked files, sha-pinned.',
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
                  { '@type': 'ListItem', position: 1, name: 'The templates', item: `${SITE}/templates` },
                  { '@type': 'ListItem', position: 2, name: hit.name },
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'SoftwareSourceCode',
                '@id': `${SITE}/templates/${hit.name}`,
                name: `${hit.name}.nika.yaml`,
                description,
                url: `${SITE}/templates/${hit.name}`,
                programmingLanguage: 'YAML',
                codeRepository: `${SPEC}/tree/main/templates`,
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
      <section ref={ref} aria-labelledby="tm-title" className="v4sec v4-in" data-template={hit?.name}>
        <div className="v4sec-wrap">
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/templates" className="td-crumb-link">
              ← the skeleton register
            </Link>
            {hit && (
              <span className="tp-cat" title="the SLOT decision points the file marks">
                {hit.slots} slots · check-green as-is
              </span>
            )}
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the skeleton register
          </p>
          <h1
            id="tm-title"
            className="v4sec-title tp-title"
            data-rise
            style={{ ['--rise-delay' as string]: '80ms' }}
          >
            {hit ? hit.name : name}
          </h1>

          {!hit && (
            <div className="tp-miss" role="status" data-rise>
              <p className="tp-miss-name">{name}</p>
              <p>
                is not a skeleton the pack ships. Walk <Link to="/templates">the register</Link>{' '}
                (the routing phrases pick for you), ask the binary (<code>nika template</code>),
                or check <a href="/templates/catalog.json">the machine catalog</a>.
              </p>
            </div>
          )}

          {hit && (
            <>
              <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
                Your intent sounds like: <b>{hit.intent}</b> One of {TEMPLATES.length} skeletons
                the pack ships — green as-is under <code>nika check</code>, fill the{' '}
                <code># SLOT:</code> lines, repair from the fix lines, re-check. Machines read{' '}
                <a href="/templates/catalog.json">the catalog</a>; the binary answers{' '}
                <code>nika template</code>.
              </p>

              {/* the skeleton's dimensions, at a glance — every figure derived */}
              <StampStrip
                items={[
                  { n: hit.slots, label: 'SLOT points', sub: 'the only lines you edit' },
                  { n: hit.patterns.length, label: hit.patterns.length === 1 ? 'pattern locked' : 'patterns locked', sub: 'arrive correct, stay correct' },
                  { n: grants.length, label: grants.length === 1 ? 'tool granted' : 'tools granted', sub: 'the minimum for the job' },
                  { n: hit.sha256.slice(0, 8), label: 'sha-pinned', sub: 're-hashed on every test run' },
                ]}
              />

              {/* ── the plan · derived from the skeleton, never drawn ── */}
              {plan && plan.tasks.length > 0 && (
                <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
                  <div className="cl-year-head">
                    <h2 id="tm-plan" className="td-h2">
                      the plan
                    </h2>
                    <span className="cl-year-rule" aria-hidden />
                    <span className="cl-year-count">derived from the file, never drawn by hand</span>
                  </div>
                  <PlanMap
                    tasks={plan.tasks.map((t) => ({ id: t.id, verb: t.verb, wave: t.wave, gate: t.when }))}
                    waves={plan.waveCount}
                    well={`tm-${hit.name}`}
                  />
                </div>
              )}

              {/* ── the skeleton, whole ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
                <div className="cl-year-head">
                  <h2 id="tm-file" className="td-h2">
                    the file, whole
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                  <span className="cl-year-count">conformance-gated upstream on every spec push</span>
                </div>
                <div className="td-usage">
                  <CodeFile yaml={hit.yaml} filename={hit.file} />
                </div>
                <p className="td-pin">
                  sha256 <code>{hit.sha256.slice(0, 16)}…</code> — the copy above re-hashes to its
                  pin on every test run (a copy is re-provable, never trusted). Source:{' '}
                  <a href={`${SPEC}/blob/main/templates/${hit.file}`}>{hit.file}</a> in the spec pack ·{' '}
                  <Link to={`/play?y=${lz.compressToEncodedURIComponent(hit.yaml)}`}>
                    open it in the playground →
                  </Link>
                </p>
              </div>

              {/* ── what it locks in ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '220ms' }}>
                <div className="cl-year-head">
                  <h2 id="tm-patterns" className="td-h2">
                    the patterns it locks
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                </div>
                <ul className="td-chips">
                  {hit.patterns.map((p) => (
                    <li key={p}>
                      <span className="td-chip">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── cross-references ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '260ms' }}>
                <div className="cl-year-head">
                  <h2 id="tm-refs" className="td-h2">
                    cross-references
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                </div>
                <div className="td-refs">
                  {grants.length > 0 && (
                    <div>
                      <p className="td-ref-k">the tools it grants</p>
                      <ul className="td-chips">
                        {grants.map((t) => (
                          <li key={t}>
                            <Link className="td-chip" to={`/tools/${t}`}>
                              nika:{t}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {carries.length > 0 && (
                    <div>
                      <p className="td-ref-k">the words it carries</p>
                      <ul className="td-chips">
                        {carries.map((w) => (
                          <li key={w}>
                            <Link className="td-chip" to={`/language/${w}`}>
                              {w}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* ── the walk (routing order · the README's own) ── */}
              <nav className="td-nav" aria-label="Skeleton register walk" data-rise>
                {prev ? (
                  <Link className="td-nav-link" to={`/templates/${prev.name}`}>
                    <span className="td-nav-label">← previous</span>
                    {prev.name}
                  </Link>
                ) : (
                  <span />
                )}
                <Link className="td-nav-link td-nav-link--all" to="/templates">
                  <span className="td-nav-label">all {TEMPLATES.length}</span>
                  the register
                </Link>
                {next ? (
                  <Link className="td-nav-link td-nav-link--next" to={`/templates/${next.name}`}>
                    <span className="td-nav-label">next →</span>
                    {next.name}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>

              <p className="tp-foot" data-rise>
                Scaffold it locally:{' '}
                <code>
                  nika new my-flow.nika.yaml --from {hit.name}
                </code>
                . Try the shape in the{' '}
                <Link to="/play">playground</Link>, or walk{' '}
                <Link to="/use-cases">the showcase</Link> for the same patterns on real work.{' '}
                <Link to="/spec">Read the spec →</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
