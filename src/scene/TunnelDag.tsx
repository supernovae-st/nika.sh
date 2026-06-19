import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SHOWCASE_DAG, type ShowcaseTask } from '../sections/usecases-yaml.generated'
import { runStateAt } from '../sections/living/run-model'

/* ─── The DAG, INSIDE the tunnel scene (the SAME canvas) ───────────────────────
   The .nika file's tasks rendered as 3D node cards in the SAME Three.js scene as
   the tunnel — NOT HTML over it. Each task → a billboarded sprite (a canvas
   texture: id · plain-words gloss · verb · status), placed in depth by wave (iso),
   connected by edges. The deterministic run-model drives execution (a card lights
   its verb hue while running, settles ✓ on done). The whole DAG travels toward the
   camera with scroll, so you dive INTO it and watch it run. Tasks in the same wave
   sit side-by-side (parallelism visible); deps draw the edges.

   Phase 1 of the in-canvas rebuild: structure + layout + execution. The file→DAG
   morph + the enforce/verdict beats build on top. run-model = source of truth. */

const DAG = SHOWCASE_DAG['t3-resume-screener']

/* plain-words labels (the business meaning, not the cryptic id) */
const GLOSS: Record<string, string> = {
  pool: 'list every CV',
  cvs: 'read each CV · 8 at once',
  pairs: 'pair path + text',
  screened: 'score each candidate',
  ranked: 'drop weak · rank',
  shortlist: 'keep the top 5',
  brief: 'write the brief',
  save: 'save · within permits',
}
const VERB_HUE: Record<ShowcaseTask['verb'], string> = {
  infer: '#5b8cff',
  exec: '#ff7a3c',
  invoke: '#22d3ee',
  agent: '#b07bff',
}

/* iso layout · wave → depth (−Z), same-wave siblings spread on X (parallel) */
const Z_GAP = 3.6
const X_SLOT = 2.4
const CARD_W = 1.9
const CARD_H = 0.92
type Vec3 = [number, number, number]
function computeLayout(): Record<string, Vec3> {
  const byWave: ShowcaseTask[][] = Array.from({ length: DAG.waves }, () => [])
  for (const t of DAG.tasks) byWave[t.wave].push(t)
  const at: Record<string, Vec3> = {}
  for (let w = 0; w < byWave.length; w++) {
    const col = byWave[w]
    const span = (col.length - 1) * X_SLOT
    for (let i = 0; i < col.length; i++) {
      at[col[i].id] = [i * X_SLOT - span / 2, 0, -w * Z_GAP]
    }
  }
  return at
}
const LAYOUT = computeLayout()
const TOTAL_DEPTH = (DAG.waves - 1) * Z_GAP

type Status = 'pending' | 'running' | 'success' | 'failure' | 'cancelled' | 'skipped'

