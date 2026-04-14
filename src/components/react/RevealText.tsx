import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';

interface WordProps {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}

function Word({ children, progress, range }: WordProps) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <span className="relative mr-1.5 inline-block">
      <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  );
}

interface RevealTextProps {
  text: string;
  className?: string;
}

/**
 * RevealText — scroll-driven word-by-word fade reveal.
 *
 * Inspired by MagicText (21st.dev). Each word fades from 15% → 100% opacity
 * as the container scrolls through the viewport. Subtle, not flashy.
 *
 * Use for manifesto paragraphs and ceremonial copy. Not for body text.
 */
export default function RevealText({ text, className }: RevealTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.85', 'start 0.25'],
  });

  const words = text.split(' ');

  return (
    <p ref={containerRef} className={className}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        );
      })}
    </p>
  );
}
