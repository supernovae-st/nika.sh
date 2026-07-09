#!/usr/bin/env node
/* nika icon library projector · design/icons.yaml → the generated surfaces.
 *
 *   node design/build.mjs          write the projections
 *   node design/build.mjs --check  verify projections match the SSOT (CI gate)
 *
 * Emits (all committed · drift-gated):
 *   public/brand/icons/<ns>-<name>.svg   the served catalog (SuperNovae house set)
 *   public/brand/icons.json              the machine-readable ontology
 *   public/brand/icons.ttl               the RDF projection
 *   src/icons/manifest.ts                the site's typed manifest
 *
 * Validations (all hard failures):
 *   · verbs == the 4 canon verbs, builtins == canon.generated.ts builtinNames
 *   · every hue hex matches its token's value in src/styles/tokens.css
 *   · every glyph file exists (design/svg/supernovae/** · design/svg/{ui,social}/**)
 *   · parent / shares_glyph_with references resolve
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')
const SSOT = join(ROOT, 'design/icons.yaml')

const fail = (msg) => {
  console.error(`✗ icons: ${msg}`)
  process.exitCode = 1
}

const doc = parse(readFileSync(SSOT, 'utf8'))
const entities = doc.entities
const ids = Object.keys(entities).sort()

/* ── validation · canon parity ─────────────────────────────────────────── */
const canonTs = readFileSync(join(ROOT, 'src/canon.generated.ts'), 'utf8')
const builtinNames = JSON.parse(canonTs.match(/builtinNames:\s*(\[[^\]]*\])/)[1])
const ontoBuiltins = ids.filter((i) => i.startsWith('builtin/')).map((i) => i.slice(8))
const missing = builtinNames.filter((b) => !ontoBuiltins.includes(b))
const extra = ontoBuiltins.filter((b) => !builtinNames.includes(b))
if (missing.length) fail(`builtins missing from the ontology: ${missing.join(', ')}`)
if (extra.length) fail(`ontology builtins not in canon: ${extra.join(', ')}`)

const VERBS = ['infer', 'exec', 'invoke', 'agent']
const ontoVerbs = ids.filter((i) => i.startsWith('verb/')).map((i) => i.slice(5))
if (VERBS.join() !== ontoVerbs.sort((a, b) => VERBS.indexOf(a) - VERBS.indexOf(b)).join())
  fail(`verbs must be exactly the canon 4 (got: ${ontoVerbs.join(', ')})`)

/* ── validation · token hex parity ─────────────────────────────────────── */
const tokensCss = readFileSync(join(ROOT, doc.meta.tokens_source), 'utf8')
const tokenHex = (token) => tokensCss.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`))?.[1]
for (const [id, e] of Object.entries(entities)) {
  if (e.hue?.token) {
    const live = tokenHex(e.hue.token)
    if (!live) fail(`${id}: token ${e.hue.token} not found in tokens.css`)
    else if (live.toLowerCase() !== e.hue.hex.toLowerCase())
      fail(`${id}: hue drift — ontology ${e.hue.hex} vs tokens.css ${live}`)
  }
  if (e.parent && !entities[e.parent]) fail(`${id}: parent ${e.parent} unresolved`)
  if (e.shares_glyph_with && !entities[e.shares_glyph_with])
    fail(`${id}: shares_glyph_with ${e.shares_glyph_with} unresolved`)
  if (!e.local && !e.supernovae && !e.pattern)
    fail(`${id}: no resolution (supernovae:/local: glyph, or pattern: for anim/*)`)
}

/* ── validation · footer sprite ↔ social/* semantic parity ─────────────────
   public/icons.svg is BYTE-FROZEN (the visual goldens shoot the footer), so
   it is not regenerated — instead this gate proves the sprite and the
   library's social/* artwork carry the SAME path data. Edit one without the
   other → the check fails. */
const SPRITE_MAP = {
  'bluesky-icon': 'bluesky',
  'discord-icon': 'discord',
  'documentation-icon': 'documentation',
  'github-icon': 'github',
  'social-icon': 'community',
  'x-icon': 'x',
}
{
  const sprite = readFileSync(join(ROOT, 'public/icons.svg'), 'utf8')
  const noClip = (svg) => svg.replace(/<clipPath[\s\S]*?<\/clipPath>/g, '')
  const dSet = (svg) => JSON.stringify([...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).sort())
  for (const sym of [...sprite.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)]) {
    const social = SPRITE_MAP[sym[1]]
    if (!social) {
      fail(`sprite symbol ${sym[1]} has no social/* twin (extend SPRITE_MAP + design/svg/social/)`)
      continue
    }
    const lib = readFileSync(join(ROOT, `design/svg/social/${social}.svg`), 'utf8')
    // the sprite's clipPath rect is chrome, not artwork — compare path d= sets
    if (dSet(noClip(sym[0])) !== dSet(noClip(lib)))
      fail(`sprite ${sym[1]} drifted from design/svg/social/${social}.svg (same artwork law)`)
  }
}

