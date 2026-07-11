/* ─── the DAG component library · one vocabulary, one source ──────────────────
   Everything the site draws about a plan comes from here:

     DagNodeCard   the task card register (id · verb hue tick · target ·
                   when badge · recorded chip) — ThePlan + /brand
     MiniDag       the compact survey instrument (verb dots · mono ids ·
                   drawn wires) — the hero + /learn

   Both speak the SAME generated vocabulary (design-tokens.generated.ts ←
   design/tokens.yaml, the spec SSOT): verb names type the props, verb hues
   ride --verb-* (pinned to the SSOT by the design-tokens-css gate), run
   states come from NIKA_STATUS. The vscode canvas draws its own denser
   editor cards from the SAME tokens — one vocabulary, two registers. */

export { DagNodeCard, type DagNodeCardProps, type DagNodeChip } from './DagNodeCard'
export { MiniDag, type MiniDagProps } from '../MiniDag'
