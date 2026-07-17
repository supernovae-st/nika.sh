import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead } from '../content'
import { HubFoot } from './hub-shared'
import { sourcesJsonldSets } from './hub-lib'
import {
  ATLAS_PROVENANCE,
  ATLAS_SCORE,
  ATLAS_CLOCK_DIFF,
  TRUTH_WORDS,
} from '../content/atlas-meta.generated'
import { CANON } from '../canon.generated'
import '../sections/v4-home.css'
import '../shell/shell.css'
import './page-chrome.css'
import './hubs-page.css'
import './sources-page.css'

/* ─── /sources · the epistemology page (WO-7 · the truth system, taught) ─────
   The internal discipline becomes the public teaching: the three clocks
   (spec pin · engine release · site bake), the two-clocks diff rendered
   LIVE from the compiler's own data, the truth-words register (the
   anchors that liquidate the last §6.1 waiver), the coverage score with
   its gaps NAMED, and the verify-yourself protocol. Anti-slop law
   applies to the page itself: every number here is a projection;
   the page never hand-types a count. */

const TITLE = 'Sources · how this site tells the truth · Nika'
const DESCRIPTION
  = 'Every count, code block and claim on nika.sh is a projection of pinned sources, re-derived at build time and gated in CI. The clocks, the truth words, the coverage score and the verify-yourself protocol.'

