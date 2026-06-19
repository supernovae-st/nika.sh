# The Living File, inside the tunnel — the canonical vision (operator-dictated)

> Status: **operator vision, 2026-06-19**, screenshot-referenced (15.21.45 + 15.22.59).
> Written because I kept misreading it. This is the source of truth. Re-read before coding.

## The ONE rule I kept missing

**Everything is the SAME Three.js canvas.** The tunnel, the file, the DAG, the
running tasks — ONE WebGL scene. NOT a fixed tunnel canvas with HTML/CSS nodes
floating over it. The DAG nodes + the execution are **3D objects rendered inside
the tunnel scene**. « doit pas être un autre canva, ça doit être le même. »

The current build (CSS corridor/cards over the tunnel) is **wrong** for this — it
reads as a separate layer. It must be rebuilt as 3D objects in the tunnel scene.

## The choreography (one continuous scroll, one canvas)

```
①  HERO              the tunnel fills the screen (fixed bg, dark + dim grid).
                     the FILE (screen-cvs.nika.yaml · the circled thing) sits right.
                     it is a REAL .nika file — its content is DYNAMIC (editable;
                     the DAG is GENERATED from the content, not hardcoded).
      │ scroll ↓
②  THE FILE TRAVELS  the file moves (with "Living File" shown) — it doesn't just
                     fade, it travels into the scene as you scroll.
      │ scroll ↓
③  FILE → 2D DAG     the file transforms into a 2D DAG **built from its own
                     content** (parse the tasks/deps → nodes/edges). Same canvas.
      │ scroll ↓
④  2D → 3D ISO       the 2D DAG tips into a 3D isometric arrangement, in the
                     tunnel's depth. Same canvas.
      │ scroll ↓
⑤  EXECUTION         the elements/tasks run — in PARALLEL or sequential per the
                     file's deps — visibly (nodes light up, data flows). Same canvas.
      │ scroll ↓
⑥  ENFORCE → VERDICT permits wall · NIKA-SEC-004 · within bounds / exit 0.
      │ (then) → the B&W sections (the tunnel fades out behind them).
```

## Hard requirements (the ones I keep dropping)

1. **SAME canvas** — the DAG + tasks are Three.js objects in the tunnel scene, not
   an HTML/CSS overlay. This is non-negotiable.
2. **Dynamic file** — it's a `.nika` file; the DAG is derived from its content (so
   changing the content changes the DAG). Ideally the file is editable live.
3. **The file travels** on scroll (with "Living File" label), it doesn't just sit.
4. **Tasks run in parallel or not** per the deps — the parallelism must be visible.
5. The tunnel **stays the background the whole time**, fades only before the B&W
   sections.

## What this means for the build (honest)

This is a real rewrite of the run visual: the DAG nodes, edges, execution, permits
wall, verdict become **Three.js objects** placed in the tunnel scene (iso layout,
depth), driven by the same scroll progress as the tunnel dive. The deterministic
`run-model.ts` (states · cli · ndjson · enforce · verdict) stays the source of
truth — only the RENDERING moves from CSS into the WebGL scene. The old CSS
Living File (corridor + cards) gets removed.

## Build order (each verified with the operator's live eye — WebGL ≠ headless)

1. Render the file as an object in the tunnel scene (the handoff from the HTML hero
   editor → the in-scene file).
2. File → 2D DAG (nodes from the parsed content) in the scene.
3. 2D → 3D iso tip.
4. Execution (run-model drives node states · parallelism visible).
5. Enforce + verdict, then the tunnel fade + B&W handoff.
6. Make the file content editable (dynamic) if not already.
