/* ─── slot-layout · the drum's angular truth (pure math, no three) ────────────
   The tools HUD is a closed drum: exactly one slot per builtin, six divider
   blades between the family arcs, no empty chambers — the geometry IS the
   editorial claim (a closed namespace has a closed drum). This module owns
   every angle so the scene stays a dumb renderer and the invariants are
   unit-testable without GL:

     · slots follow the REGISTER order (family buckets in TOOL_CATEGORIES
       order, alphabetical inside — the same order the /tools page reads)
     · 27 slots + 6 dividers = 33 angular positions, one step apart
     · a family arc is the contiguous span of its slots
     · aim math wraps SHORTEST-WAY (an aim is a delta in (-π, π], never an
       accumulated absolute — the additive-target wobble law) */

export interface DrumSlot {
  bare: string
  category: string
  /** 0-based slot index in register order (0..26) */
  index: number
  /** angular position on the drum, radians, in [0, 2π) */
  angle: number
}

export interface DrumDivider {
  /** the family the blade closes (the arc BEFORE the blade) */
  afterCategory: string
  angle: number
}

export interface DrumArc {
  category: string
  /** first/last SLOT angles of the arc (inclusive) */
  startAngle: number
  endAngle: number
  /** the label anchor — the middle of the arc's slot span */
  midAngle: number
  count: number
}

export interface DrumLayout {
  slots: DrumSlot[]
  dividers: DrumDivider[]
  arcs: DrumArc[]
  /** the angular distance between adjacent positions (2π / positions) */
  step: number
  /** total angular positions (slots + dividers) */
  positions: number
}

/* the canonical wrap: any angle → (-π, π] (shortest-way delta space) */
export function wrapDelta(a: number): number {
  const TAU = Math.PI * 2
  let d = a % TAU
  if (d <= -Math.PI) d += TAU
  if (d > Math.PI) d -= TAU
  return d
}

/* the aim: the SHORTEST rotation taking `current` onto `target` */
export function aimDelta(current: number, target: number): number {
  return wrapDelta(target - current)
}

export function layoutDrum(
  tools: readonly { bare: string; category: string }[],
  categories: readonly string[],
): DrumLayout {
  /* register order: category buckets first, given order inside preserved
     (TOOLS ships alphabetical by bare — the register's own reading) */
  const buckets = categories
    .map((category) => ({
      category,
      entries: tools.filter((t) => t.category === category),
    }))
    .filter((b) => b.entries.length > 0)

  const slotCount = buckets.reduce((n, b) => n + b.entries.length, 0)
  const positions = slotCount + buckets.length
  const step = (Math.PI * 2) / positions

  const slots: DrumSlot[] = []
  const dividers: DrumDivider[] = []
  const arcs: DrumArc[] = []
  let pos = 0
  let index = 0
  for (const bucket of buckets) {
    const start = pos * step
    for (const t of bucket.entries) {
      slots.push({ bare: t.bare, category: bucket.category, index, angle: pos * step })
      index += 1
      pos += 1
    }
    const end = (pos - 1) * step
    arcs.push({
      category: bucket.category,
      startAngle: start,
      endAngle: end,
      midAngle: (start + end) / 2,
      count: bucket.entries.length,
    })
    /* the blade that closes the family */
    dividers.push({ afterCategory: bucket.category, angle: pos * step })
    pos += 1
  }

  return { slots, dividers, arcs, step, positions }
}
