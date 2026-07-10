import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { usePlan3D } from '../sections/morph/use-plan3d'
import { CANON } from '../canon.generated'
import { ENGINE_VERSION, SPEC, REPO, routeHead, VERBS as VERB_CARDS } from '../content'
import { CodeFile } from '../components/CodeFile'
import { verbGlyph } from '../components/codefile-highlight'
import { SHOWCASE_YAML } from '../sections/usecases-yaml.generated'
import {
  BUILTIN_GROUPS,
  ENVELOPE_KEYS,
  PERMIT_CATS,
  PERMIT_DENIALS,
  SPEC_SECTIONS,
  TASK_FIELDS,
  displayProvider,
  nodeById,
  nodeReadout,
  nsScope,
} from '../scene/spec-machine-data'
import { useSpecReading } from '../sections/spec/use-spec-reading'
import { SpecSchematic } from '../sections/spec/SpecSchematic'
import '../sections/v4-home.css'
import '../pages/page-chrome.css'
import './spec-page.css'

/* the 4 decorative corner crop-marks — the HUD registration on a content well. */
function HudMarks() {
  return (
    <span className="spec-hud" aria-hidden>
      <span className="spec-hud-mark spec-hud-mark--tl" />
      <span className="spec-hud-mark spec-hud-mark--tr" />
      <span className="spec-hud-mark spec-hud-mark--bl" />
      <span className="spec-hud-mark spec-hud-mark--br" />
    </span>
  )
}

/* ─── /spec · the language reference (theme-dark · blueprint register) ─────────
   Design doc §7 (Routes · /spec) — the FRIENDLY INDEX into the nika language: the
   envelope, the four verbs, the task shape, the standard library, the providers,
   the extract modes, the error namespaces, the license invariants. The GitHub
   nika-spec repo stays canonical; this page is the readable map that links OUT.

   THE SPEC MACHINE (2026-07-10): the page is a split stage on desktop — the
   reference ledger reads in a measured column while a sticky rail holds the
   whole language as ONE machined instrument (the 2D schematic today, the W1
   canvas over the same stage when the moment can afford it), in a HUD that
   tracks the reading: each section crossed IGNITES its stratum for the visit
   (the manifesto drum's accrued-liberation mechanic), the TOC ticks fill, and
   the ASSEMBLED tally climbs until the whole contract stands lit. The DOM
   column stays the complete truth (SEO + a11y + no-JS); the rail is decoration.

   Spec truth BY CONSTRUCTION: every count + list comes from canon.generated.ts
   (projected from nika-spec canon.yaml · the SSOT) via spec-machine-data.ts —
   the strata graph the page, the schematic and the machine all share. The craft
   layer is glosses + grouping only; a canon entry that isn't glossed still
   renders (structural guards in the data module), so the lists can never
   under-render. No YAML is hand-typed: the worked fragment is sliced from a
   real SHOWCASE_YAML workflow.

   SSR-safe: pure DOM (the whole reference lives in the prerendered HTML for SEO
   + an instant paint); the reveal is one IntersectionObserver on mount, content
   fully visible by default (no-JS / reduced-motion). Per-route <head> via
   useHead → prerendered into dist/spec/index.html. */

/* ── the consumer TL;DR · the 5 pillars in one glance-table ───────────────────
   Plain-words register ABOVE the technical reference (jargon may deepen below,
   never gate here). Pillar identity + order come from the spec SSOT
   (canon.yaml `pillars.items` · envelope → verbs → dag → variables → errors ·
   CANON.pillars pins the count); the consumer glosses are craft. */
const TLDR_PILLARS: { name: string; token: string; claim: string; gloss: string }[] = [
  {
    name: 'the envelope',
    token: 'nika: v1',
    claim: 'The format is frozen.',
    gloss: 'One version marker, forever: files you write today won’t break.',
  },
  {
    name: 'the verbs',
    token: 'infer · exec · invoke · agent',
    claim: 'Four moves cover everything.',
    gloss: 'Think · run a command · use a tool · delegate.',
  },
  {
    name: 'the plan (dag)',
    token: 'depends_on',
    claim: 'Tasks, and what they wait on.',
    gloss: 'Independent tasks run at the same time, automatically.',
  },
  {
    name: 'variables',
    token: '${{ }}',
    claim: 'Answers thread by name.',
    gloss: 'One task’s output becomes the next task’s input.',
  },
  {
    name: 'errors',
    token: 'NIKA-*',
    claim: 'Failures come back typed.',
    gloss: 'A stable code, plus whether retrying could help.',
  },
]

/* ── FIG S.1 · the four verbs · "a distinct native execution model" each ──────
   Each verb is a RICH CARD: a one-line execution model + a real 2-line spec
   example in the premium CodeFile (sliced from content.ts VERBS · spec-valid,
   never hand-typed here). MONOCHROME chrome — the verb hue lights only inside
   the CodeFile frame. The card titles + examples are the single source. */
const VERB_MODEL: Record<string, string> = {
  infer: 'Call a model. Any of the providers; structured output when you give it a schema.',
  exec: 'Run a real process. stdout becomes the output; a non-zero exit becomes an error.',
  invoke: 'Call a tool · a nika: builtin or an mcp: server. Default-deny, args schema-checked.',
  agent: 'Drive an autonomous tool-use loop, bounded by max_turns and a whitelist of tools.',
}

