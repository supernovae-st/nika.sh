/* ─── providers-shared · the register's small shared vocabulary ───────────────
   The errors-shared split, applied to the providers family: /providers (the
   register) and /providers/:id (the room) rendered the SAME numbers through
   two byte-identical private copies of fmtTokens. They agreed today, which
   is precisely how the other second-producers in this codebase started —
   the clock-register list and the 3D capability gate were both identical
   copies until one of them grew a clause and the two surfaces began
   disagreeing in public. A context window printed « 128k » in the register
   and « 128000 » in the room is the same class of bug, one edit away.

   A page module must export only its Component (react-refresh law), so the
   shared vocabulary lives here. */

/** a context window / max-output figure, register-style: 128000 → « 128k » */
export function fmtTokens(n?: number): string | undefined {
  if (typeof n !== 'number') {
    return undefined
  }
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)
}
