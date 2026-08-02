/* ─── adr-law · who gets a room ─────────────────────────────────────────────
   ONE predicate, in a module with no side effects, because TWO generators
   need it and they must never disagree: build-adr-bodies.mjs writes the
   rooms, build-adrs.mjs writes the register rows that link them. If the
   register said `room: true` for a decision the bodies generator skipped,
   the site would ship 12 links into nothing.

   THE LAW. Everything except `proposed`. A proposal published as an indexed
   page invites citation as though it were settled, and 12 of the 71
   decisions are proposals. They keep their row in the register, with the
   status said out loud and a link to the repo.

   Accepted, superseded and rejected all get rooms: a superseded decision is
   cited BY its successor and needs an address, and a rejected one is the
   record of a road not taken, which is what a decision record is for. */

/** does this decision get a room of its own? */
export const ROOMED = (status) => status !== 'proposed'
