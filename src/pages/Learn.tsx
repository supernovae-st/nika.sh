import { useEffect } from 'react'
import { REPO, SPEC, DOCS } from '../content'

/* ─── /learn · one file, line by line ───────────────────────────────────────
   Hash-routed (#/learn) · the 5-minute annotated walkthrough. Every YAML
   fragment is spec-correct (nika-spec 01-envelope · 03-dag · 05-errors).
   Each step: the code on one side, the plain-words story on the other. */

interface Step {
  n: string
  title: string
  plain: string
  yaml: string
  note?: string
}

const STEPS: Step[] = [
  {
    n: '01',
    title: 'Two lines make it real',
    plain:
      'Every workflow starts by naming the language and itself. That header is the whole ceremony: no project setup, no boilerplate, no config files.',
    yaml: `nika: v1
workflow: weekly-radar`,
    note: 'nika: v1 pins the language contract. Additions are additive; the value never churns.',
  },
  {
    n: '02',
    title: 'Declare what can change',
    plain:
      'Inputs live in vars. A bare value is a default you can override from the command line; a typed var documents itself and gets validated before anything runs.',
    yaml: `vars:
  output_dir: "./radar"
  topic:
    type: string
    required: true
    description: "Subject to research"`,
    note: 'Use it anywhere as ${{ vars.topic }}. Change the input, not the file.',
  },
  {
    n: '03',
    title: 'Pick a brain. Any brain.',
    plain:
      'One line chooses the default model. Cloud or local, same file. Swap Anthropic for a model running on your own machine and nothing else changes.',
    yaml: `# cloud
model: anthropic/claude-sonnet-4-6

# or fully local · no cloud needed
model: ollama/llama3.1`,
  },
  {
    n: '04',
    title: 'A task is a verb',
    plain:
      'Each task does exactly one thing, with one of the four verbs. This one thinks: it sends a prompt to the model and keeps the answer as its output.',
    yaml: `tasks:
  - id: digest
    infer:
      prompt: "Summarize in 5 bullets: \${{ tasks.fetch_news.output }}"`,
    note: 'infer thinks · exec runs a command · invoke uses a tool · agent works on its own.',
  },
  {
    n: '05',
    title: 'Order is one word. The graph is free.',
    plain:
      'depends_on is all you write. Tasks with no dependency between them run in parallel automatically. You never schedule anything; the graph falls out of the file.',
    yaml: `- id: fetch_news
  invoke:
    tool: "nika:fetch"

- id: repo_log
  exec:
    command: "git log --since='1 week'"

- id: digest
  depends_on: [fetch_news, repo_log]   # waits for BOTH
  infer:
    prompt: "Cross-reference news with our work…"`,
    note: 'fetch_news and repo_log run at the same time. digest waits for both.',
  },
  {
    n: '06',
    title: 'Branch like an adult',
    plain:
      'when: makes a task conditional: a boolean expression over what already happened. No if-else pyramids; the branch is part of the graph.',
    yaml: `- id: alert
  depends_on: [check]
  when: \${{ tasks.check.status == 'success' }}
  invoke:
    tool: "nika:notify"`,
  },
  {
    n: '07',
    title: 'When things fail, you get data',
    plain:
      'Errors are typed structures: a stable code, a category, and whether retrying could help. Tasks declare their own retry policy and a fallback. No stack-trace archaeology.',
    yaml: `- id: research
  retry:
    max_attempts: 3
    backoff_ms: 1000
  on_error:
    recover: \${{ tasks.cache.output }}
  infer:
    prompt: "…"`,
    note: 'A failed call retries with backoff; if it still fails, the cached result steps in.',
  },
  {
    n: '08',
    title: 'Name what comes out',
    plain:
      'output: binds pieces of a task result to names; the workflow declares what it returns. Downstream tasks (and you) read clean names, not raw API responses.',
    yaml: `- id: digest
  infer:
    prompt: "…"
  output:
    result: ".choices[0].message.content"

outputs:
  brief: \${{ tasks.digest.output.result }}`,
  },
]

const ERROR_JSON = `{
  "code": "NIKA-INFER-001",
  "category": "provider_error",
  "message": "Anthropic API returned 503",
  "transient": true,
  "details": {
    "provider": "anthropic",
    "status_code": 503,
    "retry_after_secs": 30
  },
  "task_id": "research",
  "attempt": 2
}`

