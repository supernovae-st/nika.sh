import { useMemo } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead } from '../content'
import { StampStrip } from '../components/StampStrip'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { ssrIntegrations, loadIntegrations } from '../lib/integrations-access'
import type { IntegrationEntry } from '../content/integrations'
import { CATALOG_ENGINE } from '../content/catalog-paths.generated'
import { LESSONS_PIN } from '../content/lessons.generated'
import { crumbLd, ldScript } from '../lib/ld'
import '../sections/v4-home.css'
import './page-chrome.css'
import './how-page.css'
import './tool-detail.css'

/* ─── /city · where every piece lives (the belvédère, 2026-08-02) ────────────
   The reader asked the question this page answers: « ça appartient à quel
   repo, où ça vit ». /map draws every PAGE; /truth defines the words the
   site tells the truth with; neither says which REPO a given room's facts
   came out of, or at which commit this site read them.

   Two clocks govern everything here, and they tick independently: the spec
   pin (the language) and the engine pin (what the released binary knows).
   A room on this site belongs to exactly one of them, or to neither (the
   site's own prose), and saying which is the whole job of this page.

   The repo rows come from the authored surface register (README-true by
   law, integrations.ts) through the same island door /integrations uses.
   The « what this feeds » column is the only authored thing here, and it
   is a claim a reader can check by walking the link. */

