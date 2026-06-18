/* ─── CodeFile · pure highlighting helpers (no React, no DOM) ─────────────────
   A small, dependency-light YAML tokenizer for the v4 trust-landing CodeFile
   panel. Line/regex based on PURPOSE — we do NOT pull a heavy highlighter
   (Shiki/Prism) into the bundle. The panel is the PRODUCT replica (a real
   editor view of a .nika.yaml file), so the static highlighter ships a
   restrained-but-real YAML editor theme: distinct, muted hues for keys ·
   strings · numbers · booleans/null · comments · the 4 verb keywords (their
   canonical verb-hue) · anchors & ${{ }} template refs · punctuation. The hues
   are CSS vars (theme-aware) resolved by the component — this file only
   CLASSIFIES tokens; it never picks a literal colour.

   This file is React-free so the component module (`CodeFile.tsx`) stays a
   clean component-only export (react-refresh / fast-refresh friendly) and the
   helpers can be unit-tested in isolation. */

/** The 4 Nika verbs, locked forever (D-2026-05-22-N18). */
export const NIKA_VERBS = ['infer', 'exec', 'invoke', 'agent'] as const
export type NikaVerb = (typeof NIKA_VERBS)[number]

/** A monochrome-safe glyph per verb. Distinct, single-cell in a monospace font,
 *  no emoji (no color/variation-selector surprises), grayscale by default. */
const VERB_GLYPH: Record<NikaVerb, string> = {
  infer: '◇', // diamond outline — a thought / inference
  exec: '▷', // play triangle — run a local command
  invoke: '◆', // filled diamond — call a tool
  agent: '✦', // four-point star — an autonomous loop
}

/**
 * Map a Nika verb to its glyph. Pure. Case-sensitive: only the 4 lowercase
 * canonical verbs map; everything else (unknown verb, empty, wrong case) → `·`.
 */
export function verbGlyph(verb: string): string {
  return (VERB_GLYPH as Record<string, string>)[verb] ?? '·'
}

function isNikaVerb(word: string): word is NikaVerb {
  return (NIKA_VERBS as readonly string[]).includes(word)
}

/* ── token model ──────────────────────────────────────────────────────────
   A token carries a `kind` (mapped to a monochrome class by the component) and
   its raw text. `verb` tokens additionally carry the matched verb so the
   component can prepend the glyph. Tokenizing is per-line; newlines are
   re-inserted by the renderer (one wrapped line per source line). */
export type TokenKind =
  | 'comment' // # ...
  | 'key' // a mapping key (before the colon)
  | 'verb' // a key/list-item that is one of the 4 Nika verbs
  | 'string' // quoted or bare scalar value
  | 'number' // numeric scalar
  | 'boolean' // true / false / null / yes / no / on / off / ~
  | 'tref' // a ${{ … }} template ref or a &anchor / *alias
  | 'punct' // : - [ ] { } , and indentation/leading dashes
  | 'plain' // anything else (whitespace, residual)

export interface Token {
  kind: TokenKind
  text: string
  /** present only when kind === 'verb' */
  verb?: NikaVerb
}

export interface CodeLine {
  tokens: Token[]
}

// key:  — the indent + key name, optionally a leading "- " list dash.
const KEY_RE = /^(\s*)(?:(-)(\s+))?([A-Za-z0-9_.$-]+)(\s*:)(\s*)(.*)$/
// a bare list item that is just a word (e.g. "- agent" or "- infer") with no colon.
const BARE_ITEM_RE = /^(\s*)(-)(\s+)([A-Za-z0-9_.$-]+)\s*$/
const NUMBER_RE = /^-?\d+(?:\.\d+)?$/
// YAML truthy/null scalars (lowercase canonical + the common YAML 1.1 forms).
const BOOL_RE = /^(?:true|false|null|~|yes|no|on|off)$/
// a ${{ … }} template ref or a &anchor / *alias — the "live wiring" of a plan.
const TREF_RE = /(\$\{\{[^}]*\}\}|[&*][A-Za-z0-9_-]+)/

/* Split a scalar value into spans so inline ${{ refs }} / &anchors light up
   distinctly from the surrounding string. A bare boolean/null/number value is
   typed precisely; everything else is a string, with embedded template refs
   carved out as `tref` tokens. */
function classifyValue(value: string): Token[] {
  const v = value.trim()
  if (v === '') return []
  if (NUMBER_RE.test(v)) return [{ kind: 'number', text: value }]
  if (BOOL_RE.test(v)) return [{ kind: 'boolean', text: value }]

  // carve inline ${{ … }} / &anchor / *alias refs out of the string run.
  if (TREF_RE.test(value)) {
    const tokens: Token[] = []
    const parts = value.split(new RegExp(`(${TREF_RE.source})`, 'g'))
    for (const part of parts) {
      if (part === '') continue
      tokens.push({ kind: TREF_RE.test(part) ? 'tref' : 'string', text: part })
    }
    return tokens
  }
  // quoted, bracketed, or any bare scalar → "value" ink
  return [{ kind: 'string', text: value }]
}

/** Tokenize a single YAML line into monochrome spans. */
export function tokenizeLine(line: string): CodeLine {
  // whole-line / trailing comment
  const hash = line.indexOf('#')
  // Only treat as comment when '#' starts the trimmed line OR is preceded by a
  // space (avoids eating '#' inside a value like a url fragment).
  if (hash !== -1 && (hash === 0 || /\s/.test(line[hash - 1] ?? ''))) {
    const before = line.slice(0, hash)
    const comment = line.slice(hash)
    const head = before.length ? tokenizeLine(before).tokens : []
    return { tokens: [...head, { kind: 'comment', text: comment }] }
  }

  const bare = BARE_ITEM_RE.exec(line)
  if (bare) {
    const [, indent, dash, dashSp, word] = bare
    const tokens: Token[] = [{ kind: 'punct', text: `${indent}${dash}${dashSp}` }]
    tokens.push(
      isNikaVerb(word)
        ? { kind: 'verb', text: word, verb: word }
        : { kind: 'string', text: word },
    )
    return { tokens }
  }

  const m = KEY_RE.exec(line)
  if (m) {
    const [, indent, dash, dashSp, key, colon, valSp, value] = m
    const tokens: Token[] = []
    if (indent) tokens.push({ kind: 'punct', text: indent })
    if (dash) tokens.push({ kind: 'punct', text: `${dash}${dashSp}` })
    if (isNikaVerb(key)) tokens.push({ kind: 'verb', text: key, verb: key })
    else tokens.push({ kind: 'key', text: key })
    tokens.push({ kind: 'punct', text: colon })
    if (valSp) tokens.push({ kind: 'plain', text: valSp })
    tokens.push(...classifyValue(value))
    return { tokens }
  }

  // no key/colon and no list item — a bare continuation / scalar line.
  return { tokens: line === '' ? [] : [{ kind: 'plain', text: line }] }
}

/** Tokenize a whole YAML document, one CodeLine per source line. */
export function tokenize(yaml: string): CodeLine[] {
  return yaml.replace(/\r\n/g, '\n').split('\n').map(tokenizeLine)
}
