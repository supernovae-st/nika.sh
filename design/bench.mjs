#!/usr/bin/env node
/* nika design bench · the system, projected into a workshop you can open.
 *
 *   node design/bench.mjs          write design/bench.html
 *   node design/bench.mjs --check  verify it matches the SSOT (CI gate)
 *
 * WHY THIS IS GENERATED AND NOT DRAWN. A design system documented by hand
 * drifts from the system the day someone edits one and not the other, and then
 * the page that was supposed to be the reference becomes the least reliable
 * surface in the repo. So the bench is a PROJECTION: the palette comes from
 * design-tokens.generated.ts (itself projected from nika-spec design/tokens.yaml),
 * the layer hues from design.generated.css, the motion from the site's own
 * tokens.css, and the node's anatomy from the CANON table below — the one place
 * it is written down.
 *
 * WHY IT IS ONE SELF-CONTAINED FILE. It opens with a double-click, offline,
 * from a checkout, forever. No server, no build step, no network, no account.
 * A design reference you cannot open is not a reference.
 *
 * WHY IT IS A WORKSHOP AND NOT A GALLERY. A page that only SHOWS the system
 * cannot tell you whether the system is any good. This one lets you move the
 * five values every surface shares, watch every specimen answer at once, read
 * what the change did to text contrast — and then hands you the diff, per file,
 * ready to paste. The knobs are the design conversation; the diff is the
 * commit. (Locked 2026-07-27: precise ground, one signature — the register is
 * Linear/Raycast restraint everywhere, and the one bold moment is the node
 * taking itself apart.)
 *
 * THE ANATOMY TABLE IS A DRAFT CANON. It was recovered by reading the shipped
 * canvas (vscode dag.ts · 9373 lines, dag.css · 7097 lines, and the anatomy
 * assertions in verbAnatomies.test.ts). It lives here until it earns its place
 * in nika-spec design/tokens.yaml — at which point this script reads it from
 * there and stops holding it. The same is true of every knob marked « spec ». */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { groundJs, CURSORS } from './ground.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = `${ROOT}design/bench.html`

/* ── the palette, read out of the projections ─────────────────────────────── */
const tokensTs = readFileSync(`${ROOT}src/design-tokens.generated.ts`, 'utf8')
const designCss = readFileSync(`${ROOT}src/design.generated.css`, 'utf8')
const siteCss = readFileSync(`${ROOT}src/styles/tokens.css`, 'utf8')
/* le sol est REÇU, pas produit · le banc inline le fichier que la spec
   projette, exactement comme le site le charge */
const groundCssProjected = readFileSync(`${ROOT}src/styles/ground.generated.css`, 'utf8')
/* LA CARTE · même fichier que le site et le canvas VS Code reçoivent. Le banc
   redéclarait 11 des 13 sélecteurs à la main : c'était une 3e carte. */
const nodeCssProjected = readFileSync(`${ROOT}src/styles/node.generated.css`, 'utf8')

/* LES 28 BUILTINS · lus dans le catalogue que l'engine sert, jamais listés ici.
   Chacun porte la teinte de sa MAISON (les 6 catégories), qui vient depuis
   2026-07-28 de la spec — avant, seul le canvas savait à quoi ressemble une
   catégorie, et cette page ne pouvait montrer aucun builtin. */
const TOOLS = JSON.parse(
  readFileSync(`${ROOT}src/content/tools.generated.ts`, 'utf8')
    .match(/export const TOOLS[^=]*= (\[[\s\S]*?\n\])/)[1],
)

/* L'ORDRE DES MAISONS · du plus interne au plus lointain : la plomberie, puis
   ce qui touche le disque, puis la donnée, puis ce qui sort de la machine,
   puis ce qui regarde le run, puis ce qui fabrique. */
const CAT_ORDER = ['core', 'file', 'data', 'network', 'introspection', 'media']

const constObject = (name) => {
  const body = tokensTs.match(new RegExp(`export const ${name} = \\{([^}]*)\\}`))?.[1]
  if (!body) throw new Error(`bench: ${name} not found in design-tokens.generated.ts`)
  return Object.fromEntries([...body.matchAll(/(\w+):\s*'([^']+)'/g)].map((m) => [m[1], m[2]]))
}
/* THE PLATE IS NO LONGER THIS FILE'S TO INVENT. Until 2026-07-28 the bench
   authored the node's radius, its padding, its shadows — and the ledger below
   carried a row admitting they were "here, not projected yet". They now live
   in nika-spec design/tokens.yaml and arrive through the same projection as
   the palette, so the bench draws the object the site and the canvas draw
   rather than a careful drawing OF it. That row turns green in this commit,
   which is the only honest way for a coherence ledger to move. */
const materialLit = tokensTs.match(/export const NIKA_MATERIAL = (\{.*\}) as const/)?.[1]
if (!materialLit) throw new Error('bench: NIKA_MATERIAL not found — is the spec projection current?')
const MAT = JSON.parse(
  materialLit.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":').replace(/'/g, '"'),
)

const cssVar = (name) => designCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`))?.[1] ?? null
/* the site's own non-colour tokens · the motion knob's default is DERIVED from
   what the site actually ships, never retyped here */
const siteVar = (name) => {
  const v = siteCss.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim()
  if (!v) throw new Error(`bench: no --${name} in src/styles/tokens.css`)
  return v
}

const VERB_HEX = constObject('NIKA_VERB_HEX')
const VERB_TEXT = constObject('NIKA_VERB_TEXT')
const VERB_GLYPH = constObject('NIKA_VERB_GLYPH')
const VERB_CODICON = constObject('NIKA_VERB_CODICON')
const SEVERITY = constObject('NIKA_SEVERITY')
const SEVERITY_TEXT = constObject('NIKA_SEVERITY_TEXT')
const STATUS = constObject('NIKA_STATUS')
const ROLE_WORDS = constObject('NIKA_ROLE_WORDS')
const ROLE_MARK = constObject('NIKA_ROLE_MARK')
const ROLE_CODICON = constObject('NIKA_ROLE_CODICON')
const ROLE_WEB = constObject('NIKA_ROLE_WEB_TOKEN')
const ROLE_VSCODE = constObject('NIKA_ROLE_VSCODE')

const DUR_UI = siteVar('dur-ui') /* '140ms' today */
const EASE_UI = siteVar('ease-ui')
const DUR_MS = Number(DUR_UI.match(/([\d.]+)ms/)?.[1] ?? 0)
if (!DUR_MS) throw new Error(`bench: --dur-ui is not in ms (${DUR_UI})`)

/* ── THE TYPE SYSTEM, read from the site's own tokens ─────────────────────────
   Nine steps and four weights, locked 2026-07-28 after the site was found
   running on 81 distinct sizes (241 of them half-pixels) and nine weights. The
   bench never retypes them: it reads tokens.css, so a step that moves in the
   SSOT moves here on the next generation. */
const TYPE_STEPS = [...siteCss.matchAll(/--type-([a-z0-9-]+):\s*([^;]+);(?:\s*\/\*\s*(.*?)\s*\*\/)?/g)]
  .map(([, name, value, note]) => ({ name, value: value.trim(), note: (note ?? '').trim() }))
const WEIGHTS = [...siteCss.matchAll(/--fw-([a-z]+):\s*(\d+);(?:\s*\/\*\s*(.*?)\s*\*\/)?/g)]
  .map(([, name, value, note]) => ({ name, value: Number(value), note: (note ?? '').trim() }))
if (TYPE_STEPS.length < 7) throw new Error('bench: the type scale vanished from tokens.css')
if (WEIGHTS.length !== 4) throw new Error(`bench: expected 4 weights, found ${WEIGHTS.length}`)

/* the three faces and what each is FOR · the names are counter-intuitive on
   purpose-of-history and that is exactly why they are shown */
const FACES = [
  { varname: '--headline', face: 'Clash Display', role: 'l’argument, en grand',
    note: 'trois coupes statiques · 500 · 600 · 700, et rien d’autre. Toute autre graisse serait synthétisée.',
    sample: 'Intent as Code.', size: 'var(--type-h2)', weight: 600 },
  { varname: '--display', face: 'Martian Grotesk', role: 'la prose · le défaut du document',
    note: 'variable 100–900 · c’est elle que :root pose, donc tout texte non stylé la parle.',
    sample: 'Nika turns repeatable AI work into files you can run, review and diff.',
    size: 'var(--type-body)', weight: 400 },
  { varname: '--mono', face: 'Martian Mono', role: 'la preuve',
    note: 'variable 100–800 · sœur du grotesque, même squelette · le code, les jetons, les comptes.',
    sample: 'infer: { model: mistral/mistral-large-latest }', size: 'var(--type-eyebrow)', weight: 400 },
]

/* ── LE NŒUD · deux axes, lus, plus jamais tenus ici ──────────────────────────
   Le banc portait UNE liste de huit états, et elle était fausse de trois
   façons : deux renommés (idle→pending, ok→success), deux qui ne sont pas des
   statuts (stale est une MARQUE orthogonale · developing était une invention
   du site), et un vrai statut absent (cancelled).

   Un nœud porte UN statut et N marques. Les écraser en une liste produit un
   tableau où « périmé » côtoie « réussi » comme si une tâche ne pouvait pas
   être les deux — elle peut, et la plupart des tâches finies le deviennent. */
const listConst = (name) => {
  const m = tokensTs.match(new RegExp(`export const ${name} = \\[([^\\]]*)\\]`))
  if (!m) throw new Error(`bench: ${name} absent de la projection`)
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
}
const objConst = (name) => {
  const m = tokensTs.match(new RegExp(`export const ${name} = \\{(.*?)\\} as const`))
  if (!m) throw new Error(`bench: ${name} absent de la projection`)
  return JSON.parse(`{${m[1]}}`.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":').replace(/'/g, '"'))
}
const NODE_STATUS = listConst('NIKA_NODE_STATUS')
const MARKS = objConst('NIKA_NODE_MARKS')
const ANATOMY = objConst('NIKA_NODE_ANATOMY')
const AUDIT = listConst('NIKA_AUDIT_SEVERITY')
/* LE CONTRAT DE CLASSES · comment la carte s'écrit. Le banc ne l'invente plus :
   il l'a inventé une fois (`.nc--running`, `nc-glyph`, `nc-why`) et documentait
   alors une carte qui n'existait sur aucune surface. */
const NODE_CLASSES = objConst('NIKA_NODE_CLASSES')
/* la teinte de chaque maison · six alias, aucune couleur neuve */
const CAT_HUE = constObject('NIKA_CATEGORY_HUE')
/* L'IDENTITÉ DE LA CARTE · promue du canvas le 28/07. Le glyphe de la maison,
   le créneau d'aperçu que la carte gagne, et surtout QUEL argument est l'âme
   d'un builtin — une carte qui montre tous ses args ne montre rien. */
const CAT_GLYPH = constObject('NIKA_CATEGORY_GLYPH')
const PREVIEW_BY_CAT = constObject('NIKA_PREVIEW_BY_CATEGORY')
const PREVIEW_OVER = constObject('NIKA_PREVIEW_OVERRIDE')
const ESSENCE = objConst('NIKA_ESSENCE')
const previewOf = (bare, cat) => PREVIEW_OVER[bare] ?? PREVIEW_BY_CAT[cat] ?? 'none'

const LAYERS = ['shape', 'flow', 'acts', 'reach', 'boundary', 'refusals', 'proof']
const LAYER_HEX = Object.fromEntries(LAYERS.map((l) => [l, cssVar(`layer-${l}`)]))
for (const [l, hex] of Object.entries(LAYER_HEX)) {
  if (!hex) throw new Error(`bench: no --layer-${l} in design.generated.css`)
}

/* THE BRAND SKIN IS THE CANVAS'S OWN, NOT AN APPROXIMATION OF IT. These are
   the values `body[data-nk-theme='nika']` sets in the shipped canvas source
   (nika-vscode src/webview/dag.css, the brand block) — recovered 2026-07-27
   after the bench's first draft was caught modelling them by eye. Only
   `--nk-card` had been guessed right; surface, ink and dim were all off, and
   the LINES were the real surprise: the canvas draws them as WHITE AT LOW
   ALPHA over whatever is beneath, not as opaque greys. A border that is a
   fraction of the light is a different design decision from a border that is
   a colour, and modelling it wrong made every contrast reading downstream a
   reading of the wrong system.

   They are transcribed here rather than read across repos on purpose: this
   script runs in the website's CI, where no vscode checkout exists. That is
   precisely the gap the ledger's « pas encore projeté » row names — the day
   these live in nika-spec design/tokens.yaml, this block deletes itself. */
/* NO FAMILY INVENTS A HUE. The spec says it in prose; here it is computed, so
   the page cannot claim a coherence the values do not have. A layer that is
   literally the same hex as a verb or a severity is listed with its source. */
const HUE_SOURCES = { ...VERB_HEX, ok: SEVERITY.ok, fail: SEVERITY.fail }
const COLLISIONS = LAYERS.map((l) => {
  const hit = Object.entries(HUE_SOURCES).find(([, hex]) => hex.toLowerCase() === LAYER_HEX[l].toLowerCase())
  return hit ? [l, hit[0]] : null
}).filter(Boolean)

const brand = {
  bg: '#0d0d0e', /* --nk-page */
  surface: '#17171a', /* --nk-surface */
  raised: '#1c1d21', /* --nk-card · the one the first draft got right */
  ink: '#f4f5f7', /* --nk-ink */
  dim: '#8a8f98', /* --nk-ink-dim */
  faint: STATUS.muted, /* --nk-st-muted · projected, and the canvas agrees */
  line: 'rgb(255 255 255 / 0.09)', /* --nk-border */
  lineStrong: 'rgb(255 255 255 / 0.2)', /* --nk-border-strong */
}

/* the theme skin · what a webview inherits under `nika.canvas.skin = "theme"`.
   VS Code Light+ chart colours and greys, so the bench can prove the system
   survives a palette it does not own. */
const theme = {
  bg: '#ffffff', surface: '#f3f3f3', raised: '#ffffff',
  ink: '#1f1f1f', dim: '#616161', faint: '#8c8c8c',
  line: '#e5e5e5', lineStrong: '#cecece',
  verb: { infer: '#1a85ff', exec: '#d18616', invoke: '#0598bc', agent: '#9068c4' },
  verbText: { infer: '#1a5fb4', exec: '#a35f00', invoke: '#06697f', agent: '#6c4a99' },
  ok: '#388a34', fail: '#e51400', failText: '#b31200',
  layer: { shape: '#1a85ff', flow: '#1a85ff', acts: '#9068c4', reach: '#0598bc',
    boundary: '#d18616', refusals: '#e51400', proof: '#388a34' },
}

/* ── LE SOL · les quatre couches que le canvas dessine ───────────────────────
   Le plateau du banc peignait un aplat là où le canvas empile une trame, une
   vignette qui connaît le run, et une lampe bleue qui suit le pointeur. C'est
   pour ça que les deux divergeaient à l'œil.

   LE SVG DE LA TRAME EST DÉRIVÉ, jamais recopié : la croix se construit depuis
   cell_px et arm_px, donc changer la maille dans le SSOT change le dessin ici
   sans que personne ne retouche une data-URI. */
const crossImg = (cell, arm, stroke) => {
  const c = cell / 2
  const d = `M${c} ${c - arm}v${arm * 2}M${c - arm} ${c}h${arm * 2}`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${cell}' height='${cell}'>`
    + `<g stroke='#ffffff' stroke-opacity='${stroke}'><path d='${d}'/></g></svg>`
  return `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')}")`
}
const GR = MAT.ground
const vign = (v) => `radial-gradient(${v.reach_x * 100}% ${v.reach_y * 100}% at 50% ${v.at_y * 100}%,`
  + ` transparent ${v.clear * 100}%, rgb(0 0 0 / ${v.edge}) 100%)`

/* ── THE KNOBS · the five values every surface shares ─────────────────────────
   Each one names WHERE ITS DIFF GOES, because that is the question a designer
   cannot answer from a swatch: does this knob travel? A radius travels — the
   VS Code canvas draws the same node. A page rhythm does not — VS Code has no
   sections. Marking the destination is what keeps the shared system shared and
   stops the site's private opinions from leaking into the spec. */
const KNOBS = [
  { id: 'radius', label: 'rayon du nœud', css: '--nk-radius', min: 0, max: 14, step: 1,
    unit: 'px', def: MAT.plate.radius_px, home: 'spec', key: 'material.plate.radius_px',
    note: 'le coin · projeté depuis la spec, le même que dessine VS Code' },
  { id: 'pad', label: 'densité', css: '--nk-pad', min: 3, max: 14, step: 0.5,
    unit: 'px', def: MAT.plate.pad_px, home: 'spec', key: 'material.plate.pad_px',
    note: 'l’air dans chaque rangée · c’est lui qui décide combien de nœuds tiennent à l’écran' },
  { id: 'bevel', label: 'l’arête qui capte', css: '--nk-bevel', min: 0, max: 0.3, step: 0.01,
    unit: '', def: MAT.plate.bevel, home: 'spec', key: 'material.plate.bevel',
    note: 'le blanc posé sur le bord haut · c’est lui qui dit d’où vient la lumière' },
  { id: 'lift', label: 'la levée', css: '--nk-lift', min: 0, max: 8, step: 1,
    unit: 'px', def: MAT.plate.lift_px, home: 'spec', key: 'material.plate.lift_px',
    note: 'de combien la plaque monte quand on la prend' },
  { id: 'fs', label: 'corps du texte', css: '--nk-fs', min: 9.5, max: 14, step: 0.5,
    unit: 'px', def: 11.5, home: 'spec', key: 'node.font_size',
    note: 'la base · tout le reste du nœud se calcule à partir d’elle' },
  { id: 'edge', label: 'force du trait', css: '--nk-line-boost', min: 0, max: 100, step: 5,
    unit: '', def: 0, home: 'spec', key: 'node.edge_boost',
    note: 'de la ligne discrète vers la ligne franche · monte-le et regarde le contrôle plus bas' },
  { id: 'lamp', label: 'la lampe', css: '--lamp-core', min: 0, max: 0.6, step: 0.02,
    unit: '', def: MAT.lamp.core, home: 'spec', key: 'material.lamp.core',
    note: 'la lumière de la pièce · monte-la et regarde les plaques se tourner vers elle' },
  { id: 'dur', label: 'durée de la levée', css: '--nk-dur', min: 0, max: 400, step: 10,
    unit: 'ms', def: MAT.motion.lift_ms, home: 'spec', key: 'material.motion.lift_ms',
    note: `projeté · la courbe qui l’accompagne aussi (${MAT.motion.ease_lift.slice(0, 22)}…)` },
]
const HOMES = {
  spec: { path: 'nika-spec · design/tokens.yaml', hint: 'partagé · projeté vers les trois surfaces' },
  site: { path: 'nika.sh · src/styles/tokens.css', hint: 'site seulement · aucune projection à ce jour' },
}

/* ── THE NODE CANON · draft, recovered from the shipped canvas ────────────── */

const PART_NAME = {
  head: 'tête · qui et quel verbe',
  sub: 'mécanisme · comment',
  body: 'essence · ce qu’il fait',
  band: 'bande · où il en est',
  why: 'pourquoi · ce qui l’autorise',
}

/* LE VISAGE de chaque statut · le libellé et la forme sont de la présentation,
   l'identité est projetée. Si la spec ajoute un statut, le gate exige qu'il
   reçoive un visage ici plutôt que de le laisser sortir muet. */
