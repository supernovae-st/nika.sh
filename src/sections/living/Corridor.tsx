import { useMemo } from 'react'
import type { ShowcaseDag, ShowcaseTask } from '../usecases-yaml.generated'
import { CLI_GLYPH, type RunState, type TaskStatus } from './run-model'

/* ─── The Living File · Pass 2 · the CSS-3D depth corridor ─────────────────────
   Design doc §5.2/§5.3. The flat 2D DAG (Pass 1, kept as the reduced-motion /
   no-JS / low-end fallback) is upgraded into a CORRIDOR YOU TRAVEL DOWN —
   pure CSS 3D transforms, zero WebGL, compositor-only (transform/opacity).

   THE TECHNIQUE
   • the STAGE owns `perspective: ~1000px` (the camera lens).
   • a WORLD container holds every node; we advance its `translateZ` with the
     execution progress so the camera FLIES FORWARD through the run.
   • each node is placed in depth by WAVE: wave 0 nearest the camera, later
     waves recede toward the vanishing point (`translateZ(-wave·GAP)`).
     Same-wave nodes spread on X (parallel branches sit side by side).
   • a CSS depth GRID (floor + two side walls, thin hairline lines, masked to
     fade into the dark) recedes to the vanishing point — the hero's `.v4depth`
     register, but the DAG lives INSIDE it.
   • edges are thin 3D line plates connecting a node to each of its deps across
     depth.

   FOCAL-PLANE / RUN-MODEL SYNC
   The world Z is chosen so that the wave currently `running` (per run-model)
   sits at the FOCAL PLANE (z ≈ 0, nearest + centered). That node lights its
   verb-hue whisper + a crosshair reticle; on completion it recedes behind as
   the next wave arrives. The aurora `pulse()` still fires from the parent on
   node completion — this component is presentation-only.

   WIREFRAME + HUD
   Nodes are thin hairline wireframe plates (monochrome), each tagged with a
   blueprint mark (`EVT_NN` · verb glyph · a Φ tick). Labels (task id + verb)
   are REAL DOM TEXT — readable, crawlable, never baked into a texture.

   a11y: the corridor is an aria-hidden decorative VISUAL of the same run the
   2D DAG describes (the 2D DAG carries the role="img" description + <title>s).
   Node labels stay real text; grid/HUD are aria-hidden. */

/* the verb → CSS var(); a whisper of the verb hue only while a node is
   `running` (diegetic · design doc §3.3). Everything else is grayscale ink. */
const VERB_VAR: Record<ShowcaseTask['verb'], string> = {
  infer: 'var(--verb-infer)',
  exec: 'var(--verb-exec)',
  invoke: 'var(--verb-invoke)',
  agent: 'var(--verb-agent)',
}

/* the verb glyph in the blueprint register (mirrors codefile-highlight's set) */
const VERB_GLYPH: Record<ShowcaseTask['verb'], string> = {
  infer: '◇',
  exec: '▷',
  invoke: '◆',
  agent: '✦',
}

/* ── corridor geometry (px, in the world's local space) ─────────────────────
   The corridor recedes like a road toward a vanishing point: each deeper WAVE
   steps BACK (−Z) by a BIG step so the whole pipeline reads as a procession of
   plates marching into the distance (near = large/bright · far = small/dim).
   Deeper waves rise only slightly toward the horizon (−Y) so the enfilade stays
   near the optical center instead of climbing a staircase. Same-wave siblings
   spread on X (parallel branches side by side). The tight perspective lens
   (corridor.css · 640px) then shrinks + lifts deeper waves dramatically, so the
   layout reads as a true corridor in depth — multiple waves visible at once.
   (the plate's px size lives in corridor.css — .cor-plate is 156×54) */
const Z_GAP = 560 // depth between consecutive waves (was 300 · big steps = clear recession)
const Y_RISE = 34 // each deeper wave rises this much toward the horizon (gentle · was 96)
const X_SLOT = 188 // horizontal spread between same-wave siblings

