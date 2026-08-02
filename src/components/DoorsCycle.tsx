import { useEffect, useMemo, useState } from 'react'
import { CopyRow } from './CopyRow'
import type { ClientDoor } from '../content/catalog.generated'
import { doorCycleLines } from './doors-cycle-lines'
import './doors-cycle.css'

/* ─── the doors, typed in a loop · « pick your door » as a living row ─────────
   The cycle derives from the ClientDoor matrix (doors-cycle-lines.ts — the
   kit-native SSOT, never hand-typed). The row IS a CopyRow: a click copies
   the WHOLE command of the door on screen, even mid-type. SSR / no-JS /
   reduced-motion: the first door prerenders fully typed and stays — the
   cycle is a mount-time enhancement gated on prefers-reduced-motion.
   ONE clock (a single interval, its machine in the effect closure) types,
   holds, swaps · cleared on unmount. */

const TICK_MS = 34
const HOLD_TICKS = 76 /* ≈2.6s of the full command before the next door */

export function DoorsCycle({ doors }: { doors: ClientDoor[] }) {
  const lines = useMemo(() => doorCycleLines(doors), [doors])
  /* len -1 = the full command (the prerendered resting state) */
  const [view, setView] = useState({ door: 0, len: -1 })
  useEffect(() => {
    if (lines.length < 2) return
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return
    let door = 0
    let len = lines[0].cmd.length
    let hold = 0
    const id = window.setInterval(() => {
      const full = lines[door].cmd.length
      if (len < full) {
        len += 1
      } else if (hold < HOLD_TICKS) {
        hold += 1
        return
      } else {
        door = (door + 1) % lines.length
        len = 0
        hold = 0
      }
      setView({ door, len })
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [lines])
  if (lines.length === 0) return null
  const cur = lines[view.door] ?? lines[0]
  const typed = view.len < 0 ? cur.cmd : cur.cmd.slice(0, view.len)
  return (
    <div className="dc">
      <p className="dc-head" aria-hidden>
        pick your door · <span className="dc-name">{cur.name}</span>
      </p>
      <p className="sr-only">
        One Add per client. The command row cycles through the proven doors — every door, proven
        or not, is listed whole in the matrix below.
      </p>
      <CopyRow
        track="install-copy"
        cmd={cur.cmd}
        label={`${cur.name} install`}
        display={
          <span aria-hidden>
            {typed}
            <span className="dc-caret" />
          </span>
        }
      />
    </div>
  )
}
