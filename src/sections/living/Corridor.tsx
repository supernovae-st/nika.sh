import { useId, useMemo } from 'react'
import type { ShowcaseDag, ShowcaseTask } from '../usecases-yaml.generated'
import { CLI_GLYPH, type RunState, type TaskStatus } from './run-model'

/* ─── The Living File · Pass 2 · the CSS-3D depth corridor ─────────────────────
   Design doc §5.2/§5.3. The flat 2D DAG (Pass 1, kept as the reduced-motion /
   no-JS / low-end fallback) is upgraded into a CORRIDOR YOU TRAVEL DOWN —
   pure CSS 3D transforms, zero WebGL, compositor-only (transform/opacity).

   THE TECHNIQUE
   • the STAGE owns a TIGHT `perspective` (the camera lens) so near plates are
     large/bright and far plates shrink hard toward a vanishing point.
   • a WORLD container holds every node; we advance its `translateZ` with the
     execution progress so the camera FLIES FORWARD through the run.
   • each node is placed in depth by WAVE: wave 0 nearest the camera, later
     waves recede toward the vanishing point (`translateZ(-wave·GAP)`).
     Same-wave nodes spread on X (parallel branches sit side by side).
   • a CSS depth GRID (floor + ceiling + two side walls, hairline lattice,
     masked to fade into the dark) recedes to the vanishing point — a real
     corridor BOX the DAG flies through.
   • edges are thin 3D line plates connecting a node to each of its deps across
     depth; when the source completes a bright PULSE travels the wire (the
     output flowing downstream).

   COMPREHENSION (the point of this pass)
   Every plate carries a PLAIN-WORDS gloss ("read the CV inbox", "score with a
   local model") so a first-time viewer UNDERSTANDS what each step does — not
   just an opaque id. The focal plate carries a live "you are here" caption. A
   permits-boundary PLANE stands across the corridor at the terminal write; an
   out-of-bounds attempt is visibly BLOCKED there (`NIKA-SEC-004`) — the
   seatbelt, made spatial.

   FOCAL-PLANE / RUN-MODEL SYNC
   The world Z is chosen so the wave currently `running` (per run-model) sits at
   the FOCAL PLANE (nearest + centered). That node lights its verb-hue whisper +
   a crosshair reticle; on completion it recedes behind as the next wave arrives.
   The aurora `pulse()` still fires from the parent on node completion — this
   component is presentation-only.

   a11y: the corridor is an aria-hidden decorative VISUAL of the same run the
   2D DAG describes (the sr-only RunSummary in LivingFile carries the textual
   equivalent). Node labels stay real DOM text; grid/HUD are aria-hidden. */

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

/* ── plain-words comprehension glosses ───────────────────────────────────────
   The operator's core ask: a viewer must UNDERSTAND what's happening. Each
   node carries a short, human sentence under its id. Keyed by node id for the
   fil-rouge (t3-resume-screener), with a generic verb-based fallback so the
   corridor never shows an empty caption on any other DAG. */
const NODE_HUD: Record<string, string> = {
  pool: 'list every CV in the inbox',
  cvs: 'read each CV · 8 at once',
  pairs: 'pair each path with its text',
  screened: 'score each candidate · local model',
  ranked: 'drop weak fits · rank the rest',
  shortlist: 'keep the top 5',
  brief: 'write the shortlist brief',
  save: 'save the brief — within permits',
}
function nodeHud(task: ShowcaseTask): string {
  if (NODE_HUD[task.id]) return NODE_HUD[task.id]
  switch (task.verb) {
    case 'infer':
      return 'ask the model'
    case 'exec':
      return 'run a command'
    case 'invoke':
      return 'call a tool'
    case 'agent':
      return 'run an agent loop'
  }
}

