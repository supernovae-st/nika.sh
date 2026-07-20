/* ─── play-breaks · one authored mutation per template seed (WO-11 · U8) ─────
   The human-gated « Experiment · remove an entry… » prose proved the
   pattern; this systematizes it: every TEMPLATE seed carries ONE authored
   break — a real edit the button applies to the live editor, the port
   fires the real code, the room link teaches the rest. Six seeds, six
   DISTINCT codes, six lessons (the I7 discipline: no streaks, no badges,
   one honest experiment each).

   Every `fires` below is the PORT'S OWN VERDICT, read from the first red
   run — never guessed (the first draft guessed VAR-021 where the port
   says DAG-002, and promised a DONE-001 the port only raises on invoke;
   the test caught all of it — fixture-driven authoring at work).

   STRUCTURAL HONESTY: play-breaks.test.ts applies every mutation to the
   REAL skeleton bytes and asserts the promised code actually fires (and
   that the pristine seed does not fire it) — a template diet upstream
   that breaks a `find` goes red in CI, never silently dead in the UI. */

export interface PlayBreak {
  /** the button's label — what the edit does, in the imperative */
  label: string
  /** exact substring of the seed's yaml (the test pins existence + uniqueness) */
  find: string
  replace: string
  /** the NIKA code the port fires on the mutated file (test-proven) */
  fires: string
  /** the one-sentence lesson (rendered beside the button · anti-slop) */
  lesson: string
}

export const PLAY_BREAKS: Record<string, PlayBreak> = {
  chain: {
    label: 'Misspell the task reference',
    find: '${{ tasks.gather.output }}',
    replace: '${{ tasks.gathre.output }}',
    fires: 'NIKA-DAG-002',
    lesson: 'a with binding IS an edge · its target must be a declared task, and a typo dies at check',
  },
  'gate-and-act': {
    label: 'Misspell the vars key',
    find: 'url: "${{ vars.source_url }}"',
    replace: 'url: "${{ vars.sourceurl }}"',
    fires: 'NIKA-VAR-001',
    lesson: 'every ${{ vars.* }} reference must name a declared input · typos die at check, not at 3am',
  },
  fanout: {
    label: 'Type a predicate the set refuses',
    find: '    fail_fast: false\n',
    replace: '    fail_fast: false\n    after: { discover: success }\n',
    fires: 'NIKA-DAG-005',
    lesson: 'the predicate set is CLOSED · succeeded · failed · skipped · terminal · `success` is prose, not a state',
  },
  'etl-state': {
    label: 'Recover from a downstream task',
    find: 'recover: ${{ tasks.empty.output }}',
    replace: 'recover: ${{ tasks.delta.output }}',
    fires: 'NIKA-DAG-004',
    lesson: 'a recover value must come from UPSTREAM · reading your own future is a cycle in disguise',
  },
  'agent-loop': {
    label: 'Drop a closing brace',
    find: '${{ vars.goal }}',
    replace: '${{ vars.goal }',
    fires: 'NIKA-VAR-008',
    lesson: 'an expression opens with two braces and closes with two · a lone } leaves it unclosed, and check names the line',
  },
  'human-gated-ship': {
    label: 'Remove nika:assert from permits',
    find: '"nika:assert", ',
    replace: '',
    fires: 'NIKA-SEC-004',
    lesson: 'once permits: is declared the boundary is default-deny · the body must fit the declared radius',
  },
}
