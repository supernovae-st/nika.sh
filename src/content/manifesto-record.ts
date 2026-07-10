/* ─── manifesto record · the proof layer (§05 · W1 data spine) ─────────────────
   The manifesto's sections 01-04 are the poem: operator voice, no vendor named,
   no fact-checkable number. THIS module is the deliberate opposite register:
   ONLY dated, sourced, falsifiable facts. « The manifesto states. The record
   proves. »

   Curation criterion (strict): who controls ACCESS TO INTELLIGENCE — models,
   compute, encryption, workflows. General surveillance news stays out of scope.

   Two strands strike one spine:
     cage  ▢  control advances     (carries no colour · grey, still)
     drum  ●  liberation advances  (carries the light · the page's own beat)

   Laws of this file:
   - every entry carries exactly ONE primary source (src) · optional src2
   - EN-only (technical register, untranslated · like code blocks)
   - no em-dash anywhere (page law, kept) · lines state, never editorialize
   - entries stay chronologically sorted ascending · slugs are forever
     (deep-link anchors: #rec-<id>)
   - a guessed URL is worse than a missing entry: unpinned facts wait on the
     BENCH (bottom) until a real primary source is verified
   - enforced by src/test/manifesto-record.test.ts + scripts/check-links.mjs */

export type Strand = 'cage' | 'drum'

export type RecEntry = {
  /** stable slug · the deep-link anchor is #rec-<id> */
  id: string
  /** ISO date · YYYY or YYYY-MM or YYYY-MM-DD · array sorted ascending */
  date: string
  strand: Strand
  /** short title, mono register */
  title: string
  /** one factual line · states, never editorializes · no em-dash */
  line: string
  /** the ONE primary source */
  src: { label: string; href: string }
  /** optional second source (the reversal, the analysis) */
  src2?: { label: string; href: string }
  /** the manifesto's founding event · exactly one · the hero stamp links here */
  founding?: boolean
  /** the living tail of the record (rendered with the now mark) */
  now?: boolean
}

