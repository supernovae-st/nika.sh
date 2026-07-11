import { Link } from 'react-router'
import { useRevealOnce } from './use-reveal-once'
import { CodeFile } from '../components/CodeFile'
import { CopyRow } from '../components/CopyRow'
import { InstallCommand, INSTALL_CMD } from '../components/InstallCommand'
import { DOCS } from '../content'
import type { FlagshipEntry } from '../flagships'
import { sliceExcerpt } from '../lib/excerpt'
import './v4-home.css'
import { SectionHead } from '../components/SectionHead'

/* ─── FIG 6.0 · Get started (theme-dark · the on-ramp) ─────────────────────────
   v4.1 control narrative · a convinced visitor needs a concrete "how do I start?".
   Three numbered steps in the blueprint register (FIG step numbers, hairline
   rules, monochrome): 6.0.1 install · 6.0.2 write a file · 6.0.3 run it. Tight, scannable —
   it earns its place by being the bridge from "I believe it" to "I ran it".

     6.0.1 INSTALL — the REAL affordances: brew (primary) + a curl | sh alt (the
       real public/install.sh URL), each with a copy button (the hero's monochrome
       install pattern, .v4install).
     6.0.2 WRITE A FILE — a SHORT, TRUE slice of a real projected showcase
       (`SHOWCASE_YAML['t1-standup-digest']`, the smallest real multi-verb file):
       header + a couple of representative tasks, rendered by <CodeFile wrap tips />. READ-
       ONLY — sliced from the projected source by line range, never hand-typed.
     6.0.3 RUN IT — `nika run` → it prints the plan, checks the permits, runs within
       bounds. The one canonical run line + the three-beat guarantee.

   Closes on a "Learn it in 5 minutes →" link to /learn.

   Spec-true BY CONSTRUCTION: the YAML excerpt is sliced from the generated
   showcase (the SSOT projector); the install commands are the real brew formula +
   the real install.sh URL. SSR-safe: pure DOM; <CodeFile wrap tips /> is server-rendered
   (the slice lives in the prerendered HTML); the reveal is an IntersectionObserver
   added on mount with content visible by default (no-JS / reduced-motion). */

const CURL_CMD = 'curl -LsSf https://nika.sh/install.sh | sh'

/* the REAL extension listings (engine README · supernovae.nika-lang) — the
   nika-lang language support for every VS Code-compatible editor. */
const VSCODE_MARKETPLACE =
  'https://marketplace.visualstudio.com/items?itemName=supernovae.nika-lang'
const OPENVSX = 'https://open-vsx.org/extension/supernovae/nika-lang'

