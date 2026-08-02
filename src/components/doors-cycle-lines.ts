import type { ClientDoor } from '../content/catalog.generated'

/* the cycle DERIVES from the ClientDoor matrix (clients.yaml → catalog
   projection · the kit-native SSOT) — proven marketplace doors only
   (`<client> plugin …` · `npx skills …`), commands verbatim, the registry's
   parenthetical annotations cut at the first « ( ». Never hand-typed:
   src/test/doors-cycle.test.ts holds the edges AND the live matrix. */

export const DOOR_RE = /^(?:[a-z]+ plugin |npx skills )/

export function doorCycleLines(doors: ClientDoor[]): { name: string; cmd: string }[] {
  return doors
    .filter((d) => d.status === 'proven' && d.install && DOOR_RE.test(d.install))
    .map((d) => ({ name: d.name, cmd: (d.install as string).split(' (')[0].trim() }))
}
