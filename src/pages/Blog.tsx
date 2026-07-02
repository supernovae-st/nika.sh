import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { REPO, SPEC, routeHead } from '../content'
import { CANON } from '../canon.generated'
import { CodeFile } from '../components/CodeFile'
import '../sections/v4-home.css'
import './page-chrome.css'
import './blog-page.css'

/* ─── /blog · the journal (theme-dark · blueprint register) ──────────────────
   Long-form pedagogy on Intent as Code, brought up to the home + /spec register:
   the near-black blueprint plate, a FIG-numbered masthead, hairline-ruled
   articles (each a register entry), the premium CodeFile for any worked YAML, a
   HUD registration frame on the reading column, and a hairline grid of upcoming
   teasers. Same content as before — the divergent v3 cosmic chrome (.skeuo /
   .glass / cyan) is retired so the journal reads as the same product as the rest
   of the site.

   SSR-safe: pure DOM (the whole journal lives in the prerendered HTML for SEO +
   an instant paint); the reveal is one IntersectionObserver on mount, content
   fully visible by default (no-JS / reduced-motion). Per-route <head> via
   useHead → prerendered into dist/blog/index.html. */

/* the upcoming teasers · dated stubs of coming articles (unchanged content). */
const SOON: { slug: string; tag: string; date: string; title: string; teaser: string }[] = [
  {
    slug: 'dag-for-free',
    tag: 'Engine',
    date: 'soon',
    title: 'The plan you get for free',
    teaser: 'depends_on is all you write. Parallelism, ordering and retries fall out of the graph.',
  },
  {
    slug: 'own-your-stack',
    tag: 'Sovereignty',
    date: 'soon',
    title: 'No cloud needed',
    teaser: 'One Rust binary, your models, your files. What local-first actually buys you.',
  },
]

/* the worked fragment for the "four verbs" article · a tiny readable DAG that
   exercises three verbs (spec-correct shapes, never hand-waved). */
