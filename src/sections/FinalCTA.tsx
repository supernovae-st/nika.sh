import { Link } from 'react-router'
import { REPO, SPEC } from '../content'
import { CopyRow } from '../components/CopyRow'
import { INSTALL_CMD } from '../components/InstallCommand'
import { useRevealOnce } from './use-reveal-once'
import SiteFooter from '../shell/SiteFooter'
import './v4-home.css'

/* ─── FIG 10.0 · Final CTA + the site footer (theme-dark · the close) ─────────
   Design doc §6 (FIG 10.0). The clean v4 close: the install affordance (the
   shared <CopyRow/> · the same monochrome install line as GetStarted), Star on
   GitHub, Read the spec — in the blueprint register. The SUPERNOVAE footer +
   the F3 signature now live in the shared <SiteFooter/> (F7 · one footer on
   every route); Home renders it here so the close beat keeps its rhythm.

   SSR-safe: pure DOM; the reveal is an IntersectionObserver added on mount,
   content fully visible by default (no-JS / reduced-motion). */

export default function FinalCTA() {
  /* reveal the rows once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section
      ref={ref}
      id="start"
      aria-labelledby="cta-title"
      className="theme-dark v4sec v4-flip scroll-mt-24"
    >
      <div className="v4sec-wrap v4cta-wrap">
        {/* (the W8 ASCII plate is GONE — operator call: the footer's living
            particle butterfly is THE mark of the close; one signature.) */}
        {/* the close · the install affordance + two flat CTAs, blueprint register */}
        <p className="v4sec-fig" data-rise>
          15
        </p>
        <h2
          id="cta-title"
          className="v4cta-title"
          data-rise
          style={{ ['--rise-delay' as string]: '60ms' }}
        >
          Put your agents on a leash you can&nbsp;read.
        </h2>
        <p className="v4cta-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          Install the binary, write the plan as a file, review what it&apos;s allowed
          to touch, run it. Same file, same result, enforced on your machine.
          Tomorrow, and the day the vendor is gone.
        </p>

        <div className="v4cta-install" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
          <CopyRow
            cmd={INSTALL_CMD}
            label="install"
            display={
              <>
                brew install <span className="v4install-dim">supernovae-st/tap/</span>nika
              </>
            }
          />
        </div>

        <div className="v4cta-links" data-rise style={{ ['--rise-delay' as string]: '240ms' }}>
          <a href={REPO} target="_blank" rel="noreferrer" className="v4cta-link">
            <span aria-hidden className="v4cta-link-glyph">
              ★
            </span>
            Star on GitHub
          </a>
          <a href={SPEC} target="_blank" rel="noreferrer" className="v4cta-link v4cta-link--dim">
            Read the spec
            <span aria-hidden className="v4cta-link-arrow">
              →
            </span>
          </a>
          <Link to="/learn" className="v4cta-link v4cta-link--dim">
            Learn it in 5&nbsp;min
            <span aria-hidden className="v4cta-link-arrow">
              →
            </span>
          </Link>
        </div>

        {/* ── the conversion beat · send us YOUR repeated task ─────────────────
             The acquisition hook, as its own hairline-ruled beat (no card): the
             two-tone ask + one link into /convert (the full offer page, which
             then routes out to the repo's issue chooser). The offer is real —
             community workflows become runnable, credited .nika.yaml examples. */}
        <div className="v4convert" data-rise style={{ ['--rise-delay' as string]: '300ms' }}>
          <p className="v4convert-ask">
            Do you repeat an AI task every week, in ChatGPT, Claude, Cursor, Codex,
            or scripts? <b>Send it.</b> We convert the best ones into runnable{' '}
            <code className="mono">.nika.yaml</code> examples, credited to you.
          </p>
          <Link to="/convert" className="v4convert-cta">
            Send a workflow
            <span aria-hidden className="v4convert-arrow">
              →
            </span>
          </Link>
        </div>

      </div>

      {/* FIG 10.5 · THE SIGNATURE + SUPERNOVAE · the shared site footer (the
           F3 living butterfly + the operator-locked wordmark + PROD rule) */}
      <SiteFooter />
    </section>
  )
}
