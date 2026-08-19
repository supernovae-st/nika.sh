import type { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete'
import { CANON } from '../canon.generated'
import { TOOLS } from '../content/tools.generated'
import { PROVIDERS } from '../content/providers.generated'
import { LOOP_LOCALS, NAMESPACES } from '../lib/nika-lint'

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
   the GATE is what keeps it honest) · 0.109: the nine-key envelope — the
   value authorities are inputs · const · secrets (config died into inputs
   with required: false + default:), workflow:/types:/policy: left */
export const TOP_LEVEL_KEYS = [
  'nika',
  'model',
  'inputs',
  'const',
  'secrets',
  'permits',
  'run',
  'tasks',
  'outputs',
] as const

/* the task grammar of 0.109 · for_each is ONE block (its knobs inside) ·
   extract replaced output · lift replaced declassify/inert · cleanup is a
   task on an unwind edge (no on_finally) · group is the fan-in membership */
export const TASK_KEYS = [
  'group',
  'after',
  'when',
  'for_each',
  'retry',
  'on_error',
  'timeout',
  'with',
  'extract',
  'lift',
  'returns',
  'infer',
  'exec',
  'invoke',
  'agent',
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

/* the task heads visible in the doc — the map grammar (0.105+ · the KEY is
   the identity: `  name:` under `tasks:`), scanned on demand: after: wants
   the OTHER tasks' ids, and a wrong id is the workshop's most common
   DAG-002. The current item's own head is excluded (self-dependency). */
function docTaskIds(ctx: CompletionContext, uptoLine: number): { ids: string[]; own: string | null } {
  const ids: string[] = []
  let own: string | null = null
  let inTasks = false
  for (let n = 1; n <= ctx.state.doc.lines; n++) {
    const text = ctx.state.doc.line(n).text
    if (/^[A-Za-z0-9_-]+\s*:/.test(text)) inTasks = /^tasks\s*:/.test(text)
    const m = inTasks ? text.match(/^ {2}([a-z][a-z0-9_]*)\s*:/) : null
    if (m) {
      ids.push(m[1])
      if (n <= uptoLine) own = m[1]
    }
  }
  return { ids, own }
}

/* keys of a top-level envelope block (`inputs:` · `const:` · `secrets:`)
   — two-space children, scanned like the task heads */
function envelopeBlockKeys(ctx: CompletionContext, block: string): string[] {
  const keys: string[] = []
  let inBlock = false
  for (let n = 1; n <= ctx.state.doc.lines; n++) {
    const text = ctx.state.doc.line(n).text
    if (/^[A-Za-z0-9_-]+\s*:/.test(text)) inBlock = new RegExp(`^${block}\\s*:`).test(text)
    else if (inBlock) {
      const m = text.match(/^ {2}([a-z_][a-z0-9_]*)\s*:/)
      if (m) keys.push(m[1])
    }
  }
  return keys
}

/* the groups the doc declares (`    group: <name>` inside a task item) —
   the fold completes only what a member already names */
function docGroups(ctx: CompletionContext): string[] {
  const out: string[] = []
  for (let n = 1; n <= ctx.state.doc.lines; n++) {
    const m = ctx.state.doc.line(n).text.match(/^ {4}group\s*:\s*([a-z][a-z0-9_]*)\s*$/)
    if (m && !out.includes(m[1])) out.push(m[1])
  }
  return out
}

/* the task item the cursor sits in: its for_each truth + its with: keys —
   `item`/`index` are only words INSIDE a for_each task (the lint's rule) */
function currentTaskBlock(ctx: CompletionContext, uptoLine: number): { forEach: boolean; withKeys: string[] } {
  let head = 0
  let inTasks = false
  for (let n = 1; n <= uptoLine; n++) {
    const text = ctx.state.doc.line(n).text
    if (/^[A-Za-z0-9_-]+\s*:/.test(text)) inTasks = /^tasks\s*:/.test(text)
    if (inTasks && /^ {2}[a-z][a-z0-9_]*\s*:/.test(text)) head = n
  }
  const out = { forEach: false, withKeys: [] as string[] }
  if (!head) return out
  let inWith = false
  for (let n = head + 1; n <= ctx.state.doc.lines; n++) {
    const text = ctx.state.doc.line(n).text
    if (/^ {2}[a-z][a-z0-9_]*\s*:/.test(text) || /^[A-Za-z0-9_-]+\s*:/.test(text)) break
    if (/^ {4}for_each\s*:/.test(text)) out.forEach = true
    if (/^ {4}[a-z_]+\s*:/.test(text)) inWith = /^ {4}with\s*:/.test(text)
    else if (inWith) {
      const m = text.match(/^ {6}([a-z_][a-z0-9_]*)\s*:/)
      if (m) out.withKeys.push(m[1])
    }
  }
  return out
}

export function nikaComplete(ctx: CompletionContext): CompletionResult | null {
  const line = ctx.state.doc.lineAt(ctx.pos)
  const before = line.text.slice(0, ctx.pos - line.from)

  /* ${{ ref }} — the lint's own namespaces (ONE list, imported), the doc's
     own names: tasks.<id>.output for the other tasks, inputs/const/secrets
     keys from their envelope blocks, with. keys of the current item,
     item/index only inside a for_each task, group.<name> for the folds */
  const interp = before.match(/\$\{\{\s*([a-z_][a-z0-9_.]*)?$/)
  if (interp) {
    const ref = interp[1] ?? ''
    const from = ctx.pos - ref.length
    const dot = ref.indexOf('.')
    if (dot === -1) {
      const block = currentTaskBlock(ctx, line.number)
      const options: Completion[] = [...NAMESPACES].map((n) => ({
        label: `${n}.`,
        type: 'namespace',
      }))
      /* the fold is not a value namespace · it completes when the doc
         declares a group (with:-only · the lint judges the position) */
      if (docGroups(ctx).length) options.push({ label: 'group.', type: 'namespace', detail: 'fold' })
      if (block.forEach)
        options.push(...[...LOOP_LOCALS].map((l) => ({ label: l, type: 'variable', detail: 'for_each' })))
      return { from, options, validFor: /^[a-z_][a-z0-9_]*\.?$/ }
    }
    const root = ref.slice(0, dot)
    let options: Completion[] = []
    if (root === 'tasks') {
      const { ids, own } = docTaskIds(ctx, line.number)
      options = ids
        .filter((id) => id !== own)
        .map((id) => ({ label: `tasks.${id}.output`, type: 'variable', detail: 'task output' }))
    } else if (root === 'inputs' || root === 'const' || root === 'secrets') {
      options = envelopeBlockKeys(ctx, root).map((k) => ({ label: `${root}.${k}`, type: 'variable' }))
    } else if (root === 'group') {
      options = docGroups(ctx).map((g) => ({ label: `group.${g}`, type: 'variable', detail: 'fold' }))
    } else if (root === 'with') {
      options = currentTaskBlock(ctx, line.number).withKeys.map((k) => ({
        label: `with.${k}`,
        type: 'variable',
      }))
    }
    if (!options.length) return null
    return { from, options, validFor: /^[a-z_][a-z0-9_.]*$/ }
  }

  /* after: producer position — offer the doc's OTHER task ids (inline flow
     `after: { <id>` or a 6-space block child under `after:`) */
  const dep = before.match(/\bafter:\s*\{\s*(?:[a-z][a-z0-9_]*\s*:\s*[a-z]+\s*,\s*)*([a-z0-9_]*)$/)
    ?? (/^\s{6}[a-z0-9_]*$/.test(before) && /\bafter:/.test(ctx.state.doc.line(line.number - 1)?.text ?? '')
      ? before.match(/([a-z0-9_]*)$/)
      : null)
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

  /* key positions: indentation decides the register (the map grammar) */
  const key = before.match(/^(\s*)([a-z_]*)$/)
  if (key) {
    const indent = key[1].length
    const word = key[2]
    const from = ctx.pos - word.length
    if (indent === 0) {
      if (!word && !ctx.explicit) return null
      return { from, options: topLevelOptions, validFor: /^[a-z_]*$/ }
    }
    /* inside a task entry: the 4-space body keys (2-space = the task NAME,
       the author's own word — nothing to offer) */
    if (indent === 4) {
      if (!word && !ctx.explicit) return null
      return { from, options: taskKeyOptions, validFor: /^[a-z_]*$/ }
    }
  }
  return null
}