/* a one-word state caption shown on the focal plate's live HUD readout */
function stateWord(status: TaskStatus): string {
  switch (status) {
    case 'running':
      return 'running'
    case 'success':
      return 'done'
    case 'failure':
      return 'denied'
    case 'cancelled':
      return 'cancelled'
    case 'skipped':
      return 'skipped'
    default:
      return 'pending'
  }
}

/* ── corridor geometry (px, in the world's local space) ─────────────────────
   The corridor recedes like a road toward a vanishing point: each deeper WAVE
   steps BACK (−Z) by a BIG step so the whole pipeline reads as a procession of
   plates marching into the distance (near = large/bright · far = small/dim).
   Deeper waves rise only slightly toward the horizon (−Y) so the enfilade stays
   near the optical center instead of climbing a staircase. Same-wave siblings
   spread on X (parallel branches side by side). The tight perspective lens
   (corridor.css · 560px) then shrinks + lifts deeper waves dramatically, so the
   layout reads as a true corridor in depth — multiple waves visible at once.
   (the plate's px size lives in corridor.css — .cor-plate is 168×62) */
const Z_GAP = 460 // depth between consecutive waves (clear recession · several plates legible at once)
const Y_RISE = 26 // each deeper wave rises this much toward the horizon (gentle)
const X_SLOT = 200 // horizontal spread between same-wave siblings

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

/* the world offset the camera applies as the run advances. The model: the
   camera flies forward so the CURRENTLY-RUNNING wave sits at a fixed, comfortable
   camera-space depth (FOCAL_Z) — near enough to read large + bright, but a hair
   back from the lens so it never balloons or clips. Upcoming waves recede AHEAD
   of it toward the vanishing point (you see the plan you're about to run);
   already-run waves pass behind the camera and near-fade out. Because the focal
   wave is pinned to FOCAL_Z, the dolly is exactly one wave-gap per wave — a true
   "fly through the run" read, with several plates always visible in depth. */
const FOCAL_Z = 300 // the camera-space depth the focal wave sits at (px in front of lens)
const CAM_BIAS_Y = 12 // gentle upward seat so the procession centers in the frame
/* near-plane cull (px, camera-space Z, measured toward the camera/positive) — a
   PASSED plate dollying closer than NEAR_FADE_START fades out over NEAR_FADE_SPAN
   so it dissolves behind the camera instead of ballooning + clipping the rim. */
