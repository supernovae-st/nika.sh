# design/ · the nika icon ontology

**`icons.yaml` is the SSOT** for the functional icon system: every verb,
builtin, feature, run-state, ui glyph, social mark and motion pattern —
each with its glyph (or `pattern:` for `anim/*`), color role, effects and
ontological links (`parent`, `shares_glyph_with`).
`build.mjs` projects it; drift is impossible to merge (`pnpm check` runs
`build.mjs --check`).

```
design/icons.yaml            THE SOURCE (edit here)
design/svg/supernovae/       the SuperNovae house icon set (vendored, mapped glyphs)
design/svg/{ui,social}/      site artwork (the Nav 16px family + footer marks)
        │  node design/build.mjs   (pnpm icons)
        ▼
public/brand/icons/*.svg     the served catalog → nika.sh/brand/icons/<ns>-<name>.svg
public/brand/icons.json      the machine-readable ontology (anyone can consume)
public/brand/icons.ttl       the RDF projection (namespace nika.sh/ontology/design#)
src/icons/manifest.ts        the site's typed manifest (NikaIcon reads it)
```

## The laws

- **Entities derive from canon, never invented** — builtins must equal
  `src/canon.generated.ts#builtinNames` (structural check), verbs are the
  locked 4. New builtin in the spec → the check fails until it gets an icon.
- **Ink law** (BRAND.md): static UI renders icons in the text ink
  (`currentColor`); verb hues speak ONLY on live-run surfaces (`<NikaIcon live>`).
  Hue hexes are drift-checked against `src/styles/tokens.css`.
- **One set, ours** — glyphs come from the SuperNovae house icon set
  (24-grid · stroke-2 · currentColor · operator-owned; the private master
  lives in the studio identity pole). Site-drawn artwork (`ui/` · `social/`)
  covers the Nav family and footer marks. Glyph modes: `stroke` (root-inked),
  `fill` (solid), `auto` (self-contained bodies — each path carries its own
  stroke/fill).

## Adding an entity

1. Add it under `entities:` in `icons.yaml` (pick the namespace: `verb/` ·
   `builtin/` · `feature/` · `state/` · `ui/` · `social/` · `anim/`), point
   `supernovae:` at a `<category>/<name>` glyph vendored under
   `design/svg/supernovae/` — or, for `anim/*`, a `pattern:` from
   `src/fx/dotmatrix/patterns.ts`.
2. `pnpm icons` → regenerates the four projections.
3. Use it: `<NikaIcon id="feature/preflight" />` (site) · fetch
   `nika.sh/brand/icons.json` (anyone else).
