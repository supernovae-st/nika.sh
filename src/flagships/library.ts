/* ─── the workflow library · the hero's picking corpus (wave K) ───────────────
   TEN files: the 7 recorded flagships (real traces · the honesty suite in
   trace.test.ts) + 3 browse-only files straight from the embedded pack
   (`nika-pack` examples/showcase · projected verbatim by the spec's
   showcase-projector into usecases-yaml.generated.ts — already on this page
   for the use-case gallery, so re-listing them here costs zero new bytes).

   HONESTY CONTRACT (the run footer law):
   · an item with `flagship` set carries a REAL recorded trace — the run story
     downstream (morph · replay · plan · boundary) may claim « recorded from a
     real nika run » for it.
   · an item WITHOUT `flagship` is browse-only: the pack file is shown to
     read, with `nika run <file>` as the honest affordance — the page never
     replays it and never fabricates a trace for it.

   Data-only module (react-refresh: components-only files must not export
   data — the flagship-data pattern). Plans derive through the SAME
   deriveWorkflow as the flagships; library.test.ts pins the browse plans
   against the spec projector's independent SHOWCASE_DAG derivation. */

import { FLAGSHIP_ENTRIES, type FlagshipEntry } from './index'
import { w1ToW2 } from '../lib/w1-to-w2'
import { deriveWorkflow, type FlagshipPlanModel, type NikaVerb } from './derive'

export interface LibraryItem {
  /** stable pick id (flagship id · or the pack slug for browse-only) */
  id: string
  filename: string
  /** the compact label (basename — the extension renders separately) */
  label: string
  /** one honest phrase: what the job does */
  blurb: string
  yaml: string
  plan: FlagshipPlanModel
  /** inclusive 1-based lit range — the gloss's evidence in the editor */
  highlight: [number, number]
  /** the one-line story (what the highlighted lines demonstrate) */
  gloss: string
  /** the recorded flagship behind this item — absent on browse-only files */
  flagship?: FlagshipEntry
  /** the file's OFFICIAL source (operator 2026-07-13): browse files point
      at their nika-spec pack blob; the recorded seven point at their own
      SERVED copy (public/library/ · byte-pinned to this module by test) */
  sourceUrl: string
}

/** distinct verbs, file order — the picker's glyph row derives, never typed */
export function verbsOf(plan: FlagshipPlanModel): NikaVerb[] {
  const seen: NikaVerb[] = []
  for (const t of plan.tasks) if (!seen.includes(t.verb)) seen.push(t.verb)
  return seen
}

/* one honest phrase per flagship (the recorded seven) */
const FLAGSHIP_BLURBS: Record<string, string> = {
  daily_brief: 'notes, inbox and calendar become the morning brief',
  pr_risk_review: 'scores a diff’s blast radius, probes only when it’s high',
  meeting_actions: 'a transcript becomes typed action items with owners',
  price_watch: 'zero model · pings when the price crosses your line',
  social_repurpose: 'one post rewritten for three channels, in parallel',
  standup_digest: 'yesterday’s commits become your three standup bullets',
  etl_quarantine: 'zero model · bad rows quarantine, good rows aggregate',
}

/* the browse-only wing · shown to read, honest about not being replayed */
const BROWSE: {
  slug: string
  blurb: string
  gloss: string
  highlight: [number, number]
}[] = [
  {
    slug: 't2-invoice-chaser',
    blurb: 'finds the overdue, drafts reminders, waits for your yes',
    /* the lit lines: the approve task — a human answer gates the save */
    gloss: 'invoke: a human yes sits before anything is saved',
    highlight: [48, 54],
  },
  {
    slug: 't4-deep-research-brief',
    blurb: 'an agent works the web inside hard caps, then the brief',
    /* the lit lines: the granted tools + the turn/token ceilings */
    gloss: 'agent: three tools granted, caps it cannot exceed',
    highlight: [35, 40],
  },
  {
    slug: 't3-localization-factory',
    blurb: 'every doc translated in parallel, the tree mirrored back',
    /* the lit lines: the fan-out head — one run per item, rate-limited */
    gloss: 'for_each: one run per doc, three in flight at a time',
    highlight: [43, 44],
  },
]

/** the browse wing's showcase slugs — Home's island carries exactly these
    three files (the register diet: the yaml dictionary is an async chunk) */
export const BROWSE_SLUGS: string[] = BROWSE.map((b) => b.slug)

/** the strip/ghost row — id + label only, ZERO yaml (FileTabs + the morph
    ghost render nothing heavier; the static tab bar must never re-pin the
    dictionary to the initial chunk) */
export const LIBRARY_TABS: { id: string; label: string }[] = [
  ...FLAGSHIP_ENTRIES.map((f) => ({ id: f.id, label: f.label })),
  ...BROWSE.map((b) => ({ id: b.slug, label: b.slug })),
].slice(0, 10)

/** the full library, built where the showcase yamls are AVAILABLE (Home:
    island at first render · async chunk on SPA-nav). A missing browse yaml
    (the one fetch beat) yields an empty model — deriveWorkflow('') is a
    line-scan, honest and crash-free; the editor fills when the chunk lands. */
export function buildLibrary(showcaseYaml: Record<string, string>): LibraryItem[] {
  /* the W2 door (0.104 shipped flip · idempotent): the browse yamls arrive
     either raw from the projector emission (tests) or already door-passed
     (Home's island) — normalize here so the whole model speaks the served
     grammar. See src/lib/w1-to-w2.ts. */
  const served = Object.fromEntries(
    Object.entries(showcaseYaml).map(([k, y]) => [k, w1ToW2(y)]),
  )
  return [
    ...FLAGSHIP_ENTRIES.map((f) => ({
      id: f.id,
      filename: f.filename,
      label: f.label,
      blurb: FLAGSHIP_BLURBS[f.id],
      yaml: f.yaml,
      plan: f.plan,
      highlight: f.highlight,
      gloss: f.gloss,
      sourceUrl: `/library/${f.filename}`,
      flagship: f,
    })),
    ...BROWSE.map((b) => ({
      id: b.slug,
      filename: `${b.slug}.nika.yaml`,
      label: b.slug,
      blurb: b.blurb,
      yaml: served[b.slug] ?? '',
      plan: deriveWorkflow(served[b.slug] ?? ''),
      highlight: b.highlight,
      gloss: b.gloss,
      sourceUrl: `https://github.com/supernovae-st/nika-spec/blob/main/examples/showcase/${b.slug}.nika.yaml`,
    })),
  ]
}

/** every file rides the strip now (operator 2026-07-13): the tab row is a
    BROWSER strip — scrollable, edge-faded, wheel-driven — so the whole
    ten-file corpus lives as tabs and the library picker dies. */
export const HERO_TAB_COUNT = 10