/* the fold boundary · required rows stay visible, optional rows fold away
   (the data module pins required-first ordering — tested) */
const ENVELOPE_REQ = ENVELOPE_KEYS.filter((k) => k.req)
const ENVELOPE_OPT = ENVELOPE_KEYS.filter((k) => !k.req)
const FIELDS_REQ = TASK_FIELDS.filter((f) => f.req)
const FIELDS_OPT = TASK_FIELDS.filter((f) => !f.req)

const PROVIDERS_LOCAL = CANON.providerIdsLocal.map(displayProvider)
const PROVIDERS_CLOUD = CANON.providerIdsCloud.map(displayProvider)
const PROVIDERS_TEST = CANON.providerIdsTest.map(displayProvider)

const bySection = Object.fromEntries(SPEC_SECTIONS.map((s) => [s.key, s]))

/* THE PROTOCOL PLATE · the contract's data plate (every value real: canon,
   licenses, the family bars) — the instrument-plate register (v2 mockups) */
const FAMILY_BARS = BUILTIN_GROUPS.map((f) => ({ label: f.label, n: f.names.length }))
const FAMILY_MAX = Math.max(...FAMILY_BARS.map((b) => b.n))

/* the worked fragment · sliced from a REAL showcase workflow (never hand-typed).
   standup-digest exercises 3 of the 4 verbs (invoke · exec · infer) in a tiny
   readable DAG — the friendly first look. Falls back gracefully if the key ever
   leaves the projection. */
const SAMPLE_YAML =
  SHOWCASE_YAML['t1-standup-digest'] ?? Object.values(SHOWCASE_YAML)[0] ?? 'nika: v1\n'

/* W1 · THE SPEC MACHINE · the rail 3D layer (desktop ≥1024px + motion + WebGL
   + rail-near, lazy chunk — three itself is already the shared vendor chunk).
   It retires the 2D schematic only once actually mounted ([data-machine], set
   by the layer itself — the drum-rings pattern), so the schematic stays the
   mobile / reduced-motion / no-WebGL truth. */
const TheSpecMachine = lazy(() => import('../scene/TheSpecMachine'))

