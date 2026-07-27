/* types for the constellation layout (map.test.ts imports the real .mjs —
   the module stays plain JS so the compiler and the test share one body) */

export interface ConstellationSector {
  id: string
  title: string
  url: string
  exists: boolean
  n: number
  a0: number
  a1: number
  mid: number
}

export interface ConstellationSetDot {
  id: string
  title: string
  url: string | null
  layer: string
  surface: string
  page_exists: boolean
  count: number
  angle: number
  x: number
  y: number
  r: number
}

export interface ConstellationStar {
  id: string
  title: string
  url: string | null
  anchor: string | null
  set: string
  layer: string
  hollow: boolean
  x: number
  y: number
}

export interface ConstellationAggregate {
  set: string
  count: number
  url: string | null
  x: number
  y: number
}

export interface ConstellationLink {
  kind: string
  from: string
  to: string
  weight: number
  w: number
  path: string
}

export interface ConstellationGeometry {
  size: number
  center: number
  ring: { layers: number; sets: number; members: number; labels: number }
  layers: ConstellationSector[]
  sets: ConstellationSetDot[]
  members: ConstellationStar[]
  aggregates: ConstellationAggregate[]
  links: ConstellationLink[]
}

export const RING: { layers: number; sets: number; members: number; labels: number }
export const SIZE: number
export const CENTER: number
export const LINK_KINDS: string[]

export function layoutConstellation(
  twin: unknown,
  opts?: { topN?: number },
): ConstellationGeometry
