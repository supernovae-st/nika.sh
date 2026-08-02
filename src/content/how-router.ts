import type { TermLine } from '../components/TermFrame'

/* ─── the intent router · what `nika new "<plain words>"` really does ─────────
   The site told this story NOWHERE (one changelog sentence, no page), which
   is G-6's other half. Every fact below was read in the engine source at
   crates/nika-onboard/src/intent.rs and crates/nika-bm25/, and every
   transcript was PROBED against the shipped v0.107.0 binary · including the
   one that fails.

   Two corrections a refuter pass forced, both worth keeping visible:
   (1) there are TWO tokenizers, not one. nika-bm25's is Unicode-aware and
       keeps accented words whole; the router's own lexicon splitter is
       ASCII-only and shatters them. Attributing the shattering to BM25 would
       have been a lie about our own engine.
   (2) the site ALREADY ships something called intent routing (the template
       phrases in templates.generated.ts) and it is NOT this router. This
       page is about the BINARY's router. */

export const ROUTER = {
  /** crates/nika-bm25 · Okapi BM25, canonical (not BM25+) */
  k1: 1.2,
  b: 0.75,
  /** the corpus, at v0.107.0: examples + templates, one flat namespace */
  docs: 49,
  jobs: 26,
  lessons: 13,
  skeletons: 10,
  /** the score floors · each corpus earns its own (BM25 is IDF-relative) */
  tau: 3.0,
  tauCatalog: 5.5,
  margin: 1.3,
  stopwords: 42,
} as const

export type RouterBeat = {
  n: string
  title: string
  plain: string
  detail: string
}

export const ROUTER_BEATS: RouterBeat[] = [
  {
    n: '01',
    title: 'Your words become tokens',
    plain:
      'The utterance is lowercased and split into words. Then 42 stopwords are dropped, and the list includes Nika’s own vocabulary: nika, workflow, tasks, template, slot. Saying "a nika workflow that…" must not out-score the job you actually described.',
    detail: 'crates/nika-onboard/src/intent.rs · the stopword table is closed and hand-audited',
  },
  {
    n: '02',
    title: 'A contract is read from the sentence, with no model',
    plain:
      'Before any score is compared, a deterministic contract is extracted: what the job READS, what it WRITES, whether a human gates it. A closed lexicon of 21 sources and 16 transforms, zero inference. A candidate that cannot honour every required capability is out before it is ranked.',
    detail: 'the capabilities of a candidate are DERIVED from its body, never hand-tabled',
  },
  {
    n: '03',
    title: 'BM25 ranks what survives',
    plain:
      'Okapi BM25 over 49 documents: 26 real jobs, 13 teaching steps, 10 skeletons, all compiled into the binary at build time. There is no index to download and no network call. A document is its name plus its body with comments stripped, so the description line you write in a workflow is what the router reads.',
    detail: 'k1 = 1.2 · b = 0.75 · the Lucene idf form, floored at zero',
  },
  {
    n: '04',
    title: 'A floor and a margin decide whether it may answer',
    plain:
      'Two conditions, both required. The winner must clear the floor for its corpus, and it must beat the runner-up in its own facet by a margin. Neighbours from a different facet do not trigger the margin: a job and a skeleton are different kinds of answer, not rivals.',
    detail: 'floor 5.5 over the whole catalog · 3.0 over the skeleton set · margin 1.3',
  },
  {
    n: '05',
    title: 'When it is not sure, it says so',
    plain:
      'Three ways to fail, and all of them ask instead of guessing: nothing left after stopwords, the contract emptied the field, or the score sat below the floor. You get up to three candidates with their own descriptions and a command that works. A confident route writes the file; an unsure one writes nothing.',
    detail: 'a routed skeleton is announced as a DRAFT · a routed example says « yours now »',
  },
]

/** the confident route · probed at v0.107.0 in an empty directory */
export const ROUTE_HIT: TermLine[] = [
  { kind: 'cmd', text: 'nika new "summarize a csv every monday" x.nika.yaml' },
  { kind: 'out', text: 'x.nika.yaml ← routed intent → template `chain`' },
  { kind: 'soft', text: '  a DRAFT · fill the `# SLOT:` lines, then `nika check x.nika.yaml`' },
]

/** the honest refusal · the score sat below the floor */
export const ROUTE_UNSURE: TermLine[] = [
  { kind: 'cmd', text: 'nika new "make it good" out.nika.yaml' },
  { kind: 'warn', text: '`make it good` doesn\'t route confidently · closest matches:' },
  { kind: 'dim', text: '    etl-quarantine   incremental data job with a state file' },
  { kind: 'dim', text: '    chain            gather facts → one model step → persist' },
  { kind: 'soft', text: '  name one, or describe the job in more words' },
]

/** the limit, published rather than hidden */
export const ROUTE_LIMIT = {
  probe: 'Relance les factures impayées par email après validation humaine',
  control: 'chase unpaid invoices by email after human approval',
  says:
    'The same job, described in French, does not route. The lexicon splitter inside the router is ASCII-only, so an accented word breaks into pieces that match nothing: « impayées » becomes « impay » and « es ». The BM25 tokenizer beside it is Unicode-aware and keeps the word whole, which is why the two disagree. Until the splitter learns Unicode, plain-word routing is an English-first door, and the honest workaround is to name the skeleton instead of describing the job.',
}
