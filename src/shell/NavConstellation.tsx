import { useEffect, useRef } from 'react'
import { NAV_STARS, STAR_LAYERS } from '../content/nav-stars.generated'
import { prefersLiteData } from '../lib/save-data'

/* ─── NavConstellation · the Reference rail's window onto the graph ───────────
   The panel's rows are tinted by the LENS LAYER of the page each one opens, and
   the rail under them opens /map — which draws that same ontology. So the rail
   IS the drawing: the site's own 189 stars, read out of the compiled
   constellation, turning slowly behind the label.

   THE DEPTH IS THE ONTOLOGY, not decoration. /map draws the layers as flat
   concentric rings because a page is a plane; here the ring index becomes z, so
   the seven layers stand apart in space the way they stand apart in a file's
   life — shape nearest, proof furthest. Turn the camera and you are reading the
   same graph from the side.

   IT COSTS THE ENTRY NOTHING. This module is lazy: the panel imports it when it
   opens, so a visitor who never touches Reference never fetches the geometry.
   No three.js — 189 points projected by hand is four lines of maths, and
   shipping a 3-D engine into a menu would be the opposite of the point.

   AND IT ASKS BEFORE IT MOVES. prefers-reduced-motion holds the frame still
   (the drawing stays, the motion goes); Save-Data skips the canvas entirely and
   the rail is simply a link, which it always was underneath. */

const DEPTH = 1.15 /* how far the seven layers stand apart along z */
const FOV = 2.6 /* the smaller, the stronger the perspective */
const TURN = 0.000085 /* radians per ms · a full turn in roughly two minutes */
/* THE BAND IS WIDE AND SHALLOW, so x and y take their own scales — one
   min(w,h) drew a 60px smudge in a 1180px strip. And the disc must fit WHOLE:
   at the previous sizing the perspective pushed near stars past the band's
   floor and the drawing read as a crop. SPAN_Y is the half-height the nearest
   star may reach, so the widest ring still lands inside. */
const SPAN_X = 0.135 /* of the band's width */
const SPAN_Y = 0.33 /* of the band's height · leaves room for the near ring */
/* THE BAND READS IN THREE ZONES · title left, graph centre-right, readout far
   right. The disc used to run to the panel's edge and the mask cut it into
   arcs; sized and placed to clear BOTH neighbours, it reads whole. */
const AT_X = 0.57
const TILT = 0.34 /* a slight lean, so the rings read as rings and not lines */

export default function NavConstellation() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || prefersLiteData()) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    /* the palette stays in CSS · the canvas asks for it rather than keeping a
       second copy of seven hues that the design SSOT already owns */
    const css = getComputedStyle(document.documentElement)
    const hues = STAR_LAYERS.map(
      (name) => css.getPropertyValue(`--layer-${name}`).trim() || '#9fd0ff',
    )

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let w = 0
    let h = 0
    let dpr = 1

    const size = () => {
      const r = canvas.getBoundingClientRect()
      dpr = Math.min(devicePixelRatio || 1, 2)
      w = Math.round(r.width)
      h = Math.round(r.height)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (angle: number) => {
      ctx.clearRect(0, 0, w, h)
      const cx = w * AT_X
      const cy = h * 0.5
      const sx = w * SPAN_X
      const sy = h * SPAN_Y
      const sin = Math.sin(angle)
      const cos = Math.cos(angle)
      for (let i = 0; i < NAV_STARS.length; i += 1) {
        const [x, y, layer] = NAV_STARS[i]
        const z0 = (layer / (STAR_LAYERS.length - 1) - 0.5) * DEPTH
        /* turn about Y, then lean the whole sky so the seven rings read as
           rings rather than as seven flat lines stacked in a row */
        const zr = x * sin + z0 * cos
        const xr = x * cos - z0 * sin
        const yt = y * Math.cos(TILT) - zr * Math.sin(TILT)
        const zt = y * Math.sin(TILT) + zr * Math.cos(TILT)
        const k = FOV / (FOV + zt) /* the perspective divide */
        const px = cx + xr * k * sx
        const py = cy + yt * k * sy
        if (px < -8 || px > w + 8 || py < -8 || py > h + 8) continue
        const depth = Math.max(0, Math.min(1, (k - 0.62) / 0.78))
        ctx.globalAlpha = 0.14 + depth * 0.58
        ctx.fillStyle = hues[layer]
        ctx.beginPath()
        ctx.arc(px, py, 0.6 + depth * 1.8, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    size()
    if (still) {
      draw(0.6)
      const ro = new ResizeObserver(() => {
        size()
        draw(0.6)
      })
      ro.observe(canvas)
      return () => ro.disconnect()
    }

    const t0 = performance.now()
    const tick = (t: number) => {
      draw((t - t0) * TURN + 0.6)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const ro = new ResizeObserver(size)
    ro.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={ref} className="v4mega-stars" aria-hidden />
}
