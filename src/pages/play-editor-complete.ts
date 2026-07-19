import type { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete'
import { CANON } from '../canon.generated'
import { TOOLS } from '../content/tools.generated'
import { PROVIDERS } from '../content/providers.generated'

/* ─── play-editor-complete · CANON autocompletion (WO-14 · U6) ───────────────
   ONE completion source, vocabulary from the generated registries only —
   nothing here can drift from the spec/engine because nothing here is
   typed by hand:

   · `tool:` values   → the nika: builtins (tools.generated · descriptions
                        ride as info lines);
   · `model:` values  → `<provider>/` prefixes (providers.generated · the
                        catalog's own kind as detail — the model tail stays
                        the author's, the catalog page teaches the ids);
   · top-level keys   → the envelope vocabulary;
   · task-item keys   → the task grammar (both pinned against the SHIPPED
                        schema by play-editor-complete.test — a schema move
                        goes red naming the key, the list can never rot).

   This module rides the /play lazy chunk (PlayEditor) — zero entry bytes. */

/* the structural keys — pinned to public/spec/shipped/workflow.schema.json
   by the test (hand-listed here because a JSON schema is not a TS module;
   the GATE is what keeps it honest) */
export const TOP_LEVEL_KEYS = [
  'nika',
  'workflow',
  'description',
  'model',
  'vars',
  'env',
  'secrets',
  'permits',
  'tasks',
  'outputs',
] as const

export const TASK_KEYS = [
  'id',
  'depends_on',
  'when',
  'for_each',
  'max_parallel',
  'fail_fast',
  'retry',
  'on_error',
  'timeout',
  'on_finally',
  'with',
  'output',
  ...CANON.verbNames,
] as const

const toolOptions: Completion[] = TOOLS.map((t) => ({
  label: `"${t.name}"`,
  displayLabel: t.name,
  type: 'function',
  detail: t.category,
  info: t.description,
}))

const modelOptions: Completion[] = PROVIDERS.map((p) => ({
  label: `${p.id}/`,
  type: 'namespace',
  detail: p.kind,
  info: p.name,
}))

const topLevelOptions: Completion[] = TOP_LEVEL_KEYS.map((k) => ({
  label: `${k}:`,
  displayLabel: k,
  type: 'keyword',
}))

const taskKeyOptions: Completion[] = TASK_KEYS.map((k) => ({
  label: `${k}:`,
  displayLabel: k,
  type: (CANON.verbNames as readonly string[]).includes(k) ? 'method' : 'property',
  ...((CANON.verbNames as readonly string[]).includes(k) ? { detail: 'verb' } : {}),
}))

/* the task heads visible in the doc — the parse-plan head grammar (block
   `  - id: x` and flow `  - { id: x`), scanned on demand: depends_on wants
   the OTHER tasks' ids, and a wrong id is the workshop's most common
   DAG-003. The current item's own head is excluded (self-dependency). */
function docTaskIds(ctx: CompletionContext, uptoLine: number): { ids: string[]; own: string | null } {
  const ids: string[] = []
  let own: string | null = null
  let inTasks = false
  for (let n = 1; n <= ctx.state.doc.lines; n++) {
    const text = ctx.state.doc.line(n).text
    if (/^[A-Za-z0-9_-]+\s*:/.test(text)) inTasks = /^tasks\s*:/.test(text)
    const m = inTasks
      ? (text.match(/^ {2}- id:\s*([a-z][a-z0-9_]*)/) ?? text.match(/^ {2}- \{ id:\s*([a-z][a-z0-9_]*)/))
      : null
    if (m) {
      ids.push(m[1])
      if (n <= uptoLine) own = m[1]
    }
  }
  return { ids, own }
}

export function nikaComplete(ctx: CompletionContext): CompletionResult | null {
  const line = ctx.state.doc.lineAt(ctx.pos)
  const before = line.text.slice(0, ctx.pos - line.from)

  /* depends_on: value position — offer the doc's OTHER task ids (block list
     `[a, b]` or a `- ` item under depends_on both end in an id-ish tail) */
  const dep = before.match(/\bdepends_on:\s*\[?\s*(?:[a-z][a-z0-9_]*\s*,\s*)*([a-z0-9_]*)$/)
  if (dep) {
    const { ids, own } = docTaskIds(ctx, line.number)
    const options: Completion[] = ids
      .filter((id) => id !== own)
      .map((id) => ({ label: id, type: 'variable', detail: 'task' }))
    if (!options.length) return null
    return { from: ctx.pos - dep[1].length, options, validFor: /^[a-z0-9_]*$/ }
  }

  /* tool: "nika:… — value position (invoke's tool · agent's tools rows) */
  const tool = before.match(/"(nika:[a-z_]*)?$/)
  if (tool && /\btools?:/.test(line.text)) {
    const typed = tool[1] ?? ''
    return {
      from: ctx.pos - typed.length - 1,
      options: toolOptions,
      validFor: /^"?nika:[a-z_]*"?$/,
    }
  }

  /* model: <provider>/ — value position */
  const model = before.match(/\bmodel:\s*("?)([a-zA-Z0-9/._:-]*)$/)
  if (model) {
    return {
      from: ctx.pos - model[2].length,
      options: modelOptions,
      validFor: /^[a-zA-Z0-9/._:-]*$/,
    }
  }

  /* key positions: indentation decides the register (the W2 grammar) */
  const key = before.match(/^(\s*)(- )?([a-z_]*)$/)
  if (key) {
    const indent = key[1].length
    const word = key[3]
    const from = ctx.pos - word.length
    if (indent === 0 && !key[2]) {
      if (!word && !ctx.explicit) return null
      return { from, options: topLevelOptions, validFor: /^[a-z_]*$/ }
    }
    /* inside a task item: the `  - ` head or the 4-space body keys */
    if ((indent === 2 && key[2]) || indent === 4) {
      if (!word && !ctx.explicit) return null
      return { from, options: taskKeyOptions, validFor: /^[a-z_]*$/ }
    }
  }
  return null
}
