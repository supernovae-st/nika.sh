# nika.sh — the integrated 3D hero → Living File experience (design)

> Status: **validated brainstorm**, 2026-06-18. Operator-driven, screenshot-referenced.
> This captures EVERY accumulated direction so nothing is lost. Implement in loops
> with the operator's LIVE eye (WebGL does not verify headless).

## 0. The frustration to fix
The operator said many things across iterations and they weren't all integrated. Three
concrete misses corrected here: (1) the header was over-blued — it must be **dark
(Linear/Cursor)** with a **blue ACCENT**, not a full blue field; (2) the hero and the
Living File are TWO disjoint blocks — they must be **ONE continuous, integrated,
full-screen scroll experience** connected by the file; (3) the particle butterfly must
**NOT spin on itself** — the SHAPE is FIXED; the wow is the **particles streaming fast**
to form + hold the figure, plus a subtle **mouse parallax** (Maxime's infinity-figure
register, not a turntable logo).

## 1. The header (hero) — recalibrated
- **Base: DARK** (Linear/Cursor near-black `#0a0b0d`). NOT a full blue gradient.
- **A POINTE of blue**: one localized blue glow/bloom (e.g. behind the particles / off-axis), the v3 cinematic blue touch — an ACCENT, not the field.
- **3D particle nika butterfly** — a **FIXED shape** (NO rigid spin on itself). The wow is the **particles STREAMING fast** across it to form + hold the figure (the Maxime-Heckel infinity-figure register, blog.maximeheckel.com), with a subtle **mouse parallax** tilt (it reacts to the pointer, never a turntable). The nika butterfly (`public/nika.svg` → points), white→soft-cyan/blue glowing motes on dark. **Three.js / r3f**, reuse v3 `butterfly.ts` + `particles.tsx`. Lazy, reduced-motion-safe (the flow eases, the parallax drops).
- **Depth grid in the background**: a perspective grid receding (dark, subtle blue lines) — atmosphere.
- **HUD**: keep/add the FIG/registration marks (the operator likes HUD).
- **Layout**: headline LEFT (real DOM `<h1>` — SEO), the premium **CodeFile editor** RIGHT (keep). Composed well, **spacious, aerated** (not crammed). The "screen-cvs.nika.yaml" file is the SAME file used in the experience below.
- Vibe: **Cursor / Linear / Raycast premium**, dark, with the blue accent + particles. **Never AI-slop** (no blue→purple, no cheap neon).

## 2. The integrated scroll experience (hero → Living File = ONE thing)
ONE pinned/sticky scene; scroll progress drives a continuous choreography. The hero
editor is the SAME object that gets **aspirated down** and becomes the execution.
**Three.js (WebGL)** for the 3D corridor + the morph + particles.

```
①  HERO (rest)         headline ←  |  → editor (right) · butterfly (FIXED shape · fast-streaming particles · mouse parallax) · dark + blue pointe + grid
      │ scroll ↓
②  ASPIRATION          the editor detaches from the right, slides DOWN + center + grows;
                       headline fades — "sucked into the machine"
      │ scroll ↓
③  THE PLAN · 2D DAG    MORPH (Q3=A): each YAML task LINE detaches and flies into place as a
   (comprehension)     NODE of a clean full-screen 2D graph. Parallel tasks side-by-side,
                       explicitly labelled "these run in parallel." The file BECOMES the graph.
      │ scroll ↓
④  THE RUN · 3D corridor (Q1=A) the 2D DAG TILTS into depth → a FULL-SCREEN Three.js 3D corridor.
   (wow)               Camera travels the plan; nodes execute in topological order; data-flow
                       wires. (Q2=A) a MINIMAL HUD log/status strip narrates the run live on the
                       corridor — not a cramped side rail.
      │ scroll ↓
⑤  ENFORCE             an out-of-bounds action hits the permits wall → blocked, `NIKA-SEC-004`
   (own beat)          (full-screen, its own beat).
      │ scroll ↓
⑥  RESULT              within bounds · shortlist written · exit 0 · the audit trail
   (own beat)          (outputs as their own full-screen beat).
      │ (section releases) → Verbs section …
```

Principles: **one file, full-screen, one beat at a time, smooth** — the opposite of the
old "everything in a cramped left-right split at once."

## 3. Technical approach
- **Three.js / @react-three/fiber** (already deps) for the full-screen 3D corridor, the line→node morph, and the hero butterfly particles. Reuse v3 scene code (`src/scene/*`, `butterfly.ts`, `particles.tsx`).
- **One pinned sticky section** spanning hero→result; compute scroll progress (`getBoundingClientRect` or drei `useScroll`) → drive the beats. The body `overflow-x: hidden` killed CSS `sticky` before (see commit d5f0c5c) — pin via a fixed/translate technique or a dedicated scroll container; verify pinning works.
- **Lazy + perf**: the WebGL scene lazy-mounts; `frameloop` paused when the section is off-screen; DPR-capped.
- **SSR / reduced-motion / no-WebGL fallback**: keep a coherent static, legible fallback — the premium CodeFile (the plan) + a flat 2D DAG + the run log + outputs + the SEC-004 note (the current 2D content). The 3D experience is the `no-preference` + WebGL-capable enhancement. SR users get the `sr-only` run summary.
- Headline + key copy stay real DOM (SEO). The blue accent + grid can be CSS where cheap.
- Drives off the existing deterministic `run-model.ts` (states + CLI + NDJSON + the `NIKA-SEC-004` deny path) — single source of truth, don't rebuild it.

## 4. Visual continuity
Dark base + the blue accent + the grid + the HUD register run CONTINUOUSLY from the
hero through the experience (it's one scene) — so it reads as one integrated whole, not
a hero then a separate section. Premium, Linear/Cursor restraint, the v3 cinematic magic
brought back tastefully.

## 5. Build order (loops — operator verifies LIVE each)
1. **Recalibrate the hero** — dark + blue POINTE (kill the over-blue) + the particle butterfly + depth grid + HUD + better composition. (immediate fix)
2. **The morph + 2D DAG** — editor aspirated down, lines → nodes, full-screen, parallelism clear.
3. **The 3D corridor (Three.js) full-screen** — the tilt, the travel, the run, the minimal HUD log.
4. **Enforce + result beats** + the un-pin handoff to Verbs.
5. **Polish + perf + a11y/fallback + real-GPU verification with the operator.**

Each step: build → operator views on `http://127.0.0.1:5188/` (or `pnpm dev`) on a real
GPU → iterate. Do NOT declare done on a headless capture.