const VERIFY = [
  {
    cmd: 'curl -s https://nika.sh/.well-known/nika-spec-pin.json',
    why: 'the exact nika-spec identity this site resyncs against: a full commit sha and its tree hash',
  },
  {
    cmd: 'curl -s https://nika.sh/ontology/language.json | head -40',
    why: 'the whole language graph as served data: every node and edge these pages render',
  },
  {
    cmd: 'curl -sO https://nika.sh/library/daily-brief.nika.yaml && nika check daily-brief.nika.yaml',
    why: 'a served workflow re-audited on your machine: the conformance oracle, not our word',
  },
] as const

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const p = ATLAS_PROVENANCE
  useHead({
    title: TITLE,
    link: routeHead('/sources').link,
    meta: [
      ...routeHead('/sources').meta,
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:image', content: 'https://nika.sh/og-sources.png' },
      { property: 'og:image:alt', content: DESCRIPTION },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'TechArticle', '@id': 'https://nika.sh/sources', name: TITLE, description: DESCRIPTION },
            ...sourcesJsonldSets(TRUTH_WORDS),
          ],
        }),
        processTemplateParams: false,
      },
    ],
  })

  return (
    <main className="theme-dark hub-page" style={{ ['--hub-hue' as string]: '#9a8cff' }}>
      <section ref={ref} aria-labelledby="hub-title" className="v4sec v4-in">
        <div className="v4sec-wrap hub-wrap">
          <header>
            <p className="v4-kick">the sources</p>
            <h1 id="hub-title" className="v4-h2">
              Nothing here is hand-typed
            </h1>
            <p className="hub-opener">
              Every count, every code block and every claim on these pages is a projection of
              pinned sources, re-derived at build time and gated in CI. This page teaches the
              machinery, and names what it does not cover yet.
            </p>
          </header>

          {/* ── the three clocks ─────────────────────────────────────────── */}
          <section className="hub-sec" id="clocks" aria-labelledby="clocks-title">
            <h2 className="hub-sec-title" id="clocks-title">
              The three clocks
            </h2>
            <p className="hub-sec-note">
              A page can only lie about time three ways. Each clock is pinned, so it cannot.
            </p>
            <dl className="src-clocks">
              <div className="src-clock">
                <dt>the spec clock</dt>
                <dd>
                  what the language <em>ratifies</em>: pinned at{' '}
                  <a href="/.well-known/nika-spec-pin.json" className="src-mono-link">
                    {p.spec_pin ? `spec@${p.spec_pin.slice(0, 7)}` : '/.well-known/nika-spec-pin.json'}
                  </a>
                  , a full commit and its tree hash; the resync cron moves it, never a hand
                </dd>
              </div>
              <div className="src-clock">
                <dt>the engine clock</dt>
                <dd>
                  what the binary <em>ships</em>: {p.engine_version}
                  {p.catalogs.tools !== p.engine_version.replace(/^v/, '')
                    ? ` (catalogs vendored at ${p.catalogs.tools})`
                    : ''}
                  ; its catalogs are committed sources, never probed at build
                </dd>
              </div>
              <div className="src-clock">
                <dt>the site bake</dt>
                <dd>
                  when these pages were <em>derived</em>: every generated module is byte-diffed
                  in CI against a fresh recompile, so a stale page cannot ship silently
                </dd>
              </div>
            </dl>
          </section>

          {/* ── the two clocks, live ─────────────────────────────────────── */}
          <section className="hub-sec" id="two-clocks" aria-labelledby="two-clocks-title">
            <h2 className="hub-sec-title" id="two-clocks-title">
              Ratified is not shipped
            </h2>
            <p className="hub-sec-note">
              The spec and the engine move on different clocks, and this site refuses to blur
              them: a member can be ratified (in the spec at the pin) before the engine ships it,
              or shipped before ratification lands. The diff below is computed at build time from
              both catalogs; when it is empty, the clocks agree.
            </p>
            {(['builtins', 'providers'] as const).map((register) => {
              const diff = ATLAS_CLOCK_DIFF[register]
              const clean = diff.ratified_only.length === 0 && diff.shipped_only.length === 0
              return (
                <p key={register} className="src-clockdiff mono">
                  <span className="src-clockdiff-k">{register}</span>
                  {clean
                    ? ' · the two clocks agree at this bake'
                    : [
                        diff.ratified_only.length > 0
                          ? ` · ratified, not yet shipped: ${diff.ratified_only.join(', ')}`
                          : '',
                        diff.shipped_only.length > 0
                          ? ` · shipped, not yet ratified: ${diff.shipped_only.join(', ')}`
                          : '',
                      ].join('')}
                </p>
              )
            })}
          </section>

          {/* ── the truth words (the anchored register) ──────────────────── */}
          <section className="hub-sec" id="truth-words" aria-labelledby="truth-words-title">
            <h2 className="hub-sec-title" id="truth-words-title">
              The truth words
            </h2>
            <p className="hub-sec-note">
              The vocabulary of how this site tells the truth. Each word has exactly one meaning:
              confusing two of them is a prose bug, and the prose gates treat it as one.
            </p>
            <dl className="src-words">
              {TRUTH_WORDS.members.map((w) => (
                <div key={w.id} className="src-word" id={w.id}>
                  <dt className="mono">{w.id}</dt>
                  <dd>{w.one_liner}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ── the score (honesty block) ────────────────────────────────── */}
          <section className="hub-sec" id="score" aria-labelledby="score-title">
            <h2 className="hub-sec-title" id="score-title">
              The coverage score
            </h2>
            <p className="hub-sec-note">
              The compiler scores its own coverage on every build: every member of every register
              accounts for a surface and evidence, or the build names the gap. The classes below
              are the honest remainder: what this site does not judge yet, by name.
            </p>
            <p className="src-score mono">
              atlas coverage · {ATLAS_SCORE.score}/100
              {ATLAS_SCORE.waived.length > 0 ? ` · ${ATLAS_SCORE.waived.length} waived` : ' · no waivers'}
            </p>
            {ATLAS_SCORE.waived.length > 0 && (
              <ul className="src-gaps">
                {ATLAS_SCORE.waived.map((w) => (
                  <li key={w} className="mono">
                    waived · {w}
                  </li>
                ))}
              </ul>
            )}
            <ul className="src-gaps">
              {ATLAS_SCORE.unarmed.map((u) => (
                <li key={u} className="mono">
                  {u}
                </li>
              ))}
            </ul>
          </section>

          {/* ── verify it yourself ───────────────────────────────────────── */}
          <section className="hub-sec" id="verify" aria-labelledby="verify-title">
            <h2 className="hub-sec-title" id="verify-title">
              Verify it yourself
            </h2>
            <p className="hub-sec-note">
              The whole trust chain is reproducible from public material, without asking anyone:
              the same discipline the {CANON.verbs}-verb language applies to runs, applied to the
              site that documents it.
            </p>
            <ol className="src-verify">
              {VERIFY.map((v) => (
                <li key={v.cmd}>
                  <pre className="src-cmd mono">{v.cmd}</pre>
                  <p className="src-why">{v.why}</p>
                </li>
              ))}
            </ol>
          </section>

          <HubFoot nodeId="surface:sources" />
        </div>
      </section>
    </main>
  )
}
