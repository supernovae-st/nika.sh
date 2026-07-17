import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { CodeFile } from '../components/CodeFile'
import {
  LANGUAGE_SCOPES,
  LANGUAGE_WORDS,
  WORD_INDEX,
} from '../content/language.generated'
import type { WordUsage } from '../content/language-usage.generated'
import { WORD_GLOSS } from '../content/language-meta'
import { sourcesForWord } from '../content/sources'
import { SourcesRail } from '../components/SourcesRail'
import { WORD_ACCEPTS, WORD_CHAPTERS, CHAPTER_FILES } from '../content/room-rails.generated'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { ssrBlogRails, loadBlogRails } from '../lib/blog-rails-access'
import { SPEC, SITE, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'
import './tool-detail.css'
import './language-page.css'

/* ─── /language/:word · one word, one room (theme-dark) ───────────────────────
   Every key the schema declares owns a room now — the ToolPage recipe,
   applied to the language itself. Everything on the page is a projection:

     · the contract     language.generated (the served workflow.schema.json:
                        scopes · required · types · enums · the deeper
                        invariants — format annotations and regexes)
     · in a real file   language-usage.generated — a VERBATIM slice of a
                        conformance-gated spec skeleton at its true line
                        numbers (or a crafted check-green file); words no
                        gated source speaks say so plainly; the four verbs
                        hand over to their rooms (/verbs/:name) instead of
                        duplicating the shape
     · cross-refs       the skeletons that carry the key · the registered
                        codes whose failure line NAMES the word · the
                        word's scope SIBLINGS (the block it lives in)

   SSR-safe: every /language/<word> page prerenders (LANGUAGE_PATHS).
   Unknown words get the honest miss. */

const SCOPE_BLURB = Object.fromEntries(LANGUAGE_SCOPES.map((s) => [s.scope, s.blurb]))

/* ─── the usage island · the initial-bundle diet (arc 13m, BlogPost's recipe) ──
   The verbatim usage slices (~30K src) are the room's heaviest cargo and
   WordPage is their only consumer — they no longer ride the initial bundle.
   Three paths to the SAME record:

   · SSG — the registry module is awaited in the SSR-only branch (the SSG
     module runner resolves it while loading the route graph; the branch is
     compile-time dead in the client build, so the module never enters the
     client graph).
   · client HYDRATION — the SSG serialized this word's record into the inline
     JSON island below; the first client render reads it back, byte-stable.
   · client SPA NAVIGATION — no island in the DOM (RootLayout keys the route
     subtree on pathname, so each nav remounts this page from scratch): the
     registry loads as its OWN chunk, once per session.

   `ready` gates the honest-miss copy — while the chunk is in flight the page
   must not claim "no gated source speaks it" (that would be a lie for the
   ~100ms the import takes on the first SPA room). */
let SSR_WORD_USAGE: Record<string, WordUsage> | null = null
if (import.meta.env.SSR) {
  SSR_WORD_USAGE = (await import('../content/language-usage.generated')).WORD_USAGE
}

const islandId = (word: string) => `wd-use-${word}`
/* </script> inside the JSON would close the island early — < survives
   JSON.parse unchanged in meaning and keeps the HTML inert */
const toIslandJson = (u: WordUsage | undefined) =>
  JSON.stringify(u ?? null).replace(/</g, '\\u003c')

function useWordUsage(word: string): { use: WordUsage | undefined; ready: boolean; json: string | null } {
  const [json, setJson] = useState<string | null>(() => {
    if (import.meta.env.SSR) return toIslandJson(SSR_WORD_USAGE?.[word])
    /* hydration: the island the SSG rendered is already in the DOM */
    return document.getElementById(islandId(word))?.textContent ?? null
  })
  useEffect(() => {
    if (json != null) return
    /* SPA navigation: pull the registry chunk (cached after the first room) */
    let live = true
    import('../content/language-usage.generated').then((m) => {
      if (live) setJson(toIslandJson(m.WORD_USAGE[word]))
    })
    return () => {
      live = false
    }
  }, [json, word])
  const use = useMemo(
    () => (json != null ? ((JSON.parse(json) ?? undefined) as WordUsage | undefined) : undefined),
    [json],
  )
  return { use, ready: json != null, json }
}

/* the room's « from the blog » slice rides a byte island (register-diet
   law) — the rails data never joins the initial chunk */
type BlogRefs = { slug: string; title: string; date: string }[]
const blogIslandId = (word: string) => `wd-blog-${word}`
function useWordBlogRefs(word: string): BlogRefs {
  const ssr = ssrBlogRails()
  const payload = useIslandPayload(
    blogIslandId(word),
    ssr ? JSON.stringify(ssr.FROM_BLOG[`word:${word}`] ?? []) : null,
    async () => JSON.stringify((await loadBlogRails()).FROM_BLOG[`word:${word}`] ?? []),
  )
  return payload ? (JSON.parse(payload) as BlogRefs) : []
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { word: rawWord } = useParams()
  const word = (rawWord ?? '').toLowerCase()
  const hit = WORD_INDEX[word]
  const blogRefs = useWordBlogRefs(hit?.word ?? '')
  const { use, ready, json: usageJson } = useWordUsage(hit?.word ?? word)

  const required = hit ? hit.decls.filter((d) => d.required) : []
  const types = hit ? [...new Set(hit.decls.map((d) => d.type).filter(Boolean))] : []
  const rawVoice = hit ? (hit.decls.find((d) => d.desc)?.desc ?? WORD_GLOSS[hit.word]) : undefined
  /* glosses are clause-style — the lede needs a sentence end */
  const voice = rawVoice && !/[.!?]$/.test(rawVoice.trim()) ? `${rawVoice.trim()}.` : rawVoice

  /* the alphabetical walk (the register's own order) */
  const at = useMemo(() => LANGUAGE_WORDS.findIndex((w) => w.word === word), [word])
  const prev = at > 0 ? LANGUAGE_WORDS[at - 1] : undefined
  const next = at >= 0 && at < LANGUAGE_WORDS.length - 1 ? LANGUAGE_WORDS[at + 1] : undefined

  /* the block the word lives in — siblings per scope, the room's cross-nav */
  const siblings = useMemo(
    () =>
      !hit
        ? []
        : hit.decls.map((d) => ({
            scope: d.scope,
            words: LANGUAGE_WORDS.filter(
              (w) => w.word !== hit.word && w.decls.some((x) => x.scope === d.scope),
            ).map((w) => w.word),
          })),
    [hit],
  )

  const title = hit ? `${hit.word} · the Nika language` : 'The language · Nika'
  const description = hit
    ? `${hit.word}: ${hit.decls.map((d) => `${d.scope}${d.required ? ' (required)' : ''}`).join(', ')}. ${voice ?? ''} In a real file, with the skeletons that carry it.`
    : `${word} is not a key the schema declares. The register lists all of them.`

  useHead({
    title,
    link: routeHead(`/language/${word}`).link,
    meta: [
      ...routeHead(`/language/${word}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-language.png' },
      {
        property: 'og:image:alt',
        content: 'The Nika language register: every schema-declared word, one page.',
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
                  { '@type': 'ListItem', position: 1, name: 'The language', item: `${SITE}/language` },
                  { '@type': 'ListItem', position: 2, name: hit.word },
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'DefinedTerm',
                name: hit.word,
                description: voice ?? '',
                url: `${SITE}/language/${hit.word}`,
                inDefinedTermSet: {
                  '@type': 'DefinedTermSet',
                  name: 'The Nika language · every word',
                  url: `${SITE}/language`,
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
      <section ref={ref} aria-labelledby="wd-title" className="v4sec v4-in" data-word={hit?.word}>
        <div className="v4sec-wrap">
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/language" className="td-crumb-link">
              ← the language
            </Link>
            {hit && (
              <span className="tp-cat" title="the surfaces this word speaks at">
                {hit.decls.map((d) => d.scope).join(' · ')}
              </span>
            )}
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the language
          </p>
          <h1
            id="wd-title"
            className="v4sec-title tp-title"
            data-rise
            style={{ ['--rise-delay' as string]: '80ms' }}
          >
            {hit ? hit.word : word}
          </h1>

          {!hit && (
            <div className="tp-miss" role="status" data-rise>
              <p className="tp-miss-name">{word}</p>
              <p>
                is not a key the schema declares. A key the contract doesn't know is a{' '}
                <code>nika check</code> finding before anything runs. Walk{' '}
                <Link to="/language">the register</Link>, the{' '}
                <a href="/schema/workflow.json">served schema</a>, or{' '}
                <a href={`${SPEC}/tree/main/spec`}>the spec</a>. Tool names live in{' '}
                <Link to="/tools">the standard library</Link>.
              </p>
            </div>
          )}

          {hit && (
            <>
              <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
                {voice} One of {LANGUAGE_WORDS.length} words the served contract declares,
                projected from <a href="/schema/workflow.json">workflow.schema.json</a>, the same
                file your editor validates against.
              </p>

              {/* the word's dimensions, at a glance */}
              <StampStrip
                items={[
                  {
                    n: hit.decls.length,
                    label: hit.decls.length === 1 ? 'surface' : 'surfaces',
                    sub: hit.decls.map((d) => d.scope).join(' · '),
                  },
                  required.length > 0
                    ? {
                        n: required.length,
                        label: 'required in',
                        sub: required.map((d) => d.scope).join(' · '),
                      }
                    : { n: 'optional', label: 'everywhere', sub: 'a choice, never a miss' },
                  { n: types[0] ?? 'any', label: types.length > 1 ? 'types' : 'type', sub: types.slice(1).join(' · ') || 'the declared shape' },
                  use && use.templates.length > 0
                    ? { n: use.templates.length, label: 'skeletons', sub: 'carry this key' }
                    : { n: 'schema', label: 'the source', sub: 'never prose' },
                ]}
              />

              {/* ── the contract · every declaration, with its invariants ────── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
                <div className="cl-year-head">
                  <h2 id="wd-contract" className="td-h2">
                    the contract
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                  <span className="cl-year-count">
                    {hit.decls.length} declaration{hit.decls.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="td-gloss">
                  Descriptions are the schema's own; the deeper invariants (value languages and
                  regexes) ride the same projection. A miss is a <code>nika check</code> finding{' '}
                  <b>before anything runs</b>.
                </p>
                <dl className="tp-args td-args">
                  {hit.decls.map((d) => (
                    <div className="tp-arg" key={d.scope}>
                      <dt className={`tp-arg-name${d.required ? ' tp-arg-name--required' : ''}`}>
                        {d.scope}
                        {d.required && (
                          <span className="tp-arg-star" title="required here" aria-label="required">
                            *
                          </span>
                        )}
                      </dt>
                      <dd className="tp-arg-desc">
                        {d.type && <code className="tp-arg-type">{d.type}</code>}
                        {d.format && (
                          <code className="tp-arg-type" title="the value's language">
                            {d.format}
                          </code>
                        )}
                        {d.desc ?? WORD_GLOSS[hit.word]}
                        <span className="td-none" style={{ display: 'block', margin: '2px 0 0' }}>
                          {SCOPE_BLURB[d.scope]}
                        </span>
                        {d.enum && (
                          <span className="lg-enum">
                            {d.enum.map((v) => (
                              <code key={v} className="lg-enum-val">
                                {v}
                              </code>
                            ))}
                          </span>
                        )}
                        {d.pattern && (
                          <span className="lg-enum">
                            <code className="lg-enum-val" title="the schema's own regex">
                              {d.pattern}
                            </code>
                          </span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* ── the word in a real file ──────────────────────────────────── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '220ms' }}>
                <div className="cl-year-head">
                  <h2 id="wd-usage" className="td-h2">
                    in a real file
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                  {use?.usage && (
                    <span className="cl-year-count">
                      {use.usage.source.kind === 'template'
                        ? `from the ${use.usage.source.name} skeleton`
                        : 'a crafted check-green file'}
                    </span>
                  )}
                </div>
                {hit.verb ? (
                  <p className="td-gloss">
                    <b>{hit.word}</b> is one of the four verbs; its room owns the complete file:
                    the shape, the block contract, the skeletons that speak it.{' '}
                    <Link to={`/verbs/${hit.word}`}>enter the verb's room →</Link>
                  </p>
                ) : use?.usage ? (
                  <>
                    <div className="td-usage">
                      <CodeFile
                        yaml={use.usage.yaml}
                        filename={use.usage.source.file}
                        firstLine={use.usage.source.firstLine}
                      />
                    </div>
                    <p className="td-pin">
                      a verbatim slice, real line numbers from{' '}
                      {use.usage.source.kind === 'template' ? (
                        <>
                          <a href={`${SPEC}/blob/main/templates/${use.usage.source.file}`}>
                            {use.usage.source.file}
                          </a>
                          , conformance-gated upstream on every spec push.{' '}
                          <Link to={`/templates/${use.usage.source.name}`}>
                            open the full skeleton →
                          </Link>
                        </>
                      ) : (
                        <>
                          {use.usage.source.file}, <code>nika check</code> green; the drift gate
                          re-proves this copy on every test run.
                        </>
                      )}
                    </p>
                  </>
                ) : ready ? (
                  <p className="td-gloss">
                    No gated source on this site speaks <code>{hit.word}</code> yet. The contract
                    above is the reference, and the register never invents evidence. Try it in the{' '}
                    <Link to="/play">playground</Link>: <code>nika check</code> teaches the shape.
                  </p>
                ) : null}
                {/* the island · the SSG writes it, hydration reads it back — the
                    raw string round-trips so the node matches byte for byte
                    (build-time JSON from our own registry, <-escaped, inert
                    application/json — the audited BlogPost recipe) */}
                <script
                  type="application/json"
                  id={islandId(hit.word)}
                  suppressHydrationWarning
                  dangerouslySetInnerHTML={{ __html: usageJson ?? 'null' }}
                />
              </div>

              {/* ── cross-references · gates + the block's siblings ──────────── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '260ms' }}>
                <div className="cl-year-head">
                  <h2 id="wd-refs" className="td-h2">
                    cross-references
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                </div>
                <div className="td-refs">
                  {use && use.templates.length > 0 && (
                    <div>
                      <p className="td-ref-k">skeletons that carry it</p>
                      <ul className="td-chips">
                        {use.templates.map((t) => (
                          <li key={t}>
                            <Link className="td-chip" to={`/templates/${t}`}>
                              {t}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {use && use.codes.length > 0 && (
                    <div>
                      <p className="td-ref-k">the check gates that name it</p>
                      <ul className="td-chips">
                        {use.codes.map((c) => (
                          <li key={c}>
                            <Link className="td-chip" to={`/errors/${c}`}>
                              {c}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ready && (!use || (use.templates.length === 0 && use.codes.length === 0)) && (
                    <p className="td-none">
                      no skeleton carries it and no registered code names it; the schema row is
                      the whole story today.
                    </p>
                  )}
                  <div>
                    <p className="td-ref-k">where it lives</p>
                    <SourcesRail links={sourcesForWord(hit)} />
                  </div>
                  {/* WO-5b · the atlas rails: which verbs accept the word
                      (schema-derived) + the chapters its scopes live in */}
                  {(WORD_ACCEPTS[hit.word] ?? []).length > 0 && (
                    <div>
                      <p className="td-ref-k">accepted by</p>
                      <ul className="td-chips">
                        {(WORD_ACCEPTS[hit.word] ?? []).map((v) => (
                          <li key={v}>
                            <a className="td-chip" href={`/verbs/${v}`}>
                              {v}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Island id={blogIslandId(hit.word)} payload={JSON.stringify(blogRefs)} />
                  {blogRefs.length > 0 && (
                    <div>
                      <p className="td-ref-k">from the blog</p>
                      <ul className="td-chips">
                        {blogRefs.map((b) => (
                          <li key={b.slug}>
                            <a className="td-chip" href={`/blog/${b.slug}`}>
                              {b.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="td-ref-k">defined by</p>
                    <ul className="td-chips">
                      {(WORD_CHAPTERS[hit.word] ?? []).map((ch) => (
                        <li key={ch}>
                          <a
                            className="td-chip"
                            href={`https://github.com/supernovae-st/nika-spec/blob/main/${CHAPTER_FILES[ch]}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {CHAPTER_FILES[ch].replace('spec/', '').replace('.md', '')}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* ── the block it lives in · scope siblings ───────────────────── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '300ms' }}>
                <div className="cl-year-head">
                  <h2 id="wd-block" className="td-h2">
                    the block it lives in
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                </div>
                {siblings.map((g) => (
                  <div key={g.scope} style={{ marginTop: 14 }}>
                    <p className="td-ref-k">
                      {g.scope}: {SCOPE_BLURB[g.scope]}
                    </p>
                    {g.words.length > 0 ? (
                      <ul className="td-chips">
                        {g.words.map((w) => (
                          <li key={w}>
                            <Link className="td-chip" to={`/language/${w}`}>
                              {w}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="td-none">this word is the whole surface.</p>
                    )}
                  </div>
                ))}
              </div>

              {/* ── the walk ─────────────────────────────────────────────────── */}
              <nav className="td-nav" aria-label="Language register walk" data-rise>
                {prev ? (
                  <Link className="td-nav-link" to={`/language/${prev.word}`}>
                    <span className="td-nav-label">← previous</span>
                    {prev.word}
                  </Link>
                ) : (
                  <span />
                )}
                <Link className="td-nav-link td-nav-link--all" to="/language">
                  <span className="td-nav-label">all {LANGUAGE_WORDS.length}</span>
                  the register
                </Link>
                {next ? (
                  <Link className="td-nav-link td-nav-link--next" to={`/language/${next.word}`}>
                    <span className="td-nav-label">next →</span>
                    {next.word}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>

              <p className="tp-foot" data-rise>
                The whole grammar in one place: <Link to="/verbs">the four verbs</Link> ·{' '}
                <Link to="/tools">the standard library</Link> ·{' '}
                <a href={`${SPEC}/tree/main/spec`}>the spec</a>. Try it in the{' '}
                <Link to="/play">playground</Link>. <Link to="/spec">Read the reference →</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
