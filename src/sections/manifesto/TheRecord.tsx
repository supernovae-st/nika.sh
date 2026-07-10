import { useEffect, useRef, useState } from 'react'
import { RECORD, RECORD_UPDATED, type Strand } from '../../content/manifesto-record'

/* ─── §05 · THE RECORD · the proof layer (W2) ─────────────────────────────────
   The manifesto's opposite register, by design: sections 01-04 carry the poem
   (no vendor, no number), this section carries ONLY dated primary-sourced
   facts. Two strands strike one spine: ▢ the cage (control advances · grey,
   still) · ● the drum (liberation advances · the page's cyan, one beat on
   reveal). The score strip up top compresses the whole record into one
   glance: sparse ticks left, dense light right. The crescendo IS the data.

   Copy here is EN-only for now (the record's own technical register); the
   section FRAME strings move into manifesto-copy.ts ×8 locales in W5.
   Interaction: pure-CSS strand filter (data-mrf on the section · exitchat
   pattern), #rec-<id> deep links with :target highlight, IO-gated terminus
   pulse (never loops offscreen). Styles: the mr-* block in index.css. */

const COPY = {
  kicker: '§ The record',
  title: 'The manifesto states. The record proves.',
  intro:
    'Two lines run through the last three decades. One builds the cage: the letters and laws deciding who may think with what. One beats the drum: ramparts held, weights set free, coalitions forming. Every entry is dated, sourced, and yours to verify.',
  filterLabel: 'Filter the record',
  filters: { all: 'all', cage: 'the cage', drum: 'the drum' } as const,
  legend: 'control advances stay grey. liberation carries the light.',
  continues: 'the record continues',
  updated: 'updated',
  law: 'every entry carries a primary source · nothing from memory',
}

/* strip geometry · a tick's horizontal seat, 1991 → just past now (pure render
   math, no effect). Month precision is enough for a 28px-tall artifact. */
const T0 = 1991
const T1 = 2027
const seat = (date: string) => {
  const [y, m] = date.split('-')
  const t = Number(y) + (m ? (Number(m) - 0.5) / 12 : 0.5)
  return `${(((t - T0) / (T1 - T0)) * 100).toFixed(2)}%`
}

export function TheRecord() {
  const [filter, setFilter] = useState<'all' | Strand>('all')

  /* the terminus pulse breathes only while on screen (never loops offscreen) */
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = endRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es)
          if (e.isIntersecting) el.setAttribute('data-live', '1')
          else el.removeAttribute('data-live')
      },
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="record" className="mr-scope mx-auto max-w-3xl px-6 pt-20 pb-24" data-mrf={filter}>
      <div className="rv mf-secreg" aria-hidden>
        <span className="mf-secno">04</span>
        <span className="mf-secrule" />
      </div>

      <p className="rv mono mb-3 text-center text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
        {COPY.kicker}
      </p>
      <h2
        className="rv mb-6 text-center font-semibold tracking-tight text-balance"
        style={{ fontSize: 'clamp(1.7rem, 1rem + 2.4vw, 2.8rem)', lineHeight: 1.06 }}
      >
        {COPY.title}
      </h2>
      <p className="rv mx-auto mb-12 max-w-[38rem] text-center text-[15px] leading-relaxed text-pretty text-[var(--fg-mute)]">
        {COPY.intro}
      </p>

      {/* the score · every entry a tick, 1991 → now · the crescendo in one glance */}
      <div className="rv mr-strip-wrap" aria-hidden>
        <div className="mr-strip">
          {RECORD.map((e) => (
            <span key={e.id} className="mr-tick" data-strand={e.strand} style={{ left: seat(e.date) }} />
          ))}
        </div>
        <div className="mono flex justify-between text-[11px] text-[var(--fg-dim)]">
          <span>1993</span>
          <span>now</span>
        </div>
      </div>

      {/* the strand filter · one attribute on the section, CSS does the rest */}
      <div className="rv mt-8 mb-2 flex flex-wrap items-center justify-center gap-2.5" role="group" aria-label={COPY.filterLabel}>
        {(['all', 'cage', 'drum'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className="mr-chip mono"
            data-strand={f}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {COPY.filters[f]}
          </button>
        ))}
      </div>
      <p className="rv mono mb-10 text-center text-[11px] text-[var(--fg-dim)]">{COPY.legend}</p>

      <ol className="mr-list">
        {RECORD.map((e) => (
          <li
            key={e.id}
            id={`rec-${e.id}`}
            className={`rv mr-item${e.date >= '2025' ? ' mr-tight' : ''}`}
            data-strand={e.strand}
            data-founding={e.founding || undefined}
          >
            <span className="mr-glyph" aria-hidden />
            <p className="mono mr-head">
              <a className="mr-date" href={`#rec-${e.id}`}>
                <time dateTime={e.date}>{e.date}</time>
              </a>
              {e.now ? <span className="mr-now">· now</span> : null}
            </p>
            <h3 className="mr-title">{e.title}</h3>
            <p className="mr-line">{e.line}</p>
            <p className="mono mr-srcs">
              <a href={e.src.href} target="_blank" rel="noreferrer">
                {e.src.label} ↗
              </a>
              {e.src2 ? (
                <a href={e.src2.href} target="_blank" rel="noreferrer">
                  {e.src2.label} ↗
                </a>
              ) : null}
            </p>
          </li>
        ))}
      </ol>

      {/* the terminus · the drum core, still beating */}
      <div ref={endRef} className="rv mr-terminus">
        <span className="mr-pulse" aria-hidden />
        <p className="mono text-[12px] text-[var(--fg-dim)]">
          {COPY.continues} · {COPY.updated} <time dateTime={RECORD_UPDATED}>{RECORD_UPDATED}</time>
        </p>
      </div>

      <p className="rv mono mt-10 text-center text-[11px] text-[var(--fg-dim)]">{COPY.law}</p>
    </section>
  )
}
