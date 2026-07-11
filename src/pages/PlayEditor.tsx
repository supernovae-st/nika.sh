import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { yaml as yamlLang } from '@codemirror/lang-yaml'
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import { syntaxHighlighting } from '@codemirror/language'
import { lintNika, type LintDiag } from '../lib/nika-lint'
import { NIKA_VERB_HEX } from '../design-tokens.generated'
import {
  CF_BG,
  CF_GUTTER_INK,
  CF_LINE,
  CF_NUM,
  CF_BOOL,
  CF_PLAIN,
  CF_REF,
  cfHighlight,
  nikaHoverTips,
  nikaMarks,
  wrapHang,
} from './play-editor-voice'

/* ─── /play · the editor · lazy chunk ────────────────────────────────────────
   CodeMirror + its YAML language + the lint plumbing live ONLY here. Play.tsx
   pulls this in via React.lazy, so the ~big editor is its own chunk instead of
   riding the shared main bundle that every other route eagerly loads. The
   prerendered /play HTML has NO .cm-editor DOM (CodeMirror is a client-only
   widget) so deferring it changes nothing about the static page — it mounts on
   hydration just as before.

   THEME · the editor speaks the SAME yaml dialect as the static CodeFile — the
   token voice (highlight + nika marks) lives in play-editor-voice.ts; this
   theme owns the surface, gutter, caret, selection, active line, scrollbar,
   the mark colours and the lint tooltip register. With theme="none" nothing
   else competes; { dark: true } keeps the base dark variants for the rest. */

/* a11y · name the textbox + make the content explicitly tabbable so the
   scroller's well has a reachable child in every checker's book (bare
   contenteditable is focusable natively but not counted by axe). */
const cmA11y = EditorView.contentAttributes.of({
  'aria-label': 'workflow YAML editor',
  tabindex: '0',
})

/* the editor surface · matches .cf-body / .cf-pre / .cf-line / .cf-ln in
   components/codefile.css. */
const cfTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: CF_BG,
      fontSize: '12.5px',
    },
    '.cm-content': {
      fontFamily: 'var(--mono)',
      caretColor: CF_REF,
      color: CF_PLAIN,
      padding: '11px 0 13px',
    },
    '.cm-line': { padding: '0 18px 0 14px', lineHeight: '1.5' },
    '&.cm-focused': { outline: 'none' },
    /* the caret · teal live-wiring, like the CodeFile's ref accent */
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: CF_REF, borderLeftWidth: '2px' },
    '&.cm-focused .cm-cursor': { borderLeftColor: CF_REF },
    /* selection · a faint teal wash (matches the lit-line tint) */
    '.cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgb(95 211 209 / 0.18)',
    },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: 'rgb(95 211 209 / 0.22)' },
    /* the active line band + brighter gutter · the CodeFile lit-line treatment */
    '.cm-activeLine': { backgroundColor: 'rgb(255 255 255 / 0.035)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#9aa1ad' },
    /* the gutter · dim, right-aligned, with the hairline divider (= .cf-line bg) */
    '.cm-gutters': {
      backgroundColor: CF_BG,
      borderRight: `1px solid ${CF_LINE}`,
      color: CF_GUTTER_INK,
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 11px 0 13px',
      fontVariantNumeric: 'tabular-nums',
      fontSize: '11.5px',
      opacity: '0.8',
    },
    /* the nika marks · the 4 verbs in their canonical hues (the CodeFile
       signature — type `infer:` and it lights up like everywhere on the site),
       refs in teal live-wiring, number/bool values amber/mauve. */
    '.cm-nika-verb': { fontWeight: '500' },
    '.cm-nika-verb--infer': { color: `var(--verb-infer, ${NIKA_VERB_HEX.infer})` },
    '.cm-nika-verb--exec': { color: `var(--verb-exec, ${NIKA_VERB_HEX.exec})` },
    '.cm-nika-verb--invoke': { color: `var(--verb-invoke, ${NIKA_VERB_HEX.invoke})` },
    '.cm-nika-verb--agent': { color: `var(--verb-agent, ${NIKA_VERB_HEX.agent})` },
    '.cm-nika-ref': { color: CF_REF },
    '.cm-nika-num': { color: CF_NUM, fontVariantNumeric: 'tabular-nums' },
    '.cm-nika-bool': { color: CF_BOOL, fontWeight: '500' },
    /* the lint hover card · the site panel register (hairline, mono, the
       error accent riding the exec amber like the validator panel). */
    '.cm-tooltip': {
      backgroundColor: '#12141b',
      border: `1px solid rgb(255 255 255 / 0.1)`,
      borderRadius: '8px',
      color: '#c8cdd8',
      fontFamily: 'var(--mono)',
      fontSize: '11.5px',
      overflow: 'hidden',
    },
    '.cm-tooltip.cm-tooltip-lint': { padding: '2px 0' },
    '.cm-diagnostic': { padding: '6px 10px', whiteSpace: 'pre-wrap' },
    '.cm-diagnostic-error': { borderLeft: `3px solid var(--verb-exec, ${NIKA_VERB_HEX.exec})` },
    /* the smart-hover card rides a CM tooltip — the card (codefile.css twin)
       owns the chrome, so the lint-tooltip shell steps aside for it */
    '.cm-tooltip:has(> .cm-nika-tipcard)': {
      backgroundColor: 'transparent',
      border: 'none',
      overflow: 'visible',
    },
    /* a thin, unobtrusive scrollbar (matches .cf-pre) */
    '.cm-scroller': {
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgb(255 255 255 / 0.14) transparent',
      overscrollBehavior: 'contain',
    },
  },
  { dark: true },
)

export interface PlayEditorProps {
  value: string
  onChange: (next: string) => void
  onDiags: (diags: LintDiag[]) => void
}

export default function PlayEditor({ value, onChange, onDiags }: PlayEditorProps) {
  /* the CodeMirror lint source · same call that fills the verdict panel */
  const cmLinter = useMemo(
    () =>
      linter(
        (view) => {
          const src = view.state.doc.toString()
          const found = lintNika(src)
          onDiags(found)
          return found.map((d): Diagnostic => {
            const line = view.state.doc.line(Math.min(d.line, view.state.doc.lines))
            return {
              from: line.from,
              to: line.to,
              severity: 'error',
              message: `${d.code} · ${d.message}\n→ ${d.fix}`,
            }
          })
        },
        { delay: 300 },
      ),
    [onDiags],
  )

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme="none"
      extensions={[
        yamlLang(),
        cmLinter,
        lintGutter(),
        cmA11y,
        syntaxHighlighting(cfHighlight),
        nikaMarks,
        nikaHoverTips /* the static panels' curated hover glossary, live */,
        EditorView.lineWrapping /* long SLOT comments fade into wrap, never clip */,
        wrapHang /* …and continuations hang at the line's indent (static law) */,
        cfTheme,
      ]}
      basicSetup={{ foldGutter: false, autocompletion: false, highlightActiveLine: true }}
      style={{ minHeight: 480 }}
    />
  )
}
