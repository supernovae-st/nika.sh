import type { ReactNode } from 'react';

/**
 * ConicCTA — 4-layer animated conic-gradient button.
 * Pure CSS, recolored to the blue brand (from the Slash template).
 *
 *   Layer 1 — rotating conic border (beam-spin keyframe)
 *   Layer 2 — inner dark surface
 *   Layer 3 — drifting dot pattern (dots-move keyframe)
 *   Layer 4 — glow under the label
 *
 * The visible text should be the ACTION, never the brand.
 */

export interface ConicCTAProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function ConicCTA({ children, href, onClick, className = '' }: ConicCTAProps) {
  const content = (
    <>
      {/* 1 — rotating conic border */}
      <span className="absolute inset-0 -z-20 rounded-full overflow-hidden p-[1px]" aria-hidden="true">
        <span
          className="absolute inset-[-100%]"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0 300deg, oklch(0.62 0.195 258) 360deg)',
            animation: 'beam-spin 3s linear infinite',
          }}
        />
        <span
          className="absolute inset-[1px] rounded-full"
          style={{ background: 'oklch(0.08 0.015 258)' }}
        />
      </span>

      {/* 2 — inner dark surface */}
      <span
        className="-z-10 overflow-hidden rounded-full absolute inset-[2px]"
        style={{ background: 'oklch(0.08 0.015 258)' }}
        aria-hidden="true"
      >
        <span
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, oklch(0.22 0.018 258 / 0.6), transparent 60%)',
          }}
        />
        {/* 3 — drifting dot pattern */}
        <span
          className="opacity-30 mix-blend-overlay absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(oklch(1 0 0 / 0.6) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
            animation: 'dots-move 8s linear infinite',
          }}
        />
        {/* 4 — glow under label */}
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1/2 blur-2xl rounded-full transition-colors duration-300"
          style={{ background: 'oklch(0.62 0.195 258 / 0.2)' }}
        />
      </span>

      <span className="relative z-10">{children}</span>
    </>
  );

  const baseClass =
    'group inline-flex items-center justify-center overflow-hidden uppercase transition-all duration-500 ' +
    'hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_oklch(0.62_0.195_258_/_0.6)] ' +
    'text-xs font-semibold text-[var(--color-fg)] tracking-widest rounded-full ' +
    'py-4 px-8 relative no-underline ' +
    className;

  if (href) {
    return (
      <a href={href} className={baseClass}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {content}
    </button>
  );
}

export default ConicCTA;