export const FOUR_VERBS_YAML = `nika: v1
workflow: morning-brief

tasks:
  - id: fetch_news
    invoke:
      tool: "nika:fetch"          # a tool, not a verb

  - id: build
    exec:
      command: "cargo build --release"

  - id: digest
    depends_on: [fetch_news, build]
    infer:
      prompt: "Summarize what changed"
`

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })

  useHead({
    title: 'Blog — Nika',
    link: routeHead('/blog').link,
    meta: [
      ...routeHead('/blog').meta,
      {
        name: 'description',
        content:
          'Notes from the source — why useful AI work belongs in a file you can run, review and keep. Long reads on Intent as Code and the four verbs.',
      },
      { property: 'og:title', content: 'Blog — Nika' },
      {
        property: 'og:description',
        content: 'Why useful AI work belongs in a file you can run, review and keep.',
      },
      { name: 'twitter:title', content: 'Blog — Nika' },
      {
        name: 'twitter:description',
        content: 'Why useful AI work belongs in a file you can run, review and keep.',
      },
    ],
  })

  return (
    <main className="theme-dark v4page">
      <section ref={ref} aria-labelledby="blog-title" className="v4sec">
        {/* the HUD registration frame on the reading column (decorative) */}
        <div className="v4hud" aria-hidden>
          <span className="v4hud-mark v4hud-mark--tl" />
          <span className="v4hud-mark v4hud-mark--tr" />
          <span className="v4hud-mark v4hud-mark--bl" />
          <span className="v4hud-mark v4hud-mark--br" />
          <span className="v4hud-tick v4hud-tick--l" />
          <span className="v4hud-tick v4hud-tick--r" />
        </div>

        <div className="v4sec-wrap">
          {/* the masthead */}
          <p className="v4sec-fig" data-rise>
            FIG J · the journal
          </p>
          <h1
            id="blog-title"
            className="v4sec-title blog-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            Notes from the source.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Long-form pedagogy on <b>Intent as Code</b> — why useful AI work belongs in a file,
            why the language locks at four verbs, and what local-first actually buys you. Two
            flagship reads live; more are on the way.
          </p>
          <p className="v4page-stamp" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
            2 live · 2 upcoming
          </p>

          {/* ══ FIG J.1 · Intent as Code ════════════════════════════════════ */}
          <article id="intent-as-code" className="v4block" data-rise>
            <div className="v4block-head-line">
              <span className="v4block-fig">FIG J.1</span>
              <h2 className="v4block-name">Intent as Code: why your AI work should be a file</h2>
              <span className="v4block-count">Manifesto · 2026-06</span>
            </div>

            <div className="blog-art-body">
              <p>
                Think about the best thing you did with an AI last month. The careful prompt, the
                back-and-forth, the result that finally clicked. <b>Where is it now?</b> For most
                people the honest answer is: gone. Buried in a chat history you will never scroll
                back through, on a server you don&apos;t control.
              </p>
              <p>
                We&apos;ve accepted a strange deal: the more useful the work, the more disposable
                the container. Nobody would write software in a text box that forgets everything.
                Yet that&apos;s exactly how most AI work happens today.
              </p>
              <p>
                <b>Nika&apos;s bet is simple: useful AI work is worth writing down.</b> Not as a
                transcript, as <em>source</em>. A small YAML file that says what you want: fetch
                this, think about that, run this command, save the result. The file is the
                workflow. Run it again tomorrow and it does the same thing. Change a line and{' '}
                <code>git diff</code> shows exactly what changed.
              </p>
              <p>
                Four verbs cover the whole space: <b>infer</b> (call a model), <b>exec</b> (run a
                process), <b>invoke</b> (use a tool), <b>agent</b> (let it work a loop). Everything
                else is data flowing between tasks. The order falls out of the dependencies. Write{' '}
                <code>depends_on</code> and independent branches run in parallel, for free.
              </p>
              <p>
                And it runs on <b>your machine</b>. One Rust binary. Your model keys, your files,
                your git history. No cloud between you and your own work, and a license (AGPL) that
                guarantees it stays that way.
              </p>
              <p>
                Chat is a great place to <em>figure out</em> what you want. It is a terrible place
                to <em>keep</em> it. Explore in chat. Then write the intent down, and own it
                forever.
              </p>
            </div>

            <div className="blog-art-foot">
              <a href={SPEC} target="_blank" rel="noreferrer" className="blog-art-foot-link">
                Read the spec ↗
              </a>
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                className="blog-art-foot-link blog-art-foot-link--dim"
              >
                Star on GitHub ↗
              </a>
            </div>
          </article>

          {/* ══ FIG J.2 · Four verbs are enough ═════════════════════════════ */}
          <article id="four-verbs" className="v4block" data-rise>
            <div className="v4block-head-line">
              <span className="v4block-fig">FIG J.2</span>
              <h2 className="v4block-name">Four verbs are enough</h2>
              <span className="v4block-count">Language · 2026-06</span>
            </div>

            <div className="blog-art-body">
              <p>
                Every workflow language faces the same temptation: keep adding verbs. A verb for
                HTTP. A verb for files. A verb for email, for SQL, for whatever last week&apos;s
                integration needed. Ten years later the language is a catalog nobody can hold in
                their head, and every file is written in a different dialect of it.
              </p>
              <p>
                Nika locks the count at four, forever. The rule that makes this possible is strict:{' '}
                <b>a verb is a distinct execution model</b>, not a feature. <b>infer</b> generates
                with a model. <b>exec</b> runs a process. <b>invoke</b> calls a tool and returns.{' '}
                <b>agent</b> loops with tools until the job is done. Four genuinely different ways
                for a machine to act. There is no fifth.
              </p>
            </div>

            <div className="blog-art-code">
              <p className="blog-art-code-cap">Three verbs in one tiny plan</p>
              <CodeFile yaml={FOUR_VERBS_YAML} filename="morning-brief.nika.yaml" />
            </div>

            <div className="blog-art-body">
              <p>
                The test case was fetch. Surely getting a web page deserves its own verb? It does
                not, and the reason is the whole design: <b>fetching is not a distinct execution
                model.</b> It is a tool call. So <code>nika:fetch</code> lives in the standard
                library, reached through invoke, next to read, write, jq and the other{' '}
                {CANON.builtins - 4} builtins. Everything callable is a tool. Everything about
                ordering is the graph.
              </p>
              <p>
                A closed language is a feature you can feel. You can finish learning it: four words
                and the file reads like prose. Your files never rot into an old dialect, because
                there is no new dialect coming. And tools keep growing where growth belongs, in the
                library: a new builtin, a new tool server (MCP), a new provider. The language
                holds still
                while the toolbelt expands.
              </p>
              <p>
                That stillness is the promise. The file you write today is the file you run in ten
                years. Languages that stop moving are the ones you can build on.
              </p>
            </div>

            <div className="blog-art-foot">
              <a href={SPEC} target="_blank" rel="noreferrer" className="blog-art-foot-link">
                Read the spec ↗
              </a>
              <Link to="/learn" className="blog-art-foot-link blog-art-foot-link--dim">
                Learn the file, line by line →
              </Link>
            </div>
          </article>

          {/* ══ the upcoming register ═══════════════════════════════════════ */}
          <div className="blog-soon" data-rise>
            <div className="blog-soon-head">
              <span className="blog-soon-fig">FIG J.3 · in the pipeline</span>
              <span className="blog-soon-count">{SOON.length} upcoming</span>
            </div>
            <div className="blog-soon-grid">
              {SOON.map((p) => (
                <div key={p.slug} className="blog-soon-tile">
                  <p className="blog-soon-meta">
                    <span className="blog-soon-tag">{p.tag}</span>
                    <span aria-hidden>·</span>
                    <span>{p.date}</span>
                  </p>
                  <p className="blog-soon-title">{p.title}</p>
                  <p className="blog-soon-teaser">{p.teaser}</p>
                </div>
              ))}
            </div>
          </div>

          {/* the close · the doc dimension line + the page footer */}
          <p className="v4docnote" data-rise>
            Intent as Code · {CANON.verbs} verbs · {CANON.builtins} builtins ·{' '}
            {CANON.providers} providers — written down, replayable, yours
          </p>

          <footer className="v4docfoot">
            <span className="v4docfoot-brand">
              <img src="/nika.svg" alt="" width={13} height={13} />
              nika · free software · AGPL-3.0-or-later
            </span>
            <Link to="/">← supernovae</Link>
          </footer>
        </div>
      </section>
    </main>
  )
}