/* which worlds on this site project from which repo · a claim you can walk */
const FEEDS: Record<string, { label: string; to: string }[]> = {
  spec: [
    { label: 'The specification, chapter by chapter', to: '/language/spec' },
    { label: 'The teaching path', to: '/workflows' },
    { label: 'Real jobs', to: '/workflows/jobs' },
    { label: 'Skeletons', to: '/workflows/skeletons' },
    { label: 'Every word the language knows', to: '/language' },
    { label: 'The standard library', to: '/language/stdlib' },
  ],
  engine: [
    { label: 'The catalog', to: '/catalog' },
    { label: 'Error codes', to: '/errors' },
    { label: 'Client coverage', to: '/integrations' },
    { label: 'The ship log', to: '/changelog' },
  ],
  registry: [{ label: 'Send a workflow', to: '/convert' }],
  'client-sdk': [{ label: 'The TypeScript client', to: '/integrations/client-sdk' }],
  docs: [{ label: 'The docs', to: '/integrations/docs' }],
  homebrew: [{ label: 'Install', to: '/install' }],
  website: [
    { label: 'The map', to: '/map' },
    { label: 'The truth system', to: '/truth' },
    { label: 'The blog', to: '/blog' },
  ],
  'audit-workflow': [{ label: 'The archived site audit', to: '/integrations/audit-workflow' }],
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02 })
  const payload = useIslandPayload(
    'city',
    (() => {
      const m = ssrIntegrations()
      return m ? JSON.stringify(m.INTEGRATIONS.filter((e) => e.kind === 'surface')) : null
    })(),
    async () =>
      JSON.stringify((await loadIntegrations()).INTEGRATIONS.filter((e) => e.kind === 'surface')),
  )
  const surfaces = useMemo(
    () => (payload ? (JSON.parse(payload) as IntegrationEntry[]) : []),
    [payload],
  )

  const title = 'The city · where every piece lives · Nika'
  const description =
    'Which repo each part of Nika lives in, what it ships, and at which commit this site read it. Two clocks govern the whole ecosystem: the spec pin for the language, the engine pin for what the released binary knows.'
  useHead({
    title,
    link: routeHead('/city').link,
    meta: [
      ...routeHead('/city').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: [ldScript([crumbLd([{ name: 'The city' }])])],
  })

  return (
    <main className="theme-dark tp-page td-page">
      <section ref={ref} aria-labelledby="city-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <Island id="city" payload={payload ?? ''} />
          <p className="v4sec-fig" data-rise>
            the city
          </p>
          <h1
            id="city-title"
            className="v4sec-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            Where every piece lives.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Nika is not one repository. The language is specified in one, the engine implements it
            in another, and this site is a projection of both, read at a commit it names out loud.
            Nothing here is a summary written by hand: each row points at the repo it describes and
            at the rooms on this site that come out of it.
          </p>

          <StampStrip
            items={[
              { n: surfaces.length || 8, label: 'public repos', sub: 'each with its own license' },
              { n: 2, label: 'clocks', sub: 'the spec, the engine' },
              { n: CATALOG_ENGINE.release_tag, label: 'the engine pin', sub: 'what the binary knows' },
              {
                n: LESSONS_PIN.spec_commit.slice(0, 7),
                label: 'the spec pin',
                sub: 'what the language says',
              },
            ]}
          />

          {/* ── the two clocks ── */}
          <div className="how-subs" data-rise>
            <p className="how-fig mono">the two clocks</p>
            <h2 className="how-h1">Every fact on this site hangs off one of them</h2>
            <p className="how-body">
              {/* the envelope marker is NOT typed here: the snippet lint refuses
                  floating nika-yaml outside the registry, and this page has no
                  business teaching syntax when the spec world does it whole */}
              They tick independently on purpose: the language is frozen at its v1 envelope and
              the engine versions on its own semver toward 1.0. A page that mixed the two clocks
              would have to lie about one of them.{' '}
              <Link to="/language/spec/envelope">The envelope, whole →</Link>
            </p>
            <ol className="td-args tp-args">
              <li className="tp-arg" style={{ listStyle: 'none' }}>
                <span className="tp-arg-name">the spec pin</span>
                <span className="tp-arg-desc">
                  <code>{LESSONS_PIN.spec_commit.slice(0, 12)}</code> in{' '}
                  <a href="https://github.com/supernovae-st/nika-spec">nika-spec</a> (Apache-2.0).
                  Every chapter, every teaching step and every skeleton on this site is read at
                  that exact commit with <code>git show</code>, never from a moving branch, and
                  each one carries its own sha256 beside it.{' '}
                  <Link to="/truth/pin">What a pin is →</Link>
                </span>
              </li>
              <li className="tp-arg" style={{ listStyle: 'none' }}>
                <span className="tp-arg-name">the engine pin</span>
                <span className="tp-arg-desc">
                  <code>{CATALOG_ENGINE.release_tag}</code> ({CATALOG_ENGINE.commit.slice(0, 12)})
                  in <a href="https://github.com/supernovae-st/nika">nika</a>{' '}
                  (AGPL-3.0-or-later). The whole catalog is vendored from that release and
                  digest-verified: models, prices, energy, MCP servers, client coverage.{' '}
                  <Link to="/catalog">What the binary knows →</Link>
                </span>
              </li>
            </ol>
          </div>

          {/* ── the repos ── */}
          <div className="how-subs" data-rise id="repos">
            <p className="how-fig mono">the repos</p>
            <h2 className="how-h1">One job each</h2>
            <p className="how-body">
              The install command and the description in every room come from that repo&apos;s own
              README, never invented here. Each row lists the worlds on this site that project
              from it, so the claim is walkable.
            </p>
            <ol className="td-args tp-args">
              {surfaces.map((s) => (
                <li className="tp-arg" key={s.id} style={{ listStyle: 'none' }}>
                  <span className="tp-arg-name">
                    <Link to={`/integrations/${s.id}`}>{s.name}</Link>
                  </span>
                  <span className="tp-arg-desc">
                    {s.what}{' '}
                    <span className="mono">
                      {s.license} · <a href={s.repo}>the source</a>
                    </span>
                    {(FEEDS[s.id] ?? []).length > 0 && (
                      <>
                        <br />
                        <span className="mono">feeds</span>{' '}
                        {(FEEDS[s.id] ?? []).map((f, i) => (
                          <span key={f.to}>
                            {i > 0 && ' · '}
                            <Link to={f.to}>{f.label}</Link>
                          </span>
                        ))}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* the city's own room · the decision record it holds */}
          <div className="how-subs" data-rise>
            <p className="how-fig mono">why it is built this way</p>
            <h2 className="how-h1">The decisions are written down</h2>
            <p className="how-body">
              Every architectural choice in the engine is argued in writing before it is built,
              kept in the repo beside the code it binds, and superseded by a named successor
              rather than quietly rewritten. The record is here, read at the release pin.
            </p>
            <ul className="how-sub-rows">
              <li>
                <Link to="/city/decisions" className="how-sub-row">
                  <span className="how-sub-key">the decisions</span>
                  <span className="how-sub-copy">
                    <span className="how-sub-title">The engine&apos;s architecture record.</span>
                    <span className="how-sub-body">
                      Every decision with its status, the layers it binds and the decisions that
                      cite it. The settled ones open whole; the proposals keep their row.
                    </span>
                  </span>
                  <span className="how-sub-go" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/language/governance" className="how-sub-row">
                  <span className="how-sub-key">the standard</span>
                  <span className="how-sub-copy">
                    <span className="how-sub-title">How the language itself changes.</span>
                    <span className="how-sub-body">
                      The numbered public proposals that amend the specification. Nobody amends
                      it directly, the maintainers included.
                    </span>
                  </span>
                  <span className="how-sub-go" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="v4doclinks" data-rise>
            <Link to="/map" className="v4doclink">
              Every page, one graph
              <span aria-hidden className="v4doclink-arrow"> →</span>
            </Link>
            <Link to="/truth" className="v4doclink">
              How this site tells the truth
              <span aria-hidden className="v4doclink-arrow"> →</span>
            </Link>
            <Link to="/integrations" className="v4doclink">
              Get it into your stack
              <span aria-hidden className="v4doclink-arrow"> →</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
