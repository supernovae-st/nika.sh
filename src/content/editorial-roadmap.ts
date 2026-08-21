/**
 * Public editorial queue. These are promises, not fabricated publication
 * dates. A candidate moves from here into content/blog only after the daily
 * workflow produces evidence, the deterministic quality law passes and a
 * human approves the Markdown.
 */
export const EDITORIAL_QUEUE = [
  {
    slug: 'the-schedule-is-an-authority-decision',
    tag: 'Engine',
    date: 'next',
    title: 'The schedule is an authority decision',
    teaser:
      'A cadence can decide when money is spent and which missed work returns. A practical walk through the arm registry, its mandatory choices and the one-firer rule.',
  },
  {
    slug: 'a-permit-needs-an-enforcement-backend',
    tag: 'Security',
    date: 'queued',
    title: 'A permit needs an enforcement backend',
    teaser:
      'The file can state a boundary, but the host must still enforce it. What bubblewrap changes on Linux, why strict mode refuses, and how a waiver enters the receipt.',
  },
  {
    slug: 'energy-is-a-sourced-row',
    tag: 'Engine',
    date: 'queued',
    title: 'Energy is a sourced row, not a green badge',
    teaser:
      'What Nika can say when a measured Wh-per-token row exists, what it must say when the row is absent, and why “unknown” is a product feature.',
  },
  {
    slug: 'the-human-gate-dominates-the-effect',
    tag: 'Language',
    date: 'queued',
    title: 'The human gate dominates the effect',
    teaser:
      'Approval is useful only when every effect sits downstream of it. Read the graph, prove the path and keep the answer in the run record.',
  },
] as const
