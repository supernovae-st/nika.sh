import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { verbGlyph } from '../components/codefile-highlight'
import {
  DEFAULT_PERMITS,
  PERMITS,
  PLAN,
  resolveOutcome,
  deniedCliRow,
  type PermitKey,
  type PermitState,
  type Outcome,
} from './hitl/hitl-model'
import './hitl/hitl.css'

/* ─── FIG 4.0 · Be the human in the loop (theme-LIGHT · the interaction) ───────
   Design doc §4 (FIG 4.0) — the hands-on "aha" that makes CONTROL felt, not told.
   The visitor is the REVIEWER of the `t3-resume-screener` plan (a local-model CV
   screener). They:
     1 · read the plan in plain words (each step + its verb glyph),
     2 · toggle the permits the plan is ALLOWED to touch (real switches),
     3 · ▶ Let it run → an outcome that REACTS to the toggles, driven by the real
         run-model (NIKA-SEC-004 when a load-bearing permit is removed).

   The money moment: toggle `write` OFF → the terminal write is DENIED at the
   permits boundary, with a REAL pretty-CLI `✗ save  NIKA-SEC-004` row. "You took
   the permission away. The runtime obeyed." Turn `net` ON → a calm warning (the
   CVs could now leave — your call, declared in the file). No fabricated exfil.

   The toggles drive the outcome LIVE (useMemo on the permit state); ▶ Let it run
   re-announces it + re-plays the CLI reveal for the responsive feel. All logic is
   pure (hitl-model.ts · unit-tested); this file is the accessible shell.

   A11y: every switch is role="switch" + aria-checked, keyboard-operable, ≥44px;
   the outcome panel is aria-live="polite"; visible :focus-visible rings.
   SSR / no-JS / reduced-motion: renders the DECLARED defaults (read+write on) →
   the within-bounds outcome, fully visible, no layout shift. The interactivity
   is the enhancement. */

/* the verb glyph for a plan step — derived, monochrome, decorative (aria-hidden). */
function StepGlyph({ verb }: { verb: string }) {
  return (
    <span className="hitl-step-glyph" aria-hidden>
      {verbGlyph(verb)}
    </span>
  )
}

/* ── one accessible permit switch ───────────────────────────────────────────
   Native semantics first would be a checkbox, but the design calls for a switch
   affordance, so we use role="switch" per WAI-ARIA APG (button base · Space/Enter
   toggle · aria-checked reflects state). The whole row is the hit target (≥44px),
   label + control share it, no dead zone. */
function PermitSwitch({
  permitKey,
  label,
  scope,
  cap,
  on,
  warn,
  onToggle,
}: {
  permitKey: PermitKey
  label: string
  scope: string
  cap: string
  on: boolean
  /** a permit the file does NOT declare (net/exec) — its ON state is the
   *  consequential one, tinted with the caution accent. */
  warn: boolean
  onToggle: (key: PermitKey) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className="hitl-permit"
      data-on={on}
      {...(warn ? { 'data-warn': '' } : {})}
      onClick={() => onToggle(permitKey)}
    >
      <span className="hitl-permit-main">
        <span className="hitl-permit-label">{label}</span>
        <span className="hitl-permit-scope mono" aria-hidden>
          <span className="hitl-permit-cap">{cap}</span>
          {' · '}
          {scope}
        </span>
      </span>
      <span className="hitl-switch" aria-hidden>
        <span className="hitl-switch-track">
          <span className="hitl-switch-thumb" />
        </span>
        <span className="hitl-switch-state mono">{on ? 'allow' : 'deny'}</span>
      </span>
    </button>
  )
}

/* ── the outcome panel · the run-model's verdict, rendered ───────────────────
   aria-live="polite" so a screen reader hears the verdict change. Three legible
   states (within / denied / exposed); for `denied` we render the REAL pretty-CLI
   `✗ <id> NIKA-SEC-004` row pulled from the run (engine-true). For `within` we
   render the real success tail (the shortlist written). */
function OutcomePanel({
  outcome,
  runKey,
  reducedMotion,
}: {
  outcome: Outcome
  /** bumps on each ▶ Run → restarts the CLI reveal (responsive feel) */
  runKey: number
  reducedMotion: boolean
}) {
  const { kind, headline, gloss, run } = outcome

  // the CLI tail to surface — the last meaningful rows of the real run.
  const cliRows = useMemo(() => {
    if (kind === 'denied' && outcome.deniedCode && outcome.deniedNode) {
      // show the denied step's terminal row + the engine's error footer.
      const denied = deniedCliRow(run, outcome.deniedCode, outcome.deniedNode)
      return [denied, '── error (stderr) ──', `exit ${run.exitCode}`]
    }
    // within / exposed → the success tail (outputs block + exit 0).
    const out = run.cli.slice(-3)
    return out
  }, [kind, outcome.deniedCode, outcome.deniedNode, run])

  return (
    <output
      className="hitl-outcome"
      data-kind={kind}
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="hitl-outcome-cap mono" aria-hidden>
        FIG 4.2 — the runtime&apos;s verdict
      </p>
      <p className="hitl-outcome-head">
        <span className="hitl-outcome-mark" aria-hidden>
          {kind === 'within' ? '✓' : kind === 'denied' ? '✗' : '⚠'}
        </span>
        {headline}
      </p>
      <p className="hitl-outcome-gloss">{gloss}</p>

      {/* the real CLI rows · re-keyed on each run so the reveal restarts */}
      <pre
        key={runKey}
        className={`hitl-cli mono ${reducedMotion ? '' : 'hitl-cli-anim'}`}
        aria-label="The runtime output"
      >
        {cliRows.map((row, i) => (
          <span
            className="hitl-cli-row"
            key={i}
            style={!reducedMotion ? { ['--cli-i' as string]: i } : undefined}
            data-deny={kind === 'denied' && row.includes('NIKA-SEC-004')}
          >
            {row}
          </span>
        ))}
      </pre>

      {kind === 'denied' ? (
        <p className="hitl-outcome-foot">
          You took the permission away. The runtime <b>obeyed</b> — refused at the
          boundary, before anything touched the disk.
        </p>
      ) : kind === 'exposed' ? (
        <p className="hitl-outcome-foot">
          Nothing was sent — this is the consequence, made legible. The net permit
          is <b>not</b> in this file; adding it would be your explicit, reviewable
          choice.
        </p>
      ) : (
        <p className="hitl-outcome-foot">
          Every step stayed inside the declared <code>permits:</code>. The plan did
          exactly what you reviewed — <b>nothing more</b>.
        </p>
      )}
    </output>
  )
}

