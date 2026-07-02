/* ─── flagships · the assembled corpus every downstream beat consumes ─────────
   One entry per flagship: the file (verbatim) + the derived plan model + the
   parsed real trace. Computed once at module scope (pure string work, ~1ms,
   SSR-safe) so Hero / TheRun / ThePlan / TheBoundary all read the SAME object
   and can never disagree about what the selected file says. */

import { FLAGSHIPS, type Flagship } from './flagship-data'
import { deriveWorkflow, type FlagshipPlanModel } from './derive'
import { parseTrace, type RunTrace } from './trace-parse'

export type { Flagship } from './flagship-data'
export type { FlagshipPlanModel, FlagshipTask, FlagshipPermit, NikaVerb } from './derive'
export type { RunTrace, TraceStep } from './trace-parse'
export { formatMs } from './trace-parse'

export interface FlagshipEntry extends Flagship {
  plan: FlagshipPlanModel
  trace: RunTrace
}

export const FLAGSHIP_ENTRIES: FlagshipEntry[] = FLAGSHIPS.map((f) => ({
  ...f,
  plan: deriveWorkflow(f.yaml),
  trace: parseTrace(f.traceNdjson),
}))