const STATE_FACE = {
  pending: { label: 'en attente', form: 'pastille plus petite · « pending is CALM », il ne s’annonce pas' },
  running: { label: 'en cours', form: 'anneau · et il pulse quand le mouvement est permis' },
  success: { label: 'réussi', form: 'pastille pleine · la seule qui l’est' },
  failed: { label: 'refusé', form: 'losange + le code du refus' },
  retrying: { label: 'nouvel essai', form: 'anneau doublé + le compteur d’essai' },
  skipped: { label: 'sauté', form: 'trait plat · rien n’a couru' },
  cancelled: { label: 'annulé', form: 'trait barré · quelqu’un a coupé' },
}
const missing = NODE_STATUS.filter((id) => !STATE_FACE[id])
if (missing.length) throw new Error(`bench: statuts sans visage · ${missing.join(' ')}`)
const STATES = NODE_STATUS.map((id) => ({ id, ...STATE_FACE[id] }))

/* THE EDGE CASES. A gallery of happy paths is a brochure. These are the shapes
   that actually break a card: a name longer than its box, a prompt that wraps
   four times, a task with nothing to declare, one with too much. Each is a real
   thing an author writes, and each is a decision the canvas has to have made. */
const VARIANTS = [
  { label: 'nom très long', note: 'l’identifiant déborde · il tronque, il ne pousse pas',
    verb: 'invoke',
    spec: { id: 'reconcile-quarterly-ledger-against-bank', sub: ['args', 'path ./ledger/q3.csv'],
      body: 'nika:read', why: [['core', 'reach']] } },
  { label: 'corps qui enroule', note: 'un prompt réel fait quatre lignes · la hauteur suit',
    verb: 'infer',
    spec: { id: 'summarise', sub: ['model', 'mistral/mistral-large-latest'],
      body: '« Read the thread below and answer in three bullets: what was decided, what is still open, and who owes the next move. ${{ with.thread }} »',
      why: [['with · thread', 'flow'], ['max_tokens 400', null]] } },
  { label: 'rien à déclarer', note: 'le minimum qui reste un nœud · tête et essence',
    verb: 'exec', anatomy: ['head', 'body'],
    spec: { id: 'ping', sub: ['', ''], body: 'true', bodyKind: 'cmd', why: [] } },
  { label: 'trop à déclarer', note: 'sept permis · les puces enroulent, la carte ne casse pas',
    verb: 'exec',
    spec: { id: 'deploy', sub: ['capture', 'stdout · stderr · code'], body: './bin/ship --all', bodyKind: 'cmd',
      why: [['permits · exec', 'boundary'], ['permits · net', 'boundary'], ['permits · fs', 'boundary'],
        ['retry ×3', 'refusals'], ['on_error · recover', 'refusals'], ['timeout 90 s', 'refusals'],
        ['parallel ×2', 'flow']] } },
  { label: 'la bande d’agent', note: 'la seule rangée qui bouge en cours de run',
    verb: 'agent', state: 'running' },
  { label: 'refus, avec sa cause', note: 'le code ET la ligne qui l’a déclenché',
    verb: 'invoke', state: 'failed',
    spec: { id: 'write-brief', sub: ['args', 'path ./out/x.md'], body: 'nika:write',
      why: [['permits · fs.write = [ ./brief.md ]', 'boundary']] } },
]

/* LES ATOMES · ce que le canvas DÉCLARE, et rien de plus.
   Quatre des sept familles que ce banc montrait — permis, fils, trace, forme —
   n'existaient nulle part : zéro règle dans dag.css, inventées ici et
   présentées comme le système. Retirées.
   Les variantes ci-dessous sont celles que le fichier déclare, relevées une
   par une. La couverture reste honnête et faible : le canvas porte une
   quarantaine de familles de sous-parties, la plupart internes à la mise en
   page ; ces trois-là sont celles qui sont un VOCABULAIRE, c'est-à-dire un
   jeu fermé qu'un auteur peut reconnaître. */
const ATOMS = [
  {
    id: 'pol', title: 'puces de politique', cls: 'nc-pol-*',
    note: 'ce que la tâche promet quand ça tourne mal, ou en parallèle · 11 variantes déclarées',
    chips: [['recover', 'refusals'], ['retry', 'refusals'], ['failfast', 'refusals'],
      ['finally', 'refusals'], ['fail', 'refusals'], ['parallel', 'flow'], ['peritem', 'flow'],
      ['outs', 'flow'], ['typed', 'shape'], ['think', 'acts'], ['vision', 'acts'], ['more', null]],
  },
  {
    id: 'cat', title: 'catégories d’outils', cls: 'nc-cat-*',
    note: 'la famille du builtin appelé · 6 variantes, toutes de la couche reach',
    chips: [['core', 'reach'], ['file', 'reach'], ['data', 'reach'], ['network', 'reach'],
      ['media', 'reach'], ['introspection', 'reach']],
  },
  {
    id: 'pill', title: 'les pastilles de la bande', cls: 'nc-pill-*',
    note: 'la famille que ce banc ne montrait pas · un fait mesuré, une méthode nommée',
    chips: [['fact', 'proof'], ['method', 'acts']],
  },
]

/* the pills, isolated · a state is the one atom that must survive a monochrome
   terminal and a forced-colors screen, so each carries a shape, not only a hue */
const PILLS = STATES.map((st) => [st.label, st.id, st.form])

/* ── LE PLAYGROUND · le DAG qu'on opère ───────────────────────────────────────
   Pas une galerie de plus : un graphe réel qu'on fait tourner. C'est le
   workflow `daily-brief` que le héros du site montre déjà — sept tâches,
   quatre vagues, les mêmes arêtes que le fichier déclare. Le prendre ailleurs
   aurait été inventer un exemple pour illustrer un système qui existe. */
const DAG = {
  nodes: [
    { id: 'notes', verb: 'invoke', wave: 0, sub: ['args', 'path ./notes/today.md'], body: 'nika:read' },
    { id: 'inbox', verb: 'invoke', wave: 0, sub: ['args', 'path ./notes/inbox.md'], body: 'nika:read' },
    { id: 'calendar', verb: 'invoke', wave: 0, sub: ['args', 'path ./notes/calendar.md'], body: 'nika:read' },
    { id: 'triage', verb: 'infer', wave: 1, sub: ['with', 'inbox'], body: '« Flag what is urgent »' },
    { id: 'agenda', verb: 'infer', wave: 1, sub: ['with', 'calendar'], body: '« Plan the day around »' },
    { id: 'draft', verb: 'infer', wave: 2, sub: ['with', 'notes · triage · agenda'], body: '« Write the brief »' },
    { id: 'save', verb: 'invoke', wave: 3, sub: ['args', 'path ./brief.md'], body: 'nika:write' },
  ],
  edges: [
    ['inbox', 'triage'], ['calendar', 'agenda'], ['notes', 'draft'],
    ['triage', 'draft'], ['agenda', 'draft'], ['draft', 'save'],
  ],
}
const WAVES = Math.max(...DAG.nodes.map((n) => n.wave)) + 1
const ROW = {}
for (const n of DAG.nodes) { ROW[n.wave] = (ROW[n.wave] ?? 0) + 1; n.row = ROW[n.wave] }

/* CE QU'UN POINTEUR FAIT, MONTRÉ D'UN COUP. On ne peut pas survoler quatre
   cartes à la fois, donc un banc qui compte sur le survol ne montre jamais
   ses états d'interaction. Chacun est forcé ici par un data-force qui applique
   exactement les mêmes règles que l'état réel — si la règle change, la vitrine
   change avec elle, elle ne peut pas mentir. */
const FORCED = [
  { k: 'rest', label: 'au repos', note: `le biseau à ${MAT.plate.bevel} · l’ombre courte et l’ombre longue` },
  { k: 'hover', label: 'survolé', note: `six choses ensemble · ${MAT.plate.lift_px}px de levée, biseau ${MAT.plate.bevel}→${MAT.plate.bevel_lit}, ombre allongée, titre 500→600` },
  { k: 'focus', label: 'au clavier', note: 'le même relief, plus l’anneau · le relief ne remplace jamais l’anneau' },
  { k: 'select', label: 'sélectionné', note: 'la teinte du verbe passe dans le trait · c’est un état, pas un survol' },
  { k: 'dim', label: 'atténué', note: 'le reste du graphe quand un nœud est mis en avant · il recule, il ne disparaît pas' },
]

/* LES FORMES QU'UN GRAPHE PREND. Un seul exemple ne montre jamais la
   disposition : il montre SA disposition. Ces cinq sont les silhouettes que le
   layout doit tenir, et deux d'entre elles sont des cas dégénérés qu'un
   fichier réel produit sans qu'on l'ait voulu — la tâche unique et le fichier
   qui ne déclare rien. Même moteur de rendu, mêmes arêtes calculées au
   runtime : ce sont de vrais petits graphes, pas des icônes. */
const SHAPES = [
  { id: 'chain', label: 'la chaîne', note: 'chaque tâche attend la précédente · une vague par tâche, aucun parallélisme à gagner',
    nodes: [['a', 0], ['b', 1], ['c', 2], ['d', 3]], edges: [['a', 'b'], ['b', 'c'], ['c', 'd']] },
  { id: 'fan', label: 'l’éventail', note: 'une source, cinq lectures indépendantes · une seule vague, tout en parallèle',
    nodes: [['src', 0], ['r1', 1], ['r2', 1], ['r3', 1], ['r4', 1], ['r5', 1]],
    edges: [['src', 'r1'], ['src', 'r2'], ['src', 'r3'], ['src', 'r4'], ['src', 'r5']] },
  { id: 'diamond', label: 'le losange', note: 'deux branches qui se rejoignent · la jointure attend la plus lente',
    nodes: [['in', 0], ['l', 1], ['r', 1], ['out', 2]],
    edges: [['in', 'l'], ['in', 'r'], ['l', 'out'], ['r', 'out']] },
  { id: 'solo', label: 'une seule tâche', note: 'le cas dégénéré le plus fréquent · un fichier commence toujours comme ça',
    nodes: [['only', 0]], edges: [] },
  { id: 'empty', label: 'rien de déclaré', note: 'le fichier parse mais n’a pas de tâches · dire « vide » vaut mieux que dessiner un cadre vide',
    nodes: [], edges: [] },
]

const miniGraph = (sh) => {
  if (!sh.nodes.length) {
    return `<div class="mg-empty">aucune tâche déclarée</div>`
  }
  const waves = Math.max(...sh.nodes.map((n) => n[1])) + 1
  const rows = {}
  return `<div class="mg" data-graph="${sh.id}" data-edges="${escAttr(JSON.stringify(sh.edges))}">
        <svg class="mg-wires" aria-hidden><g></g></svg>
        <div class="mg-grid" style="--w:${waves}">
${sh.nodes.map(([id, w]) => {
  rows[w] = (rows[w] ?? 0) + 1
  return `          <span class="mg-node" data-id="${id}" style="grid-column:${w + 1};grid-row:${rows[w]}">${id}</span>`
}).join('\n')}
        </div>
      </div>`
}

const dagNode = (n) => `        <article class="dag-node verb-${n.verb} status-pending pg-node" data-id="${n.id}"
          style="grid-column:${n.wave + 1};grid-row:${n.row}" tabindex="0" role="button"
          aria-label="${n.id} · clique pour changer son état"><div class="nc">
          <div class="nc-head"><span class="nc-tile">${VERB_GLYPH[n.verb]}</span><span class="nc-id">${n.id}</span><span class="nc-badge">${n.verb}</span></div>
          <div class="nc-sub"><span class="nc-sub-k"><b class="bx-k">${n.sub[0]}</b> ${esc(n.sub[1])}</span></div>
          <div class="nc-body">${esc(n.body)}</div>
          <div class="nc-policy"><span class="pg-line"></span></div>
        </div></article>`

/* ── LA MATRICE DE SYNCHRONISATION ────────────────────────────────────────────
   Quatre surfaces, une colonne chacune, et chaque case est MESURÉE — pas
   déclarée. Un ledger à trois états disait « projeté » sans jamais dire VERS
   QUI : c'est ce mot-là qui cachait le fait le plus important de cette page,
   à savoir que deux fichiers projetés vers le canvas ne lui ont jamais été
   livrés (je les projetais dans un bac-à-sable, parce qu'une autre session
   tient ce dépôt).

   Les cinq états d'une case ·
     source            la spec le porte · c'est d'ici que ça part
     reçoit            la surface a l'artefact ET le référence
     livré · muet      l'artefact est là, personne ne le lit
     jamais livré      l'artefact n'est pas arrivé
     écrit             la surface tient sa propre version
     —                 le concept ne s'applique pas ici

   La colonne canvas vient de l'épingle (design/pin-canvas-contract.mjs) : ce
   dépôt ne peut pas lire le voisin en CI, donc il lit ce que l'épingle a
   constaté, avec le SHA. Une dérive devient un diff daté. */
const PIN = JSON.parse(readFileSync(`${ROOT}src/test/canvas-contract.pin.json`, 'utf8'))
/* le banc se lit LUI-MÊME pour sa propre colonne · il n'a pas le droit de se
   déclarer synchronisé, il doit le prouver comme les autres */
const benchSrc = readFileSync(fileURLToPath(import.meta.url), 'utf8')

/** combien de fichiers d'un arbre NOMMENT une chaîne (hors le fichier généré
 *  lui-même : un export qui ne se cite que soi n'est lu par personne) */
const refsIn = (dir, needle, skip = /\.generated\.(ts|css)$/) => {
  let n = 0
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue
      const full = `${d}/${e.name}`
      if (e.isDirectory()) { walk(full); continue }
      if (!/\.(ts|tsx|css|mjs)$/.test(e.name) || skip.test(e.name)) continue
      if (readFileSync(full, 'utf8').includes(needle)) n += 1
    }
  }
  walk(dir)
  return n
}

/* LES CONCEPTS · ce qu'un design system partage, et par quoi on le prouve.
   `sym` = un symbole du module projeté · `file` = un fichier projeté entier ·
   `own` = rien n'est projeté, chaque surface écrit le sien. */
const SYNC = [
  { row: 'les 4 hues de verbe', sym: 'NIKA_VERB_HEX' },
  { row: 'les ramps de texte', sym: 'NIKA_VERB_TEXT' },
  { row: 'sévérité · statuts', sym: 'NIKA_SEVERITY' },
  { row: 'rôles sémantiques', sym: 'NIKA_ROLE_WORDS' },
  { row: 'glyphes · codicons', sym: 'NIKA_VERB_CODICON' },
  { row: 'la matière · plaque, verre, lampe, ressorts', sym: 'NIKA_MATERIAL' },
  { row: 'statut · marques du nœud', sym: 'NIKA_NODE_STATUS' },
  { row: 'l’anatomie par verbe', sym: 'NIKA_NODE_ANATOMY' },
  { row: 'le contrat de classes', sym: 'NIKA_NODE_CLASSES' },
  { row: 'la fonction qui nomme un nœud', sym: 'nikaNodeClass' },
  { row: 'la maison des builtins', sym: 'NIKA_CATEGORY_HUE' },
  { row: 'la sévérité d’audit', sym: 'NIKA_AUDIT_SEVERITY' },
  { row: 'le sol · trame, vignette, lampe', file: 'ground.generated.css' },
  { row: 'la géométrie de la carte', file: 'node.generated.css' },
  { row: 'le rendu du DAG', own: ['dag.ts', 'DagView + MiniDag', 'le banc'] },
  { row: 'le rendu du YAML', own: ['TextMate', 'codefile-highlight', '—'] },
  { row: 'le placement du graphe', own: ['son layout', 'elkClient', 'mini-dag-layout'] },
]

/* LE SITE, C'EST src/ ET scripts/ — sa chaîne CSS vit dans scripts/lens, et un
   sondeur qui ne regarde que src/ déclarerait muet ce que le builder consomme.
   design/ en est EXCLU : c'est le banc, et une surface ne se prouve pas
   synchronisée avec les références d'une autre. */
const SITE_DIRS = [`${ROOT}src`, `${ROOT}scripts`]
const refsInDirs = (dirs, needle, skip) => dirs.reduce((n, d) => n + refsIn(d, needle, skip), 0)
const cellFor = (c, surface) => {
  if (c.own) return { s: c.own[surface === 'canvas' ? 0 : surface === 'site' ? 1 : 2], k: 'own' }
  if (c.file) {
    if (surface === 'canvas') {
      const r = PIN.receives?.[c.file]
      return { s: r ? r.state : 'inconnu', k: r?.state === 'reçoit' ? 'ok' : 'gap' }
    }
    if (surface === 'site') {
      const n = refsInDirs(SITE_DIRS, c.file, /^$/)
      return { s: n ? 'reçoit' : 'jamais livré', k: n ? 'ok' : 'gap' }
    }
    return { s: benchSrc.includes(c.file) ? 'reçoit' : 'jamais livré',
      k: benchSrc.includes(c.file) ? 'ok' : 'gap' }
  }
  if (surface === 'canvas') {
    const n = PIN.symbols?.[c.sym]
    if (n === undefined) return { s: 'jamais livré', k: 'gap' }
    return { s: n ? 'reçoit' : 'livré · muet', k: n ? 'ok' : 'mute' }
  }
  const n = surface === 'site' ? refsInDirs(SITE_DIRS, c.sym) : (benchSrc.match(new RegExp(c.sym, 'g')) || []).length
  return { s: n ? 'reçoit' : 'livré · muet', k: n ? 'ok' : 'mute' }
}

/* LE LEDGER · trois états, pas deux. « Partagé » disait deux choses très
   différentes : une valeur projetée vers trois cibles, et une valeur qu'une
   surface applique vraiment. Le gate du sol a montré l'écart de la façon la
   plus nette possible — le site chargeait le fichier et aucune page ne posait
   la classe. Une copie parfaite que personne n'applique, c'est zéro surface.
   Donc · CONSOMMÉ = projeté ET appliqué partout · PROJETÉ = disponible, pas
   encore branché · ÉCRIT = chaque surface tient sa propre version. */
const LEDGER = [
  ['hues des verbes', 'tokens.yaml → 3 cibles', 2, 'consommé'],
  ['sévérité · statuts', 'tokens.yaml → 3 cibles', 2, 'consommé'],
  ['rôles sémantiques', 'tokens.yaml (27/07)', 2, 'consommé'],
  ['glyphes · codicons', 'tokens.yaml → 3 cibles', 2, 'consommé'],
  ['rayon · densité · levée', 'material.plate (28/07)', 2, 'consommé'],
  ['biseau · ombres · grain', 'material.plate (28/07)', 2, 'consommé'],
  ['durée · courbes de ressort', 'material.motion (28/07)', 2, 'consommé'],
  ['le sol · trame, vignette, lampe', 'material.ground → 2 cibles', 1, 'projeté · le canvas ne l’importe pas encore'],
  ['le curseur d’arpentage', 'material.ground.cursor (28/07)', 1, 'projeté · idem'],
  ['statut · marques du nœud', 'material.node (28/07)', 2, 'consommé · le contrat de classes, une fonction pour trois'],
  ['la géométrie de la carte', 'material.card (28/07) → node.generated.css', 2, 'consommé · le site et ce banc la portent · le canvas la reçoit'],
  ['la forme de chaque statut', 'material.node.signal (28/07)', 2, 'consommé · 7 géométries distinctes, couleur retirée'],
  ['anatomie du nœud', 'material.node.anatomy · confirmée par verbAnatomies.test', 1, 'projeté'],
  ['l’échelle d’audit', 'severity.audit (28/07) · le site la peint enfin', 1, 'projeté · le canvas garde sa résolution locale'],
  ['le verre flottant', 'material.glass · 13 copies dans dag.css', 1, 'projeté · les 13 sites à reprendre'],
  ['les familles d’atomes', 'dag.css · 139 familles épinglées · 9 mortes', 1, 'projeté · le contrat les nomme, les peaux restent'],
  ['hues des 7 couches', 'design.generated.css', 0, 'écrit · site seulement'],
  ['géométrie · placement', 'elkClient · mini-dag-layout', 0, 'écrit deux fois'],
  ['rendu du DAG', 'dag.ts · DagView · MiniDag', 1, 'projeté · DagView a adopté la carte du canvas · MiniDag reste'],
  ['rendu du YAML', 'codefile-highlight · TextMate', 0, 'deux grammaires'],
]