export default function HumanInTheLoop() {
  const ref = useRef<HTMLElement>(null)
  const [permits, setPermits] = useState<PermitState>(DEFAULT_PERMITS)
  const [runKey, setRunKey] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(true) // SSR-safe default

  // the outcome reacts LIVE to the toggles (pure, deterministic).
  const outcome = useMemo(() => resolveOutcome(permits), [permits])

  const toggle = useCallback((key: PermitKey) => {
    setPermits((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const run = useCallback(() => {
    // re-announce + replay the CLI reveal — the outcome is already live, this
    // gives the deliberate "I ran it" beat (and re-keys the reveal animation).
    setRunKey((k) => k + 1)
  }, [])

  // motion preference (client-only) — gates the CLI reveal animation.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // one orchestrated reveal on first view (motion-safe; default visible).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add('v4-in')
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      id="human-in-the-loop"
      aria-labelledby="hitl-title"
      className="theme-light v4sec scroll-mt-24"
    >
      <div className="v4sec-wrap">
        <p className="v4sec-fig" data-rise>
          FIG 4.0
        </p>
        <h2
          id="hitl-title"
          className="v4sec-title"
          data-rise
          style={{ ['--rise-delay' as string]: '60ms' }}
        >
          Be the human in the&nbsp;loop.
        </h2>
        <p
          className="v4sec-lede"
          data-rise
          style={{ ['--rise-delay' as string]: '120ms' }}
        >
          Here&apos;s a plan an agent wrote. Read it. Toggle what it&apos;s allowed
          to touch. <b>Approve</b> a step — or <b>block</b> it — and watch the
          runtime obey.
        </p>

        {/* the interactive stage · plan + permits (left) · the verdict (right) */}
        <div
          className="hitl-stage"
          data-rise
          style={{ ['--rise-delay' as string]: '180ms' }}
        >
          {/* LEFT · the plan a human reviews + the permits they control */}
          <div className="hitl-review">
            <div className="hitl-block">
              <p className="hitl-block-cap mono" aria-hidden>
                FIG 4.1 — the plan, in plain words
              </p>
              <ol className="hitl-plan">
                {PLAN.map((step, i) => {
                  const blocked =
                    outcome.kind === 'denied' && outcome.deniedNode === step.node
                  return (
                    <li
                      className="hitl-step"
                      key={step.node}
                      data-blocked={blocked}
                    >
                      <span className="hitl-step-n mono" aria-hidden>
                        {i + 1}
                      </span>
                      <StepGlyph verb={step.verb} />
                      <span className="hitl-step-body">
                        <span className="hitl-step-intent">{step.intent}</span>
                        <span className="hitl-step-meta mono" aria-hidden>
                          {step.verb} · {step.node}
                          {blocked ? ' · denied' : ''}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>

            <div className="hitl-block">
              <p className="hitl-block-cap mono" aria-hidden>
                FIG 4.1b — what it&apos;s allowed to touch
              </p>
              <div
                className="hitl-permits"
                role="group"
                aria-label="The plan's permits — toggle what it is allowed to touch"
              >
                {PERMITS.map((p) => (
                  <PermitSwitch
                    key={p.key}
                    permitKey={p.key}
                    label={p.label}
                    scope={p.scope}
                    cap={p.cap}
                    on={permits[p.key]}
                    warn={!p.loadBearing}
                    onToggle={toggle}
                  />
                ))}
              </div>

              <button type="button" className="hitl-run" onClick={run}>
                <span className="hitl-run-glyph" aria-hidden>
                  ▶
                </span>
                Let it run
              </button>
            </div>
          </div>

          {/* RIGHT · the runtime's verdict — reacts to the toggles */}
          <OutcomePanel
            outcome={outcome}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
        </div>

        <p
          className="hitl-note"
          data-rise
          style={{ ['--rise-delay' as string]: '120ms' }}
        >
          Real <code>NIKA-SEC-004</code> code, real run-model — the seatbelt is the{' '}
          <code>permits:</code> block, checked by the runtime before the effect.
        </p>
      </div>
    </section>
  )
}
