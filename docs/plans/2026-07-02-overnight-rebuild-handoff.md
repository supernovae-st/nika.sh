# Overnight rebuild · handoff — `v4-trust-landing` (2026-07-01 → 07-02)

The v5 dither black/blue rebuild ran as a 6-wave overnight arc on the
`v4-trust-landing` branch (never pushed during the arc). 26 commits, all gates
(`pnpm check && pnpm lint && pnpm test && pnpm build`) green before every
commit. This file is the merge-ready handoff: the commit ledger, the
consolidated eyeball checklist, what was deliberately deferred, and the
checklist to run before merging into `main` (which auto-deploys to nika.sh).

---

## 1 · Commit ledger (oldest → newest · `git log --oneline --reverse origin/v4-trust-landing..HEAD`)

### W1 — tokens v5 · hero · DitherField

```
1e283ef refactor(site): purge dead v3 scene files + unused legacy css
fd6fda1 feat(tokens): v5 dither black/blue token system
2c87b7a feat(hero): locked wedge copy + sharp file-tab strip + v5 restyle
7d1acc3 feat(scene): DitherField — Bayer ordered-dither shader background
0c9b607 fix(hero): install-line whitespace, tab-strip fit, H1 measure
```

### W2 — fx retune · carre sweep · install pill · telemetry · proof

```
8055a5c feat(fx): EdgeAurora single-blue retune — dimmer rest, sharper pulse
05b4f27 style(sections): v5 carre sweep — radii to the 0-4px system + grain
0b900be feat(hero): command-as-CTA install + mono version plate
59a3974 feat(living): per-node telemetry chips on the corridor plates
42cee69 feat(proof): ProofStrip — slim mono stat band after the Living File
```

### W4 — chapters · on-ramp · conversion · rotator · personas

```
c7c0675 feat(verbs): numbered spec-chapter register — 1.0 infer → 4.0 agent
cd476d4 feat(start): runs-everywhere surface row — terminal / editor / agent
7b91c64 feat(cta): conversion beat — send us your repeated AI task
35a0ee6 feat(hero): rotating mono audience line — humans / agents / teams
1a34071 feat(use-cases): persona gallery — I-want-to outcome titles, three audiences
```

### W5 — inner pages · meta · glossary

```
0e62d0e feat(learn): consumer-register walk — museum plates, glossed concepts, valid fragments
104bbdd feat(changelog): two-tone entry titles on the ship-log timeline
a9723b8 feat(play): runs-locally hint — install pill + nika run bridge
f821fec feat(spec): consumer TL;DR — the 5 pillars in one glance-table
190b6dc style(manifesto): scoped v5 blue retune — the drum beats blue now
ef9fda9 feat(404): on-brand parse line + valid envelope nod + v5 sharp radii
a51103e feat(meta): wedge-register titles + descriptions across every route
e346e39 copy(glossary): final consumer sweep — plan not DAG, MCP never bare, permits glossed
```

### W6 — real releases · a11y · perf (this wave)

```
f4c6829 feat(changelog): the two real engine releases enter the ship log
f6815d5 a11y(arc): copy announcements, SR-real rotator name, AA ink on dim mono
2a3cc94 perf(home): idle-mount the dither field + content-visibility below the fold
```

---

## 2 · W6 verification data (measured, not assumed)

### Bundle (post-W6 `pnpm build` · splitting unchanged, only the fetch timing moved)

| chunk | size | gzip | loads |
|---|---|---|---|
| `react-three-fiber.esm` | 880.64 kB | 234.24 kB | **idle** (DitherField dep · requestIdleCallback, 2s timeout) or egg trigger |
| `PlayEditor` | 434.59 kB | 141.60 kB | `/play` only (React.lazy inside Play.tsx — codemirror) |
| `index` (entry) | 408.06 kB | 114.25 kB | always (all route components are sync by prerenderer constraint — see `routes.tsx` header) |

Entry HTML modulepreloads only `rolldown-runtime` + `react-vendor` — zero
three.js in the first-paint path. `GalaxyEgg` (178.7 kB) loads only on the
typed « nika » egg. CSS is one 190 kB bundle (30.96 kB gz).

### dist grep (clean)

- Cyan/violet hexes surviving in dist CSS: `#22d3ee` (verb-invoke) and
  `#b07bff` (verb-agent) **only** — both sanctioned verb hues. The v3 cyan
  `#7fe9ff` survives only in the egg's three.js palette (JS chunk, egg-scoped)
  and the console-lore strings; `--cyan` in `index.css` is the v3 fallback
  consumed by egg/Play surfaces only.
- `TODO` in src: 1 real — `Hero.tsx` `ENGINE_VERSION` is hand-bumped per
  release until a version projection exists (tracked, intentional). The two
  matches in `usecases-yaml.generated.ts` are a workflow example's own grep
  pattern, not debt.
- `console.log` in src: 2, both the intentional easter-egg lore in `Home.tsx`.

### a11y (found → fixed in `f6815d5`)

- 4 copy buttons announced nothing to SR (aria-label swap only) → polite
  `role="status"` live regions.
- Audience rotator's `aria-label` on a `<p>` is name-prohibited (dropped by
  most SR) → real sr-only sentence.
