---
brand: nika
descriptor: "Retro-futurist cyberpunk terminal. Dither ASCII blue, amber, lichen green on near-black. Monospace-heavy, annotation-dense, pirate voice."
category: Developer Tools
subcategory: AI / Workflow Engines
license: AGPL-3.0-or-later
version: 0.1.0
last_updated: 2026-04-14
canonical_url: https://nika.sh/design.md
repo: https://github.com/supernovae-st/nika-design-skill
fonts:
  display: Basteleur Bold (Velvetyne, OFL)
  mono: Departure Mono (Helena Zhang, custom free-commercial)
  body: Recursive Sans Linear (Arrow Type, OFL)
  ascii_frame: JGS Font (Velvetyne, OFL)
colors:
  background: "#05070A"
  primary: "#3BE8FF"
  amber: "#FFB000"
  lichen: "#7DAA6E"
  text: "#E8ECEE"
mode: dark-only
mascot: butterfly
voice: pirate-technical
---

# Nika Design — the system

> The design language of [nika.sh](https://nika.sh) — the AGPL workflow engine
> by [SuperNovae Studio](https://supernovae.studio).
> Read by humans. Consumed by AI agents.

This document is the single source of truth. If anything else (SKILL.md, PRINCIPLES.md, tokens/*.css) contradicts this, DESIGN.md wins for *philosophy*, PRINCIPLES.md wins for *enforcement*.

---

## 1. Identity

Nika is a workflow engine for AI. No chat UI, no SaaS dashboard — a YAML-driven semantic engine that runs on a laptop, works in CI, and outputs auditable artifacts. AGPL, no VC, built by a solo pirate, maintained in the open.

The visual identity mirrors the product: **administrative cyberpunk**. Not "cyberpunk futuristic" in the Netflix 2015 sense. Cyberpunk in the *Ghost in the Shell 1995* sense — a municipal office at night, a diagnostic terminal, a server room humming, an instrument panel with more labels than buttons. Restrained, monospace-heavy, labeled, boring on first glance, coherent on second.

The references are specific: **Ghost in the Shell (1995), Akira (1988), Neon Genesis Evangelion (1995–2021), Daft Punk**. These worlds share a lesson: **restraint is the entire aesthetic**. Eva uses five colors. Daft Punk uses five camera frames. Akira uses one red. GITS uses one rain. Nika inherits that discipline.

What Nika is **not**:

- Not Vercel-sleek (too corporate, too neutral).
- Not Linear-quiet (we borrow the quiet but add terminal grit).
- Not Netflix-cyberpunk (no neon pink/cyan gradients, no glitch-everywhere).
- Not indie-SaaS (no Cal Sans hero, no gradient mesh backgrounds, no bento grids with 3D hover tilt).

What Nika **is**: a pirate broadcasting station. Dark. Labeled. Textured. Occasionally funny. Never loud for its own sake.

## 2. Palette

Dark-only for v0.9x. No light mode. See PRINCIPLES.md §1.

### 2.1 Surfaces

| Token              | OKLCH                | Hex        | Use |
|---                 |---                   |---         |---  |
| `--nika-abyss`     | `oklch(0.14 0.007 240)` | `#05070A` | page background (near-black, blue-tinted) |
| `--nika-panel`     | `oklch(0.17 0.008 240)` | `#0E1014` | card surface |
| `--nika-raised`    | `oklch(0.20 0.010 240)` | `#14171D` | raised panel (hero lockup, modal) |
| `--nika-sunken`    | `oklch(0.12 0.006 240)` | `#040609` | inset (terminal blocks) |

### 2.2 Borders

| Token                   | OKLCH                 | Hex       |
|---                      |---                    |---        |
| `--nika-border`         | `oklch(0.26 0.010 240)` | `#1E232B` |
| `--nika-border-bright`  | `oklch(0.32 0.012 240)` | `#2C333E` |

1px borders only. No shadows.

### 2.3 Text

| Token             | OKLCH                   | Hex       | Use |
|---                |---                      |---        |---  |
| `--nika-text`     | `oklch(0.93 0.004 240)` | `#E8ECEE` | body |
| `--nika-text-mute`| `oklch(0.66 0.010 240)` | `#8B949E` | captions, labels |
| `--nika-text-dim` | `oklch(0.44 0.010 240)` | `#4A5462` | footers, deep meta |
| `--nika-text-ghost`| `oklch(0.30 0.008 240)`| `#2A3138` | nearly invisible annotations |

### 2.4 Accents — one hot per screen

Exactly one at full saturation per screen. The other two appear only as de-saturated outlines (≤30% opacity) or not at all. See PRINCIPLES.md §6.

| Token           | OKLCH                   | Hex       | Semantic |
|---              |---                      |---        |---       |
| `--nika-cyan`   | `oklch(0.89 0.16 220)`  | `#3BE8FF` | primary, links, active, diagnostic |
| `--nika-amber`  | `oklch(0.80 0.17 75)`   | `#FFB000` | warnings, NIKA-XXX codes, CTAs |
| `--nika-lichen` | `oklch(0.67 0.10 135)`  | `#7DAA6E` | success, organic textures, "alive" |
| `--nika-crimson`| `oklch(0.60 0.21 25)`   | `#E63946` | errors only (A.T. Field / 5xx) |

### 2.5 Texture sources

| Token              | Hex       | Use |
|---                 |---        |---  |
| `--nika-dither-blue` | `#2A3848` | base of Atkinson-dithered photographs |

Photographs for hero / section backgrounds are **always** dithered to this 4-color palette `{abyss, cyan, amber, lichen}` via Atkinson error diffusion, build-time (sharp + dither script). Never raw JPG.

## 3. Typography

**Triad A, all free-license, self-hosted, no CDN.** See `tokens/typography.css` for tokens, `references/licenses.md` for license verification.

### 3.1 Font stack

| Role      | Font                     | License        | Scope |
|---        |---                       |---             |---    |
| Display   | **Basteleur Bold**       | OFL-1.1        | hero/H1 ≥ 32px. Never body, never numbers. |
| Mono      | **Departure Mono**       | custom free-commercial | workhorse. Code, terminal, annotations, data, numerics. 11–18px. |
| Body      | **Recursive Sans Linear**| OFL-1.1        | long-form reading > 200 chars. 13–24px. Variable axes locked `MONO=0, CASL=0, CRSV=0`. |
| ASCII     | **JGS Font**             | OFL-1.1        | box-drawing and ASCII art blocks only. Conditional-load. |

**Banned**: Inter, Geist, Geist Mono, Space Grotesk, Space Mono, Orbitron, Eurostile, Bank Gothic, Press Start 2P, JetBrains Mono (as sole mono), Cal Sans, Plus Jakarta, Manrope, DM Sans, Satoshi.

**Aspirational (v0.2 paid upgrade)**: Berkeley Mono — already listed in `--nika-font-mono` stack as a pre-token. Swap `@font-face` source only, zero page-level changes.

### 3.2 Scale (fluid, `clamp()`-based)

| Token                      | Min / Max   | Use |
|---                         |---          |---  |
| `--nika-size-label`        | 10–11px     | annotations, metadata strips |
| `--nika-size-caption`      | 12–13px     | image captions, meta |
| `--nika-size-body-sm`      | 13–14px     | dense body |
| `--nika-size-body`         | 15–16px     | default body |
| `--nika-size-lead`         | 17–19px     | lede paragraph |
| `--nika-size-subhead`      | 20–24px     | section intro |
| `--nika-size-heading`      | 26–36px     | H2 |
| `--nika-size-display-sm`   | 32–48px     | H1 body-adjacent |
| `--nika-size-display-md`   | 44–72px     | mid hero |
| `--nika-size-display-lg`   | 56–96px     | hero |
| `--nika-size-display-xl`   | 72–128px    | ceremonial hero, 404 |

### 3.3 Tracking & leading

| Token                     | Value    |
|---                        |---       |
| `--nika-track-label`      | `0.08em` (ALL CAPS labels) |
| `--nika-track-caption`    | `0.04em` |
| `--nika-track-body`       | `0`      |
| `--nika-track-display`    | `-0.03em`|
| `--nika-track-wide`       | `0.12em` (rare, ceremonial) |
| `--nika-lead-tight`       | `0.85`   (display) |
| `--nika-lead-snug`        | `1`      (labels, terminal) |
| `--nika-lead-base`        | `1.5`    (body) |
| `--nika-lead-relaxed`     | `1.65`   (long-form) |

### 3.4 OpenType features — always on

- Mono: `tnum` (tabular), `zero` (slashed zero), `ss01`
- Display: `ss01`, `ss02`, `liga`, `dlig`
- Body: `kern`, `liga`, `calt`

## 4. Spacing

8px base. Annotation gutters are first-class citizens.

| Token                      | Value         |
|---                         |---            |
| `--nika-space-1..16`       | 8px × N       |
| `--nika-space-hero-air`    | `clamp(12rem, 30vh, 24rem)` — ceremonial hero |
| `--nika-space-section-gap` | `clamp(4rem, 8vh, 8rem)` |
| `--nika-gutter-annotation` | `clamp(3rem, 6vw, 4.5rem)` — margin column for labels |

**Border radii**: `0`, `2px`, `4px`, `6px`. **Never above 6px.** No pill shapes, no blob cards.

## 5. Motion

Two curves. Two speed categories. No third.

- `--nika-ease-zoom: cubic-bezier(0.16, 1, 0.3, 1)` — slow ease-out, reveals, section transitions.
- `--nika-ease-cut: cubic-bezier(0.4, 0, 0.2, 1)` — crisp, state changes.

Durations: `0ms` (instant), `80ms`, `150ms`, `300ms`, `600ms`, `22s` (Ken Burns hero zoom).

**Banned**: spring, bounce, elastic, overshoot. `cubic-bezier(0.68, -0.55, 0.27, 1.55)` is forbidden. Parallax > 0.4 multiplier is forbidden. Scroll-hijack past 3vh is forbidden.

**Respect**: `prefers-reduced-motion: reduce` kills all transitions.

## 6. Components — specs

Iteratively populated. v0.1 ships specs; HTML examples land in v0.2.

### 6.1 Hero

**Layout**: asymmetric or ceremonial. Asymmetric = large-left display + small-right annotation column. Ceremonial (Daft Punk RAM) = single centered mark + 60vh+ air + one mono subtitle + zero CTA above-fold.

**Required**:
- Display H1 in Basteleur Bold ≥ 56px
- Mono subtitle in Departure Mono ≤ 16px
- Metadata strip with version stamp, build hash, timestamp
- Exactly one dithered texture (lichen, nebula, or wing-scale) — build-time PNG or runtime SVG

**Banned**: centered feature-grid cards, gradient mesh backgrounds, floating 3D hover tilts.

### 6.2 Changelog spine

**Pattern**: Linear-style vertical rail, left-side. Release cards right-side. Each card has:

- Date in mono ALL CAPS label top
- Version in display 32–48px
- Category pills (mono labels in accent outline): `[VERB] [PROVIDER] [CLI] [DOCS]`
- Butterfly wingtip marker only on major releases (v0.90, v0.95, v0.100)
- Dithered banner (generated build-time from commit-message prompt) — one per release

### 6.3 Terminal block

**Frame**: box-drawing characters (JGS Font) forming the border.

```
┌─ nika run workflow.nika.yaml ──────────────────┐
│ ● exec   build        OK    T+00:00:02         │
│ ● infer  summarize    OK    T+00:00:14         │
│ ◦ fetch  gh/issues    …     T+00:00:18         │
│ ▲ agent  triage       WARN  budget 82% of max  │
└────────────────────────────────────────────────┘
```

Prompt prefix always present. Output streamed via typewriter (GSAP SplitText, 25ms stagger). Amber prompt, cyan/lichen output, crimson errors. Cursor: solid `▊` block, 500ms blink.

### 6.4 Error page

**Treatment**: A.T. Field red-on-black. Amber NIKA-XXX code. Monospace stack trace. Exactly one butterfly, pinned (error state = butterfly trapped). Bilingual warning optional (`WARNING / 警告`) — only if the Japanese translation is real, not decorative.

### 6.5 404

**Treatment**: ASCII butterfly (rendered via `chafa --symbols=braille` at build time) + typewritten captain's log:

```
> Last seen: 2026-04-14 14:22:03Z
> Signal lost. Wings indexed, soul unindexed.
> ◀ return to root
```

Lichen green body text, amber return link. No spinner, no cartoon 404.

### 6.6 Nav

Top bar, full-width. Brand butterfly left, primary links center-left (mono labels, ALL CAPS, 10px tracking 0.08em), version stamp right-aligned (`nika v0.90.0-alpha.3 // #4ad16c22c`).

### 6.7 Footer

Mono strip: `AGPL-3.0-or-later · SuperNovae Studio · Paris · 2026 · §<section> · LAST BUILD <date>`.

## 7. Textures & mascot

### 7.1 Dithered textures

Minimum one per page. Lichen, nebula, wing-scale, or blue-dither noise. Pipeline:

- **Build-time** (preferred): `sharp` + Atkinson diffusion + locked 4-palette → PNG (~30KB lossless).
- **Runtime** (if interactive): R3F custom `DitherEffect` with Bayer 8×8 matrix, feed into postprocessing chain.

Never photographic. Never JPG.

### 7.2 Butterfly mascot

One per page, maximum. Illustration (not emoji), custom, restrained. Placements:

- Nav brand lockup
- 404 (escaping the frame)
- Error state (pinned — "something is wrong")
- Changelog wingtip marker (major releases only)
- Loading state (AsciiMorph, one-time per session)

**Forbidden**: emoji 🦋 in UI, 3D cartoon butterfly, mascot-spray.

## 8. Voice

Pirate, technical, unmarketed, AGPL-proud, occasionally funny, never try-hard. The pirate lives in the paragraphs, not the visuals.

**Good examples**:

- "Workflows, not chat. AGPL. Runs on your laptop."
- "NIKA-042: the pirate lost the map. Check `nika keys doctor`."
- "Built by a solo pirate. Maintained in the open."
- "Not a SaaS. Not a wrapper. Not a framework. A workflow engine."
- "If it breaks, fix it. If you can't, open an issue. We read them."

**Banned**:

- ❌ "Supercharge your AI agents with cutting-edge workflows!"
- ❌ "Ahoy matey, plunder yer LLMs!"
- ❌ "The future of AI orchestration is here."
- ❌ "10x your developer productivity."
- ❌ Any use of "AI-powered," "revolutionary," "cutting-edge," "unleash," "disrupt."

**Tone tests** (apply before shipping copy):

1. Would a 1995 Japanese public broadcaster put this on their intranet? If no, rewrite.
2. Would Kaneda say it? (i.e., direct, slightly grumpy, pragmatic.) If no, rewrite.
3. Does it sell or does it describe? We describe.

## 9. Anti-patterns (short form — full list in `references/forbidden.md`)

- No light mode
- No gradient hero backgrounds
- No bento grids with 3D hover tilts
- No centered-everything SaaS layouts
- No Matrix rain, no full-body CRT, no phosphor-everything
- No glitch-on-everything (one surface max)
- No Inter / Geist / Orbitron / Cal Sans / Space Grotesk
- No emoji in UI chrome
- No pirate cosplay (skulls, parrots, "Ahoy")
- No faked Japanese (no decorative kanji authors can't read)
- No bounce/spring/elastic easing
- No fluid cursor trails (paveldogreat overused)
- No auto-typing every h1
- No gradient text (`background-clip: text` + animated hue)
- No AI-slop "neural network" graphics on an AI product

## 10. Implementation

### Install the design skill

```bash
git clone https://github.com/supernovae-st/nika-design-skill.git
cp -r nika-design-skill/nika-design ~/.claude/skills/
```

### Import tokens

```html
<link rel="stylesheet" href="/nika-design/tokens/colors.css" />
<link rel="stylesheet" href="/nika-design/tokens/typography.css" />
<link rel="stylesheet" href="/nika-design/tokens/spacing.css" />
<link rel="stylesheet" href="/nika-design/tokens/motion.css" />
```

Or bundle all four into one `tokens.css`:

```css
@import url("./colors.css");
@import url("./typography.css");
@import url("./spacing.css");
@import url("./motion.css");
```

### Consume from Claude

Say *"nika style"* or `/nika-design` in Claude Code. The skill will NOT auto-trigger on generic UI. See `SKILL.md` §1.

### Host fonts

WOFF2 files must be placed at `/fonts/<filename>.woff2` in the consuming project. Download from:

- Basteleur: https://velvetyne.fr/fonts/basteleur/
- Departure Mono: https://departuremono.com/
- Recursive: https://github.com/arrowtype/recursive
- JGS Font: https://velvetyne.fr/fonts/jgs-font/

Self-host. No CDN (GDPR + reliability + brand control).

### Deploy target

Dark-only, Lighthouse 90+ mobile, Core Web Vitals green, no JS-blocking render path for the hero. The site should feel like a terminal that happens to be on the web — not a web-app with a terminal aesthetic.

---

## License

AGPL-3.0-or-later. Copyright © 2026 SuperNovae Studio.

If you fork `nika-design-skill` to make `<yourbrand>-design-skill`, the fork must be AGPL. The aesthetic is borrowed, but the **license is sovereign**.

---

**Version**: `0.1.0` · **Last updated**: 2026-04-14 · [nika.sh/design.md](https://nika.sh/design.md)

🦋
