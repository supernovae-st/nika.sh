/* ── w1-to-w2 · the mechanical grammar pass (0.104 shipped flip) ─────────────
   W1 → W2, exactly three moves, nothing else touched:

     workflow:              →   workflow: <id>
       id: <id>
       description: "…"     →   description: "…"     (promoted to top level)

     tasks:                 →   tasks:
       <name>:              →     - id: <name>
         <body…>            →       <body…>          (unchanged — siblings of id)

     dependency edges       →   depends_on: [a, b]   (W2 is declarative: every
     implicit via ${{tasks.X}}                        `tasks.X` ref and every
     refs and `after:`                                W1 `after:` entry must be
                                                      declared · NIKA-DAG-003)

   Text-level on purpose: the corpus carries comments and exact scalar styles
   a parse/re-emit round-trip would destroy. The pass is only valid for the
   site's regular 2-space YAML — every emission is proved by `nika check`
   downstream, so a shape this pass cannot carry fails loud, never silently.

   Twin: scripts/lib/w1-to-w2.mjs (node-side) — same logic, output-parity
   pinned by src/test/w1-to-w2.test.ts. Retirement: when the public spec
   ratifies W2 and the PIN advances past the flip, sources are re-authored
   W2-native and both twins die. */

const TASK_REF = /\btasks\.([a-z][a-z0-9_]*)\b/g

export interface W2Result {
  text: string
  /** 1-based old line → 1-based new line (deleted lines map to their successor). */
  mapLine: (n: number) => number
}

/** Transform one W1 workflow document to W2, with a line map for pinned
    choreographies (SHOWCASE_DAG line0/line1). Idempotent on W2 input. */
