import { Suspense, lazy, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { lintNika, type LintDiag } from '../lib/nika-lint'
import { routeHead } from '../content'
import { TEMPLATES_YAML, SHOWCASE_YAML } from '../sections/usecases-yaml.generated'
import { VERB_COLOR } from '../sections/transform-data'

/* the editor (CodeMirror + @codemirror/*) is its own chunk · loaded client-side
   only, so it never rides the shared main bundle that every route eager-loads.
   The prerendered /play already has zero .cm-editor DOM, so this is a pure win. */
const PlayEditor = lazy(() => import('./PlayEditor'))

/* ─── /play · the playground ────────────────────────────────────────────────
   Edit real Nika in the browser · the validator's own NIKA codes appear
   live (the TS port of the conformance cross-refs + the eight hard
   rules). Client-only — nothing leaves the tab. Seeds = the 6 templates
   (slot-marked skeletons) + the 20 showcase workflows, all projected
   from the spec. */

const TEMPLATE_ORDER = ['chain', 'gate-and-act', 'fanout', 'etl-state', 'agent-loop', 'human-gated-ship']

export function Component() {
  const [seed, setSeed] = useState('chain')
  const [code, setCode] = useState(TEMPLATES_YAML['chain'] ?? '')
  const [diags, setDiags] = useState<LintDiag[]>(() => lintNika(TEMPLATES_YAML['chain'] ?? ''))

  useHead({
    title: 'Playground · Nika',
    link: routeHead('/play').link,
    meta: [
      ...routeHead('/play').meta,
      {
        name: 'description',
        content:
          'Edit real Nika in the browser. The validator runs live with the engine’s own NIKA error codes — write a workflow, see it check in place.',
      },
      { property: 'og:title', content: 'Playground · Nika' },
      {
        property: 'og:description',
        content: 'Edit real Nika in the browser — live validation with the engine’s NIKA codes.',
      },
      { name: 'twitter:title', content: 'Playground · Nika' },
      {
        name: 'twitter:description',
        content: 'Edit real Nika in the browser — live validation with the engine’s NIKA codes.',
      },
    ],
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const pick = (slug: string) => {
    const src = TEMPLATES_YAML[slug] ?? SHOWCASE_YAML[slug] ?? ''
    setSeed(slug)
    setCode(src)
    setDiags(lintNika(src))
  }

  const valid = diags.length === 0

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-28">
      <header className="mb-8">
        <Link to="/" className="mono text-[12px] text-[var(--fg-dim)] transition-colors hover:text-[var(--fg)]">
          ← nika.sh
        </Link>
        <h1 className="mt-4 mb-2 font-semibold tracking-tight" style={{ fontSize: 'clamp(2rem, 1rem + 3vw, 3rem)' }}>
          Playground
        </h1>
        <p className="max-w-[44rem] text-[15.5px] leading-relaxed text-[var(--fg-mute)]">
          Real Nika, validated as you type — the same <span className="mono text-[13.5px]">NIKA</span> codes
          the engine raises, with their fixes. Everything runs in this tab; nothing is sent anywhere.
        </p>
      </header>

      {/* ── seed picker · templates then showcase ── */}
      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <span className="mono mr-1 text-[10.5px] tracking-[0.2em] text-[var(--fg-ghost)] uppercase">Templates</span>
        {TEMPLATE_ORDER.filter((t) => t in TEMPLATES_YAML).map((t) => (
          <button
            key={t}
            onClick={() => pick(t)}
            className={`mono rounded-md border px-2.5 py-1 text-[11.5px] transition-colors ${
              seed === t ? 'border-[var(--cyan)] text-[var(--cyan)]' : 'text-[var(--fg-mute)] hover:text-[var(--fg)]'
            }`}
            style={{ borderColor: seed === t ? undefined : 'var(--hair)' }}
          >
            {t}
          </button>
        ))}
        <span className="mono mr-1 ml-3 text-[10.5px] tracking-[0.2em] text-[var(--fg-ghost)] uppercase">Showcase</span>
        <select
          value={seed in SHOWCASE_YAML ? seed : ''}
          onChange={(e) => e.target.value && pick(e.target.value)}
          className="mono rounded-md border bg-transparent px-2 py-1 text-[11.5px] text-[var(--fg-mute)]"
          style={{ borderColor: 'var(--hair)' }}
        >
          <option value="">pick a real job…</option>
          {Object.keys(SHOWCASE_YAML).map((s) => (
            <option key={s} value={s} style={{ background: 'var(--bg)' }}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* ── the editor ── */}
        <div className="skeuo overflow-hidden rounded-2xl">
          <div className="flex items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: 'var(--hair)' }}>
            <span className="h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="h-3 w-3 rounded-full" style={{ background: '#febc2e' }} />
            <span className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} />
            <span className="mono ml-3 text-[12px] text-[var(--fg-dim)]">{seed}.nika.yaml</span>
            <span
              className="mono ml-auto rounded-md border px-2 py-0.5 text-[10.5px]"
              style={{
                color: valid ? '#22d3ee' : '#ff7a3c',
                borderColor: `color-mix(in srgb, ${valid ? '#22d3ee' : '#ff7a3c'} 40%, transparent)`,
              }}
            >
              {valid ? '✓ valid' : `${diags.length} issue${diags.length > 1 ? 's' : ''}`}
            </span>
          </div>
          <Suspense
            fallback={
              <div
                className="mono flex items-center px-4 py-3 text-[13px] text-[var(--fg-ghost)]"
                style={{ minHeight: 480 }}
                aria-hidden="true"
              >
                <span className="opacity-70">loading editor…</span>
              </div>
            }
          >
            <PlayEditor value={code} onChange={setCode} onDiags={setDiags} />
          </Suspense>
        </div>

        {/* ── the verdict panel · error → fix ── */}
        <aside className="flex flex-col gap-3">
          <div className="skeuo rounded-2xl px-5 py-4">
            <p className="mono mb-3 text-[11px] tracking-[0.24em] text-[var(--fg-dim)] uppercase">
              Validator · {valid ? 'green' : 'speaking'}
            </p>
            {valid ? (
              <div className="flex flex-col gap-2.5">
                <p className="text-[13.5px] leading-relaxed text-[var(--cyan)]">
                  ✓ This file passes the playground's static checks — envelope, verbs, edges,
                  namespaces, providers, expressions. The engine's <code className="mono text-[12px]">nika check</code> runs the full oracle. Ship it with{' '}
                  <code className="mono text-[12px]">nika run {seed}.nika.yaml</code>.
                </p>
                {(seed === 'human-gated-ship' || seed === 'resume-screener') && (
                  <p className="text-[12.5px] leading-relaxed text-[var(--fg-mute)]">
                    Experiment · this file declares <code className="mono text-[11.5px]">permits:</code> —
                    its whole blast radius, in-file. Remove an entry from{' '}
                    <code className="mono text-[11.5px]">permits.tools</code> and watch{' '}
                    <code className="mono text-[11.5px]">NIKA-SEC-004</code> fire: once the boundary is
                    declared, the body must fit it.
                  </p>
                )}
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {diags.slice(0, 8).map((d, i) => (
                  <li key={i} className="text-[13px] leading-relaxed">
                    <span className="mono text-[11.5px] text-[var(--ember,#ff7a3c)]" style={{ color: '#ff7a3c' }}>
                      L{d.line} · {d.code}
                    </span>
                    <span className="block text-[var(--fg-mute)]">{d.message}</span>
                    <span className="block text-[var(--cyan)]">→ {d.fix}</span>
                  </li>
                ))}
                {diags.length > 8 && (
                  <li className="mono text-[11px] text-[var(--fg-ghost)]">+{diags.length - 8} more…</li>
                )}
              </ul>
            )}
          </div>

          <div className="glass rounded-2xl px-5 py-4">
            <p className="mono mb-2.5 text-[11px] tracking-[0.24em] text-[var(--fg-dim)] uppercase">The four verbs</p>
            <div className="mono flex flex-wrap gap-1.5 text-[11px]">
              {(Object.keys(VERB_COLOR) as Array<keyof typeof VERB_COLOR>).map((v) => (
                <span
                  key={v}
                  className="rounded-md border px-2 py-0.5"
                  style={{ color: VERB_COLOR[v], borderColor: `color-mix(in srgb, ${VERB_COLOR[v]} 35%, transparent)` }}
                >
                  {v}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--fg-mute)]">
              Fill the <span className="mono text-[11.5px]"># SLOT:</span> lines — structure is
              instantiated, never invented. The{' '}
              <a className="text-[var(--cyan)]" href="https://docs.nika.sh/guides/agent-authoring" target="_blank" rel="noreferrer">
                protocol
              </a>{' '}
              and the{' '}
              <a className="text-[var(--cyan)]" href="https://docs.nika.sh/guides/patterns" target="_blank" rel="noreferrer">
                twelve patterns
              </a>{' '}
              are the long form.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
