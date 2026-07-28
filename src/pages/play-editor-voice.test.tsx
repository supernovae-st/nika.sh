import { describe, expect, it } from 'vitest'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { cmTipAt, nikaMarks, nikaSpansOf, wrapHang } from './play-editor-voice'

/* ─── /play editor · one-voice law (loop T6 · one classifier since 2026-07-28) ─
   The live playground editor speaks the SAME yaml dialect as the static
   CodeFile because it runs the same code: tokenize() drives every span. These
   tests pin (a) the classification as the editor consumes it (nikaSpansOf,
   the pure seam) and (b) that a real EditorView actually renders the spans —
   a silent decorator (wrong precedence, dead plugin) fails here, not in
   production. The classification CASES are unchanged from the regex era on
   purpose: the refactor had to keep every answer while changing the answerer. */

/* the nika-semantic spans of one line, named — base ink (cm-cf-*) filtered out */
const scan = (line: string) =>
  nikaSpansOf(line)
    .spans.filter((s) => !s.cls.startsWith('cm-cf-') || s.cls.includes('cm-nika-role'))
    .map((s) => {
      const text = line.slice(s.from, s.to).trim()
      const verb = s.cls.match(/cm-nika-verb--(\w+)/)
      if (verb) return `verb:${verb[1]}`
      const role = s.cls.match(/cm-nika-role--(\w+)/)
      if (role) return `role:${role[1]}:${text}`
      if (s.cls.includes('cm-nika-ref')) return `ref:${text}`
      return `val:${text}`
    })

describe('the classification · tokenize() as the editor consumes it', () => {
  it('lights the 4 verbs only in key position', () => {
    expect(scan('    invoke:            # SLOT: source')).toEqual(['verb:invoke'])
    expect(scan('    infer:')).toEqual(['verb:infer'])
    expect(scan('  - exec:')).toEqual(['verb:exec'])
    expect(scan('agent:')).toEqual(['verb:agent'])
    /* verbs as VALUES or fragments stay dark — the CodeFile rule */
    expect(scan('  - id: infer-step')).toEqual([])
    expect(scan('mode: exec')).toEqual([])
    expect(scan('    invoker:')).toEqual([])
  })

  it('carves ${{ refs }} anywhere, including inside quoted strings', () => {
    expect(scan('      args: { path: "${{ const.source }}" }')).toEqual([
      'ref:${{ const.source }}',
    ])
    expect(scan('    prompt: Summarize ${{ tasks.gather.output }}')).toEqual([
      'ref:${{ tasks.gather.output }}',
    ])
  })

  it('types bare number/bool values, never inside prose', () => {
    expect(scan('      retries: 3')).toEqual(['val:3'])
    expect(scan('      temperature: 0.2')).toEqual(['val:0.2'])
    expect(scan('      required: true')).toEqual(['val:true'])
    /* on_fail is NOT in the projected fail vocabulary (on_error/on_finally
       are) — a surface that tinted it would invent a classification */
    expect(scan('      on_fail: ~')).toEqual(['val:~'])
    /* trailing comment allowed after the value */
    expect(scan('      timeout: 30   # seconds')).toEqual(['val:30'])
    /* numbers inside strings / ids stay strings */
    expect(scan('model: ollama/qwen3.5:4b')).toEqual([])
    expect(scan('  - id: task2')).toEqual([])
  })

  it('demotes a verb-spelled permit category — the law the regex era broke', () => {
    /* POSITION OVERRULES SPELLING (codefile-highlight, the panel's own words):
       `exec:` under `permits:` names a program the plan may launch, not the
       act. The regex painted it as the orange verb inside the one block that
       most needed reading right; the classifier demotes it to a boundary key
       on BOTH surfaces now, because it IS both surfaces. */
    const doc = 'permits:\n  exec: ["git"]\n  tools: ["nika:read"]'
    const { spans, bands } = nikaSpansOf(doc)
    const at = (word: string) =>
      spans.filter((s) => doc.slice(s.from, s.to).trim() === word).map((s) => s.cls)
    expect(at('exec').join(' ')).toContain('cm-nika-role--boundary')
    expect(at('exec').join(' ')).not.toContain('cm-nika-verb')
    expect(at('permits').join(' ')).toContain('cm-nika-role--boundary')
    /* and the band covers the whole declaration — the spine must not break */
    expect(bands).toEqual([0, 1, 2])
  })
})

