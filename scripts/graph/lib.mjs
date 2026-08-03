// scripts/graph/lib.mjs — the shared floor of the mégagraphe compiler.
//
// One law lives here (§K.3 of the total-map mandate): the graph is TRIPLES —
// (subject · predicate · object) + evidence + provenance on EVERY edge, and
// evidence + provenance on EVERY node. An assertion without evidence does not
// enter the artifact; the doctor refuses it. Determinism is part of the
// contract: sorted keys · sorted rows · zero timestamps — same pins, same
// bytes (the estate SCHEMA.md determinism law, applied to the graph).

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { parse as parseToml } from 'smol-toml'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
export const read = (p) => readFileSync(join(ROOT, p), 'utf8')
export const readJson = (p) => JSON.parse(read(p))
export const readYamlFile = (p) => parseYaml(read(p))
export const readTomlFile = (p) => parseToml(read(p))
export const sha256 = (s) => createHash('sha256').update(s).digest('hex')

/** Codepoint comparator — NEVER localeCompare: ICU collation varies by
 *  runtime/locale env, and "same pins ⇒ same bytes" must not depend on the
 *  invoking machine's locale (the exact class the spec-resync lane pins
 *  LC_ALL=C.UTF-8 against — refuter finding 2026-08-01). */
export const byCp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

/** ONE slug law for catalog ids (models · MCP servers), shared by the graph
 *  compiler AND the /catalog projection so their urls can never diverge:
 *  lowercase · anything outside [a-z0-9] folds to '-' (DOTS included — a
 *  dotted tail reads as a file EXTENSION to static servers and CDNs; the
 *  e2e harness crashed EISDIR on /catalog/models/qwen2.5 before this law)
 *  · collapsed · trimmed · collisions dedupe '~2','~3'… in the caller's
 *  (codepoint-sorted) order. */
export function slugRegistry() {
  const taken = new Set()
  return (id) => {
    let s = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-')
    if (!s) s = 'x'
    let out = s
    let n = 1
    while (taken.has(out)) {
      n += 1
      out = `${s}~${n}`
    }
    taken.add(out)
    return out
  }
}

/** Deterministic JSON: keys sorted at every depth, 1-space indent, LF. */
export function stableStringify(value) {
  const sort = (v) => {
    if (Array.isArray(v)) return v.map(sort)
    if (v && typeof v === 'object') {
      const out = {}
      for (const k of Object.keys(v).sort()) out[k] = sort(v[k])
      return out
    }
    return v
  }
  return `${JSON.stringify(sort(value), null, 1)}\n`
}

/** The closed predicate vocabulary and its inverses — an edge outside this
 *  table is a compile error, not a warning (H.1: arêtes typées · TOUJOURS
 *  inversées). Symmetric predicates invert to themselves. */
export const REL_INVERSE = {
  serves: 'served-by',
  'served-by': 'serves',
  'priced-by': 'prices',
  prices: 'priced-by',
  'costs-energy': 'energy-of',
  'energy-of': 'costs-energy',
  grants: 'granted-by',
  'granted-by': 'grants',
  implements: 'implemented-by',
  'implemented-by': 'implements',
  'projects-to': 'projected-from',
  'projected-from': 'projects-to',
  'vendors-to': 'vendored-from',
  'vendored-from': 'vendors-to',
  'mirrors-to': 'mirrored-from',
  'mirrored-from': 'mirrors-to',
  heals: 'healed-by',
  'healed-by': 'heals',
  certifies: 'certified-by',
  'certified-by': 'certifies',
  'locksteps-with': 'locksteps-with',
  'ships-in': 'ships',
  ships: 'ships-in',
}

export function node({ id, family, title, url = null, served = undefined, lands = null, data = null, evidence, provenance }) {
  for (const [k, v] of Object.entries({ id, family, title, evidence, provenance }))
    if (!v || typeof v !== 'string' || !v.trim()) throw new Error(`node ${id ?? '?'}: missing/invalid ${k}`)
  const n = { id, family, title, url, evidence, provenance }
  if (served !== undefined) n.served = served
  if (lands) n.lands = lands
  if (data) n.data = data
  return n
}

export function edge({ from, rel, to, data = null, evidence, provenance }) {
  for (const [k, v] of Object.entries({ from, rel, to, evidence, provenance }))
    if (!v || typeof v !== 'string' || !v.trim()) throw new Error(`edge ${from ?? '?'}→${to ?? '?'}: missing/invalid ${k}`)
  if (!(rel in REL_INVERSE)) throw new Error(`edge ${from} -${rel}→ ${to}: predicate outside the closed vocabulary`)
  const e = { from, rel, to, evidence, provenance }
  if (data) e.data = data
  return e
}

/** The estate glob dialect (mirrors the canonical estate.py glob_to_re:
 *  `**` crosses segments · `*` within one · `?` one non-slash char). */
