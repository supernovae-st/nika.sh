import { useMemo } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
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
import './sources-page.css'

/* ─── /sources · the truth register (WO-7 · the truth system, taught) ─────────
   The internal discipline becomes the public teaching: the three clocks
   (spec pin · engine release · site bake), the two-clocks diff rendered
   LIVE from the compiler's own data, the truth-words register (the
   anchors that liquidate the last §6.1 waiver), the coverage score with
   its gaps NAMED, and the verify-yourself protocol. Anti-slop law
   applies to the page itself: every number here is a projection;
   the page never hand-types a count.

   Speaks the register grammar (the /providers · /tools · /errors family):
   v4sec masthead, StampStrip dimensions, cl-year band heads. The one
   identity accent (--hub-hue) survives on a :target truth word. */

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

/* the two-clocks diff is computed per register at build (atlas-meta) —
   this list just names the registers it covers, in the compiler's order */
const CLOCK_REGISTERS = ['builtins', 'providers', 'grammar'] as const

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

  /* the strip's figures are projections (the page's own anti-slop law):
     generated scores and lengths, never a typed count */
  const driftCount = useMemo(
    () =>
      CLOCK_REGISTERS.reduce(
        (n, r) =>
          n + ATLAS_CLOCK_DIFF[r].ratified_only.length + ATLAS_CLOCK_DIFF[r].shipped_only.length,
        0,
      ),
    [],
  )
  const gapCount = ATLAS_SCORE.waived.length + ATLAS_SCORE.unarmed.length

  /* the clock ledger rows (the band count derives from this list) */
  const clocks = [
    {
      id: 'spec',
      name: 'the spec clock',
      body: (
        <>
          what the language <em>ratifies</em>: pinned at{' '}
          <a href="/.well-known/nika-spec-pin.json" className="src-mono-link">
            {p.spec_pin ? `spec@${p.spec_pin.slice(0, 7)}` : '/.well-known/nika-spec-pin.json'}
          </a>
          , a full commit and its tree hash; the resync cron moves it, never a hand
        </>
      ),
    },
    {
      id: 'engine',
      name: 'the engine clock',
      body: (
        <>
          what the binary <em>ships</em>: {p.engine_version}
          {p.catalogs.tools !== p.engine_version.replace(/^v/, '')
            ? ` (catalogs vendored at ${p.catalogs.tools})`
            : ''}
          ; its catalogs are committed sources, never probed at build
        </>
      ),
    },
    {
      id: 'bake',
      name: 'the site bake',
      body: (
        <>
          when these pages were <em>derived</em>: every generated module is byte-diffed in CI
          against a fresh recompile, so a stale page cannot ship silently
        </>
      ),
    },
  ]

  return (
    <main className="theme-dark src-page" style={{ ['--hub-hue' as string]: '#9a8cff' }}>
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="src-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            the truth register
          </p>
          <h1 id="src-title" className="v4sec-title src-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            Sources.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Every count, every code block and every claim on these pages is a projection of
            pinned sources, <b>re-derived at build time and gated in CI</b>: the site never
            hand-types what <code>canon.yaml</code> already counts. This page teaches the
            machinery, and names what it does not cover yet. Machines read the pin at{' '}
            <a href="/.well-known/nika-spec-pin.json">/.well-known/nika-spec-pin.json</a>; the
            graph answers at <a href="/ontology/language.json">/ontology/language.json</a>.
          </p>

          {/* the truth system's dimensions, at a glance */}
          <StampStrip
            items={[
              { n: TRUTH_WORDS.members.length, label: 'truth words', sub: 'one meaning each' },
              { n: ATLAS_SCORE.score, label: 'coverage score', sub: 'gaps named, not hidden' },
              { n: driftCount, label: 'clock drift', sub: 'ratified vs shipped' },
              { n: VERIFY.length, label: 'verify commands', sub: 'no trust required' },
            ]}
          />

          {/* ── the three clocks ─────────────────────────────────────────── */}
          <section className="src-band" id="clocks" aria-labelledby="clocks-title" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
            <div className="cl-year-head">
              <h2 className="cl-year-n src-band-n" id="clocks-title">
                The three clocks
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">{clocks.length} clocks</span>
            </div>
            <p className="src-band-gloss">
              A page can only lie about time three ways. Each clock is pinned, so it cannot.
            </p>
            <dl className="src-clocks">
              {clocks.map((c) => (
                <div key={c.id} className="src-clock">
                  <dt>{c.name}</dt>
                  <dd>{c.body}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ── the two clocks, live ─────────────────────────────────────── */}
          <section className="src-band" id="two-clocks" aria-labelledby="two-clocks-title" data-rise style={{ ['--rise-delay' as string]: '210ms' }}>
            <div className="cl-year-head">
              <h2 className="cl-year-n src-band-n" id="two-clocks-title">
                Ratified is not shipped
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">{CLOCK_REGISTERS.length} registers</span>
            </div>
            <p className="src-band-gloss">
              The spec and the engine move on different clocks, and this site refuses to blur
              them: a member can be ratified (in the spec at the pin) before the engine ships it,
              or shipped before ratification lands. The diff below is computed at build time from
              both catalogs; when it is empty, the clocks agree.
            </p>
            {CLOCK_REGISTERS.map((register) => {
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
          <section className="src-band" id="truth-words" aria-labelledby="truth-words-title" data-rise style={{ ['--rise-delay' as string]: '240ms' }}>
            <div className="cl-year-head">
              <h2 className="cl-year-n src-band-n" id="truth-words-title">
                The truth words
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">{TRUTH_WORDS.members.length} words</span>
            </div>
            <p className="src-band-gloss">
              The vocabulary of how this site tells the truth. Each word has exactly one meaning:
              confusing two of them is a prose bug, and the prose gates treat it as one.
            </p>
            <dl className="src-words">
              {TRUTH_WORDS.members.map((w) => (
                <div key={w.id} className="src-word" id={w.id}>
                  <dt className="mono">
                    <Link to={`/truth/${w.id}`} title="open the word's page">
                      {w.id}
                    </Link>
                  </dt>
                  <dd>{w.one_liner}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ── the score (honesty block) ────────────────────────────────── */}
          <section className="src-band" id="score" aria-labelledby="score-title" data-rise style={{ ['--rise-delay' as string]: '270ms' }}>
            <div className="cl-year-head">
              <h2 className="cl-year-n src-band-n" id="score-title">
                The coverage score
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {gapCount} {gapCount === 1 ? 'gap named' : 'gaps named'}
              </span>
            </div>
            <p className="src-band-gloss">
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
          <section className="src-band" id="verify" aria-labelledby="verify-title" data-rise style={{ ['--rise-delay' as string]: '300ms' }}>
            <div className="cl-year-head">
              <h2 className="cl-year-n src-band-n" id="verify-title">
                Verify it yourself
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">{VERIFY.length} commands</span>
            </div>
            <p className="src-band-gloss">
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
