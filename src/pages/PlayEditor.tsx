import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { yaml as yamlLang } from '@codemirror/lang-yaml'
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import { lintNika, type LintDiag } from '../lib/nika-lint'

/* ─── /play · the editor · lazy chunk ────────────────────────────────────────
   CodeMirror + its YAML language + the lint plumbing live ONLY here. Play.tsx
   pulls this in via React.lazy, so the ~big editor is its own chunk instead of
   riding the shared main bundle that every other route eagerly loads. The
   prerendered /play HTML has NO .cm-editor DOM (CodeMirror is a client-only
   widget) so deferring it changes nothing about the static page — it mounts on
   hydration just as before.

   THEME · the editor is dressed to MATCH the premium static CodeFile (the shared
   product replica · components/codefile.css). It reuses the same dark #0d0e12
   editor surface, the same hairline gutter divider + dim ink, the same teal
   "live-wiring" caret/selection/active-line accent (--cf-ref), and a thin
   scrollbar. The token hues ride CodeMirror's built-in dark highlight (a
   restrained, premium dark-editor palette in the same family as the CodeFile
   --cf-* tones); the chrome around it (traffic-lights tab, filename, status) is
   the .cf-* chrome reused verbatim in Play.tsx. So the live playground reads as
   the SAME editor the rest of the site shows — only this one validates as you
   type. The CodeMirror surface MUST come last in the extension list so it wins
   over the built-in dark theme's background/gutter/selection. */

const CF_BG = '#0d0e12'
const CF_LINE = 'rgb(255 255 255 / 0.07)'
const CF_GUTTER_INK = '#555b67'
const CF_REF = '#5fd3d1' /* the teal live-wiring accent (= --cf-ref) */

/* the editor surface · matches .cf-body / .cf-pre / .cf-line / .cf-ln in
   components/codefile.css. Token COLOURS stay on CodeMirror's own dark highlight
   (a muted premium palette); this theme owns the surface, gutter, caret,
   selection, active line and scrollbar so the chrome reads as the same editor. */
const cfTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: CF_BG,
      fontSize: '12.5px',
    },
    '.cm-content': {
      fontFamily: 'var(--mono)',
      caretColor: CF_REF,
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
      theme="dark"
      extensions={[yamlLang(), cmLinter, lintGutter(), cfTheme]}
      basicSetup={{ foldGutter: false, autocompletion: false, highlightActiveLine: true }}
      style={{ minHeight: 480 }}
    />
  )
}
