import { useEffect, useRef, useState, type ComponentProps } from 'react';
import NumberFlow from '@number-flow/react';

type NumberFlowFormat = ComponentProps<typeof NumberFlow>['format'];

/**
 * LiveStat — a live counter that ticks from 0 to its target value when
 * scrolled into view. Uses @number-flow/react for digit-roll + tabular
 * nums + automatic reduced-motion fallback.
 *
 * Contract: lazy, one-shot. Once fired, observer disconnects.
 */

export interface LiveStatProps {
  to: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  format?: NumberFlowFormat;
  durationMs?: number;
  className?: string;
}

export function LiveStat({
  to,
  prefix,
  suffix,
  label,
  format,
  durationMs = 800,
  className = '',
}: LiveStatProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setValue(to);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.35, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [to]);

  return (
    <div ref={rootRef} className={className}>
      <div className="flex items-baseline gap-1 font-[var(--font-display)] text-4xl sm:text-5xl font-medium tracking-tight text-[var(--color-fg)]">
        {prefix && <span className="text-[var(--color-fg-mute)]">{prefix}</span>}
        <NumberFlow
          value={value}
          format={format}
          transformTiming={{ duration: durationMs, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        />
        {suffix && <span className="text-[var(--color-fg-mute)]">{suffix}</span>}
      </div>
      {label && (
        <div className="mt-2 text-xs tracking-wide uppercase text-[var(--color-fg-dim)]">
          {label}
        </div>
      )}
    </div>
  );
}

export default LiveStat;