export function w1ToW2WithMap(src: string): W2Result {
  const lines = src.split('\n')
  const out: string[] = []
  // map[oldIdx] = newIdx (0-based); filled as lines are emitted or dropped
  const map: number[] = new Array(lines.length).fill(-1)
  const emit = (text: string, oldIdx?: number): void => {
    if (oldIdx !== undefined) map[oldIdx] = out.length
    out.push(text)
  }
  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // envelope: `workflow:` object → scalar id (+ description promoted)
    if (/^workflow:\s*(#.*)?$/.test(line)) {
      const fields: Record<string, string> = {}
      const fieldIdx: Record<string, number> = {}
      let j = i + 1
      const kept: Array<[string, number]> = []
      while (j < lines.length && (/^ {2}\S/.test(lines[j]) || lines[j].trim() === '')) {
        const m = /^ {2}(id|description):\s*(.*)$/.exec(lines[j])
        if (m) {
          fields[m[1]] = m[2]
          fieldIdx[m[1]] = j
        } else if (lines[j].trim() !== '') kept.push([lines[j].slice(2), j])
        j += 1
      }
      emit(`workflow: ${fields.id ?? ''}`.trimEnd(), i)
      if (fieldIdx.id !== undefined) map[fieldIdx.id] = out.length - 1
      if (fields.description !== undefined) {
        emit(`description: ${fields.description}`, fieldIdx.description)
      }
      for (const [text, idx] of kept) emit(text, idx)
      i = j
      continue
    }

    // tasks: mapping → sequence, one buffered item at a time
    if (/^tasks:\s*(#.*)?$/.test(line)) {
      emit(line, i)
      i += 1
      let item: {
        id: string
        comment: string
        headIdx: number
        body: Array<[string, number]>
      } | null = null
      const flush = (): void => {
        if (!item) return
        emit(`  - id: ${item.id}${item.comment ? ` ${item.comment}` : ''}`.trimEnd(), item.headIdx)
        const deps = new Set<string>()
        let hasDependsOn = false
        const body: Array<[string, number]> = []
        let inAfterBlock = false
        for (const [b, idx] of item.body) {
          const after = /^ {4}after:\s*(.*?)\s*(?:#.*)?$/.exec(b)
          if (after) {
            // inline `after: [a, b]` / flow map `{ k: state }` (keys only) —
            // or a BLOCK header whose children follow
            const rest = after[1]
            const pattern = rest.startsWith('{') ? /([a-z][a-z0-9_]*)\s*:/g : /[a-z][a-z0-9_]*/g
            for (const m of rest.matchAll(pattern)) deps.add(m[1] ?? m[0])
            inAfterBlock = rest === ''
            map[idx] = out.length // dropped `after:` maps to what lands next
            continue
          }
          if (inAfterBlock) {
            // W1 rich form `name: succeeded` (the corpus' only state) — the
            // W2 default semantics of depends_on; children fold into the list
            const child = /^ {6}([a-z][a-z0-9_]*):\s*[a-z]+\s*(?:#.*)?$/.exec(b)
            if (child) {
              deps.add(child[1])
              map[idx] = out.length
              continue
            }
            if (b.trim() !== '') inAfterBlock = false
          }
          if (/^ {4}depends_on:/.test(b)) hasDependsOn = true
          for (const m of b.matchAll(TASK_REF)) deps.add(m[1])
          body.push([b, idx])
        }
        deps.delete(item.id)
        if (deps.size > 0 && !hasDependsOn) {
          out.push(`    depends_on: [${[...deps].join(', ')}]`)
        }
        for (const [text, idx] of body) emit(text, idx)
        item = null
      }
      while (i < lines.length) {
        const l = lines[i]
        if (l.trim() === '') {
          const next = lines.slice(i + 1).find((x) => x.trim() !== '')
          if (next === undefined || !/^ {2}/.test(next)) break
          if (item) item.body.push([l, i])
          else emit(l, i)
          i += 1
          continue
        }
        if (!/^ {2}/.test(l)) break // dedent — tasks block ended
        const name = /^ {2}([A-Za-z0-9_-]+):\s*(#.*)?$/.exec(l)
        const flowTask = /^ {2}([A-Za-z0-9_-]+): (\{.*\})\s*(#.*)?$/.exec(l)
        const w2item = /^ {2}- id: ([A-Za-z0-9_-]+)\s*(#.*)?$/.exec(l)
        if (flowTask) {
          // whole task inline: `name: { … }` → one flow seq item, id folded in
          flush()
          const deps = new Set<string>()
          for (const m of flowTask[2].matchAll(TASK_REF)) deps.add(m[1])
          deps.delete(flowTask[1])
          const dep = deps.size > 0 ? `depends_on: [${[...deps].join(', ')}], ` : ''
          emit(
            `  - { id: ${flowTask[1]}, ${dep}${flowTask[2].slice(1).trimStart()}${flowTask[3] ? ` ${flowTask[3]}` : ''}`.trimEnd(),
            i,
          )
        } else if (name) {
          flush()
          item = { id: name[1], comment: name[2] ?? '', headIdx: i, body: [] }
        } else if (w2item) {
          flush()
          emit(l, i) // already W2 — pass through untouched
        } else if (item) {
          item.body.push([l, i])
        } else {
          emit(l, i)
        }
        i += 1
      }
      flush()
      continue
    }

    emit(line, i)
    i += 1
  }

  // fill dropped lines forward: a deleted old line points at the next mapped one
  let nextKnown = out.length - 1
  for (let k = lines.length - 1; k >= 0; k -= 1) {
    if (map[k] === -1) map[k] = nextKnown
    else nextKnown = map[k]
  }

  return {
    text: out.join('\n'),
    mapLine: (n: number) => (map[n - 1] ?? n - 1) + 1,
  }
}

/** Text-only form (the common case). */
export function w1ToW2(src: string): string {
  return w1ToW2WithMap(src).text
}

/* ── the value axis · wnew -> w2 · the inverse of codemod-esplit ─────────────
   C2 split the W2 `vars:` block into typed `inputs:` (required) + literal
   `const:` (the E-split). W2's `vars` schema IS that union ("untyped literal
   OR typed declaration object"), so serving W2 to a 0.104 binary is the exact
   inverse: fold `inputs` + `const` (+ the unused `config`) back into one
   `vars` block, and rewrite every `${{ inputs|const|config.X }}` root ref to
   `${{ vars.X }}`. `secrets` is byte-identical in both grammars — untouched.
   Text-level like w1ToW2: comments and scalar styles the visitor copies survive.
   Twin: scripts/lib/w1-to-w2.mjs — output parity pinned by the test. */
const VALUE_HEADER = /^(inputs|const|config):\s*(#.*)?$/

export function downcastValues(src: string): string {
  const lines = src.split('\n')
  const out: string[] = []
  const bodies: string[] = []
  const PLACEHOLDER = ' VARS '
  let placed = false
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (VALUE_HEADER.test(line)) {
      let j = i + 1
      while (j < lines.length && (lines[j].trim() === '' || /^\s/.test(lines[j]))) {
        if (lines[j].trim() === '') {
          const next = lines.slice(j + 1).find((x) => x.trim() !== '')
          if (next === undefined || !/^\s/.test(next)) break // blank ends the block
        }
        bodies.push(lines[j])
        j += 1
      }
      if (!placed) { out.push(PLACEHOLDER); placed = true }
      i = j
      continue
    }
    out.push(line)
    i += 1
  }
  const merged: string[] = []
  for (const line of out) {
    if (line === PLACEHOLDER) merged.push('vars:', ...bodies)
    else merged.push(line)
  }
  // rewrite ROOT refs only (never a nested `tasks.x.inputs` field) inside ${{ }}
  return merged.join('\n').replace(/\$\{\{([^}]*)\}\}/g, (_m, inner) =>
    '${{' + inner.replace(/(?<![.\w])(inputs|const|config)\.(\w+)/g, 'vars.$2') + '}}')
}

/** The full door · what the site SERVES to a visitor's released binary ·
    envelope (w1ToW2) then value axis (downcastValues). Idempotent on W2. */
export function serveW2(src: string): string {
  return downcastValues(w1ToW2(src))
}

/* ── the predicate axis · wnew -> released set ───────────────────────────────
   The ratified predicate names (success · failure) reached the spec at P-C
   (#118) but the RELEASED binary still speaks the closed set (succeeded ·
   failed · skipped · terminal · DAG-005). Folds ONLY inside task-level
   `after:` blocks (map children · inline flow) — never in prose or prompts. */
const AFTER_PRED: Record<string, string> = { success: 'succeeded', failure: 'failed' }

export function foldPredicates(src: string): string {
  const lines = src.split('\n')
  const out: string[] = []
  let inAfter = false
  for (const line of lines) {
    const inline = /^(\s{4}after:\s*\{)([^}]*)(\}.*)$/.exec(line)
    if (inline) {
      const body = inline[2].replace(/\b(success|failure)\b/g, (w) => AFTER_PRED[w])
      out.push(inline[1] + body + inline[3])
      inAfter = false
      continue
    }
    if (/^\s{4}after:\s*(#.*)?$/.test(line)) { inAfter = true; out.push(line); continue }
    if (inAfter) {
      const child = /^(\s{6}[A-Za-z0-9_-]+:\s*)([a-z]+)(\s*(#.*)?)$/.exec(line)
      if (child && AFTER_PRED[child[2]]) { out.push(child[1] + AFTER_PRED[child[2]] + child[3]); continue }
      if (!child && line.trim() !== '' && !line.trimStart().startsWith('#')) inAfter = false
    }
    out.push(line)
  }
  return out.join('\n')
}

/** The w105 door · what the site serves a RELEASED 0.105 binary · the
    envelope/map/after already speak — only the value axis + the predicate
    names fold. Identity on a W105-native document. */
export function serveW105(src: string): string {
  return foldPredicates(downcastValues(src))
}

/** w105 door with a line map. The value fold only removes/merges lines ABOVE
    `tasks:` (inputs/const are top-level headers) and the predicate fold is
    1:1 — so every task line shifts by one constant delta. */
export function serveW105WithMap(src: string): W2Result {
  const text = serveW105(src)
  const delta = src.split('\n').length - text.split('\n').length
  return { text, mapLine: (n: number) => n - delta }
}
