/* ─── client-doors · which client id lands in which room ─────────────────────
   The coverage matrix on /integrations names 31 client doors. Five of them
   are AUTHORED lanes with their own prose room (claude-code · codex ·
   cursor · vscode · hermes), and one — the catalog's « mcp-generic » — is
   the authored « mcp » lane wearing the catalog's name for it. The other
   25 get a door room: what the released binary proves about them, nothing
   authored, nothing invented.

   site.config.ts holds the same fact as a literal (its census evaluates
   that file as plain JS and cannot follow an import), and
   src/test/client-doors.test.ts pins the two together row for row. */
import { CLIENT_IDS } from './catalog-paths.generated'

/** the catalog id → the authored room that already covers it */
export const CLIENT_ROOM_ALIAS: Record<string, string> = { 'mcp-generic': 'mcp' }

/** ids whose room lives elsewhere: an authored lane at its own id, or an alias */
export const CLIENT_ROOMS_ELSEWHERE = new Set([
  'claude-code',
  'codex',
  'cursor',
  'vscode',
  'hermes',
  ...Object.keys(CLIENT_ROOM_ALIAS),
])

/** the door rooms, in matrix order — the walk reads this */
export const CLIENT_DOOR_IDS: string[] = CLIENT_IDS.filter((id) => !CLIENT_ROOMS_ELSEWHERE.has(id))

/** where a matrix row points · every one of the 31 lands somewhere alive */
export function clientRoomHref(id: string): string {
  return `/integrations/${CLIENT_ROOM_ALIAS[id] ?? id}`
}