/* ── glyph resolution ──────────────────────────────────────────────────── */
const innerOf = (svg) =>
  svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim()
const viewBoxOf = (svg) => svg.match(/viewBox="([^"]+)"/)?.[1]

function resolveGlyph(id, e) {
  if (e.pattern) return { set: 'motion' } // anim/* — figures live in src/fx/dotmatrix
  if (e.local) {
    const p = join(ROOT, 'design/svg', `${e.local}.svg`)
    if (!existsSync(p)) return fail(`${id}: local glyph missing: design/svg/${e.local}.svg`)
    const raw = readFileSync(p, 'utf8')
    const mode = e.mode ?? (raw.includes('stroke="currentColor"') ? 'stroke' : 'fill')
    const strokeWidth = e.stroke_width ?? (mode === 'stroke' ? 1.5 : undefined)
    return { viewBox: viewBoxOf(raw), body: innerOf(raw), mode, strokeWidth, set: 'house' }
  }
  /* the SuperNovae set ships tight-cropped exports; the path coordinates are
     24-grid absolute, so normalizing = pinning viewBox to the full grid.
     Bodies are SELF-CONTAINED (each path carries its own stroke/fill) →
     mode 'auto': the wrapper adds no root ink attributes. */
  const p = join(ROOT, 'design/svg/supernovae', `${e.supernovae}.svg`)
  if (!existsSync(p)) return fail(`${id}: house glyph missing: design/svg/supernovae/${e.supernovae}.svg`)
  const raw = readFileSync(p, 'utf8')
  return { viewBox: '0 0 24 24', body: innerOf(raw), mode: 'auto', set: 'supernovae' }
}

const resolved = {}
for (const id of ids) resolved[id] = resolveGlyph(id, entities[id])
if (process.exitCode) {
  console.error('✗ icon ontology invalid — nothing written')
  process.exit(1)
}

/* ── emissions ─────────────────────────────────────────────────────────── */
const outputs = new Map() // path → content

const fileId = (id) => id.replace('/', '-')
for (const id of ids) {
  const e = entities[id]
  if (e.pattern) continue // anim/* has no static glyph — it ships as motion
  const g = resolved[id]
  const credit =
    g.set === 'supernovae' ? `glyph: SuperNovae house set · ${e.supernovae}` : 'glyph: house artwork'
  const inkAttrs =
    g.mode === 'stroke'
      ? ` fill="none" stroke="currentColor" stroke-width="${g.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
      : g.mode === 'fill'
        ? ' fill="currentColor"'
        : ' fill="none"'
  outputs.set(
    `public/brand/icons/${fileId(id)}.svg`,
    `<!-- nika icon library · ${id} · ${credit} · generated by design/build.mjs -->\n` +
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${g.viewBox}"${inkAttrs} data-nika="${id}" aria-hidden="true">${g.body}</svg>\n`,
  )
}

