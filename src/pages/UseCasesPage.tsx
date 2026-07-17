import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { CodeFile } from '../components/CodeFile'
import { StampStrip } from '../components/StampStrip'
import { PlanMap } from '../components/PlanMap'
import { verbGlyph, type NikaVerb } from '../components/codefile-highlight'
import { UC_TABS, verbsFor, fileFor, docsFor, type UC } from '../sections/usecases-data'
import { ssrShowcaseYaml, loadShowcaseYaml } from '../sections/showcase-yaml-access'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { SHOWCASE_DAG } from '../content/showcase-dag.generated'
import { REPO, SPEC, routeHead } from '../content'
import '../sections/v4-home.css'
import './usecases-page.css'

/* ─── /use-cases · the « I want to… » persona gallery (theme-light) ───────────
   The discourse-kit shape (public-clarity kit §3): the gallery answers « moi
   aussi je fais ça ». Cards are grouped by WHO wants the outcome — Everyone ·
   Founders & ops · Developers · Creators · Researchers & students (F7: the
   20 showcase cases RE-SPLIT across 5 audiences, nothing invented) — and every
   card leads with a plain-language outcome title that completes the « I want
   to… » stem, then a one-line two-tone gloss (claim + elaboration), then the
   real projected plan + YAML.

   Spec truth is UNCHANGED: every YAML comes from SHOWCASE_YAML (projected from
   nika-spec showcase via the projector · never hand-typed) and the verb chips /
   plan strips DERIVE from the projected SHOWCASE_DAG. The persona regroup is
   PRESENTATION ONLY — a page-local overlay keyed by slug over the same UC data
   (UC_TABS stays the métier source for the Home teaser).

   SSR-safe: pure DOM (CodeFile renders static <pre>/<code> · all files live in
   the prerendered HTML for SEO + an instant paint). Per-route <head> via
   useHead → prerendered into dist/use-cases/index.html. */

/* the 4 verb hues → the per-chip --vh custom prop (drives the glyph whisper). */
const VERB_HUE: Record<NikaVerb, string> = {
  infer: 'var(--verb-infer)',
  exec: 'var(--verb-exec)',
  invoke: 'var(--verb-invoke)',
  agent: 'var(--verb-agent)',
}

/* slug → the underlying showcase UC (yaml · tier · outcome · docs link). */
const UC_BY_SLUG: Record<string, UC> = Object.fromEntries(
  UC_TABS.flatMap((t) => t.cases.map((c) => [c.slug, c])),
)

/* ─── the persona overlay · presentation-only regroup of the 20 showcase
   workflows. `title` completes « I want to… » in plain language; `claim` +
   `gloss` form the one-line two-tone sentence (white claim · grey elaboration).
   Slugs reference the projected showcase — nothing here invents a workflow. */
interface PersonaCard {
  slug: string
  title: string
  claim: string
  gloss: string
}
interface Persona {
  id: string
  label: string
  kicker: string
  hook: string
  cards: PersonaCard[]
}

