import { motion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

/**
 * Reveal — generic scroll-in animation wrapper.
 *
 * Subtle opacity + slight blur lift. Respects PRINCIPLES:
 * - 300ms duration only
 * - cubic-bezier(0.16, 1, 0.3, 1) — slow ease-out
 * - No bounce, no overshoot
 * - Filter blur small enough to feel intentional, not slop
 */
export default function Reveal({
  children,
  delay = 0,
  className,
  direction = 'up',
}: Props) {
  const offset = 24;
  const initial: Record<string, number> = { opacity: 0, filter: 8 };
  const animate: Record<string, number> = { opacity: 1, filter: 0 };

  if (direction === 'up') {
    initial.y = offset;
    animate.y = 0;
  } else if (direction === 'down') {
    initial.y = -offset;
    animate.y = 0;
  } else if (direction === 'left') {
    initial.x = offset;
    animate.x = 0;
  } else if (direction === 'right') {
    initial.x = -offset;
    animate.x = 0;
  }

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: initial.y ?? 0,
      x: initial.x ?? 0,
      filter: `blur(${initial.filter}px)`,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
