import { useEffect, useRef } from 'react';

interface Week {
  number: number;
  organ: string;
  headline: string;
  stat: string;
}

// Chrysalis chapter data — hardcoded for now, real entries will come from
// the changelog collection once more weeks are published.
const WEEKS: Week[] = [
  { number:  1, organ: 'nika-error',    headline: 'The nervous system begins',          stat: '44 tests · 0 unwrap()' },
  { number:  2, organ: 'nika-engine',   headline: 'Topological executor awakens',        stat: 'DAG executor · 0 panics' },
  { number:  3, organ: 'nika-schema',   headline: 'The YAML contract is written',        stat: '5 verbs · 1 schema' },
  { number:  4, organ: 'nika-dag',      headline: 'Parallel task graph admitted',        stat: 'Topo-sort · cycle detection' },
  { number:  5, organ: 'nika-infer',    headline: 'First LLM call succeeds',             stat: 'Anthropic · OpenAI online' },
  { number:  6, organ: 'nika-invoke',   headline: '63 builtin tools available',          stat: 'shell · fs · http · git' },
  { number:  7, organ: 'nika-shield',   headline: 'Six-layer injection defense',         stat: 'OWASP LLM Top-10 covered' },
  { number:  8, organ: 'nika-cli',      headline: 'The binary ships to users',           stat: 'brew install · 9 providers' },
  { number:  9, organ: 'nika-catalog',  headline: 'Self-hosted registry grows',          stat: 'Catalog verify admitted' },
  { number: 10, organ: 'nika-agent',    headline: 'Agent verb enters chrysalis',         stat: 'In-progress · v0.90.0-alpha' },
];

interface HorizontalTimelineProps {
  className?: string;
}

/**
 * HorizontalTimeline — sticky 400vh section that maps vertical scroll
 * to horizontal translation through the Chrysalis chapter cards.
 *
 * No motion/react dependency — uses a scroll listener + CSS transform.
 * Sticky container creates the scroll canvas; inner track slides left.
 *
 * Mobile: falls back to a native horizontal scroll (overflow-x: scroll
 * with snap) when the viewport is too narrow for the sticky pattern.
 *
 * Guardrails:
 * - prefers-reduced-motion: disables the scroll hijack, shows static row
 * - ResizeObserver tracks container width changes
 * - Cleans up listener on unmount
 */
export function HorizontalTimeline({ className = '' }: HorizontalTimelineProps) {
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sticky = stickyRef.current;
    const track  = trackRef.current;
    if (!sticky || !track) return;

    if (
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    // Only activate on viewport wide enough for the sticky pattern
    if (window.innerWidth < 768) return;

    const outer = sticky.parentElement as HTMLElement;

    const update = () => {
      const { top, height } = outer.getBoundingClientRect();
      // progress: 0 at top of section, 1 at bottom
      const progress = Math.max(0, Math.min(1, -top / (height - window.innerHeight)));

      const maxSlide = track.scrollWidth - track.offsetWidth;
      track.style.transform = `translateX(-${progress * maxSlide}px)`;
    };

    window.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(outer);

    return () => {
      window.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      className={`timeline-outer ${className}`}
      style={{ height: '420vh' }}
    >
      {/* Sticky viewport — fills screen height */}
      <div
        ref={stickyRef}
        className="timeline-sticky"
        style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}
      >
        {/* Vertical centering wrapper */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {/* Sliding track */}
          <div
            ref={trackRef}
            className="timeline-track"
            style={{ willChange: 'transform', transition: 'transform 60ms linear' }}
          >
            {/* Section header card */}
            <div className="timeline-header-card">
              <div className="mono-display mono-display-sm" style={{ color: 'var(--color-brand)' }}>
                § CHRYSALIS
              </div>
              <p className="timeline-header-text">
                Week by week. Organ by organ.
              </p>
            </div>

            {WEEKS.map((week, i) => (
              <article
                key={week.number}
                className="timeline-card"
                aria-label={`Week ${week.number}: ${week.headline}`}
              >
                {/* Week number */}
                <div className="timeline-week-num">
                  {String(week.number).padStart(2, '0')}
                </div>

                {/* Organ badge */}
                <div className="timeline-organ">{week.organ}</div>

                {/* Headline */}
                <h3 className="timeline-headline">{week.headline}</h3>

                {/* Stat line */}
                <div className="timeline-stat">{week.stat}</div>

                {/* Connector line between cards */}
                {i < WEEKS.length - 1 && (
                  <div className="timeline-connector" aria-hidden="true" />
                )}
              </article>
            ))}

            {/* End marker */}
            <div className="timeline-end-card">
              <div className="mono-display mono-display-sm" style={{ color: 'var(--color-fg-ghost)' }}>
                v0.90.0
              </div>
              <div className="timeline-end-label">emerge</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HorizontalTimeline;
