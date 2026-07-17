import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useFocusReturn } from '../lib/focus'
import { loadAtlas, type AtlasModule } from '../lib/atlas-access'
import { readoutFor, type Readout } from './inspector-readout'
import './inspector.css'

/* ─── Inspector · round-1 step 1 (desktop non-modal panel) ───────────────────
   A NON-blocking detail pane for any atlas node: the page stays alive
   (no trap, no scrim), Escape closes only when focus is inside, the
   explicit open sends focus to the panel title, closing returns it
   (useFocusReturn). The graph loads through the atlas-access door at
   first open — nothing here reaches the entry. */

export default function Inspector({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const [graph, setGraph] = useState<AtlasModule | null>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  useFocusReturn(true)

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

  const readout: Readout | null = graph ? readoutFor(nodeId, graph) : null

  return (
    <aside
      ref={asideRef}
      className="insp"
      aria-label="Inspector"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && asideRef.current?.contains(document.activeElement)) {
          e.preventDefault()
          onClose()
        }
      }}
    >
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
