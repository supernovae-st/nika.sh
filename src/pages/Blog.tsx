import { Link } from 'react-router'
import { REPO, SPEC } from '../content'
import { CANON } from '../canon.generated'

/* ─── /blog · the journal — pedagogy in long form ───────────────────────────
   Routed at /blog (React Router) · no 3D (fast, readable) · one REAL flagship
   article + upcoming teasers. Same cosmos palette, print rhythm. */

const POSTS = [
  {
    slug: 'intent-as-code',
    tag: 'Manifesto',
    date: '2026-06',
    title: 'Intent as Code: why your AI work should be a file',
    teaser: 'Chat windows eat your best work. Here is the case for writing intent down, and what changes when you do.',
    live: true,
  },
  {
    slug: 'four-verbs',
    tag: 'Language',
    date: '2026-06',
    title: 'Four verbs are enough',
    teaser: 'infer, exec, invoke, agent: why the operation space is closed, and why that is a feature.',
    live: true,
  },
  {
    slug: 'dag-for-free',
    tag: 'Engine',
    date: 'soon',
    title: 'The DAG you get for free',
    teaser: 'depends_on is all you write. Parallelism, ordering and retries fall out of the graph.',
    live: false,
  },
  {
    slug: 'own-your-stack',
    tag: 'Sovereignty',
    date: 'soon',
    title: 'No cloud needed',
    teaser: 'One Rust binary, your models, your files. What local-first actually buys you.',
    live: false,
  },
]