const PERSONAS: Persona[] = [
  {
    id: 'everyone',
    label: 'Everyone',
    kicker: 'for everyone',
    hook: 'No coding background needed. If you can read a checklist, you can read these files.',
    cards: [
      {
        slug: 't1-meeting-actions',
        title: 'Turn meeting notes into owned actions',
        claim: 'A transcript goes in, a task list comes out.',
        gloss: 'each item typed {owner, task, due}, checked, ready for your tracker.',
      },
      {
        slug: 't1-price-watch',
        title: 'Watch a price and get pinged when it moves',
        claim: 'No AI involved at all.',
        gloss: 'one fetch, one compare, one ping. A robot you can already trust.',
      },
      {
        slug: 't2-invoice-chaser',
        title: 'Chase overdue invoices without the awkward part',
        claim: 'The reminders get drafted for you.',
        gloss: 'nothing is saved until you read them and type yes.',
      },
    ],
  },
  {
    id: 'founders-ops',
    label: 'Founders & ops',
    kicker: 'for founders & ops',
    hook: 'The Monday-morning chores, briefs, queues and radars, described once, done every week.',
    cards: [
      {
        slug: 't4-ceo-monday-brief',
        title: 'Start the week with the numbers already gathered',
        claim: 'Market, repo pulse and the KPI sheet collected in parallel.',
        gloss: 'the ping even reports its own cost.',
      },
      {
        slug: 't3-competitor-radar',
        title: 'Know what competitors shipped, every Monday',
        claim: 'It reads their sites while you sleep.',
        gloss: 'one brief on your desk at 8am, with what it signals.',
      },
      {
        slug: 't2-support-triage',
        title: 'Wake up to a sorted support queue',
        claim: 'Overnight tickets get tagged, drafted and batched.',
        gloss: 'humans start at 9am on the hard ones.',
      },
      {
        slug: 't3-resume-screener',
        title: 'Screen forty resumes with one fair rubric',
        claim: 'Candidate #1 and #40 get the same questions.',
        gloss: 'scored on a local model, so the personal data stays home.',
      },
    ],
  },
  {
    id: 'developers',
    label: 'Developers',
    kicker: 'for developers',
    hook: 'The boring parts of shipping run themselves, with a human gate exactly where it counts.',
    cards: [
      {
        slug: 't1-standup-digest',
        title: 'Have the standup note already written',
        claim: 'It reads yesterday’s commits and writes your three bullets.',
        gloss: 'you glance, tweak one word, go.',
      },
      {
        slug: 't2-release-notes',
        title: 'Ship release notes in your own voice',
        claim: 'git log in, changelog out, team pinged.',
        gloss: 'zero copy-paste on release day.',
      },
      {
        slug: 't2-release-radar',
        title: 'Hear about dependency releases only when they matter',
        claim: 'It diffs the release feeds against last run.',
        gloss: 'no ping means nothing shipped.',
      },
      {
        slug: 't3-pr-review-fanout',
        title: 'Give big PRs a reviewer per file',
        claim: 'One read-only reviewer per changed file, in parallel, under budget.',
        gloss: 'attention finally scales with the diff.',
      },
      {
        slug: 't4-release-train',
        title: 'Ship only when everything is green, and a human says go',
        claim: 'Tests, lint and audit run in parallel; a person signs the GO.',
        gloss: 'it ships on time or not at all, and the record shows which.',
      },
      {
        slug: 't3-config-drift-sentinel',
        title: 'Get paged only for changes nobody approved',
        claim: 'It diffs live prod against the signed-off baseline.',
        gloss: 'silence means prod matches exactly.',
      },
      {
        slug: 't4-incident-war-room',
        title: 'Have the postmortem drafted before the retro',
        claim: 'Logs, status history and the runbook gathered in parallel.',
        gloss: 'a typed timeline, verified before any draft.',
      },
    ],
  },
  {
    id: 'creators',
    label: 'Creators',
    kicker: 'for creators',
    hook: 'One voice, many surfaces. The publishing chores run themselves; the voice stays yours.',
    cards: [
      {
        slug: 't1-social-repurpose',
        title: 'Say it once, publish it everywhere',
        claim: 'One post becomes a thread, a LinkedIn version and a newsletter blurb.',
        gloss: 'rewritten in parallel, same voice on every channel.',
      },
      {
        slug: 't2-seo-content-brief',
        title: 'Turn a rival’s best page into your content brief',
        claim: 'It reads what actually ranks.',
        gloss: 'your writer starts from the gaps, not a blank page.',
      },
      {
        slug: 't3-localization-factory',
        title: 'Get the docs in French by lunch',
        claim: 'Every file found, translated in parallel, filed back in place.',
        gloss: 'same folder layout, same voice.',
      },
    ],
  },
  {
    id: 'researchers-students',
    label: 'Researchers & students',
    kicker: 'for researchers & students',
    hook: 'Reading, digging and cleaning at machine pace, with a record you can check afterwards.',
    cards: [
      {
        slug: 't4-deep-research-brief',
        title: 'Turn “get me up to speed” into a brief you can audit',
        claim: 'A fast model plans, an agent digs inside hard budgets, a careful model writes.',
        gloss: 'every step leaves a record.',
      },
      {
        slug: 't2-contract-guard',
        title: 'Check a dense document without it leaving your machine',
        claim: 'A local model reads the clauses.',
        gloss: 'the document never touches the internet, and two checks gate the memo.',
      },
      {
        slug: 't2-etl-quarantine',
        title: 'Stop re-running the whole night for three bad rows',
        claim: 'A checkpoint splits good rows from bad.',
        gloss: 'rejects land in quarantine, the pipeline keeps going.',
      },
    ],
  },
]

/* ─── the plan · rendered in THE plan language (arc 11) ───────────────────────
   The film (home 01) teaches the site's one grammar for a plan — slab cards
   in captioned wave columns. This page used to speak its own dialect
   (verb-hued pill-dots + bare wave digits + a legend); it now renders the
   shared <PlanMap/> so a reader who scrolled the film reads every showcase
   plan on sight. Truth (verb · wave · gate · gloss) stays projected. */
