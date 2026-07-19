import { useEffect, useState } from 'react'
import { loadAtlas } from '../lib/atlas-access'
import { readoutFor, cardSlice } from './inspector-readout'
import './hover-card.css'

/* ─── HoverCard · the member mini-card (round-3) ─────────────────────────────
   The Inspector readout in MINIATURE: the same per-set renderer, truncated
   (title · glyph · status · the opener's first sentence · the set) — one
   renderer, never a fork (the vitest gate holds the card to readoutFor's
   own output). A visual COURTESY: aria-hidden, the link stays the only
   semantic object; the full readout lives in the Inspector. Positioned by
   native CSS Anchor Positioning — the layer only ever mounts after the
   support check in the RootLayout listener, so no fallback lib exists. */

export default function HoverCard({ nodeId }: { nodeId: string }) {
  const [card, setCard] = useState<ReturnType<typeof cardSlice> | null>(null)

  useEffect(() => {
    let live = true
    void loadAtlas().then((graph) => {
      if (!live) return
      const readout = readoutFor(nodeId, graph)
      setCard(readout ? cardSlice(readout) : null)
    })
    return () => {
      live = false
    }
  }, [nodeId])

  if (!card) return null
  return (
    <div className="hovercard mono" aria-hidden>
      <p className="hovercard-head">
        <span className="hovercard-glyph k-glyph" data-kind={card.kind ?? undefined}>{card.kindGlyph}</span>
        <span className="hovercard-title">{card.title}</span>
        <span className="hovercard-status st-mark" data-status={card.status}>
          {card.status}
        </span>
      </p>
      {card.firstLine && <p className="hovercard-line">{card.firstLine}</p>}
      {card.set && <p className="hovercard-set">{card.set}</p>}
    </div>
  )
}