/* render one node card to a canvas → texture (id · gloss · verb · status). */
function makeCardTexture(task: ShowcaseTask, status: Status): THREE.CanvasTexture {
  const W = 340
  const H = 164
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!
  const running = status === 'running'
  const done = status === 'success'
  const hue = running ? VERB_HUE[task.verb] : done ? '#9fd3a0' : '#5f86d8'
  // panel
  ctx.fillStyle = running ? 'rgba(14,18,30,0.92)' : 'rgba(9,12,20,0.82)'
  ctx.fillRect(8, 8, W - 16, H - 16)
  // border (hue, thicker while running)
  ctx.strokeStyle = hue
  ctx.lineWidth = running ? 5 : 2
  ctx.strokeRect(8, 8, W - 16, H - 16)
  // id
  ctx.fillStyle = '#eef2fb'
  ctx.font = 'bold 34px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText(task.id, 26, 60)
  // gloss
  ctx.fillStyle = '#aab4c8'
  ctx.font = '24px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText(GLOSS[task.id] ?? task.verb, 26, 100)
  // verb
  ctx.fillStyle = hue
  ctx.font = '600 19px ui-monospace, monospace'
  ctx.fillText(task.verb.toUpperCase(), 26, 138)
  // status mark
  if (done) {
    ctx.fillStyle = '#9fd3a0'
    ctx.font = 'bold 30px ui-sans-serif, sans-serif'
    ctx.fillText('✓', W - 50, 56)
  } else if (running) {
    ctx.fillStyle = hue
    ctx.beginPath()
    ctx.arc(W - 36, 44, 7, 0, Math.PI * 2)
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

function NodeCard({
  task,
  pos,
  statusRef,
}: {
  task: ShowcaseTask
  pos: Vec3
  statusRef: React.MutableRefObject<Record<string, Status>>
}) {
  // precompute a texture per status (cheap · swap, never redraw per frame)
  const tex = useMemo(
    () => ({
      pending: makeCardTexture(task, 'pending'),
      running: makeCardTexture(task, 'running'),
      success: makeCardTexture(task, 'success'),
    }),
    [task],
  )
  const mat = useRef<THREE.SpriteMaterial>(null!)
  const sprite = useRef<THREE.Sprite>(null!)
  const cur = useRef<Status>('pending')

  useFrame(() => {
    const s = statusRef.current[task.id] ?? 'pending'
    if (s !== cur.current && mat.current) {
      cur.current = s
      mat.current.map = s === 'success' ? tex.success : s === 'running' ? tex.running : tex.pending
      mat.current.needsUpdate = true
      // a gentle pop while running
      const k = s === 'running' ? 1.12 : 1
      if (sprite.current) sprite.current.scale.set(CARD_W * k, CARD_H * k, 1)
    }
  })

  return (
    <sprite ref={sprite} position={pos} scale={[CARD_W, CARD_H, 1]}>
      <spriteMaterial ref={mat} map={tex.pending} transparent depthWrite={false} />
    </sprite>
  )
}

/* the edges (dep → task) as faint lines in the scene */
function edgesGeometry(): THREE.BufferGeometry {
  const pts: number[] = []
  for (const t of DAG.tasks) {
    const b = LAYOUT[t.id]
    for (const d of t.deps) {
      const a = LAYOUT[d]
      if (a && b) {
        pts.push(a[0], a[1], a[2], b[0], b[1], b[2])
      }
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return g
}

export default function TunnelDag({
  scroll,
}: {
  scroll: React.MutableRefObject<number>
}) {
  const group = useRef<THREE.Group>(null!)
  const statusRef = useRef<Record<string, Status>>({})
  const edges = useMemo(edgesGeometry, [])
  const edgeMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#4f6dc0',
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    [],
  )

  /* the DAG occupies the scroll window [DAG_IN, DAG_OUT]; within it the run
     executes and the whole graph travels toward the camera (you dive into it). */
  const DAG_IN = 0.16
  const DAG_OUT = 0.92

  useFrame(() => {
    const p = scroll.current
    const local = Math.min(1, Math.max(0, (p - DAG_IN) / (DAG_OUT - DAG_IN)))
    // execution progress from the deterministic run-model
    const run = runStateAt(DAG, local)
    for (const t of DAG.tasks) statusRef.current[t.id] = run.nodes[t.id]?.status ?? 'pending'
    if (group.current) {
      // travel the graph toward the camera as the run advances (dive INTO it)
      group.current.position.z = 1.5 + local * (TOTAL_DEPTH + 2)
      group.current.visible = p > DAG_IN - 0.04
      group.current.scale.setScalar(0.7 + 0.3 * Math.min(1, local / 0.15))
    }
  })

  return (
    <group ref={group} visible={false}>
      <lineSegments geometry={edges} material={edgeMat} frustumCulled={false} />
      {DAG.tasks.map((t) => (
        <NodeCard key={t.id} task={t} pos={LAYOUT[t.id]} statusRef={statusRef} />
      ))}
    </group>
  )
}