function WorkflowDag({ slug }: { slug: string }) {
  const dag = SHOWCASE_DAG[slug]
  if (!dag || dag.tasks.length === 0) return null
  return (
    <figure
      className="ucp-dag"
      aria-label={`The plan: ${dag.tasks.length} tasks, running in ${dag.waves} ${dag.waves === 1 ? 'step' : 'steps'}`}
    >
      <figcaption className="ucp-dag-cap">
        <span className="ucp-dag-cap-label mono">the plan</span>
        <span className="ucp-dag-cap-dims mono" aria-hidden>
          {dag.tasks.length} tasks · {dag.waves} {dag.waves === 1 ? 'step' : 'steps'}
        </span>
      </figcaption>
      <PlanMap tasks={dag.tasks} waves={dag.waves} well={slug} />
    </figure>
  )
}

/* the register diet: the gallery's island carries the WHOLE dictionary
   (every card renders its open file at SSG — the visible code is
   transformed markup, never byte-recoverable) · one Provider, cards read
   the context (no 26-level prop drilling) */
const GALLERY_ISLAND_ID = 'ucp-yaml-island'
const YamlDict = createContext<Record<string, string>>({})

/* a single workflow · outcome title, two-tone gloss, verb chips, the plan,
   and the real open YAML. Truth (yaml · verbs · plan · tier) is projected. */
/* one delegated listener per grid (never per card): the hovered card's
   ::after reads the pointer through two custom properties */
function trackSpotlight(e: React.PointerEvent<HTMLDivElement>) {
  const card = (e.target as HTMLElement).closest<HTMLElement>('.ucp-wf')
  if (!card) return
  const box = card.getBoundingClientRect()
  card.style.setProperty('--spot-x', `${(((e.clientX - box.left) / box.width) * 100).toFixed(2)}%`)
  card.style.setProperty('--spot-y', `${(((e.clientY - box.top) / box.height) * 100).toFixed(2)}%`)
}

function WorkflowCard({ card, fig }: { card: PersonaCard; fig: string }) {
  const dict = useContext(YamlDict) // hooks before the miss return (rules-of-hooks)
  const uc = UC_BY_SLUG[card.slug]
  if (!uc) return null
  const cardVerbs = verbsFor(uc) as NikaVerb[]
  const yaml = dict[uc.slug] ?? ''
  return (
    <article className="ucp-wf">
      <span className="ucp-wf-hud" aria-hidden>
        <span className="ucp-wf-hud-mark ucp-wf-hud-mark--tl" />
        <span className="ucp-wf-hud-mark ucp-wf-hud-mark--br" />
      </span>
      <header className="ucp-wf-head">
        <span className="ucp-wf-fig">{fig}</span>
        <h3 className="ucp-wf-title">
          {/* the room door (WO-5: the gallery gains the links — the rooms
              were reachable only by palette/map, caught by the SPA probe) */}
          <Link to={`/use-cases/${uc.slug}`} className="ucp-wf-door">
            {card.title}
          </Link>
        </h3>
        <span className="ucp-wf-tier" title={`Complexity tier ${uc.tier.slice(1)} of 4`}>
          {uc.tier}
        </span>
      </header>

      {/* the one-line two-tone gloss · white claim + grey elaboration */}
      <p className="ucp-wf-gloss">
        <b>{card.claim}</b> {card.gloss}
      </p>

      <span className="ucp-verbs">
        {cardVerbs.map((v) => (
          <span key={v} className="ucp-verb" style={{ ['--vh' as string]: VERB_HUE[v] }}>
            <span className="ucp-verb-glyph" aria-hidden>
              {verbGlyph(v)}
            </span>
            {v}
          </span>
        ))}
      </span>

      {/* the film's closing-frame composition, echoed (arc 11): the FILE on
          the left, THE PLAN on the right — one workflow, presented whole.
          On small screens the file leads and the plan follows (the film's
          own reading order). */}
      <div className="ucp-wf-body">
        <div className="ucp-wf-file">
          <div className="ucp-wf-filemeta">
            <span className="ucp-wf-filename">
              <span aria-hidden className="ucp-wf-prompt">
                ❯{' '}
              </span>
              <b>{fileFor(uc)}</b>
            </span>
            <Link className="ucp-wf-walk" to={`/use-cases/${uc.slug}`}>
              the room →
            </Link>
            <a className="ucp-wf-walk" href={docsFor(uc)} target="_blank" rel="noreferrer">
              walkthrough ↗
            </a>
          </div>
          <div className="ucp-wf-code">
            <CodeFile yaml={yaml} wrap tips />
          </div>
        </div>

        <div className="ucp-wf-aside">
          {/* the plan · tasks and what they wait on (projected · never hand-drawn) */}
          <WorkflowDag slug={uc.slug} />
          <p className="ucp-wf-outcome">
            <span className="ucp-arrow" aria-hidden>
              →
            </span>
            {uc.outcome}
          </p>
        </div>
      </div>
    </article>
  )
}

