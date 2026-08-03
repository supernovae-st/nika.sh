/* ─── the family OG map · one card per register, rooms inherit it ────────────
   A room without a card fell back to the HOME card with the home alt — a
   mismatch a share preview shows to strangers. The map keys are the FULL
   family paths (families moved inside their worlds 2026-08-02; the old
   bare keys made every lookup miss and shipped 149 home-card rooms —
   the half-cascaded-rename class).

   Gate: src/test/family-og.test.ts holds key-parity with
   MEMBER_ROOM_FAMILIES and the on-disk existence of every named card.
   Per-room cards were weighed and refused (2026-08-04 arbitrage): ~700
   near-duplicate PNGs ≈ 53 MB + a Chrome bake in the release ceremony,
   for a version string on an image — the family message IS the share
   message. */

export const FAMILY_OG: Record<string, { img: string; alt: string }> = {
  'language/namespaces': { img: 'og-language', alt: 'The Nika language register: every schema-declared word, one page.' },
  'language/types': { img: 'og-language', alt: 'The Nika language register: every schema-declared word, one page.' },
  'language/edges': { img: 'og-flow', alt: 'How execution flows: two doors, one graph. The DAG falls out.' },
  'language/predicates': { img: 'og-flow', alt: 'How execution flows: two doors, one graph. The DAG falls out.' },
  'language/families': { img: 'og-tools', alt: 'The Nika standard library: versioned capability, no plugin store.' },
  'language/modes': { img: 'og-tools', alt: 'The Nika standard library: versioned capability, no plugin store.' },
  'language/permits': { img: 'og-boundary', alt: 'The boundary is declared: permits, secrets, the always-on floor.' },
  'language/secrets': { img: 'og-boundary', alt: 'The boundary is declared: permits, secrets, the always-on floor.' },
  'language/conformance': { img: 'og-proof', alt: 'Nothing on faith: conformance, the oracle, hash-chained traces.' },
  'language/error-namespaces': { img: 'og-errors', alt: 'The Nika error register: every refusal has a name, a category and a fix shape.' },
  'language/error-categories': { img: 'og-errors', alt: 'The Nika error register: every refusal has a name, a category and a fix shape.' },
  'how/oracle': { img: 'og-proof', alt: 'Nothing on faith: conformance, the oracle, hash-chained traces.' },
  truth: { img: 'og-sources', alt: 'How this site tells the truth: pinned sources, two clocks, verify it yourself.' },
  'catalog/providers': { img: 'og-providers', alt: 'Nika providers. Local first, bring your own keys, no lock-in.' },
}
