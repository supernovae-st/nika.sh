import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead, REPO } from '../content'
import { CodeFile } from '../components/CodeFile'
import '../sections/v4-home.css'
import '../shell/shell.css'
import './page-chrome.css'
import './convert-page.css'

/* ─── /convert · the conversion funnel, as a full page ─────────────────────────
   The « send us a workflow » offer used to dump visitors straight into
   GitHub's issue chooser (account wall, register break mid-funnel). This page
   states the offer in the site's own register FIRST, then routes out. The
   offer is real: community-described tasks become runnable, credited
   .nika.yaml examples in the gallery.

   HONESTY: no form — there is no backend, and we don't pretend there is. The
   funnel is public, on the repo (an issue, or a discussion). No fabricated
   testimonials, no invented counts.

   SSR-safe: pure DOM; the reveal is the shared motion-safe data-rise. */

/* the proof pair · a real conversion, shown not told. The yaml is engine-true:
   `nika check` verdict ✔ clean (argv-form exec · bounded max_tokens · complete
   permits) — re-run the check if you ever edit it. Local model first, per the
   presentation-order rule. */
const PROOF_ASK =
  'Every Friday I paste the week’s merged PRs into a chat and ask for a changelog draft. It can read git log; it may only write CHANGELOG.draft.md.'

const PROOF_YAML = `# from @your-handle's friday ritual · converted + checked
nika: v1
workflow: friday-changelog
description: "the week's merged PRs become a changelog draft"

model: ollama/llama3.2

permits:
  exec: ["git"]
  tools: ["nika:write"]
  fs: { write: ["./CHANGELOG.draft.md"] }

tasks:
  - id: collect
    exec:
      command: ["git", "log", "--merges", "--since=7 days ago", "--oneline"]

  - id: draft
    depends_on: [collect]
    infer:
      max_tokens: 900
      prompt: |
        Group these merges by area and write a changelog draft.
        \${{ tasks.collect.output }}

  - id: save
    depends_on: [draft]
    invoke:
      tool: "nika:write"
      args: { path: "./CHANGELOG.draft.md", content: "\${{ tasks.draft.output }}" }
`

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: '01 · you describe',
    title: 'Tell us the task',
    body: 'One AI task you repeat, in ChatGPT, Claude, Cursor, Codex, or scripts. Plain words are enough: what goes in, what should come out, what it may touch.',
  },
  {
    n: '02 · we craft',
    title: 'We convert and check it clean',
    body: 'We write it as a runnable .nika.yaml: schema-true, audited before it runs (plan, cost, secrets), tested against the real engine.',
  },
  {
    n: '03 · it ships',
    title: 'It lands in the gallery, credited to you',
    body: 'The best conversions ship as public examples, your name on the file. Your ritual becomes something anyone can run.',
  },
]

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })

  useHead({
    title: 'Send us a workflow · Nika',
    link: routeHead('/convert').link,
    meta: [
      ...routeHead('/convert').meta,
      {
        name: 'description',
        content:
          'Describe one AI task you repeat, in ChatGPT, Claude, Cursor, Codex, or scripts. We convert the best ones into runnable .nika.yaml examples, credited to you.',
      },
      { property: 'og:title', content: 'Send us a workflow · Nika' },
      {
        property: 'og:description',
        content:
          'Your repeated AI task, converted into a runnable, credited .nika.yaml example.',
      },
      { property: 'og:image', content: 'https://nika.sh/og-convert.png' },
      {
        property: 'og:image:alt',
        content: 'Send Nika a workflow · your repeated AI task becomes a runnable file you own, credited to you.',
      },
      { name: 'twitter:title', content: 'Send us a workflow · Nika' },
      {
        name: 'twitter:description',
        content:
          'Your repeated AI task, converted into a runnable, credited .nika.yaml example.',
      },
      { name: 'twitter:image', content: 'https://nika.sh/og-convert.png' },
    ],
  })

  return (
    <main className="theme-dark v4page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts):
          on a one-section page the observer armed everything at hydration anyway;
          baking moves the arm to HTML time and the hero stops being a 4.7s LCP. */}
      <section ref={ref} aria-labelledby="cv-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          {/* the masthead */}
          <p className="v4sec-fig" data-rise>
            send a workflow · the offer
          </p>
          <h1
            id="cv-title"
            className="v4sec-title cv-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            Send us a workflow.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Describe <b>one AI task you repeat</b>, in ChatGPT, Claude, Cursor, Codex, or
            scripts. We convert the best ones into runnable{' '}
            <code className="mono">.nika.yaml</code> examples, <b>credited to you</b>.
          </p>

          {/* the proof pair · a real conversion, shown not told (the site's one
              law: every page proves with THE FILE). Left, the ask in the
              sender's plain words; right, the file that ships back — engine-
              checked, credit comment on line one. */}
          <div className="cv-proof" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
            <div className="cv-proof-ask">
              <p className="cv-proof-label">what you send</p>
              <blockquote className="cv-proof-quote">{PROOF_ASK}</blockquote>
              <p className="cv-proof-hint">plain words are enough</p>
            </div>
            <span className="cv-proof-tie" aria-hidden>
              →
            </span>
            <div className="cv-proof-file">
              <p className="cv-proof-label">what ships back</p>
              <CodeFile yaml={PROOF_YAML} filename="friday-changelog.nika.yaml" wrap tips />
              <p className="cv-proof-verdict">
                <span className="cv-proof-check" aria-hidden>
                  ✔
                </span>{' '}
                clean — the engine&rsquo;s checker, before a single token is spent
              </p>
            </div>
          </div>

          {/* what happens next · the three-step register */}
          <ol className="cv-steps" data-rise style={{ ['--rise-delay' as string]: '240ms' }}>
            {STEPS.map((s) => (
              <li className="cv-step" key={s.n}>
                <p className="cv-step-n">{s.n}</p>
                <h2 className="cv-step-title">{s.title}</h2>
                <p className="cv-step-body">{s.body}</p>
              </li>
            ))}
          </ol>

          {/* the routing out · primary → the issue chooser · secondary → discussions */}
          <div className="cv-ctas" data-rise style={{ ['--rise-delay' as string]: '300ms' }}>
            <a
              href={`${REPO}/issues/new/choose`}
              target="_blank"
              rel="noreferrer"
              className="cv-cta"
            >
              Send a workflow
              <span aria-hidden className="cv-cta-arrow">
                →
              </span>
            </a>
            <a
              href={`${REPO}/discussions`}
              target="_blank"
              rel="noreferrer"
              className="cv-cta cv-cta--dim"
            >
              Or start a discussion
              <span aria-hidden className="cv-cta-arrow">
                →
              </span>
            </a>
          </div>

          {/* the honesty plate · why there is no form here */}
          <p className="cv-note" data-rise style={{ ['--rise-delay' as string]: '360ms' }}>
            no form here · the funnel is public, on the repo · a GitHub account is the only
            thing we ask for
          </p>
        </div>
      </section>
    </main>
  )
}
