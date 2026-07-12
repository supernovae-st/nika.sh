import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { CHAPTERS } from '../sections/verbs-data'
import { LANGUAGE_WORDS } from '../content/language.generated'
import { CANON } from '../canon.generated'
import { NIKA_VERB_HEX, NIKA_VERB_GLYPH } from '../design-tokens.generated'
import { SPEC, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'
import './verbs-page.css'

/* ─── /verbs · the four verbs register (theme-dark) ───────────────────────────
   The language's load-bearing words, each opening its room (/verbs/:name —
   the VerbPage recipe). Four rows, each wearing its verb's hue (the home
   Verbs section's own grammar — four chapters, four hues); counts derive
   from the schema projection (language.generated) and the canon. */

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })

  const blockCount = (verb: string) =>
    LANGUAGE_WORDS.reduce((n, w) => n + (w.decls.some((d) => d.scope === verb) ? 1 : 0), 0)

  const title = 'The four verbs · Nika'
  const description = `Nika ships exactly ${CANON.verbs} verbs — infer, exec, invoke, agent — locked forever. A verb is a distinct native execution model; every task speaks exactly one. Each opens its room: the block contract, a complete file, the skeletons that speak it.`

  useHead({
    title,
    link: routeHead('/verbs').link,
    meta: [
      ...routeHead('/verbs').meta,
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
  })

  return (
    <main className="theme-dark tp-page vb-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="vbs-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            the language
          </p>
          <h1 id="vbs-title" className="v4sec-title tp-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            Four verbs.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Locked forever — four, never five. A verb is a <em>distinct native execution model</em>,
            and every task speaks exactly one; everything <em>callable</em> is a tool under{' '}
            <code>invoke:</code>, everything about <em>ordering</em> is the DAG's job. Each verb
            opens its own room; every other key lives in{' '}
            <Link to="/language">the keyword register</Link>. The grammar:{' '}
            <a href={`${SPEC}/blob/main/spec/02-verbs.md`}>spec 02 · verbs</a>.
          </p>

          {/* the grammar's dimensions, at a glance */}
          <StampStrip
            items={[
              { n: CANON.verbs, label: 'verbs', sub: 'locked forever' },
              { n: CANON.builtins, label: 'builtins', sub: 'under invoke:' },
              { n: CANON.providers, label: 'providers', sub: 'under infer:' },
              { n: 'one', label: 'per task', sub: 'never two' },
            ]}
          />

          <ol className="vbs-list" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
            {CHAPTERS.map((c, i) => (
              <li
                key={c.verb}
                className="vbs-row"
                style={{ ['--vb-hue' as string]: NIKA_VERB_HEX[c.verb] }}
              >
                <span className="vbs-fig" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="vbs-body">
                  <div className="tp-row-head">
                    <Link className="tp-name vbs-name" to={`/verbs/${c.verb}`}>
                      <span className="vb-glyph" aria-hidden>
                        {NIKA_VERB_GLYPH[c.verb]}
                      </span>
                      {c.verb}
                    </Link>
                    <span className="tp-cat" title="keys inside the verb block, from the served schema">
                      {blockCount(c.verb)} block keys
                    </span>
                  </div>
                  <p className="tp-desc">
                    <b>{c.claim}</b> {c.gloss}
                  </p>
                  <p className="vbs-open">
                    <Link to={`/verbs/${c.verb}`}>open the room →</Link>
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="tp-foot" data-rise>
            Why four? <code>fetch</code> is a builtin, <code>recall</code> is a tool, ordering is a
            DAG construct — a verb only exists where the <em>execution model</em> differs. Try one
            in the <Link to="/play">playground</Link>, or walk{' '}
            <Link to="/language">every word the schema declares</Link>.{' '}
            <Link to="/spec">Read the spec →</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
