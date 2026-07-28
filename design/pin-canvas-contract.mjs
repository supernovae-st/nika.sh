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

/* LE VOCABULAIRE DU CANVAS · ce qu'il STYLE **et** ce qu'il ÉCRIT. La première
   version ne relevait que le CSS, et déclarait donc « inventées » cinq classes
   que son propre TypeScript émet — nc-pol-permits, nc-pol-retry et les autres,
   précisément celles qui n'avaient aucune peau. Un instrument qui ne regarde
   qu'une moitié appelle invention ce qui est simplement muet. */
const families = [...new Set([
  ...[...css.matchAll(/\.(nc[a-z0-9-]*)/g)].map((m) => m[1]),
  /* UN LITTÉRAL PORTE SOUVENT PLUSIEURS CLASSES · `'nc-chip nc-model nc-engine'`
     est une seule chaîne et trois mots. La première version capturait la chaîne
     entière, donc nc-model restait invisible — la classe même dont on venait de
     prouver qu'elle n'avait aucune peau. On découpe. */
  ...[...ts.matchAll(/['"`]((?:nc-[a-z0-9-]+ ?)+)['"`]/g)].flatMap((m) => m[1].trim().split(/\s+/)),
])].sort()

/* CE QUE LE CANVAS REÇOIT VRAIMENT · la question que la matrice pose, et à
   laquelle personne ne pouvait répondre depuis ce dépôt. Un fichier projeté
   VERS une surface qui ne l'a jamais reçu n'est pas partagé : il est disponible.
   Trois états, mesurés, jamais supposés. */
const ARTEFACTS = {
  'design-tokens.generated.ts': 'src/design-tokens.generated.ts',
  'ground.generated.css': 'src/webview/ground.generated.css',
  'node.generated.css': 'src/webview/node.generated.css',
}
const receives = {}
for (const [name, rel] of Object.entries(ARTEFACTS)) {
  const here = existsSync(join(CANVAS, rel))
  /* combien de fichiers du canvas le NOMMENT · 0 = livré mais pas branché */
  let refs = 0
  try {
    refs = execFileSync('git', ['-C', CANVAS, 'grep', '-l', name.replace('.ts', '').replace('.css', ''), '--', 'src'],
      { encoding: 'utf8' }).trim().split('\n').filter(Boolean).length
  } catch { refs = 0 }
  receives[name] = { present: here, refs, state: !here ? 'jamais livré' : refs ? 'reçoit' : 'livré, pas branché' }
}

/* les symboles projetés que le canvas CONSOMME · un export que personne ne lit
   est une valeur partagée sur le papier seulement */
const tokens = existsSync(join(CANVAS, ARTEFACTS['design-tokens.generated.ts']))
  ? readFileSync(join(CANVAS, ARTEFACTS['design-tokens.generated.ts']), 'utf8') : ''
const symbols = {}
for (const m of tokens.matchAll(/export (?:const|function) (NIKA_[A-Z_]+|nikaNodeClass)\b/g)) {
  let n = 0
  try {
    n = execFileSync('git', ['-C', CANVAS, 'grep', '-l', m[1], '--', 'src'], { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean).filter((f) => !f.endsWith('design-tokens.generated.ts')).length
  } catch { n = 0 }
  symbols[m[1]] = n
}

const next = { sha, contract: CONTRACT, styled, families, receives, symbols, nodeClassOf: fn[0] }
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
