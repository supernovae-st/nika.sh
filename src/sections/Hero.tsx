import { Link } from 'react-router'
import { CodeFile } from '../components/CodeFile'
import { InstallPill } from '../components/ui'
import { REPO, SPEC } from '../content'
import { SHOWCASE_YAML } from './usecases-yaml.generated'

/* ─── Hero · the v4 trust-landing first surface (design doc §4) ───────────────
   Calm, opaque, theme-dark, full-viewport. PURE DOM — ZERO WebGL. This is the
   SEO win: the headline `Intent as Code.` is a REAL <h1> in the prerendered
   HTML (v3 painted it inside the galaxy CanvasTexture, invisible to crawlers).

   The page loads straight to this calm screen (no blocking intro film). The
   global EdgeAurora frames it; the galaxy canvas stays mounted BEHIND but this
   section is opaque, so the first impression is restrained, not maximalist.

   Layout: copy on the left, a real showcase .nika.yaml on the right (stacks on
   mobile). The file is a REAL projected workflow (never hand-typed) — the
   short, readable `standup-digest` showcase: read yesterday's commits, write
   today's note. 3 of the 4 verbs (invoke · exec · infer), parallel tasks, a
   binding threading one task's output into the next. */

const HERO_YAML = SHOWCASE_YAML['t1-standup-digest']

export default function Hero() {
  return (
    <section
      id="hero"
      className="theme-dark relative isolate flex min-h-screen flex-col justify-center overflow-hidden"
    >
      {/* generous gutters + top padding clears the fixed Nav */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-20 md:pt-36">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          {/* ── left · the copy ── */}
          <div className="flex flex-col">
            {/* FIG 0.0 · the blueprint numbering (Linear steal) */}
            <p className="mono mb-6 text-[12px] tracking-[0.28em] text-dim uppercase">
              FIG 0.0
            </p>

            {/* the REAL <h1> · permanent title (AGENTS.md) · the SEO win */}
            <h1
              className="font-semibold tracking-tight text-text text-pretty"
              style={{
                fontFamily: 'var(--display)',
                fontSize: 'clamp(2.6rem, 1.4rem + 5vw, 5rem)',
                lineHeight: 1.02,
              }}
            >
              Intent as Code.
            </h1>

            <p className="mt-6 max-w-[34rem] text-[18px] leading-relaxed text-dim">
              One file. The whole workflow — on your machine, forever.
            </p>

            {/* the real install line (reused pill) */}
            <div className="mt-10">
              <InstallPill />
            </div>

            {/* one row of flat CTAs (Cursor steal · nothing over-emphasised) */}
            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3 text-[14.5px]">
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 text-text transition-colors hover:text-text"
              >
                <span aria-hidden className="text-dim transition-colors group-hover:text-text">
                  ★
                </span>
                Star on GitHub
              </a>
              <a
                href={SPEC}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-1.5 text-dim transition-colors hover:text-text"
              >
                Read the spec
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
              <Link
                to="/learn"
                className="group inline-flex items-center gap-1.5 text-dim transition-colors hover:text-text"
              >
                Learn it in 5 min
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>

          {/* ── right · the real file (SEO-crawlable DOM text) ── */}
          <div className="w-full">
            <CodeFile filename="standup-digest.nika.yaml" yaml={HERO_YAML} />
          </div>
        </div>
      </div>
    </section>
  )
}
