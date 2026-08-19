import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { LANGUAGE_SCOPES, LANGUAGE_WORDS } from '../content/language.generated'
import { useLamp } from '../lib/use-lamp'
import { wordRoom } from '../lib/rooms'

/* ─── the word table · where each word is allowed to speak ────────────────────
   62 words, 76 declarations — which means some words speak in more than one
   block, and that is the single fact the register cannot show as a list. `with`
   is not one word; it is the same word standing in four different rooms, and a
   reader who does not know that writes it in the wrong one.

   So the table is by SCOPE, and hovering a word lights its other homes. The
   relation is not invented: it is decls[].scope, straight out of the schema
   projection the editor and the engine validate against. Nothing here is
   authored — move a word in workflow.schema.json and this table moves.

   The cells are the site's shared plate (styles/plate.css, projected from
   nika-spec design/tokens.yaml), lit by the one lamp. */

/* the served schema's own surfaces (LANGUAGE_SCOPES) · dead blocks
   (workflow · on_finally) left with the nine-key envelope and must not
   keep an empty column. Labels stay the table's voice. */
const SCOPE_LABEL: Record<string, string> = {
  envelope: 'the envelope',
  task: 'a task',
  infer: 'infer',
  exec: 'exec',
  invoke: 'invoke',
  agent: 'agent',
  for_each: 'for_each',
  retry: 'retry',
  on_error: 'on_error',
  lift: 'lift',
}
const SCOPES = LANGUAGE_SCOPES.map((s) => ({
  id: s.scope,
  label: SCOPE_LABEL[s.scope] ?? s.scope,
}))

const homes = new Map<string, string[]>()
for (const w of LANGUAGE_WORDS) {
  homes.set(w.word, [...new Set(w.decls.map((d) => d.scope))])
}

export function WordTable() {
  const { ref: lampRef, props: lampProps } = useLamp<HTMLDivElement>()
  const [lit, setLit] = useState<string | null>(null)

  /* one delegated listener for the whole table — 76 cells, no per-cell handler */
  const onOver = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-word]')
    setLit(cell?.dataset.word ?? null)
  }, [])
  const onOut = useCallback(() => setLit(null), [])

  const multi = [...homes.values()].filter((h) => h.length > 1).length

  return (
    <div className="wt" ref={lampRef} {...lampProps}>
      <p className="wt-head">
        <b>{LANGUAGE_WORDS.length} words</b> across {SCOPES.length} blocks, and{' '}
        <b>{multi} of them speak in more than one</b>. Point at a word to see its other homes.
      </p>

      <div
        className="wt-grid cabinet"
        onPointerOver={onOver}
        onPointerLeave={onOut}
        data-dimmed={lit ? '' : undefined}
      >
        {SCOPES.map((scope) => {
          const words = LANGUAGE_WORDS.filter((w) => w.decls.some((d) => d.scope === scope.id))
          return (
            <section key={scope.id} className="wt-col">
              <h3 className="wt-col-head">
                {scope.label}
                <span className="wt-col-n">{words.length}</span>
              </h3>
              <ul className="wt-cells">
                {words.map((w) => {
                  const required = w.decls.some((d) => d.scope === scope.id && d.required)
                  const elsewhere = (homes.get(w.word) ?? []).length - 1
                  return (
                    <li key={`${scope.id}-${w.word}`}>
                      <Link
                        to={wordRoom(w.word)}
                        className={`plate wt-cell${lit === w.word ? ' is-lit' : ''}`}
                        data-word={w.word}
                        data-required={required ? '' : undefined}
                      >
                        <span className="plate-title wt-word">{w.word}</span>
                        {elsewhere > 0 && (
                          <span className="wt-also" aria-label={`also in ${elsewhere} other blocks`}>
                            +{elsewhere}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      <p className="wt-legend">
        A filled corner marks a word the schema <b>requires</b> at that surface; <code>+n</code>{' '}
        counts the other blocks the same word speaks in. Both derive from{' '}
        <code>workflow.schema.json</code>: the served contract, not a second opinion about it.
      </p>
    </div>
  )
}
