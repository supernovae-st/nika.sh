import { useEffect, useMemo, useRef, useState } from 'react';
import { createNoise3D } from 'simplex-noise';

// Module-level noise instance — fixed seed, same every SSR + client render.
const _noise = createNoise3D(() => 0.42);

interface SplitRevealProps {
  text: string;
  className?: string;
  /** Trigger only on first intersection, not on re-entry (default: true) */
  once?: boolean;
  /** Maximum stagger delay in seconds across all characters (default: 0.5) */
  maxDelay?: number;
}

/**
 * SplitReveal — per-character entrance with simplex-noise stagger delays.
 *
 * Unlike a linear stagger (chars appear L→R), delay values are sampled from
 * a 1D slice of a 3D simplex field, giving an organic "type-on" wave where
 * characters arrive in a non-predictable but visually coherent order.
 *
 * Accessibility: the root element carries aria-label={text} so screen readers
 * read the full string. Individual <span> characters are aria-hidden.
 *
 * Guardrails:
 * - prefers-reduced-motion: immediately shows all chars, no transition
 * - IntersectionObserver gates the reveal
 * - Delays computed once per [text, maxDelay] pair via useMemo
 */
export function SplitReveal({
  text,
  className = '',
  once = true,
  maxDelay = 0.5,
}: SplitRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  const chars = useMemo(() => text.split(''), [text]);

  // Sample delay for each char from a noise field — NOT linear order.
  const delays = useMemo(() => {
    const n = chars.length;
    return chars.map((_, i) => {
      const nx = (i / Math.max(n - 1, 1) - 0.5) * 3;
      const v = (_noise(nx, 0.15, 0) + 1) / 2; // [0, 1]
      return parseFloat((v * maxDelay).toFixed(3));
    });
  }, [chars, maxDelay]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    // Honour OS motion preference — skip animation entirely
    if (
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setRevealed(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          if (once) io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [once]);

  return (
    <span ref={rootRef} className={className} aria-label={text}>
      {chars.map((char, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`split-char${revealed ? ' revealed' : ''}`}
          style={{ '--delay': `${delays[i]}s` } as React.CSSProperties}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

export default SplitReveal;
