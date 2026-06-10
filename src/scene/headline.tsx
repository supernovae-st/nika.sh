import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { intro, scroll, mouse, IT_FREEZE } from './state'

/* ─── the headline · IN the scene (not a DOM layer) · galaxy glows behind it,
       warp dust flies in FRONT of it, it catches the bloom, it gets sucked
       into the core on scroll — and it GLITCHES between lore phrases
       (Matrix chromatic slices) every few seconds.
       Hi-res CanvasTexture with the real Martian Grotesk — robust everywhere,
       no SDF worker / GPU readbacks (troika kills soft-GL contexts). ─── */

/* THE title is permanent — "Intent as Code." IS the brand (operator feedback
   2026-06-10: swapping the main title confused first-time visitors · the
   rotating benefit lines moved to the DOM ticker under it). A rare micro
   glitch keeps the type alive without ever changing the words. */
const PHRASES: string[][] = [['Intent', 'as Code']]
const CYCLE = 11 // s between micro-glitches
const GLITCH = 0.34 // s of chromatic flicker
const START = 9.5 // let the reveal breathe first

const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function makeHeadline() {
  const W = 2048
  const H = 1100
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4

  const setFont = (size: number) => {
    ctx.font = `600 ${size}px "Clash Display", "Martian Grotesk", ui-sans-serif, sans-serif`
    try {
      ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
        `${(-0.02 * size).toFixed(1)}px`
    } catch {
      /* older engines: skip tracking */
    }
  }

  /** draw `lines` centered · glitch 0..1 = chromatic split + slice tearing */
  const draw = (lines: string[], glitch = 0) => {
    ctx.clearRect(0, 0, W, H)
    // fit: shrink so the widest line + dot stays inside the canvas
    setFont(380)
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
    const size = Math.min(380, (380 * 1780) / Math.max(widest, 1))
    setFont(size)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const last = lines.length - 1
    const lineY = (i: number) => H / 2 + (i - last / 2) * size * 1.06
    const dotR = size * 0.072
    const lastW = ctx.measureText(lines[last]).width
    const xShift = -dotR * 1.6 // keep last line + dot optically centered

    const pass = (color: string | CanvasGradient, dx: number) => {
      ctx.fillStyle = color
      for (let i = 0; i < lines.length; i++)
        ctx.fillText(lines[i], W / 2 + (i === last ? xShift : 0) + dx, lineY(i))
    }
    if (glitch > 0.02) {
      const g = glitch
      ctx.globalCompositeOperation = 'lighter'
      pass(`rgba(255,70,110,${0.6 * g})`, -13 * g)
      pass(`rgba(80,235,255,${0.6 * g})`, 13 * g)
      ctx.globalCompositeOperation = 'source-over'
    }
    // electric bloom — a blue aura breathing around the glyphs
    ctx.save()
    ctx.shadowColor = 'rgba(95, 155, 255, 0.9)'
    ctx.shadowBlur = size * 0.42
    pass('rgba(91, 140, 255, 0.5)', 0)
    ctx.restore()
    // contrast halo + ELECTRIC gradient fill (white core → ice → electric blue)
    const grad = ctx.createLinearGradient(0, H / 2 - size * 0.95, 0, H / 2 + size * 0.95)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(0.42, '#e2edff')
    grad.addColorStop(1, '#8fbcff')
    ctx.save()
    ctx.shadowColor = 'rgba(5, 9, 26, 0.92)'
    ctx.shadowBlur = size * 0.1
    pass(grad, 0)
    ctx.restore()
    // the cyan accent star-dot — bright enough to feed the bloom
    ctx.fillStyle = '#49e8ff'
    ctx.beginPath()
    ctx.arc(W / 2 + xShift + lastW / 2 + dotR * 2.1, lineY(last) + size * 0.305, dotR, 0, Math.PI * 2)
    ctx.fill()
    // slice tearing — horizontal bands of the canvas shifted sideways
    if (glitch > 0.02) {
      const bands = 5
      for (let i = 0; i < bands; i++) {
        const sy = Math.random() * H
        const bh = 14 + Math.random() * 50
        const dx = (Math.random() - 0.5) * 120 * glitch
        ctx.drawImage(cv, 0, sy, W, bh, dx, sy, W, bh)
      }
    }
    tex.needsUpdate = true
  }

  draw(PHRASES[0])
  // redraw once the real display font is ready (first paint may use the fallback)
  document.fonts?.load('600 380px "Clash Display"').then(() => draw(PHRASES[0])).catch(() => {})
  return { tex, draw, aspect: W / H }
}

export function Headline() {
  const g = useRef<THREE.Group>(null!)
  const mat = useRef<THREE.MeshBasicMaterial>(null!)
  const { camera } = useThree()
  const { tex, draw, aspect } = useMemo(makeHeadline, [])
  useEffect(() => () => tex.dispose(), [tex])
  const W = 4.6 // world width of the title plane
  const phraseIdx = useRef(0)
  const frame = useRef(0)

  useFrame((s) => {
    // ── Matrix glitch cycle (skipped under reduced motion)
    if (!REDUCED) {
      const t = (IT_FREEZE ?? s.clock.elapsedTime) - START
      if (t > 0) {
        const phase = t % CYCLE
        const cyc = Math.floor(t / CYCLE)
        // the visible phrase swaps at the PEAK of the tear
        const idx = (phase >= GLITCH / 2 ? cyc + 1 : cyc) % PHRASES.length
        const inGlitch = phase < GLITCH
        frame.current++
        if (inGlitch && frame.current % 2 === 0) {
          draw(PHRASES[idx], Math.sin((phase / GLITCH) * Math.PI))
          phraseIdx.current = idx
        } else if (!inGlitch && phraseIdx.current !== idx) {
          draw(PHRASES[idx], 0)
          phraseIdx.current = idx
        }
      }
    }

    // ── placement: viewport-anchored suck into the core (page-length agnostic)
    const pull = THREE.MathUtils.smoothstep(
      THREE.MathUtils.clamp(scroll.y / (scroll.vh * 1.5), 0, 1),
      0,
      1,
    )
    const appear = intro.born
    const z = THREE.MathUtils.lerp(2.2, -0.5, pull)
    let sc = THREE.MathUtils.lerp(0.12 + 0.88 * appear, 0.02, pull)
    // responsive: never wider than 92% of the visible width at the title's depth
    const cam = camera as THREE.PerspectiveCamera
    const dist = Math.max(0.5, cam.position.z - z)
    const visW = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect
    sc = Math.min(sc, (visW * 0.92) / W)
    const baseY = cam.aspect < 1 ? 1.5 : 1.3
    g.current.position.set(mouse.x * 0.14, baseY - pull * 0.3 + mouse.y * -0.1, z)
    g.current.scale.setScalar(sc)
    g.current.rotation.y = mouse.x * 0.06
    g.current.rotation.x = mouse.y * 0.035
    // invisible until the supernova births the cosmos (born ramps 0→1)
    if (mat.current) mat.current.opacity = appear * Math.pow(1 - pull, 1.8)
  })
  return (
    <group ref={g} position={[0, 1.3, 2.2]}>
      <mesh renderOrder={5}>
        <planeGeometry args={[W, W / aspect]} />
        <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}
