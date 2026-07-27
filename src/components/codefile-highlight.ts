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

import { NIKA_VERB_GLYPH } from '../design-tokens.generated'
import { BOUNDARY_WORDS, WIRE_WORDS, FAIL_WORDS } from '../content/code-roles.generated'

/** The 4 Nika verbs, locked forever (D-2026-05-22-N18). */
export const NIKA_VERBS = ['infer', 'exec', 'invoke', 'agent'] as const
export type NikaVerb = (typeof NIKA_VERBS)[number]

/** The monochrome-safe glyph per verb (◇ ▷ ◆ ✦) — read from the generated
 *  design-token SSOT (design/tokens.yaml via nika-spec), so the site, the
 *  VS Code extension and every other consumer speak the same icon language.
 *  Distinct, single-cell in a monospace font, no emoji (no color/variation-
 *  selector surprises), grayscale by default. */
const VERB_GLYPH: Record<NikaVerb, string> = NIKA_VERB_GLYPH

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

/** the SEMANTIC role of a declared key, resolved from its position in the
    file rather than from its spelling. `tools` is agent-scoped under a verb
    and boundary-scoped under `permits:` — only the parent chain can tell
    them apart, which is why tokenize() carries an indent stack. */
export type TokenRole = 'boundary' | 'wire' | 'fail'

export interface Token {
  kind: TokenKind
  text: string
  /** present only when kind === 'verb' */
  verb?: NikaVerb
  /** present on keys the contract gives a role (see TokenRole) */
  role?: TokenRole
}

export interface CodeLine {
  tokens: Token[]
  /** the line sits inside the declared boundary (`permits:` / `secrets:` and
      everything beneath). Rendered as a gutter SPINE, not as ink: the blast
      radius is a SHAPE you can see without reading, which is the one question
      a reader asks before any other. */
  band?: 'boundary'
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
    // TREF_RE.source ALREADY contains exactly one capture group, so splitting on
    // it retains each matched ref as a delimiter in the result. Wrapping it in a
    // SECOND `(…)` would make String.split interleave BOTH captured groups,
    // emitting every ref twice (`${{x}}${{x}}`). Split on the single group.
    const parts = value.split(new RegExp(TREF_RE.source, 'g'))
    for (const part of parts) {
      if (part === '') continue
      tokens.push({ kind: TREF_RE.test(part) ? 'tref' : 'string', text: part })
    }
    return tokens
  }
  // quoted, bracketed, or any bare scalar → "value" ink
  return [{ kind: 'string', text: value }]
}

/* ── flow-mapping lines · `- { id: notes, invoke: { tool: "nika:read" } }` ────
   KEY_RE cannot match them (the `{` breaks the key charset), so they used to
   fall through as ONE unstyled `plain` blob — invisible in the hero and, worse,
   a colorless block the moment the F2 morph flies a task line into its DAG
   node. This scanner walks the flow content and emits real tokens: braces /
   brackets / commas as punct, `key:` heads (verb-aware), quoted strings with
   ${{ refs }} carved out, numbers/booleans typed, bare scalars as string. */
const FLOW_LINE_RE = /^(\s*)(?:(-)(\s+))?(\{.*)$/
const FLOW_KEY_HEAD_RE = /^([A-Za-z0-9_.$-]+)(\s*:)(?=\s|$|[,}\]])/

