import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { CodeFile } from '../components/CodeFile'
import { CHAPTERS } from '../sections/verbs-data'
import { LANGUAGE_WORDS } from '../content/language.generated'
import { WORD_GLOSS } from '../content/language-meta'
import { TEMPLATES } from '../content/templates.generated'
import { ERROR_CODES } from '../content/errors.generated'
import { TOOLS } from '../content/tools.generated'
import { CANON } from '../canon.generated'
import { NIKA_VERB_HEX, NIKA_VERB_GLYPH } from '../design-tokens.generated'
import { SPEC, SITE, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'
import './tool-detail.css'
import './verbs-page.css'

/* ─── /verbs/:name · one verb, one room (theme-dark) ──────────────────────────
   The four verbs are the language's load-bearing words — each owns a room
   the way every builtin does (the ToolPage recipe, the verb's own hue as
   the page's ONE saturated field). Everything is a projection:

     · the shape        the verb chapter's complete minimal workflow
                        (verbs-data — schema-gated by the onpage-yaml suite)
     · the block        every key inside the verb block, from the served
                        contract (language.generated ← workflow.schema.json)
     · cross-refs       skeletons whose tasks speak the verb (templates
                        catalog) + the check gates in the verb's error
                        namespace (errors registry) — for invoke, the
                        builtin/MCP gates too (those ARE invoke findings)

   SSR-safe: all four rooms prerender (VERB_PATHS in site.config.ts).
   Unknown names get the honest miss. */

const VERB_ERROR_NS: Record<string, string[]> = {
  infer: ['NIKA-INFER'],
  exec: ['NIKA-EXEC'],
  invoke: ['NIKA-INVOKE', 'NIKA-BUILTIN', 'NIKA-MCP'],
  agent: ['NIKA-AGENT'],
}

/* the verb's one-line job — the chapter claim+gloss speak it; this is the
   machine-lane line under the stamps */
const VERB_LANE: Record<string, string> = {
  infer: `any of ${CANON.providers} providers — local first, your keys, no lock-in`,
  exec: 'string form rides /bin/sh · array form is execve, no shell — the injection-safe lane',
  invoke: `${CANON.builtins} nika: builtins + mcp:<server>/<tool> — everything callable is a tool`,
  agent: 'default-deny tools · max_turns + max_tokens_total — never an unleashed loop',
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { name: rawName } = useParams()
  const name = (rawName ?? '').toLowerCase()
  const chapter = CHAPTERS.find((c) => c.verb === name)

  const block = useMemo(
    () =>
      LANGUAGE_WORDS.flatMap((w) =>
        w.decls.filter((d) => d.scope === name).map((d) => ({ word: w.word, ...d })),
      ),
    [name],
  )
  const required = block.filter((d) => d.required)
  const templates = useMemo(
    () => TEMPLATES.filter((t) => new RegExp(`^\\s+${name}:`, 'm').test(t.yaml)).map((t) => t.name),
    [name],
  )
  const codes = useMemo(() => {
    const ns = VERB_ERROR_NS[name] ?? []
    return ERROR_CODES.filter((e) => ns.some((n) => e.code.startsWith(`${n}-`))).map((e) => e.code)
  }, [name])

  const at = CHAPTERS.findIndex((c) => c.verb === name)
  const prev = at > 0 ? CHAPTERS[at - 1] : undefined
  const next = at >= 0 && at < CHAPTERS.length - 1 ? CHAPTERS[at + 1] : undefined

  const title = chapter ? `${chapter.verb} · the four verbs · Nika` : 'The four verbs · Nika'
  const description = chapter
    ? `${chapter.verb} — ${chapter.claim} ${chapter.gloss} The block contract (${block.length} keys, ${required.length} required), a complete minimal file, the skeletons that speak it.`
    : `${name} is not a Nika verb — the language ships exactly four: infer, exec, invoke, agent.`

  useHead({
    title,
    link: routeHead(`/verbs/${name}`).link,
    meta: [
      ...routeHead(`/verbs/${name}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og.png' },
      {
        property: 'og:image:alt',
        content: 'Nika — Intent as Code. Four verbs: infer, exec, invoke, agent.',
      },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: chapter
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'The four verbs', item: `${SITE}/verbs` },
                  { '@type': 'ListItem', position: 2, name: chapter.verb },
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'DefinedTerm',
                name: chapter.verb,
                description: `${chapter.claim} ${chapter.gloss}`,
                url: `${SITE}/verbs/${chapter.verb}`,
                inDefinedTermSet: {
                  '@type': 'DefinedTermSet',
                  name: 'Nika language · the four verbs',
                  url: `${SITE}/verbs`,
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
    <main className="theme-dark tp-page td-page vb-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section
        ref={ref}
        aria-labelledby="vb-title"
        className="v4sec v4-in"
        data-verb={chapter?.verb}
        style={chapter ? ({ ['--vb-hue' as string]: NIKA_VERB_HEX[chapter.verb] } as React.CSSProperties) : undefined}
      >
        <div className="v4sec-wrap">
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/verbs" className="td-crumb-link">
              ← the four verbs
            </Link>
            {chapter && (
              <span className="tp-cat" title="one of the four native execution models">
                verb {at + 1}/4
              </span>
            )}
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the language
          </p>
          <h1
            id="vb-title"
            className="v4sec-title tp-title vb-title"
            data-rise
            style={{ ['--rise-delay' as string]: '80ms' }}
          >
            {chapter && (
              <span className="vb-glyph" aria-hidden>
                {NIKA_VERB_GLYPH[chapter.verb]}
              </span>
            )}
            {chapter ? chapter.verb : name}
          </h1>

          {!chapter && (
            <div className="tp-miss" role="status" data-rise>
              <p className="tp-miss-name">{name}</p>
              <p>
                is not a Nika verb — the language ships exactly four, locked forever:{' '}
                <Link to="/verbs/infer">infer</Link> · <Link to="/verbs/exec">exec</Link> ·{' '}
                <Link to="/verbs/invoke">invoke</Link> · <Link to="/verbs/agent">agent</Link>.
                Everything callable is a tool under <code>invoke:</code> — see{' '}
                <Link to="/tools">the standard library</Link>.
              </p>
            </div>
          )}

          {chapter && (
            <>
              <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
                <b>{chapter.claim}</b> {chapter.gloss} One of the four verbs — a verb is a{' '}
                <em>distinct native execution model</em>, and every task speaks exactly one.{' '}
                {VERB_LANE[chapter.verb]}.
              </p>

              {/* the verb's dimensions, at a glance */}
              <StampStrip
                items={[
                  { n: block.length, label: 'block keys', sub: 'the contract' },
                  {
                    n: required.length,
                    label: 'required',
                    sub: required.map((d) => d.word).join(' · ') || 'all optional',
                  },
                  { n: codes.length, label: 'check gates', sub: 'typed findings' },
                  templates.length > 0
                    ? { n: templates.length, label: 'skeletons', sub: 'speak this verb' }
                    : { n: chapter.n, label: 'chapter', sub: 'on the home reading' },
                ]}
              />

              {/* ── the shape · a complete minimal file ──────────────────────── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
                <div className="cl-year-head">
                  <h2 id="vb-shape" className="td-h2">
                    the shape
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                  <span className="cl-year-count">a complete workflow</span>
                </div>
                <p className="td-gloss">
                  Schema-valid whole — this exact text passes <code>nika check</code> (the on-page
                  YAML gate re-validates it on every test run).
                </p>
                <div className="td-usage">
                  <CodeFile yaml={chapter.yaml} filename={chapter.filename} />
                </div>
              </div>

              {/* ── the block contract · every key, from the served schema ───── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '220ms' }}>
                <div className="cl-year-head">
                  <h2 id="vb-block" className="td-h2">
                    inside {chapter.verb}:
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                  <span className="cl-year-count">
                    {block.length} keys · {required.length} required
                  </span>
                </div>
                <p className="td-gloss">
                  The block's vocabulary comes from the served contract itself (
                  <a href="/schema/workflow.json">workflow.schema.json</a>) — each key opens its
                  register row.
                </p>
                <dl className="tp-args td-args">
                  {block.map((d) => (
                    <div className="tp-arg" key={d.word}>
                      <dt className={`tp-arg-name${d.required ? ' tp-arg-name--required' : ''}`}>
                        <Link className="vb-word-link" to={`/language/${d.word}`}>
                          {d.word}
                        </Link>
                        {d.required && (
                          <span className="tp-arg-star" title="required" aria-label="required">
                            *
                          </span>
                        )}
                      </dt>
                      <dd className="tp-arg-desc">
                        {d.type && <code className="tp-arg-type">{d.type}</code>}
                        {d.desc ?? WORD_GLOSS[d.word]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* ── cross-references ─────────────────────────────────────────── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '260ms' }}>
                <div className="cl-year-head">
                  <h2 id="vb-refs" className="td-h2">
                    cross-references
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                </div>
                <div className="td-refs">
                  <div>
                    <p className="td-ref-k">skeletons that speak it</p>
                    {templates.length > 0 ? (
                      <ul className="td-chips">
                        {templates.map((t) => (
                          <li key={t}>
                            <Link className="td-chip" to={`/templates/${t}`}>
                              {t}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="td-none">no skeleton leads with it — the shape above is the reference.</p>
                    )}
                  </div>
                  <div>
                    <p className="td-ref-k">the check gates</p>
                    <ul className="td-chips">
                      {codes.map((c) => (
                        <li key={c}>
                          <Link className="td-chip" to={`/errors/${c}`}>
                            {c}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {chapter.verb === 'invoke' && (
                    <div>
                      <p className="td-ref-k">the vocabulary</p>
                      <p className="td-none">
                        everything callable is a tool — <Link to="/tools">the {TOOLS.length}{' '}
                        builtins</Link> are invoke's standard library; <code>mcp:</code> servers are
                        the other lane.
                      </p>
                    </div>
                  )}
                  {chapter.verb === 'infer' && (
                    <div>
                      <p className="td-ref-k">the providers</p>
                      <p className="td-none">
                        <Link to="/providers">{CANON.providers} spec-named providers</Link> — local
                        first, your keys ride env vars, never a config file.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── the walk ─────────────────────────────────────────────────── */}
              <nav className="td-nav" aria-label="The four verbs walk" data-rise>
                {prev ? (
                  <Link className="td-nav-link" to={`/verbs/${prev.verb}`}>
                    <span className="td-nav-label">← previous</span>
                    {prev.verb}
                  </Link>
                ) : (
                  <span />
                )}
                <Link className="td-nav-link td-nav-link--all" to="/verbs">
                  <span className="td-nav-label">all 4</span>
                  the verbs
                </Link>
                {next ? (
                  <Link className="td-nav-link td-nav-link--next" to={`/verbs/${next.verb}`}>
                    <span className="td-nav-label">next →</span>
                    {next.verb}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>

              <p className="tp-foot" data-rise>
                The verbs are locked forever — four, never five (<code>fetch</code> is a builtin,
                not a verb; ordering is the DAG's job, not a word's). The grammar lives in{' '}
                <a href={`${SPEC}/blob/main/spec/02-verbs.md`}>spec 02 · verbs</a>; every other key
                is in <Link to="/language">the keyword register</Link>.{' '}
                <Link to="/spec">Read the spec →</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
