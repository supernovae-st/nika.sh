import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/* ── the shader precision law, mechanised (AGENTS.md · scene rules) ───────────
   « A uniform shared across shader stages must agree on precision: the vertex
   stage defaults to highp, so a fragment shader under `precision mediump
   float;` declares that uniform highp explicitly — or the program fails
   VALIDATE_STATUS silently, per material. »

   That law was written after the spec-machine W2 probe found a DEAD EDGES
   DRAW CALL. It was then broken twice more, in the same shape, in two files:
   *_COMMON declares uFade for the vertex stage (highp by default) and
   LINE_FRAG re-declares it under mediump. Both rendered fine on this
   machine's driver and on swiftshader — lenient implementations hide it,
   strict ones drop the draw call and nobody sees a console error.

   Discipline caught it twice and lost twice, so it becomes structure. This
   gate parses the REAL wiring (`vertexShader: X, fragmentShader: Y`) rather
   than the name convention — GLOW_VERT + THRUST_FRAG pairs across names and
   a convention-based check would skip it. */

const ROOT = join(__dirname, '../..')

const sources = (() => {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(join(ROOT, dir))) {
      const rel = join(dir, name)
      if (statSync(join(ROOT, rel)).isDirectory()) walk(rel)
      else if (/\.(ts|tsx)$/.test(name)) out.push(rel)
    }
  }
  walk('src')
  return out
})()

/** declared uniforms → explicit precision qualifier (null = stage default) */
function uniformsOf(glsl: string): Map<string, string | null> {
  const m = new Map<string, string | null>()
  for (const u of glsl.matchAll(
    /uniform\s+(?:(highp|mediump|lowp)\s+)?(\w+)\s+(\w+)\s*(?:\[[^\]]*\])?\s*;/g,
  )) {
    m.set(u[3], u[1] ?? null)
  }
  return m
}

interface Program {
  file: string
  vert: string
  frag: string
  vertSrc: string
  fragSrc: string
}

function programsIn(file: string): Program[] {
  const src = readFileSync(join(ROOT, file), 'utf8')
  const named = new Map<string, string>()
  for (const m of src.matchAll(/const\s+(\w+)\s*=\s*\/\*\s*glsl\s*\*\/\s*`([\s\S]*?)`/g)) {
    named.set(m[1], m[2])
  }
  if (!named.size) return []
  /* resolve ${COMMON} includes so the vertex stage carries its shared block */
  const expand = (s: string, seen = new Set<string>()): string =>
    s.replace(/\$\{(\w+)\}/g, (_, k: string) =>
      named.has(k) && !seen.has(k) ? expand(named.get(k)!, new Set([...seen, k])) : '',
    )
  const out: Program[] = []
  for (const m of src.matchAll(/vertexShader:\s*(\w+)[\s\S]{0,160}?fragmentShader:\s*(\w+)/g)) {
    const [, vert, frag] = m
    if (!named.has(vert) || !named.has(frag)) continue
    out.push({ file, vert, frag, vertSrc: expand(named.get(vert)!), fragSrc: expand(named.get(frag)!) })
  }
  return out
}

const ALL = sources.flatMap(programsIn)

describe('scene · a shared uniform agrees on precision across stages', () => {
  it('finds the scene programs at all (a gate over nothing is not a gate)', () => {
    /* floor re-anchored 2026-08-01 (the spec-machine nuke took its programs
       with it) — 13 live wirings remain: drum-hud 5 · drum-sphere 3 ·
       verb-glyphs 2 · parts 3. A drop below re-questions the census. */
    expect(ALL.length).toBeGreaterThanOrEqual(12)
  })

  it('no fragment stage narrows a uniform the vertex stage declares', () => {
    const strays: string[] = []
    for (const p of ALL) {
      const fragMediump = /precision\s+mediump\s+float\s*;/.test(p.fragSrc)
      const vu = uniformsOf(p.vertSrc)
      for (const [name, fragQualifier] of uniformsOf(p.fragSrc)) {
        if (!vu.has(name)) continue // fragment-only uniform: no cross-stage contract
        const vertPrecision = vu.get(name) ?? 'highp' // vertex default
        const fragPrecision = fragQualifier ?? (fragMediump ? 'mediump' : 'highp')
        if (vertPrecision !== fragPrecision) {
          strays.push(
            `${p.file} · ${p.vert}+${p.frag} · ${name}: vertex ${vertPrecision} vs fragment ${fragPrecision}`,
          )
        }
      }
    }
    expect(strays, `precision mismatch (silent dead draw call):\n${strays.join('\n')}`).toEqual([])
  })
})
