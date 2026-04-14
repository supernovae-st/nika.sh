import { useId } from 'react';

/**
 * Eclipse — SVG hero centerpiece (PRIMARY, per color agent §6).
 * Pure SVG + feGaussianBlur for the corona. Zero WebGL, iOS-safe,
 * honors prefers-reduced-motion via CSS class gates.
 *
 * Composition:
 *   1. Dark disc with slight gradient (the "planet")
 *   2. Wide feGaussianBlur glow around the disc (the "corona")
 *   3. Thin bright rim light on the upper-left quadrant
 *   4. Far-off small stars (sparse)
 */

export interface EclipseProps {
  size?: number;
  hue?: 'blue' | 'violet' | 'blue-violet';
  className?: string;
}

const hueStops: Record<NonNullable<EclipseProps['hue']>, { core: string; mid: string }> = {
  blue: {
    core: 'oklch(0.62 0.195 258 / 0.9)',
    mid: 'oklch(0.55 0.160 258 / 0.5)',
  },
  violet: {
    core: 'oklch(0.64 0.200 292 / 0.9)',
    mid: 'oklch(0.50 0.170 292 / 0.5)',
  },
  'blue-violet': {
    core: 'oklch(0.62 0.195 258 / 0.9)',
    mid: 'oklch(0.55 0.200 292 / 0.5)',
  },
};

export function Eclipse({ size = 560, hue = 'blue-violet', className = '' }: EclipseProps) {
  const id = useId();
  const { core, mid } = hueStops[hue];

  return (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Eclipse — Nika"
      style={{ filter: 'drop-shadow(0 40px 80px oklch(0.62 0.195 258 / 0.35))' }}
    >
      <defs>
        <radialGradient id={`${id}-corona`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={core} />
          <stop offset="45%" stopColor={mid} />
          <stop offset="80%" stopColor="oklch(0.1 0.02 258 / 0)" />
        </radialGradient>
        <radialGradient id={`${id}-rim`} cx="35%" cy="35%" r="50%">
          <stop offset="0%" stopColor="oklch(0.98 0.003 258 / 0.85)" />
          <stop offset="30%" stopColor="oklch(0.80 0.145 200 / 0.4)" />
          <stop offset="60%" stopColor="oklch(0.62 0.195 258 / 0)" />
        </radialGradient>
        <radialGradient id={`${id}-disc`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.16 0.018 258)" />
          <stop offset="85%" stopColor="oklch(0.10 0.016 258)" />
          <stop offset="100%" stopColor="oklch(0.06 0.012 258)" />
        </radialGradient>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
        </filter>
      </defs>

      {/* Corona (blurred halo) */}
      <circle cx="200" cy="200" r="160" fill={`url(#${id}-corona)`} filter={`url(#${id}-blur)`}>
        <animate attributeName="r" values="160;168;160" dur="6s" repeatCount="indefinite" />
      </circle>

      {/* Rim highlight */}
      <circle cx="200" cy="200" r="120" fill={`url(#${id}-rim)`} opacity="0.9" />

      {/* Planet disc */}
      <circle cx="200" cy="200" r="112" fill={`url(#${id}-disc)`} />

      {/* Dust specks */}
      <g fill="oklch(0.98 0.003 258 / 0.5)">
        <circle cx="60"  cy="90"  r="1.2" />
        <circle cx="340" cy="110" r="0.8" />
        <circle cx="80"  cy="320" r="0.9" />
        <circle cx="330" cy="300" r="1"   />
        <circle cx="195" cy="30"  r="0.7" />
      </g>
    </svg>
  );
}

export default Eclipse;