export default function GetStarted({ flagship }: { flagship: FlagshipEntry }) {
  /* a SHORT, TRUE slice of THE selected file (law #1 · one story, one file):
     the envelope + the permits block + the first task, lifted verbatim by
     line range from the same body the hero shows. `…` marks trimmed lines. */
  const firstTask = flagship.plan.tasks[0]
  const { text: writeYaml } = sliceExcerpt(flagship.yaml, [
    [1, 3],
    flagship.plan.permitsRange,
    [firstTask.line0, firstTask.line1],
  ])
  const runCmd = `nika run ${flagship.filename}`
  /* reveal the rows once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section ref={ref} id="get-started" aria-labelledby="get-started-title" className="theme-dark v4sec v4-flip v4-cv scroll-mt-24">
      <div className="v4sec-wrap">
        <SectionHead fig="12" id="get-started-title" title={<>Get started.</>}>
          One binary, one file, one command. Install it, write a plan, run it, and
          watch it <b>print the plan, check the permits, and stay within bounds</b>.
        </SectionHead>

        {/* the three numbered steps · a hairline-ruled blueprint register */}
        <ol className="v4start" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
          {/* 6.0.1 · INSTALL */}
          <li className="v4start-step">
            <div className="v4start-head">
              <span className="v4start-num" aria-hidden>
                6.0.1
              </span>
              <h3 className="v4start-title">Install</h3>
            </div>
            <div className="v4start-body">
              <p className="v4start-desc">
                One Rust binary. Homebrew on macOS, or the install script anywhere.
              </p>
              <div className="v4start-installs">
                <CopyRow track="install-copy" cmd={INSTALL_CMD} label="Homebrew install" />
                <span className="v4start-or" aria-hidden>
                  or
                </span>
                <CopyRow track="install-copy" cmd={CURL_CMD} label="curl install" />
              </div>
            </div>
          </li>

          {/* 6.0.2 · WRITE A FILE */}
          <li className="v4start-step">
            <div className="v4start-head">
              <span className="v4start-num" aria-hidden>
                6.0.2
              </span>
              <h3 className="v4start-title">Write a file</h3>
            </div>
            <div className="v4start-body">
              <p className="v4start-desc">
                A plan is plain YAML: the steps, the verbs, the wiring. This is the same
                file the page just ran, opened at its first step.
              </p>
              <div className="v4start-frame v4-frame-canvas">
                <CodeFile yaml={writeYaml} filename={`${flagship.filename} · excerpt`} wrap tips />
              </div>
              <p className="v4start-readonly">
                real lines, sliced from the file above · read-only
              </p>
            </div>
          </li>

          {/* 6.0.3 · RUN IT */}
          <li className="v4start-step">
            <div className="v4start-head">
              <span className="v4start-num" aria-hidden>
                6.0.3
              </span>
              <h3 className="v4start-title">Run it</h3>
            </div>
            <div className="v4start-body">
              <p className="v4start-desc">
                Point the binary at the file. It prints the plan, checks the permits,
                and runs within bounds. Every step traced and replayable.
              </p>
              <CopyRow track="install-copy" cmd={runCmd} label="run" />
            </div>
          </li>
        </ol>

        {/* ── RUNS EVERYWHERE · the three surfaces (Codex pattern) ────────────
             Terminal / editor / agent — sharp hairline cards, mono kickers.
             The terminal card's CTA IS the copyable command pill (the shared
             hero affordance); the editor card links the REAL nika-lang
             listings; the agent card states the REAL wiring verbs (nika init
             scaffolds AGENTS.md · nika wire adds the read-only MCP oracle —
             nika_check · nika_explain — into Claude/Cursor/VS Code/Windsurf). */}
        <div className="v4every" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
          <p className="v4every-eyebrow">
            runs everywhere · same file, same result
          </p>
          <div className="v4every-row">
            <article className="v4every-card" aria-labelledby="v4every-terminal">
              <h3 className="v4every-kicker" id="v4every-terminal">
                <span className="v4every-n">6.0.4</span> In your terminal
              </h3>
              <p className="v4every-body">
                One Rust binary. The command is the button: click it, paste it, run.
              </p>
              <div className="v4every-cta">
                <InstallCommand />
              </div>
            </article>

            <article className="v4every-card" aria-labelledby="v4every-editor">
              <h3 className="v4every-kicker" id="v4every-editor">
                <span className="v4every-n">6.0.5</span> In your editor
              </h3>
              <p className="v4every-body">
                The <code className="mono">nika-lang</code> extension: the file as
                a content-first canvas — run it live, replay it, audit it before a
                token is spent — plus engine-true diagnostics and completions, in
                VS Code, Cursor and Windsurf.
              </p>
              <div className="v4every-cta v4every-links">
                <a href={VSCODE_MARKETPLACE} target="_blank" rel="noreferrer" className="v4every-link">
                  VS Code Marketplace
                  <span className="acue acue--ext" aria-hidden> ↗</span>
                </a>
                <a href={OPENVSX} target="_blank" rel="noreferrer" className="v4every-link">
                  Open VSX · Cursor / Windsurf
                  <span className="acue acue--ext" aria-hidden> ↗</span>
                </a>
              </div>
            </article>

            <article className="v4every-card" aria-labelledby="v4every-agent">
              <h3 className="v4every-kicker" id="v4every-agent">
                <span className="v4every-n">6.0.6</span> With your agent
              </h3>
              <p className="v4every-body">
                <code className="mono">nika init</code> writes AGENTS.md ·{' '}
                <code className="mono">nika wire claude|cursor</code> adds the
                read-only oracle (<code className="mono">nika_check</code> ·{' '}
                <code className="mono">nika_explain</code>).
              </p>
              <div className="v4every-cta v4every-links">
                <a href={DOCS} target="_blank" rel="noreferrer" className="v4every-link">
                  docs.nika.sh
                  <span className="acue acue--ext" aria-hidden> ↗</span>
                </a>
              </div>
            </article>
          </div>
        </div>

        {/* the close · learn it in 5 minutes */}
        <p className="v4start-more" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          <Link to="/learn" className="v4start-more-link">
            Learn it in 5 minutes
            <span className="acue acue--r" aria-hidden>
              {' '}
              →
            </span>
          </Link>
          <span className="v4start-more-note" aria-hidden>
            the quickstart, end to end
          </span>
        </p>
      </div>
    </section>
  )
}
