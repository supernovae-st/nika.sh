import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import {
  LANGUAGE_SCOPES,
  LANGUAGE_WORDS,
  type LanguageWord,
} from '../content/language.generated'
import { WORD_GLOSS } from '../content/language-meta'
import { MEMBER_ROOM_FAMILIES } from '../content/member-rooms.generated'
import { CANON } from '../canon.generated'
import { SPEC, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'
import './tool-detail.css'
import './language-page.css'

/* ─── /language + /language/:word · the keyword register (theme-dark) ─────────
   Every key an author can type in a .nika.yaml, as an anchored row — the
   /errors recipe (one register, deep links land on their highlighted row),
   projected from the ONE contract the engine serves: workflow.schema.json
   via language.generated. A word that speaks at several surfaces (model:
   envelope · infer · agent) carries every declaration in its row; the four
   verbs link out to their rooms.

   Descriptions are the schema's own; where the contract is self-evident
   and carries none, the row speaks the editorial gloss (language-meta —
   clearly ours; the drift gate forbids naked rows).

   SSR-safe: /language AND every /language/<word> page prerender (PATHS +
   LANGUAGE_PATHS in site.config.ts). Highlight + the deep-link scroll stay
   client effects. */

function WordRow({ entry }: { entry: LanguageWord }) {
  const required = entry.decls.filter((d) => d.required)
  return (
    <li id={entry.word} className="lg-row">
      <div className="tp-row-head">
        <a className="tp-name" href={`/language/${entry.word}`}>
          {entry.word}
        </a>
        {entry.decls.map((d) => (
          <span key={d.scope} className="tp-cat" title={`speaks ${d.scope === 'envelope' ? 'at the envelope' : `inside ${d.scope}`}`}>
            {d.scope}
          </span>
        ))}
        {required.length > 0 && (
          <span
            className="tp-required"
            title={`required in: ${required.map((d) => d.scope).join(' · ')}`}
          >
            required in {required.map((d) => d.scope).join(' · ')}
          </span>
        )}
        {entry.verb && (
          <Link className="lg-room-link" to={`/verbs/${entry.word}`}>
            the verb's room →
          </Link>
        )}
      </div>
      <dl className="tp-args lg-decls">
        {entry.decls.map((d) => (
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
              {d.desc ?? WORD_GLOSS[entry.word]}
              {d.enum && (
                <span className="lg-enum">
                  {' '}
                  {d.enum.map((v) => (
                    <code key={v} className="lg-enum-val">
                      {v}
                    </code>
                  ))}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </li>
  )
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })

  const declsTotal = LANGUAGE_WORDS.reduce((n, w) => n + w.decls.length, 0)

  const title = 'The language · every word · Nika'
  const description = `Every key a .nika.yaml can carry: ${LANGUAGE_WORDS.length} words, ${declsTotal} declarations over ${LANGUAGE_SCOPES.length} surfaces, projected from the served schema. Every word opens its own room.`

  useHead({
    title,
    link: routeHead('/language').link,
    meta: [
      ...routeHead('/language').meta,
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
    /* JSON-LD: the canonical DefinedTermSets (set-words + set-namespaces,
       with version + license + per-term descriptions) land POST-BUILD from
       the compiler twin (vite.config jsonldTermsets · WO-7a) — the hand
       graph that lived here had already diverged from it (words only, no
       descriptions). Crawlers read the static head; nothing to mount. */
  })

  return (
    <main className="theme-dark tp-page lg-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="lg-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            the language
          </p>
          <h1 id="lg-title" className="v4sec-title tp-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            Every word.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Every key a <code>.nika.yaml</code> can carry, projected from the one contract the
            engine serves: <a href="/schema/workflow.json">workflow.schema.json</a>, the same file
            your editor validates against. Descriptions are the schema's own. <b>Every word opens its own room</b>; the
            contract, the word in a real file, the block it lives in; the{' '}
            <Link to="/verbs">four verbs</Link> keep theirs. The deeper grammar lives in{' '}
            <a href={`${SPEC}/tree/main/spec`}>the spec</a>.
          </p>

          {/* the vocabulary's dimensions, at a glance */}
          <StampStrip
            items={[
              { n: LANGUAGE_WORDS.length, label: 'words', sub: 'the whole surface' },
              { n: declsTotal, label: 'declarations', sub: `${LANGUAGE_SCOPES.length} surfaces` },
              { n: CANON.verbs, label: 'verbs', sub: 'rooms of their own' },
              { n: 'schema', label: 'the source', sub: 'never prose' },
            ]}
          />

          {/* the surfaces legend — the schema's own structure */}
          <ul className="lg-scopes" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
            {LANGUAGE_SCOPES.map((s) => (
              <li key={s.scope} className="lg-scope">
                <span className="lg-scope-k">{s.scope}</span>
                <span className="lg-scope-b">{s.blurb}</span>
              </li>
            ))}
          </ul>

          <ol className="tp-list lg-list" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
            {LANGUAGE_WORDS.map((w) => (
              <WordRow key={w.word} entry={w} />
            ))}
          </ol>

          {/* the roomed blocks around the words (rooms universelles): the
              namespaces and the value types own pages too — this register
              is their contextual door */}
          <div className="td-sec" data-rise>
            <div className="cl-year-head">
              <h2 id="lg-blocks" className="td-h2">
                the blocks around the words
              </h2>
              <span className="cl-year-rule" aria-hidden />
            </div>
            <div className="td-refs">
              <div>
                <p className="td-ref-k">
                  the namespaces · every <code>{'${{ … }}'}</code> reference starts at one
                </p>
                <ul className="td-chips">
                  {MEMBER_ROOM_FAMILIES.namespaces.members.map((m) => (
                    <li key={m.id}>
                      <Link className="td-chip" to={m.url}>
                        {m.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="td-ref-k">the value types · what a declared shape can be</p>
                <ul className="td-chips">
                  {MEMBER_ROOM_FAMILIES.types.members.map((m) => (
                    <li key={m.id}>
                      <Link className="td-chip" to={m.url}>
                        {m.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <p className="tp-foot" data-rise>
            A key the schema doesn't declare is a <code>nika check</code> finding{' '}
            <b>before anything runs</b>. The language teaches itself. Try it in the{' '}
            <Link to="/play">playground</Link>, walk <Link to="/verbs">the four verbs</Link> or{' '}
            <Link to="/tools">the standard library</Link>. <Link to="/spec">Read the spec →</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
