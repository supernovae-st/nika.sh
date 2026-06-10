import { LazyMotion, domMax } from 'motion/react';
import type { ReactNode } from 'react';

export { m, AnimatePresence } from 'motion/react';

interface MotionProviderProps {
  children: ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  return <LazyMotion features={domMax} strict>{children}</LazyMotion>;
}
