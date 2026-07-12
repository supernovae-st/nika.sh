import { describe, expect, it } from 'vitest'
import { CODE_REFS, TEMPLATE_REFS } from '../content/graph'
import { WORD_USAGE } from '../content/language-usage.generated'
import { TOOL_USAGE } from '../content/tool-usage.generated'
import { ERROR_CODES } from '../content/errors.generated'
import { TEMPLATE_INDEX } from '../content/templates.generated'
import { WORD_INDEX } from '../content/language.generated'
import { TOOL_INDEX } from '../content/tools.generated'

/* ── the closed-graph gates ───────────────────────────────────────────────────
   graph.ts inverts the rooms' own data; these gates pin EXACT
   bidirectionality both ways (an edge in a room appears in the back-ref,
   and every back-ref edge exists in a room), and that every node the
   graph names is a registered page. */

describe('graph · the cross-reference graph is closed and exact', () => {
  it('code → refs inverts the rooms exactly (both directions)', () => {
    for (const [word, u] of Object.entries(WORD_USAGE)) {
      for (const c of u.codes) {
        expect(CODE_REFS[c]?.words, `${word} → ${c} missing back-ref`).toContain(word)
      }
    }
    for (const [tool, u] of Object.entries(TOOL_USAGE)) {
      for (const c of u.errorCodes) {
        expect(CODE_REFS[c]?.tools, `${tool} → ${c} missing back-ref`).toContain(tool)
      }
    }
    for (const [code, refs] of Object.entries(CODE_REFS)) {
      for (const w of refs.words) expect(WORD_USAGE[w].codes, `${code} ← ${w}`).toContain(code)
      for (const t of refs.tools) expect(TOOL_USAGE[t].errorCodes, `${code} ← ${t}`).toContain(code)
    }
  })

  it('template → refs inverts the rooms exactly (both directions)', () => {
    for (const [word, u] of Object.entries(WORD_USAGE)) {
      for (const t of u.templates) {
        expect(TEMPLATE_REFS[t]?.words, `${word} → ${t} missing back-ref`).toContain(word)
      }
    }
    for (const [tool, u] of Object.entries(TOOL_USAGE)) {
      for (const t of u.templates) {
        expect(TEMPLATE_REFS[t]?.tools, `${tool} → ${t} missing back-ref`).toContain(tool)
      }
    }
    for (const [tpl, refs] of Object.entries(TEMPLATE_REFS)) {
      for (const w of refs.words) expect(WORD_USAGE[w].templates, `${tpl} ← ${w}`).toContain(tpl)
      for (const t of refs.tools) expect(TOOL_USAGE[t].templates, `${tpl} ← ${t}`).toContain(tpl)
    }
  })

  it('every node the graph names is a registered page', () => {
    const codeSet = new Set(ERROR_CODES.map((c) => c.code))
    for (const code of Object.keys(CODE_REFS)) expect(codeSet.has(code), code).toBe(true)
    for (const tpl of Object.keys(TEMPLATE_REFS)) expect(TEMPLATE_INDEX[tpl], tpl).toBeDefined()
    for (const refs of [...Object.values(CODE_REFS), ...Object.values(TEMPLATE_REFS)]) {
      for (const w of refs.words) expect(WORD_INDEX[w], w).toBeDefined()
      for (const t of refs.tools) expect(TOOL_INDEX[t], t).toBeDefined()
    }
  })

  it('no duplicate edges (each ref appears once per lane)', () => {
    for (const refs of [...Object.values(CODE_REFS), ...Object.values(TEMPLATE_REFS)]) {
      expect(new Set(refs.words).size).toBe(refs.words.length)
      expect(new Set(refs.tools).size).toBe(refs.tools.length)
    }
  })
})