/* a linear() easing, plotted from its own stops. The curve IS the value the
   spec ships, so the drawing cannot drift from it: parse, scale, done. */
const plotEase = (css) => {
  const inner = css.slice(css.indexOf('(') + 1, css.lastIndexOf(')'))
  const stops = inner.split(',').map((raw) => {
    const [v, pct] = raw.trim().split(/\s+/)
    return { v: Number(v), pct: pct ? Number(pct.replace('%', '')) : null }
  })
  const n = stops.length - 1
  stops.forEach((st, i) => { if (st.pct === null) st.pct = (i / n) * 100 })
  const lo = Math.min(...stops.map((st) => st.v))
  const hi = Math.max(...stops.map((st) => st.v))
  const y = (v) => 46 - ((v - lo) / (hi - lo)) * 40
  return {
    d: stops.map((st, i) => `${i ? 'L' : 'M'}${(st.pct * 2.4).toFixed(1)} ${y(st.v).toFixed(1)}`).join(' '),
    over: hi > 1.001,
    one: y(1).toFixed(1),
    stops: stops.length,
  }
}

/* ── the page ─────────────────────────────────────────────────────────────── */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
/* AN ATTRIBUTE NEEDS ITS QUOTES ESCAPED TOO. esc() handles text; a JSON payload
   in a double-quoted attribute breaks at its first inner quote, which is
   exactly how the mini-graphs shipped with `data-edges="[["` and drew nothing.
   Text and attributes are not the same escape. */
