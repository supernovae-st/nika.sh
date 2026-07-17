/* ─── chords.ts · the g-chord table + the shortcuts registry (round-2A) ──────
   ONE written table (the plan's law): the sequential listener in RootLayout
   and the `?` overlay both render from HERE — the overlay can never teach a
   chord the listener does not speak. The vitest gate holds every target to
   a served route (the palette's PATHS law) and the table unique. */

export interface NavChord {
  key: string
  to: string
  label: string
}

/* g + letter → navigate. Every target must be a served route (gate-held) —
   /sources joined the table the day the page landed. */
export const NAV_CHORDS: NavChord[] = [
  { key: 'm', to: '/map', label: 'the map' },
  { key: 'f', to: '/flow', label: 'the flow' },
  { key: 'e', to: '/errors', label: 'the error register' },
  { key: 't', to: '/tools', label: 'the standard library' },
  { key: 'l', to: '/language', label: 'the language register' },
  { key: 's', to: '/sources', label: 'the sources' },
]

export interface ShortcutRow {
  keys: string
  does: string
}
export interface ShortcutGroup {
  id: string
  title: string
  rows: ShortcutRow[]
}

/* the overlay's truth: Navigation derives from NAV_CHORDS (never a second
   list) · the palette group states what CommandK actually binds today. */
export function shortcutGroups(): ShortcutGroup[] {
  return [
    {
      id: 'navigation',
      title: 'Navigation',
      rows: [
        ...NAV_CHORDS.map((c) => ({ keys: `g ${c.key}`, does: c.label })),
        { keys: '?', does: 'this overlay' },
      ],
    },
    {
      id: 'palette',
      title: 'Palette',
      rows: [
        { keys: '⌘K / Ctrl K', does: 'open the palette' },
        { keys: 'e: t: v: w: s:', does: 'scope a register' },
        { keys: '↑ ↓ ↵', does: 'move and open' },
        { keys: 'esc', does: 'close' },
      ],
    },
  ]
}