- Active hero tab's `.nika.yaml` extension was 2.98:1 → text-faint (5.4:1).
- CodeFile comment 3.98:1 / punctuation 4.28:1 → 4.6:1 / 4.9:1 on `--cf-bg`.
- Living File beat caption `aria-live` polite → off (scroll choreography;
  `RunSummarySR` remains the SR equivalent).
- Hero tablist gained Home/End (arrows + roving tabIndex already correct).
- Verified clean: heading order on all 8 routes (one h1, no skips) · global
  `:focus-visible` ring (2px, offset 2, theme-scoped ≥3:1) on every arc
  control · DitherField/EdgeAurora aria-hidden with static reduced-motion
  frames · all dim plate/kicker inks ≥5.3:1 · every arc animation resolves
  to a complete static state under reduced motion.

### Prerender parity

8/8 routes: exactly one `<h1>` + `meta[name=description]` + full register in
the static HTML (JS-disabled semantics hold; the changelog page carries the
two new release entries in the prerendered DOM).

---

## 3 · Consolidated eyeball checklist (human, real browser)

Chrome + Safari + one Firefox pass, dark room, `pnpm preview`:

- [ ] **Hero** — wedge headline paints instantly (no FOUT flash), file tabs
      flip (mouse + ←/→/Home/End), install pill copies + « Copied » flips,
      version plate reads v0.91.0, audience line crossfades every ~4s.
- [ ] **DitherField** — appears with a soft fade shortly after load (idle
      mount), dives on scroll, fades out by ~3.4 screens; `?notunnel` kills it.
- [ ] **Living File** — the five beats scrub cleanly (file → morph → flat DAG
      → corridor run → verdict); telemetry chips land on finished plates; CLI
      ↔ NDJSON toggle; NIKA-SEC-004 denial row shows in ENFORCE; `#living-file`
      anchor from the hero CTA and the nav lands exactly.
- [ ] **ProofStrip → FinalCTA** — mono numbers correct (CANON), GitHub plate
      hover, verb chapters hues only on live-run surfaces, runs-everywhere
      cards' marketplace links resolve, conversion CTA opens the issue chooser.
- [ ] **Scroll integrity after content-visibility** — fast-scroll bottom →
      refresh (scroll restoration lands right) · nav mega-menu `/#verbs` and
      `/#permits` from an inner route land exactly · scrollbar doesn't jump
      noticeably on first deep scroll.
- [ ] **Inner pages** — /learn walk, /spec glance-table, /use-cases three
      personas, /changelog (v0.91.0 + v0.90.0 on top, blue release nodes,
      'latest · release' stamp), /play checks as you type, /manifesto blue
      retune, 404 parse line.
- [ ] **Reduced motion** (macOS: Displays → Reduce Motion) — static dither
      frame, static rotator stack, Living File shows the completed end-state,
      no edge-flow/pulse loops, nav sheets snap.
- [ ] **Keyboard-only walk** — skip link, nav, tabs, pills, toggles, cards,
      FAQ; the blue ring visible on every stop (near-black ring on light
      sections).
- [ ] **Mobile width (~390px)** — hero stacks, tab strip scrolls, corridor
      falls back to the 2D DAG on coarse+narrow, plates wrap.

## 4 · Deferred (deliberate — do NOT treat as regressions)

| item | why deferred | where it lands |
|---|---|---|
| One-canvas 3D scene (hero editor + corridor in a single WebGL scene) | needs live art direction — not an overnight call | live session with operator |
| Hero-tab → LivingFile dynamic wiring (playing the SELECTED tab's file) | run-model is keyed to daily-brief; re-keying the DAG per tab is a design + model change | live session |
| OG image regen (og.png is the pre-v5 1200×630) | image tooling + art direction offline | before or right after merge |
| Real-device pass (iOS Safari, Android Chrome) | no devices overnight | pre-merge checklist below |
| `ENGINE_VERSION` projection (hero plate is hand-bumped) | needs a CI/canon projection, out of site scope | engine release pipeline |
| Entry chunk carries all route components (~408 kB) | sync routes are a documented prerenderer constraint (`routes.tsx`) | revisit if vite-plugin-react-ssg learns lazy routes |
| `src/sections/usecases-yaml.generated.ts` dirty in the worktree (spec projector added `egress:` blocks) | generated file — regenerating/committing belongs to the spec-sync owner, not this arc | spec-sync session |

## 5 · Merge checklist (`v4-trust-landing` → `main` · main AUTO-DEPLOYS to nika.sh)

1. `git fetch` + rebase/merge check against `main` (other sessions ship there).
2. Full gates on the merge result: `pnpm check && pnpm lint && pnpm test && pnpm build`.
3. `pnpm preview` + §3 eyeball checklist (at minimum: hero, Living File scrub,
   reduced-motion, one keyboard walk, /changelog).
4. Real-device pass (deferred item) — at least one iOS Safari look at the hero
   + Living File before the world sees it.
5. Confirm `public/og.png` decision: ship the stale one knowingly or regen
   first (meta already points at `/og.png`).
6. Verify `dist/` route parity one last time (8/8 h1 + description — §2).
7. Squash-merge per repo convention · trailer `Co-Authored-By: Nika 🦋
   <nika@supernovae.studio>` · watch the DigitalOcean deploy + spot-check
   https://nika.sh (hero, /changelog, /play) once live.
