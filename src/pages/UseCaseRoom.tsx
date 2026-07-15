import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import lz from 'lz-string'
import { useRevealOnce } from '../sections/use-reveal-once'
import { CodeFile } from '../components/CodeFile'
import { TruthLine } from '../components/TruthLine'
import { Rails } from './hub-shared'
import { UC_TABS, yamlFor, verbsFor, fileFor, docsFor, type UC } from '../sections/usecases-data'
import { SHOWCASE_DAG } from '../sections/usecases-yaml.generated'
import { SITE, routeHead } from '../content'
import '../sections/v4-home.css'
import './hubs-page.css'

const { compressToEncodedURIComponent } = lz

/* ─── /use-cases/:slug · the showcase rooms (§4.13 · WO-5a) ──────────────────
   The richest data the site carries finally gets stable URLs: one room per
   conformance-gated showcase — the WHOLE file (the same-body law), the
   projected plan facts, the playground permalink (I6), derived rails
   (verbs from the projected DAG model · tools from its glosses — the same
   derivation the compiler's witnesses edges use, one source), prev/next
   inside the tier, the persona hub link, the §2bis gate badge and the
   truth line. Copy is the gallery's own curated presentation (UC rows) —
   zero new authored facts. All old-pin (NIKA LENS pause L1): the spec
   showcase corpus at the vendored projection. An unknown slug renders the
   honest miss (never a dead end). */

const ALL: { uc: UC; tab: string }[] = UC_TABS.flatMap((t) => t.cases.map((uc) => ({ uc, tab: t.label })))

/** the tools a showcase exercises — from the projected model's glosses
    (the compiler derives its witnesses edges from the same source) */
function toolsFor(slug: string): string[] {
  const seen: string[] = []
  for (const t of SHOWCASE_DAG[slug]?.tasks ?? []) {
    const m = /`nika:([a-z_]+)`/.exec(t.gloss)
    if (m && !seen.includes(m[1])) seen.push(m[1])
  }
  return seen
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { slug = '' } = useParams()
  const hit = ALL.find((x) => x.uc.slug === slug)
  const dag = SHOWCASE_DAG[slug]

  const title = hit ? `${hit.uc.title} · a real Nika workflow` : 'Showcase · Nika'
  const description = hit
    ? `${hit.uc.body} The whole file, conformance-gated in nika-spec: ${dag?.tasks.length ?? 0} tasks in ${dag?.waves ?? 0} waves.`
    : `${slug} is not a registered showcase. The gallery lists all of them.`

  useHead({
    title,
    link: routeHead(`/use-cases/${slug}`).link,
    meta: [
      ...routeHead(`/use-cases/${slug}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-use-cases.png' },
      { name: 'twitter:title', content: title },
    ],
    script: hit
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'TechArticle',
                  '@id': `${SITE}/use-cases/${slug}`,
                  name: title,
                  description: hit.uc.body,
                },
                {
                  '@type': 'SoftwareSourceCode',
                  name: fileFor(hit.uc),
                  programmingLanguage: 'YAML',
                  codeRepository: 'https://github.com/supernovae-st/nika-spec',
                },
              ],
            }),
            // unhead: don't HTML-escape JSON (keeps it valid ld+json, not &quot;)
            processTemplateParams: false,
          },
        ]
      : [{ type: 'application/ld+json', innerHTML: '{}', processTemplateParams: false }],
  })

  /* the honest miss covers BOTH registers: the curated gallery row (hit)
     AND the projected DAG — a slug in one but not the other is drift, and a
     room must never render half-true plan facts (or crash the prerender) */
  if (!hit || !dag) {
    return (
      <main className="theme-dark hub-page">
        <section className="v4sec v4-in">
          <div className="v4sec-wrap hub-wrap">
            <p className="v4-kick">the showcases</p>
            <h1 className="v4-h2">Not a registered showcase</h1>
            <p className="hub-opener">
              `{slug}` is not in the showcase corpus. Every registered workflow lives in{' '}
              <Link to="/use-cases">the gallery</Link>.
            </p>
          </div>
        </section>
      </main>
    )
  }

  const uc = hit.uc
  const yaml = yamlFor(uc)
  const verbs = verbsFor(uc)
  const tools = toolsFor(slug)
  const tier = ALL.filter((x) => x.uc.tier === uc.tier)
  const at = tier.findIndex((x) => x.uc.slug === slug)
  const prev = at > 0 ? tier[at - 1].uc : undefined
  const next = at < tier.length - 1 ? tier[at + 1].uc : undefined
  const playHref = `/play?y=${compressToEncodedURIComponent(yaml)}`

  return (
    <main className="theme-dark hub-page" style={{ ['--hub-hue' as string]: '#22d3ee' }}>
      <section ref={ref} aria-labelledby="ucr-title" className="v4sec v4-in">
        <div className="v4sec-wrap hub-wrap">
          <header>
            <p className="v4-kick">
              showcase · tier {uc.tier.slice(1)} · {hit.tab.toLowerCase()}
            </p>
            <h1 id="ucr-title" className="v4-h2">
              {uc.title}
            </h1>
            <p className="hub-opener">{uc.body}</p>
            <p className="hub-authority">
              {uc.outcome} · conformance-gated in{' '}
              <a href={`https://github.com/supernovae-st/nika-spec/blob/main/examples/showcase/${slug}.nika.yaml`}>
                nika-spec ↗
              </a>{' '}
              · re-proven at every push
            </p>
          </header>

          <section className="hub-sec" id="file" aria-labelledby="ucr-file-title">
            <h2 className="hub-sec-title" id="ucr-file-title">
              The whole file
            </h2>
            <p className="hub-sec-note">
              {dag.tasks.length} tasks · {dag.waves} wave{dag.waves > 1 ? 's' : ''} · the plan
              falls out of the bindings, nothing is scheduled by hand.
            </p>
            <CodeFile
              yaml={yaml}
              filename={fileFor(uc)}
              sourceHref={`https://github.com/supernovae-st/nika-spec/blob/main/examples/showcase/${slug}.nika.yaml`}
            />
            <Rails
              rails={[
                { kind: 'try it', label: 'open in the playground', href: playHref },
                { kind: 'guide', label: 'the walkthrough · docs', href: docsFor(uc) },
                ...verbs.map((v) => ({ kind: 'verb', label: v, href: `/verbs/${v}` })),
                ...tools.map((t) => ({ kind: 'tool', label: `nika:${t}`, href: `/tools/${t}` })),
              ]}
            />
          </section>

          <nav className="hub-sec" id="siblings" aria-label="More showcases in this tier">
            <h2 className="hub-sec-title">In the same tier</h2>
            <div className="hub-rails">
              {prev && (
                <Link className="hub-rail" to={`/use-cases/${prev.slug}`}>
                  <span className="hub-rail-kind">prev</span>
                  {prev.title}
                </Link>
              )}
              {next && (
                <Link className="hub-rail" to={`/use-cases/${next.slug}`}>
                  <span className="hub-rail-kind">next</span>
                  {next.title}
                </Link>
              )}
              <Link className="hub-rail" to="/use-cases">
                <span className="hub-rail-kind">all</span>
                the gallery
              </Link>
            </div>
          </nav>

          <footer className="hub-foot">
            <TruthLine nodeId={`showcase:${slug}`} />
          </footer>
        </div>
      </section>
    </main>
  )
}
