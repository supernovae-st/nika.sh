# design/ · the nika icon ontology

**`icons.yaml` is the SSOT** for the functional icon system: every verb,
builtin, feature, run-state, ui glyph and social mark — each with its glyph
resolution, color role, effects and ontological links (`parent`,
`shares_glyph_with`). `build.mjs` projects it; drift is impossible to merge
(`pnpm check` runs `build.mjs --check`).

```
design/icons.yaml            THE SOURCE (edit here)
design/svg/{ui,social}/      house artwork (ours · absorbed from Nav + the sprite)
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
- **Dual resolution** (the license lock): `lucide:` (ISC — powers everything
  public, vendored via `lucide-static`) and `central:` (Central Icon System ·
  operator-licensed · atelier/private surfaces only — its files live in the
  PRIVATE monorepo pole, never here). Swapping the public set = changing the
  resolver, zero re-wiring.

## Adding an entity

1. Add it under `entities:` in `icons.yaml` (pick the namespace: `verb/` ·
   `builtin/` · `feature/` · `state/` · `ui/` · `social/`).
2. `pnpm icons` → regenerates the four projections.
3. Use it: `<NikaIcon id="feature/preflight" />` (site) · fetch
   `nika.sh/brand/icons.json` (anyone else).
