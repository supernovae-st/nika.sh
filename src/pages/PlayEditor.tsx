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

   It stays a thin leaf: the seed/state/verdict-panel logic remains in Play; this
   only renders the editor and reports diagnostics back up via onDiags (the same
   lintNika call that fills the panel, run as the editor's live lint source). */

const cmTheme = EditorView.theme(
  {
    '&': { backgroundColor: 'transparent', fontSize: '13px' },
    '.cm-content': { fontFamily: 'var(--mono)', caretColor: 'var(--cyan)' },
    '.cm-gutters': { backgroundColor: 'transparent', borderRight: '1px solid var(--hair)', color: 'var(--fg-ghost)' },
    '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--cyan) 5%, transparent)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--fg-mute)' },
    '&.cm-focused': { outline: 'none' },
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
      extensions={[yamlLang(), cmLinter, lintGutter(), cmTheme]}
      basicSetup={{ foldGutter: false, autocompletion: false, highlightActiveLine: true }}
      style={{ minHeight: 480 }}
    />
  )
}
