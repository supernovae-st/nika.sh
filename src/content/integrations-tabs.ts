/* ─── integrations-tabs · the chrome-lean strip of the register ───────────────
   id + name + kind only, ZERO prose — the map and the sitemap render
   nothing heavier, and the full authored module (integrations.ts) must
   never re-join the initial chunk on their account (register-diet law).
   LITERAL on purpose: deriving from INTEGRATIONS would drag the whole
   module back into the entry graph. The drift gate (integrations.test.ts)
   pins this strip to the full register, row for row. */

export const INTEGRATION_TABS: { id: string; name: string; kind: 'client' | 'surface' }[] = [
  { id: 'claude-code', name: 'Claude Code', kind: 'client' },
  { id: 'codex', name: 'Codex', kind: 'client' },
  { id: 'cursor', name: 'Cursor', kind: 'client' },
  { id: 'vscode', name: 'VS Code · Windsurf · VSCodium', kind: 'client' },
  { id: 'hermes', name: 'Hermes · skills.sh clients', kind: 'client' },
  { id: 'mcp', name: 'any MCP client', kind: 'client' },
  { id: 'engine', name: 'the engine', kind: 'surface' },
  { id: 'spec', name: 'the spec', kind: 'surface' },
  { id: 'registry', name: 'the registry', kind: 'surface' },
  { id: 'client-sdk', name: 'the TypeScript client', kind: 'surface' },
  { id: 'audit-workflow', name: 'the site-audit flagship', kind: 'surface' },
  { id: 'docs', name: 'the docs', kind: 'surface' },
  { id: 'homebrew', name: 'the tap', kind: 'surface' },
  { id: 'website', name: 'this site', kind: 'surface' },
]