describe('the hover resolver · cmTipAt (the static glossary, live)', () => {
  it('tips a curated key when the column sits on it', () => {
    const line = '    with:'
    const hit = cmTipAt(line, 5) /* inside "with" */
    expect(hit?.tip.term).toBe('with')
    expect(line.slice(hit!.from, hit!.to)).toBe('with')
    const after = cmTipAt('    after: { gather: succeeded }', 6)
    expect(after?.tip.term).toBe('after')
  })

  it('tips a verb key with its verb hue', () => {
    const hit = cmTipAt('    infer:', 6)
    expect(hit?.tip.term).toBe('infer')
    expect(hit?.tip.verb).toBe('infer')
  })

  it('tips a ${{ ref }} anywhere in the line, span-exact', () => {
    const line = '      args: { path: "${{ const.source }}" }'
    const s = line.indexOf('${{')
    const hit = cmTipAt(line, s + 5)
    expect(hit?.tip.term).toBe('${{ … }}')
    expect(line.slice(hit!.from, hit!.to)).toBe('${{ const.source }}')
  })

  /* `id` moved out of this list on 2026-07-27: the glossary stopped being a
     curated set of 21 keys and became the contract's declared vocabulary, so
     a declared word now explains itself. Real plumbing — json-schema keys,
     arg names, values, indentation — is not a nika word and stays silent,
     which is what this test was always protecting. */
  it('stays silent on everything the contract does not declare', () => {
    expect(cmTipAt('      type: object', 7)).toBeNull() /* json-schema */
    expect(cmTipAt('      path: ./x.md', 7)).toBeNull() /* an arg name */
    expect(cmTipAt('    tool: "nika:read"', 13)).toBeNull() /* the value */
    expect(cmTipAt('    infer:', 0)).toBeNull() /* the indent */
  })
})

describe('the live editor · rendered voice', () => {
  const DOC = [
    'nika: v1',
    'workflow:',
    '  id: chain',
    'tasks:',
    '  gather:',
    '    invoke:',
    '      tool: "nika:read"',
    '      args: { path: "${{ const.source }}" }',
    '  think:',
    '    infer:',
    '      prompt: go',
    '      temperature: 0.2',
  ].join('\n')

  it('renders verb, ref and value marks as cm-nika-* spans', () => {
    const view = new EditorView({
      state: EditorState.create({
        doc: DOC,
        extensions: [nikaMarks],
      }),
      parent: document.body,
    })
    try {
      const cls = (sel: string) =>
        Array.from(view.dom.querySelectorAll(sel)).map((el) => el.textContent)
      expect(cls('.cm-nika-verb--invoke')).toEqual(['invoke'])
      expect(cls('.cm-nika-verb--infer')).toEqual(['infer'])
      expect(cls('.cm-nika-ref')).toEqual(['${{ const.source }}'])
      expect(cls('.cm-nika-num')).toEqual(['0.2'])
    } finally {
      view.destroy()
    }
  })

  it('hangs wrapped continuations at the line indent (the static wrap law)', () => {
    const view = new EditorView({
      state: EditorState.create({ doc: DOC, extensions: [wrapHang] }),
      parent: document.body,
    })
    try {
      /* "    invoke:" (4 spaces) → first row pulled back 4ch, line padded 4ch */
      const hung = Array.from(
        view.dom.querySelectorAll<HTMLElement>('.cm-line[style*="text-indent"]'),
      )
      expect(hung.length).toBeGreaterThan(0)
      const invoke = hung.find((el) => el.textContent?.includes('invoke:'))
      expect(invoke?.style.textIndent).toBe('-4ch')
      /* jsdom may reorder calc() operands — pin both terms, not the order */
      expect(invoke?.style.paddingLeft).toContain('4ch')
      expect(invoke?.style.paddingLeft).toContain('14px')
      /* flush-left lines carry no device */
      const first = Array.from(view.dom.querySelectorAll<HTMLElement>('.cm-line')).find(
        (el) => el.textContent === 'nika: v1',
      )
      expect(first?.style.textIndent).toBe('')
    } finally {
      view.destroy()
    }
  })
})
