import { useEffect, useRef, useState } from 'react'
import { RECORD, RECORD_UPDATED, type Strand } from '../../content/manifesto-record'
import type { ManifestoCopy } from '../../content/manifesto-copy'

/* ─── §04 · THE RECORD · the proof layer ──────────────────────────────────────
   The manifesto's opposite register, by design: sections 01-04 carry the poem
   (no vendor, no number), this section carries ONLY dated primary-sourced
   facts. Two strands: ▢ the cage (control advances · grey, still) · ● the
   drum (liberation advances · the page's cyan). The crescendo IS the data.

   TWO LAYOUTS, ONE DOM (the stage wave):
   - v · the vertical list = the truth. What SSG renders, what mobile,
     reduced motion and no-JS read. Left spine, glyphs, score strip up top.
   - h · the STAGE (desktop ≥1024px + motion, set by the capability gate):
     a sticky full-viewport scene; the reader's vertical scroll slides the
     track left→right through a fixed PLAYHEAD. Drum entries ride above the
     baseline, cage entries below (two staves, read like a score). Whatever
     crosses the playhead goes live: the beat fires, the year counter turns.
     The reader literally plays the record by reading it.

   The driver is the house rAF+transform pattern (compositor-only, no
   scroll-jack: the wheel scrolls the page, the sticky stage just watches
   progress). Deep links (#rec-<id>) are remapped in h-mode so the entry
   lands on the playhead. The section FRAME is translated ×8 (record* keys);
   entries stay EN by design (technical register, like code blocks).
   Styles: mr-* (shared + vertical) and the [data-mode='h'] block in
   index.css. */

/* strip geometry · a tick's horizontal seat, 1991 → just past now (pure
   render math, no effect). Month precision is enough at this size. */
const T0 = 1991
const T1 = 2027
const seat = (date: string) => {
  const [y, m] = date.split('-')
  const t = Number(y) + (m ? (Number(m) - 0.5) / 12 : 0.5)
  return `${(((t - T0) / (T1 - T0)) * 100).toFixed(2)}%`
}

/* the playhead's horizontal seat inside the stage (fraction of stage width) */
const PLAYHEAD = 0.38