/* icons.json — the public machine ontology */
outputs.set(
  'public/brand/icons.json',
  JSON.stringify(
    {
      $comment: 'generated by design/build.mjs — the nika icon ontology · edit design/icons.yaml',
      meta: doc.meta,
      inks: doc.inks,
      fx: doc.fx,
      entities: Object.fromEntries(
        ids.map((id) => [
          id,
          {
            label: entities[id].label,
            semantic: entities[id].semantic,
            svg: entities[id].pattern ? null : `https://nika.sh/brand/icons/${fileId(id)}.svg`,
            set: resolved[id].set,
            glyph: entities[id].supernovae ?? entities[id].local ?? null,
            pattern: entities[id].pattern ?? null,
            grid: entities[id].pattern ? 9 : null,
            alternate: entities[id].pattern ? Boolean(entities[id].alternate) : null,
            hue: entities[id].hue ?? null,
            fx: entities[id].fx ?? [],
            parent: entities[id].parent ?? null,
            shares_glyph_with: entities[id].shares_glyph_with ?? null,
            category: entities[id].category ?? null,
            canon: entities[id].canon ?? null,
          },
        ]),
      ),
    },
    null,
    2,
  ) + '\n',
)

/* icons.ttl — the RDF projection */
const NS = doc.meta.namespace
const CLASS = { verb: 'Verb', builtin: 'Builtin', feature: 'Feature', state: 'RunState', ui: 'UiGlyph', social: 'SocialMark', anim: 'Animation' }
const iri = (id) => `<${NS.slice(0, -1)}#${fileId(id)}>`.replace('##', '#')
const lit = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
let ttl = `# generated by design/build.mjs — the nika design ontology · edit design/icons.yaml
@prefix nkd: <${NS}> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

${Object.values(CLASS)
  .map((c) => `nkd:${c} a rdfs:Class .`)
  .join('\n')}
${Object.keys(doc.fx)
  .map((f) => `nkd:fx-${f} a nkd:Effect .`)
  .join('\n')}
`
for (const id of ids) {
  const e = entities[id]
  const [ns] = id.split('/')
  const lines = [`${iri(id)} a nkd:${CLASS[ns]}`, `  rdfs:label ${lit(e.label)}`]
  if (e.semantic) lines.push(`  nkd:semantic ${lit(e.semantic)}`)
  if (e.pattern) {
    lines.push(`  nkd:pattern ${lit(e.pattern)}`, `  nkd:grid 9`)
    if (e.alternate) lines.push(`  nkd:alternate true`)
  } else {
    lines.push(`  nkd:glyph ${lit(e.supernovae ?? e.local)}`)
    lines.push(`  nkd:glyphSet ${lit(resolved[id].set)}`)
  }
  if (e.hue) lines.push(`  nkd:hueToken ${lit(e.hue.token)}`, `  nkd:hueHex ${lit(e.hue.hex)}`)
  for (const f of e.fx ?? []) lines.push(`  nkd:fx nkd:fx-${f}`)
  if (e.parent) lines.push(`  nkd:parent ${iri(e.parent)}`)
  if (e.shares_glyph_with) lines.push(`  nkd:sharesGlyphWith ${iri(e.shares_glyph_with)}`)
  if (e.category) lines.push(`  nkd:category ${lit(e.category)}`)
  if (e.canon) lines.push(`  nkd:canonRef ${lit(e.canon)}`)
  if (!e.pattern) lines.push(`  nkd:servedAt <https://nika.sh/brand/icons/${fileId(id)}.svg>`)
  ttl += '\n' + lines.join(' ;\n') + ' .\n'
}
outputs.set('public/brand/icons.ttl', ttl)

