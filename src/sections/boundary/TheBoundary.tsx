import { useEffect, useRef } from 'react'
import { CodeFile } from '../../components/CodeFile'
import { SectionHead } from '../../components/SectionHead'
import { useRevealOnce } from '../use-reveal-once'
import { useAurora } from '../../fx/aurora-context'
import type { FlagshipEntry } from '../../flagships'
import './boundary.css'

/* ─── THE BOUNDARY · beat 4 · permits as the consumer feature ─────────────────
   The SELECTED file's permits: block — the same body the hero shows, sliced
   at its REAL line numbers (CodeFile firstLine · an excerpt, never a second
   version) — read side-by-side in consumer words, then the denial beat: what
   the runtime does to a step that reaches outside the list. One static card,
   ONE frame flash when it enters view (aurora flashDanger) — no theater.

   The denial row is the real catalog row (public/errors/catalog.json ·
   NIKA-SEC-004); the example is labeled as an example — the recorded runs on
   this page stayed inside their permits (exit 0). */

/* the permit families, read as a consumer sentence (kind → gloss) */
const PERMIT_GLOSS: Record<string, string> = {
  fs: 'which files it may read and write',
  net: 'which hosts it may reach',
  exec: 'which programs it may launch',
  tools: 'which tools it may call',
}

export default function TheBoundary({ flagship }: { flagship: FlagshipEntry }) {
  const rootRef = useRevealOnce<HTMLElement>()
  const denyRef = useRef<HTMLDivElement>(null)
  const flashedRef = useRef(false)
  const aurora = useAurora()

  const { plan } = flagship
  const [lo, hi] = plan.permitsRange
  const excerpt = flagship.yaml
    .split('\n')
    .slice(lo - 1, hi)
    .join('\n')

  /* ONE danger flash when the denial card first enters view (motion only) */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = denyRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !flashedRef.current) {
            flashedRef.current = true
            aurora.flashDanger()
            io.disconnect()
          }
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [aurora])

  return (
    <section
      ref={rootRef}
      id="the-boundary"
      aria-labelledby="the-boundary-title"
      className="theme-dark v4sec scroll-mt-24"
    >
      <div className="v4sec-wrap">
        <p className="v4beyebrow" data-rise>
          [ THE BOUNDARY ]
        </p>
        <SectionHead
          fig="03"
          id="the-boundary-title"
          title="What it's allowed to touch."
        >
          The <code className="mono">permits:</code> block is part of the file you
          review. It is the <b>whole</b> list. Everything not on it is denied by
          default, before it runs.
        </SectionHead>

        <div className="v5bnd-grid" data-rise>
          {/* LEFT · the real permits block, at its real line numbers */}
          <div className="v5bnd-file">
            <CodeFile
              yaml={excerpt}
              filename={`${flagship.filename} · lines ${lo}–${hi}`}
              firstLine={lo}
              className="v5bnd-code" wrap />
            <p className="v5bnd-filecap">
              the same file as above · the permits block, verbatim
            </p>
          </div>

          {/* RIGHT · the consumer reading + the denial beat */}
          <div className="v5bnd-read">
            <ul className="v5bnd-rows">
              {plan.permits.map((p) => (
                <li className="v5bnd-row" key={p.kind}>
                  <code className="v5bnd-row-key">{p.kind}:</code>
                  <span className="v5bnd-row-gloss">
                    {PERMIT_GLOSS[p.kind] ?? 'what it may use'}
                  </span>
                </li>
              ))}
            </ul>

            <div className="v5bnd-deny" ref={denyRef} role="note" aria-label="A denied action">
              <p className="v5bnd-deny-cap">if a step reaches outside the list, say</p>
              <pre className="v5bnd-deny-row">
                <span className="v5bnd-deny-glyph" aria-hidden>
                  ✗
                </span>
                {'write ~/.ssh/config   NIKA-SEC-004'}
              </pre>
              <p className="v5bnd-deny-note">
                effect outside the declared <code className="mono">permits:</code>{' '}
                capability boundary. Blocked <b>before</b> it runs, never logged
                after the fact. (An example: the recorded run above stayed in
                bounds, exit&nbsp;0.)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
