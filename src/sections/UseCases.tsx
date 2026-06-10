import { useRef, useState } from 'react'
import Code from '../Code'
import { Plain } from '../components/ui'
import RunSim from './RunSim'
import { VERB_COLOR } from './transform-data'
import { UC_TABS, yamlFor, fileFor, docsFor, type UC } from './usecases-data'
import { CANON } from '../canon.generated'
import { SHOWCASE_DAG, type ShowcaseTask } from './usecases-yaml.generated'

/* ─── §use-cases · the tabbed explorer ──────────────────────────────────────
   5 métier tabs × 3-4 SELECTABLE workflows — click a card, the right
   panel shows that case's REAL file (projected from nika-spec showcase ·
   conformance-validated). Ludique: cards re-enter on tab switch, the
   file panel re-enters on selection. Every case links to its docs
   walkthrough. */
export default function UseCases() {
  const [tab, setTab] = useState(0)
  const [sel, setSel] = useState(0)
  const [hl, setHl] = useState<[number, number] | null>(null)
  const codeBox = useRef<HTMLDivElement>(null)
  const t = UC_TABS[tab]
  const active: UC = t.cases[Math.min(sel, t.cases.length - 1)]
  const dag = SHOWCASE_DAG[active.slug]

  const pickTab = (i: number) => {
    setTab(i)
    setSel(0)
    setHl(null)
  }

  /* the run-sim narrates a task → light its lines + scroll them into view */
  const onSimTask = (task: ShowcaseTask | null) => {
    if (!task) {
      setHl(null)
      return
    }
    setHl([task.line0, task.line1])
    const box = codeBox.current
    const firstLine = box?.querySelector('code > .block')
    if (box && firstLine) {
      const lh = firstLine.getBoundingClientRect().height || 23
      box.scrollTo({ top: Math.max(0, task.line0 * lh - 44), behavior: 'smooth' })
    }
  }

  return (
    <section id="use-cases" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-28 md:py-36">
      <p className="rv mono mb-4 text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
        § Use cases
      </p>
      <h2
        className="rv mb-3 font-semibold tracking-tight"
        style={{ fontSize: 'clamp(2rem, 1rem + 3.5vw, 3.6rem)', lineHeight: 1.02 }}
      >
        What people run with it.
      </h2>
      <p className="rv max-w-[40rem] text-[17px] leading-relaxed text-[var(--fg-mute)]">
        Anything you&apos;d ask an AI to do more than once belongs in a file.
      </p>
      <div className="mb-10">
        <Plain>
          If you re-explain the same task to a chatbot every week, that task is a workflow. Every
          file below is real — pick your job, click a card, read the exact YAML that runs it.
        </Plain>
      </div>

      {/* ── the tab bar · 5 métiers ── */}
      <div
        className="rv glass mb-8 inline-flex flex-wrap gap-1 rounded-full p-1.5"
        role="tablist"
        aria-label="Use case categories"
      >
        {UC_TABS.map((tb, i) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={i === tab}
            onClick={() => pickTab(i)}
            className={`rounded-full px-5 py-2 text-[13.5px] font-medium transition-all duration-300 ${
              i === tab
                ? 'skeuo-brand text-white'
                : 'text-[var(--fg-mute)] hover:text-[var(--fg)]'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <p key={`hook-${t.id}`} className="uc-in mb-8 text-[15px] text-[var(--fg-mute)]">
        {t.hook}
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_0.92fr]">
        {/* ── the selectable workflows of this métier ── */}
        <div key={`cards-${t.id}`} className="flex flex-col gap-4" role="tablist" aria-label="Workflows">
          {t.cases.map((u, i) => {
            const selected = i === Math.min(sel, t.cases.length - 1)
            return (
              <button
                key={u.slug}
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setSel(i)
                  setHl(null)
                }}
                className={`uc-in skeuo group flex gap-5 rounded-2xl px-6 py-5 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                  selected ? 'ring-1 ring-[var(--cyan)]/60' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="mt-0.5 text-[28px]">{u.icon}</span>
                <span className="flex-1">
                  <span className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[17px] font-semibold text-[var(--fg)]">{u.title}</span>
                    <span
                      className="mono rounded-md border px-1.5 py-0.5 text-[10.5px]"
                      style={{ color: 'var(--fg-dim)', borderColor: 'var(--hair)' }}
                      title={`Complexity tier ${u.tier.slice(1)} of 4`}
                    >
                      {u.tier}
                    </span>
                    <span className="mono flex gap-1.5 text-[10.5px]">
                      {u.verbs.map((v) => (
                        <span
                          key={v}
                          className="rounded-md border px-1.5 py-0.5"
                          style={{
                            color: VERB_COLOR[v],
                            borderColor: `color-mix(in srgb, ${VERB_COLOR[v]} 35%, transparent)`,
                          }}
                        >
                          {v}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="block text-[14px] leading-relaxed text-[var(--fg-mute)]">
                    {u.body}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* ── the REAL file of the selected case ── */}
        <div key={`yaml-${t.id}-${active.slug}`} className="uc-in skeuo overflow-hidden rounded-2xl">
          <div
            className="flex items-center gap-2 border-b px-4 py-2.5"
            style={{ borderColor: 'var(--hair)' }}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="h-3 w-3 rounded-full" style={{ background: '#febc2e' }} />
            <span className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} />
            <span className="mono ml-3 text-[12px] text-[var(--fg-dim)]">{fileFor(active)}</span>
            <a
              href={docsFor(active)}
              target="_blank"
              rel="noreferrer"
              className="mono ml-auto text-[11.5px] text-[var(--cyan)] transition-opacity hover:opacity-80"
            >
              walkthrough →
            </a>
          </div>
          {dag && <RunSim key={`sim-${active.slug}`} dag={dag} onTask={onSimTask} />}
          <div ref={codeBox} className="max-h-[380px] overflow-y-auto px-5 py-4">
            <Code code={yamlFor(active)} highlight={hl} />
          </div>
          <div
            className="border-t px-5 py-3.5 text-[13.5px] leading-relaxed text-[var(--cyan)]"
            style={{ borderColor: 'var(--hair)' }}
          >
            {active.outcome}
          </div>
        </div>
      </div>

      <p className="rv mt-6 text-[13px] leading-relaxed text-[var(--fg-dim)]">
        Every file above ships in{' '}
        <a
          className="text-[var(--fg-mute)] underline decoration-[var(--hair)] underline-offset-4 transition-colors hover:text-[var(--fg)]"
          href="https://github.com/supernovae-st/nika-spec/tree/main/examples/showcase"
          target="_blank"
          rel="noreferrer"
        >
          nika-spec/examples/showcase
        </a>{' '}
        and passes the spec&apos;s conformance gate — schema, DAG cross-references, stdlib surface.
        Sixteen workflows, four tiers, all {CANON.builtins} builtins exercised.
      </p>
    </section>
  )
}