interface Slot {
  x: number // world X (centered: same-wave nodes spread around 0)
  y: number // world Y (deeper waves rise screen-up · negative)
  z: number // world Z (negative = deeper; wave 0 ≈ 0, nearest the camera)
  wave: number
}

interface CorridorLayout {
  at: Record<string, Slot>
  byWave: ShowcaseTask[][]
  waves: number
}

function computeCorridorLayout(dag: ShowcaseDag): CorridorLayout {
  const byWave: ShowcaseTask[][] = Array.from({ length: dag.waves }, () => [])
  for (const task of dag.tasks) byWave[task.wave].push(task)
  for (const col of byWave) col.sort((a, b) => a.line0 - b.line0 || (a.id < b.id ? -1 : 1))

  const at: Record<string, Slot> = {}
  for (let w = 0; w < byWave.length; w++) {
    const col = byWave[w]
    const span = (col.length - 1) * X_SLOT
    for (let i = 0; i < col.length; i++) {
      at[col[i].id] = {
        x: i * X_SLOT - span / 2, // center the wave's siblings around x=0
        y: -w * Y_RISE, // deeper = higher toward the horizon
        z: -w * Z_GAP, // deeper = further back
        wave: w,
      }
    }
  }
  return { at, byWave, waves: dag.waves }
}

/* the world offset the camera applies as the run advances. We do NOT slam the
   active wave to z≈0 (that flattens the corridor to one plate); instead we keep
   the WHOLE procession in view and only DOLLY the camera forward by a fraction
   of a wave-gap per active wave. A fixed forward bias seats the procession so
   wave 0 sits just in front of the lens and deeper waves recede toward the VP.
   Result: you always SEE several plates in depth, and the camera glides through
   them as the run lights each wave. */
const CAM_TRAVEL = 0.48 // how much of a wave-gap the camera dollies per active wave (gentle · keeps the whole procession in view while the focal wave comes forward)
const CAM_BIAS_Z = 120 // seat the procession this far in front of the lens (px)
const CAM_BIAS_Y = 44 // upward seat so the procession sits near optical center (not clipped low)
/* near-plane cull (px, camera-space Z) — a passed plate dollying closer than
   NEAR_FADE_START fades out over NEAR_FADE_SPAN so it dissolves before it
   balloons + clips the bottom rim (lens perspective is 640px). */
const NEAR_FADE_START = 360
const NEAR_FADE_SPAN = 200
function focalOffset(activeWave: number): { y: number; z: number } {
  return {
    y: activeWave * Y_RISE * CAM_TRAVEL + CAM_BIAS_Y,
    z: activeWave * Z_GAP * CAM_TRAVEL + CAM_BIAS_Z,
  }
}

/** status → the wireframe plate class (stable, compositor-cheap). */
function plateClass(status: TaskStatus): string {
  return `cor-node cor-node--${status}`
}

/** the blueprint mark a node carries on its corner (status-aware). */
function nodeMark(status: TaskStatus): string {
  if (status === 'success') return CLI_GLYPH.done
  if (status === 'failure') return CLI_GLYPH.fail
  if (status === 'cancelled' || status === 'skipped') return CLI_GLYPH.cancel
  if (status === 'running') return CLI_GLYPH.run
  return '·'
}

/* ── the 3D edge · a thin plate from a dep node to this node across depth ─────
   We draw it in the world space as a 1px-tall bar rotated to point from the
   dep's slot to the node's slot. Because both share the corridor's perspective,
   it reads as a real connector receding into depth. We approximate with a 2D
   in-plane segment at the deeper node's Z (the visual cue is "a line bridging
   the two plates"); the perspective of the world already gives it depth feel. */
