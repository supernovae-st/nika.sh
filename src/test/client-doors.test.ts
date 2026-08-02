import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CLIENT_DOOR_PATHS, PATHS } from '../../site.config'
import { CLIENT_IDS } from '../content/catalog-paths.generated'
import { CLIENTS } from '../content/catalog.generated'
import { INTEGRATION_TABS } from '../content/integrations-tabs'
import {
  CLIENT_DOOR_IDS,
  CLIENT_ROOMS_ELSEWHERE,
  CLIENT_ROOM_ALIAS,
  clientRoomHref,
} from '../content/client-doors'

/* ─── the client doors · every row in the coverage matrix lands ──────────────
   The matrix listed 31 clients and linked 5 of them; the other 26 — four of
   them PROVEN live — were plain text on a page whose whole job is « get
   Nika into your stack ». These laws hold the repair:

     1 · every client the binary knows has a room, and it is served
     2 · site.config's literal filter and the authored module agree
     3 · an alias points at a room that EXISTS (a rename must not orphan)
     4 · no door room shadows an authored lane
     5 · the lens second-producer derives the same list site.config does */

describe('the client doors', () => {
  it('sends all 31 client ids to a SERVED room', () => {
    const served = new Set(PATHS)
    expect(CLIENTS.length).toBe(31)
    for (const c of CLIENTS) {
      const href = clientRoomHref(c.id)
      expect(served.has(href), `${c.id} → ${href} is not served`).toBe(true)
    }
  })

  it('agrees with site.config, id for id', () => {
    expect(CLIENT_DOOR_IDS.map((id) => `/integrations/${id}`)).toEqual(CLIENT_DOOR_PATHS)
  })

  it('derives its ids from the pin-sourced strip, in matrix order', () => {
    expect(CLIENT_DOOR_IDS).toEqual(CLIENT_IDS.filter((id) => !CLIENT_ROOMS_ELSEWHERE.has(id)))
  })

  it('aliases only onto rooms that exist', () => {
    const authored = new Set(INTEGRATION_TABS.map((t) => t.id))
    for (const [from, to] of Object.entries(CLIENT_ROOM_ALIAS)) {
      expect(CLIENT_IDS, `${from} is not a client id`).toContain(from)
      expect(authored, `${from} aliases onto ${to}, which is not an authored lane`).toContain(to)
    }
  })

  it('never shadows an authored lane', () => {
    const authored = new Set(INTEGRATION_TABS.map((t) => t.id))
    for (const id of CLIENT_DOOR_IDS) expect(authored.has(id)).toBe(false)
  })

  /* the lens gate re-derives this list from the SOURCES (second-producer
     law) with its own parser — that parser reads client-doors.ts by regex,
     so a rename of the two exports would silently empty its « elsewhere »
     set and hand every id a door. Pinning the shape here is what makes the
     rename loud. */
  it('keeps the shape the lens parser reads', () => {
    const src = readFileSync(join(__dirname, '../content/client-doors.ts'), 'utf8')
    expect(src).toMatch(/CLIENT_ROOMS_ELSEWHERE = new Set\(\[/)
    expect(src).toMatch(/CLIENT_ROOM_ALIAS: Record<string, string> = \{/)
    const setBlock = src.match(/CLIENT_ROOMS_ELSEWHERE = new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? ''
    const parsed = [...setBlock.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1])
    expect(parsed.length).toBeGreaterThan(0)
    for (const id of parsed) expect(CLIENT_ROOMS_ELSEWHERE.has(id)).toBe(true)
  })
})
