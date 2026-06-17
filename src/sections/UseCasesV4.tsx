import { useMemo, useState } from 'react'
import { CodeFile } from '../components/CodeFile'
import { useRevealOnce } from './use-reveal-once'
import { verbGlyph, type NikaVerb } from '../components/codefile-highlight'
import { UC_TABS, verbsFor, yamlFor, fileFor, docsFor, type UC } from './usecases-data'
import { SHOWCASE_YAML } from './usecases-yaml.generated'
import './v4-home.css'

/* ─── FIG 7.0 · Use cases (theme-LIGHT · the editorial gallery) ────────────────
   Design doc §6 (FIG 7.0) — proof. A clean GALLERY of real showcase workflows,
   tabbed by métier (data from usecases-data.ts · the 5 UC_TABS). Each card =
   title + one-line outcome + verb chips (glyphs) + a peek of its real YAML.
   Selecting a card reveals its full YAML panel via <CodeFile>.

   It is NOT a run animation — the Living File centerpiece owns the run. This is
   "here are real files you'd write." Light theme (the page's rhythm break), the
   blueprint register inverted, tabular-nums on every count.

   Spec truth: every YAML comes from SHOWCASE_YAML (projected from nika-spec
   showcase via the projector · never hand-typed). The verb chips DERIVE from the
   projected DAG (verbsFor) — never hand-listed.

   SSR-safe: pure DOM (CodeFile renders static <pre>/<code>); the reveal is an
   IntersectionObserver added on mount, content visible by default. */

/* the 4 verb hues → the per-chip --vh custom prop (drives the glyph whisper). */
const VERB_HUE: Record<NikaVerb, string> = {
  infer: 'var(--verb-infer)',
  exec: 'var(--verb-exec)',
  invoke: 'var(--verb-invoke)',
  agent: 'var(--verb-agent)',
}

export default function UseCasesV4() {
  /* reveal the rows once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>()
  const [tab, setTab] = useState(0)
  const [sel, setSel] = useState(0)

  const t = UC_TABS[tab]
  const active: UC = t.cases[Math.min(sel, t.cases.length - 1)]
  const yaml = useMemo(() => yamlFor(active), [active])

  const pickTab = (i: number) => {
    setTab(i)
    setSel(0)
  }

  const total = Object.keys(SHOWCASE_YAML).length

  return (
    <section
      ref={ref}
      id="use-cases"
      aria-labelledby="usecases-title"
      className="theme-light v4sec scroll-mt-24"
    >
      <div className="v4sec-wrap">
        <p className="v4sec-fig" data-rise>
          FIG 7.0
        </p>
        <h2
          id="usecases-title"
          className="v4sec-title"
          data-rise
          style={{ ['--rise-delay' as string]: '60ms' }}
        >
          Real files you&apos;d write.
        </h2>
        <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          Anything you&apos;d ask an AI to do more than once belongs in a file. Every workflow
          below is <b>real</b> — projected from <code className="mono">nika-spec</code>, passing
          the conformance gate. Pick your métier, open a card, read the exact YAML that runs it.
        </p>

        {/* the métier filter bar · plain toggle buttons (aria-pressed), not a
            tablist — switching a métier filters the gallery below, it isn't an
            APG tab/tabpanel relationship, so toggle semantics are the correct fit */}
        <div
          className="v4uc-tabs"
          role="group"
          aria-label="Filter use cases by métier"
          data-rise
          style={{ ['--rise-delay' as string]: '160ms' }}
        >
          {UC_TABS.map((tb, i) => (
            <button
              key={tb.id}
              type="button"
              aria-pressed={i === tab}
              className="v4uc-tab"
              onClick={() => pickTab(i)}
            >
              {tb.label}
              <span className="v4uc-tab-n">{tb.cases.length}</span>
            </button>
          ))}
        </div>

        <p key={`hook-${t.id}`} className="v4uc-hook v4uc-fade">
          {t.hook}
        </p>

        <div className="v4uc-stage">
          {/* the card rail · selectable workflows of this métier · plain toggle
              buttons (aria-pressed) that reveal the chosen card's YAML below */}
          <div
            key={`cards-${t.id}`}
            className="v4uc-cards v4uc-fade"
            role="group"
            aria-label="Workflows"
          >
            {t.cases.map((u, i) => {
              const selected = i === Math.min(sel, t.cases.length - 1)
              const cardVerbs = verbsFor(u) as NikaVerb[]
              return (
                <button
                  key={u.slug}
                  type="button"
                  aria-pressed={selected}
                  className="v4uc-card"
                  onClick={() => setSel(i)}
                >
                  <span className="v4uc-card-head">
                    <span className="v4uc-card-fig">7.{tab + 1}.{i + 1}</span>
                    <span className="v4uc-card-title">{u.title}</span>
                    <span className="v4uc-card-tier" title={`Complexity tier ${u.tier.slice(1)} of 4`}>
                      {u.tier}
                    </span>
                  </span>
                  <span className="v4uc-card-outcome">{u.outcome}</span>
                  <span className="v4uc-verbs">
                    {cardVerbs.map((v) => (
                      <span key={v} className="v4uc-verb" style={{ ['--vh' as string]: VERB_HUE[v] }}>
                        <span className="v4uc-verb-glyph" aria-hidden>
                          {verbGlyph(v)}
                        </span>
                        {v}
                      </span>
                    ))}
                  </span>
                </button>
              )
            })}
          </div>

          {/* the open file panel · the selected case's real YAML */}
          <div key={`panel-${t.id}-${active.slug}`} className="v4uc-panel v4uc-fade">
            <div className="v4uc-panel-meta">
              <span className="v4uc-panel-file">
                <span aria-hidden style={{ color: 'var(--v4-hud-faint)' }}>
                  ❯{' '}
                </span>
                <b>{fileFor(active)}</b>
              </span>
              <a
                className="v4uc-panel-link"
                href={docsFor(active)}
                target="_blank"
                rel="noreferrer"
              >
                walkthrough ↗
              </a>
            </div>

            <div className="v4uc-panel-code">
              <div className="v4uc-scroll">
                <CodeFile yaml={yaml} />
              </div>
            </div>

            <p className="v4uc-panel-outcome">
              <span className="v4uc-arrow" aria-hidden>
                →
              </span>
              {active.outcome}
            </p>
          </div>
        </div>

        <p className="v4uc-note">
          {total} workflows · four tiers ·{' '}
          <a
            href="https://github.com/supernovae-st/nika-spec/tree/main/examples/showcase"
            target="_blank"
            rel="noreferrer"
          >
            nika-spec/examples/showcase
          </a>{' '}
          — schema, DAG cross-refs and stdlib surface all gated
        </p>
      </div>
    </section>
  )
}