const escAttr = (s) => esc(s).replace(/"/g, '&quot;')

const swatch = (k, v) => `        <div class="sw"><i style="background:${v}"></i><b>${k}</b><span>${v}</span></div>`

const NODE_SPECIMENS = {
  infer: {
    id: 'triage', sub: ['model', 'anthropic/claude-haiku-4-5'],
    body: '« Flag what is urgent: ${{ with.inbox }} »',
    why: [['with · inbox', 'flow'], ['max_tokens 300', null]],
  },
  exec: {
    id: 'tally', sub: ['capture', 'stdout · decode text'], body: 'wc -l', bodyKind: 'cmd',
    why: [['permits · exec', 'boundary'], ['stdin ${{ }}', null]],
  },
  invoke: {
    id: 'calendar', sub: ['args', 'path ./notes/calendar.md'], body: 'nika:read',
    why: [['core', 'reach'], ['permits · tools', 'boundary']],
  },
  agent: {
    id: 'research', sub: ['tools', 'fetch · write · done'],
    body: '« Research plan · ${{ with.plan_queries }} »',
    band: { loop: 'tour 7 / 25', pct: 41, tk: '61 400 / 150 000' },
    /* la ligne d'état est ajoutée par STATE_LINE · la répéter ici la doublait */
    why: [],
  },
}

/* every state says something true about a run, and a cell that only changes
   hue teaches nothing. These are the lines a real trace carries. */
const STATE_LINE = {
  pending: null,
  running: ['en cours', null],
  success: ['0,4 s · $0,0012', null],
  failed: ['NIKA-EXEC-014', 'fail'],
  retrying: ['essai 2 / 5', 'refusals'],
  skipped: ['when: false', null],
  cancelled: ['coupé à la main', null],
}

const renderNode = (verb, { state = 'pending', anatomy = ANATOMY[verb], spec } = {}) => {
  const s = spec ?? NODE_SPECIMENS[verb]
  /* LA CLASSE VIENT DU CONTRAT, jamais d'une concaténation. `nc-${name}`
     fabriquait `nc-why` et `nc-band` — deux mots que le canvas n'a pas, et
     qu'un gate cherchant un point dans la source ne pouvait pas voir. */
  const p = (name, i, inner, extra = '') =>
    `<div class="${NODE_CLASSES.part[name]}${extra}" data-part="${esc(PART_NAME[name])}" style="--i:${i}">${inner}</div>`
  const part = {
    head: (i) => p('head', i, `<span class="nc-tile">${VERB_GLYPH[verb]}</span><span class="nc-id">${s.id}</span><span class="nc-badge">${verb}</span>`),
    sub: (i) => p('sub', i, `<span class="nc-sub-k"><b class="bx-k">${s.sub[0]}</b> ${esc(s.sub[1])}</span>`),
    body: (i) => p('body', i, esc(s.body), s.bodyKind === 'cmd' ? ' nc-body-cmd' : ''),
    band: (i) => (s.band
      ? p('band', i, `<span>${s.band.loop}</span><span class="nc-ab-meter"><i style="width:${s.band.pct}%"></i></span><span class="nc-ab-tk">${s.band.tk}</span>`)
      : ''),
    why: (i) => {
      const line = STATE_LINE[state]
      const extra = line
        ? `<span class="nc-chip"${line[1] ? ` style="--chip:var(--nk-${line[1] === 'fail' ? 'fail-text' : line[1]})"` : ''}>${esc(line[0])}</span>`
        : ''
      return p('why', i, s.why.map(([t, layer]) => `<span class="nc-chip"${layer ? ` style="--chip:var(--nk-${layer})"` : ''}>${esc(t)}</span>`).join('') + extra)
    },
  }
  return `<article class="dag-node verb-${verb} status-${state}"><div class="nc">${anatomy.map((name, i) => part[name](i)).join('')}</div></article>`
}

const stateNode = (st) => `        <div class="cell">
          <span class="cell-k">${st.id}</span>
          <article class="dag-node verb-exec status-${st.id}"><div class="nc">
            <div class="nc-head" data-part="tête" style="--i:0"><span class="nc-tile">${VERB_GLYPH.exec}</span><span class="nc-id">build</span><span class="nc-badge">exec</span></div>
            <div class="nc-policy" data-part="pourquoi" style="--i:1"><span class="nc-st"><i class="nc-dot"></i>${esc(st.label)}</span></div>
          </div></article>
          <span class="cell-note">${esc(st.form)}</span>
        </div>`

const atomBlock = (a) => `        <div class="cell">
          <span class="cell-k">${esc(a.title)} · <em>${a.cls}</em></span>
          <div class="chiprow">${a.chips.map(([t, l]) => `<span class="nc-chip" style="--chip:var(--nk-${l})">${esc(t)}</span>`).join('')}</div>
          <span class="cell-note">${esc(a.note)}</span>
        </div>`

/* the cross-surface bindings, shown as what they are: one meaning, three
   spellings. This is the family the old bench never showed, and it is the one
   that proves the system is shared rather than merely coordinated. */
const bindingRow = (name, glyph, codicon, extra) =>
  `        <tr><td><span class="bind-g" style="color:var(--nk-${name},var(--room-ink))">${glyph}</span> ${esc(name)}</td><td><code>${esc(codicon)}</code></td><td>${extra}</td></tr>`

const knobRow = (k) => `      <label class="knob" for="k-${k.id}">
        <span class="knob-head">
          <span class="knob-l">${esc(k.label)}</span>
          <output id="o-${k.id}" for="k-${k.id}">${k.def}${k.unit}</output>
        </span>
        <input type="range" id="k-${k.id}" data-knob="${k.id}" min="${k.min}" max="${k.max}" step="${k.step}" value="${k.def}">
        <span class="knob-note"><b class="home home--${k.home}">${k.home === 'spec' ? 'partagé' : 'site'}</b> ${esc(k.note)}</span>
      </label>`

const html = `<title>Nika · l’atelier du design system</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<!--
  GENERATED by design/bench.mjs — do not edit.
  Regenerate: node design/bench.mjs · Gate: node design/bench.mjs --check
  Opens offline, from a checkout, with a double-click. That is the point.
-->
<style>
  @property --nk-verb { syntax: '<color>'; inherits: true; initial-value: #5b8cff; }
  @property --nk-line-boost { syntax: '<number>'; inherits: true; initial-value: 0; }
  @property --lamp-x { syntax: '<length-percentage>'; inherits: true; initial-value: 50%; }
  @property --lamp-y { syntax: '<length-percentage>'; inherits: true; initial-value: 22%; }

  :root {
    --room-bg: #f7f8fa; --room-panel: #fff; --room-ink: #16181d; --room-dim: #5a6070;
    --room-faint: #8b91a1; --room-line: #e2e5ec; --room-strong: #c9cedb; --room-accent: #2f6bff;
    --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --ease: ${EASE_UI};
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --room-bg: #0a0b0d; --room-panel: #101216; --room-ink: #e9ecf2; --room-dim: #9aa2b4;
      --room-faint: #666e80; --room-line: #1e222a; --room-strong: #2c313c; --room-accent: #8db4ff;
    }
  }
  :root[data-room="light"] { --room-bg:#f7f8fa; --room-panel:#fff; --room-ink:#16181d; --room-dim:#5a6070; --room-faint:#8b91a1; --room-line:#e2e5ec; --room-strong:#c9cedb; --room-accent:#2f6bff; }
  :root[data-room="dark"] { --room-bg:#0a0b0d; --room-panel:#101216; --room-ink:#e9ecf2; --room-dim:#9aa2b4; --room-faint:#666e80; --room-line:#1e222a; --room-strong:#2c313c; --room-accent:#8db4ff; }

  /* the stage palette · every specimen draws from these and nothing else.
     The five knobbed values sit here too, so one assignment moves every
     specimen on the page at once — which is the whole point of a workshop. */
  .stage {
    --nk-bg:${brand.bg}; --nk-surface:${brand.surface}; --nk-raised:${brand.raised};
    --nk-ink:${brand.ink}; --nk-dim:${brand.dim}; --nk-faint:${brand.faint};
    --nk-line:${brand.line}; --nk-strong:${brand.lineStrong};
${Object.entries(VERB_HEX).map(([k, v]) => `    --nk-${k}:${v};`).join('\n')}
${Object.entries(VERB_TEXT).map(([k, v]) => `    --nk-${k}-text:${v};`).join('\n')}
    --nk-ok:${SEVERITY.ok}; --nk-fail:${SEVERITY.fail}; --nk-fail-text:${SEVERITY_TEXT.fail};
${Object.entries(STATUS).map(([k, v]) => `    --nk-st-${k}:${v};`).join('\n')}
${Object.entries(LAYER_HEX).map(([k, v]) => `    --nk-${k}:${v};`).join('\n')}
${KNOBS.map((k) => `    ${k.css}:${k.def}${k.unit};`).join('\n')}
    --nk-contact:0 ${MAT.plate.contact.y_px}px ${MAT.plate.contact.blur_px}px rgb(0 0 0 / ${MAT.plate.contact.alpha});
    --nk-ambient:0 ${MAT.plate.ambient.y_px}px ${MAT.plate.ambient.blur_px}px ${MAT.plate.ambient.spread_px}px rgb(0 0 0 / ${MAT.plate.ambient.alpha});
    --nk-bevel-lit:${MAT.plate.bevel_lit};
    --nk-glass-tint:${MAT.glass.tint};
    --nk-glass-blur:${MAT.glass.blur_px}px;
    --nk-glass-saturate:${MAT.glass.saturate};
    --nk-glass-border:${MAT.glass.border};
    --nk-glass-grain:${MAT.glass.grain};
    --nk-grain:${MAT.plate.grain};
    --nk-ease-lift:${MAT.motion.ease_lift};
    --nk-edge: color-mix(in oklch, var(--nk-line), var(--nk-strong) calc(var(--nk-line-boost) * 1%));
    /* the BENCH's own captions · derived from the canvas ink so they move
       with it, and set high enough that the control below clears them. The
       first draft used --nk-st-muted and read Lc 20 — the page that judges
       contrast was failing its own bar. */
    --nk-caption: color-mix(in oklch, var(--nk-ink) 80%, var(--nk-bg));
    /* la prose explicative · plus forte que la légende, moins que l'encre
       pleine, et à 14px pour que son plancher tombe de 90 à 75 */
    --nk-prose: color-mix(in oklch, var(--nk-ink) 91%, var(--nk-bg));
    transition: background-color calc(var(--nk-dur) * 2) var(--ease);
  }
  .stage[data-skin="theme"] {
    --nk-bg:${theme.bg}; --nk-surface:${theme.surface}; --nk-raised:${theme.raised};
    --nk-ink:${theme.ink}; --nk-dim:${theme.dim}; --nk-faint:${theme.faint};
    --nk-line:${theme.line}; --nk-strong:${theme.lineStrong};
${Object.entries(theme.verb).map(([k, v]) => `    --nk-${k}:${v};`).join('\n')}
${Object.entries(theme.verbText).map(([k, v]) => `    --nk-${k}-text:${v};`).join('\n')}
    --nk-ok:${theme.ok}; --nk-fail:${theme.fail}; --nk-fail-text:${theme.failText};
    --nk-st-running:${theme.verb.infer}; --nk-st-done:${theme.ok}; --nk-st-failed:${theme.fail};
    --nk-st-retrying:${theme.verb.exec}; --nk-st-muted:${theme.faint};
${Object.entries(theme.layer).map(([k, v]) => `    --nk-${k}:${v};`).join('\n')}
  }

${groundCssProjected}
${nodeCssProjected}
  *{box-sizing:border-box}
  body{margin:0;background:var(--room-bg);color:var(--room-ink);font:15px/1.55 var(--sans);-webkit-font-smoothing:antialiased}
  .wrap{max-width:1180px;margin:0 auto;padding:38px 22px 90px}
  .kicker{margin:0;font:500 11px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--room-faint)}
  h1{margin:12px 0 10px;font-size:clamp(25px,4vw,36px);line-height:1.12;letter-spacing:-.022em;text-wrap:balance}
  .lede{margin:0;max-width:66ch;color:var(--room-dim)}
  .lede b{color:var(--room-ink);font-weight:600}
  code{font-family:var(--mono);font-size:.9em;background:var(--room-line);padding:1px 5px;border-radius:4px}

  .console{position:sticky;top:0;z-index:20;display:flex;flex-wrap:wrap;align-items:center;gap:12px;
    margin:24px 0 0;padding:11px 14px;background:color-mix(in oklch,var(--room-panel) 90%,transparent);
    backdrop-filter:blur(10px);border:1px solid var(--room-line);border-radius:10px}
  .console-k{font:500 11px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--room-faint)}
  .seg{display:inline-flex;gap:2px;padding:2px;background:var(--room-bg);border:1px solid var(--room-line);border-radius:8px}
  .seg button{font:500 12px/1 var(--mono);letter-spacing:.03em;padding:7px 12px;border:0;border-radius:6px;cursor:pointer;background:transparent;color:var(--room-dim)}
  .seg button[aria-pressed=true]{background:var(--room-accent);color:#fff}
  .seg button:focus-visible{outline:2px solid var(--room-accent);outline-offset:2px}
  kbd{font:500 10px/1 var(--mono);padding:3px 5px;border:1px solid var(--room-strong);border-bottom-width:2px;border-radius:4px;color:var(--room-dim)}
  .console-note{margin-left:auto;font-size:13px;color:var(--room-dim)}

  /* l'index · collant sous la console, une seule ligne qui défile */
  .dex{position:sticky;top:56px;z-index:19;display:flex;gap:3px;overflow-x:auto;
    margin:8px 0 0;padding:7px 8px;scrollbar-width:none;
    background:color-mix(in oklch,var(--room-panel) 92%,transparent);
    backdrop-filter:blur(10px);border:1px solid var(--room-line);border-radius:9px}
  .dex::-webkit-scrollbar{display:none}
  .dex-a{flex:0 0 auto;padding:5px 9px;border-radius:6px;text-decoration:none;
    font:500 11px/1 var(--mono);letter-spacing:.03em;color:var(--room-dim);white-space:nowrap;
    transition:background-color 120ms var(--ease),color 120ms var(--ease)}
  .dex-a:hover{color:var(--room-ink);background:var(--room-line)}
  .dex-a:focus-visible{outline:2px solid var(--room-accent);outline-offset:2px}
  .dex-a[aria-current='true']{background:var(--room-accent);color:#fff}
  section{scroll-margin-top:116px}
  section{margin-top:48px}
  .sec-head{display:flex;align-items:baseline;gap:11px;margin-bottom:5px}
  h2{margin:0;font-size:18px;letter-spacing:-.012em}
  .sec-n{font:11px/1 var(--mono);color:var(--room-faint);font-variant-numeric:tabular-nums}
  .sec-note{margin:0 0 18px;max-width:70ch;color:var(--room-dim);font-size:14px}

  /* ── the workshop ───────────────────────────────────────────────────────── */
  .shop{display:grid;grid-template-columns:minmax(280px,340px) 1fr;gap:18px;align-items:start}
  @media (max-width:860px){.shop{grid-template-columns:1fr}}
  .desk{display:grid;gap:16px;padding:18px;background:var(--room-panel);border:1px solid var(--room-line);border-radius:12px}
  .knob{display:grid;gap:6px}
  .knob-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
  .knob-l{font-size:13px;font-weight:500}
  .knob output{font:500 12px/1 var(--mono);color:var(--room-ink);font-variant-numeric:tabular-nums;
    padding:3px 6px;background:var(--room-bg);border:1px solid var(--room-line);border-radius:5px}
  .knob input[type=range]{width:100%;accent-color:var(--room-accent);cursor:ew-resize}
  .knob input:focus-visible{outline:2px solid var(--room-accent);outline-offset:3px}
  .knob-note{font-size:11px;line-height:1.45;color:var(--room-faint)}
  .home{display:inline-block;font:500 10px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;
    padding:2.5px 5px;border-radius:4px;vertical-align:1px;margin-right:4px}
  .home--spec{background:color-mix(in oklch,var(--room-accent) 16%,transparent);color:var(--room-accent)}
  .home--site{background:color-mix(in oklch,var(--room-faint) 20%,transparent);color:var(--room-dim)}
  .desk-foot{display:flex;align-items:center;gap:8px;padding-top:4px;border-top:1px solid var(--room-line)}
  .btn{font:500 12px/1 var(--mono);padding:7px 11px;background:var(--room-bg);color:var(--room-dim);
    border:1px solid var(--room-line);border-radius:7px;cursor:pointer}
  .btn:hover{color:var(--room-ink);border-color:var(--room-strong)}
  .btn:focus-visible{outline:2px solid var(--room-accent);outline-offset:2px}

  .diff{margin-top:18px;border:1px solid var(--room-line);border-radius:10px;overflow:hidden}
  .diff-head{display:flex;align-items:center;gap:10px;padding:9px 13px;background:var(--room-panel);border-bottom:1px solid var(--room-line)}
  .diff-head b{font:500 11px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--room-faint);font-weight:500}
  .diff-head .btn{margin-left:auto;padding:5px 9px}
  .diff pre{margin:0;padding:13px;font:12px/1.6 var(--mono);white-space:pre-wrap;overflow-x:auto;color:var(--room-dim)}
  .diff .add{color:#1f8a5c}.diff .del{color:#c2410c}.diff .file{color:var(--room-ink);font-weight:600}
  @media (prefers-color-scheme:dark){.diff .add{color:#34d399}.diff .del{color:#ff9a6f}}

  /* THE ROOM. The bench showed the plates but not the light that makes them
     objects. One additive gradient over the stage lights every specimen at
     once — the same numbers the site binds, projected from the same block.
     plus-lighter because the room is dark: soft-light barely lifts a backdrop
     already near zero, which is how the site's first binding shipped a lamp
     that moved one pixel sample in 5394. */
  /* le plateau EST le sol · les quatre couches viennent de design/ground.mjs,
     la même source que le site consomme (src/styles/ground.css). Le banc n'en
     tient pas une copie : il inline le même bloc, et ground-parity.test.ts
     refuse qu'ils divergent d'un octet. */
  .stage{color:var(--nk-ink);border:1px solid var(--room-strong);border-radius:12px;
    padding:24px;overflow-x:auto}

  @media (prefers-reduced-motion:no-preference){
    .stage{animation:lamp-drift ${MAT.lamp.drift_s}s linear infinite}
    .stage[data-lamp]{animation-play-state:paused}}
  @keyframes lamp-drift{
    0%{--lamp-x:22%;--lamp-y:14%}25%{--lamp-x:68%;--lamp-y:26%}
    50%{--lamp-x:82%;--lamp-y:58%}75%{--lamp-x:38%;--lamp-y:46%}
    100%{--lamp-x:22%;--lamp-y:14%}}
  .rack{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start}
  .cell{display:grid;gap:8px;max-width:268px}
  .cell-k{font:500 10px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--nk-caption)}
  .cell-k em{font-style:normal;color:var(--nk-dim)}
  .cell-note{font:11px/1.45 var(--sans);color:var(--nk-caption)}
  .chiprow{display:flex;flex-wrap:wrap;gap:6px}

  /* THE SPECIMEN IS THE PLATE. Not a card that resembles one — the same
     quantities the site and the canvas bind, arriving through the same
     projection. A bevel on the top edge, a contact shadow and an ambient one,
     the paper's tooth over the face. */
  /* LE BANC BRANCHE LES JETONS DE LA CARTE. node.generated.css porte la
     géométrie et laisse la couleur à la surface : sans ces six lignes, la carte
     tombait sur son repli transparent et la trame du sol traversait le texte.
     C'est ce qui rendait les cartes « pointillées ».
     (Aucun backtick dans un commentaire de template literal — payé 3× cet arc.) */
  .stage{--nk-card:var(--nk-surface);--nk-card-border:var(--nk-edge);
    --nk-ink:var(--nk-ink);--nk-mono:var(--nk-face-mono);
    --nk-fs-heading:calc(var(--nk-fs) + 1px);--nk-fs-label:var(--nk-fs);
    --nk-fs-sub:var(--nk-fs);--nk-fs-body:var(--nk-fs);
    --nk-fs-meta:calc(var(--nk-fs) - 1.5px);--nk-fw-strong:600}
  .nc{width:252px;overflow:hidden;font-size:var(--nk-fs);box-shadow:inset 0 1px 0 rgb(255 255 255 / var(--nk-bevel)),var(--nk-contact),var(--nk-ambient)}
  .nc::after{content:'';position:absolute;inset:0;pointer-events:none;border-radius:inherit;
    opacity:var(--nk-grain);background-image:repeating-conic-gradient(#fff 0% 25%,transparent 0% 50%);
    background-size:3px 3px;mix-blend-mode:overlay}
  .nc:hover{transform:translateY(calc(var(--nk-lift) * -1));
    box-shadow:inset 0 1px 0 rgb(255 255 255 / var(--nk-bevel-lit)),var(--nk-contact),
      0 calc(var(--nk-lift) * 13) calc(var(--nk-lift) * 18) -28px rgb(0 0 0 / .62)}
  @media (prefers-reduced-motion:reduce){.nc{transition:none}.nc:hover{transform:none}}
  .nc-head{padding:calc(var(--nk-pad) * 1.14) calc(var(--nk-pad) * 1.42);border-bottom:1px solid var(--nk-edge);background:color-mix(in oklch,var(--nk-verb,var(--nk-ink)) 8%,transparent)}
  .nc-tile{color:var(--nk-verb,var(--nk-ink));line-height:1}

  .nc-badge{margin-left:auto;letter-spacing:.07em;color:var(--nk-verb-text,var(--nk-dim))}
  .nc-sub,.nc-body,.nc-policy{padding:var(--nk-pad) calc(var(--nk-pad) * 1.42)}
  .nc-sub{color:var(--nk-dim);border-bottom:1px dashed var(--nk-edge)}
  .bx-k{color:var(--nk-faint);font-weight:400}
  .cat-house{margin:0 0 22px}
  .cat-head{display:flex;align-items:baseline;gap:9px;margin:0 0 9px;
    font-family:var(--nk-face-mono);font-size:var(--nk-fs);letter-spacing:.09em;
    text-transform:uppercase;color:var(--nk-dim)}
  .cat-n{color:var(--nk-faint);font-variant-numeric:tabular-nums}
  .nc-chip-icon{color:var(--cat);line-height:1}
  .bx-tools{display:grid;grid-template-columns:repeat(auto-fill,minmax(228px,1fr));gap:12px}
  .bx-tools .nc{width:auto}
  .bx-opt{color:var(--nk-faint);border-style:dashed}
  /* L'ESSENCE · l'argument qui EST le builtin, et comment il se rend. Une ligne
     à part, plus haut que la description : c'est ce qu'on lit en premier sur un
     canvas quand on cherche « qu'est-ce que cette tâche fait, au juste ». */
  /* (0,3,0) EXPRÈS · la règle de galerie .bx-tools .nc-body pose display:block
     en (0,2,0) et écrasait ce flex : la clé et le rendu se collaient en
     « conditionCONDITION ». Une spécificité qu'on ne calcule pas est une
     spécificité qui décide à notre place. (Et aucun backtick ici · 4e fois.) */
  .bx-tools .nc-body.bx-ess{display:flex;align-items:baseline;gap:8px;margin-top:0;
    padding-bottom:7px;border-bottom:1px dashed var(--nk-edge);-webkit-line-clamp:unset}
  .bx-ess-k{color:var(--cat,var(--nk-strong));font-weight:600;letter-spacing:.01em}
  .bx-ess-r{margin-left:auto;font-size:calc(var(--nk-fs) - 1.5px);color:var(--nk-faint);
    letter-spacing:.06em;text-transform:uppercase}
  /* le créneau d'aperçu · une carte qui développe une image le dit dans sa tête */
  .bx-prev{margin-left:auto;font-size:calc(var(--nk-fs) - 2px);letter-spacing:.07em;
    text-transform:uppercase;color:var(--cat,var(--nk-dim));
    border:1px solid color-mix(in oklch,var(--cat,var(--nk-edge)) 38%,transparent);
    border-radius:3px;padding:0 5px}
  .bx-tools .dag-node{--cat:var(--nk-dim)}
${CAT_ORDER.map((c) => `  .cat-house:has(.nc-cat-${c}) .bx-tools .dag-node{--cat:${CAT_HUE[c]}}`).join('\n')}
  /* LA MATRICE · une case = un état, et l'état a une FORME autant qu'une teinte
     (le point, le tiret, le vide) — la couleur seule ne dirait rien en contraste
     forcé, et c'est le tableau qui juge la synchronisation. */
  .mx-sync td.mx-c{white-space:nowrap;font-size:calc(var(--nk-fs) - 1px);
    letter-spacing:.02em;text-align:center;padding-left:10px;padding-right:10px}
  .mx-what{width:38%}
  .mx-c::before{content:'';display:inline-block;width:6px;height:6px;margin-right:7px;
    vertical-align:1px;border-radius:50%;background:currentColor}
  .mx-src{color:var(--nk-dim)}
  .mx-src::before{border-radius:1px;transform:rotate(45deg)}
  .mx-ok{color:var(--nk-ok)}
  .mx-mute{color:var(--nk-caption)}
  .mx-mute::before{background:transparent;box-shadow:inset 0 0 0 1.5px currentColor}
  .mx-gap{color:var(--nk-fail-text)}
  .mx-gap::before{width:7px;height:2px;border-radius:1px}
  .mx-own{color:var(--nk-faint)}
  .mx-own::before{opacity:.4;width:3px;height:3px}
  .mx-lg{font-weight:400;padding:1px 7px 1px 0;white-space:nowrap}
  .mx-lg::before{content:'';display:inline-block;width:6px;height:6px;margin-right:6px;
    vertical-align:1px;border-radius:50%;background:currentColor}
  .mx-verdict{border-left:2px solid var(--nk-fail);padding-left:13px;margin-top:16px}
  /* LE CLAMP DU CANVAS N'A PAS DE SENS ICI. Un nœud dans un graphe coupe sa
     description à 3 lignes pour tenir la grille ; une page de RÉFÉRENCE existe
     pour la donner en entier. Même carte, deux hôtes, deux besoins — c'est
     exactement ce que la géométrie projetée permet sans se dédoubler. */
  .bx-tools .nc-body{-webkit-line-clamp:unset;display:block;min-height:44px}
  .bx-tools .nc-policy{margin-top:auto;padding-top:7px;border-top:1px solid var(--nk-edge)}
  /* une rangée d'une seule hauteur : l'article est la case de grille, la carte
     doit la remplir — sinon la ligne de pastilles danse d'une carte à l'autre */
  .bx-tools .dag-node{display:flex}
  .bx-tools .nc{display:flex;flex-direction:column;flex:1}
  .cat-hex{margin-left:auto;padding-right:2px;color:var(--nk-faint);
    font-size:calc(var(--nk-fs) - 1.5px);font-variant-numeric:tabular-nums}
${CAT_ORDER.map((c) => `  .nc-cat-${c}{--cat:${CAT_HUE[c]}}`).join('\n')}
${CAT_ORDER.map((c) => `  .cat-house:has(.nc-cat-${c}) .bx-tools .nc:hover{border-color:color-mix(in oklch,${CAT_HUE[c]} 42%,var(--nk-edge))}`).join('\n')}

  .nc-body-cmd{color:var(--nk-exec-text)}
  .nc-policy{border-top:1px solid var(--nk-edge);display:flex;flex-wrap:wrap;gap:5px;align-items:center}
  .nc-chip{display:inline-flex;align-items:center;color:var(--chip,var(--nk-dim));letter-spacing:.03em}
  .nc-agent-band{display:flex;align-items:center;gap:8px;padding:calc(var(--nk-pad) * .86) calc(var(--nk-pad) * 1.42);
    border-top:1px solid var(--nk-edge);background:color-mix(in oklch,var(--nk-agent) 9%,transparent);
    font-size:calc(var(--nk-fs) - 1.5px);color:var(--nk-agent-text)}
  .nc-ab-meter{flex:1;height:3px;border-radius:2px;background:color-mix(in oklch,var(--nk-agent) 22%,transparent);overflow:hidden}
  .nc-ab-meter i{display:block;height:100%;background:var(--nk-agent)}
  .nc-ab-tk{font-variant-numeric:tabular-nums}

${Object.keys(VERB_HEX).map((v) => `  .dag-node.verb-${v} .nc{--nk-verb:var(--nk-${v});--nk-verb-text:var(--nk-${v}-text)}`).join('\n')}
  .dag-node.status-success .nc{border-color:color-mix(in oklch,var(--nk-ok) 46%,var(--nk-edge))}
  .dag-node.status-failed .nc{border-color:color-mix(in oklch,var(--nk-fail) 54%,var(--nk-edge))}
  .dag-node.status-running .nc{border-color:color-mix(in oklch,var(--nk-st-running) 50%,var(--nk-edge))}
  .dag-node.status-retrying .nc{border-color:color-mix(in oklch,var(--nk-st-retrying) 44%,var(--nk-edge))}
  .dag-node.status-skipped .nc{opacity:.52}

  .nc-st{gap:5px;font-size:calc(var(--nk-fs) - 1.5px);letter-spacing:.05em}
  /* LA FORME DIT L'ÉTAT. La page l'affirmait et c'était faux : quatre états
     sur huit ne posaient que de la couleur sur la carte, et la « forme »
     annoncée pour l’état réussi était « bordure teintée » — la teinte elle-même.
     Chaque pastille porte maintenant une GÉOMÉTRIE, qui survit au contraste
     forcé (une géométrie n'est pas une couleur) et au mouvement réduit (elle
     ne bouge pas). */

  .dag-node.status-success .nc-dot{border-radius:50%;background:currentColor}            /* plein · c'est fait */
  .dag-node.status-running .nc-dot{background:transparent;box-shadow:inset 0 0 0 2px currentColor} /* anneau · en cours */
  .dag-node.status-failed .nc-dot{border-radius:1px;transform:rotate(45deg)}        /* losange · barré */
  .dag-node.status-retrying .nc-dot{border-radius:50%;background:transparent;
    box-shadow:inset 0 0 0 1.5px currentColor,0 0 0 2px color-mix(in oklch,currentColor 34%,transparent)}
  .dag-node.status-skipped .nc-dot{border-radius:1px;width:7px;height:2px}
  .dag-node.status-cancelled .nc-dot{border-radius:1px;width:7px;height:2px;transform:rotate(-45deg)}          /* trait · rien n'a couru */                               /* anneau fin · vieux */
  .dag-node.status-pending .nc-dot{width:4px;height:4px}                               /* plus petit · au repos */      /* carré creux · en écriture */
  .dag-node.status-pending .nc-st{color:var(--nk-faint)}
  .dag-node.status-running .nc-st{color:var(--nk-st-running)}
  .dag-node.status-success .nc-st{color:var(--nk-st-done)}
  .dag-node.status-failed .nc-st{color:var(--nk-fail-text)}
  .dag-node.status-retrying .nc-st{color:var(--nk-st-retrying)}
  .dag-node.status-skipped .nc-st{color:var(--nk-st-muted)}
  .dag-node.status-cancelled .nc-st{color:var(--nk-st-muted)}
  .dag-node.status-running .nc-dot{animation:p 1.6s ease-in-out infinite}
  @keyframes p{0%,100%{opacity:1}50%{opacity:.28}}

  /* ── THE ONE BOLD MOMENT · the node takes itself apart ───────────────────
     Everything else on this page is quiet on purpose. This is where the
     restraint is spent: press X and each specimen separates into its named
     parts, so the anatomy stops being a caption and becomes the thing you are
     looking at. It teaches — which is why it survives reduced motion (the
     travel goes, the separation and the labels stay). */
  .stage[data-explode] .nc{background:transparent;border-color:transparent;overflow:visible;width:290px}
  .stage[data-explode] .nc > *{
    position:relative;border:1px dashed var(--nk-strong);border-radius:calc(var(--nk-radius) * .6);
    margin-bottom:26px;background:var(--nk-surface);
    transform:translateX(calc(var(--i) * 7px));
    transition:transform .46s var(--ease) calc(var(--i) * 45ms)}
  .stage[data-explode] .nc > *:last-child{margin-bottom:0}
  .stage[data-explode] .nc > *::after{
    content:attr(data-part);position:absolute;left:2px;top:calc(100% + 6px);
    font:10px/1.3 var(--mono);letter-spacing:.05em;color:var(--nk-faint);white-space:nowrap}
  .stage[data-explode] .nc-head{border-bottom-style:dashed}
  @media (prefers-reduced-motion:reduce){
    .dag-node.status-running .nc-dot{animation:none}
    .stage,.nc,.stage[data-explode] .nc > *{transition:none}
    .stage[data-explode] .nc > *{transform:none}
  }

  /* ── LA MATRICE · tous les cas, d'un seul écran ─────────────────────────
     Quatre verbes en colonnes, huit états en lignes. Le nœud prend la largeur
     de sa colonne : c'est la comparaison qui compte, pas la taille. */
  .matrix{display:grid;grid-template-columns:minmax(104px,132px) repeat(4,minmax(0,1fr));
    gap:10px;align-items:start;min-width:820px}
  .matrix .nc{width:100%}
  .mtx-corner{}
  .mtx-vhead{font:500 10px/1 var(--mono);letter-spacing:.09em;text-transform:uppercase;
    color:var(--nk-dim);padding-bottom:4px;border-bottom:1px solid var(--nk-edge)}
  .mtx-shead{display:grid;gap:3px;padding-top:6px;font:500 10px/1.3 var(--mono);
    letter-spacing:.06em;text-transform:uppercase;color:var(--nk-caption)}
  .mtx-shead em{font:11px/1.35 var(--sans);font-style:normal;letter-spacing:0;
    text-transform:none;color:var(--nk-faint)}
  .mtx-cell{min-width:0}

  /* ── la typographie ─────────────────────────────────────────────────── */
  .typ-faces{display:grid;gap:22px}
  .typ-face{display:grid;gap:7px;padding-bottom:18px;border-bottom:1px solid var(--nk-edge)}
  .typ-face:last-child{border-bottom:0;padding-bottom:0}
  .typ-face-k{display:flex;align-items:baseline;gap:10px;font:500 11px/1 var(--mono);letter-spacing:.06em}
  .typ-face-k b{color:var(--nk-ink);font-size:13px;letter-spacing:0}
  .typ-face-k code{color:var(--nk-dim);background:none;padding:0}
  .typ-face-role{font:11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--nk-caption)}
  .typ-sample{color:var(--nk-ink);line-height:1.18;letter-spacing:-.01em}
  .typ-face-note{font:12px/1.5 var(--sans);color:var(--nk-caption);max-width:64ch}
  .typ-scale{width:100%;border-collapse:collapse}
  .typ-scale td,.typ-scale th{padding:9px 12px 9px 0;border-bottom:1px solid var(--nk-edge);
    vertical-align:baseline;text-align:left}
  .typ-scale th{font:500 10px/1 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--nk-caption)}
  .typ-scale th em{font-style:normal;color:var(--nk-faint)}
  .typ-n{white-space:nowrap;font:11px/1 var(--mono);color:var(--nk-dim);width:1%}
  .typ-n code{background:none;padding:0;color:inherit}
  .typ-v{font:11px/1 var(--mono);color:var(--nk-faint);font-variant-numeric:tabular-nums;white-space:nowrap}
  .typ-s{color:var(--nk-ink);line-height:1.1;font-family:var(--display)}
  .typ-note{font:11px/1.4 var(--sans);color:var(--nk-caption);max-width:42ch}
  .typ-warn{font:10px/1 var(--mono);color:var(--nk-fail-text);letter-spacing:.05em;vertical-align:2px}
  /* 12px pour de la prose lue en continu ne passe pas le plancher du CORPS
     (Lc 90 à cette taille) quelle que soit la couleur. La taille était le
     problème, pas la teinte. */
  .typ-legend{margin:16px 0 0;font:14px/1.62 var(--sans);color:var(--nk-prose);max-width:70ch}
  .typ-legend b{color:var(--nk-dim)}
  .typ-frontier{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:26px}
  .typ-side{display:grid;gap:9px;align-content:start}
  .typ-arg{margin:0;font-family:var(--headline);font-size:var(--type-h3);line-height:1.14;
    letter-spacing:-.015em;color:var(--nk-ink)}
  .typ-arg-body{margin:0;font-family:var(--display);font-size:var(--type-body-sm);
    line-height:1.6;color:var(--nk-dim);max-width:44ch}
  .typ-proof{margin:0;padding:11px 13px;border-radius:calc(var(--nk-radius) * .6);
    background:rgb(0 0 0 / .24);box-shadow:var(--well-inset);
    font-family:var(--mono);font-size:var(--type-plate);line-height:1.55;color:var(--nk-dim);
    white-space:pre-wrap;overflow-x:auto}
  .typ-plate{margin:0;font-family:var(--mono);font-size:var(--type-mini);letter-spacing:.06em;
    color:var(--nk-caption)}

  /* ── la matière ─────────────────────────────────────────────────────── */
  .mat-anatomy{display:grid;grid-template-columns:auto minmax(0,1fr);gap:28px;align-items:start}
  @media (max-width:719.98px){.mat-anatomy{grid-template-columns:1fr}}
  .mat-big{width:300px}
  .mat-calls{list-style:none;margin:0;padding:0;display:grid;gap:11px;max-width:62ch}
  /* une seule colonne de texte · le repère et le nom en tête de ligne, la
     valeur en ligne dans la phrase. Trois colonnes poussaient le code à droite
     et hachaient la lecture. */
  .mat-calls li{font:12px/1.6 var(--sans);color:var(--nk-caption);
    padding-left:1.9em;text-indent:-1.9em}
  .mat-calls b{font:12px/1 var(--mono);color:var(--nk-ink)}
  .mat-calls > li > span{font:500 11px/1 var(--mono);letter-spacing:.05em;text-transform:uppercase;
    color:var(--nk-dim);white-space:nowrap;margin-right:2px}
  .mat-calls b{margin-right:6px}
  .mat-calls code{font-size:10px;background:rgb(0 0 0 / .22);color:var(--nk-dim);
    padding:1px 5px;border-radius:3px}
  .mat-calls em{font-style:normal;color:var(--nk-ink)}
  .mat-lamps{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:18px}
  .mat-lamp{display:grid;gap:8px}
  .mat-lamp-room{position:relative;isolation:isolate;display:grid;grid-template-columns:repeat(2,1fr);
    gap:8px;padding:14px;border-radius:var(--nk-radius);background:var(--nk-bg)}
  .mat-lamp-room::after{content:'';position:absolute;inset:0;z-index:3;pointer-events:none;
    border-radius:inherit;mix-blend-mode:plus-lighter;
    background:radial-gradient(70% 90% at var(--lamp-x) var(--lamp-y),
      rgb(255 255 255 / calc(var(--lamp-core) * .62)) 0%,
      rgb(255 255 255 / calc(var(--lamp-core) * .2)) 40%, transparent 72%)}
  .mat-tile{height:38px;border-radius:calc(var(--nk-radius) * .8);
    background:color-mix(in oklch,var(--t) 12%,var(--nk-surface));
    box-shadow:inset 0 1px 0 rgb(255 255 255 / var(--nk-bevel)),var(--nk-contact)}
  .mat-curves{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:22px}
  .mat-curve{display:grid;gap:7px}
  .mat-curve svg{width:100%;height:52px;overflow:visible}
  .mat-axis{stroke:var(--nk-strong);stroke-width:1;stroke-dasharray:3 3;vector-effect:non-scaling-stroke}
  .mat-path{fill:none;stroke:var(--nk-infer);stroke-width:1.5;vector-effect:non-scaling-stroke;
    stroke-linejoin:round;stroke-linecap:round}

  /* une marque n'est pas un statut · elle se pose PAR-DESSUS, en trait
     pointillé, pour qu'on lise « et aussi » plutôt que « au lieu de » */
  .nc-stale{border-style:dashed;color:var(--nk-caption);--chip:var(--nk-strong)}
  .nc[data-mark]{border-style:dashed}

  .sw{display:grid;gap:5px}
  .sw i{height:40px;border-radius:calc(var(--nk-radius) * .85);border:1px solid color-mix(in oklch,var(--nk-ink) 12%,transparent)}
  .sw b{font:500 10px/1 var(--mono);letter-spacing:.04em;color:var(--nk-dim)}
  .sw span{font:10px/1 var(--mono);color:var(--nk-faint);font-variant-numeric:tabular-nums}
  .curs{padding:14px 16px;border-radius:var(--nk-radius);background:var(--nk-surface);
    box-shadow:inset 0 1px 0 rgb(255 255 255 / var(--nk-bevel)),var(--nk-contact);gap:6px}
  .curs-say{font-size:calc(var(--nk-fs) + .5px);color:var(--nk-caption)}

  /* ── le verre · la seconde primitive ─────────────────────────────────── */
  .gl-demo{position:relative;padding:22px;border-radius:var(--nk-radius);background:var(--nk-bg);overflow:hidden}
  .gl-behind{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
  .gl-card{height:52px;border-radius:calc(var(--nk-radius) * .8);
    background:color-mix(in oklch,var(--t) 16%,var(--nk-surface));
    box-shadow:inset 0 1px 0 rgb(255 255 255 / var(--nk-bevel)),var(--nk-contact)}
  .gl-bar{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);
    display:flex;align-items:center;gap:10px;padding:8px 13px;
    border-radius:999px;border:1px solid rgb(255 255 255 / var(--nk-glass-border));
    background:color-mix(in oklch,var(--nk-surface) calc(var(--nk-glass-tint) * 100%),transparent);
    backdrop-filter:blur(var(--nk-glass-blur)) saturate(var(--nk-glass-saturate));
    box-shadow:var(--nk-contact),var(--nk-ambient);white-space:nowrap}
  .gl-bar::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
    opacity:var(--nk-glass-grain);background-image:repeating-conic-gradient(#fff 0% 25%,transparent 0% 50%);
    background-size:3px 3px;mix-blend-mode:overlay}
  .gl-k{font:500 10px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--nk-caption)}
  .gl-pill{font:500 11px/1 var(--mono);padding:5px 9px;border-radius:999px;
    background:rgb(255 255 255 / .06);color:var(--nk-caption)}
  .gl-sep{width:1px;height:16px;background:var(--nk-strong)}

  /* ── les formes de graphe ────────────────────────────────────────────── */
  .mg{position:relative;padding:4px 0}
  .mg-wires{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
  .mg-grid{position:relative;z-index:2;display:grid;grid-template-columns:repeat(var(--w),minmax(0,1fr));
    gap:7px 26px;align-items:start;justify-items:start}
  .mg-node{display:block;width:100%;padding:5px 8px;border-radius:calc(var(--nk-radius) * .7);
    background:var(--nk-surface);border:1px solid var(--nk-edge);
    box-shadow:inset 0 1px 0 rgb(255 255 255 / var(--nk-bevel)),var(--nk-contact);
    font-family:var(--mono);font-size:calc(var(--nk-fs) - 1.5px);color:var(--nk-caption);
    text-align:center;letter-spacing:.03em}
  .mg-edge{fill:none;stroke:var(--nk-strong);stroke-width:1.2;stroke-opacity:.55;
    vector-effect:non-scaling-stroke}
  .mg-empty{padding:16px 12px;border:1px dashed var(--nk-strong);border-radius:var(--nk-radius);
    font-family:var(--mono);font-size:calc(var(--nk-fs) - 1.5px);color:var(--nk-caption);
    text-align:center;letter-spacing:.04em}

  /* les états forcés · exactement les mêmes déclarations que les vraies, mais
     déclenchées par un attribut, pour qu'une vitrine ne puisse pas diverger */
  .nc[data-force='hover'],.nc[data-force='focus']{
    transform:translateY(calc(var(--nk-lift) * -1));
    box-shadow:inset 0 1px 0 rgb(255 255 255 / var(--nk-bevel-lit)),var(--nk-contact),
      0 calc(var(--nk-lift) * 13) calc(var(--nk-lift) * 18) -28px rgb(0 0 0 / .62)}
  .nc[data-force='focus']{outline:2px solid var(--nk-verb);outline-offset:3px}
  .nc[data-force='select']{border-color:color-mix(in oklch,var(--nk-verb) 62%,var(--nk-edge));
    box-shadow:inset 0 1px 0 rgb(255 255 255 / var(--nk-bevel-lit)),
      0 0 0 1px color-mix(in oklch,var(--nk-verb) 30%,transparent),
      var(--nk-contact),var(--nk-ambient)}
  .nc[data-force='dim']{opacity:.42}

  /* ── le playground ──────────────────────────────────────────────────────
     Le graphe et ses fils partagent un seul repère : les arêtes sont tracées
     au runtime depuis les rectangles réels des nœuds, donc elles restent
     justes quand la grille se réagence. */
  .pg-wrap{position:relative;min-width:760px}
  .pg-wires{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;overflow:visible}
  .pg-grid{position:relative;z-index:2;display:grid;
    grid-template-columns:repeat(var(--waves),minmax(0,1fr));
    gap:16px 40px;align-items:start}
  .pg-node{width:100%;cursor:pointer;outline-offset:3px}
  .pg-node:focus-visible{outline:2px solid var(--nk-infer)}
  .pg-line{font-size:calc(var(--nk-fs) - 1.5px);color:var(--nk-caption);letter-spacing:.04em}
  .pg-edge{fill:none;stroke:var(--nk-strong);stroke-width:1.4;vector-effect:non-scaling-stroke;
    transition:stroke var(--nk-dur) var(--ease),stroke-opacity var(--nk-dur) var(--ease);
    stroke-opacity:.5}
  /* une arête dont la source a réussi porte le courant · les autres restent éteintes */
  .pg-edge[data-live]{stroke:var(--nk-st-done);stroke-opacity:.9}
  .pg-edge[data-dead]{stroke:var(--nk-fail);stroke-opacity:.75;stroke-dasharray:4 3}
  .pg-arrow{fill:var(--nk-strong)}
  @media (prefers-reduced-motion:reduce){.pg-edge{transition:none}}

  /* ── les surfaces · trois pages, la même plaque ──────────────────────── */
  .srf-word,.srf-ns{display:grid;padding:7px 10px;font-family:var(--mono);width:auto}
  .srf-word{grid-template-columns:1fr auto;gap:8px;align-items:baseline}
  .srf-ns{grid-template-columns:1fr auto;gap:2px 10px;
    border-left:2px solid color-mix(in srgb,var(--nk-fail) 55%,transparent)}
  .srf-w{font-size:var(--nk-fs);color:var(--nk-ink)}
  .srf-n{font-size:calc(var(--nk-fs) - 1.5px);color:var(--nk-caption);font-variant-numeric:tabular-nums}
  .srf-big{font-size:calc(var(--nk-fs) + 3px);color:var(--nk-ink);grid-row:span 2;align-self:center;
    font-variant-numeric:tabular-nums}
  .srf-cat{font-size:calc(var(--nk-fs) - 2px);color:var(--nk-caption)}
  .srf-row{display:grid;grid-template-columns:112px 1fr 44px;gap:9px;align-items:center;
    padding:3px 0;font-family:var(--mono);font-size:calc(var(--nk-fs) - 1.5px);color:var(--nk-caption)}
  .srf-row--keyed .srf-name{color:var(--nk-caption)}
  .srf-name{color:var(--nk-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .srf-track{position:relative;height:9px;border-radius:5px;background:rgb(0 0 0 / .24);
    box-shadow:var(--well-inset)}
  .srf-bar{position:absolute;inset:2px auto 2px 2px;width:46%;border-radius:3px;
    background:color-mix(in srgb,var(--nk-infer) 40%,transparent)}
  .srf-bar--dim{width:64%;background:color-mix(in srgb,var(--nk-ink) 16%,transparent)}
  .srf-dot{position:absolute;top:50%;left:46%;width:5px;height:5px;margin:-2.5px 0 0 -2.5px;
    border-radius:50%;background:var(--nk-infer)}
  .srf-dot--dim{left:64%;background:var(--nk-dim)}
  .srf-ctx{text-align:right;font-variant-numeric:tabular-nums}

  .sw-eq{font-style:normal;color:var(--nk-dim)}
  .swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px}

  .tw{overflow-x:auto;border:1px solid var(--room-line);border-radius:10px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--room-line)}
  th{font:500 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--room-faint)}
  td:first-child{font-family:var(--mono);font-size:12px;white-space:nowrap}
  td code{font-size:11px}
  .bind-g{display:inline-block;width:1.1em;text-align:center}
  .lg-yes{color:#1f8a5c;font-weight:600}.lg-no{color:#c2410c;font-weight:600}
  .lg-mid{color:#a16207;font-weight:600}
  @media (prefers-color-scheme:dark){.lg-yes{color:#34d399}.lg-no{color:#ff9a6f}.lg-mid{color:#fbbf24}}

  /* the control · what the light does to the text */
  .apca{width:100%;border-collapse:collapse;font-size:13px}
  .apca td{padding:7px 12px;border-bottom:1px solid var(--room-line)}
  .apca .lc{font-family:var(--mono);font-variant-numeric:tabular-nums;text-align:right;width:5.5em}
  .apca .need{font-family:var(--mono);font-size:11px;color:var(--room-faint);text-align:right;width:6em}
  .apca .v{width:9em;font:500 11px/1 var(--mono);letter-spacing:.05em}
  .apca .v[data-ok="1"]{color:#1f8a5c}.apca .v[data-ok="0"]{color:#c2410c}
  @media (prefers-color-scheme:dark){.apca .v[data-ok="1"]{color:#34d399}.apca .v[data-ok="0"]{color:#ff9a6f}}
  .apca-sub{font-size:11px;color:var(--room-faint)}
  footer{margin-top:56px;padding-top:20px;border-top:1px solid var(--room-line);color:var(--room-faint);font-size:13px}
  footer p{max-width:78ch}
</style>

<div class="wrap">
  <header>
    <p class="kicker">nika · design system · atelier · généré</p>
    <h1>Le système, sous une lumière qu’on peut changer et des mesures qu’on peut bouger</h1>
    <p class="lede">
      Cette page est une <b>projection</b>, pas un dessin : la palette vient de
      <code>design-tokens.generated.ts</code>, les couches de <code>design.generated.css</code>,
      la matière — la plaque, la lampe, les courbes — de <code>nika-spec design/tokens.yaml</code>,
      qui est aussi ce que dessinent le canvas VS Code et le site. Elle s’ouvre hors-ligne, depuis un checkout, sans serveur.
      Les curseurs bougent tous les spécimens à la fois, le contrôle dit ce que ça coûte
      aux textes, et le diff en bas dit quoi coller — <b>et dans quel fichier</b>.
    </p>
  </header>

  <div class="console">
    <span class="console-k">plateau</span>
    <span class="seg" role="group" aria-label="Palette du plateau">
      <button type="button" data-skin="brand" aria-pressed="true">marque</button>
      <button type="button" data-skin="theme" aria-pressed="false">thème IDE</button>
    </span>
    <span class="console-k">salle</span>
    <span class="seg" role="group" aria-label="Thème de la page">
      <button type="button" data-room="auto" aria-pressed="true">auto</button>
      <button type="button" data-room="light" aria-pressed="false">clair</button>
      <button type="button" data-room="dark" aria-pressed="false">sombre</button>
    </span>
    <button type="button" class="btn" id="explode" aria-pressed="false">démonter</button>
    <span class="console-k">sol</span>
    <span class="seg" role="group" aria-label="La trame">
      <button type="button" data-grid="near" aria-pressed="true">près</button>
      <button type="button" data-grid="far" aria-pressed="false">loin</button>
      <button type="button" data-grid="off" aria-pressed="false">sans</button>
    </span>
    <span class="seg" role="group" aria-label="La vignette et le spot">
      <button type="button" data-gfx="running" aria-pressed="false">en cours</button>
      <button type="button" data-gfx="novign" aria-pressed="false">sans vignette</button>
      <button type="button" data-gfx="nospot" aria-pressed="false">sans lampe</button>
    </span>
    <span class="console-note"><kbd>T</kbd> plateau · <kbd>X</kbd> démonter · <kbd>0</kbd> réinitialiser</span>
  </div>
  <nav class="dex" id="dex" aria-label="Les sections du banc"></nav>

  <section>
    <div class="sec-head"><h2>L’atelier</h2><span class="sec-n">${KNOBS.length} mesures · ${KNOBS.filter((k) => k.home === 'spec').length} partagées</span></div>
    <p class="sec-note">
      Les mesures que toutes les surfaces se partagent — et depuis le 28 juillet elles se les
      partagent vraiment : chacune vient de <code>design/tokens.yaml</code> et arrive ici par la
      même projection que la palette. Le banc ne tient plus le canon, il le lit. Chaque curseur
      dit encore <b>où va son diff</b> — et la réponse est désormais la même pour les trois.
    </p>
    <div class="shop">
      <div class="desk">
${KNOBS.map(knobRow).join('\n')}
        <div class="desk-foot">
          <button type="button" class="btn" id="reset">réinitialiser</button>
          <span class="apca-sub" id="dirty">rien n’a bougé</span>
        </div>
      </div>
      <div class="stage nk-ground" data-stage><div class="rack">
${Object.keys(ANATOMY).map((v) => `        <div class="cell"><span class="cell-k">${v} · ${ANATOMY[v].join(' · ')}</span>${renderNode(v, { state: v === 'agent' ? 'running' : 'pending' })}</div>`).join('\n')}
      </div></div>
    </div>
    <div class="diff">
      <div class="diff-head"><b>le diff</b><button type="button" class="btn" id="copy">copier</button></div>
      <pre id="diffout">Bouge un curseur : le diff s’écrit ici, groupé par fichier.</pre>
    </div>
  </section>

  <section>
    <div class="sec-head"><h2>La typographie</h2><span class="sec-n">3 faces · ${TYPE_STEPS.length} marches · ${WEIGHTS.length} graisses</span></div>
    <p class="sec-note">
      La couche qu’on a mis le plus de temps à verrouiller et qu’on ne voyait nulle part.
      Le site tournait sur <b>81 tailles distinctes</b>, dont 241 déclarations en demi-pixel,
      et sur <b>neuf graisses</b>. Tout est lu ici dans <code>tokens.css</code> : une marche qui
      bouge dans le SSOT bouge sur cette page à la génération suivante.
    </p>

    <div class="stage nk-ground" data-stage>
      <div class="typ-faces">
${FACES.map((f) => `        <div class="typ-face">
          <div class="typ-face-k"><b>${esc(f.face)}</b><code>${f.varname}</code></div>
          <div class="typ-face-role">${esc(f.role)}</div>
          <div class="typ-sample" style="font-family:var(${f.varname});font-size:${f.size};font-weight:${f.weight}">${esc(f.sample)}</div>
          <div class="typ-face-note">${esc(f.note)}</div>
        </div>`).join('\n')}
      </div>
    </div>

    <div class="sec-head" style="margin-top:26px"><h2 style="font-size:15px">L’échelle</h2><span class="sec-n">plus jamais un demi-pixel</span></div>
    <div class="stage nk-ground" data-stage>
      <table class="typ-scale">
${TYPE_STEPS.map((t) => `        <tr>
          <td class="typ-n"><code>--type-${t.name}</code></td>
          <td class="typ-v">${esc(t.value)}</td>
          <td class="typ-s" style="font-size:${t.value}">Intent as Code</td>
          <td class="typ-note">${esc(t.note)}</td>
        </tr>`).join('\n')}
      </table>
    </div>

    <div class="sec-head" style="margin-top:26px"><h2 style="font-size:15px">Les graisses</h2><span class="sec-n">quatre, parce que le display n’a que trois coupes</span></div>
    <div class="stage nk-ground" data-stage>
      <table class="typ-scale typ-weights">
        <tr><th></th><th>Martian Grotesk <em>variable</em></th><th>Clash Display <em>coupes statiques</em></th></tr>
${WEIGHTS.map((w) => `        <tr>
          <td class="typ-n"><code>--fw-${w.name}</code> <span class="typ-v">${w.value}</span></td>
          <td class="typ-s" style="font-family:var(--display);font-weight:${w.value};font-size:var(--type-h3)">Aa Nika ${w.value}</td>
          <td class="typ-s" style="font-family:var(--headline);font-weight:${w.value};font-size:var(--type-h3)">Aa Nika ${w.value}${w.value === 400 ? ' <span class="typ-warn">↯ synthétisée</span>' : ''}</td>
        </tr>`).join('\n')}
      </table>
      <p class="typ-legend">
        Clash ne livre que <b>500 · 600 · 700</b>. Demander 400 au navigateur ne donne pas 400 :
        ça donne une graisse <b>fabriquée</b>, les glyphes étirés par le rastériseur. C’est un
        vrai défaut typographique et il est invisible en relecture — d’où le gate qui épingle le
        jeu de jetons aux <code>@font-face</code> réellement déclarés.
      </p>
    </div>

    <div class="sec-head" style="margin-top:26px"><h2 style="font-size:15px">La frontière</h2><span class="sec-n">l’argument · la preuve</span></div>
    <div class="stage nk-ground" data-stage>
      <div class="typ-frontier">
        <div class="typ-side">
          <span class="cell-k">l’argument</span>
          <p class="typ-arg">Useful AI work shouldn’t disappear into chats.</p>
          <p class="typ-arg-body">Nika turns repeatable AI work into files you can run, review, diff and share — audited before a token is spent.</p>
          <span class="cell-note">Clash pour le titre, le grotesque pour la prose · une seule famille, deux échelles</span>
        </div>
        <div class="typ-side">
          <span class="cell-k">la preuve</span>
          <pre class="typ-proof">permits:
  fs: { read: [ ./notes/* ], write: [ ./brief.md ] }
  tools: [ "nika:read", "nika:write" ]</pre>
          <p class="typ-plate">audited · 7 tasks · 4 waves · permits declared</p>
          <span class="cell-note">Martian Mono · le code, les jetons, les comptes, les plaques de provenance</span>
        </div>
      </div>
      <p class="typ-legend">
        La frontière <b>est</b> le message : la prose argumente, le mono prouve. Un mot du langage
        cité <em>dans</em> une phrase reste en mono — c’est la seule traversée autorisée, et elle
        est ce qui rend la frontière lisible plutôt que rigide.
      </p>
    </div>
  </section>

  <section>
    <div class="sec-head"><h2>Les couleurs</h2><span class="sec-n">${Object.keys(VERB_HEX).length} verbes · ${LAYERS.length} couches · ${Object.keys(STATUS).length} statuts · ${Object.keys(ROLE_WORDS).length} rôles</span></div>
    <p class="sec-note">
      Valeurs lues dans les projections, jamais retapées. Et une seule idée les tient :
      <b>aucune famille n’invente une teinte</b>. Les sept couches réutilisent celles des verbes
      et des sévérités par construction — ${COLLISIONS.length} des ${LAYERS.length} sont
      littéralement le même hex. Une quatrième palette entrerait en collision ou quitterait le SSOT.
    </p>

    <div class="stage nk-ground" data-stage>
      <span class="cell-k">les quatre verbes · un modèle d’exécution natif chacun</span>
      <div class="swatches" style="margin-top:10px">
${Object.entries(VERB_HEX).map(([k, v]) => `        <div class="sw"><i style="background:${v}"></i><b><span style="color:${v}">${VERB_GLYPH[k]}</span> ${k}</b><span>${v}</span></div>`).join('\n')}
      </div>

      <span class="cell-k" style="display:block;margin-top:24px">les sept couches · ce qu’une ligne du fichier <em>est</em></span>
      <div class="swatches" style="margin-top:10px">
${LAYERS.map((l) => {
  const hex = LAYER_HEX[l]
  const from = COLLISIONS.find((c) => c[0] === l)
  return `        <div class="sw"><i style="background:${hex}"></i><b>${l}</b><span>${hex}${from ? ` <em class="sw-eq">= ${from[1]}</em>` : ''}</span></div>`
}).join('\n')}
      </div>

      <span class="cell-k" style="display:block;margin-top:24px">sévérité et statuts · ce que la trace rapporte</span>
      <div class="swatches" style="margin-top:10px">
${swatch('ok', SEVERITY.ok)}
${swatch('fail', SEVERITY.fail)}
${swatch('fail-text', SEVERITY_TEXT.fail)}
${Object.entries(STATUS).map(([k, v]) => swatch(k, v)).join('\n')}
      </div>

      <p class="typ-legend">
        <code>fail</code> est la teinte de <b>remplissage</b> ; <code>fail-text</code> est sa
        jumelle lisible. Le banc portait la première sur sa pastille « refusé » — l’état qu’on a
        le plus besoin de lire était le plus dur à lire, à Lc 45. Le bon jeton existait déjà.
      </p>
    </div>
  </section>

  <section>
    <div class="sec-head"><h2>La matière</h2><span class="sec-n">la plaque · la lampe · les ressorts</span></div>
    <p class="sec-note">
      Un seul objet physique, projeté depuis <code>nika-spec design/tokens.yaml</code> vers les
      trois surfaces. Ce ne sont pas des ombres décoratives : la lumière a une <b>direction</b>,
      les arêtes la <b>captent</b>, le code est <b>gravé</b> dans la plaque et non posé dessus.
    </p>

    <div class="stage nk-ground" data-stage>
      <div class="mat-anatomy">
        <article class="dag-node verb-infer status-pending mat-big"><div class="nc">
          <div class="nc-head"><span class="nc-tile">${VERB_GLYPH.infer}</span><span class="nc-id">triage</span><span class="nc-badge">infer</span></div>
          <div class="nc-sub"><span class="nc-sub-k"><b class="bx-k">model</b> mistral/mistral-large-latest</span></div>
          <div class="nc-body">« Flag what is urgent »</div>
          <div class="nc-policy"><span class="nc-chip" style="--chip:var(--nk-flow)">with · inbox</span><span class="nc-chip">max_tokens 300</span></div>
        </div></article>
        <ol class="mat-calls">
          <li><b>①</b> <span>le biseau</span> <code>inset 0 1px 0 · ${MAT.plate.bevel}</code> — l’arête haute prend la lumière ; c’est elle, et rien d’autre, qui dit d’où elle vient</li>
          <li><b>②</b> <span>le grain</span> <code>opacity ${MAT.plate.grain}</code> — un dither de Bayer, jamais un bruit lisse : le papier a une trame, pas un flou</li>
          <li><b>③</b> <span>le puits</span> <code>inset 0 1px 2px · ${MAT.well.inset_alpha}</code> — l’exact inverse du biseau : ombre en haut, lueur en bas. Cette inversion est <em>tout</em> ce qui fait lire « gravé »</li>
          <li><b>④</b> <span>le contact</span> <code>0 ${MAT.plate.contact.y_px}px ${MAT.plate.contact.blur_px}px</code> — l’ombre courte, là où la plaque touche</li>
          <li><b>⑤</b> <span>l’ambiance</span> <code>0 ${MAT.plate.ambient.y_px}px ${MAT.plate.ambient.blur_px}px ${MAT.plate.ambient.spread_px}px</code> — l’ombre longue, là où elle pend</li>
          <li><b>⑥</b> <span>la levée</span> <code>${MAT.plate.lift_px}px · ${MAT.motion.lift_ms}ms</code> — au survol, six choses bougent ensemble ou aucune</li>
        </ol>
      </div>
    </div>

    <div class="sec-head" style="margin-top:26px"><h2 style="font-size:15px">Le verre</h2><span class="sec-n">la seconde primitive · trouvée dans le canvas, pas décidée</span></div>
    <div class="stage nk-ground" data-stage>
      <div class="gl-demo">
        <div class="gl-behind">
${['infer', 'exec', 'invoke', 'agent', 'infer', 'exec'].map((v) => `          <span class="gl-card" style="--t:var(--nk-${v})"></span>`).join('\n')}
        </div>
        <div class="gl-bar">
          <span class="gl-k">le run</span>
          <span class="gl-pill">▶ jouer</span>
          <span class="gl-pill">pas à pas</span>
          <span class="gl-sep"></span>
          <span class="gl-k">7 tâches · 4 vagues</span>
        </div>
      </div>
      <p class="typ-legend">
        <b>Une plaque se pose ; un verre flotte.</b> C’est toute la différence, et c’est pourquoi
        ils ne peuvent pas partager un jeton : la plaque prend un biseau parce que la lumière
        tombe sur son arête haute, le verre prend un flou parce que ce qui est derrière doit
        rester lisible comme de la <em>profondeur</em>, pas comme du contenu. Ils partagent le
        grain, parce qu’il n’y a qu’un papier.
      </p>
      <p class="typ-legend">
        Cette primitive n’a pas été décidée : elle a été <b>trouvée</b>. Treize sélecteurs
        distincts de <code>dag.css</code> portent la même recette à la main — barre d’outils,
        omnibar, rail du plan, scrubber, titre, pastille de statut, deux palettes, panneau de
        description, bandeau périmé, la marque. Vingt déclarations <code>backdrop-filter</code>,
        neuf en blur+saturate, et aucun nom partagé. C’est exactement la dette que le bloc
        <code>material</code> existe pour arrêter, debout juste à côté de lui.
      </p>
    </div>

    <div class="sec-head" style="margin-top:26px"><h2 style="font-size:15px">La lampe</h2><span class="sec-n">une par pièce, jamais une par carte</span></div>
    <div class="stage nk-ground" data-stage>
      <div class="mat-lamps">
${[['0', 'éteinte'], [String(MAT.lamp.core), MAT.lamp.core + ' · la valeur du SSOT'], ['0.55', '0.55 · un projecteur']].map(([core, label]) => `        <div class="mat-lamp" style="--lamp-core:${core};--lamp-x:26%;--lamp-y:18%">
          <span class="cell-k">${esc(label)}</span>
          <div class="mat-lamp-room">
${['infer', 'exec', 'invoke', 'agent'].map((v) => `            <span class="mat-tile" style="--t:var(--nk-${v})"></span>`).join('\n')}
          </div>
        </div>`).join('\n')}
      </div>
      <p class="typ-legend">
        <b>0.10 était invisible</b> : forcée à deux coins opposés de la même page, le rendu bougeait
        un échantillon sur 5394. Du code, du coût, aucun effet — pire que pas de lampe. Deux causes
        empilées : <code>soft-light</code> ne soulève presque rien sur un fond déjà noir, et la
        valeur était trop faible d’un ordre. La lumière <b>s’ajoute</b> maintenant.
      </p>
    </div>

    <div class="sec-head" style="margin-top:26px"><h2 style="font-size:15px">Les ressorts</h2><span class="sec-n">deux courbes, en CSS pur</span></div>
    <div class="stage nk-ground" data-stage>
      <div class="mat-curves">
${[['la levée', MAT.motion.ease_lift, MAT.motion.lift_ms], ['le tiroir', MAT.motion.ease_drawer, MAT.motion.drawer_ms]].map(([label, css, ms]) => {
  const c = plotEase(css)
  return `        <div class="mat-curve">
          <span class="cell-k">${esc(label)} · ${ms}ms · ${c.stops} points</span>
          <svg viewBox="0 0 240 52" preserveAspectRatio="none" aria-hidden>
            <line class="mat-axis" x1="0" y1="${c.one}" x2="240" y2="${c.one}"/>
            <path class="mat-path" d="${c.d}"/>
          </svg>
          <span class="cell-note">${c.over ? 'dépasse la cible puis revient — c’est ce qui donne la masse' : 'monte et se pose sans dépasser'}</span>
        </div>`
}).join('\n')}
      </div>
      <p class="typ-legend">
        <code>linear()</code> échantillonne la courbe : une valeur au-dessus de 1 est un
        dépassement, donc un ressort, en CSS pur et sans librairie. Les deux vivent dans le SSOT,
        donc le canvas VS Code — qui est une <em>webview</em>, même moteur — bouge exactement pareil.
      </p>
    </div>
  </section>

  <section>
    <div class="sec-head"><h2>La matrice</h2><span class="sec-n">${Object.keys(ANATOMY).length} verbes × ${STATES.length} états = ${Object.keys(ANATOMY).length * STATES.length} cas</span></div>
    <p class="sec-note">
      Tous les cas, d’un seul écran. Un état porté par la seule teinte meurt en contraste forcé
      et sous un œil daltonien, donc chacun doit un <b>second signal</b> — il est nommé dans la
      colonne de gauche. Et chaque cellule porte la ligne qu’un vrai run écrirait : un code de
      refus, un compteur d’essai, un coût, une trace périmée. Une case qui ne fait que changer
      de couleur n’apprend rien.
    </p>
    <div class="stage nk-ground" data-stage>
      <div class="matrix">
        <div class="mtx-corner"></div>
${Object.keys(ANATOMY).map((v) => `        <div class="mtx-vhead"><span style="color:var(--nk-${v})">${VERB_GLYPH[v]}</span> ${v}</div>`).join('\n')}
${STATES.map((st) => `        <div class="mtx-shead">${esc(st.label)}<em>${esc(st.form)}</em></div>
${Object.keys(ANATOMY).map((v) => `        <div class="mtx-cell">${renderNode(v, { state: st.id })}</div>`).join('\n')}`).join('\n')}
      </div>
    </div>
  </section>

  <section>
    <div class="sec-head"><h2>Les builtins</h2><span class="sec-n">${TOOLS.length} outils · ${CAT_ORDER.length} maisons</span></div>
    <p class="sec-note">
      Une carte par builtin, groupée par <b>maison</b>. Rien ici n’est écrit : les outils, leur
      catégorie, leurs arguments et ce qu’ils font viennent du catalogue que l’engine sert. La
      teinte de chaque maison vient de <code>builtin.category</code> — six alias, aucune couleur
      neuve — et le canvas VS Code peint la sienne avec les mêmes.
    </p>
${CAT_ORDER.map((cat) => `    <div class="cat-house">
      <p class="cat-head"><span class="nc-chip-icon nc-cat-${cat}">▪</span> ${cat}
        <span class="cat-n">${TOOLS.filter((t) => t.category === cat).length}</span>
        <span class="cat-hex">${CAT_HUE[cat]}</span></p>
      <div class="stage nk-ground bx-tools" data-stage>
${TOOLS.filter((t) => t.category === cat).map((t) => {
  const req = (t.args || []).filter((a) => a.required)
  const opt = (t.args || []).length - req.length
  return `        <article class="dag-node verb-invoke status-pending"><div class="nc">
          <div class="nc-head"><span class="nc-tile">${VERB_GLYPH.invoke}</span><span class="nc-id">${esc(t.bare)}</span>${
            previewOf(t.bare, cat) !== 'none' ? `<span class="bx-prev" title="créneau d’aperçu">${esc(previewOf(t.bare, cat))}</span>` : ''}</div>
          <div class="nc-sub"><span class="nc-sub-k"><span class="nc-chip-icon nc-cat-${cat}">${CAT_GLYPH[cat]}</span> ${esc(t.name)}</span></div>
          ${ESSENCE[t.bare] ? `<div class="nc-body bx-ess"><b class="bx-ess-k">${esc(ESSENCE[t.bare].arg)}</b><span class="bx-ess-r">${esc(ESSENCE[t.bare].render)}</span></div>` : ''}
          <div class="nc-body">${esc(t.description)}</div>
          <div class="nc-policy">${req.map((a) => `<span class="nc-chip">${esc(a.name)}</span>`).join('')}${
            opt ? `<span class="nc-chip bx-opt">+${opt} optionnel${opt > 1 ? 's' : ''}</span>` : ''}</div>
        </div></article>`
}).join('\n')}
      </div>
    </div>`).join('\n')}
    <p class="typ-legend">
      Les pastilles nommées sont les arguments <b>requis</b> ; le compte gris dit combien
      restent facultatifs. Un builtin sans pastille ne demande rien.
    </p>
  </section>

  <section>
   <div class="sec-head"><h2>Les marques</h2><span class="sec-n">le second axe · ${Object.keys(MARKS).length} · orthogonales au statut</span></div>
    <p class="sec-note">
      Un nœud porte <b>un</b> statut et <b>n</b> marques. Le banc les avait écrasés en une seule
      liste de huit, et c’est comme ça qu’il montrait « périmé » à côté de « réussi » comme si une
      tâche ne pouvait pas être les deux — <b>elle peut</b>, et la plupart des tâches finies le
      deviennent. Chacune est un fait de plus, pas un état de remplacement.
    </p>
    <div class="stage nk-ground" data-stage><div class="rack">
${Object.entries(MARKS).map(([id, means]) => `        <div class="cell"><span class="cell-k">${esc(id.replace('_', '-'))}</span>
          <article class="dag-node verb-exec status-success ${NODE_CLASSES.mark[id]}"><div class="nc">
            <div class="nc-head"><span class="nc-tile">${VERB_GLYPH.exec}</span><span class="nc-id">build</span><span class="nc-badge">exec</span></div>
            <div class="nc-policy"><span class="nc-st"><i class="nc-dot"></i>réussi</span><span class="nc-chip nc-stale">${esc(id.replace('_', '-'))}</span></div>
          </div></article>
          <span class="cell-note">${esc(means)}</span></div>`).join('\n')}
    </div></div>
    <p class="typ-legend">
      Toutes portées ici sur un nœud <b>réussi</b>, exprès : c’est la combinaison que l’ancienne
      liste rendait impossible à dire. <code>audit</code> se décline en
      ${AUDIT.join(' · ')} ; <code>dead-gate</code> est le seul qui promette que la tâche
      <em>ne courra jamais</em>.
    </p>
  </section>

  <section>
    <div class="sec-head"><h2>Les variantes</h2><span class="sec-n">${VARIANTS.length} cas limites</span></div>
    <p class="sec-note">
      Une galerie de chemins heureux est une brochure. Voici les formes qui cassent réellement
      une carte : un nom plus long que sa boîte, un prompt qui enroule quatre fois, une tâche
      qui n’a rien à déclarer, une autre qui a trop. Chacune est une chose qu’un auteur écrit
      pour de vrai, et donc une décision que le canvas a dû prendre.
    </p>
    <div class="stage nk-ground" data-stage><div class="rack">
${VARIANTS.map((v) => `        <div class="cell"><span class="cell-k">${esc(v.label)}</span>${renderNode(v.verb, { state: v.state ?? 'pending', spec: v.spec, anatomy: v.anatomy ?? ANATOMY[v.verb] })}<span class="cell-note">${esc(v.note)}</span></div>`).join('\n')}
    </div></div>
  </section>

  <section>
    <div class="sec-head"><h2>Les atomes</h2><span class="sec-n">les pièces, isolées</span></div>
    <p class="sec-note">Chaque pièce doit tenir seule avant de tenir dans un nœud. C’est là que la bascule de palette est la plus cruelle.</p>
    <div class="stage nk-ground" data-stage><div class="rack">
${ATOMS.map(atomBlock).join('\n')}
        <div class="cell" style="max-width:none;flex:1 1 100%">
          <span class="cell-k">pastilles d’état · <em>nc-st-*</em></span>
          <div class="chiprow">
${PILLS.map(([label, id]) => `            <span class="dag-node status-${id}"><span class="nc-st"><i class="nc-dot"></i>${esc(label)}</span></span>`).join('\n')}
          </div>
          <span class="cell-note">chacune porte une forme en plus de sa teinte · c’est ce qui la garde lisible en contraste forcé</span>
        </div>
    </div></div>
  </section>

  <section>
    <div class="sec-head"><h2>Les surfaces</h2><span class="sec-n">trois pages · la même plaque</span></div>
    <p class="sec-note">
      La preuve que le partage n’est pas une intention. Trois primitives construites le 28 juillet
      pour trois pages différentes — le mot dans <code>/language</code>, le tiroir de namespace
      dans <code>/errors</code>, la rangée d’axe dans <code>/providers</code> — et toutes trois
      sont <b>la même plaque</b> : même rayon, même biseau, mêmes deux ombres, même encre dérivée,
      même lampe. Aucune n’a redécidé quoi que ce soit.
    </p>
    <div class="stage nk-ground" data-stage>
      <div class="rack">
        <div class="cell">
          <span class="cell-k">/language · une cellule de mot</span>
          <div class="srf-word nc"><span class="srf-w">workflow</span><span class="srf-n">+1</span></div>
          <span class="cell-note">le liseré marque ce que le schéma <em>exige</em> ici · <code>+n</code> compte les autres blocs où le mot parle</span>
        </div>
        <div class="cell">
          <span class="cell-k">/errors · un tiroir de namespace</span>
          <div class="srf-ns nc" data-tone="reach">
            <span class="srf-w">SEC</span><span class="srf-big">9</span><span class="srf-cat">security</span>
          </div>
          <span class="cell-note">le liseré rouge dit que ce namespace garde une <em>portée</em>, pas une <em>forme</em> · dérivé de la catégorie dominante</span>
        </div>
        <div class="cell" style="max-width:340px">
          <span class="cell-k">/providers · une rangée d’axe</span>
          <div class="srf-row">
            <span class="srf-name">qwen3.5:4b</span>
            <span class="srf-track"><span class="srf-bar"></span><span class="srf-dot"></span></span>
            <span class="srf-ctx">128k</span>
          </div>
          <div class="srf-row srf-row--keyed">
            <span class="srf-name">claude-sonnet-4</span>
            <span class="srf-track"><span class="srf-bar srf-bar--dim"></span><span class="srf-dot srf-dot--dim"></span></span>
            <span class="srf-ctx">200k</span>
          </div>
          <span class="cell-note">le rail est <em>gravé</em> avec le même puits que le code · l’accent marque les modèles qui ne veulent aucune clé</span>
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="sec-head"><h2>Le playground</h2><span class="sec-n">${DAG.nodes.length} tâches · ${WAVES} vagues · ${DAG.edges.length} arêtes</span></div>
    <p class="sec-note">
      Un graphe qu’on <b>opère</b>, pas une galerie de plus. C’est <code>daily-brief</code>, le
      workflow que le héros du site montre déjà, avec ses vraies arêtes. <b>Clique un nœud</b> pour
      lui faire parcourir ses huit états ; <b>joue le run</b> pour le voir se dérouler vague par
      vague, comme une trace réelle l’écrirait. Les arêtes suivent : une arête dont la source n’a
      pas encore réussi reste éteinte.
    </p>
    <div class="console" style="position:static;margin:0 0 14px">
      <span class="console-k">le run</span>
      <span class="seg" role="group" aria-label="Le run">
        <button type="button" id="pg-play">▶ jouer</button>
        <button type="button" id="pg-step">pas à pas</button>
        <button type="button" id="pg-fail">faire échouer</button>
        <button type="button" id="pg-reset">au repos</button>
      </span>
      <span class="console-note" id="pg-say">sept tâches au repos · rien n’a encore tourné</span>
    </div>
    <div class="stage nk-ground" data-stage>
      <div class="pg-wrap">
        <svg class="pg-wires" aria-hidden><g id="pg-edges"></g></svg>
        <div class="pg-grid" style="--waves:${WAVES}">
${DAG.nodes.map(dagNode).join('\n')}
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="sec-head"><h2>Les formes</h2><span class="sec-n">${SHAPES.length} silhouettes que le layout doit tenir</span></div>
    <p class="sec-note">
      Un seul exemple ne montre jamais la disposition : il montre <em>sa</em> disposition. Voici
      les silhouettes qu’un fichier réel produit, y compris les deux cas dégénérés qu’on obtient
      sans les vouloir — la tâche unique, et le fichier qui parse sans rien déclarer. Même moteur,
      mêmes arêtes calculées au runtime : ce sont de vrais petits graphes, pas des icônes.
    </p>
    <div class="stage nk-ground" data-stage><div class="rack">
${SHAPES.map((sh) => `        <div class="cell" style="max-width:300px"><span class="cell-k">${esc(sh.label)}</span>
      ${miniGraph(sh)}
          <span class="cell-note">${esc(sh.note)}</span></div>`).join('\n')}
    </div></div>
  </section>

  <section>
    <div class="sec-head"><h2>Les interactions</h2><span class="sec-n">${FORCED.length} états, forcés côte à côte</span></div>
    <p class="sec-note">
      On ne peut pas survoler quatre cartes à la fois : un banc qui compte sur le pointeur ne
      montre jamais ses états d’interaction. Chacun est <b>forcé</b> ici, en appliquant exactement
      les mêmes règles que l’état réel — si la règle change, la vitrine change avec elle.
    </p>
    <div class="stage nk-ground" data-stage><div class="rack">
${FORCED.map((f) => `        <div class="cell"><span class="cell-k">${esc(f.label)}</span>
          <article class="dag-node verb-infer status-pending" data-force="${f.k}"><div class="nc">
            <div class="nc-head"><span class="nc-tile">${VERB_GLYPH.infer}</span><span class="nc-id">triage</span><span class="nc-badge">infer</span></div>
            <div class="nc-sub"><span class="nc-sub-k"><b class="bx-k">with</b> inbox</span></div>
            <div class="nc-body">« Flag what is urgent »</div>
          </div></article>
          <span class="cell-note">${esc(f.note)}</span></div>`).join('\n')}
    </div></div>
  </section>

  <section>
    <div class="sec-head"><h2>Le curseur</h2><span class="sec-n">${CURSORS.length} formes · aucune dessinée</span></div>
    <p class="sec-note">
      Le canvas n’a <b>aucun curseur dessiné</b>. Il a un vocabulaire natif où chaque forme dit
      ce que le geste va faire — et le recenser était le travail. En inventer un aurait refait
      l’erreur de la lampe blanche : ajouter au système une chose qu’il ne dit pas.
      Passe la souris sur un plateau : la nappe se saisit, et elle se tient au clic.
    </p>
    <div class="stage nk-ground" data-stage>
      <div class="rack">
${CURSORS.map(([css, means, where]) => `        <div class="cell curs" style="cursor:${css}">
          <span class="cell-k">${css}</span>
          <span class="curs-say">${esc(means)}</span>
          <span class="cell-note">${esc(where)}</span>
        </div>`).join('\n')}
      </div>
    </div>
  </section>

  <section>
    <div class="sec-head"><h2>Les liaisons</h2><span class="sec-n">un sens · trois orthographes</span></div>
    <p class="sec-note">
      La famille qui prouve que le système est <b>partagé</b> et pas seulement coordonné :
      chaque sens porte un glyphe pour nous, un codicon pour VS Code, un jeton pour le web.
      Ces trois colonnes sortent du même <code>design/tokens.yaml</code> — les changer d’un
      côté seulement est impossible par construction.
    </p>
    <div class="tw"><table>
      <thead><tr><th>le sens</th><th>codicon · vscode</th><th>et sur le web</th></tr></thead>
      <tbody>
${Object.keys(VERB_HEX).map((v) => bindingRow(v, VERB_GLYPH[v], VERB_CODICON[v], `<code>--nk-${v}</code> · <span style="color:var(--nk-${v})">■</span> ${VERB_HEX[v]}`)).join('\n')}
${Object.keys(ROLE_WORDS).map((r) => bindingRow(r, '·', ROLE_CODICON[r], `<code>${esc(ROLE_WEB[r])}</code> · marque <code>${esc(ROLE_MARK[r])}</code> · <code>${esc(ROLE_VSCODE[r])}</code>`)).join('\n')}
      </tbody>
    </table></div>
  </section>

  <section>
    <div class="sec-head"><h2>Le contrôle</h2><span class="sec-n">APCA · mesuré sur le rendu, pas sur les jetons</span></div>
    <p class="sec-note">
      Ce que la lumière fait aux textes. Chaque ligne compose réellement les fonds
      semi-transparents empilés sous le texte, puis calcule le <b>Lc</b> APCA et le compare
      au minimum que sa propre taille exige. Bascule le plateau sur <b>thème IDE</b>, ou monte
      <b>la force du trait</b>, et regarde qui tombe. C’est le gate visuel qu’on n’a pas encore
      en CI.
    </p>
    <div class="tw"><table class="apca"><tbody id="apcaout"></tbody></table></div>
    <p class="sec-note" style="margin:14px 0 0">
      Au réglage d’usine, sept lignes sont sous leur plancher et ce sont toutes des questions
      posées au canvas, pas au banc. Trois valent une décision : la <b>rangée mécanisme</b>
      (Lc 41 · elle porte le modèle, la capture, les arguments — ça se lit), le <b>corps de
      commande</b> (Lc 61 pour une ligne de shell qu’il faut lire à la lettre), et la pastille
      <b>sauté</b>, qui tombe à Lc 0 une fois l’opacité 0,52 de sa carte comptée — invisible,
      pas discrète. Les deux marginales (verbe · compteur, Lc 59,8 et 59,4) tiennent à la
      teinte de fond de la tête ; elles passent la barre en montant
      <b>la force du trait</b>, ce qui est exactement ce à quoi sert le curseur.
    </p>
  </section>

  <section>
    <div class="sec-head"><h2>Ce qui est synchronisé, ce qui ne l’est pas</h2>
      <span class="sec-n">${SYNC.length} concepts × 4 surfaces · mesuré, pas déclaré</span></div>
    <p class="sec-note">
      Chaque case est <b>constatée</b> : on cherche l’artefact dans l’arbre de la surface, puis
      on compte qui le nomme. Un ledger à trois états disait « projeté » sans jamais dire
      <em>vers qui</em> — et c’est ce mot-là qui cachait le fait le plus important de cette page.
      La colonne canvas vient de l’épingle <code>${PIN.sha}</code> : ce dépôt ne peut pas lire le
      voisin en intégration continue, alors il lit ce que l’épingle a constaté, et une dérive
      devient un diff daté au lieu d’un silence.
    </p>
    <div class="tw"><table class="mx-sync">
      <thead><tr><th>le concept</th><th>spec</th><th>canvas VS&nbsp;Code</th><th>site</th><th>ce banc</th></tr></thead>
      <tbody>
${SYNC.map((c) => {
  const cells = ['canvas', 'site', 'bench'].map((sf) => cellFor(c, sf))
  const src = c.own ? { s: '—', k: 'own' } : { s: 'source', k: 'src' }
  return `        <tr><td class="mx-what">${esc(c.row)}</td>`
    + `<td class="mx-c mx-${src.k}">${esc(src.s)}</td>`
    + cells.map((x) => `<td class="mx-c mx-${x.k}">${esc(x.s)}</td>`).join('')
    + '</tr>'
}).join('\n')}
      </tbody>
    </table></div>
    <p class="typ-legend">
      <b class="mx-lg mx-src">source</b> la spec le porte ·
      <b class="mx-lg mx-ok">reçoit</b> l’artefact est là et référencé ·
      <b class="mx-lg mx-mute">livré · muet</b> il est là, personne ne le lit ·
      <b class="mx-lg mx-gap">jamais livré</b> il n’est pas arrivé ·
      <b class="mx-lg mx-own">écrit</b> la surface tient sa propre version.
    </p>
    <p class="sec-note mx-verdict">
      <b>Le verdict.</b> Le site et ce banc reçoivent tout ce que la spec projette. Le canvas
      reçoit le module de jetons — mais sa copie est en retard de
      <b>${(() => { const miss = SYNC.filter((c) => c.sym && PIN.symbols?.[c.sym] === undefined).length; return miss })()}
      symboles</b>, et les deux feuilles qu’on lui projette ne lui ont
      <b>jamais été livrées</b>. Ce n’est pas de la négligence : une autre session tient ce
      dépôt, et la règle de cet atelier est de ne jamais y écrire pendant ce temps. Le trou est
      donc <em>délibéré</em> — ce tableau existe pour qu’il reste <em>visible</em>.
    </p>
  </section>

  <footer>
    <p>
      Généré par <code>design/bench.mjs</code> · régénérer <code>node design/bench.mjs</code> ·
      la dérive est gatée par <code>--check</code>. L’anatomie du nœud reste un canon de travail
      relevé sur le canvas livré ; la matière, elle, a rejoint
      <code>nika-spec design/tokens.yaml</code> le 28 juillet et n’est plus écrite ici. Les réglages restent dans ce navigateur — rien ne part nulle part.
    </p>
    <p>
      Le contrôle APCA implémente la formule 0.1.9. Chaque sonde déclare ce qu’elle est :
      <b>corps</b> (lu en continu · table des tailles · 36 px → 45 · 24 px ou 16 px gras → 60 ·
      14 px → 75 · plus petit → 90), <b>ponctuel</b> (lu d’un coup d’œil · Lc 60) ou
      <b>effacé</b> (volontairement en retrait · Lc 30, le seuil de discernabilité). Sans cette
      distinction le premier jet criait au loup — dix échecs sur douze, dont neuf faux. C’est une
      aide au jugement, pas une certification.
    </p>
  </footer>
</div>

<script>
  var KNOBS = ${JSON.stringify(KNOBS.map(({ id, css, unit, def, home, key }) => ({ id, css, unit, def, home, key })))};
  var HOMES = ${JSON.stringify(HOMES)};
  var STORE = 'nika-bench-v2';
  var stages = document.querySelectorAll('[data-stage]');
  var state = { skin: 'brand', room: 'auto', explode: false, knobs: {} };

  /* ── persistence · your session survives a reload, and never leaves here ── */
  try {
    var saved = JSON.parse(localStorage.getItem(STORE) || '{}');
    if (saved && typeof saved === 'object') state = Object.assign(state, saved);
  } catch (e) { /* a corrupt store is not worth a broken page */ }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  /* small DOM helpers · this page builds nodes, it never assigns markup */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ── APCA 0.1.9 · the readout that turns this page into an instrument ───── */
  function sRGBtoY(rgb) {
    var f = function (c) { return Math.pow(c / 255, 2.4); };
    return 0.2126729 * f(rgb[0]) + 0.7151522 * f(rgb[1]) + 0.0721750 * f(rgb[2]);
  }
  function apca(Ytxt, Ybg) {
    var clamp = function (Y) { return Y > 0.022 ? Y : Y + Math.pow(0.022 - Y, 1.414); };
    Ytxt = clamp(Ytxt); Ybg = clamp(Ybg);
    if (Math.abs(Ybg - Ytxt) < 0.0005) return 0;
    var out;
    if (Ybg > Ytxt) {
      out = (Math.pow(Ybg, 0.56) - Math.pow(Ytxt, 0.57)) * 1.14;
      out = out < 0.1 ? 0 : out - 0.027;
    } else {
      out = (Math.pow(Ybg, 0.65) - Math.pow(Ytxt, 0.62)) * 1.14;
      out = out > -0.1 ? 0 : out + 0.027;
    }
    return out * 100;
  }
  /* RESOLVE ANY CSS COLOUR, NOT JUST rgb(). The first draft read the computed
     string with a regex, which silently skipped every element painted with
     color-mix() or oklch() — Chrome computes those to their own space
     ("oklch(0.759 0.0027 none)"), the regex found two numbers, and the probe
     was dropped without a word. That is the worst failure mode an instrument
     has: not a wrong number, a missing row. And it was not a rare case — the
     node head's background IS a color-mix, so the readings that did appear
     were measured against the wrong ground.

     So the browser converts, not us: paint the colour over black and over
     white, and solve. The difference between the two grounds is (1 - alpha),
     which recovers translucency exactly, in whatever space the author wrote. */
  var swatch = document.createElement('canvas');
  swatch.width = swatch.height = 1;
  var sctx = swatch.getContext('2d', { willReadFrequently: true });
  function parseRgb(css) {
    if (!css || css === 'transparent' || css === 'none') return [0, 0, 0, 0];
    var on = function (ground) {
      sctx.globalCompositeOperation = 'copy';
      sctx.fillStyle = ground;
      sctx.fillRect(0, 0, 1, 1);
      sctx.globalCompositeOperation = 'source-over';
      sctx.fillStyle = ground; /* a colour canvas cannot parse leaves this set */
      sctx.fillStyle = css;
      sctx.fillRect(0, 0, 1, 1);
      return sctx.getImageData(0, 0, 1, 1).data;
    };
    var b = on('#000000'), w = on('#ffffff');
    var a = 1 - (w[0] - b[0]) / 255;
    if (a <= 0.0001) return [0, 0, 0, 0];
    return [b[0] / a, b[1] / a, b[2] / a, a];
  }
  /* element opacity is NOT colour alpha, and the node system uses it: a
     skipped card fades its whole subtree. Ignoring it flattered exactly the
     states that most need watching, so the cumulative factor rides along. */
  function opacityOf(node) {
    var o = 1, n = node;
    while (n && n.nodeType === 1) {
      var v = parseFloat(getComputedStyle(n).opacity);
      if (!isNaN(v)) o *= v;
      n = n.parentElement;
    }
    return o;
  }
  /* composite every semi-transparent layer under the element, bottom-up. Our
     chips sit on color-mix backgrounds over a surface over the stage — taking
     the first opaque ancestor would have lied about exactly the atoms that
     matter most. */
  function bgUnder(node) {
    var stack = [], n = node;
    while (n && n.nodeType === 1) {
      var c = parseRgb(getComputedStyle(n).backgroundColor);
      if (c && c[3] > 0) { stack.push(c); if (c[3] >= 0.999) break; }
      n = n.parentElement;
    }
    var out = [255, 255, 255];
    for (var i = stack.length - 1; i >= 0; i--) {
      var l = stack[i], a = l[3];
      out = [l[0] * a + out[0] * (1 - a), l[1] * a + out[1] * (1 - a), l[2] * a + out[2] * (1 - a)];
    }
    return out;
  }
  function needFor(px, weight) {
    var bold = weight >= 600;
    if (px >= 36 || (px >= 24 && bold)) return 45;
    if (px >= 24 || (px >= 16 && bold)) return 60;
    if (px >= 14) return 75;
    return 90;
  }
  /* WHAT EACH TEXT OWES, BY WHAT IT IS FOR. The first draft of this readout
     held every string to the body-copy bar and reported ten failures out of
     twelve — which is not a finding, it is an instrument crying wolf, and a
     readout nobody believes is worse than none. APCA's own guidance separates
     prose you READ from text you GLANCE AT from marks that are meant to
     recede, so the probes declare which they are:
       body  · read continuously → the size/weight table
       spot  · read at a glance (labels, chips, counters, pills) → Lc 60
       muted · deliberately receded (skipped, idle) → Lc 30, discernibility */
  var BARS = { spot: 60, muted: 30 };
  var PROBES = [
    ['.nc-id', 'le nom de la tâche', 'body'],
    ['.nc-body', 'le corps', 'body'],
    ['.nc-body-cmd', 'un corps de commande', 'body'],
    ['.nc-sub', 'la rangée mécanisme', 'spot'],
    ['.nc-badge', 'le verbe, dans la tête', 'spot'],
    ['.nc-chip', 'une puce de permis', 'spot'],
    ['.nc-ab-tk', 'le compteur de jetons', 'spot'],
    ['.dag-node.status-success .nc-st', 'l’état réussi', 'spot'],
    ['.dag-node.status-failed .nc-st', 'l’état refusé', 'spot'],
    ['.cell-k', 'l’étiquette d’un plateau', 'spot'],
    ['.cell-note', 'la légende sous un spécimen', 'spot'],
    ['.dag-node.status-skipped .nc-st', 'l’état sauté', 'muted'],
    ['.dag-node.status-pending .nc-st', 'l’état au repos', 'muted'],
    /* AJOUTÉ 2026-07-28 · huit familles étaient arrivées sur la page sans que
       le contrôle les voie. Un instrument en retard sur sa propre page mesure
       l'état d'hier et le rapporte comme celui d'aujourd'hui. */
    ['.typ-sample', 'un spécimen de face', 'body'],
    ['.typ-note', 'la note d’une marche', 'spot'],
    ['.typ-legend', 'une légende de section', 'body'],
    ['.mat-calls li', 'un appel d’anatomie', 'spot'],
    ['.gl-k', 'une étiquette sur le verre', 'spot'],
    ['.gl-pill', 'une pastille sur le verre', 'spot'],
    ['.pg-line', 'l’état dans le playground', 'spot'],
    ['.mg-node', 'un nœud de silhouette', 'spot']
  ];
  function control() {
    var rows = [];
    for (var i = 0; i < PROBES.length; i++) {
      var probe = document.querySelector('.stage ' + PROBES[i][0]);
      if (!probe) continue;
      var cs = getComputedStyle(probe);
      var fg = parseRgb(cs.color);
      if (!fg) continue;
      var bg = bgUnder(probe.parentElement || probe);
      var a = fg[3] * opacityOf(probe);
      if (a < 1) fg = [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a)];
      var lc = apca(sRGBtoY(fg), sRGBtoY(bg));
      var px = parseFloat(cs.fontSize) || 12;
      var kind = PROBES[i][2];
      rows.push({
        what: PROBES[i][1], sel: PROBES[i][0], lc: lc, px: px, kind: kind,
        need: BARS[kind] || needFor(px, parseInt(cs.fontWeight, 10) || 400)
      });
    }
    rows.sort(function (a, b) { return (Math.abs(a.lc) - a.need) - (Math.abs(b.lc) - b.need); });
    var body = document.getElementById('apcaout');
    body.replaceChildren();
    for (var j = 0; j < rows.length; j++) {
      var r = rows[j], ok = Math.abs(r.lc) >= r.need;
      var tr = el('tr');
      var td = el('td', null, r.what + ' ');
      td.append(el('span', 'apca-sub', r.sel + ' · ' + r.px.toFixed(1) + 'px · ' + r.kind));
      tr.append(td);
      tr.append(el('td', 'lc', 'Lc ' + Math.abs(r.lc).toFixed(1)));
      tr.append(el('td', 'need', 'min ' + r.need));
      var v = el('td', 'v', ok ? 'tient' : 'sous le plancher');
      v.dataset.ok = ok ? '1' : '0';
      tr.append(v);
      body.append(tr);
    }
  }

  /* ── the knobs ──────────────────────────────────────────────────────────── */
  function moved() {
    var out = [];
    for (var i = 0; i < KNOBS.length; i++) {
      var k = KNOBS[i], v = state.knobs[k.id];
      if (v != null && Number(v) !== Number(k.def)) out.push([k, v]);
    }
    return out;
  }
  function applyKnobs() {
    for (var i = 0; i < KNOBS.length; i++) {
      var k = KNOBS[i];
      var v = state.knobs[k.id];
      if (v == null) v = k.def;
      var input = document.getElementById('k-' + k.id);
      if (input) input.value = v;
      var out = document.getElementById('o-' + k.id);
      if (out) out.textContent = v + k.unit;
      var value = v + k.unit;
      stages.forEach(function (s) { s.style.setProperty(k.css, value); });
    }
    var n = moved().length;
    document.getElementById('dirty').textContent = n
      ? (n === 1 ? '1 mesure déplacée' : n + ' mesures déplacées')
      : 'rien n’a bougé';
    diff();
    control();
  }
  function groupByHome() {
    var byHome = {}, list = moved();
    for (var i = 0; i < list.length; i++) {
      var home = list[i][0].home;
      (byHome[home] = byHome[home] || []).push(list[i]);
    }
    return byHome;
  }
  function diff() {
    var out = document.getElementById('diffout');
    var byHome = groupByHome();
    var homes = Object.keys(byHome);
    out.replaceChildren();
    if (!homes.length) {
      out.textContent = 'Bouge un curseur : le diff s’écrit ici, groupé par fichier.';
      return;
    }
    for (var h = 0; h < homes.length; h++) {
      var home = HOMES[homes[h]];
      out.append(el('span', 'file', home.path));
      out.append(document.createTextNode('  '));
      out.append(el('span', 'apca-sub', home.hint));
      out.append(document.createTextNode('\\n'));
      var list = byHome[homes[h]];
      for (var j = 0; j < list.length; j++) {
        var k = list[j][0], v = list[j][1];
        out.append(el('span', 'del', '-   ' + k.key + ': ' + k.def + k.unit));
        out.append(document.createTextNode('\\n'));
        out.append(el('span', 'add', '+   ' + k.key + ': ' + v + k.unit));
        out.append(document.createTextNode('\\n'));
      }
      if (h < homes.length - 1) out.append(document.createTextNode('\\n'));
    }
  }
  function plainDiff() {
    var lines = [], byHome = groupByHome(), homes = Object.keys(byHome);
    for (var h = 0; h < homes.length; h++) {
      lines.push(HOMES[homes[h]].path);
      var list = byHome[homes[h]];
      for (var j = 0; j < list.length; j++) {
        var k = list[j][0], v = list[j][1];
        lines.push('-   ' + k.key + ': ' + k.def + k.unit);
        lines.push('+   ' + k.key + ': ' + v + k.unit);
      }
      lines.push('');
    }
    return lines.join('\\n').trim();
  }

  /* ── the switches ───────────────────────────────────────────────────────── */
  function setSkin(skin) {
    state.skin = skin; save();
    stages.forEach(function (s) { if (skin === 'brand') s.removeAttribute('data-skin'); else s.dataset.skin = skin; });
    document.querySelectorAll('button[data-skin]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.skin === skin));
    });
    control();
  }
  function setRoom(room) {
    state.room = room; save();
    if (room === 'auto') document.documentElement.removeAttribute('data-room');
    else document.documentElement.dataset.room = room;
    document.querySelectorAll('button[data-room]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.room === room));
    });
  }
  function setExplode(on) {
    state.explode = on; save();
    stages.forEach(function (s) { if (on) s.dataset.explode = ''; else s.removeAttribute('data-explode'); });
    document.getElementById('explode').setAttribute('aria-pressed', String(on));
  }

  document.querySelectorAll('button[data-skin]').forEach(function (b) {
    b.addEventListener('click', function () { setSkin(b.dataset.skin); });
  });
  document.querySelectorAll('button[data-room]').forEach(function (b) {
    b.addEventListener('click', function () { setRoom(b.dataset.room); });
  });
  document.querySelectorAll('input[data-knob]').forEach(function (input) {
    input.addEventListener('input', function () {
      state.knobs[input.dataset.knob] = Number(input.value);
      save(); applyKnobs();
    });
  });
  document.getElementById('explode').addEventListener('click', function () { setExplode(!state.explode); });
  document.getElementById('reset').addEventListener('click', function () {
    state.knobs = {}; save(); applyKnobs();
  });
  document.getElementById('copy').addEventListener('click', function (e) {
    var txt = plainDiff();
    if (!txt || !navigator.clipboard) return;
    var btn = e.currentTarget;
    navigator.clipboard.writeText(txt).then(function () {
      btn.textContent = 'copié';
      setTimeout(function () { btn.textContent = 'copier'; }, 1200);
    });
  });
  addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var active = document.activeElement;
    if (active && /^(input|textarea|select)$/i.test(active.tagName)) return;
    var k = e.key.toLowerCase();
    if (k === 't') setSkin(state.skin === 'brand' ? 'theme' : 'brand');
    else if (k === 'x') setExplode(!state.explode);
    else if (k === '0') { state.knobs = {}; save(); applyKnobs(); }
  });

${groundJs()}
  /* ── les options du sol ─────────────────────────────────────────────────
     Chaque bascule pose un attribut que le CSS généré connaît déjà : rien
     n'est stylé ici, on ne fait qu'allumer des règles qui viennent de la même
     source que celles du site. Une option qui aurait son propre CSS serait
     une cinquième couche que le canvas n'a pas. */
  (function () {
    var grounds = document.querySelectorAll('.nk-ground');
    var press = function (sel, on) {
      document.querySelectorAll(sel).forEach(function (b) {
        b.setAttribute('aria-pressed', String(on(b)));
      });
    };
    document.querySelectorAll('button[data-grid]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.dataset.grid;
        grounds.forEach(function (g) {
          if (v === 'near') { g.removeAttribute('data-lod'); g.removeAttribute('data-grid'); }
          else if (v === 'far') { g.dataset.lod = 'far'; g.removeAttribute('data-grid'); }
          else { g.dataset.grid = 'off'; g.removeAttribute('data-lod'); }
        });
        press('button[data-grid]', function (x) { return x.dataset.grid === v; });
      });
    });
    document.querySelectorAll('button[data-gfx]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.dataset.gfx, on = b.getAttribute('aria-pressed') !== 'true';
        grounds.forEach(function (g) {
          var attr = v === 'running' ? 'data-running' : v === 'novign' ? 'data-vignette' : 'data-spot';
          if (!on) g.removeAttribute(attr);
          else if (v === 'running') g.setAttribute('data-running', '');
          else g.setAttribute(attr, 'off');
        });
        b.setAttribute('aria-pressed', String(on));
      });
    });
  })();

  /* ── L'INDEX SE DÉRIVE DE LA PAGE ────────────────────────────────────────
     Vingt sections dans un seul défilement, c'est un rouleau — exactement le
     reproche qu'on a fait au registre des refus avant de lui donner son
     étagère. La leçon vaut ici aussi.
     Il est CONSTRUIT depuis les <section> réelles, jamais écrit à la main :
     une liste écrite peut annoncer une section qui n'existe plus, celle-ci
     ne le peut pas. Et l'observateur marque où on est. */
  var dex = document.getElementById('dex');
  if (dex) {
    var secs = Array.prototype.slice.call(document.querySelectorAll('.wrap > section'));
    var links = [];
    secs.forEach(function (sec, i) {
      var h = sec.querySelector('h2');
      if (!h) return;
      var id = 'sec-' + i;
      sec.id = id;
      var a = document.createElement('a');
      a.href = '#' + id;
      a.className = 'dex-a';
      a.textContent = h.textContent.trim();
      dex.appendChild(a);
      links.push({ a: a, sec: sec });
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var hit = links.find(function (l) { return l.sec === en.target; });
          if (hit) hit.a.setAttribute('aria-current', en.isIntersecting ? 'true' : 'false');
        });
      }, { rootMargin: '-15% 0px -70% 0px' });
      links.forEach(function (l) { io.observe(l.sec); });
    }
  }

  /* les petits graphes · la MÊME façon de tracer que le playground, appliquée
     à n'importe quel conteneur [data-graph] · un seul chemin de code pour les
     deux, donc ils ne peuvent pas diverger */
  document.querySelectorAll('[data-graph]').forEach(function (g) {
    var svg = g.querySelector('.mg-wires > g');
    var edges = JSON.parse(g.dataset.edges || '[]');
    var draw = function () {
      var box = g.getBoundingClientRect();
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      edges.forEach(function (e) {
        var a = g.querySelector('[data-id="' + e[0] + '"]');
        var b = g.querySelector('[data-id="' + e[1] + '"]');
        if (!a || !b) return;
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        var x1 = ra.right - box.left, y1 = ra.top - box.top + ra.height / 2;
        var x2 = rb.left - box.left, y2 = rb.top - box.top + rb.height / 2;
        var mid = x1 + (x2 - x1) / 2;
        var pth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pth.setAttribute('class', 'mg-edge');
        pth.setAttribute('d', 'M' + x1 + ' ' + y1 + ' C' + mid + ' ' + y1 + ' ' + mid + ' ' + y2 + ' ' + x2 + ' ' + y2);
        svg.appendChild(pth);
      });
    };
    requestAnimationFrame(draw);
    new ResizeObserver(draw).observe(g);
  });

  /* ── le playground · un run qu'on regarde se dérouler ────────────────────
     Les arêtes se tracent depuis les rectangles RÉELS des nœuds, jamais depuis
     des coordonnées écrites : la grille peut se réagencer, les fils suivent.
     Un ResizeObserver suffit, il n'y a pas de boucle. */
  var DAG = ${JSON.stringify({ edges: DAG.edges })};
  var pgWrap = document.querySelector('.pg-wrap');
  if (pgWrap) {
    var pgSvg = document.getElementById('pg-edges');
    var pgSay = document.getElementById('pg-say');
    var STATES_ORDER = ${JSON.stringify(STATES.map((st) => st.id))};
    var STATE_TEXT = ${JSON.stringify(Object.fromEntries(STATES.map((st) => [st.id, st.label])))};
    var nodeOf = function (id) { return pgWrap.querySelector('[data-id="' + id + '"]'); };

    function drawEdges() {
      var box = pgWrap.getBoundingClientRect();
      while (pgSvg.firstChild) pgSvg.removeChild(pgSvg.firstChild);
      DAG.edges.forEach(function (e) {
        var a = nodeOf(e[0]), b = nodeOf(e[1]);
        if (!a || !b) return;
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        var x1 = ra.right - box.left, y1 = ra.top - box.top + ra.height / 2;
        var x2 = rb.left - box.left, y2 = rb.top - box.top + rb.height / 2;
        var mid = x1 + (x2 - x1) / 2;
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'pg-edge');
        path.setAttribute('d', 'M' + x1 + ' ' + y1 + ' C' + mid + ' ' + y1 + ' ' + mid + ' ' + y2 + ' ' + x2 + ' ' + y2);
        var from = statusOf(a), to = statusOf(b);
        /* 'ok' ici était MORT : l'état s'appelle 'success' depuis le renommage,
           donc aucune arête ne portait jamais le courant. La convergence vers
           les noms du canvas l'a mis au jour. */
        if (from === 'success') path.setAttribute('data-live', '');
        if (from === 'failed' || to === 'skipped') path.setAttribute('data-dead', '');
        pgSvg.appendChild(path);
      });
    }

    function say(msg) { if (pgSay) pgSay.textContent = msg; }
    /* L'ÉTAT EST UNE CLASSE SUR L'ENVELOPPE, comme dans le canvas — pas un
       attribut sur la carte. Deux surfaces qui lisent le même CSS doivent
       porter l'état au même endroit, sinon les règles ne mordent que chez une. */
    function statusOf(el) {
      var m = /(?:^|\s)status-([a-z]+)/.exec(el.className);
      return m ? m[1] : 'pending';
    }
    function setState(node, st) {
      node.className = node.className.replace(/(?:^|\s)status-[a-z]+/, ' status-' + st);
      node.querySelector('.pg-line').textContent = STATE_TEXT[st] || '';
      drawEdges();
    }
    function allNodes() { return Array.prototype.slice.call(pgWrap.querySelectorAll('.pg-node')); }
    function reset() { allNodes().forEach(function (n) { setState(n, 'pending'); }); say('sept tâches au repos · rien n’a encore tourné'); }

    /* clic · le nœud parcourt ses huit états, un par un */
    pgWrap.addEventListener('click', function (e) {
      var n = e.target.closest('.pg-node');
      if (!n) return;
      var i = STATES_ORDER.indexOf(statusOf(n));
      var next = STATES_ORDER[(i + 1) % STATES_ORDER.length];
      setState(n, next);
      say(n.dataset.id + ' · ' + STATE_TEXT[next]);
    });
    pgWrap.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var n = e.target.closest('.pg-node');
      if (!n) return;
      e.preventDefault();
      n.click();
    });

    /* le run · vague par vague, comme une trace réelle l'écrit */
    var waves = [];
    allNodes().forEach(function (n) {
      var w = Number(getComputedStyle(n).gridColumnStart) - 1;
      (waves[w] = waves[w] || []).push(n);
    });
    var timer = 0, at = 0;
    function stop() { if (timer) { clearTimeout(timer); timer = 0; } }
    function playWave(i, fail) {
      if (i >= waves.length) { say('run terminé · 7 tâches · 4 vagues'); return; }
      waves[i].forEach(function (n) { setState(n, 'running'); });
      say('vague ' + (i + 1) + ' / ' + waves.length + ' · ' + waves[i].length + (waves[i].length > 1 ? ' tâches en parallèle' : ' tâche'));
      timer = setTimeout(function () {
        var broke = false;
        waves[i].forEach(function (n) {
          if (fail && i === 1 && n.dataset.id === 'triage') { setState(n, 'failed'); broke = true; }
          else setState(n, 'ok');
        });
        if (broke) {
          waves.slice(i + 1).forEach(function (w) { w.forEach(function (n) { setState(n, 'skipped'); }); });
          say('refusé en vague ' + (i + 1) + ' · NIKA-INFER-007 · la suite est sautée');
          return;
        }
        timer = setTimeout(function () { playWave(i + 1, fail); }, 260);
      }, 700);
    }
    function run(fail) { stop(); reset(); at = 0; timer = setTimeout(function () { playWave(0, fail); }, 120); }

    document.getElementById('pg-play').addEventListener('click', function () { run(false); });
    document.getElementById('pg-fail').addEventListener('click', function () { run(true); });
    document.getElementById('pg-reset').addEventListener('click', function () { stop(); reset(); });
    document.getElementById('pg-step').addEventListener('click', function () {
      stop();
      if (at === 0) reset();
      if (at >= waves.length) { at = 0; reset(); return; }
      waves.slice(0, at).forEach(function (w) { w.forEach(function (n) { setState(n, 'ok'); }); });
      waves[at].forEach(function (n) { setState(n, 'ok'); });
      at += 1;
      say('vague ' + at + ' / ' + waves.length + ' posée');
    });

    reset();
    requestAnimationFrame(drawEdges);
    new ResizeObserver(drawEdges).observe(pgWrap);
  }

  /* the pointer takes the lamp · one rAF and two property writes for a whole
     stage, no per-specimen listener */
  var lampRaf = 0, lampAt = null;
  stages.forEach(function (s) {
    s.addEventListener('pointermove', function (e) {
      var r = s.getBoundingClientRect();
      lampAt = { s: s, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
      s.dataset.lamp = 'held';
      if (lampRaf) return;
      lampRaf = requestAnimationFrame(function () {
        lampRaf = 0;
        if (!lampAt) return;
        lampAt.s.style.setProperty('--lamp-x', lampAt.x.toFixed(2) + '%');
        lampAt.s.style.setProperty('--lamp-y', lampAt.y.toFixed(2) + '%');
      });
    });
    /* the drift resumes from the angle you handed it, never snapping back */
    s.addEventListener('pointerleave', function () {
      s.removeAttribute('data-lamp');
      s.style.removeProperty('--lamp-x');
      s.style.removeProperty('--lamp-y');
    });
  });

  setSkin(state.skin); setRoom(state.room); setExplode(state.explode); applyKnobs();
  addEventListener('resize', control);
</script>
`

if (process.argv.includes('--check')) {
  let have = ''
  try { have = readFileSync(OUT, 'utf8') } catch { /* first run */ }
  if (have !== html) {
    console.error('bench: DRIFT · run node design/bench.mjs')
    process.exit(1)
  }
  console.log(`✓ bench in sync · ${Object.keys(ANATOMY).length} verbs · ${STATES.length} states · ${KNOBS.length} knobs · ${LEDGER.filter((r) => r[2] === 2).length}/${LEDGER.length} shared`)
} else {
  writeFileSync(OUT, html)
  console.log(`wrote design/bench.html · ${Object.keys(ANATOMY).length} verbs · ${STATES.length} states · ${KNOBS.length} knobs · ${LEDGER.filter((r) => r[2] === 2).length}/${LEDGER.length} shared`)
}
