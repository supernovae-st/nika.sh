import { useEffect, useState } from 'react';
import { m, AnimatePresence, MotionProvider } from '~/lib/motion';
import type { ReactNode } from 'react';

/**
 * Terminal — Magic UI terminal, re-implemented to use `m` from
 * ~/lib/motion (LazyMotion) and plain <a> tags (no next/link).
 *
 * Children are <TypingAnimation> and <AnimatedSpan> blocks that appear
 * with a staggered delay, one after another. This is the island that
 * the homepage terminal demo (Phase 2) will render.
 */

export interface TerminalProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Terminal({ children, title = 'nika @ chrysalis', className = '' }: TerminalProps) {
  return (
    <MotionProvider>
      <div
        className={`terminal max-w-2xl mx-auto w-full ${className}`}
        role="group"
        aria-label="Terminal demo"
      >
        <div className="terminal-bar">
          <span className="terminal-dot red"   aria-hidden="true"></span>
          <span className="terminal-dot yellow" aria-hidden="true"></span>
          <span className="terminal-dot green"  aria-hidden="true"></span>
          <span className="terminal-title">{title}</span>
        </div>
        <div className="terminal-body">
          {children}
        </div>
      </div>
    </MotionProvider>
  );
}

export interface AnimatedSpanProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedSpan({ children, delay = 0, className = '' }: AnimatedSpanProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </m.div>
  );
}

export interface TypingAnimationProps {
  children: string;
  delay?: number;
  duration?: number;
  className?: string;
  as?: 'div' | 'span' | 'p';
}

export function TypingAnimation({
  children,
  delay = 0,
  duration = 30,
  className = '',
  as: Tag = 'div',
}: TypingAnimationProps) {
  const [shown, setShown] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setStarted(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = window.setInterval(() => {
      i += 1;
      setShown(children.slice(0, i));
      if (i >= children.length) {
        window.clearInterval(interval);
      }
    }, duration);
    return () => window.clearInterval(interval);
  }, [started, children, duration]);

  const MotionTag = Tag === 'span' ? m.span : Tag === 'p' ? m.p : m.div;

  return (
    <AnimatePresence>
      {started && (
        <MotionTag
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12 }}
          className={className}
        >
          {shown}
        </MotionTag>
      )}
    </AnimatePresence>
  );
}

export default Terminal;