export const RECORD: RecEntry[] = [
  {
    id: 'the-clipper-chip',
    date: '1993',
    strand: 'cage',
    title: 'The Clipper Chip',
    line: 'The NSA ships a phone chip with a spare key for the state, escrowed for law enforcement under warrant. Abandoned by 1996. The first crypto war.',
    src: { label: 'EPIC · Clipper Chip archive', href: 'https://archive.epic.org/crypto/clipper/' },
  },
  {
    id: 'retain-everything',
    date: '2006-03-15',
    strand: 'cage',
    title: 'Retain everything',
    line: 'The EU orders whole-population metadata retention. The blueprint every scanning law since has traced.',
    src: {
      label: 'Directive 2006/24/EC',
      href: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32006L0024',
    },
  },
  {
    id: 'collect-it-all',
    date: '2013-06-05',
    strand: 'cage',
    title: 'Collect it all',
    line: 'A secret court order for every phone record, then PRISM. Bulk collection stops being a rumor and becomes a document.',
    src: {
      label: 'The Guardian · 5 June 2013',
      href: 'https://www.theguardian.com/world/2013/jun/06/nsa-phone-records-verizon-court-order',
    },
  },
  {
    id: 'a-rampart-holds',
    date: '2014-04-08',
    strand: 'drum',
    title: 'A rampart holds',
    line: 'The EU Court of Justice strikes down blanket data retention as disproportionate. Mass retention is not a default.',
    src: { label: 'CJEU · C-293/12', href: 'https://curia.europa.eu/juris/documents.jsf?num=C-293/12' },
  },
  {
    id: 'the-snoopers-charter',
    date: '2016-11-29',
    strand: 'cage',
    title: 'The Snooper’s Charter',
    line: 'The Investigatory Powers Act puts bulk interception and equipment interference on the statute book.',
    src: {
      label: 'Investigatory Powers Act 2016',
      href: 'https://www.legislation.gov.uk/ukpga/2016/25/contents',
    },
  },
  {
    id: 'australia-vs-mathematics',
    date: '2018-12-06',
    strand: 'cage',
    title: 'Australia vs mathematics',
    line: 'Parliament votes to compel decryption assistance. A law against mathematics; the mathematics does not move.',
    src: {
      label: 'Parliament of Australia · Assistance and Access',
      href: 'https://www.aph.gov.au/Parliamentary_Business/Bills_Legislation/Bills_Search_Results/Result?bId=r6195',
    },
  },
  {
    id: 'chat-control-1',
    date: '2021-07-14',
    strand: 'cage',
    title: 'Chat Control 1.0',
    line: 'Voluntary scanning of private messages enters EU law as a temporary measure. The word temporary turns out to be load-bearing.',
    src: { label: 'Regulation (EU) 2021/1232', href: 'https://eur-lex.europa.eu/eli/reg/2021/1232/oj' },
  },
  {
    id: 'chat-control-2',
    date: '2022-05-11',
    strand: 'cage',
    title: 'Chat Control 2.0',
    line: 'The Commission proposes mandatory scanning of encrypted messages. The impossible, requested in writing.',
    src: {
      label: 'COM/2022/209 · CSAR proposal',
      href: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A52022PC0209',
    },
  },
  {
    id: 'the-spy-clause',
    date: '2023-10-26',
    strand: 'cage',
    title: 'The spy clause',
    line: 'The Online Safety Act keeps a message-scanning power where technically feasible. The key stays in the door.',
    src: { label: 'Online Safety Act 2023', href: 'https://www.legislation.gov.uk/ukpga/2023/50/contents' },
  },
  {
    id: 'papers-please',
    date: '2025-07-25',
    strand: 'cage',
    title: 'Papers, please',
    line: 'Show ID to use the internet: UK age checks go live. VPN signups jump 1,400% within days.',
    src: {
      label: 'Ofcom · age assurance',
      href: 'https://www.ofcom.org.uk/online-safety/protecting-children/age-checks-to-protect-children-online',
    },
  },
  {
    id: 'whatsapp-goes-dark',
    date: '2026-02-12',
    strand: 'cage',
    title: 'WhatsApp goes dark',
    line: 'Throttle, then strangle, then cut: a messenger goes dark for 100 million people for refusing to break encryption.',
    src: {
      label: 'Reuters · February 2026',
      href: 'https://www.reuters.com/technology/russia-blocks-metas-whatsapp-messaging-service-ft-reports-2026-02-12/',
    },
  },
  {
    id: 'parliament-says-no',
    date: '2026-03-26',
    strand: 'drum',
    title: 'Parliament says no',
    line: 'The European Parliament declines to extend voluntary message scanning, 311 votes against. The cage loses one, in public.',
    src: {
      label: 'European Parliament · press room',
      href: 'https://www.europarl.europa.eu/news/en/press-room/20260325IPR39207/child-sexual-abuse-online-voluntary-detection-measures-will-not-be-extended',
    },
  },
  {
    id: 'tapestry-launches',
    date: '2026-04-16',
    strand: 'drum',
    title: 'Tapestry launches',
    line: 'A coalition of 200+ organizations starts co-training a frontier base model: every node keeps its data home and owns its derivative.',
    src: {
      label: 'AI Alliance · launch announcement',
      href: 'https://thealliance.ai/blog/ai-alliance-launches-project-tapestry-to-build-a-collaborative-foundation-for-open-and-sovereign-ai',
    },
  },
  {
    id: 'anti-capture-named',
    date: '2026-05-08',
    strand: 'drum',
    title: 'Anti-capture, named',
    line: 'Thirty leaders from five continents meet in Paris and name the design law: sovereignty enforced by architecture, not policy.',
    src: {
      label: 'AI Alliance · Paris workshop report',
      href: 'https://thealliance.ai/blog/project-tapestry-the-path-to-frontier-sovereign-ai',
    },
  },
  {
    id: 'the-kill-switch',
    date: '2026-06-12',
    strand: 'cage',
    founding: true,
    title: 'The kill switch',
    line: 'On a Friday, by a single letter, the US Commerce Department orders the most capable models on Earth switched off beyond its borders. The manifesto above was written that day.',
    src: {
      label: 'Reuters · 13 June 2026',
      href: 'https://www.reuters.com/technology/us-blocks-foreign-access-anthropics-most-advanced-ai-models-axios-reports-2026-06-13/',
    },
    src2: {
      label: 'CSIS · what comes next',
      href: 'https://www.csis.org/analysis/department-commerce-restricted-access-anthropics-latest-models-what-comes-next',
    },
  },
  {
    id: 'a-billion-person-node',
    date: '2026-06-21',
    strand: 'drum',
    title: 'A billion-person node',
    line: 'In G7 week, India commits: BharatGen anchors the national role in Tapestry and co-leads distributed training.',
    src: {
      label: 'AI Alliance · 21 June 2026',
      href: 'https://thealliance.ai/blog/ai-alliance-advances-project-tapestry-as-g7-puts-ai-sovereignty-at-center-stage',
    },
  },
  {
    id: 'the-tap-reopens',
    date: '2026-07-01',
    strand: 'cage',
    title: 'The tap reopens',
    line: 'Nineteen days later the models return, as suddenly as they went. The tap reopens. The switch stays.',
    src: {
      label: 'DW · restrictions lifted',
      href: 'https://www.dw.com/en/anthropic-claude-fable-mythos-us-lifts-restrictions-on-ai-models/a-77779879',
    },
  },
  {
    id: 'the-majority-flips',
    date: '2026-07-09',
    strand: 'cage',
    now: true,
    title: 'The majority flips',
    line: 'The blocking minority collapses, 314 to 361: message scanning is greenlit to 2028.',
    src: {
      label: 'Patrick Breyer · 9 July 2026',
      href: 'https://www.patrick-breyer.de/en/eu-parliament-greenlights-chat-control-1-0-breyer-our-children-lose-out/',
    },
  },
  {
    id: 'the-answer-in-public',
    date: '2026-07-09',
    strand: 'drum',
    now: true,
    title: 'The answer, in public',
    line: '"The only solution to AI sovereignty is open source foundation models." The reply lands three days after the UN names the concentration of power.',
    src: { label: 'Yann LeCun · 9 July 2026', href: 'https://x.com/ylecun/status/2075111408082039188' },
  },
]

/* ─── THE BENCH · facts waiting on a verified primary source ───────────────────
   These are real events that belong in the record, held out until their primary
   URL is pinned by hand (never guessed). Pin, move up, keep the sort.

   linux-just-a-hobby   1991-08-25 · drum · Torvalds announces Linux ("just a
                        hobby") · pin: comp.os.minix archived post
   the-web-set-free     1993-04-30 · drum · CERN releases the Web into the
                        public domain (the same year as the Clipper Chip) ·
                        pin: CERN document server record
   open-weights-era     2023 · drum · frontier-class weights go public
                        (Llama 2 / Mistral 7B) · pin: one primary announcement
   intellect-1          2024-11 · drum · first 10B model trained across
                        continents over ordinary internet links · pin: Prime
                        Intellect primary report
   the-un-names-it      2026-07-06 · drum · Guterres, in Geneva, at the first
                        UN Global Dialogue on AI Governance: the most advanced
                        systems are concentrated in a handful of companies and
                        countries · pin: Reuters dispatch or UN transcript */
