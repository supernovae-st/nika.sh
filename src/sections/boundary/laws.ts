/* ── the written law · the boundary's rules as numbered public documents ──────
   ONE source for both surfaces that render the receipts rail (the home
   boundary beat + the /boundary reference page). Receipts, not adjectives:
   each rule of the contract system is a numbered NEP in the spec repo's
   governance/ (linked verbatim by number + its own one-line substance).
   The list is CLOSED here on purpose — it mirrors the governance index
   (nika-spec governance/README.md); a new law lands there first, then this
   rail follows. */

export const GOVERNANCE_DIR = 'https://github.com/supernovae-st/nika-spec/tree/main/governance'
const GOVERNANCE_BLOB = 'https://github.com/supernovae-st/nika-spec/blob/main/governance'

export interface BoundaryLaw {
  id: string
  href: string
  gloss: string
}

const law = (id: string, file: string, gloss: string): BoundaryLaw => ({
  id,
  href: `${GOVERNANCE_BLOB}/${file}`,
  gloss,
})

/* the seven security laws the landing rail carries (NEP-0003…0009) */
export const BOUNDARY_LAWS: BoundaryLaw[] = [
  law(
    'NEP-0003',
    'nep-0003-absent-permits-zero-authority.md',
    'an absent permits: block declares zero authority',
  ),
  law(
    'NEP-0004',
    'nep-0004-permit-parameterization-taint.md',
    'untrusted values re-gate under permits, at the effect',
  ),
  law(
    'NEP-0005',
    'nep-0005-env-permit-dimension.md',
    'a child’s environment is composed, never inherited',
  ),
  law(
    'NEP-0006',
    'nep-0006-data-as-code-sink.md',
    'a fetch of a code-bearing artifact is never innocent',
  ),
  law(
    'NEP-0007',
    'nep-0007-trace-format-and-equivalence.md',
    'the trace carries a permit witness · check and run agree',
  ),
  law(
    'NEP-0008',
    'nep-0008-egress-permit-bound.md',
    'the egress proxy is the permit’s exact projection',
  ),
  law(
    'NEP-0009',
    'nep-0009-effective-path-identity.md',
    'a path grant names a path identity, re-judged at dispatch',
  ),
]

/* the /boundary reference adds the human-gate law (the landing rail stays
   seven: the trifecta gate is a run-composition law, not a permit family) */
export const REFERENCE_LAWS: BoundaryLaw[] = [
  law(
    'NEP-0002',
    'nep-0002-lethal-trifecta-human-gate.md',
    'private data + untrusted input + egress: a human gate',
  ),
  ...BOUNDARY_LAWS,
]
