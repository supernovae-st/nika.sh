/* ─── read-sources · the compiler's one reading room ─────────────────────────
   Every truth source build-atlas.mjs consumes, read ONCE here, each with the
   same discipline census.mjs proved: controlled-emission TS modules are
   sliced and JSON.parsed (never eval'd) — if an emission style drifts, the
   parse dies loudly and names the drifted file. Pure readers: no writes,
   no dates, no randomness (the resume-safe determinism law). */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

/** quote bare/single-quoted keys of a controlled TS object/array literal,
    strip trailing commas, then JSON.parse — census.mjs's parseCanon,
    generalized. */
function parseTsLiteral(body, file) {
  const jsonish = body
    .replace(/'([^'\\]*)'\s*:/g, '"$1":')
    .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/,(\s*[}\]])/g, '$1')
  try {
    return JSON.parse(jsonish)
  } catch (e) {
    throw new Error(`${file}: emission style drifted — ${e.message}`)
  }
}

/** slice the literal that starts at the first `open` char after the `=`
    following `marker` (skipping the type annotation, where `LanguageWord[]`
    would otherwise be caught as the literal) · bracket-matched, string-aware
    for double quotes. */
function sliceLiteral(ts, marker, open, close, file) {
  const at = ts.indexOf(marker)
  if (at === -1) throw new Error(`${file}: marker not found: ${marker}`)
  const eq = ts.indexOf('=', at)
  if (eq === -1) throw new Error(`${file}: no = after marker`)
  const start = ts.indexOf(open, eq)
  if (start === -1) throw new Error(`${file}: no ${open} after marker`)
  let depth = 0
  let inStr = false
  for (let i = start; i < ts.length; i++) {
    const c = ts[i]
    if (inStr) {
      if (c === '\\') i++
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') inStr = true
    else if (c === open) depth++
    else if (c === close) {
      depth--
      if (depth === 0) return ts.slice(start, i + 1)
    }
  }
  throw new Error(`${file}: unbalanced ${open}${close} after ${marker}`)
}

export function readSources(ROOT) {
  const read = (p) => readFileSync(join(ROOT, p), 'utf8')
  const json = (p) => JSON.parse(read(p))

  /* canon (spec clock) */
  const canonTs = read('src/canon.generated.ts')
  const canon = parseTsLiteral(
    sliceLiteral(canonTs, 'export const CANON', '{', '}', 'canon.generated.ts'),
    'canon.generated.ts',
  )

  /* the served workflow schema (spec clock · the types set's declared source) */
  const schema = json('public/schema/workflow.json')

  /* the language words (schema projection · spec clock) */
  const langTs = read('src/content/language.generated.ts')
  const words = parseTsLiteral(
    sliceLiteral(langTs, 'export const LANGUAGE_WORDS', '[', ']', 'language.generated.ts'),
    'language.generated.ts',
  )

  /* the usage twins (same-run refs · the site's existing edge derivations) */
  const wordRefs = parseTsLiteral(
    sliceLiteral(
      read('src/content/language-usage-refs.generated.ts'),
      'export const WORD_USAGE_REFS',
      '{',
      '}',
      'language-usage-refs.generated.ts',
    ),
    'language-usage-refs.generated.ts',
  )
  const toolRefs = parseTsLiteral(
    sliceLiteral(
      read('src/content/tool-usage-refs.generated.ts'),
      'export const TOOL_USAGE_REFS',
      '{',
      '}',
      'tool-usage-refs.generated.ts',
    ),
    'tool-usage-refs.generated.ts',
  )

  /* the showcase DAG models (conformance-gated upstream · spec clock) */
  const dag = parseTsLiteral(
    sliceLiteral(
      read('src/sections/usecases-yaml.generated.ts'),
      'export const SHOWCASE_DAG',
      '{',
      '}',
      'usecases-yaml.generated.ts',
    ),
    'usecases-yaml.generated.ts',
  )

  /* the gate matrix (vendored spec fixtures · #283): the compiler reads the
     VERDICT plane only — a targeted extractor over our own emission (the
     objects embed multi-line YAML strings, so the generic literal parser
     is the wrong tool; the field order is JSON.stringify's, stable) */
  const gmSrc = read('src/content/gate-matrix.generated.ts')
  const gateMatrix = [
    ...gmSrc.matchAll(
      /"producer": "(\w+)",\s*"form": "([\w-]+)",\s*"dead": (true|false),\s*"verdict": "(\w+)",\s*"code": (null|"[\w-]+"),\s*"fixture": (null|"[^"]+")/g,
    ),
  ].map((m) => ({
    producer: m[1],
    form: m[2],
    dead: m[3] === 'true',
    verdict: m[4],
    code: m[5] === 'null' ? null : JSON.parse(m[5]),
    fixture: m[6] === 'null' ? null : JSON.parse(m[6]),
  }))
  if (gateMatrix.length !== 40) {
    throw new Error(`gate-matrix.generated.ts: verdict extractor found ${gateMatrix.length}/40 cells — emission drifted`)
  }

  /* the served catalogs */
  const tools = json('public/tools/catalog.json')
  const providers = json('public/providers/catalog.json')
  const errors = json('public/errors/catalog.json')
  const templates = json('public/templates/catalog.json')

  /* the descriptor (the ONE authored input) + market vocab */
  const sets = parseYaml(read('scripts/atlas/sets.yaml'))
  const marketVocab = parseYaml(read('scripts/atlas/market-vocab.yaml'))

  /* the displayed release truth (release cascade maintains it · the
     version-truth gate pins every served surface to it) */
  const engineVersion = /export const ENGINE_VERSION = '(v[\d.]+)'/.exec(read('src/content.ts'))?.[1]
  if (!engineVersion) throw new Error('content.ts: ENGINE_VERSION not found')

  /* design tokens (SSOT values · the constellation bakes them into its
     standalone svg — values change SPEC-FIRST, this only reads) */
  const tokensTs = read('src/design-tokens.generated.ts')
  const hex = (name) => {
    const m = new RegExp(`${name}: '(#[0-9a-fA-F]{6})'`).exec(tokensTs)
    if (!m) throw new Error(`design-tokens: ${name} not found`)
    return m[1]
  }
  const tokens = {
    infer: hex('infer'),
    exec: hex('exec'),
    invoke: hex('invoke'),
    agent: hex('agent'),
    ok: hex('ok'),
    fail: hex('fail'),
    markIce: hex('markIce'),
    accent: hex('accent'),
    accentBright: hex('accentBright'),
  }

  /* the spec pin — stamped by the resync cron from its fresh clone; null
     until the first post-atlas resync runs (named in the report) */
  const pinPath = join(ROOT, 'public/spec/v1/PIN')
  const specPin = existsSync(pinPath) ? readFileSync(pinPath, 'utf8').trim() : null

  /* blog posts (mentions scan · backtick spans only) */
  const blogDir = join(ROOT, 'content/blog')
  const posts = readdirSync(blogDir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort()
    .map((f) => {
      const md = readFileSync(join(blogDir, f), 'utf8')
      /* the ROUTE slug lives in the frontmatter — the filename carries the
         date prefix and is NOT a URL (the graph once linked /blog/<file> and
         every post node was a dead door) */
      const meta = Object.fromEntries(
        [...(md.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '').matchAll(/^([a-z_]+):\s*"?([^"\n]*)"?$/gm)]
          .map((m) => [m[1], m[2]]),
      )
      return { slug: meta.slug ?? f.replace(/\.md$/, ''), title: meta.title ?? f, date: meta.date ?? '', md }
    })

  return {
    canon,
    words,
    wordRefs,
    toolRefs,
    dag,
    tools,
    providers,
    errors,
    templates,
    sets,
    marketVocab,
    engineVersion,
    schema,
    specPin,
    posts,
    tokens,
    gateMatrix,
  }
}
