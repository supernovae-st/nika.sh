# Spacing Rhythm Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace uniform `py-24 md:py-32` on every section with a harmonic rhythm system derived from Linear/Vercel/Stripe analysis, and fix the hero nav-overlap bug.

**Architecture:** Pure Tailwind class substitutions in `index.astro` and `EditorialTopBar.astro`. No new components, no CSS additions. The rhythm follows the principle: compressed landing → standard editorial → compressed data → expanded conceptual anchor → compressed data → climax → gentle close.

**Tech Stack:** Astro 5, Tailwind v4, `npx astro build` for verification.

---

## Rhythm Decision Table

Research source: Live CSS extraction from Linear (`PageSection_root`), Vercel (`hero-module`), Stripe (`--hds-space-core-*`).

```
§ HERO           pt-12 pb-24 md:pt-16 md:pb-32  →  pt-20 pb-28 md:pt-24 md:pb-36
§ 01 VITAL SIGNS py-24 md:py-32                 →  py-16 md:py-20   ← COMPRESSED (landing)
§ 02 A WORKFLOW  py-24 md:py-32                 →  KEEP             (editorial anchor)
§ 03 HOW IT RUNS py-24 md:py-32                 →  py-20 md:py-28   (standard)
§ 04 FIVE VERBS  py-24 md:py-32                 →  KEEP             (conceptual anchor)
§ 05 THE SHAPE   py-24 md:py-32                 →  py-20 md:py-28   (standard)
§ 06 BUILD       py-24 md:py-32                 →  KEEP             (showcase anchor)
§ 07 WORKSPACE   py-24 md:py-32                 →  py-20 md:py-28   (standard)
§ 08 PROVIDERS   py-24 md:py-32                 →  py-16 md:py-20   ← COMPRESSED (data grid)
§ 10 DEV LOGS    py-24 md:py-32                 →  py-20 md:py-28   (standard)
§ 12 GET STARTED py-24 md:py-32                 →  KEEP             (climax before CTA)
§ 13 EMERGE      py-28 md:py-36                 →  py-20 md:py-28   (gentle close)
```

**Why these specific tiers:**
- `py-16 md:py-20` (64/80px) — data/stats sections. Feels like a control panel row, not a stage.
- `py-20 md:py-28` (80/112px) — standard editorial. Linear's `PageSection_root` compressed variant.
- `py-24 md:py-32` (96/128px) — anchor/climax. Reserved for conceptual pivots and CTA.

---

## Task 1 — Fix nav clearance (EditorialTopBar.astro)

**Bug:** Nav bottom edge is at 56px from top (`top-3`=12px + `h-11`=44px). Hero content starts at 48px (`pt-12`). Overlap = 8px on mobile.

**Files:**
- Modify: `src/components/ui/EditorialTopBar.astro` — change `top-3` to `top-4`

**Step 1: Apply the change**

In `EditorialTopBar.astro` find the `<header>` tag:
```html
<!-- FROM -->
class="fixed top-3 left-0 right-0 z-50 px-4 md:px-6 pointer-events-none"
<!-- TO -->
class="fixed top-4 left-0 right-0 z-50 px-4 md:px-6 pointer-events-none"
```

**Step 2: Verify**
```bash
grep 'fixed top-' src/components/ui/EditorialTopBar.astro
# Expected: fixed top-4
```

---

## Task 2 — Hero top clearance (index.astro:56)

**Bug:** `pt-12` = 48px puts the changelog badge partially under the nav. Also, the hero needs more vertical presence as the signature section.

**Files:**
- Modify: `src/pages/index.astro` — hero inner container padding

**Step 1: Apply the change**

```html
<!-- FROM -->
class="relative z-10 mx-auto max-w-[82rem] px-6 pt-12 pb-24 md:pt-16 md:pb-32"
<!-- TO -->
class="relative z-10 mx-auto max-w-[82rem] px-6 pt-20 pb-28 md:pt-24 md:pb-36"
```

Math check: `pt-20` = 80px, nav bottom = 16+44 = 60px → 20px clearance. ✓

**Step 2: Verify**
```bash
grep 'pt-20 pb-28' src/pages/index.astro
# Expected: 1 match
```

---

## Task 3 — §01 VITAL SIGNS compressed landing (index.astro)

**Why:** The section immediately after the hero should feel like a "landing" — less vertical space creates momentum, not pause. Pattern from Linear's compressed PageSection variant.

**Files:**
- Modify: `src/pages/index.astro` — §01 container + Rule

**Step 1: Section padding**
```html
<!-- FROM (§01 section div) -->
class="mx-auto max-w-[82rem] px-6 py-24 md:py-32"
<!-- TO -->
class="mx-auto max-w-[82rem] px-6 py-16 md:py-20"
```

