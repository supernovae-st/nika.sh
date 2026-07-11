import { renderHook, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AuroraProvider } from './EdgeAurora'
import { useAurora, type AuroraContextValue } from './aurora-context'

/* ── THE DRUM CONTRACT · the machined frame's run choreography ───────────────
   These pin the provider's state machine (attributes + custom props written
   via ref — no React state), the exact classes the polish arc fixed:
   · the wall flash paints the FULL ring at rest (a glow at p=0 is invisible)
   · a failed verdict HOLDS coral through the whole verdict beat
   · runStart cleans a stale flash (attr + timer) so coral never leaks
   · unrelated timers never clobber a drawing ring
   · reduced-motion = the settled register (state floors, no transients)
   Timers are faked (incl. rAF — the decay loop rides it). */

let api: AuroraContextValue

const frame = () => document.querySelector('[data-edge-aurora]') as HTMLElement
const p = () => frame().style.getPropertyValue('--run-p')
const glow = () => frame().style.getPropertyValue('--run-glow')

let reduced = false
const mountProvider = () => {
  const { result } = renderHook(() => useAurora(), { wrapper: AuroraProvider })
  api = result.current
}

beforeEach(() => {
  reduced = false
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduced,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
    ],
  })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('the drum · run lifecycle', () => {
  it('rest is silent hardware — no run, no danger, no ring', () => {
    mountProvider()
    expect(frame().hasAttribute('data-run')).toBe(false)
    expect(frame().hasAttribute('data-danger')).toBe(false)
    expect(p()).toBe('')
  })

  it('runStart raises the floor sharply and rewinds the ring', () => {
    mountProvider()
    api.runStart()
    expect(frame().getAttribute('data-run')).toBe('on')
    expect(p()).toBe('0.0000')
    /* the attack lands in ONE write — percussion, no ease-in */
    expect(glow()).toBe('0.800')
  })

  it('verbTick beats above the floor instantly, then decays back', () => {
    mountProvider()
    api.runStart()
    api.verbTick('exec')
    expect(glow()).toBe('1.000')
    vi.advanceTimersByTime(800) /* rAF decay toward the run floor */
    expect(Number(glow())).toBeLessThanOrEqual(0.82)
    expect(Number(glow())).toBeGreaterThanOrEqual(0.8)
  })

  it('runEnd(success) completes the ring, holds, then fades and resets', () => {
    mountProvider()
    api.runStart()
    api.runProgress(0.7)
    api.runEnd('success')
    expect(frame().hasAttribute('data-run')).toBe(false)
    expect(p()).toBe('1.0000')
    vi.advanceTimersByTime(1200 + 400) /* HOLD_MS then the fade's reset */
    expect(p()).toBe('0.0000')
  })

  it('runStop aborts immediately — the ring never outlives its run', () => {
    mountProvider()
    api.runStart()
    api.runProgress(0.5)
    api.runStop()
    expect(frame().hasAttribute('data-run')).toBe(false)
    vi.advanceTimersByTime(400)
    expect(p()).toBe('0.0000')
  })
})

describe('the drum · danger register', () => {
  it('the wall flash at rest paints the FULL ring, then clears clean', () => {
    mountProvider()
    api.flashDanger()
    expect(frame().getAttribute('data-danger')).toBe('on')
    expect(p()).toBe('1.0000') /* a glow at p=0 would be invisible */
    vi.advanceTimersByTime(650)
    expect(frame().hasAttribute('data-danger')).toBe(false)
    expect(p()).toBe('0.0000')
  })

  it('the wall flash during a run keeps the drawn ring («how far it got»)', () => {
    mountProvider()
    api.runStart()
    api.runProgress(0.42)
    api.flashDanger()
    expect(p()).toBe('0.4200')
    vi.advanceTimersByTime(650)
    expect(frame().hasAttribute('data-danger')).toBe(false)
    expect(p()).toBe('0.4200') /* the flash reset never clobbers a run */
  })

  it('runStart cleans a stale flash — attr AND timer (no coral leak, no clobber)', () => {
    mountProvider()
    api.flashDanger()
    expect(frame().hasAttribute('data-danger')).toBe(true)
    api.runStart()
    api.runProgress(0.5)
    expect(frame().hasAttribute('data-danger')).toBe(false)
    /* the flash's 650ms timer was cleared — it must not reset the ring */
    vi.advanceTimersByTime(650)
    expect(p()).toBe('0.5000')
  })

  it('a failed verdict HOLDS coral through the whole beat, then fades', () => {
    mountProvider()
    api.runStart()
    api.runProgress(0.6)
    api.flashDanger() /* a pending flash timer must not strip the verdict */
    api.runEnd('failure')
    expect(frame().hasAttribute('data-danger')).toBe(true)
    expect(p()).toBe('0.6000') /* failure shows whatever drew */
    vi.advanceTimersByTime(700) /* past the old flash window — still coral */
    expect(frame().hasAttribute('data-danger')).toBe(true)
    vi.advanceTimersByTime(500 + 400) /* hold ends · fade resets */
    expect(frame().hasAttribute('data-danger')).toBe(false)
    expect(p()).toBe('0.0000')
  })
})

describe('the drum · reduced motion = the settled register', () => {
  it('writes snap to the state floor — info stays, transients die', () => {
    reduced = true
    mountProvider()
    api.runStart()
    expect(glow()).toBe('0.800') /* ring present during a run */
    api.verbTick('infer')
    expect(glow()).toBe('0.800') /* no beat transient */
    api.runStop()
    expect(glow()).toBe('0.000') /* gone immediately after */
  })
})

/* ── the palette pin · one danger red, one ink — across FILES ────────────────
   The frame's css is self-contained by law (raw values: a dropped var there
   is the flood class), so its colours are pinned against the token family
   instead of read from it. Same pattern as the spec ship's hull hues. */
describe('the frame palette · pinned to the site accents', () => {
  const css = readFileSync(join(__dirname, 'edge-aurora.css'), 'utf8')
  const tokens = readFileSync(join(__dirname, '../index.css'), 'utf8')

  it('the danger tail IS the site --danger (#ff5d5d), head one step lighter', () => {
    const hex = tokens.match(/--danger:\s*#([0-9a-f]{6})/)?.[1]
    expect(hex).toBe('ff5d5d')
    const [r, g, b] = [hex!.slice(0, 2), hex!.slice(2, 4), hex!.slice(4, 6)].map((h) =>
      parseInt(h, 16),
    )
    expect(css).toContain(`rgb(${r} ${g} ${b} / 0.8)`) /* the tail = the token */
    expect(css).toContain('rgb(255 125 125 / 0.95)') /* the lighter head */
  })

  it('the run tail IS the struck-blue ink #4f86ff', () => {
    expect(css).toContain('rgb(79 134 255 / 0.8)') /* 0x4f=79 0x86=134 0xff=255 */
  })

  it('no surface bypasses the --danger token with the raw hex', () => {
    for (const rel of [
      '../sections/boundary/boundary.css',
      '../sections/morph/morph.css',
      '../sections/run/run.css',
    ]) {
      const s = readFileSync(join(__dirname, rel), 'utf8')
      expect(s.includes('#ff5d5d'), `${rel} must use var(--danger)`).toBe(false)
    }
  })
})
