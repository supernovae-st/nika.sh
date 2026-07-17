# content/i18n · the L1 translation corpus (WO-10)

One directory per locale (`en` is the EXTRACTION TWIN — the keyed copy of the
live page, the reference every translation answers to). One yaml per L1 page.
Keys mirror the page's copy slots one-to-one; a locale file must carry exactly
the EN twin's keys (the parity gate names any drift).

Three laws, gated in `src/test/i18n-lexicon.test.ts`:

1. **Anti-slop (§4bis.4)** — a page joins a locale ONLY when its authored
   variant exists here AND passed human review. Nothing in this tree is wired
   into a route until the operator ratifies the draft; the hreflang cluster
   only ever announces what ships.
2. **The lexicon floor** — `public/i18n/untranslatables.json` (derived from
   the language graph by build-atlas) lists every name the language OWNS:
   verbs, reserved keys, `nika:` builtins, error codes, providers, templates.
   A lexicon token present in an EN value survives BYTE-VERBATIM in every
   translation of that value (a translated `after:` cannot exist).
3. **Voice (the manifesto precedent)** — hand-written in the page's own
   register, never machine word-for-word; technical terms keep their English
   form the way developer communities actually write them. Inline markup is
   markdown-lite (`` `code` `` · `**bold**` · `*italic*`); the consumption
   step maps it to the page's segment renderer.

Sourcing (§4bis.5 · dogfood): future drafts come from the Nika workflow at
`scripts/i18n/localize-page.nika.yaml` (the t3-localization-factory shape:
the lexicon rides in as fixed values, the model fills prose only), then human
review, then commit. The files in this PR are hand-authored first drafts for
the operator's review — the workflow is the scale path, not tonight's source.

Rollout per page (the install exemplar proves the rail): extract the EN twin →
draft ×7 → review → wire the page to read its locale variant → add the
`LOCALIZED` row (src/lib/i18n.ts) — hreflang, sitemap and switcher follow by
construction.