**Step 2: Normalize Rule margin** (§01 is the only section with `mb-10`, all others use `mb-12`)
```html
<!-- FROM -->
<Rule number="01" label="§ VITAL SIGNS" variant="faint" class="mb-10" />
<!-- TO -->
<Rule number="01" label="§ VITAL SIGNS" variant="faint" class="mb-12" />
```

**Step 3: Tighten stat grid** — data panels should feel tighter than feature cards
```html
<!-- FROM -->
class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
<!-- TO -->
class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12"
```

**Step 4: Verify**
```bash
grep -n 'VITAL SIGNS' src/pages/index.astro
# Then check surrounding lines for py-16 md:py-20
```

---

## Task 4 — §03 HOW IT RUNS standard rhythm

**Files:** `src/pages/index.astro`

**Step 1: Apply**
```html
<!-- FROM -->
<div class="mx-auto max-w-[82rem] px-6 py-24 md:py-32">  {/* §03 */}
<!-- TO -->
<div class="mx-auto max-w-[82rem] px-6 py-20 md:py-28">
```

---

## Task 5 — §05 THE SHAPE standard rhythm + wider h2 container

**Files:** `src/pages/index.astro`

**Step 1: Section padding**
```html
<!-- FROM (§05) -->
<div class="mx-auto max-w-[82rem] px-6 py-24 md:py-32">
<!-- TO -->
<div class="mx-auto max-w-[82rem] px-6 py-20 md:py-28">
```

**Step 2: Wider h2 container** — `max-w-2xl` (42ch) is too narrow for "Three rules. Nothing else."
```html
<!-- FROM -->
<div class="max-w-2xl mb-14">
<!-- TO -->
<div class="max-w-3xl mb-12">
```

---

## Task 6 — §07 WORKSPACE standard rhythm

**Files:** `src/pages/index.astro`

**Step 1: Apply**
```html
<!-- FROM (§07) -->
<div class="mx-auto max-w-[82rem] px-6 py-24 md:py-32">
<!-- TO -->
<div class="mx-auto max-w-[82rem] px-6 py-20 md:py-28">
```

---

## Task 7 — §08 PROVIDERS compressed (data grid)

**Why:** The provider grid is data-dense. Compression reinforces its "catalog" character vs "showcase" sections.

**Files:** `src/pages/index.astro`

**Step 1: Apply**
```html
<!-- FROM (§08) -->
<div class="mx-auto max-w-[82rem] px-6 py-24 md:py-32">
<!-- TO -->
<div class="mx-auto max-w-[82rem] px-6 py-16 md:py-20">
```

---

## Task 8 — §10 DEV LOGS standard rhythm

**Files:** `src/pages/index.astro`

**Step 1: Apply**
```html
<!-- FROM (§10) -->
<div class="mx-auto max-w-[82rem] px-6 py-24 md:py-32">
<!-- TO -->
<div class="mx-auto max-w-[82rem] px-6 py-20 md:py-28">
```

---

## Task 9 — §13 EMERGE gentle close

**Why:** Research shows the CLIMAX section (§12 GET STARTED) gets max padding. The final CTA (§13 EMERGE) should land gently — too much padding oversells. Current `py-28 md:py-36` is the LARGEST on the page and feels pressuring.

**Files:** `src/pages/index.astro`

**Step 1: Apply**
```html
<!-- FROM (§13 inner container) -->
class="mx-auto max-w-[82rem] px-6 py-28 md:py-36 text-center relative z-10"
<!-- TO -->
class="mx-auto max-w-[82rem] px-6 py-20 md:py-28 text-center relative z-10"
```

---

## Task 10 — Build verification

**Step 1: Build**
```bash
npx astro build 2>&1 | tail -5
# Expected: [build] Complete! 0 errors
```

**Step 2: Count changed sections**
```bash
grep -c 'py-16 md:py-20\|py-20 md:py-28' src/pages/index.astro
# Expected: 6-7 matches (§01, §03, §05, §07, §08, §10, §13)
```

**Step 3: Verify anchors unchanged**
```bash
grep 'py-24 md:py-32' src/pages/index.astro
# Expected: §02, §04, §06, §12 — 4 matches
```

---

## Task 11 — Dev server

```bash
npx astro dev --host 0.0.0.0
# Or: pnpm dev
```

Manually verify in browser:
- [ ] Nav has clearance from hero content (no overlap)
- [ ] Hero feels more spacious top/bottom
- [ ] §01 stats land tightly after hero (momentum)
- [ ] §04 Five Verbs and §06 Build still feel expansive
- [ ] §08 Providers feels compact (catalog)
- [ ] §13 Emerge feels calm, not pressuring

---

## Commit message

```
feat(spacing): harmonic section rhythm — compressed landing, standard editorial, expanded anchors

Co-Authored-By: Nika 🦋 <nika@supernovae.studio>
```
