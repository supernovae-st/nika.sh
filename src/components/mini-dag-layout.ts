/* ─── mini-dag · pure layout (no React, no DOM) ───────────────────────────────
   The hero's compact plan diagram derives from the SAME plan model as every
   other beat (derive.ts — one derivation, pinned by test), so every library
   file gets its drawing for free; nothing is hand-authored per file.

   Deterministic constants only — no measuring, SSR-identical output. Two
   orientations of one layout: the ≥1440 side rail reads waves top→bottom
   (time falls), the 1024-1439 band under the editor reads waves left→right
   (the /learn static plate's direction). Same node vocabulary as the /learn
   mini-DAG and the morph's flat plan: verb-hued dot · mono id · thin
   dependency curves · topological wave alignment. */

import type { FlagshipPlanModel } from '../flagships/derive'
import type { NikaVerb } from '../flagships/derive'

export type MiniDagOrientation = 'rail' | 'band'

export interface MiniDagNode {
  id: string
  verb: NikaVerb
  /** dot center, layout coords */
  x: number
  y: number
  /** the task is when-gated (carries the seal glyph) */
  gated: boolean
  /** the task fans out per item (for_each) */
  fanout: boolean
  /** wave index (the column/row it aligns with) */
  wave: number
}

export interface MiniDagEdge {
  from: string
  to: string
  /** cubic bezier path between the two dot rims */
  d: string
}

export interface MiniDagLayout {
  w: number
  h: number
  nodes: MiniDagNode[]
  edges: MiniDagEdge[]
  orientation: MiniDagOrientation
}

/* the rail (vertical · ≥1440) */
const RAIL_W = 176
const RAIL_PAD_T = 16
const RAIL_ROW = 47
const RAIL_TAIL = 30 // label room under the last wave

/* the band (horizontal · 1024-1439) */
const BAND_COL = 82
const BAND_PAD_L = 8
const BAND_PAD_T = 14
const BAND_ROW = 34
const BAND_TAIL = 20

const round = (v: number): number => Math.round(v * 10) / 10

/** lay a plan out as its mini diagram (pure · deterministic) */
export function layoutMiniDag(
  plan: FlagshipPlanModel,
  orientation: MiniDagOrientation,
): MiniDagLayout {
  const nodes: MiniDagNode[] = []

  if (orientation === 'rail') {
    for (const [w, wave] of plan.waves.entries()) {
      for (const [i, t] of wave.entries()) {
        nodes.push({
          id: t.id,
          verb: t.verb,
          x: round((RAIL_W * (i + 0.5)) / wave.length),
          y: RAIL_PAD_T + w * RAIL_ROW,
          gated: t.when !== undefined,
          fanout: t.fanout === true,
          wave: w,
        })
      }
    }
  } else {
    for (const [w, wave] of plan.waves.entries()) {
      for (const [i, t] of wave.entries()) {
        nodes.push({
          id: t.id,
          verb: t.verb,
          x: BAND_PAD_L + w * BAND_COL + BAND_COL / 2,
          y: BAND_PAD_T + i * BAND_ROW + BAND_ROW / 2,
          gated: t.when !== undefined,
          fanout: t.fanout === true,
          wave: w,
        })
      }
    }
  }

  const at = new Map(nodes.map((n) => [n.id, n]))
  const edges: MiniDagEdge[] = []
  for (const t of plan.tasks) {
    const to = at.get(t.id)
    if (!to) continue
    for (const dep of t.deps) {
      const from = at.get(dep)
      if (!from) continue
      let d: string
      if (orientation === 'rail') {
        /* leave the parent dot's south rim, arrive at the child's north rim —
           vertical handles so parallel edges fan readably */
        const y1 = from.y + 5
        const y2 = to.y - 6
        const dy = Math.max(10, (y2 - y1) * 0.45)
        d = `M ${from.x} ${y1} C ${from.x} ${round(y1 + dy)}, ${to.x} ${round(y2 - dy)}, ${to.x} ${y2}`
      } else {
        const x1 = from.x + 5
        const x2 = to.x - 6
        const dx = Math.max(10, (x2 - x1) * 0.45)
        d = `M ${x1} ${from.y} C ${round(x1 + dx)} ${from.y}, ${round(x2 - dx)} ${to.y}, ${x2} ${to.y}`
      }
      edges.push({ from: dep, to: t.id, d })
    }
  }

  const maxWave = Math.max(0, ...plan.waves.map((wv) => wv.length))
  return orientation === 'rail'
    ? {
        w: RAIL_W,
        h: RAIL_PAD_T + (plan.waveCount - 1) * RAIL_ROW + RAIL_TAIL,
        nodes,
        edges,
        orientation,
      }
    : {
        w: BAND_PAD_L * 2 + plan.waveCount * BAND_COL,
        h: BAND_PAD_T + maxWave * BAND_ROW + BAND_TAIL,
        nodes,
        edges,
        orientation,
      }
}
