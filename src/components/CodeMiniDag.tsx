import { useMemo } from 'react'
import { MiniDag } from './MiniDag'
import { planForCode } from '../lib/code-plan'

/* ─── CodeMiniDag · the lazy half of the panel minimap ────────────────────────
   BOTH the drawing and the DERIVATION live here, behind CodeFile's lazy
   boundary. The first cut imported lib/code-plan eagerly (CodeFile needed the
   plan to decide whether to render) and put a kilobyte on every page that
   shows a line of yaml — the budget went 388.6 → 389.6 against a 389 ceiling
   in one commit.

   CodeFile now decides with a single regex (hasPlanShape) and everything
   real — the parse, the layout, the svg — arrives with this chunk. */

export default function CodeMiniDag({ yaml }: { yaml: string }) {
  const plan = useMemo(() => planForCode(yaml), [yaml])
  if (!plan) return null
  return (
    <MiniDag
      plan={plan}
      orientation="rail"
      fileId={`${plan.workflow || 'frag'}:${plan.tasks.length}`}
      className="cf-minimap"
    />
  )
}
