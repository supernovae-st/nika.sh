import { describe, expect, it } from 'vitest'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { yaml as yamlLang } from '@codemirror/lang-yaml'
import { syntaxHighlighting } from '@codemirror/language'
import { NIKA_MARK_RE, cfHighlight, nikaMarks } from './play-editor-voice'

/* ─── /play editor · one-voice law (loop T6) ─────────────────────────────────
   The live playground editor must speak the SAME yaml dialect as the static
   CodeFile: the 4 verb keys in their canonical hues, ${{ refs }} in teal
   live-wiring, number/bool values typed. The grammar can't see those (lezer
   tags every plain scalar as `content`), so PlayEditor adds a MatchDecorator.
   These tests pin (a) the mark regex's classification and (b) that a real
   EditorView actually renders the mark spans — a silent decorator (wrong
   precedence, dead plugin, viewport miss) fails here, not in production. */

const scan = (line: string) =>
  Array.from(line.matchAll(NIKA_MARK_RE), (m) =>
    m[2] ? `verb:${m[2]}` : m[3] ? `ref:${m[3]}` : `val:${m[5]}`,
  )

describe('the mark regex · classification', () => {
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
    expect(scan('      args: { path: "${{ vars.source }}" }')).toEqual([
      'ref:${{ vars.source }}',
    ])
    expect(scan('    prompt: Summarize ${{ tasks.gather.output }}')).toEqual([
      'ref:${{ tasks.gather.output }}',
    ])
  })

  it('types bare number/bool values, never inside prose', () => {
    expect(scan('      retries: 3')).toEqual(['val:3'])
    expect(scan('      temperature: 0.2')).toEqual(['val:0.2'])
    expect(scan('      required: true')).toEqual(['val:true'])
    expect(scan('      on_fail: ~')).toEqual(['val:~'])
    /* trailing comment allowed after the value */
    expect(scan('      timeout: 30   # seconds')).toEqual(['val:30'])
    /* numbers inside strings / ids stay strings */
    expect(scan('model: ollama/qwen3.5:4b')).toEqual([])
    expect(scan('  - id: task2')).toEqual([])
  })
})

describe('the live editor · rendered voice', () => {
  const DOC = [
    'nika: v1',
    'workflow: chain',
    'tasks:',
    '  - id: gather',
    '    invoke:',
    '      tool: "nika:read"',
    '      args: { path: "${{ vars.source }}" }',
    '  - id: think',
    '    infer:',
    '      prompt: go',
    '      temperature: 0.2',
  ].join('\n')

  it('renders verb, ref and value marks as cm-nika-* spans', () => {
    const view = new EditorView({
      state: EditorState.create({
        doc: DOC,
        extensions: [yamlLang(), syntaxHighlighting(cfHighlight), nikaMarks],
      }),
      parent: document.body,
    })
    try {
      const cls = (sel: string) =>
        Array.from(view.dom.querySelectorAll(sel)).map((el) => el.textContent)
      expect(cls('.cm-nika-verb--invoke')).toEqual(['invoke'])
      expect(cls('.cm-nika-verb--infer')).toEqual(['infer'])
      expect(cls('.cm-nika-ref')).toEqual(['${{ vars.source }}'])
      expect(cls('.cm-nika-num')).toEqual(['0.2'])
    } finally {
      view.destroy()
    }
  })
})
