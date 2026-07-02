import { useEffect, useRef, useState } from 'react'

/* ─── useCopy · the ONE copy-to-clipboard affordance state ────────────────────
   Every copy surface on the site (hero install pill · GetStarted rows ·
   FinalCTA install line · CodeFile chrome) shares this hook, so the copied
   state, the reset delay (one value, no 1400-vs-1600 drift) and the unmount
   cleanup (no setState on an unmounted component when the visitor navigates
   mid-reset) can never diverge again. SSR-safe: navigator is only read inside
   the click handler. */

export const COPY_RESET_MS = 1600

export function useCopy(value: string): { copied: boolean; copy: () => void } {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // clear the pending reset on unmount — the timeout must never touch state
  // after the component is gone.
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = () => {
    navigator.clipboard?.writeText(value)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), COPY_RESET_MS)
  }
  return { copied, copy }
}