function Edge({ from, to }: { from: Slot; to: Slot }) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dz = to.z - from.z
  const len = Math.hypot(dx, dy, dz)
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const midZ = (from.z + to.z) / 2
  // a flat bar whose local +X axis spans `len`. Move it to the segment
  // midpoint, then aim it along the dep→node vector: YAW around Y for the X/Z
  // component, then PITCH around Z for the vertical rise. A positive CSS
  // rotateY turns +X toward −Z and our +Z points toward the camera, so we
  // negate the yaw to match the screen sense. translateX(-50%) centers the
  // bar's length on the midpoint.
  const yaw = -(Math.atan2(dz, dx) * 180) / Math.PI
  const pitch = (Math.atan2(dy, Math.hypot(dx, dz)) * 180) / Math.PI
  return (
    <div
      className="cor-edge"
      style={{
        width: `${len}px`,
        transform: `translate3d(${midX}px, ${midY}px, ${midZ}px) rotateY(${yaw}deg) rotateZ(${pitch}deg) translateX(-50%)`,
      }}
      aria-hidden
    />
  )
}

interface CorridorProps {
  dag: ShowcaseDag
  run: RunState
  /** execution sub-progress 0..1 — drives the forward camera travel. */
  runP: number
}

export default function Corridor({ dag, run, runP }: CorridorProps) {
  const layout = useMemo(() => computeCorridorLayout(dag), [dag])

  /* The camera flies forward as the run advances. The (fractional) active wave
     is `runP × (waves − 1)`; we translate the WHOLE world by that wave's focal
     offset so the active wave's plane lands in the foreground (z≈0, y≈0). Prior
     waves then sit BELOW + nearer (already passed); upcoming waves recede UP
     toward the vanishing point. Smooth between waves (no snapping). The grid
     shares the SAME forward translate so the floor/walls travel with the run. */
  const activeWave = runP * (layout.waves - 1)
  const cam = focalOffset(activeWave)
  const worldTransform = `translate3d(0, ${cam.y}px, ${cam.z}px)`

  /* which wave currently owns the focal plane (for the reticle + emphasis). */
  const focalWave = Math.round(activeWave)

  return (
    <div className="cor-stage" aria-hidden>
      {/* the receding depth grid — floor + ceiling + two side walls (decorative
          HUD). Travels forward with the world so the corridor recedes under/over
          the run toward the vanishing point. */}
      <div className="cor-grid" style={{ transform: worldTransform }}>
        <div className="cor-grid-floor" />
        <div className="cor-grid-ceil" />
        <div className="cor-grid-wall cor-grid-wall--l" />
        <div className="cor-grid-wall cor-grid-wall--r" />
      </div>

      {/* flat 2D perspective guide lines converging on the vanishing point +
          a brighter focal-plane band — pure screen-space atmosphere over the
          black, gives the eye the corridor read even where plates are sparse. */}
      <svg className="cor-vp" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <radialGradient id="cor-vp-glow" cx="50%" cy="40%" r="42%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.10" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* a soft glow at the vanishing point (depth-of-field bloom) */}
        <rect x="0" y="0" width="400" height="300" fill="url(#cor-vp-glow)" />
        {/* four guide lines from the frame corners converging on the VP */}
        <g className="cor-vp-lines">
          <path d="M-40 320 L200 120" />
          <path d="M440 320 L200 120" />
          <path d="M-40 -20 L200 120" />
          <path d="M440 -20 L200 120" />
        </g>
        {/* the vanishing-point crosshair */}
        <g className="cor-vp-mark">
          <circle cx="200" cy="120" r="3.2" />
          <path d="M200 110v-7M200 130v7M190 120h-7M210 120h7" />
        </g>
      </svg>

      {/* the world holds every node + edge; we fly the camera forward through
          it by translating it with the run progress. transform-only. */}
      <div className="cor-world" style={{ transform: worldTransform }}>
        {/* edges first (under the plates) · flow once the source completes */}
        {dag.tasks.flatMap((task) =>
          task.deps.map((dep) => {
            const a = layout.at[dep]
            const b = layout.at[task.id]
            if (!a || !b) return null
            const flowing =
              run.nodes[dep]?.status === 'success' && run.nodes[task.id]?.status !== 'pending'
            return (
              <div key={`${dep}->${task.id}`} className={flowing ? 'cor-edge-wrap cor-edge-wrap--flow' : 'cor-edge-wrap'}>
                <Edge from={a} to={b} />
              </div>
            )
          }),
        )}

        {/* the wireframe node plates, placed in depth by wave */}
        {dag.tasks.map((task, i) => {
          const slot = layout.at[task.id]
          const node = run.nodes[task.id]
          const status = node?.status ?? 'pending'
          const running = status === 'running'
          const focal = slot.wave === focalWave
          const hue = running ? VERB_VAR[task.verb] : undefined
          const evt = `EVT_${String(i + 1).padStart(2, '0')}`
          // near-plane cull: a plate's camera-space Z = slot.z + cam.z (the world
          // is translated +cam.z toward the lens). As a PASSED wave dollies very
          // close it would balloon + clip the bottom rim — fade it out instead so
          // it dissolves cleanly (atmosphere, not clutter). Compositor-cheap (opacity).
          const camZ = slot.z + cam.z
          const nearFade = camZ > NEAR_FADE_START ? Math.max(0, 1 - (camZ - NEAR_FADE_START) / NEAR_FADE_SPAN) : 1
          return (
            <div
              key={task.id}
              className={plateClass(status) + (focal ? ' cor-node--focal' : '')}
              style={{
                transform: `translate3d(${slot.x}px, ${slot.y}px, ${slot.z}px)`,
                ...(nearFade < 1 ? { opacity: nearFade } : {}),
                ...(hue ? { ['--cor-hue' as string]: hue } : {}),
              }}
            >
              {/* the plate face — a hairline wireframe rectangle (billboarded
                  upright so its text faces the camera). */}
              <div className="cor-plate">
                {/* corner blueprint marks (the HUD register) */}
                <span className="cor-plate-evt" aria-hidden>
                  {evt}
                </span>
                <span className="cor-plate-mark" aria-hidden>
                  {nodeMark(status)}
                </span>
                {/* the readable label — real DOM text (id + verb) */}
                <span className="cor-plate-id">{task.id}</span>
                <span className="cor-plate-verb" aria-hidden>
                  <span className="cor-plate-glyph">{VERB_GLYPH[task.verb]}</span>
                  {task.verb}
                </span>
                {/* the focal crosshair reticle (only on the focal-plane node) */}
                {focal ? (
                  <svg className="cor-reticle" viewBox="0 0 40 40" width="40" height="40" aria-hidden>
                    <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" />
                    <path d="M20 1v8M20 31v8M1 20h8M31 20h8" stroke="currentColor" strokeWidth="0.8" />
                  </svg>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* a depth-fog veil — sits OVER the world so it dissolves the FAR plates
          + grid into black toward the vanishing point (atmosphere · DoF), while
          the transparent center keeps the near focal plate crisp. */}
      <div className="cor-fog" aria-hidden />

      {/* a static HUD layer over the corridor (vanishing-point tick + a
          dimension line) — the blueprint instrument register, aria-hidden. */}
      <div className="cor-hud" aria-hidden>
        <span className="cor-hud-vp">✦ SEC 1.2 · vanishing point</span>
        <svg className="cor-hud-dim" width="120" height="10" viewBox="0 0 120 10" fill="none">
          <path d="M1 1v8M119 1v8M1 5h118" stroke="currentColor" strokeWidth="0.8" />
          <path d="M1 5l5-2M1 5l5 2M119 5l-5-2M119 5l-5 2" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        </svg>
        <span className="cor-hud-z">Z+{Math.round(cam.z)}</span>
      </div>
    </div>
  )
}
