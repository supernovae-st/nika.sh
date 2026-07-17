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

   Twin: src/lib/w1-to-w2.ts (bundle-side) — same logic, output-parity
   pinned by src/test/w1-to-w2.test.ts. Retirement: when the public spec
   ratifies W2 and the PIN advances past the flip, sources are re-authored
   W2-native and both twins die. */

const TASK_REF = /\btasks\.([a-z][a-z0-9_]*)\b/g

/** Transform one W1 workflow document to W2, with a line map for pinned
    choreographies (SHOWCASE_DAG line0/line1). Idempotent on W2 input. */
export function w1ToW2WithMap(src) {
  const lines = src.split('\n')
  const out = []
  // map[oldIdx] = newIdx (0-based); filled as lines are emitted or dropped
  const map = new Array(lines.length).fill(-1)
  const emit = (text, oldIdx) => {
    if (oldIdx !== undefined) map[oldIdx] = out.length
    out.push(text)
  }
  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // envelope: `workflow:` object → scalar id (+ description promoted)
    if (/^workflow:\s*(#.*)?$/.test(line)) {
      const fields = {}
      const fieldIdx = {}
      let j = i + 1
      const kept = []
      while (j < lines.length && (/^  \S/.test(lines[j]) || lines[j].trim() === '')) {
        const m = /^  (id|description):\s*(.*)$/.exec(lines[j])
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
      let item = null
      const flush = () => {
        if (!item) return
        emit(`  - id: ${item.id}${item.comment ? ` ${item.comment}` : ''}`.trimEnd(), item.headIdx)
        const deps = new Set()
        let hasDependsOn = false
        const body = []
        let inAfterBlock = false
        for (const [b, idx] of item.body) {
          const after = /^    after:\s*(.*?)\s*(?:#.*)?$/.exec(b)
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
          if (/^    depends_on:/.test(b)) hasDependsOn = true
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
          if (next === undefined || !/^  /.test(next)) break
          if (item) item.body.push([l, i])
          else emit(l, i)
          i += 1
          continue
        }
        if (!/^  /.test(l)) break // dedent — tasks block ended
        const name = /^  ([A-Za-z0-9_-]+):\s*(#.*)?$/.exec(l)
        const flowTask = /^  ([A-Za-z0-9_-]+): (\{.*\})\s*(#.*)?$/.exec(l)
        const w2item = /^  - id: ([A-Za-z0-9_-]+)\s*(#.*)?$/.exec(l)
        if (flowTask) {
          // whole task inline: `name: { … }` → one flow seq item, id folded in
          flush()
          const deps = new Set()
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
    mapLine: (n) => (map[n - 1] ?? n - 1) + 1,
  }
}

/** Text-only form (the common case). */
export function w1ToW2(src) {
  return w1ToW2WithMap(src).text
}
