/* ─── PENDING_ERROR_CODES · minted in the spec canon, awaiting the resync pin ──
   The canon mints a code the day it lands; public/errors/catalog.json only
   projects it after the spec-resync pin advances PAST the mint commit — but
   the engine stamps docs_url: https://nika.sh/errors/<CODE> on findings
   TODAY, and an un-prerendered deep link 404s in prod (DO's error_document
   beats the catchall). List such a code here the day the canon mints it and
   its room prerenders immediately (the register renders the honest-miss
   treatment until the content lands); DELETE the entry the day the pin
   lands it — the errors drift gate (src/test/errors.test.ts) judges the
   overlap, so a stale entry fails the suite. NEVER type a code the canon
   has not minted.

   A LEAF module on purpose, imported by site.config.ts (the ERROR_PATHS
   derivation), src/content/sitemap.ts (the map), and the lens discovery
   (scripts/lens-semantics-lib.mjs). Keeping the literal in site.config.ts
   proper drags the whole path-array module into the initial chunk through
   the map's eager import — the three-leak budget (scripts/size-budget.mjs)
   caught exactly that on 2026-07-19. One authored list, three readers. */
export const PENDING_ERROR_CODES: string[] = [
  // EMPTY, and that is the healthy state. NIKA-SEC-009 lived here from its
  // mint (spec ab351b1 · NEP-0002 · 2026-07-19) until the resync pin advanced
  // past it on 2026-07-27; the catalog now projects it, so the entry was
  // deleted per the law above. The next mint re-opens the list.
]