export function Component() {
  /* reveal the section once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })

  /* the reading assembles the machine · lit strata (monotonic) + the current
     stratum under the reading line — drives the TOC ticks, the schematic and
     the rail HUD (the W1 machine mirrors this with its own observer) */
  const { lit, current } = useSpecReading()
  const cur = current ? bySection[current] : null
  const assembledMax = SPEC_SECTIONS.length - 1 /* license is the close whisper */
  const assembled = [...lit].filter((k) => k !== 'license').length

  /* the machine's capability gate · the canvas mounts over the rail stage
     only when the moment can be worth its cost */
  const stageRef = useRef<HTMLDivElement>(null)
  const machine = usePlan3D(stageRef)

  /* THE HELM · the ship's view controls (explode toggle + spring-home) —
     real DOM buttons outside the aria-hidden stage, keyboard-reachable */
  const [explode, setExplode] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)

  /* ── THE FLIGHT · the chassis's stage state (hero → full → dock → off).
     The takeover runway drives it: while it crosses the viewport the stage
     is FULLSCREEN and its progress steers one full revolution + a dive
     (read by the machine's frame loop via flightRef — no re-render churn);
     past the last section the chassis stands down. */
  const takeoverEl = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<'hero' | 'full' | 'dock' | 'off'>('hero')
  const flightRef = useRef({ state: 'hero', progress: 0 })
  useEffect(() => {
    if (!machine) return
    let raf = 0
    const tick = () => {
      raf = 0
      const vh = window.innerHeight
      const t = takeoverEl.current?.getBoundingClientRect()
      const last = document.querySelector('.spec-block--last')?.getBoundingClientRect()
      let s: 'hero' | 'full' | 'dock' | 'off' = 'hero'
      if (t) {
        if (t.top <= vh * 0.35 && t.bottom >= vh * 0.72) s = 'full'
        else if (t.bottom < vh * 0.72) s = 'dock'
        flightRef.current.progress = Math.min(
          1,
          Math.max(0, (vh * 0.35 - t.top) / Math.max(1, t.height - vh * 0.37)),
        )
      }
      if (last && last.bottom < vh * 0.55) s = 'off'
      flightRef.current.state = s
      setStage((prev) => (prev === s ? prev : s))
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on, { passive: true })
    on()
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [machine])

  /* the cursor tooltip · follows the pointer while a node is hovered */
  const tipRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = tipRef.current
      if (!el) return
      const x = Math.min(e.clientX + 16, window.innerWidth - el.offsetWidth - 12)
      const y = Math.min(e.clientY + 18, window.innerHeight - el.offsetHeight - 12)
      el.style.transform = `translate(${x}px, ${y}px)`
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  /* ── W2 · the hover bus — ONE id, both sides write: pointering a 3D node
     reports here (MR readout + the DOM twins light), and hover/focus on any
     [data-node] DOM twin (chips · stamp legend · TOC · gates · ns rows)
     pulses the 3D node. Delegated: two listeners, zero per-chip wiring. */
  const [hoverNode, setHoverNode] = useState<string | null>(null)
  const hoverReadout = hoverNode ? nodeReadout(hoverNode) : null
  useEffect(() => {
    const root = document.querySelector('.spec-page')
    if (!root) return
    const resolve = (t: EventTarget | null): string | null =>
      (t as Element | null)?.closest?.('[data-node]')?.getAttribute('data-node') ?? null
    const onOver = (e: Event) => setHoverNode(resolve(e.target))
    const onFocus = (e: Event) => {
      const id = resolve(e.target)
      if (id) setHoverNode(id)
    }
    const onBlur = (e: Event) => {
      if (resolve(e.target)) setHoverNode(null)
    }
    root.addEventListener('pointerover', onOver, { passive: true })
    root.addEventListener('focusin', onFocus)
    root.addEventListener('focusout', onBlur)
    return () => {
      root.removeEventListener('pointerover', onOver)
      root.removeEventListener('focusin', onFocus)
      root.removeEventListener('focusout', onBlur)
    }
  }, [])
  /* the machine → DOM mirror · every twin of the hovered node lights */
  useEffect(() => {
    if (!hoverNode) return
    const els = document.querySelectorAll(`[data-node="${hoverNode}"]`)
    els.forEach((el) => el.classList.add('is-node-hot'))
    return () => els.forEach((el) => el.classList.remove('is-node-hot'))
  }, [hoverNode])

  /* Shift+←/→ jumps sections (the /play chapter-keys precedent) · the hash
     is the navigation: native smooth scroll + :target + shareable address */
  const currentRef = useRef(current)
  useEffect(() => {
    currentRef.current = current
  }, [current])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const idx = SPEC_SECTIONS.findIndex((s) => s.key === currentRef.current)
      if (idx === -1 && e.key === 'ArrowLeft') return
      const next =
        e.key === 'ArrowRight'
          ? Math.min(SPEC_SECTIONS.length - 1, idx + 1)
          : Math.max(0, idx - 1)
      if (next === idx) return
      e.preventDefault()
      window.location.hash = SPEC_SECTIONS[next].anchor
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useHead({
    title: 'Spec · Nika',
    link: routeHead('/spec').link,
    meta: [
      ...routeHead('/spec').meta,
      {
        name: 'description',
        content:
          'The whole language at a glance: a frozen format, four verbs (think, run a command, use a tool, delegate), the plan, variables and typed errors.',
      },
      { property: 'og:title', content: 'Spec · Nika' },
      {
        property: 'og:description',
        content:
          'The nika language reference: the v1 envelope, the four verbs, the task shape, the standard library, providers, extract modes and error namespaces.',
      },
      { property: 'og:image', content: 'https://nika.sh/og-spec.png' },
      {
        property: 'og:image:alt',
        content:
          'Nika spec: the contract an agent must satisfy before it acts. permits: infer · exec · invoke · agent.',
      },
      { name: 'twitter:title', content: 'Spec · Nika' },
      {
        name: 'twitter:description',
        content:
          'The nika language reference: envelope, verbs, task shape, stdlib, providers, errors.',
      },
      { name: 'twitter:image', content: 'https://nika.sh/og-spec.png' },
    ],
  })

  return (
    <main className="theme-dark spec-page">
      <section ref={ref} aria-labelledby="spec-title" className="v4sec">
        <div className="v4sec-wrap spec-wrap">
          {/* ── THE HERO · a poster: the title column and THE SHIP, nothing
              else. When the machine is live the fixed chassis carries the
              ship (52vw); the SSG elevation holds the same ground for the
              fallback register (mobile · reduced · no-WebGL). */}
          <header className="spec-hero">
            <div className="spec-hero-copy">
          {/* the masthead */}
          <p className="v4sec-fig" data-rise>
            the language reference
          </p>
          <h1
            id="spec-title"
            className="v4sec-title spec-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            The contract an agent must satisfy before it acts.
          </h1>
          {/* the punch lede (F7) · the catchy line ABOVE the consumer TL;DR */}
          <p className="v4punch" data-rise style={{ ['--rise-delay' as string]: '90ms' }}>
            The contract. Frozen forever.
          </p>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            A <code className="mono">.nika.yaml</code> is the plan, written down: one envelope,{' '}
            <b>four verbs</b>, a typed task shape, and a <b>permits</b> block that declares,
            and bounds, everything it&apos;s allowed to touch. You review it, the runtime
            enforces it, then it runs. This is the friendly map; the{' '}
            <a href={SPEC} target="_blank" rel="noreferrer" className="spec-inline-link">
              nika-spec repository
            </a>{' '}
            is the canonical, normative source.
          </p>
          {/* the invitation · what the scroll will do (the takeover reads
              as intent, not accident) */}
          <p className="spec-hero-cue mono" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
            <span className="spec-hero-cue-tick" aria-hidden />
            SCROLL·····BOARD THE SHIP
            <span aria-hidden>▾</span>
          </p>
            </div>
            {/* the fallback poster · the same vessel, drawn (SSG · goldens'
                truth); the live chassis covers this ground when it mounts */}
            <div className="spec-hero-eleva" aria-hidden>
              <SpecSchematic lit={lit} current={current} />
            </div>
          </header>

          {/* THE TAKEOVER · the runway between the poster and the reading:
              while it crosses the viewport the chassis goes fullscreen and
              the ship makes one full revolution, diving closer mid-turn —
              then docks to the rail as S.0 arrives. Lives only when the
              machine is live (the fallback keeps the plain flow). */}
          {machine ? <div className="spec-takeover" ref={takeoverEl} aria-hidden /> : null}

          <div className="spec-stage">
            <div className="spec-flow">

          {/* THE PROTOCOL PLATE · the data plate: protocol, type, licenses,
              status, and the honest microchart (builtins per family — bars
              derive from the craft map, the sum is the canon count). */}
          <section
            className="spec-plate"
            aria-labelledby="spec-plate-title"
            data-rise
            style={{ ['--rise-delay' as string]: '140ms' }}
          >
            <p id="spec-plate-title" className="spec-plate-kicker mono">
              PROTOCOL
            </p>
            <dl className="spec-plate-rows mono">
              <div className="spec-plate-row">
                <dt>PROTOCOL</dt>
                <dd>nika: v1</dd>
              </div>
              <div className="spec-plate-row">
                <dt>TYPE</dt>
                <dd>workflow language</dd>
              </div>
              <div className="spec-plate-row">
                <dt>SPEC</dt>
                <dd>Apache-2.0</dd>
              </div>
              <div className="spec-plate-row">
                <dt>ENGINE</dt>
                <dd>AGPL-3.0 · forever</dd>
              </div>
              <div className="spec-plate-row">
                <dt>STATUS</dt>
                <dd>
                  <span className="spec-plate-dot" aria-hidden /> FROZEN
                </dd>
              </div>
            </dl>
            <p className="spec-plate-chartcap mono">
              BUILTINS BY FAMILY
              <span>{FAMILY_BARS.map((b) => b.n).join('·')}</span>
            </p>
            <div className="spec-chart" role="img" aria-label={`Builtins by family: ${FAMILY_BARS.map((b) => `${b.label} ${b.n}`).join(', ')}`}>
              {FAMILY_BARS.map((b) => (
                <div className="spec-chart-col" key={b.label}>
                  <span
                    className="spec-chart-bar"
                    style={{ ['--bar' as string]: `${(b.n / FAMILY_MAX) * 100}%` }}
                  />
                  <span className="spec-chart-n mono">{b.n}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── the consumer TL;DR · the whole language in one glance-table ──
              Museum-plate rows (01 · the envelope → 05 · errors), each a
              two-tone sentence + its mono token. The technical reference
              (S.0+) deepens every row below. */}
          <section
            className="spec-tldr"
            aria-labelledby="spec-tldr-title"
            data-rise
            style={{ ['--rise-delay' as string]: '130ms' }}
          >
            <p className="spec-tldr-kicker">tl;dr · {CANON.pillars} pillars</p>
            <h2 id="spec-tldr-title" className="spec-tldr-title">
              The whole language, at a glance.
            </h2>
            <dl className="spec-tldr-table">
              {TLDR_PILLARS.map((p, i) => (
                <div className="spec-tldr-row" key={p.name}>
                  <dt className="spec-tldr-plate">
                    {String(i + 1).padStart(2, '0')} · {p.name}
                  </dt>
                  <dd className="spec-tldr-gloss">
                    <b>{p.claim}</b> {p.gloss}
                  </dd>
                  <dd className="spec-tldr-token">
                    <code>{p.token}</code>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="spec-tldr-link">
              full text:{' '}
              <a href={SPEC} target="_blank" rel="noreferrer">
                github.com/supernovae-st/nika-spec
              </a>{' '}
              ↗ · machine contract:{' '}
              <a href="/schema/workflow.json" target="_blank" rel="noreferrer">
                workflow.json
              </a>
            </p>
          </section>



              {/* THE INDEX · the S-chips band — fig · title · gloss · derived
                  count · reading tick. Absorbs the old stamp band AND the TOC
                  pills: one instrument, sticky under the nav on desktop. */}
              <nav className="spec-chips" aria-label="On this page" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
                {SPEC_SECTIONS.map((s) => (
                  <a
                    key={s.fig}
                    href={s.anchor}
                    className={`spec-chip2${lit.has(s.key) ? ' is-lit' : ''}`}
                    aria-current={current === s.key ? 'true' : undefined}
                    data-node={s.key}
                  >
                    <span className="spec-chip2-head mono">
                      <span className="spec-chip2-tick" aria-hidden />
                      {s.fig}
                      <span className="spec-chip2-count">{s.count}</span>
                    </span>
                    <span className="spec-chip2-title">{s.title}</span>
                    <span className="spec-chip2-gloss">{s.chipGloss}</span>
                  </a>
                ))}
              </nav>

              {/* the schematic strip · the mobile / narrow expression of the
                  machine (aria-hidden decoration; the TOC above is the truth) */}
              <div className="spec-strip" aria-hidden>
                <SpecSchematic lit={lit} current={current} className="spec-schematic--strip" />
                <span className="spec-strip-tally mono">
                  ASSEMBLED·····{assembled}/{assembledMax}
                </span>
              </div>

              {/* ══ S.0 · the envelope ══════════════════════════════════════ */}
              <div
                id="s0"
                className="spec-block"
                data-stratum="frame"
                data-rise
                style={{ ['--rise-delay' as string]: '120ms' }}
              >
                <SpecHead fig="S.0" name="The envelope" count={`${ENVELOPE_KEYS.length} top-level keys`}>
                  Every file opens with <code>nika: v1</code>, one version marker, pinned for the v1
                  lifetime. No <code>v1.0</code>, no <code>v2</code> migration. Three keys are required;
                  the rest are optional.
                </SpecHead>
                <div className="spec-split">
                  <div className="spec-keycol">
                    <ul className="spec-keys">
                      {ENVELOPE_REQ.map((k) => (
                        <li className="spec-key" key={k.key}>
                          <code className="spec-key-name">{k.key}</code>
                          <span className="spec-key-req">required</span>
                          <span className="spec-key-gloss">{k.gloss}</span>
                        </li>
                      ))}
                    </ul>
                    {/* the optional keys fold · native disclosure, crawlable + keyboard-native */}
                    <details className="spec-fold">
                      <summary className="spec-fold-cue">
                        <span className="spec-fold-mark" aria-hidden />
                        {ENVELOPE_OPT.length} optional keys
                      </summary>
                      <ul className="spec-keys spec-keys--fold">
                        {ENVELOPE_OPT.map((k) => (
                          <li className="spec-key" key={k.key}>
                            <code className="spec-key-name">{k.key}</code>
                            <span className="spec-key-req spec-key-req--opt">optional</span>
                            <span className="spec-key-gloss">{k.gloss}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                  <div className="spec-aside">
                    <p className="spec-aside-cap">A real file · standup-digest</p>
                    <CodeFile
                      yaml={SAMPLE_YAML}
                      filename="standup-digest.nika.yaml"
                      className="spec-code" wrap tips />
                  </div>
                </div>
              </div>

              {/* ══ S.1 · the four verbs ════════════════════════════════════
                  Rich cards · a real 2-line example open in the premium CodeFile.
                  The verb hue lights ONLY inside the code frame — the card chrome
                  and the rest of the reference stay monochrome. */}
              <div id="s1" className="spec-block" data-stratum="verbs" data-rise>
                <SpecHead fig="S.1" name="The four verbs" count={`${CANON.verbs} · locked forever`}>
                  A verb is a <b>distinct native execution model</b>. A task binds exactly one. That is
                  the whole operation space: <code>fetch</code>, recall, db and files are <em>tools</em>{' '}
                  reached under <code>invoke:</code>, not verbs.
                </SpecHead>
                <div className="spec-verbcards">
                  {VERB_CARDS.map((v, i) => (
                    <article className="spec-verbcard" key={v.verb} data-node={`verb:${v.verb}`}>
                      <HudMarks />
                      <header className="spec-verbcard-head">
                        <span className="spec-verbcard-glyph" aria-hidden>
                          {verbGlyph(v.verb)}
                        </span>
                        <code className="spec-verbcard-name">{v.verb}</code>
                        <span className="spec-verbcard-tag">{v.tagline}</span>
                        <span className="spec-verbcard-fig" aria-hidden>
                          {`S.1.${i + 1}`}
                        </span>
                      </header>
                      <p className="spec-verbcard-model">{VERB_MODEL[v.verb]}</p>
                      <div className="spec-verbcard-code">
                        <CodeFile yaml={v.code} lang="yaml" lineNumbers={false} wrap tips />
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* ══ S.2 · the task shape ════════════════════════════════════
                  An anatomy diagram (a labelled node · the required core lit, the
                  optional controls dimmed) beside the field ledger (required core
                  visible · optional controls behind the fold). */}
              <div id="s2" className="spec-block" data-stratum="plan" data-rise>
                <SpecHead fig="S.2" name="The task shape" count="1 required field · 1 verb">
                  A task is a DAG node. <code>id</code> is the only required field and exactly one verb
                  binds; everything else is an optional structural control.
                </SpecHead>
                <div className="spec-tasksplit">
                  {/* the anatomy · a labelled task node */}
                  <figure className="spec-anatomy">
                    <HudMarks />
                    <figcaption className="spec-anatomy-cap mono">anatomy of a task node</figcaption>
                    <div className="spec-anatomy-node">
                      <span className="spec-anatomy-line">
                        <span className="spec-anatomy-punct" aria-hidden>
                          -{' '}
                        </span>
                        <span className="spec-anatomy-k spec-anatomy-k--req">id</span>
                        <span className="spec-anatomy-punct">: </span>
                        <span className="spec-anatomy-v">summarize</span>
                        <span className="spec-anatomy-mark spec-anatomy-mark--req">required</span>
                      </span>
                      <span className="spec-anatomy-line spec-anatomy-line--verb">
                        <span className="spec-anatomy-k spec-anatomy-k--verb">infer</span>
                        <span className="spec-anatomy-punct">:</span>
                        <span className="spec-anatomy-mark spec-anatomy-mark--verb">
                          1 of {CANON.verbs} verbs
                        </span>
                      </span>
                      <span className="spec-anatomy-line spec-anatomy-line--nest">
                        <span className="spec-anatomy-punct">  prompt: </span>
                        <span className="spec-anatomy-v">&quot;…&quot;</span>
                      </span>
                      <span className="spec-anatomy-line">
                        <span className="spec-anatomy-k spec-anatomy-k--opt">depends_on</span>
                        <span className="spec-anatomy-punct">: [extract]</span>
                        <span className="spec-anatomy-mark">the edges</span>
                      </span>
                      <span className="spec-anatomy-line">
                        <span className="spec-anatomy-k spec-anatomy-k--opt">when</span>
                        <span className="spec-anatomy-punct">: </span>
                        <span className="spec-anatomy-v">${'{{'} … {'}}'}</span>
                        <span className="spec-anatomy-mark">a CEL gate</span>
                      </span>
                    </div>
                    <p className="spec-anatomy-legend">
                      <span className="spec-anatomy-legend-item spec-anatomy-legend-item--req">
                        required core
                      </span>
                      <span className="spec-anatomy-legend-item spec-anatomy-legend-item--opt">
                        optional controls
                      </span>
                    </p>
                  </figure>

                  {/* the field ledger · the required core, then the optional fold */}
                  <div className="spec-fieldcol">
                    <ul className="spec-fields">
                      {FIELDS_REQ.map((f) => (
                        <li className="spec-field" key={f.name}>
                          <code className="spec-field-name">{f.name}</code>
                          <span className="spec-field-req">req</span>
                          <span className="spec-field-gloss">{f.gloss}</span>
                        </li>
                      ))}
                    </ul>
                    <details className="spec-fold">
                      <summary className="spec-fold-cue">
                        <span className="spec-fold-mark" aria-hidden />
                        {FIELDS_OPT.length} optional controls
                      </summary>
                      <ul className="spec-fields spec-fields--fold">
                        {FIELDS_OPT.map((f) => (
                          <li className="spec-field" key={f.name}>
                            <code className="spec-field-name">{f.name}</code>
                            <span className="spec-field-req spec-field-req--opt">opt</span>
                            <span className="spec-field-gloss">{f.gloss}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
              </div>

              {/* ══ S.3 · the permits — the enforcement model (the seatbelt) ══ */}
              <div id="permits" className="spec-block spec-block--permits" data-stratum="permits" data-rise>
                <SpecHead
                  fig="S.3"
                  name="The permits"
                  count="default-deny once present"
                >
                  The <b>capability boundary</b>: the contract an agent must satisfy before it
                  acts. Once <code>permits:</code> is present, every category is{' '}
                  <b>default-deny</b>: which files it can read, which it can write (read XOR
                  write), which hosts it can reach, which programs it can run, which tools it may
                  call. The runtime <em>enforces</em> it: out of bounds is <b>denied</b>, not
                  logged after the fact.
                </SpecHead>
                {/* the boundary diagram · the plan sits at the centre; every effect
                    must pass through one of the four declared gates before it runs.
                    Anything off the list is denied at the gate — a refusal, not a log. */}
                <div className="spec-boundary" data-rise>
                  <HudMarks />
                  <span className="spec-boundary-ring" aria-hidden />
                  <span className="spec-boundary-ring spec-boundary-ring--2" aria-hidden />
                  <div className="spec-boundary-core">
                    <span className="spec-boundary-core-glyph" aria-hidden>
                      ❯
                    </span>
                    <span className="spec-boundary-core-label">the plan</span>
                    <span className="spec-boundary-core-sub mono">default-deny</span>
                  </div>
                  <ul className="spec-boundary-gates">
                    {PERMIT_CATS.map((c, i) => (
                      <li
                        className={`spec-boundary-gate spec-boundary-gate--${c.key}`}
                        key={c.key}
                        data-node={`gate:${c.key}`}
                      >
                        <span className="spec-boundary-gate-glyph" aria-hidden>
                          {c.glyph}
                        </span>
                        <code className="spec-boundary-gate-cap">{c.cap}</code>
                        <span className="spec-boundary-gate-shape mono" aria-hidden>
                          {c.shape}
                        </span>
                        <span className="spec-boundary-gate-fig mono" aria-hidden>
                          {['i', 'ii', 'iii', 'iv'][i]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="spec-permits-grid">
                  {/* the four declarable categories · the gloss ledger */}
                  <dl className="spec-permits-cats">
                    {PERMIT_CATS.map((c, i) => (
                      <div className="spec-permits-cat" key={c.cap}>
                        <dt className="spec-permits-cat-key">
                          <span className="spec-permits-cat-fig" aria-hidden>
                            {['i', 'ii', 'iii', 'iv'][i]}
                          </span>
                          <span className="spec-permits-cat-glyph" aria-hidden>
                            {c.glyph}
                          </span>
                          <code>{c.cap}</code>
                        </dt>
                        <dd className="spec-permits-cat-gloss">
                          {c.gloss}
                          <span className="spec-permits-cat-shape mono" aria-hidden>
                            {c.shape}
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {/* the enforcement codes · denied, before it runs */}
                  <div className="spec-permits-denials">
                    <p className="spec-permits-denials-head mono">
                      <span className="spec-permits-denials-dot" aria-hidden />
                      denied, before it runs
                    </p>
                    <ul className="spec-permits-codes">
                      {PERMIT_DENIALS.map((d) => (
                        <li className="spec-permits-code" key={d.code}>
                          <span className="spec-permits-code-id mono">{d.code}</span>
                          <span className="spec-permits-code-fail">{d.failure}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="spec-permits-foot">
                      See it felt, not told:{' '}
                      <Link to="/#the-boundary" className="spec-inline-link">
                        toggle a permit and watch the runtime obey
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>

              {/* ══ S.4 · the stdlib ════════════════════════════════════════ */}
              <div id="s3" className="spec-block" data-stratum="stdlib" data-rise>
                <SpecHead
                  fig="S.4"
                  name="The standard library"
                  count={`${CANON.builtins} builtins · ${BUILTIN_GROUPS.length} families`}
                >
                  <b>{CANON.builtins}</b> builtin tools, all reached with <code>invoke:</code> · nothing
                  to install. Grouped by what they touch.
                </SpecHead>
                <div className="spec-fams">
                  {BUILTIN_GROUPS.map((f) => (
                    <div className="spec-fam" key={f.label}>
                      <p className="spec-fam-label">
                        {f.label}
                        <span className="spec-fam-n">· {f.names.length}</span>
                      </p>
                      <div className="spec-chips">
                        {f.names.map((n) => (
                          <code className="spec-chip" key={n} data-node={`builtin:${n}`}>
                            {n}
                          </code>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ══ S.5 · providers ═════════════════════════════════════════ */}
              <div id="s4" className="spec-block" data-stratum="providers" data-rise>
                <SpecHead
                  fig="S.5"
                  name="Providers"
                  count={`${CANON.providers} · ${CANON.providersLocal} local · ${CANON.providersCloud} cloud · ${CANON.providersTest} mock`}
                >
                  Pick per task or per file. <b>Local-first</b>: <code>provider: ollama</code> runs
                  offline, no key. Cloud is open-weight-first (Mistral leads).
                </SpecHead>
                <div className="spec-fams">
                  <div className="spec-fam">
                    <p className="spec-fam-label">
                      Local runtimes
                      <span className="spec-fam-n">· {CANON.providersLocal} · offline</span>
                    </p>
                    <div className="spec-chips">
                      {PROVIDERS_LOCAL.map((p, i) => (
                        <code className="spec-chip" key={p} data-node={`provider:${CANON.providerIdsLocal[i]}`}>
                          {p}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div className="spec-fam">
                    <p className="spec-fam-label">
                      Cloud · open-weight first
                      <span className="spec-fam-n">· {CANON.providersCloud}</span>
                    </p>
                    <div className="spec-chips">
                      {PROVIDERS_CLOUD.map((p, i) => (
                        <code className="spec-chip" key={p} data-node={`provider:${CANON.providerIdsCloud[i]}`}>
                          {p}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div className="spec-fam">
                    <p className="spec-fam-label">
                      Test
                      <span className="spec-fam-n">· {CANON.providersTest} · deterministic</span>
                    </p>
                    <div className="spec-chips">
                      {PROVIDERS_TEST.map((p, i) => (
                        <code className="spec-chip" key={p} data-node={`provider:${CANON.providerIdsTest[i]}`}>
                          {p}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ══ S.6 · extract modes ═════════════════════════════════════ */}
              <div id="s5" className="spec-block" data-stratum="extract" data-rise>
                <SpecHead
                  fig="S.6"
                  name="Extract modes"
                  count={`${CANON.extractModes} modes on fetch`}
                >
                  How <code>nika:fetch</code> turns a page into typed output: from raw{' '}
                  <code>text</code> to a parsed <code>article</code>, <code>feed</code> or{' '}
                  <code>jq</code> projection.
                </SpecHead>
                <div className="spec-chips">
                  {CANON.extractModeNames.map((m) => (
                    <code className="spec-chip" key={m} data-node={`extract:${m}`}>
                      {m}
                    </code>
                  ))}
                </div>
              </div>

              {/* ══ S.7 · error namespaces ══════════════════════════════════ */}
              <div id="s6" className="spec-block" data-stratum="errors" data-rise>
                <SpecHead
                  fig="S.7"
                  name="Error namespaces"
                  count={`${CANON.errorNamespaces} namespaces · ${CANON.errorCodes} codes`}
                >
                  Every failure carries a typed code (<code>NIKA-‹NS›-NNN</code>) across{' '}
                  <b>{CANON.errorNamespaces}</b> namespaces, with a category and a transient flag. The
                  full registry lives in <code>errors/catalog.json</code>.
                </SpecHead>
                <ul className="spec-ns">
                  {CANON.errorNamespaceNames.map((ns) => (
                    <li className="spec-ns-row" key={ns} data-node={`ns:${ns}`}>
                      <code className="spec-ns-name">{ns}</code>
                      <span className="spec-ns-scope">{nsScope(ns)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ══ S.8 · license + invariants ══════════════════════════════ */}
              <div id="s7" className="spec-block spec-block--last" data-stratum="license" data-rise>
                <SpecHead fig="S.8" name="License + invariants" count="locked, forever">
                  The contract you can count on: the parts that never change.
                </SpecHead>
                <ul className="spec-invariants">
                  <Invariant fig="S.8a" claim="Real semver toward 1.0">
                    The engine ships on real semver: currently {ENGINE_VERSION}, toward a
                    1.0 launch. The language envelope stays <code>nika: v1</code>, frozen forever.
                  </Invariant>
                  <Invariant fig="S.8b" claim="Four verbs, locked">
                    <code>infer · exec · invoke · agent</code>: a closed set, locked forever. New
                    capability arrives as a tool, never a fifth verb.
                  </Invariant>
                  <Invariant fig="S.8c" claim="The spec is Apache-2.0">
                    The language spec is permissive: adopt it, build a runtime against it, with a
                    patent grant. The standard for the workflow file.
                  </Invariant>
                  <Invariant fig="S.8d" claim="The engine is AGPL-3.0-or-later">
                    Copyleft on the engine: a hosted fork shares its source. Anti-extraction by
                    construction.
                  </Invariant>
                </ul>

                {/* the close · the dimension line + the forward links */}
                <p className="spec-note">
                  {CANON.verbs} verbs · {CANON.builtins} builtins · {CANON.providers} providers ·{' '}
                  {CANON.extractModes} extract modes · {CANON.errorNamespaces} error namespaces · every
                  count derives from the spec&apos;s <code>canon.yaml</code>, never hand-typed
                </p>

                <div className="spec-links">
                  <a href={SPEC} target="_blank" rel="noreferrer" className="spec-link">
                    Read the full spec
                    <span aria-hidden className="spec-link-arrow">
                      {' '}
                      ↗
                    </span>
                  </a>
                  <Link to="/use-cases" className="spec-link spec-link--dim">
                    See it in real workflows
                    <span aria-hidden className="spec-link-arrow">
                      {' '}
                      →
                    </span>
                  </Link>
                  <a href={REPO} target="_blank" rel="noreferrer" className="spec-link spec-link--dim">
                    <span aria-hidden className="spec-link-glyph">
                      ★
                    </span>
                    Star on GitHub
                  </a>
                </div>
              </div>
            </div>

            {/* ── the machine rail · sticky. The STAGE is decoration (aria-hidden:
                the TOC + the column are the truth — the elevation until the
                canvas mounts, [data-machine] retires it); THE HELM below stays
                exposed (real buttons, keyboard-reachable). */}
            <aside
              className={`spec-rail${machine ? ' is-live' : ''}`}
              data-stage={stage}
            >
              <div className="spec-rail-stage" ref={stageRef} aria-hidden>
                {machine ? (
                  <Suspense fallback={null}>
                    <TheSpecMachine
                      stageRef={stageRef}
                      lit={lit}
                      current={current}
                      highlight={hoverNode}
                      explode={explode}
                      resetSignal={resetSignal}
                      flightRef={flightRef}
                      onHover={setHoverNode}
                    />
                  </Suspense>
                ) : null}
                <SpecSchematic lit={lit} current={current} />
                {/* THE POSITION PLATE · where you are, said loud: the section
                    fig + its ship station + the derived count */}
                <div className="spec-rail-pos">
                  <span className="spec-rail-pos-fig mono">
                    {cur ? `▸ ${cur.fig}` : '▸ THE SHIP'}
                  </span>
                  <span className="spec-rail-pos-part">
                    {cur ? cur.shipPart.toUpperCase() : 'NIKA: V1'}
                  </span>
                  {cur ? null : (
                    <span className="spec-rail-pos-sub mono">
                      SECTIONS·····{SPEC_SECTIONS.length} · SCROLL TO BOARD
                    </span>
                  )}
                </div>
                <span className="spec-rail-hud spec-rail-hud--bl">
                  ASSEMBLED·····{assembled}/{assembledMax}
                </span>
                <span className="spec-rail-gauge">
                  {SPEC_SECTIONS.map((s) => (
                    <i
                      key={s.fig}
                      className={`${lit.has(s.key) ? 'is-lit' : ''}${current === s.key ? ' is-cur' : ''}`}
                    />
                  ))}
                </span>
                <span className="spec-rail-hud spec-rail-hud--br">
                  {current === 'license' ? 'AGPL·····FOREVER' : 'NIKA: V1·····FROZEN'}
                </span>
              </div>
              {/* THE HELM · outside the aria-hidden stage (keyboard-reachable);
                  CSS shows it only while the canvas holds the stage */}
              <div className="spec-helm">
                <button
                  type="button"
                  className="spec-helm-btn"
                  aria-pressed={explode}
                  onClick={() => setExplode((e) => !e)}
                >
                  EXPLODE
                </button>
                <button
                  type="button"
                  className="spec-helm-btn"
                  onClick={() => {
                    setExplode(false)
                    setResetSignal((n) => n + 1)
                  }}
                >
                  RESET
                </button>
              </div>
            </aside>
          </div>

          {/* the cursor tooltip · the node under the pointer, spoken in full:
              name · family/detail · where a click lands (pointer-only
              decoration — the readout also lights the DOM twins) */}
          {hoverReadout ? (
            <div className="spec-tip mono" ref={tipRef} aria-hidden>
              <b>{hoverReadout.split('·····')[0]}</b>
              <span>{hoverReadout.split('·····')[1]}</span>
              {(() => {
                const n = hoverNode ? nodeById(hoverNode) : undefined
                const sec = n ? SPEC_SECTIONS.find((x) => x.anchor === n.anchor) : undefined
                return sec ? <i>click ▸ {sec.fig} · {sec.title}</i> : null
              })()}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}

/* ── a shared sub-head · the section index, the name, an optional count,
   and a one-line caption — the register used at the top of every spec block. */
function SpecHead({
  fig,
  name,
  count,
  children,
}: {
  fig: string
  name: string
  count?: string
  children: React.ReactNode
}) {
  return (
    <div className="spec-head">
      <div className="spec-head-line">
        <span className="spec-head-fig">{fig}</span>
        <h2 className="spec-head-name">{name}</h2>
        {count ? <span className="spec-head-count">{count}</span> : null}
      </div>
      <p className="spec-head-cap">{children}</p>
    </div>
  )
}

/* ── one invariant row · a FIG tick + a claim + a one-line detail ── */
function Invariant({
  fig,
  claim,
  children,
}: {
  fig: string
  claim: string
  children: React.ReactNode
}) {
  return (
    <li className="spec-invariant">
      <p className="spec-invariant-claim">
        <span className="spec-invariant-fig">{fig}</span>
        {claim}
      </p>
      <p className="spec-invariant-detail">{children}</p>
    </li>
  )
}
