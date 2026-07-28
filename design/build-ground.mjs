#!/usr/bin/env node
/* build-ground.mjs — le sol, émis pour le SITE depuis la seule source.
 *
 *   node design/build-ground.mjs          écrit src/styles/ground.css
 *   node design/build-ground.mjs --check  refuse la dérive (gate CI)
 *
 * Le banc inline exactement le même bloc (design/bench.mjs importe les mêmes
 * fonctions), et src/test/ground-parity.test.ts refuse qu'ils divergent. */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { groundCss, groundJs } from './ground.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = `${ROOT}src/styles/ground.css`

const tokensTs = readFileSync(`${ROOT}src/design-tokens.generated.ts`, 'utf8')
const lit = tokensTs.match(/export const NIKA_MATERIAL = (\{.*\}) as const/)?.[1]
if (!lit) throw new Error('ground: NIKA_MATERIAL absent — la projection spec est-elle à jour ?')
const MAT = JSON.parse(
  lit.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":').replace(/'/g, '"'),
)

const css = groundCss(MAT)

if (process.argv.includes('--check')) {
  let have = ''
  try { have = readFileSync(OUT, 'utf8') } catch { /* premier passage */ }
  if (have !== css) {
    console.error('ground: DRIFT · lancer node design/build-ground.mjs')
    process.exit(1)
  }
  console.log(`✓ ground in sync · grille ${MAT.ground.grid.cell_px}px · spot ${MAT.ground.spot.radius_px}px · ${groundJs().split('\n').length} lignes de comportement`)
} else {
  writeFileSync(OUT, css)
  console.log(`wrote src/styles/ground.css · grille ${MAT.ground.grid.cell_px}px · spot ${MAT.ground.spot.radius_px}px`)
}
