import {
  BUILTIN_GROUPS,
  PERMIT_CATS,
  PLAN_TASKS,
  SPEC_SECTIONS,
  type StratumKey,
} from '../../scene/spec-machine-data'
import { CANON } from '../../canon.generated'

/* ─── SpecSchematic · the machine's floor plan (the designed fallback truth) ──
   THE SPEC MACHINE as a pure-SVG concentric drawing — the CSS-drum-rings
   equivalent for /spec: the whole language as ONE shape, centre → out exactly
   like the 3D strata (core tetrad → plan ring → gate collar → tool belt +
   fetch manifold → provider halo → containment shell, inside the S.0 frame).
   Serves mobile + no-WebGL + reduced-motion, and is the sticky rail's truth
   until the W1 canvas takes the stage ([data-machine] retires it, the
   drum-rings pattern). Ink: the tholos blue-and-black — unlit strata whisper
   in shadow wire blue, ignited strata wash to the lit accent (lit-state
   synced from useSpecReading), the current stratum reads brightest.
   Every count derives from spec-machine-data (CANON projections) — the tick
   loops below can never disagree with the page. Pure render: deterministic
   trig, no Math.random, no hooks. Decorative (aria-hidden): the TOC + the
   content column stay the accessible truth. */

const C = 160 // viewBox centre
const pt = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180
  return [C + Math.cos(a) * r, C + Math.sin(a) * r]
}
const fmt = (n: number) => Math.round(n * 100) / 100

/* ── the tool belt · 27 ticks in 5 family arcs (gaps = the family seams) ────── */
const BELT_R0 = 82
const BELT_R1 = 93
const FAMILY_GAP = 9 // degrees between family arcs
const beltSlot = (360 - BUILTIN_GROUPS.length * FAMILY_GAP) / CANON.builtins
interface BeltTick {
  name: string
  family: string
  deg: number
}
const BELT_TICKS: BeltTick[] = (() => {
  const ticks: BeltTick[] = []
  let deg = -90 + FAMILY_GAP / 2
  for (const f of BUILTIN_GROUPS) {
    for (const n of f.names) {
      ticks.push({ name: n, family: f.label, deg: deg + beltSlot / 2 })
      deg += beltSlot
    }
    deg += FAMILY_GAP
  }
  return ticks
})()
const FETCH_DEG = BELT_TICKS.find((t) => t.name === 'fetch')?.deg ?? 90

/* ── the fetch manifold · 9 ports fanned off the fetch tick ─────────────────── */
const MANIFOLD_SPREAD = 52
const MANIFOLD_R = 110
const manifoldDeg = (i: number) =>
  FETCH_DEG - MANIFOLD_SPREAD / 2 + (MANIFOLD_SPREAD * i) / Math.max(1, CANON.extractModes - 1)

/* ── the provider halo · 5 locals docked · 10 cloud + 1 mock distant ────────── */
const LOCAL_R = 120
const CLOUD_R = 136
/* phase the locals so none lands inside the manifold fan */
const localDeg = (i: number) => FETCH_DEG + 180 / CANON.providersLocal + (360 * i) / CANON.providersLocal
const outerCount = CANON.providersCloud + CANON.providersTest
const outerDeg = (i: number) => FETCH_DEG + 180 / outerCount + (360 * i) / outerCount

/* ── the containment shell · one dashed circle, 14 cells by construction ────── */
const SHELL_R = 150
const SHELL_CIRC = 2 * Math.PI * SHELL_R
const SHELL_CELL = SHELL_CIRC / CANON.errorNamespaces

