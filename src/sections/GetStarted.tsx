import { useState } from 'react'
import { Link } from 'react-router'
import { useRevealOnce } from './use-reveal-once'
import { CodeFile } from '../components/CodeFile'
import { SHOWCASE_YAML } from './usecases-yaml.generated'
import { sliceExcerpt } from './living/excerpt'
import './v4-home.css'

/* ─── FIG 7.5 · Get started (theme-dark · the on-ramp) ─────────────────────────
   v4.1 control narrative · a convinced visitor needs a concrete "how do I start?".
   Three numbered steps in the blueprint register (FIG step numbers, hairline
   rules, monochrome): ① install · ② write a file · ③ run it. Tight, scannable —
   it earns its place by being the bridge from "I believe it" to "I ran it".

     ① INSTALL — the REAL affordances: brew (primary) + a curl | sh alt (the
       real public/install.sh URL), each with a copy button (the hero's monochrome
       install pattern, .v4install).
     ② WRITE A FILE — a SHORT, TRUE slice of a real projected showcase
       (`SHOWCASE_YAML['t1-standup-digest']`, the smallest real multi-verb file):
       header + a couple of representative tasks, rendered by <CodeFile/>. READ-
       ONLY — sliced from the projected source by line range, never hand-typed.
     ③ RUN IT — `nika run` → it prints the plan, checks the permits, runs within
       bounds. The one canonical run line + the three-beat guarantee.

   Closes on a "Learn it in 5 minutes →" link to /learn.

   Spec-true BY CONSTRUCTION: the YAML excerpt is sliced from the generated
   showcase (the SSOT projector); the install commands are the real brew formula +
   the real install.sh URL. SSR-safe: pure DOM; <CodeFile/> is server-rendered
   (the slice lives in the prerendered HTML); the reveal is an IntersectionObserver
   added on mount with content visible by default (no-JS / reduced-motion). */

const BREW_CMD = 'brew install supernovae-st/tap/nika'
const CURL_CMD = 'curl -LsSf https://nika.sh/install.sh | sh'
const RUN_CMD = 'nika run standup-digest.nika.yaml'

/* a SHORT, TRUE slice of the smallest real multi-verb showcase file: the header
   (nika: v1 · workflow · description · model) + two representative tasks (the
   exec that reads the git log + the infer that writes the note) + the output —
   real, contiguous line ranges, never hand-typed. `…` marks the trimmed lines. */
const FULL_YAML = SHOWCASE_YAML['t1-standup-digest']
const { text: WRITE_YAML } = sliceExcerpt(FULL_YAML, [
  [1, 5], // nika: v1 · workflow · description · model
  [14, 16], // - id: history · exec · git log
  [18, 24], // - id: digest · depends_on · infer · prompt head
  [37, 38], // outputs: · note
])

/* the monochrome install affordance — the hero's pattern (.v4install in
   src/shell/shell.css), parameterised for the two install methods. A bordered
   mono row + a copy button with a non-color-only copied state (icon + text both
   flip). SSR-safe: navigator is only read inside the click handler. */
function CopyRow({ cmd, label }: { cmd: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(cmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="v4install">
      <span className="v4install-cmd">
        <span className="v4install-dollar" aria-hidden>
          ❯
        </span>
        {cmd}
      </span>
      <button
        type="button"
        onClick={copy}
        className="v4install-copy"
        data-copied={copied}
        aria-label={copied ? `Copied: ${label}` : `Copy ${label} command`}
      >
        {copied ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  )
}

export default function GetStarted() {
  /* reveal the rows once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section ref={ref} id="get-started" aria-labelledby="get-started-title" className="theme-dark v4sec v4-flip scroll-mt-24">
      <div className="v4sec-wrap">
        <p className="v4sec-fig" data-rise>
          FIG 7.5
        </p>
        <h2 id="get-started-title" className="v4sec-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
          Get started.
        </h2>
        <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          One binary, one file, one command. Install it, write a plan, run it — and
          watch it <b>print the plan, check the permits, and stay within bounds</b>.
        </p>

        {/* the three numbered steps · a hairline-ruled blueprint register */}
        <ol className="v4start" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
          {/* ① INSTALL */}
          <li className="v4start-step">
            <div className="v4start-head">
              <span className="v4start-num" aria-hidden>
                ①
              </span>
              <h3 className="v4start-title">Install</h3>
            </div>
            <div className="v4start-body">
              <p className="v4start-desc">
                One Rust binary. Homebrew on macOS, or the install script anywhere.
              </p>
              <div className="v4start-installs">
                <CopyRow cmd={BREW_CMD} label="Homebrew install" />
                <span className="v4start-or" aria-hidden>
                  or
                </span>
                <CopyRow cmd={CURL_CMD} label="curl install" />
              </div>
            </div>
          </li>

          {/* ② WRITE A FILE */}
          <li className="v4start-step">
            <div className="v4start-head">
              <span className="v4start-num" aria-hidden>
                ②
              </span>
              <h3 className="v4start-title">Write a file</h3>
            </div>
            <div className="v4start-body">
              <p className="v4start-desc">
                A plan is plain YAML: the steps, the verbs, the wiring. Here a local
                model reads yesterday&apos;s commits and writes today&apos;s standup note.
              </p>
              <CodeFile
                yaml={WRITE_YAML}
                filename="standup-digest.nika.yaml"
                className="v4start-code"
              />
              <p className="v4start-readonly" aria-hidden>
                real lines, sliced from a projected showcase — read-only
              </p>
            </div>
          </li>

          {/* ③ RUN IT */}
          <li className="v4start-step">
            <div className="v4start-head">
              <span className="v4start-num" aria-hidden>
                ③
              </span>
              <h3 className="v4start-title">Run it</h3>
            </div>
            <div className="v4start-body">
              <p className="v4start-desc">
                Point the binary at the file. It prints the plan, checks the permits,
                and runs within bounds — every step traced and replayable.
              </p>
              <CopyRow cmd={RUN_CMD} label="run" />
            </div>
          </li>
        </ol>

        {/* the close · learn it in 5 minutes */}
        <p className="v4start-more" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          <Link to="/learn" className="v4start-more-link">
            Learn it in 5 minutes
            <span aria-hidden> →</span>
          </Link>
          <span className="v4start-more-note" aria-hidden>
            the quickstart, end to end
          </span>
        </p>
      </div>
    </section>
  )
}
