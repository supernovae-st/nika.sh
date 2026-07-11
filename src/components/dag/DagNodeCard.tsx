import type { NikaVerbName } from '../../design-tokens.generated'
import './dag-node.css'

/* ─── DagNodeCard · the ONE task card (component library) ─────────────────────
   The register every settled plan renders: mono id, the verb word in its
   canonical hue (the tick — hue = alive), the target line, the honest
   when: badge, the recorded chip (✓ real ms · ⊘ gate closed). ThePlan
   composes it into the wave scene; /brand demos it raw. The verb type IS
   the generated vocabulary (NikaVerbName ← design/tokens.yaml) — a fifth
   verb cannot be rendered by construction.

   Interactivity is the CALLER's (ThePlan wires focus/tracing; /brand keeps
   them inert): the card stays a pure projection of its props. */

export interface DagNodeChip {
  text: string
  skipped?: boolean
}

export interface DagNodeCardProps {
  id: string
  verb: NikaVerbName
  /** the target line (model · command · tool ref) — mono, ellipsized */
  target?: string
  /** the raw when: expression (already unwrapped by the caller) */
  when?: string
  /** the recorded outcome — real numbers only (never fabricated) */
  chip?: DagNodeChip
  /** the tracing state ThePlan drives (focus · dep-up · dep-down · off) */
  state?: string
  /** ref to the live element — ThePlan measures wire endpoints from it */
  ref?: React.Ref<HTMLDivElement>
  /** interactive card (role=button + handlers) — ThePlan's tracing toggle */
  role?: React.AriaRole
  tabIndex?: number
  'aria-pressed'?: boolean
  'aria-label'?: string
  onPointerEnter?: React.PointerEventHandler<HTMLDivElement>
  onClick?: React.MouseEventHandler<HTMLDivElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
}

export function DagNodeCard({ id, verb, target, when, chip, state, ...rest }: DagNodeCardProps) {
  return (
    <div
      className="v5plan-node"
      data-verb={verb}
      data-state={state}
      data-skipped={chip?.skipped || undefined}
      {...rest}
    >
      <span className="v5plan-node-id">{id}</span>
      <span className="v5plan-node-verb">{verb}</span>
      {target ? (
        <span className="v5plan-node-target" title={target}>
          {target}
        </span>
      ) : null}
      {when ? (
        <span className="v5plan-node-when" title={when}>
          when: {when}
        </span>
      ) : null}
      {chip?.text ? (
        <span className="v5plan-node-chip" data-skipped={chip.skipped || undefined}>
          {chip.skipped ? '⊘' : '✓'} {chip.text}
        </span>
      ) : null}
    </div>
  )
}