/* ── the plan ring · the standup-digest slabs + their depends_on wires ──────── */
const PLAN_R = 46
const SLAB_W = 11
const SLAB_H = 6.5
const planDeg = (i: number) => -90 + (360 * i) / Math.max(1, PLAN_TASKS.length)
const PLAN_POS = PLAN_TASKS.map((t, i) => ({ t, xy: pt(planDeg(i), PLAN_R) }))
const PLAN_WIRES = PLAN_TASKS.flatMap((t, i) =>
  t.deps.map((d) => {
    const from = PLAN_POS[PLAN_TASKS.findIndex((x) => x.id === d)].xy
    const to = PLAN_POS[i].xy
    /* trim each end so the wire meets the slab edge, not its centre */
    const dx = to[0] - from[0]
    const dy = to[1] - from[1]
    const len = Math.hypot(dx, dy) || 1
    const trim = 8
    return {
      id: `${d}→${t.id}`,
      x1: from[0] + (dx / len) * trim,
      y1: from[1] + (dy / len) * trim,
      x2: to[0] - (dx / len) * trim,
      y2: to[1] - (dy / len) * trim,
    }
  }),
)

/* ── the core tetrad · 4 verb blocks + their 6 tetrahedron edges ────────────── */
const TETRAD_R = 24
const tetradDeg = (i: number) => -90 + (360 * i) / CANON.verbs
const TETRAD_POS = CANON.verbNames.map((v, i) => ({ v, xy: pt(tetradDeg(i), TETRAD_R) }))
const TETRAD_EDGES = TETRAD_POS.flatMap((a, i) =>
  TETRAD_POS.slice(i + 1).map((b) => ({ id: `${a.v}·${b.v}`, a: a.xy, b: b.xy })),
)

/* ── the gate collar · 4 diamonds at the cardinals on the boundary ring ─────── */
const COLLAR_R = 66
const gateDeg = (i: number) => -90 + (360 * i) / PERMIT_CATS.length

const ORDER = SPEC_SECTIONS.map((s) => s.key)