export function Component() {
  return (
    <main className="relative z-20 mx-auto max-w-3xl px-6 pt-32 pb-24">
      {/* mini nav */}
      <nav className="glass fixed top-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-1.5 text-[13px]">
        <Link to="/" className="flex items-center gap-2 px-3 py-1.5 font-semibold tracking-tight">
          <img src="/nika.svg" alt="" width={17} height={17} />
          nika
        </Link>
        <span className="mx-1 h-4 w-px" style={{ background: 'var(--hair)' }} />
        <span className="px-3 py-1.5 text-[var(--fg)]">Blog</span>
        <Link
          to="/"
          className="rounded-full px-3 py-1.5 whitespace-nowrap text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
        >
          ← Back to site
        </Link>
      </nav>

      <p className="mono mb-4 text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
        § The journal
      </p>
      <h1
        className="mb-12 font-semibold tracking-tight"
        style={{ fontSize: 'clamp(2.2rem, 1rem + 4vw, 3.8rem)', lineHeight: 1.02 }}
      >
        Notes from the source.
      </h1>

      {/* flagship article — full read */}
      <article className="skeuo mb-10 rounded-2xl px-8 py-8 md:px-10 md:py-10">
        <p className="mono mb-3 text-[11px] tracking-[0.2em] text-[var(--cyan)] uppercase">
          Manifesto · 2026-06
        </p>
        <h2
          className="mb-6 font-semibold tracking-tight"
          style={{ fontSize: 'clamp(1.6rem, 1rem + 2vw, 2.4rem)', lineHeight: 1.08 }}
        >
          Intent as Code: why your AI work should be a file
        </h2>
        <div className="space-y-5 text-[15.5px] leading-relaxed text-[var(--fg-mute)]">
          <p>
            Think about the best thing you did with an AI last month. The careful prompt, the
            back-and-forth, the result that finally clicked.{' '}
            <span className="text-[var(--fg)]">Where is it now?</span> For most people the honest
            answer is: gone. Buried in a chat history you will never scroll back through, on a
            server you don&apos;t control.
          </p>
          <p>
            We&apos;ve accepted a strange deal: the more useful the work, the more disposable the
            container. Nobody would write software in a text box that forgets everything. Yet
            that&apos;s exactly how most AI work happens today.
          </p>
          <p>
            <span className="text-[var(--fg)]">Nika&apos;s bet is simple: useful AI work is worth
            writing down.</span> Not as a transcript, as <em>source</em>. A small YAML file that
            says what you want: fetch this, think about that, run this command, save the result.
            The file is the workflow. Run it again tomorrow and it does the same thing. Change a
            line and <code className="mono text-[13px] text-[var(--cyan)]">git diff</code> shows
            exactly what changed.
          </p>
          <p>
            Four verbs cover the whole space: <span className="text-[var(--fg)]">infer</span>{' '}
            (call a model), <span className="text-[var(--fg)]">exec</span> (run a process),{' '}
            <span className="text-[var(--fg)]">invoke</span> (use a tool),{' '}
            <span className="text-[var(--fg)]">agent</span> (let it work a loop). Everything else
            is data flowing between tasks. The order falls out of the dependencies. Write{' '}
            <code className="mono text-[13px] text-[var(--cyan)]">depends_on</code> and
            independent branches run in parallel, for free.
          </p>
          <p>
            And it runs on <span className="text-[var(--fg)]">your machine</span>. One Rust
            binary. Your model keys, your files, your git history. No cloud between you and your
            own work, and a license (AGPL) that guarantees it stays that way.
          </p>
          <p>
            Chat is a great place to <em>figure out</em> what you want. It is a terrible place to{' '}
            <em>keep</em> it. Explore in chat. Then write the intent down, and own it forever.
          </p>
        </div>
        <div className="mono mt-8 flex flex-wrap gap-5 border-t pt-5 text-[12.5px]" style={{ borderColor: 'var(--hair)' }}>
          <a href={SPEC} target="_blank" rel="noreferrer" className="text-[var(--cyan)] transition-colors hover:text-[var(--fg)]">
            Read the spec →
          </a>
          <a href={REPO} target="_blank" rel="noreferrer" className="text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]">
            Star on GitHub →
          </a>
        </div>
      </article>

      {/* second article · the language doctrine */}
      <article id="four-verbs" className="skeuo mb-10 rounded-2xl px-8 py-8 md:px-10 md:py-10">
        <p className="mono mb-3 text-[11px] tracking-[0.2em] text-[var(--cyan)] uppercase">
          Language · 2026-06
        </p>
        <h2
          className="mb-6 font-semibold tracking-tight"
          style={{ fontSize: 'clamp(1.6rem, 1rem + 2vw, 2.4rem)', lineHeight: 1.08 }}
        >
          Four verbs are enough
        </h2>
        <div className="space-y-5 text-[15.5px] leading-relaxed text-[var(--fg-mute)]">
          <p>
            Every workflow language faces the same temptation: keep adding verbs. A verb for HTTP.
            A verb for files. A verb for email, for SQL, for whatever last week&apos;s integration
            needed. Ten years later the language is a catalog nobody can hold in their head, and
            every file is written in a different dialect of it.
          </p>
          <p>
            Nika locks the count at four, forever. The rule that makes this possible is strict:{' '}
            <span className="text-[var(--fg)]">a verb is a distinct execution model</span>, not a
            feature. <span className="text-[var(--fg)]">infer</span> generates with a model.{' '}
            <span className="text-[var(--fg)]">exec</span> runs a process.{' '}
            <span className="text-[var(--fg)]">invoke</span> calls a tool and returns.{' '}
            <span className="text-[var(--fg)]">agent</span> loops with tools until the job is done.
            Four genuinely different ways for a machine to act. There is no fifth.
          </p>
          <p>
            The test case was fetch. Surely getting a web page deserves its own verb? It does not,
            and the reason is the whole design:{' '}
            <span className="text-[var(--fg)]">fetching is not a distinct execution model.</span>{' '}
            It is a tool call. So <code className="mono text-[13px] text-[var(--cyan)]">
            nika:fetch</code> lives in the standard library, reached through invoke, next to read,
            write, jq and the other {CANON.builtins - 4} builtins. Everything callable is a tool. Everything about
            ordering is the graph.
          </p>
          <p>
            A closed language is a feature you can feel. You can finish learning it: four words
            and the file reads like prose. Your files never rot into an old dialect, because there
            is no new dialect coming. And tools keep growing where growth belongs, in the library:
            a new builtin, a new MCP server, a new provider. The language holds still while the
            toolbelt expands.
          </p>
          <p>
            That stillness is the promise. The file you write today is the file you run in ten
            years. Languages that stop moving are the ones you can build on.
          </p>
        </div>
        <div className="mono mt-8 flex flex-wrap gap-5 border-t pt-5 text-[12.5px]" style={{ borderColor: 'var(--hair)' }}>
          <a href={SPEC} target="_blank" rel="noreferrer" className="text-[var(--cyan)] transition-colors hover:text-[var(--fg)]">
            Read the spec →
          </a>
          <Link to="/learn" className="text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]">
            Learn the file, line by line →
          </Link>
        </div>
      </article>

      {/* upcoming */}
      <div className="grid gap-4 sm:grid-cols-3">
        {POSTS.filter((p) => !p.live).map((p) => (
          <div key={p.slug} className="glass rounded-2xl px-6 py-6 opacity-80">
            <p className="mono mb-2 text-[10.5px] tracking-[0.2em] text-[var(--fg-dim)] uppercase">
              {p.tag} · {p.date}
            </p>
            <p className="mb-2 text-[15px] leading-snug font-semibold text-[var(--fg)]">
              {p.title}
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--fg-mute)]">{p.teaser}</p>
          </div>
        ))}
      </div>

      <footer className="mono mt-20 flex items-center justify-between border-t pt-6 text-[12px] text-[var(--fg-ghost)]" style={{ borderColor: 'var(--hair)' }}>
        <span className="flex items-center gap-2">
          <img src="/nika.svg" alt="" width={13} height={13} style={{ opacity: 0.7 }} />
          nika · free software · AGPL-3.0-or-later
        </span>
        <Link to="/" className="transition-colors hover:text-[var(--fg-mute)]">
          ← supernovae
        </Link>
      </footer>
    </main>
  )
}