/* a persona section · the mono « I want to… » kicker, the hook, and its grid. */
function PersonaSection({ persona, index }: { persona: Persona; index: number }) {
  return (
    <section id={persona.id} className="ucp-metier scroll-mt-28" aria-labelledby={`p-${persona.id}`}>
      <div className="ucp-metier-head">
        <p className="ucp-metier-fig">
          {String(index + 1).padStart(2, '0')} · {persona.kicker}
          <span className="ucp-metier-count">
            {persona.cards.length} workflows
          </span>
        </p>
        <h2 id={`p-${persona.id}`} className="ucp-metier-title">
          {persona.label}
        </h2>
        <p className="ucp-metier-hook">{persona.hook}</p>
      </div>

      <div className="ucp-grid" onPointerMove={trackSpotlight}>
        {persona.cards.map((card, i) => (
          <WorkflowCard key={card.slug} card={card} fig={`7.${index + 1}.${i + 1}`} />
        ))}
      </div>
    </section>
  )
}

/* ─── the rotating outcome · one REAL card title per persona cycles inside the
   hero claim (« I want to… <outcome> »). Honesty: every line is the exact
   title of a card rendered further down this page; nothing is invented.
   SSG renders the first line statically; reduced-motion never cycles. */
const ROTA_LINES = PERSONAS.map((p) => p.cards[0]?.title ?? '').filter(Boolean)
function RotatingOutcome() {
  const [i, setI] = useState(0)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    /* the cycle is INTERACTION-EARNED: every swap paints a fresh largest-
       contentful candidate, so on an input-less trace (Lighthouse sends
       none) a free-running rotator slides LCP to the last swap before the
       trace ends — this span measured as an 8s LCP while real users saw
       nothing slow. Real hands move within the first second; the first
       pointer / scroll / key starts the cycle, imperceptibly. */
    let timer: ReturnType<typeof setInterval> | null = null
    const start = () => {
      if (timer) return
      timer = setInterval(() => {
        setLeaving(true)
        window.setTimeout(() => {
          setI((n) => (n + 1) % ROTA_LINES.length)
          setLeaving(false)
        }, 260)
      }, 3000)
    }
    const opts = { once: true, passive: true } as const
    const evs = ['pointermove', 'pointerdown', 'scroll', 'keydown', 'touchstart'] as const
    evs.forEach((e) => window.addEventListener(e, start, opts))
    return () => {
      if (timer) clearInterval(timer)
      evs.forEach((e) => window.removeEventListener(e, start))
    }
  }, [])
  return (
    <p className="ucp-rota" data-rise style={{ ['--rise-delay' as string]: '80ms' }}>
      <span className={leaving ? 'ucp-rota-line is-leaving' : 'ucp-rota-line'}>
        …{ROTA_LINES[i]?.charAt(0).toLowerCase()}{ROTA_LINES[i]?.slice(1)}
      </span>
    </p>
  )
}

