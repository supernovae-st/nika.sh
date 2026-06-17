/* ─── CodeFile · pure highlighting helpers (no React, no DOM) ─────────────────
   A small, dependency-light YAML tokenizer for the v4 trust-landing CodeFile
   panel. Line/regex based on PURPOSE — we do NOT pull a heavy highlighter
   (Shiki/Prism) into the bundle. Monochrome by design: color is reserved for
   the live run + the aurora (design doc §3.2/§3.4), so the static panel paints
   in grayscale and the 4 verbs are told apart by a LEADING GLYPH, not a hue.

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

function classifyValue(value: string): Token[] {
  const v = value.trim()
  if (v === '') return []
  if (NUMBER_RE.test(v)) return [{ kind: 'number', text: value }]
  // quoted, bracketed, or any bare scalar → dim "value" ink
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
