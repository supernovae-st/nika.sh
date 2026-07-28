import type { LintDiag, NikaOracle } from '../nika-lint'

/* ─── the oracle, made real ───────────────────────────────────────────────────
   nika-lint.ts drew this seam long before the artifact existed: « the day the
   engine ships its wasm check artifact it registers window.NikaOracle; every
   judge-surface PREFERS the oracle and falls back to the port ». This module
   is that day. The vendored pkg/ is the REAL parser and conformance analyzer
   (nika-schema + nika-check compiled to wasm — provenance beside it), so the
   playground stops approximating 13 codes and starts speaking the engine's
   own voice on the legs the browser genuinely has.

   HONESTY RIDES IN-BAND: the crate's verdict names its coverage
   (`wasm: true` + a closed `legs: []`), and the caller surfaces it as a
   provenance chip — the browser half must never read as the full binary.
   A broken oracle never breaks the page: checkNika catches, the port stays
   the floor. */

export interface OracleInfo {
  /** the engine version the artifact was built from (crate version) */
  engine: string
  /** the passes this build actually runs — the in-band coverage marker */
  legs: readonly string[]
}

interface WasmRow {
  code?: string
  gate?: string
  severity?: string
  message?: string
  docs_url?: string
  /** derived IN THE CRATE, in characters — a JS consumer must never
      re-slice the source by the byte span (the two arithmetics disagree
      the moment a multi-byte character sits left of the caret) */
  line?: number
  col?: number
}

/** one verdict payload → the LintDiag[] the site's judge-surfaces speak */
export function rowsToDiags(verdict: string): LintDiag[] {
  const v = JSON.parse(verdict) as { findings?: WasmRow[] }
  return (v.findings ?? []).map((r) => ({
    line: r.line ?? 1,
    code: r.code ?? '',
    message: r.message ?? '',
    /* the row's message already carries the engine's own fix clause where one
       exists; the fix slot points at the teacher rather than paraphrasing */
    fix: r.code ? `nika explain ${r.code}` : '',
  }))
}

let loading: Promise<OracleInfo> | null = null

/** Load the artifact, register the oracle, return its provenance.
    Memoised; client-only (call from an effect). */
export function loadCheckOracle(): Promise<OracleInfo> {
  loading ??= (async () => {
    const wasm = await import('./pkg/nika_check_wasm.js')
    /* web-target init resolves the .wasm beside the glue via import.meta.url —
       Vite turns that into a hashed asset; the chunk and the wasm both load
       only on this call, never in the entry */
    await wasm.default()
    const probe = JSON.parse(wasm.check('nika: v1\n')) as { legs?: string[] }
    const info: OracleInfo = {
      engine: wasm.engine_version(),
      legs: probe.legs ?? [],
    }
    const oracle: NikaOracle = {
      check: (src: string) => rowsToDiags(wasm.check(src)),
    }
    ;(globalThis as { NikaOracle?: NikaOracle }).NikaOracle = oracle
    return info
  })()
  return loading
}