const NEAR_FADE_START = 90
const NEAR_FADE_SPAN = 200
function focalOffset(activeWave: number): { y: number; z: number } {
  // world is translated +z toward the lens. We want the focal wave (world z =
  // −activeWave·Z_GAP) to land at camera-space −FOCAL_Z, i.e. cam.z chosen so
  // (−activeWave·Z_GAP) + cam.z = −FOCAL_Z  →  cam.z = activeWave·Z_GAP − FOCAL_Z.
  // The focal wave's −Y rise is likewise cancelled so it sits centered.
  return {
    y: activeWave * Y_RISE + CAM_BIAS_Y,
    z: activeWave * Z_GAP - FOCAL_Z,
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
   We draw it in the world space as a thin bar rotated to point from the dep's
   slot to the node's slot. Because both share the corridor's perspective, it
   reads as a real connector receding into depth. When the source completes, a
   bright PULSE rides the wire downstream (the output flowing) — a CSS keyframe
   on a child element, so it stays compositor-cheap. */
function Edge({ from, to, flowing }: { from: Slot; to: Slot; flowing: boolean }) {
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
    >
      {/* the data-flow packet · only rendered (and animated) when flowing */}
      {flowing ? <span className="cor-edge-packet" aria-hidden /> : null}
    </div>
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

  /* a per-instance unique id for the SVG gradient — `useId()` can contain colons
     (`:r0:`) which are not valid inside a CSS `url(#…)` reference, so we sanitize
     to word chars. Prevents a second <Corridor/> from colliding on a global id. */
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const vpGlowId = `cor-vp-glow-${uid}`

  /* The camera flies forward as the run advances. The (fractional) active wave
     is `runP × (waves − 1)`; we translate the WHOLE world by that wave's focal
     offset so the active wave's plane lands in the foreground. The grid + the
     permits plane share the SAME forward translate so the whole corridor travels
     with the run. */
  const activeWave = runP * (layout.waves - 1)
  const cam = focalOffset(activeWave)
  const worldTransform = `translate3d(0, ${cam.y}px, ${cam.z}px)`

  /* which wave currently owns the focal plane (for the reticle + emphasis). */
  const focalWave = Math.round(activeWave)

  /* counts for the live measurement HUD (the "instrument" readout). */
  const total = dag.tasks.length
  const done = dag.tasks.filter((t) => run.nodes[t.id]?.status === 'success').length
  const runningTask = dag.tasks.find((t) => run.nodes[t.id]?.status === 'running')

  /* the terminal node carries the `permits:` write — the boundary plane stands
     just in FRONT of it (between camera and the `save` plate) so an out-of-bounds
     attempt is visibly checked there. With the focal-Z camera, the last plate
     lands at camera-space −FOCAL_Z; seating the plane 180px shallower puts it
     squarely in the run's path as it reaches the write. */
  const lastWave = layout.waves - 1
  const permitsZ = -lastWave * Z_GAP + (FOCAL_Z - 180) // a touch IN FRONT of the last plate
  const permitsReached = focalWave >= lastWave - 2
  const permitsTransform = `translate3d(0, ${cam.y}px, ${cam.z}px)`

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
          <radialGradient id={vpGlowId} cx="50%" cy="38%" r="46%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.13" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* a soft glow at the vanishing point (depth-of-field bloom) */}
        <rect x="0" y="0" width="400" height="300" fill={`url(#${vpGlowId})`} />
        {/* guide lines from the frame corners + edges converging on the VP */}
        <g className="cor-vp-lines">
          <path d="M-40 320 L200 114" />
          <path d="M440 320 L200 114" />
          <path d="M-40 -20 L200 114" />
          <path d="M440 -20 L200 114" />
          <path d="M-40 150 L200 114" />
          <path d="M440 150 L200 114" />
        </g>
        {/* the vanishing-point crosshair */}
        <g className="cor-vp-mark">
          <circle cx="200" cy="114" r="3.2" />
          <path d="M200 104v-7M200 124v7M190 114h-7M210 114h7" />
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
              <div
                key={`${dep}->${task.id}`}
                className={flowing ? 'cor-edge-wrap cor-edge-wrap--flow' : 'cor-edge-wrap'}
              >
                <Edge from={a} to={b} flowing={flowing} />
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
          const nearFade =
            camZ > NEAR_FADE_START ? Math.max(0, 1 - (camZ - NEAR_FADE_START) / NEAR_FADE_SPAN) : 1
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
                {/* the PLAIN-WORDS gloss — the comprehension line (what it does) */}
                <span className="cor-plate-hud" aria-hidden>
                  {nodeHud(task)}
                </span>
                {/* the telemetry chip (Cursor "Thought 4s" register) — the node's
                    real run-model duration surfaces once it finishes. */}
                {node?.durationMs != null ? (
                  <span className="cor-plate-tel" aria-hidden>
                    {task.verb} {(node.durationMs / 1000).toFixed(1)}s
                  </span>
                ) : null}
                {/* the focal crosshair reticle (only on the focal-plane node) */}
                {focal ? (
                  <svg className="cor-reticle" viewBox="0 0 56 56" width="56" height="56" aria-hidden>
                    <circle
                      cx="28"
                      cy="28"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.7"
                      strokeDasharray="2 4"
                    />
                    <path d="M28 2v10M28 44v10M2 28h10M44 28h10" stroke="currentColor" strokeWidth="0.7" />
                  </svg>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── the permits boundary · the seatbelt, made spatial ──────────────────
          A translucent plane standing ACROSS the corridor just in front of the
          terminal write. It always reads as the wall the run must not cross; as
          the run nears it, an out-of-bounds attempt is visibly BLOCKED at the
          plane with the real NIKA-SEC-004 code. Travels with the world. */}
      <div className="cor-permits" style={{ transform: permitsTransform }} aria-hidden>
        <div
          className={'cor-permits-plane' + (permitsReached ? ' cor-permits-plane--hot' : '')}
          style={{ transform: `translate3d(0, 0, ${permitsZ}px)` }}
        >
          <span className="cor-permits-label">permits: boundary</span>
          {/* the denied probe · a hairline that strikes the plane and is stopped,
              tagged with the real catalog code. Only lit once the run nears it. */}
          <span className={'cor-permits-deny' + (permitsReached ? ' cor-permits-deny--on' : '')}>
            <span className="cor-permits-deny-glyph">{CLI_GLYPH.fail}</span>
            NIKA-SEC-004 · blocked at the boundary
          </span>
        </div>
      </div>

      {/* a depth-fog veil — sits OVER the world so it dissolves the FAR plates
          + grid into black toward the vanishing point (atmosphere · DoF), while
          the transparent center keeps the near focal plate crisp. */}
      <div className="cor-fog" aria-hidden />

      {/* ── the live measurement HUD over the corridor ─────────────────────────
          A blueprint instrument register: a verb legend (so the hues read), a
          progress readout (done/total), the focal step + what it's doing, the
          vanishing-point tick, a dimension line and the camera Z. aria-hidden —
          the sr-only RunSummary carries the textual truth. */}
      <div className="cor-hud" aria-hidden>
        {/* top-left · the verb legend (decodes the corridor's only colour) */}
        <div className="cor-legend">
          <span className="cor-legend-cap">verbs</span>
          {(['infer', 'exec', 'invoke', 'agent'] as const).map((v) => (
            <span key={v} className="cor-legend-item" style={{ ['--cor-hue' as string]: VERB_VAR[v] }}>
              <span className="cor-legend-dot" />
              {v}
            </span>
          ))}
        </div>

        {/* top-right · the live run readout (done/total + the focal step) */}
        <div className="cor-readout">
          <span className="cor-readout-prog">
            <span className="cor-readout-n">{String(done).padStart(2, '0')}</span>
            <span className="cor-readout-sep">/</span>
            <span className="cor-readout-t">{String(total).padStart(2, '0')}</span>
            <span className="cor-readout-lbl">steps done</span>
          </span>
          <span className="cor-readout-bar">
            <span className="cor-readout-bar-fill" style={{ transform: `scaleX(${total ? done / total : 0})` }} />
          </span>
        </div>

        {/* bottom-center · the "you are here" caption — the focal step in plain
            words + its live state (the comprehension anchor) */}
        {runningTask ? (
          <div className="cor-focal-cap" style={{ ['--cor-hue' as string]: VERB_VAR[runningTask.verb] }}>
            <span className="cor-focal-glyph">{CLI_GLYPH.run}</span>
            <span className="cor-focal-id">{runningTask.id}</span>
            <span className="cor-focal-dash">—</span>
            <span className="cor-focal-gloss">{nodeHud(runningTask)}</span>
            <span className="cor-focal-state">{stateWord(run.nodes[runningTask.id].status)}</span>
          </div>
        ) : done === total && total > 0 ? (
          <div className="cor-focal-cap cor-focal-cap--done">
            <span className="cor-focal-glyph">{CLI_GLYPH.done}</span>
            <span className="cor-focal-gloss">run complete · within permits</span>
          </div>
        ) : null}

        {/* decorative instrument marks (Z-counter · vanishing-point tick · the
            dimension line) were removed — they added density without aiding
            comprehension (digest pass). The legend, the progress readout and the
            "you are here" caption stay: they EXPLAIN the run. */}
      </div>
    </div>
  )
}