/* src/icons/manifest.ts — the site's typed manifest */
const tsEsc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
const iconIds = ids.filter((id) => !entities[id].pattern)
const animIds = ids.filter((id) => entities[id].pattern)
let ts = `// GENERATED by design/build.mjs — DO NOT EDIT · edit design/icons.yaml, run \`pnpm icons\`.
// The nika icon ontology, projected for the site. Static ink law: verb hues
// render ONLY on live-run surfaces (pass \`live\` to NikaIcon / NikaDots).

export type NikaIconId =
${iconIds.map((id) => `  | '${id}'`).join('\n')}

export interface NikaIconDef {
  viewBox: string
  body: string
  /** stroke = root-inked outline · fill = solid mark · auto = self-contained body */
  mode: 'stroke' | 'fill' | 'auto'
  strokeWidth?: number
  /** the verb hue CSS var — live-run surfaces only (BRAND ink law) */
  hue?: string
  label: string
}

export const NK_ICONS: Record<NikaIconId, NikaIconDef> = {
${iconIds
  .map((id) => {
    const e = entities[id]
    const g = resolved[id]
    const hueEntity = e.hue ? e : e.parent && entities[e.parent].hue ? entities[e.parent] : null
    const parts = [
      `viewBox: '${g.viewBox}'`,
      `body: \`${tsEsc(g.body)}\``,
      `mode: '${g.mode}'`,
      g.mode === 'stroke' ? `strokeWidth: ${g.strokeWidth}` : null,
      hueEntity ? `hue: 'var(${hueEntity.hue.token})'` : null,
      `label: '${e.label.replace(/'/g, "\\'")}'`,
    ].filter(Boolean)
    return `  '${id}': { ${parts.join(', ')} },`
  })
  .join('\n')}
}

export type NikaAnimId =
${animIds.map((id) => `  | '${id}'`).join('\n')}

export interface NikaAnimDef {
  /** the dot-matrix figure (src/fx/dotmatrix/patterns.ts) */
  pattern: 'sample' | 'scanline' | 'roundtrip' | 'orbit' | 'wave' | 'emerge'
  /** plays forward then back (request/response · wing-beat) */
  alternate?: boolean
  /** the verb hue CSS var — live-run surfaces only (BRAND ink law) */
  hue?: string
  label: string
}

export const NK_ANIMS: Record<NikaAnimId, NikaAnimDef> = {
${animIds
  .map((id) => {
    const e = entities[id]
    const hueEntity = e.hue ? e : e.parent && entities[e.parent].hue ? entities[e.parent] : null
    const parts = [
      `pattern: '${e.pattern}'`,
      e.alternate ? 'alternate: true' : null,
      hueEntity ? `hue: 'var(${hueEntity.hue.token})'` : null,
      `label: '${e.label.replace(/'/g, "\\'")}'`,
    ].filter(Boolean)
    return `  '${id}': { ${parts.join(', ')} },`
  })
  .join('\n')}
}
`
outputs.set('src/icons/manifest.ts', ts)

/* ── write or check ────────────────────────────────────────────────────── */
let drift = 0
const catalogDir = join(ROOT, 'public/brand/icons')
if (!CHECK) mkdirSync(catalogDir, { recursive: true })
for (const [rel, content] of outputs) {
  const abs = join(ROOT, rel)
  if (CHECK) {
    const disk = existsSync(abs) ? readFileSync(abs, 'utf8') : null
    if (disk !== content) {
      console.error(`✗ drift: ${rel} (run \`pnpm icons\`)`)
      drift++
    }
  } else {
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, content)
  }
}
/* orphan catalog files (entity removed from the SSOT) */
if (existsSync(catalogDir))
  for (const f of readdirSync(catalogDir)) {
    const rel = `public/brand/icons/${f}`
    if (!outputs.has(rel)) {
      if (CHECK) {
        console.error(`✗ orphan catalog file: ${rel}`)
        drift++
      } else {
        unlinkSync(join(ROOT, rel))
        console.log(`· removed orphan ${rel}`)
      }
    }
  }

if (CHECK) {
  if (drift) {
    console.error(`✗ icon projections out of sync (${drift})`)
    process.exit(1)
  }
  console.log(`✓ icon ontology in sync · ${ids.length} entities`)
} else {
  console.log(`✓ icon library projected · ${ids.length} entities → ${outputs.size} files`)
}
