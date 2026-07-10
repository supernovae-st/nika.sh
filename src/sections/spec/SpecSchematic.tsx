import {
  BUILTIN_GROUPS,
  ENVELOPE_KEYS,
  PERMIT_CATS,
  PLAN_TASKS,
  SPEC_SECTIONS,
  type StratumKey,
} from '../../scene/spec-machine-data'
import { CANON } from '../../canon.generated'

/* ─── SpecSchematic · THE SHIP in profile (the designed fallback truth) ───────
   The v2 elevation drawing — the same vessel the 3D stage sails, seen
   side-on, bow LEFT → stern RIGHT (the reading order made horizontal):
   the keel (10 envelope-key segments) · the bridge cluster (plan slabs by
   wave) · the core diamond (verb tetrad) · THE RING edge-on (a tall ellipse,
   4 gate stations + 2 visible spokes) · the hold ring (27 family ticks on
   an ellipse) · the array fan (9 ports off the fetch flank) · the engine
   block (16 nozzles: 5 docked · 10 outboard · 1 dim) · the shield skirt
   (14 flared plates). Serves mobile + no-WebGL + reduced-motion, is the
   stage's truth until the canvas mounts ([data-machine] retires it), and
   doubles as the SIDE VIEW thumbnail on the instrument plate.
   Ink: tholos blue-and-black — unlit strata whisper in shadow wire blue,
   ignited strata wash to the lit accent (lit-state synced), the current
   stratum reads brightest. Every count derives from spec-machine-data.
   Pure render: deterministic trig, no Math.random, no hooks. Decorative
   (aria-hidden): the TOC + the content column stay the accessible truth. */

const W = 460
const H = 230
const CY = H / 2
/* bow x → stern x (screen) */
const X0 = 30
const X1 = 434
const sx = (shipX: number) => X0 + ((1.42 - shipX) / (1.42 - -1.68)) * (X1 - X0)
const fmt = (n: number) => Math.round(n * 100) / 100

/* the keel · 10 envelope-key segments, required lead the bow (heavier) */
const KEEL_X0 = sx(1.3)
const KEEL_X1 = sx(-1.42)
const KEEL_SEG = (KEEL_X1 - KEEL_X0) / ENVELOPE_KEYS.length

/* the bridge · plan slabs clustered by wave off the bow */
const BRIDGE = PLAN_TASKS.map((t, i) => {
  const inWave = PLAN_TASKS.filter((x) => x.wave === t.wave)
  const j = inWave.findIndex((x) => x.id === t.id)
  const spread = inWave.length > 1 ? (j - (inWave.length - 1) / 2) * 26 : 0
  return { id: t.id, x: sx(1.22 - t.wave * 0.15), y: CY + spread, i }
})

/* THE RING edge-on · a tall ellipse at midship */
const RING_X = sx(0)
const RING_RY = 86
const RING_RX = 10

/* the hold · 27 ticks around a squashed ellipse (the ring seen shallow) */
const HOLD_X = sx(-0.52)
const HOLD_RY = 44
const HOLD_RX = 16
interface HoldTick {
  name: string
  deg: number
}
const HOLD_GAP = 14
const holdSlot = (360 - BUILTIN_GROUPS.length * HOLD_GAP) / CANON.builtins
const HOLD_TICKS: HoldTick[] = (() => {
  const ticks: HoldTick[] = []
  let deg = -90 + HOLD_GAP / 2
  for (const f of BUILTIN_GROUPS) {
    for (const n of f.names) {
      ticks.push({ name: n, deg: deg + holdSlot / 2 })
      deg += holdSlot
    }
    deg += HOLD_GAP
  }
  return ticks
})()
const holdPt = (deg: number, grow = 0): [number, number] => {
  const a = (deg * Math.PI) / 180
  return [HOLD_X + Math.cos(a) * (HOLD_RX + grow), CY + Math.sin(a) * (HOLD_RY + grow)]
}
const FETCH_DEG = HOLD_TICKS.find((t) => t.name === 'fetch')?.deg ?? 90

/* the array · 9 ports fanned off the fetch flank (below the hold) */
const ARRAY_R0 = 8
const ARRAY_R1 = 52
const arrayDeg = (i: number) =>
  FETCH_DEG - 28 + (56 * i) / Math.max(1, CANON.extractModes - 1)

/* the engines · 5 docked (inner column) · 10 outboard (two banks) · 1 dim */
const ENG_X = sx(-1.18)
const localY = (i: number) => CY + (i - (CANON.providersLocal - 1) / 2) * 15
const outerY = (i: number) => {
  const half = Math.ceil(CANON.providersCloud / 2)
  const top = i < half
  const j = top ? i : i - half
  const n = top ? half : CANON.providersCloud - half
  return CY + (top ? -1 : 1) * (46 + (j - (n - 1) / 2) * 0) + (top ? -1 : 1) * ((j % n) - (n - 1) / 2) * 16
}