export function estateGlobToRe(glob) {
  let out = ''
  let i = 0
  while (i < glob.length) {
    const c = glob[i]
    if (c === '*') {
      if (glob.slice(i, i + 2) === '**') {
        out += '.*'
        i += 2
      } else {
        out += '[^/]*'
        i += 1
      }
    } else if (c === '?') {
      out += '[^/]'
      i += 1
    } else {
      out += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      i += 1
    }
  }
  return new RegExp(`^${out}$`)
}

/** Resolve a path's estate class exactly like the tool does: files: rows
 *  first (exact path), then patterns: in order, first-match-wins.
 *  estate.yaml never lists itself — by the tool's own law it is `generated`.
 *  Also exposes the classes: block AS DECLARED BY THE MANIFEST (which the
 *  mirrored tool renders verbatim from nika-estate/SCHEMA.md) — consumers
 *  IMPORT the law from there, never recopy it (§J.6 last row). */
export function estateClassResolver() {
  const doc = parseYaml(read('estate.yaml'))
  const files = new Map((doc.files ?? []).map((r) => [r.path, r.class]))
  const patterns = (doc.patterns ?? []).map((r) => ({ re: estateGlobToRe(r.glob), cls: r.class }))
  const resolve = (path) => {
    if (path === 'estate.yaml') return 'generated'
    if (files.has(path)) return files.get(path)
    for (const p of patterns) if (p.re.test(path)) return p.cls
    return null
  }
  resolve.classes = new Set(Object.keys(doc.classes ?? {}))
  return resolve
}

/** The served-routes census: PATHS evaluated from site.config.ts exactly as
 *  the prerender consumes it (imports resolved from their committed sources —
 *  deterministic; the vitest side re-joins against the REAL import). */
export function pathsCensus() {
  const cfg = read('site.config.ts')
  const errs = read('src/content/errors.generated.ts')
  const marker = 'ERROR_CODES: ErrorCodeEntry[] = '
  const start = errs.indexOf(marker) + marker.length
  const end = errs.indexOf('\n]\n', start) + 2
  const ERROR_CODES = JSON.parse(errs.slice(start, end))
  const pending = read('pending-error-codes.ts')
  const pm = pending.match(/PENDING_ERROR_CODES[^=]*=\s*(\[[^\]]*\])/)
  const PENDING_ERROR_CODES = pm ? Function(`return ${pm[1]}`)() : []
  const cat = read('src/content/catalog-paths.generated.ts')
  const slugBlock = (name) => {
    const m = cat.match(new RegExp(`${name}: string\\[\\] = (\\[[^\\]]*\\])`, 's'))
    return m ? JSON.parse(m[1]) : []
  }
  const MODEL_SLUGS = slugBlock('MODEL_SLUGS')
  const MCP_SLUGS = slugBlock('MCP_SLUGS')
  /* the market vendors + the spec-named set (2026-08-02): site.config derives
     the market-only rooms from these two, so the census must inject both or
     the evaluation throws on a name it cannot see. TOP-LEVEL ids only — the
     providers module nests a models[] whose rows also carry an "id". */
  const MARKET_PROVIDER_IDS = slugBlock('MARKET_PROVIDER_IDS')
  const CLIENT_IDS = slugBlock('CLIENT_IDS')
  const SPEC_PROVIDERS = [
    ...read('src/content/providers.generated.ts').matchAll(/^ {4}"id": "([a-z0-9-]+)"/gm),
  ].map((m) => ({ id: m[1] }))
  /* the release register (2026-08-03): RELEASE_PATHS derives from the
     vendored record's tag list — inject it like the others */
  const relm = read('src/content/releases.generated.ts').match(
    /RELEASE_TAGS: string\[\] = (\[[^\]]*\])/s,
  )
  const RELEASE_TAGS = relm ? JSON.parse(relm[1]) : []
  const body = cfg
    .replace(/^import[^\n]*$/gm, '')
    .replace(/^export \{ PENDING_ERROR_CODES \}[^\n]*$/m, '')
    .replace(/export const/g, 'const')
    .replace(/: string\[\]/g, '')
  const out = Function(
    'ERROR_CODES',
    'PENDING_ERROR_CODES',
    'MODEL_SLUGS',
    'MCP_SLUGS',
    'MARKET_PROVIDER_IDS',
    'CLIENT_IDS',
    'SPEC_PROVIDERS',
    'RELEASE_TAGS',
    `${body}; return PATHS;`,
  )(ERROR_CODES, PENDING_ERROR_CODES, MODEL_SLUGS, MCP_SLUGS, MARKET_PROVIDER_IDS, CLIENT_IDS, SPEC_PROVIDERS, RELEASE_TAGS)
  return new Set(out)
}
