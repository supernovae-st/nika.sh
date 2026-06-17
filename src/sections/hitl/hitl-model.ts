/* ─── hitl-model · the pure logic behind "Be the human in the loop" ───────────
   FIG 4.0 (design doc §4) — the interactive permits section. PURE LOGIC, no UI.
   The user is the reviewer of the `t3-resume-screener` plan: they toggle what
   the plan is allowed to touch, and the real run-model reacts.

   The "aha" is wired to the REAL engine semantics, not a mock:
   • the plan writes its shortlist with a `nika:write` (the `save` node).
   • take the `write` permit away → that effect is now OUTSIDE the declared
     `permits:` boundary → `runStateAt(DAG, 1, { failAt: 'save', deny: SEC_004 })`
     surfaces a real `NIKA-SEC-004` denial, BEFORE the write runs.
   • leave `write` on → the happy within-bounds run; the shortlist is written.
   • turn `net` ON → no fabricated exfiltration; just a legible consequence
     (the CVs *could* now leave the machine — declared in the file, your call).

   DETERMINISM CONTRACT (inherited from run-model): no Date.now / Math.random /
   I/O. Same permits → byte-identical RunState. So the unit tests + the headless
   screenshots are reproducible, and the SSR default is a fixed frame. */

import { SHOWCASE_DAG } from '../usecases-yaml.generated'
import { runStateAt, type RunState } from '../living/run-model'

/* the fil-rouge · the only projected showcase with a real `permits:` block. */
export const HITL_DAG = SHOWCASE_DAG['t3-resume-screener']

/* the node whose `nika:write` lands the shortlist on disk. Removing the `write`
   permit puts this effect outside the declared boundary → NIKA-SEC-004. The DAG
   ends on `save` (wave 7, the terminal `nika:write` to ./hiring/out). */
export const WRITE_NODE = 'save'

/* the real catalog row · verbatim from public/errors/catalog.json
   (security_error class). This is the denial the engine raises when an effect
   falls outside the declared `permits:` boundary — a refusal BEFORE the effect,
   never a log written after the damage. */
export const SEC_004 = {
  code: 'NIKA-SEC-004',
  category: 'security_error',
  transient: false,
  message: 'write ./hiring/out is outside permits — denied before it ran',
} as const

/* ── the four declarable permits the reviewer controls ──────────────────────
   Worded straight off the plan's real `permits:` block + the schema model:
   fs.read / fs.write (read XOR write, by glob) · net.http (host allowlist) ·
   exec (programs). `read` + `write` are the plan's REAL declared permits; `net`
   and `exec` are absent from the file ON PURPOSE (the seatbelt: no net category
   at all → the CVs physically cannot leave the machine). */
export type PermitKey = 'read' | 'write' | 'net' | 'exec'

export interface PermitDef {
  key: PermitKey
  /** the human label on the switch */
  label: string
  /** the real glob / shape the permit maps to (mono, secondary) */
  scope: string
  /** the schema capability id (aria + caption) */
  cap: string
  /** the file's declared default for this permit */
  declared: boolean
  /** is this permit load-bearing for the run? (drives the outcome) */
  loadBearing: boolean
}

export const PERMITS: readonly PermitDef[] = [
  {
    key: 'read',
    label: 'read the CV inbox',
    scope: './hiring/inbox/**',
    cap: 'fs.read',
    declared: true,
    loadBearing: true,
  },
  {
    key: 'write',
    label: 'write the shortlist',
    scope: './hiring/out/**',
    cap: 'fs.write',
    declared: true,
    loadBearing: true,
  },
  {
    key: 'net',
    label: 'reach the internet',
    scope: 'no hosts declared',
    cap: 'net.http',
    declared: false,
    loadBearing: false,
  },
  {
    key: 'exec',
    label: 'run shell commands',
    scope: 'no programs declared',
    cap: 'exec',
    declared: false,
    loadBearing: false,
  },
] as const

/** the reviewer's current toggle state, keyed by permit. */
export type PermitState = Record<PermitKey, boolean>

/** the file's declared defaults — the SSR / no-JS / reduced-motion baseline. */
export const DEFAULT_PERMITS: PermitState = {
  read: true,
  write: true,
  net: false,
  exec: false,
}

/* ── the plan in plain words ────────────────────────────────────────────────
   Three review-worthy beats a human actually reads, each mapped to its real DAG
   node + verb glyph (derived, never hand-numbered). The reviewer reads THIS, not
   the YAML — "here's what the agent intends to do." */
export interface PlanStep {
  /** the real DAG node id this beat maps to */
  node: string
  /** the verb of that node (glyph is derived in the component) */
  verb: 'infer' | 'exec' | 'invoke' | 'agent'
  /** plain-words intent — what a human reviewer reads */
  intent: string
  /** the permit this step leans on (so we can mark it denied/skipped) */
  permit: PermitKey
}

