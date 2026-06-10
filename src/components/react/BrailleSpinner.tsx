import { useEffect, useRef } from 'react';

/**
 * BrailleSpinner — a one-character live status indicator that cycles
 * through braille-arc frames at 10fps. Replaces the glass-pill pulsing
 * dot. Reads as "terminal-native" — this is how Nika's own TUI spins.
 *
 * Pairs with a text label. No box, no border — the glyph IS the badge.
 *
 *   <BrailleSpinner /> nika grew → v0.53 chrysalis
 */

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export interface BrailleSpinnerProps {
  intervalMs?: number;
  className?: string;
  color?: string;
}

export function BrailleSpinner({
  intervalMs = 90,
  className = '',
  color = 'var(--color-brand)',
}: BrailleSpinnerProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.textContent = FRAMES[0];
      return;
    }

    let i = 0;
    let timerId: number | undefined;
    let visible = true;

    const onVisibility = () => {
      visible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibility);

    const tick = () => {
      if (visible && el) el.textContent = FRAMES[i % FRAMES.length];
      i += 1;
      timerId = window.setTimeout(tick, intervalMs);
    };
    tick();

    return () => {
      if (timerId !== undefined) window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs]);

  return (
    <span
      ref={ref}
      className={`inline-block font-[var(--font-mono)] leading-none ${className}`}
      style={{ color, textShadow: `0 0 6px ${color}`, fontVariantLigatures: 'none' }}
      aria-hidden="true"
    >
      {FRAMES[0]}
    </span>
  );
}

export default BrailleSpinner;