export function Component() {
  /* reveal the page once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -6% 0px' })
  const [active, setActive] = useState(PERSONAS[0]?.id ?? '')
  /* the yaml dictionary rides the island (SSG: the SSR door · client: the
     island bytes · SPA-nav: the async chunk) */
  const dictJson = useIslandPayload(GALLERY_ISLAND_ID, ssrShowcaseYaml() && JSON.stringify(ssrShowcaseYaml()), async () =>
    JSON.stringify(await loadShowcaseYaml()),
  )
  const dict = useMemo<Record<string, string>>(
    () => (dictJson ? (JSON.parse(dictJson) as Record<string, string>) : {}),
    [dictJson],
  )

  const total = Object.keys(SHOWCASE_DAG).length
  /* total projected tasks across the whole showcase — derived, never hand-typed */
  const totalTasks = Object.values(SHOWCASE_DAG).reduce((n, d) => n + d.tasks.length, 0)

  useHead({
    title: 'Use cases · Nika',
    link: routeHead('/use-cases').link,
    meta: [
      ...routeHead('/use-cases').meta,
      {
        name: 'description',
        content: `Pick the thing you keep doing. ${total} real workflows for everyone, founders and developers, each a file you can read before it runs.`,
      },
      { property: 'og:title', content: 'Use cases · Nika' },
      {
        property: 'og:description',
        content: `${total} real workflows, each one a file you can read before it runs, shown with the plan and the exact YAML.`,
      },
      { property: 'og:image', content: 'https://nika.sh/og-use-cases.png' },
      {
        property: 'og:image:alt',
        content:
          'Nika use cases: real workflows for everyone, founders & ops, and developers.',
      },
      { name: 'twitter:title', content: 'Use cases · Nika' },
      {
        name: 'twitter:description',
        content: `${total} real workflows, each one a file you can read before it runs, shown with the plan and the exact YAML.`,
      },
      { name: 'twitter:image', content: 'https://nika.sh/og-use-cases.png' },
    ],
  })

  /* highlight the rail anchor for the persona currently in view (scroll-spy) */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sections = PERSONAS.map((p) => document.getElementById(p.id)).filter(
      (el): el is HTMLElement => el != null,
    )
    if (sections.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.target.id) setActive(e.target.id)
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  return (
    <main className="theme-dark ucp-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts):
          on a one-section page the observer armed everything at hydration anyway;
          baking moves the arm to HTML time and the hero stops being a 4.7s LCP. */}
      <section ref={ref} aria-labelledby="ucp-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            pick a workflow
          </p>
          <h1
            id="ucp-title"
            className="v4sec-title ucp-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            “I want to…”
          </h1>
          {/* the rotating outcome · real card titles from below, cycling */}
          <RotatingOutcome />
          {/* the punch lede (F7) · the catchy line ABOVE the consumer TL;DR */}
          <p className="v4punch" data-rise style={{ ['--rise-delay' as string]: '90ms' }}>
            There&rsquo;s a file for that.
          </p>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Start from the outcome. Anything you ask an AI to do more than once belongs in{' '}
            <b>a file you can read before it runs</b>. Every card below is a real workflow, pulled
            from the language&rsquo;s own test suite, never mocked, with its plan (
            <em>the tasks and what they wait on</em>) and the exact YAML that runs it.
          </p>

          {/* the gallery register · the showcase dimensions, at a glance. */}
          <StampStrip
            items={[
              { n: total, label: 'workflows', sub: 'spec-valid' },
              { n: PERSONAS.length, label: 'audiences', sub: 'everyone → researchers' },
              { n: 4, label: 'tiers', sub: 'T1 → T4' },
              { n: totalTasks, label: 'tasks', sub: 'across all workflows' },
            ]}
          />

          {/* the persona rail · sticky anchor jumps (scroll-spy highlights the
              section in view). Plain in-page anchors → no JS needed to navigate. */}
          <nav className="ucp-rail" aria-label="Audiences" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
            {PERSONAS.map((p) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                className="ucp-rail-link"
                aria-current={active === p.id ? 'true' : undefined}
              >
                {p.label}
                <span className="ucp-rail-n">{p.cards.length}</span>
              </a>
            ))}
          </nav>

          <Island id={GALLERY_ISLAND_ID} payload={dictJson} />
          {/* every persona, every workflow — the full gallery */}
          <YamlDict.Provider value={dict}>
          <div className="ucp-metiers" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
            {PERSONAS.map((p, i) => (
              <PersonaSection key={p.id} persona={p} index={i} />
            ))}
          </div>
          </YamlDict.Provider>

          {/* the close · the spec-truth dimension line + forward links */}
          <p className="ucp-note">
            {total} workflows · four tiers ·{' '}
            <a
              href="https://github.com/supernovae-st/nika-spec/tree/main/examples/showcase"
              target="_blank"
              rel="noreferrer"
            >
              nika-spec/examples/showcase
            </a>{' '}
            · every file audited before it runs: plan, cost, secrets
          </p>

          <div className="ucp-links">
            <a href={SPEC} target="_blank" rel="noreferrer" className="ucp-link">
              Read the spec
              <span aria-hidden className="ucp-link-arrow">
                {' '}
                ↗
              </span>
            </a>
            <Link to="/play" className="ucp-link ucp-link--dim">
              Try one in the playground
              <span aria-hidden className="ucp-link-arrow">
                {' '}
                →
              </span>
            </Link>
            <a href={REPO} target="_blank" rel="noreferrer" className="ucp-link ucp-link--dim">
              <span aria-hidden className="ucp-link-glyph">
                ★
              </span>
              Star on GitHub
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