export const PLAN: readonly PlanStep[] = [
  {
    node: 'cvs',
    verb: 'invoke',
    intent: 'Read every CV in the hiring inbox.',
    permit: 'read',
  },
  {
    node: 'screened',
    verb: 'infer',
    intent: 'Score each candidate with a local model — evidence quoted, nothing sent off-machine.',
    permit: 'read',
  },
  {
    node: 'save',
    verb: 'invoke',
    intent: 'Write the ranked shortlist to the hiring folder.',
    permit: 'write',
  },
] as const

/* ── the outcome · what the runtime does, given the toggles ──────────────────
   ONE of three legible states, in priority order:
   • 'denied'  — `write` was taken away → the terminal write is refused
     (NIKA-SEC-004), before it runs. The money moment.
   • 'exposed' — `net` was added → no fabricated run, just the consequence: the
     CVs *could* now leave the machine. Calm, not doomy.
   • 'within'  — the declared, within-bounds run: the shortlist is written, the
     CVs never left the machine.
   `read` is load-bearing too (no read → nothing to score), but the section's
   spine is the write-denial aha, so `read` off folds into the same denial path
   on its own node — kept simple here: read off → the read step itself is the
   one out of bounds. */
export type OutcomeKind = 'within' | 'denied' | 'exposed'

export interface Outcome {
  kind: OutcomeKind
  /** the headline a human reads first (the verdict) */
  headline: string
  /** the one-line gloss under it (calm, the trust) */
  gloss: string
  /** the run-model state that backs this outcome (real CLI rows, real codes) */
  run: RunState
  /** for 'denied': the node + code that got refused (drives the ✗ row) */
  deniedNode?: string
  deniedCode?: string
}

/** the happy, within-bounds run — also the SSR / reduced-motion default. */
const WITHIN_RUN: RunState = runStateAt(HITL_DAG, 1)

/** the denied run — the terminal write refused at the permits boundary. */
const DENIED_WRITE_RUN: RunState = runStateAt(HITL_DAG, 1, {
  failAt: WRITE_NODE,
  deny: SEC_004,
})

/** the denied run when `read` is removed — the read step is now out of bounds. */
const DENIED_READ_RUN: RunState = runStateAt(HITL_DAG, 1, {
  failAt: 'cvs',
  deny: {
    code: 'NIKA-SEC-004',
    category: 'security_error',
    transient: false,
    message: 'read ./hiring/inbox is outside permits — denied before it ran',
  },
})

/**
 * Resolve the reviewer's toggles to a single, legible outcome.
 * PURE: same `permits` → same `Outcome` (deep-equal). The run is one of three
 * precomputed deterministic RunStates (no per-call recompute).
 */
export function resolveOutcome(permits: PermitState): Outcome {
  // priority 1 · a load-bearing permit was removed → a real denial.
  if (!permits.write) {
    return {
      kind: 'denied',
      headline: 'Denied — before it ran.',
      gloss:
        'You took the write permission away. The runtime refused the write at the boundary — it never touched the disk.',
      run: DENIED_WRITE_RUN,
      deniedNode: WRITE_NODE,
      deniedCode: SEC_004.code,
    }
  }
  if (!permits.read) {
    return {
      kind: 'denied',
      headline: 'Denied — before it ran.',
      gloss:
        'No read permit, nothing to screen. The runtime refused to open the inbox — denied at the boundary, not after.',
      run: DENIED_READ_RUN,
      deniedNode: 'cvs',
      deniedCode: SEC_004.code,
    }
  }

  // priority 2 · `net` was added → legible exposure (no fabricated exfil run).
  if (permits.net) {
    return {
      kind: 'exposed',
      headline: 'Now it could phone home.',
      gloss:
        'With a net permit, the agent could send those CVs anywhere. With Nika that is YOUR call — declared in the file, enforced by the runtime.',
      run: WITHIN_RUN,
    }
  }

  // priority 3 · the declared, within-bounds run.
  return {
    kind: 'within',
    headline: 'Ran within bounds.',
    gloss:
      'Shortlist written to ./hiring/out. The CVs never left this machine — even if one tried to hijack the model.',
    run: WITHIN_RUN,
  }
}

/** the pretty-CLI row that shows the denied effect (`✗ <id>  NIKA-SEC-004`).
 *  Pulled from the denied RunState so the format + code are engine-true. */
export function deniedCliRow(run: RunState, code: string, node: string): string {
  return run.cli.find((l) => l.includes(code)) ?? `✗ ${node}   ${code}`
}
