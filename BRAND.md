# Nika brand assets

The canonical, public brand kit for [Nika](https://nika.sh) — served from this
repo at **`https://nika.sh/brand/<file>`** (auto-deployed on merge to `main`).
One butterfly-supernova mark, one path, named colors. If you're embedding Nika
anywhere (README, docs, article, integration tile), take files from here and
nowhere else.

## Suffix law

**`-dark` / `-light` = the background the asset sits on** — `nika-logo-dark.svg`
is the lockup you put ON a dark surface.

## The kit (`public/brand/`)

| File | What | Use it for |
|---|---|---|
| [`nika-mark-dark.svg`](public/brand/nika-mark-dark.svg) | bare mark · ice `#9fd0ff` | the mark on dark surfaces (identity tone) |
| [`nika-mark-light.svg`](public/brand/nika-mark-light.svg) | bare mark · ink `#04050d` | the mark on light surfaces |
| [`nika-mark-glow.svg`](public/brand/nika-mark-glow.svg) | bare mark · glow `#cfe6ff` | small sizes (≈19–24 px) and dark in-scene use |
| [`nika-glyph-16.svg`](public/brand/nika-glyph-16.svg) | 16 px stroke glyph · `currentColor` | editor file icons, dense UI rows — the full mark doesn't survive 16 px |
| [`nika-tile.svg`](public/brand/nika-tile.svg) | rounded tile `#04050d` + ice mark | favicon, app icons, marketplace tiles |
| `nika-tile-{128,256,512}.png` | rasters of the tile | store listings, avatars, social |
| [`nika-logo-dark.svg`](public/brand/nika-logo-dark.svg) | mark + `nika` wordmark + dot | logo lockup on dark |
| [`nika-logo-light.svg`](public/brand/nika-logo-light.svg) | mark + `nika` wordmark + dot | logo lockup on light |

README embed (theme-aware):

```html
<p align="center">
  <a href="https://nika.sh">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://nika.sh/brand/nika-logo-dark.svg">
      <img src="https://nika.sh/brand/nika-logo-light.svg" alt="Nika" width="220">
    </picture>
  </a>
</p>
```

## Tokens (quoted from `src/styles/tokens.css` — the live SSOT)

| Role | Values |
|---|---|
| engineered black ladder | `#050507` deep · `#08090b` base · `#101114` raised |
| cosmic register (tiles) | `#030617` theme-color · `#04050d` tile ground |
| the ONE accent | `#2f6bff` strong · `#4f86ff` accent · `#8db4ff` bright · `#2b62ea` CTA |
| verb hues (live runs only) | infer `#5b8cff` · exec `#ff7a3c` · invoke `#22d3ee` · agent `#b07bff` |
| mark tones | ice `#9fd0ff` · glow `#cfe6ff` · ink `#04050d` |
| radii | 4 px panels · 2 px chips |
| faces | Martian Grotesk (display) · Martian Mono (code) · Clash Display 500–700 |

`ice` vs `glow` is deliberate: ice is the identity tone (tiles, logos, docs);
glow wins legibility at tiny sizes and inside the dark WebGL scenes. Don't
unify them, don't invent a third blue.

## The icon system (functional icons · ontology-driven)

Beyond the identity marks, every Nika **verb, builtin, feature and run-state**
has a canonical icon, color role and effect — declared once in
[`design/icons.yaml`](design/icons.yaml) (the ontology) and projected to:

- **`nika.sh/brand/icons/<ns>-<name>.svg`** — the served catalog
  (e.g. [`verb-infer`](public/brand/icons/verb-infer.svg) ·
  [`builtin-fetch`](public/brand/icons/builtin-fetch.svg) ·
  [`feature-preflight`](public/brand/icons/feature-preflight.svg))
- **[`icons.json`](public/brand/icons.json)** — the machine-readable ontology
  (labels · semantics · hue tokens · effects · links)
- **[`icons.ttl`](public/brand/icons.ttl)** — the RDF projection
  (`https://nika.sh/ontology/design#`)

Laws: entities derive from the spec canon (builtins parity-gated); glyphs
are the **SuperNovae house icon set** (24-grid · stroke-2 · studio-owned);
site artwork covers `ui/*` + `social/*`; **verb hues render only on live-run
surfaces** — static UI keeps the text ink. Full contract:
[`design/README.md`](design/README.md).

## Rules

- Never recolor, stretch, outline, add gradients to, or redraw the mark.
- The wordmark is lowercase `nika` in Martian Mono; the dot is verb-exec
  orange `#ff7a3c` — it's part of the lockup, not punctuation to remove.
- On photos/busy surfaces use the tile, not the bare mark.
- The 4 verb hues never appear in static UI — they mean "a run is alive".

## Where copies live (kept in sync by hand)

| Consumer | Files |
|---|---|
| this site (runtime, frozen names) | `public/nika.svg` (mark-glow + size attrs) · `public/favicon.svg` (tile) · `public/icon-*.png` · `apple-touch-icon.png` |
| VS Code extension ([nika-vscode](https://github.com/supernovae-st/nika-vscode)) | `icons/nika-icon.{svg,png}` (tile) · `icons/nika-dark.svg` (mark-glow) · `icons/nika-light.svg` (mark-light) |
| Docs ([docs.nika.sh](https://docs.nika.sh)) | `images/logo-{light,dark}.svg` · `images/favicon.svg` (tile) |
| Everything else (engine · spec · SDK · tap · agents) | hotlinks `https://nika.sh/brand/` — zero local copies |
