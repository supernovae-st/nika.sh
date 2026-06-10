import { useState } from 'react'
import Code from '../Code'
import { Plain } from '../components/ui'
import { VERB_COLOR } from './transform-data'
import { UC_TABS } from './usecases-data'

/* ─── §use-cases · the tabbed explorer ──────────────────────────────────────
   A tab bar by persona — each tab: 3 picture-able workflows + the REAL file
   that runs the featured one. Ludique: cards re-enter on every switch. */
export default function UseCases() {
  const [tab, setTab] = useState(0)
  const t = UC_TABS[tab]

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
          If you re-explain the same task to a chatbot every week, that task is a workflow.
          Write it once, run it forever.
        </Plain>
      </div>

      {/* ── the tab bar ── */}
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
            onClick={() => setTab(i)}
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
        {/* ── the 3 workflows of this persona ── */}
        <div key={`cards-${t.id}`} className="flex flex-col gap-4">
          {t.cases.map((u, i) => (
            <div
              key={u.title}
              className="uc-in skeuo group flex gap-5 rounded-2xl px-6 py-5 transition-transform duration-300 hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="mt-0.5 text-[28px]">{u.icon}</span>
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-[17px] font-semibold text-[var(--fg)]">{u.title}</p>
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
                </div>
                <p className="text-[14px] leading-relaxed text-[var(--fg-mute)]">{u.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── the REAL file that runs the featured one ── */}
        <div key={`yaml-${t.id}`} className="uc-in skeuo overflow-hidden rounded-2xl">
          <div
            className="flex items-center gap-2 border-b px-4 py-2.5"
            style={{ borderColor: 'var(--hair)' }}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="h-3 w-3 rounded-full" style={{ background: '#febc2e' }} />
            <span className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} />
            <span className="mono ml-3 text-[12px] text-[var(--fg-dim)]">{t.yamlTitle}</span>
          </div>
          <div className="px-5 py-4">
            <Code code={t.yaml} />
          </div>
          <div
            className="border-t px-5 py-3.5 text-[13.5px] leading-relaxed text-[var(--cyan)]"
            style={{ borderColor: 'var(--hair)' }}
          >
            {t.outcome}
          </div>
        </div>
      </div>
    </section>
  )
}
