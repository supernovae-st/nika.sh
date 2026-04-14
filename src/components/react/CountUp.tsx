import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { animate, useMotionValue } from 'motion/react';

interface Props {
  /** Final value to count up to */
  to: number;
  /** Animation duration in seconds (default 2) */
  duration?: number;
  /** Format with thousands separator (default true) */
  format?: boolean;
  /** Suffix appended to value (e.g. "/40") */
  suffix?: string;
  className?: string;
}

/**
 * CountUp — animated number that counts from 0 → `to` when scrolled into view.
 * Uses Motion.dev spring + Intl.NumberFormat. Triggers once per mount.
 *
 * Used on the chrysalis vital-signs section of the homepage:
 *   <CountUp to={10434} />  →  "10,434"
 *   <CountUp to={5} suffix="/40" />  →  "5/40"
 */
export default function CountUp({
  to,
  duration = 2,
  format = true,
  suffix = '',
  className,
}: Props) {
  const [display, setDisplay] = useState(0);
  const value = useMotionValue(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, {
      duration,
      ease: [0.16, 1, 0.3, 1], // matches --nika-ease-zoom
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, to, duration, value]);

  const formatted = format ? new Intl.NumberFormat('en-US').format(display) : String(display);

  return (
    <span ref={ref} className={className}>
      {formatted}
      {suffix && <span className="text-[var(--color-dim-star)]">{suffix}</span>}
    </span>
  );
}