/* the shield skirt · 14 plates flared aft */
const SKIRT_X = sx(-1.5)
const skirtY = (i: number) => CY + (i - (CANON.errorNamespaces - 1) / 2) * (176 / CANON.errorNamespaces)

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
      viewBox={`0 0 ${W} ${H}`}
      className={`spec-schematic${className ? ` ${className}` : ''}`}
      aria-hidden
      data-order={ORDER.join(' ')}
    >
      {/* S.0 · THE KEEL · the envelope's 10 keys ARE the spine (bow left) */}
      <g {...g('frame')}>
        {ENVELOPE_KEYS.map((k, i) => (
          <rect
            key={k.key}
            className={`sms-keel${k.req ? ' sms-keel--req' : ''}`}
            x={fmt(KEEL_X0 + KEEL_SEG * i + 1.5)}
            y={k.req ? CY - 3 : CY - 2}
            width={fmt(KEEL_SEG - 3)}
            height={k.req ? 6 : 4}
          />
        ))}
      </g>

      {/* S.7 · THE SHIELD · 14 namespace plates flared aft (stern right) */}
      <g {...g('errors')}>
        {CANON.errorNamespaceNames.map((ns, i) => {
          const y = skirtY(i)
          const lean = ((y - CY) / (H / 2)) * 10
          return (
            <line
              key={ns}
              className="sms-plate"
              x1={fmt(SKIRT_X)}
              y1={fmt(y)}
              x2={fmt(SKIRT_X + 16 + Math.abs(lean) * 0.4)}
              y2={fmt(y + lean)}
            />
          )
        })}
      </g>

      {/* S.5 · THE ENGINES · 5 docked · 10 outboard · 1 mock dim */}
      <g {...g('providers')}>
        {CANON.providerIdsLocal.map((p, i) => (
          <rect
            key={p}
            className="sms-nozzle sms-nozzle--local"
            x={fmt(ENG_X - 5)}
            y={fmt(localY(i) - 5)}
            width="12"
            height="10"
          />
        ))}
        {CANON.providerIdsCloud.map((p, i) => (
          <rect
            key={p}
            className="sms-nozzle sms-nozzle--cloud"
            x={fmt(ENG_X - 2 + (i % 2) * 6)}
            y={fmt(outerY(i) - 3.5)}
            width="9"
            height="7"
          />
        ))}
        {CANON.providerIdsTest.map((p) => (
          <rect
            key={p}
            className="sms-nozzle sms-nozzle--mock"
            x={fmt(ENG_X + 2)}
            y={fmt(CY - 78)}
            width="7"
            height="6"
          />
        ))}
      </g>

      {/* S.6 · THE ARRAY · 9 ports fanned off the fetch flank */}
      <g {...g('extract')}>
        {CANON.extractModeNames.map((m, i) => {
          const a = (arrayDeg(i) * Math.PI) / 180
          const bx = HOLD_X + Math.cos((FETCH_DEG * Math.PI) / 180) * (HOLD_RX + ARRAY_R0)
          const by = CY + Math.sin((FETCH_DEG * Math.PI) / 180) * (HOLD_RY + ARRAY_R0)
          const tx = HOLD_X + Math.cos(a) * (HOLD_RX + ARRAY_R1)
          const ty = CY + Math.sin(a) * (HOLD_RY + ARRAY_R1 * 0.9)
          return (
            <g key={m}>
              <line className="sms-port" x1={fmt(bx)} y1={fmt(by)} x2={fmt(tx)} y2={fmt(ty)} />
              <circle className="sms-port-tip" cx={fmt(tx)} cy={fmt(ty)} r="1.5" />
            </g>
          )
        })}
      </g>

      {/* S.4 · THE HOLD · 27 family ticks on the shallow ring */}
      <g {...g('stdlib')}>
        <ellipse className="sms-drum" cx={fmt(HOLD_X)} cy={CY} rx={HOLD_RX} ry={HOLD_RY} />
        {HOLD_TICKS.map((t) => {
          const long = t.name === 'fetch'
          const a = holdPt(t.deg, long ? -2 : 0)
          const b = holdPt(t.deg, long ? 7 : 4)
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

      {/* S.3 · THE RING edge-on · the boundary every outbound run crosses —
          4 gate stations + the 2 visible spokes to the hub */}
      <g {...g('permits')}>
        <ellipse className="sms-collar" cx={fmt(RING_X)} cy={CY} rx={RING_RX} ry={RING_RY} />
        <line className="sms-spoke" x1={fmt(RING_X)} y1={fmt(CY - RING_RY + 8)} x2={fmt(RING_X)} y2={CY - 8} />
        <line className="sms-spoke" x1={fmt(RING_X)} y1={CY + 8} x2={fmt(RING_X)} y2={fmt(CY + RING_RY - 8)} />
        {PERMIT_CATS.map((c, i) => {
          /* the 4 cardinals, edge-on: top · centre-front · bottom · centre-back */
          const y = i === 0 ? CY - RING_RY : i === 2 ? CY + RING_RY : CY
          const x = i === 1 ? RING_X + RING_RX : i === 3 ? RING_X - RING_RX : RING_X
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

      {/* S.2 · THE BRIDGE · plan slabs by wave, wires flowing to the core */}
      <g {...g('plan')}>
        {BRIDGE.map((b) => (
          <rect
            key={b.id}
            className="sms-slab"
            x={fmt(b.x - 7)}
            y={fmt(b.y - 4.5)}
            width="14"
            height="9"
          />
        ))}
      </g>

      {/* S.1 · THE CORE · the verb tetrad as the reactor diamond */}
      <g {...g('verbs')}>
        {CANON.verbNames.map((v, i) => {
          const a = -Math.PI / 2 + (2 * Math.PI * i) / CANON.verbs
          const x = sx(0.68) + Math.cos(a) * 13
          const y = CY + Math.sin(a) * 20
          return (
            <rect
              key={v}
              className="sms-core"
              x={fmt(x - 3.5)}
              y={fmt(y - 3.5)}
              width="7"
              height="7"
            />
          )
        })}
        <line className="sms-edge" x1={fmt(sx(0.68))} y1={fmt(CY - 20)} x2={fmt(sx(0.68))} y2={fmt(CY + 20)} />
        <line className="sms-edge" x1={fmt(sx(0.68) - 13)} y1={fmt(CY)} x2={fmt(sx(0.68) + 13)} y2={fmt(CY)} />
      </g>
    </svg>
  )
}
