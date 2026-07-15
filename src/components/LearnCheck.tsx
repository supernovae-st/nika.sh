import { useState } from 'react'
import type { LearnCheck as LearnCheckData } from '../content/learn'
import './learn-check.css'

/* ─── LearnCheck · the inline comprehension check (I7 · WO-11) ────────────────
   The Rust-Book quiz pattern minus the game: one question where a misread
   is likely, real buttons, and the WHY shown after any pick — the
   explanation is the teaching, not a reward. No streaks, no points, no
   confetti (the anti-slop law). A5: the verdict lands in ONE polite
   status region; the buttons stay ordinary buttons (44px targets · the
   picked one carries aria-pressed). Static-safe: zero JS = the question
   reads as prose with its options — nothing breaks. */

export function LearnCheck({ check }: { check: LearnCheckData }) {
  const [picked, setPicked] = useState<number | null>(null)
  const settled = picked !== null
  const right = picked === check.answer

  return (
    <div className="lck" data-settled={settled}>
      <p className="lck-q">{check.q}</p>
      <div className="lck-opts" role="group" aria-label="Pick an answer">
        {check.options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            className="lck-opt"
            aria-pressed={picked === i}
            data-verdict={settled ? (i === check.answer ? 'right' : picked === i ? 'wrong' : 'dim') : undefined}
            onClick={() => setPicked(i)}
          >
            {opt}
          </button>
        ))}
      </div>
      <p className="lck-why" role="status">
        {settled ? (
          <>
            <span className="lck-verdict" data-right={right}>
              {right ? '✓' : '·'}
            </span>{' '}
            {check.why}
          </>
        ) : null}
      </p>
    </div>
  )
}