function tokenizeFlow(content: string): Token[] {
  const tokens: Token[] = []
  let rest = content
  const push = (kind: TokenKind, text: string, verb?: NikaVerb) => {
    if (text === '') return
    tokens.push(verb ? { kind, text, verb } : { kind, text })
  }
  while (rest.length > 0) {
    const ws = rest.match(/^\s+/)
    if (ws) {
      push('plain', ws[0])
      rest = rest.slice(ws[0].length)
      continue
    }
    const punct = rest.match(/^[{}[\],]+/)
    if (punct) {
      push('punct', punct[0])
      rest = rest.slice(punct[0].length)
      continue
    }
    const tref = rest.match(/^\$\{\{[^}]*\}\}/)
    if (tref) {
      push('tref', tref[0])
      rest = rest.slice(tref[0].length)
      continue
    }
    const quoted = rest.match(/^"[^"]*"/)
    if (quoted) {
      /* carve inline ${{ refs }} out of the quoted run (same rule as block style) */
      for (const part of quoted[0].split(new RegExp(TREF_RE.source, 'g'))) {
        if (part !== '') push(TREF_RE.test(part) ? 'tref' : 'string', part)
      }
      rest = rest.slice(quoted[0].length)
      continue
    }
    const keyHead = FLOW_KEY_HEAD_RE.exec(rest)
    if (keyHead) {
      const [, key, colon] = keyHead
      if (isNikaVerb(key)) push('verb', key, key)
      else push('key', key)
      push('punct', colon)
      rest = rest.slice(key.length + colon.length)
      continue
    }
    /* a bare scalar run — up to the next flow delimiter */
    const scalar = rest.match(/^[^\s{}[\],]+/)
    if (scalar) {
      const v = scalar[0]
      push(NUMBER_RE.test(v) ? 'number' : BOOL_RE.test(v) ? 'boolean' : 'string', v)
      rest = rest.slice(v.length)
      continue
    }
    /* unreachable guard — consume one char so the scan always terminates */
    push('plain', rest[0])
    rest = rest.slice(1)
  }
  return tokens
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

  /* a flow-mapping line (`- { … }` or `{ … }`) — KEY_RE can't see into it */
  const flow = FLOW_LINE_RE.exec(line)
  if (flow) {
    const [, indent, dash, dashSp, content] = flow
    const tokens: Token[] = []
    if (indent) tokens.push({ kind: 'punct', text: indent })
    if (dash) tokens.push({ kind: 'punct', text: `${dash}${dashSp}` })
    tokens.push(...tokenizeFlow(content))
    return { tokens }
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
    /* a flow-mapping / flow-sequence VALUE (`fs: { read: [ … ] }` ·
       `tools: [ "nika:read" ]`) gets the same real tokens as a `- { … }`
       line — classifyValue would emit it as ONE untyped string blob (no
       key ink inside it, and a path like ./action-items.json couldn't be
       carved out as an atomic machine-string). */
    if (value.startsWith('{') || value.startsWith('[')) {
      tokens.push(...tokenizeFlow(value))
    } else {
      tokens.push(...classifyValue(value))
    }
    return { tokens }
  }

  // no key/colon and no list item — a bare continuation / scalar line.
  return { tokens: line === '' ? [] : [{ kind: 'plain', text: line }] }
}

/** Tokenize a whole YAML document, one CodeLine per source line. */
/* ── the semantic pass · roles resolved from the PARENT CHAIN ────────────────
   tokenizeLine is deliberately line-local (it is also the flow-line scanner and
   the comment splitter). The contract, though, is positional: the same word
   carries different meaning under different parents. So the role is assigned
   in a second pass that walks the file with an indent stack — the cheapest
   structure that can answer "what am I inside?".

   Only KEYS get roles, and only three families get one at all (the verbs
   already carry hue + glyph of their own):
     · boundary — `permits:` / `secrets:` AND everything beneath them
     · wire     — `with:` / `after:`, the keys that declare an edge
     · fail     — the declared failure grammar

   Everything else stays frame ink. Colour is spent where it carries meaning;
   the rest recedes. */
const BOUNDARY = new Set(BOUNDARY_WORDS)
const WIRE = new Set(WIRE_WORDS)
const FAIL = new Set(FAIL_WORDS)

const KEY_INDENT_RE = /^(\s*)(?:-\s+)?[A-Za-z0-9_.$-]+\s*:/

export function tokenize(yaml: string): CodeLine[] {
  const lines = yaml.replace(/\r\n/g, '\n').split('\n').map(tokenizeLine)
  /* the stack holds [indent, insideBoundary] for each open key */
  const stack: { indent: number; boundary: boolean }[] = []
  const raw = yaml.replace(/\r\n/g, '\n').split('\n')

  lines.forEach((cl, i) => {
    const m = KEY_INDENT_RE.exec(raw[i] ?? '')
    if (!m) {
      /* a continuation line (a flow body, a list item) inherits the block it
         is inside — the spine must not break mid-declaration */
      if (raw[i]?.trim() && stack.some((f) => f.boundary)) cl.band = 'boundary'
      return
    }
    const indent = m[1].length
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop()
    const inBoundary = stack.some((f) => f.boundary)

    const key = cl.tokens.find((t) => t.kind === 'key' || t.kind === 'verb')
    if (key) {
      const w = key.text.trim()
      if (BOUNDARY.has(w) || inBoundary) {
        /* POSITION OVERRULES SPELLING. `exec:` under `permits:` is a permit
           CATEGORY, not the act — it names a program the plan may launch, and
           rendering it as the verb (orange, ▷) told the reader the opposite of
           the truth. Inside the boundary a verb-spelled key is demoted to a
           key and takes the boundary's shield. This is the whole reason the
           pass carries a parent chain instead of a word list. */
        if (key.kind === 'verb') {
          key.kind = 'key'
          delete key.verb
        }
        key.role = 'boundary'
        cl.band = 'boundary'
      } else if (key.kind === 'key') {
        if (WIRE.has(w)) key.role = 'wire'
        else if (FAIL.has(w)) key.role = 'fail'
      }
    }
    const w = key ? key.text.trim() : ''
    const opensBoundary = BOUNDARY.has(w) || inBoundary
    stack.push({ indent, boundary: opensBoundary })
  })
  return lines
}