export default function Learn() {
  /* gentle rise-in as steps cross the fold */
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.lrn')
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) e.target.classList.add('in')
      },
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <main className="relative z-20 mx-auto max-w-5xl px-6 pt-32 pb-24">
      {/* mini nav */}
      <nav className="glass fixed top-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-1.5 text-[13px]">
        <a href="#" className="flex items-center gap-2 px-3 py-1.5 font-semibold tracking-tight">
          <img src="/nika.svg" alt="" width={17} height={17} />
          nika
        </a>
        <span className="mx-1 h-4 w-px" style={{ background: 'var(--hair)' }} />
        <span className="px-3 py-1.5 text-[var(--fg)]">Learn</span>
        <a
          href="#"
          className="rounded-full px-3 py-1.5 whitespace-nowrap text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
        >
          ← Back to site
        </a>
      </nav>

      <p className="mono mb-4 text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
        Learn · 5 minutes
      </p>
      <h1
        className="mb-4 font-semibold tracking-tight"
        style={{ fontSize: 'clamp(2.3rem, 1rem + 4vw, 4rem)', lineHeight: 1.03 }}
      >
        One file, line by line.
      </h1>
      <p className="mb-16 max-w-[40rem] text-[17.5px] leading-relaxed text-[var(--fg-mute)]">
        Eight small ideas and you can read and write any Nika workflow. Every fragment below
        is real, spec-correct YAML.
      </p>

      {/* the walkthrough */}
      <ol className="space-y-14">
        {STEPS.map((s) => (
          <li key={s.n} className="lrn grid items-start gap-6 md:grid-cols-[1fr_1.1fr]">
            <div className="pt-1">
              <p className="mono mb-2 text-[12px] tracking-[0.3em] text-[var(--fg-ghost)]">
                {s.n}
              </p>
              <h2 className="mb-3 text-[22px] leading-snug font-semibold tracking-tight">
                {s.title}
              </h2>
              <p className="text-[15.5px] leading-relaxed text-[var(--fg-mute)]">{s.plain}</p>
              {s.note && (
                <p className="mono mt-4 rounded-lg border border-[var(--hair)] bg-[rgba(127,233,255,0.04)] px-3.5 py-2.5 text-[12px] leading-relaxed text-[var(--cyan)]">
                  {s.note}
                </p>
              )}
            </div>
            <div className="code-well px-5 py-4">
              <pre className="code text-[13px] leading-[1.7]">{s.yaml}</pre>
            </div>
          </li>
        ))}
      </ol>

      {/* errors are data — the differentiator */}
      <section className="lrn mt-24">
        <p className="mono mb-3 text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
          § When it breaks
        </p>
        <h2
          className="mb-3 font-semibold tracking-tight"
          style={{ fontSize: 'clamp(1.6rem, 0.9rem + 2.2vw, 2.5rem)', lineHeight: 1.05 }}
        >
          Errors are data, not noise.
        </h2>
        <p className="mb-8 max-w-[40rem] text-[15.5px] leading-relaxed text-[var(--fg-mute)]">
          Every failure is a typed structure with a stable code, a category, and a{' '}
          <code className="mono text-[13px] text-[var(--cyan)]">transient</code> flag that says
          whether retrying could help. Your workflow can read errors the same way it reads any
          other value, and recover.
        </p>
        <div className="grid items-start gap-6 md:grid-cols-2">
          <div className="code-well px-5 py-4">
            <pre className="code text-[12.5px] leading-[1.65]">{ERROR_JSON}</pre>
          </div>
          <ul className="space-y-3 pt-1 text-[14.5px] leading-relaxed text-[var(--fg-mute)]">
            <li className="flex items-baseline gap-3">
              <span className="mono shrink-0 text-[12px] text-[var(--cyan)]">code</span>
              <span>
                a stable, greppable identifier. The same failure always has the same name.
              </span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="mono shrink-0 text-[12px] text-[var(--cyan)]">transient</span>
              <span>
                true means retry might work. The engine retries with backoff before giving up.
              </span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="mono shrink-0 text-[12px] text-[var(--cyan)]">details</span>
              <span>
                structured fields, not prose. Your{' '}
                <code className="mono text-[12px]">on_error:</code> can act on them.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="lrn mt-24 text-center">
        <h2 className="mb-6 text-[26px] font-semibold tracking-tight">
          That&apos;s the whole language.
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="#install"
            className="skeuo-brand rounded-full px-6 py-3 text-[15px] font-semibold"
          >
            Install Nika
          </a>
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer"
            className="skeuo flex items-center gap-2.5 rounded-full px-5 py-3 text-[14.5px] font-medium"
          >
            <span className="star-spark" aria-hidden>
              ★
            </span>
            Star on GitHub
          </a>
          <a
            href={SPEC} target="_blank" rel="noreferrer"
            className="text-[15px] text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
          >
            Read the full spec ↗
          </a>
          <a
            href={DOCS} target="_blank" rel="noreferrer"
            className="text-[15px] text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
          >
            Full docs ↗
          </a>
        </div>
      </section>

      <footer className="mt-24 border-t pt-8 text-center" style={{ borderColor: 'var(--hair)' }}>
        <p className="mono text-[11px] tracking-[0.2em] text-[var(--fg-ghost)] uppercase">
          Nika · by Supernovae · AGPL forever
        </p>
      </footer>
    </main>
  )
}