export function SpecSchematic({
  lit,
  current,
  className,
}: {
  lit: ReadonlySet<StratumKey>
  current: StratumKey | null
  className?: string
}) {
  const g = (key: StratumKey) => ({
    'data-stratum': key,
    'data-lit': lit.has(key) ? '' : undefined,
    'data-focus': current === key ? '' : undefined,
    className: 'sms-stratum',
  })
  return (
    <svg
      viewBox="0 0 320 320"
      className={`spec-schematic${className ? ` ${className}` : ''}`}
      aria-hidden
      data-order={ORDER.join(' ')}
    >
      {/* S.0 · the stage frame · hairline box + corner crop-marks */}
      <g {...g('frame')}>
        <rect className="sms-frame" x="8.5" y="8.5" width="303" height="303" />
        {[
          [8.5, 8.5, 1, 1],
          [311.5, 8.5, -1, 1],
          [8.5, 311.5, 1, -1],
          [311.5, 311.5, -1, -1],
        ].map(([x, y, sx, sy]) => (
          <path
            key={`${x}·${y}`}
            className="sms-crop"
            d={`M ${fmt(x + 9 * sx)} ${y} L ${x} ${y} L ${x} ${fmt(y + 9 * sy)}`}
          />
        ))}
      </g>

      {/* S.7 · the containment shell · 14 cells (one dashed circle) */}
      <g {...g('errors')}>
        <circle
          className="sms-shell"
          cx={C}
          cy={C}
          r={SHELL_R}
          strokeDasharray={`${fmt(SHELL_CELL * 0.72)} ${fmt(SHELL_CELL * 0.28)}`}
          strokeDashoffset={fmt(SHELL_CELL * 0.36)}
        />
      </g>

      {/* S.5 · the provider halo · locals docked solid, cloud dashed, mock dim */}
      <g {...g('providers')}>
        {CANON.providerIdsLocal.map((p, i) => {
          const [x, y] = pt(localDeg(i), LOCAL_R)
          return (
            <rect
              key={p}
              className="sms-sat sms-sat--local"
              x={fmt(x - 3)}
              y={fmt(y - 3)}
              width="6"
              height="6"
            />
          )
        })}
        {CANON.providerIdsCloud.map((p, i) => {
          const [x, y] = pt(outerDeg(i), CLOUD_R)
          return (
            <rect
              key={p}
              className="sms-sat sms-sat--cloud"
              x={fmt(x - 2.5)}
              y={fmt(y - 2.5)}
              width="5"
              height="5"
            />
          )
        })}
        {CANON.providerIdsTest.map((p, i) => {
          const [x, y] = pt(outerDeg(CANON.providersCloud + i), CLOUD_R)
          return (
            <rect
              key={p}
              className="sms-sat sms-sat--mock"
              x={fmt(x - 2)}
              y={fmt(y - 2)}
              width="4"
              height="4"
            />
          )
        })}
      </g>

      {/* S.6 · the fetch manifold · 9 ports fanned off the fetch tick */}
      <g {...g('extract')}>
        {Array.from({ length: CANON.extractModes }, (_, i) => {
          const base = pt(FETCH_DEG, BELT_R1 + 2)
          const tip = pt(manifoldDeg(i), MANIFOLD_R)
          return (
            <g key={i}>
              <line
                className="sms-port"
                x1={fmt(base[0])}
                y1={fmt(base[1])}
                x2={fmt(tip[0])}
                y2={fmt(tip[1])}
              />
              <circle className="sms-port-tip" cx={fmt(tip[0])} cy={fmt(tip[1])} r="1.4" />
            </g>
          )
        })}
      </g>

      {/* S.4 · the tool belt · 27 ticks in 5 family arcs (fetch runs longer) */}
      <g {...g('stdlib')}>
        {BELT_TICKS.map((t) => {
          const long = t.name === 'fetch'
          const a = pt(t.deg, long ? BELT_R0 - 2 : BELT_R0)
          const b = pt(t.deg, long ? BELT_R1 + 2 : BELT_R1)
          return (
            <line
              key={t.name}
              className={`sms-tick${long ? ' sms-tick--fetch' : ''}`}
              x1={fmt(a[0])}
              y1={fmt(a[1])}
              x2={fmt(b[0])}
              y2={fmt(b[1])}
            />
          )
        })}
      </g>

      {/* S.3 · the gate collar · the boundary ring + 4 gate diamonds */}
      <g {...g('permits')}>
        <circle className="sms-collar" cx={C} cy={C} r={COLLAR_R} />
        {PERMIT_CATS.map((c, i) => {
          const [x, y] = pt(gateDeg(i), COLLAR_R)
          return (
            <rect
              key={c.key}
              className="sms-gate"
              x={fmt(x - 4.5)}
              y={fmt(y - 4.5)}
              width="9"
              height="9"
              transform={`rotate(45 ${fmt(x)} ${fmt(y)})`}
            />
          )
        })}
      </g>

      {/* S.2 · the plan ring · standup-digest slabs + depends_on wires */}
      <g {...g('plan')}>
        {PLAN_WIRES.map((w) => (
          <line
            key={w.id}
            className="sms-wire"
            x1={fmt(w.x1)}
            y1={fmt(w.y1)}
            x2={fmt(w.x2)}
            y2={fmt(w.y2)}
          />
        ))}
        {PLAN_POS.map(({ t, xy }) => (
          <rect
            key={t.id}
            className="sms-slab"
            x={fmt(xy[0] - SLAB_W / 2)}
            y={fmt(xy[1] - SLAB_H / 2)}
            width={SLAB_W}
            height={SLAB_H}
          />
        ))}
      </g>

      {/* S.1 · the core tetrad · 4 verb blocks + the 6 tetrahedron edges */}
      <g {...g('verbs')}>
        {TETRAD_EDGES.map((e) => (
          <line
            key={e.id}
            className="sms-edge"
            x1={fmt(e.a[0])}
            y1={fmt(e.a[1])}
            x2={fmt(e.b[0])}
            y2={fmt(e.b[1])}
          />
        ))}
        {TETRAD_POS.map(({ v, xy }) => (
          <rect
            key={v}
            className="sms-core"
            x={fmt(xy[0] - 3.5)}
            y={fmt(xy[1] - 3.5)}
            width="7"
            height="7"
          />
        ))}
      </g>
    </svg>
  )
}
