/* ─── releases-lib · pure derivations over the vendored record ────────────────
   Everything the /releases instrument draws is computed HERE from the rows
   the access door hands over: the cadence geometry, the asset-kind census,
   the sizes. No import of the record itself (the door stays the door) and
   no Date.now(): the axis is built from the record's own dates, so SSR and
   client derive the same bytes. */
import type { EngineRelease, ReleaseAsset } from '../content/releases.generated'

/** 'YYYY-MM-DD' parses as UTC midnight per spec · deterministic everywhere */
const day = (d: string) => Date.parse(d)

export interface CadenceTick {
  tag: string
  /** 0..100 · position on the real time axis */
  left: number
  /** px · bar height, seated on the asset count */
  h: number
  latest: boolean
  label: string
}

export function cadence(releases: EngineRelease[]): {
  ticks: CadenceTick[]
  spanDays: number
  medianGapDays: number
} {
  if (releases.length === 0) return { ticks: [], spanDays: 0, medianGapDays: 0 }
  const rows = [...releases].reverse() /* oldest → newest for the axis */
  const t0 = day(rows[0].date)
  const t1 = day(rows[rows.length - 1].date)
  const span = Math.max(1, t1 - t0)
  /* same-day releases share an x · nudge each sibling a hair right so both
     ticks exist (the record HAS same-day trains · never hide one) */
  const seen = new Map<string, number>()
  const ticks = rows.map((r, i) => {
    const nth = seen.get(r.date) ?? 0
    seen.set(r.date, nth + 1)
    return {
      tag: r.tag,
      left: ((day(r.date) - t0) / span) * 100 + nth * 0.9,
      h: Math.min(40, 12 + r.assets.length * 3),
      latest: i === rows.length - 1,
      label: `${r.tag} · ${r.date} · ${r.assets.length} assets`,
    }
  })
  const gaps: number[] = []
  for (let i = 1; i < rows.length; i++) {
    const g = (day(rows[i].date) - day(rows[i - 1].date)) / 86_400_000
    if (g > 0) gaps.push(g)
  }
  gaps.sort((a, b) => a - b)
  return {
    ticks,
    spanDays: Math.round((t1 - t0) / 86_400_000),
    medianGapDays: gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0,
  }
}

/** the kind census · derived from the names the train itself uploaded */
export function kindChips(assets: ReleaseAsset[]): string[] {
  let bin = 0
  let sums = 0
  let att = 0
  let wasm = 0
  for (const a of assets) {
    if (a.name.includes('check-wasm')) wasm++
    else if (a.name.endsWith('.tar.gz')) bin++
    else if (a.name === 'SHA256SUMS') sums++
    else if (a.name.endsWith('.intoto.jsonl')) att++
  }
  const chips: string[] = []
  if (bin) chips.push(`◆ ${bin} ${bin === 1 ? 'binary' : 'binaries'}`)
  if (sums) chips.push('Σ sums')
  if (att) chips.push('⬒ attestation')
  if (wasm) chips.push('▣ wasm')
  return chips
}

export const fmtWeight = (bytes: number) =>
  bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(1)} GB`
    : `${Math.round(bytes / 1024 ** 2)} MB`
