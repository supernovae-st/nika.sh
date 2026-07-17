import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useFocusReturn, useFocusTrap } from '../lib/focus'
import { loadAtlas, type AtlasModule } from '../lib/atlas-access'
import { readoutFor, nodeIdForHref, type Readout } from './inspector-readout'
import './inspector.css'

/* ─── Inspector · round-1 (desktop panel + mobile sheet, two detents) ────────
   Desktop ≥768: NON-modal side panel — the page stays alive (no trap, no
   scrim), Escape closes only when focus is inside, explicit open focuses
   the title, closing returns focus. Mobile <768: bottom sheet with two
   detents — peek (~42svh · non-modal, the page scrolls behind) and full
   (~86svh · MODAL: trap + scroll lock, the v4sheet machinery). The drag
   handle is a REAL button (M3): labeled, Space/Enter cycles the detents,
   48dp target — and the Close button is always there (drag is never the
   only exit). Heights ride svh (dvh resizes live during the gesture —
   documented jank). */

type Detent = 'peek' | 'full'

const MOBILE_QUERY = '(max-width: 767px)'

export default function Inspector({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const [graph, setGraph] = useState<AtlasModule | null>(null)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)
  const [detent, setDetent] = useState<Detent>(() =>
    new URLSearchParams(window.location.search).get('insp') === 'full' ? 'full' : 'peek',
  )
  const titleRef = useRef<HTMLHeadingElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  const dragFrom = useRef<number | null>(null)
  useFocusReturn(true)
  /* full-detent sheet is MODAL — the trap arms exactly there */
  useFocusTrap(asideRef, isMobile && detent === 'full')

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const on = () => setIsMobile(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    let live = true
    void loadAtlas().then((m) => {
      if (live) setGraph(m)
    })
    return () => {
      live = false
    }
  }, [])

  /* explicit open → focus the title (the design's focus law) */
  useEffect(() => {
    if (graph) titleRef.current?.focus()
  }, [graph, nodeId])

  useEffect(() => {
    document.body.dataset.insp = 'open'
    return () => {
      delete document.body.dataset.insp
    }
  }, [])

  /* scroll lock rides the MODAL state only (full-detent sheet) */
  useEffect(() => {
    if (!(isMobile && detent === 'full')) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobile, detent])

  const cycleDetent = () => setDetent((d) => (d === 'peek' ? 'full' : 'peek'))

  const resolvedId = graph && nodeId.startsWith('/') ? nodeIdForHref(nodeId, graph) : nodeId
  const readout: Readout | null = graph && resolvedId ? readoutFor(resolvedId, graph) : null

  return (
    <aside
      ref={asideRef}
      className="insp"
      data-detent={isMobile ? detent : undefined}
      aria-label="Inspector"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && asideRef.current?.contains(document.activeElement)) {
          e.preventDefault()
          onClose()
        }
      }}
    >
      <button
        type="button"
        className="insp-handle"
        aria-label={detent === 'peek' ? 'Expand inspector' : 'Collapse inspector'}
        onClick={cycleDetent}
        onPointerDown={(e) => {
          dragFrom.current = e.clientY
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerUp={(e) => {
          const from = dragFrom.current
          dragFrom.current = null
          if (from === null) return
          const delta = e.clientY - from
          /* a real gesture, not a tap: up grows, down shrinks — and down
             from peek dismisses (the sheet school) */
          if (delta < -60) setDetent('full')
          else if (delta > 60) {
            if (detent === 'full') setDetent('peek')
            else onClose()
          }
        }}
      >
        <span className="insp-handle-bar" aria-hidden />
      </button>
      <div className="insp-head">
        <span className="insp-kind mono" aria-hidden>
          {readout?.kindGlyph ?? '·'}
        </span>
        <h2 ref={titleRef} tabIndex={-1} className="insp-title">
          {readout?.title ?? '…'}
        </h2>
        <button type="button" className="insp-close mono" onClick={onClose}>
          esc
        </button>
      </div>
      {readout && (
        <div className="insp-body">
          <p className="insp-status mono" data-status={readout.status}>
            {readout.status}
          </p>
          {readout.opener && <p className="insp-opener">{readout.opener}</p>}
          <dl className="insp-rows">
            {readout.rows.map((row) => (
              <div key={row.label} className="insp-row">
                <dt className="mono">{row.label}</dt>
                <dd>
                  {row.value}
                  {row.links && (
                    <ul className="insp-links">
                      {row.links.map((l) => (
                        <li key={l.href + l.label}>
                          <Link to={l.href} viewTransition onClick={onClose}>
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {readout.door && (
            <Link className="insp-door" to={readout.door.href} viewTransition onClick={onClose}>
              {readout.door.label} <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      )}
    </aside>
  )
}
