/* ── ÉPINGLER LE CONTRAT DU CANVAS ────────────────────────────────────────────
 * Le canvas VS Code vit dans un AUTRE dépôt. Un gate qui le lit directement
 * serait inerte en CI — là où il compte — et vert par absence de fichier.
 * (La loi : un gate qui lit la mauvaise source est inerte pour exactement ce
 * qu'il garde.)
 *
 * Alors on épingle : la fonction `nodeClassOf()` VERBATIM, et le décompte de
 * règles CSS par classe du contrat, avec le SHA d'où ça vient. La CI juge
 * l'épingle ; ce script la rafraîchit quand le dépôt voisin est là.
 *
 *   node design/pin-canvas-contract.mjs            vérifie · sort 1 si dérive
 *   node design/pin-canvas-contract.mjs --write    ré-épingle
 *
 * Sans le dépôt voisin il ne fait RIEN et le dit — il ne réécrit jamais une
 * épingle à partir de rien. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const HERE = new URL('.', import.meta.url).pathname
const CANVAS = process.env.NIKA_VSCODE_SRC ?? join(HERE, '../../vscode/repo')
const PIN = join(HERE, '../src/test/canvas-contract.pin.json')

/* les classes du contrat · celles que la spec projette et que les trois
   surfaces écrivent. Tenue ici en toutes lettres parce que ce fichier tourne
   AVANT le gate : il constate l'état du canvas, il ne le suppose pas. */
const CONTRACT = [
  ...['pending', 'running', 'success', 'failed', 'retrying', 'skipped', 'cancelled']
    .map((s) => `status-${s}`),
  ...['infer', 'exec', 'invoke', 'agent'].map((v) => `verb-${v}`),
  'is-stale', 'stale-up', 'is-cached', 'is-recovered', 'has-audit', 'dead-gate', 'is-asking',
  'audit-error', 'audit-warning', 'audit-info',
  'dag-node', 'nc',
  'nc-head', 'nc-tile', 'nc-id', 'nc-st', 'nc-dot', 'nc-sub', 'nc-sub-k', 'nc-sub-v',
  'nc-body', 'nc-agent-band', 'nc-policy', 'nc-pol', 'nc-badge', 'nc-chip',
]

if (!existsSync(join(CANVAS, 'src/webview/dag.css'))) {
  console.log(`· canvas absent (${CANVAS}) · épingle inchangée`)
  process.exit(0)
}

const css = readFileSync(join(CANVAS, 'src/webview/dag.css'), 'utf8')
const ts = readFileSync(join(CANVAS, 'src/webview/dag.ts'), 'utf8')
const sha = execFileSync('git', ['-C', CANVAS, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()

/* combien de règles portent chaque classe · zéro = une classe sans peau */
const styled = {}
for (const c of CONTRACT) {
  styled[c] = (css.match(new RegExp(`\\.${c.replace(/[-]/g, '\\-')}(?![a-z0-9-])`, 'g')) ?? []).length
}

/* la fonction, VERBATIM · c'est le juge, on ne le paraphrase pas */
const fn = ts.match(/function nodeClassOf\(node: DagNode\): string \{[\s\S]*?\n\}/)
if (!fn) { console.error('✗ nodeClassOf() introuvable dans dag.ts · le canvas a bougé'); process.exit(1) }

/* toutes les familles .nc* stylées · le banc n'a pas le droit d'en inventer */
const families = [...new Set([...css.matchAll(/\.(nc[a-z0-9-]*)/g)].map((m) => m[1]))].sort()

const next = { sha, contract: CONTRACT, styled, families, nodeClassOf: fn[0] }
const prev = existsSync(PIN) ? JSON.parse(readFileSync(PIN, 'utf8')) : null

if (process.argv.includes('--write')) {
  writeFileSync(PIN, `${JSON.stringify(next, null, 2)}\n`)
  console.log(`✓ épinglé · canvas ${sha} · ${families.length} familles · ${CONTRACT.length} classes du contrat`)
} else if (!prev || JSON.stringify(prev) !== JSON.stringify(next)) {
  console.error(`✗ le canvas a bougé depuis ${prev?.sha ?? '(jamais épinglé)'} → ${sha}`)
  console.error('  relire le diff, puis : node design/pin-canvas-contract.mjs --write')
  process.exit(1)
} else {
  console.log(`✓ épingle à jour · canvas ${sha}`)
}