export function TheRecord({ c }: { c: ManifestoCopy }) {
  const [filter, setFilter] = useState<'all' | Strand>('all')
  const [mode, setMode] = useState<'v' | 'h'>('v')
  const labels = { all: c.recordFilterAll, cage: c.recordFilterCage, drum: c.recordFilterDrum }

  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLOListElement>(null)
  const yearRef = useRef<HTMLSpanElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  /* capability gate · the stage needs width and motion; everyone else keeps
     the vertical truth. Live media-query listeners so a window resize or an
     OS motion toggle flips the layout without a reload. */
  useEffect(() => {
    const mqW = window.matchMedia('(min-width: 1024px)')
    const mqM = window.matchMedia('(prefers-reduced-motion: reduce)')
    const set = () => setMode(mqW.matches && !mqM.matches ? 'h' : 'v')
    set()
    mqW.addEventListener('change', set)
    mqM.addEventListener('change', set)
    return () => {
      mqW.removeEventListener('change', set)
      mqM.removeEventListener('change', set)
    }
  }, [])

  /* the terminus pulse breathes only while on screen (never loops offscreen) */
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

  /* the stage driver (h only) · measures the track, gives the wrapper the
     exact scroll distance (1px of wheel = 1px of track), slides the track
     with the house rAF+translate3d pattern, and lights whatever entry sits
     under the playhead. Re-runs when the strand filter changes shape. */
  useEffect(() => {
    if (mode !== 'h') return
    const wrap = wrapRef.current
    const stage = stageRef.current
    const track = trackRef.current
    if (!wrap || !stage || !track) return

    let trackScroll = 0
    let wrapTop = 0
    let centers: { el: HTMLElement; cx: number; year: string }[] = []
    let liveEl: HTMLElement | null = null
    let ended = false
    let raf = 0

    const measure = () => {
      trackScroll = Math.max(0, track.scrollWidth - stage.clientWidth)
      wrap.style.height = `calc(100dvh + ${trackScroll}px)`
      wrapTop = wrap.getBoundingClientRect().top + window.scrollY
      centers = [...track.querySelectorAll<HTMLElement>('.mr-item')]
        .filter((el) => el.offsetParent !== null)
        .map((el) => ({
          el,
          cx: el.offsetLeft + el.offsetWidth / 2,
          year: el.querySelector('time')?.getAttribute('datetime')?.slice(0, 4) ?? '',
        }))
    }

    const apply = () => {
      raf = 0
      const p = Math.min(1, Math.max(0, (window.scrollY - wrapTop) / (trackScroll || 1)))
      const x = p * trackScroll
      track.style.transform = `translate3d(${-x}px, 0, 0)`
      const ph = x + stage.clientWidth * PLAYHEAD
      let cur: (typeof centers)[0] | undefined
      for (const it of centers) {
        if (it.cx <= ph + 30) cur = it
        else break
      }
      if (cur && cur.el !== liveEl) {
        liveEl?.removeAttribute('data-live')
        cur.el.setAttribute('data-live', '1')
        liveEl = cur.el
        if (yearRef.current) yearRef.current.textContent = cur.year
      }
      const end = p > 0.965
      if (end !== ended) {
        ended = end
        stage.toggleAttribute('data-end', end)
      }
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    const onResize = () => {
      measure()
      apply()
    }
    /* deep links land ON the playhead in this layout */
    const toHash = () => {
      const id = location.hash.slice(1)
      if (!id.startsWith('rec-')) return
      const it = centers.find((x) => x.el.id === id)
      if (!it) return
      window.scrollTo({ top: wrapTop + it.cx - stage.clientWidth * PLAYHEAD, behavior: 'instant' })
    }

    measure()
    apply()
    toHash()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('hashchange', toHash)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('hashchange', toHash)
      track.style.transform = ''
      wrap.style.height = ''
      stage.removeAttribute('data-end')
      liveEl?.removeAttribute('data-live')
    }
  }, [mode, filter])

  return (
    <section id="record" className="mr-scope mx-auto pt-20 pb-24" data-mrf={filter} data-mode={mode}>
      <div className="mx-auto max-w-3xl px-6">
        <div className="rv mf-secreg" aria-hidden>
          <span className="mf-secno">04</span>
          <span className="mf-secrule" />
        </div>

        <p className="rv mono mb-3 text-center text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
          {c.recordKicker}
        </p>
        <h2
          className="rv mb-6 text-center font-semibold tracking-tight text-balance"
          style={{ fontSize: 'clamp(1.7rem, 1rem + 2.4vw, 2.8rem)', lineHeight: 1.06 }}
        >
          {c.recordTitle}
        </h2>
        <p className="rv mx-auto mb-12 max-w-[38rem] text-center text-[15px] leading-relaxed text-pretty text-[var(--fg-mute)]">
          {c.recordIntro}
        </p>

        {/* the score strip · the whole record in one glance (vertical layout
            only — in h-mode the stage IS the score at full size) */}
        <div className="rv mr-strip-wrap" aria-hidden>
          <div className="mr-strip">
            {RECORD.map((e) => (
              <span key={e.id} className="mr-tick" data-strand={e.strand} style={{ left: seat(e.date) }} />
            ))}
          </div>
          <div className="mono flex justify-between text-[11px] text-[var(--fg-dim)]">
            <span>{RECORD[0].date.slice(0, 4)}</span>
            <span>now</span>
          </div>
        </div>

        {/* the strand filter · one attribute on the section, CSS does the rest */}
        <div className="rv mt-8 mb-2 flex flex-wrap items-center justify-center gap-2.5" role="group" aria-label={c.recordFilterLabel}>
          {(['all', 'cage', 'drum'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className="mr-chip mono"
              data-strand={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {labels[f]}
            </button>
          ))}
        </div>
        <p className="rv mono mb-10 text-center text-[11px] text-[var(--fg-dim)]">{c.recordLegend}</p>
      </div>

      {/* v: neutral wrappers around the vertical list · h: the tall scroll
          field (exact 1:1 px mapping, set by the driver) holding the sticky
          stage — playhead, year counter, the sliding track, the terminus */}
      <div ref={wrapRef} className="mr-wrap">
        <div ref={stageRef} className="mr-stage">
          <span className="mr-year mono" aria-hidden ref={yearRef} />
          <span className="mr-playhead" aria-hidden />

          <ol ref={trackRef} className="mr-list mx-auto w-full max-w-3xl px-6">
            {RECORD.map((e) => (
              <li
                key={e.id}
                id={`rec-${e.id}`}
                className={`rv mr-item${e.date >= '2025' ? ' mr-tight' : ''}`}
                data-strand={e.strand}
                data-founding={e.founding || undefined}
              >
                <span className="mr-glyph" aria-hidden />
                <span className="mr-stem" aria-hidden />
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

          {/* the terminus · the drum core, still beating · in h it waits at
              the stage's right edge and lands with the last beat */}
          <div ref={endRef} className="rv mr-terminus">
            <span className="mr-pulse" aria-hidden />
            <p className="mono text-[12px] text-[var(--fg-dim)]">
              {c.recordContinues} · {c.recordUpdated} <time dateTime={RECORD_UPDATED}>{RECORD_UPDATED}</time>
            </p>
          </div>
        </div>
      </div>

      <p className="rv mono mt-10 text-center text-[11px] text-[var(--fg-dim)]">{c.recordLaw}</p>
    </section>
  )
}
