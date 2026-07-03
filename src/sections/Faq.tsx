import { useRevealOnce } from './use-reveal-once'
import { FAQ_ITEMS } from './faq-data'
import './v4-home.css'
import { SectionHead } from '../components/SectionHead'

/* ─── FIG 9.5 · FAQ (theme-LIGHT · disarm the real objections) ─────────────────
   v4.1 control narrative · the honest Q&A that answers the rebuttals a sharp
   visitor actually has ("I already see the steps", "isn't this just YAML",
   "why not LangGraph", "does my data leave", "is it production-ready"). The copy
   is the operator's own rebuttals — fair, no overclaim, no competitor-trashing.

   Accessible disclosure: native <details>/<summary> — keyboard-operable and
   screen-reader-announced for free (Enter/Space toggles, aria-expanded is
   implicit). focus-visible rings come from the global rule. Monochrome blueprint
   register (FIG numbering, hairline rules).

   The FAQ_ITEMS array (src/sections/faq-data.ts) is the SINGLE SOURCE OF TRUTH
   for both this rendered list AND the FAQPage JSON-LD (built in Home.tsx from the
   same import) — so the structured data can never drift from what's on the page.
   It lives in its own module so this file only exports a component (react-refresh).

   SSR-safe: pure DOM; the reveal is an IntersectionObserver added on mount with
   content visible by default (no-JS / reduced-motion). <details> renders its
   content in the DOM (closed = visually hidden, still crawlable + in the HTML). */

export default function Faq() {
  /* reveal the rows once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section ref={ref} id="faq" aria-labelledby="faq-title" className="theme-light v4sec v4-cv scroll-mt-24">
      <div className="v4sec-wrap">
        <SectionHead fig="14" id="faq-title" title={<>Questions, answered straight.</>}>
          The real objections, and honest answers. No overclaiming, no dunking on the
          tools you already use.
        </SectionHead>

        {/* the disclosures · native <details>/<summary> (keyboard + a11y for free) */}
        <ul className="v4faq" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
          {FAQ_ITEMS.map((item, i) => (
            <li className="v4faq-item" key={item.q}>
              <details className="v4faq-details">
                <summary className="v4faq-summary">
                  <span className="v4faq-fig" aria-hidden>
                    9.5.{i + 1}
                  </span>
                  <span className="v4faq-q">{item.q}</span>
                  <span className="v4faq-mark" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="v4faq-a">{item.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
