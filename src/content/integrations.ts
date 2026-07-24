/* ─── integrations · get Nika into your stack, as a register ──────────────────
   Two kinds of entry, one register:

   · CLIENT — where a human plugs Nika into a tool they already run
     (Claude Code · Codex · Cursor · VS Code · Hermes · any MCP client).
     Named after the CLIENT because that is how people search (Ahrefs
     2026-07-24: « claude skills » 12.7k/mo · « mcp server » ~15k ·
     « claude code plugins » 2.6k — nobody searches « ecosystem »).
   · SURFACE — a public repo of the ecosystem (engine · spec · registry ·
     SDK · docs · tap · the site itself), the reference wing.

   AUTHORED here, but README-true: every claim and every command is
   lifted from the repos' own READMEs (the repo is the SSOT; this module
   is its projection). The drift gate (integrations.test.ts) pins the id
   set against INTEGRATION_PATHS, requires an install ritual per entry,
   and checks every internal door resolves to a prerendered route.
   Client order = install reach · surface order = the meeting path. */

export interface IntegrationEntry {
  /** the room slug — /integrations/<id> */
  id: string
  kind: 'client' | 'surface'
  name: string
  /** the intent-bearing title head — the page renders `${title} · Nika` */
  title: string
  /** the GitHub source this entry projects */
  repo: string
  license: string
  /** one README-true line: what you get */
  what: string
  /** how it works — the teaching paragraph */
  how: string
  /** the install / first-use ritual (verbatim commands) */
  install: { text: string; code?: string }[]
  /** « if you also run … » — the both-at-once pairing (client rooms) */
  also?: { text: string; href: string; label: string }
  /** the site rooms this surface touches (internal, prerendered) */
  doors: { label: string; href: string }[]
  /** the external homes (marketplace · registry · live host) */
  external?: { label: string; href: string }[]
  /** what lands in the agent (the plugin-kit clients) — names verbatim
      from the agents repo; the mcp tools link their own rooms */
  kit?: { skills: string[]; subagents: string[]; commands: string[]; mcpTools: string[] }
}

/* the kit's contents, once (the agents repo ships ONE kit to every client) */
const AGENT_KIT = {
  skills: ['nika-authoring', 'nika-debugging', 'nika-operating', 'nika-migration'],
  subagents: ['nika-author', 'nika-debugger', 'nika-migrator'],
  commands: ['/nika:check', '/nika:explain', '/nika:new', '/nika:trace', '/nika:permits'],
  mcpTools: [
    'nika_check',
    'nika_inspect',
    'nika_explain',
    'nika_schema',
    'nika_examples',
    'nika_template',
    'nika_canon',
    'nika_catalog',
    'nika_tools',
  ],
}

const AGENTS_REPO = 'https://github.com/supernovae-st/nika-agents'

export const INTEGRATIONS: IntegrationEntry[] = [
  /* ── the clients · plug it into what you already run ─────────────────── */
  {
    id: 'claude-code',
    kind: 'client',
    name: 'Claude Code',
    title: 'Nika for Claude Code · plugin, skills, MCP server',
    repo: AGENTS_REPO,
    license: 'MIT',
    what: 'One plugin install hands the agent the whole kit: 4 skills, 3 subagents, 5 slash commands, the read-only MCP oracle and the seatbelt hooks.',
    how: 'The agent authors a plain-text workflow it can `nika check` before a token is spent and `nika trace verify` after. The oracle answers read-only (check · inspect · explain · schema · examples · template · canon · catalog · tools); the subagents author, debug and migrate; `/nika:check` is one keystroke. Updating is TWO rungs by design — refresh the marketplace clone, then move the install — because an install once sat three releases behind, silently, with a fresh clone right next to it.',
    install: [
      { text: 'Add the marketplace', code: 'claude plugin marketplace add supernovae-st/nika-agents' },
      { text: 'Install the kit', code: 'claude plugin install nika@nika' },
      { text: 'Update, both rungs', code: 'claude plugin marketplace update nika && claude plugin update nika@nika' },
    ],
    also: {
      text: 'Editing the files in VS Code too? The extension draws the DAG the agent writes.',
      href: '/integrations/vscode',
      label: 'the editor extension',
    },
    doors: [
      { label: 'the oracle, one room per tool', href: '/mcp/nika_check' },
      { label: 'the skeletons it scaffolds from', href: '/templates' },
      { label: 'the proof it can verify', href: '/proof' },
    ],
    kit: AGENT_KIT,
  },
  {
    id: 'codex',
    kind: 'client',
    name: 'Codex',
    title: 'Nika for Codex · the same kit, the same marketplace',
    repo: AGENTS_REPO,
    license: 'MIT',
    what: 'Codex installs the identical plugin kit from the identical repo — skills, subagents, commands, the MCP oracle.',
    how: 'One marketplace, every client: the kit is authored once and served to Claude Code and Codex from the same source, so the delegation idiom never forks. The agent drafts the workflow, `nika check` audits it before anything runs, the trace verifies after.',
    install: [
      { text: 'Add the marketplace', code: 'codex plugin marketplace add supernovae-st/nika-agents' },
      { text: 'Install the kit', code: 'codex plugin add nika@nika' },
      { text: 'Upgrade later', code: 'codex plugin marketplace upgrade nika' },
    ],
    also: {
      text: 'Running Claude Code as well? Same marketplace, same two commands.',
      href: '/integrations/claude-code',
      label: 'Nika for Claude Code',
    },
    doors: [
      { label: 'the oracle, one room per tool', href: '/mcp/nika_check' },
      { label: 'the four verbs it writes', href: '/verbs' },
    ],
    kit: AGENT_KIT,
  },
  {
    id: 'cursor',
    kind: 'client',
    name: 'Cursor',
    title: 'Nika for Cursor · the plugin and the extension, together',
    repo: AGENTS_REPO,
    license: 'MIT',
    what: 'Cursor takes BOTH halves: the plugin bundle (rule · skill · subagent · commands · hooks · MCP) from its marketplace, and the editor extension from Open VSX.',
    how: 'Search « nika » in Settings → Plugins: one Add installs the full bundle. Teams wire this repo as a team marketplace (Dashboard → Plugins). Until the listing serves you, `nika init` equips the repo fully — rules, MCP, the three subagents, the seatbelt hooks. The extension is the other half: the live DAG on the file the agent writes.',
    install: [
      { text: 'The plugin: search « nika » in Settings → Plugins, one Add.' },
      { text: 'Or equip the repo directly', code: 'nika init' },
      { text: 'The extension rides Open VSX', code: 'code --install-extension supernovae.nika-lang' },
    ],
    also: {
      text: 'The two halves compose: the agent writes the file, the extension draws it.',
      href: '/integrations/vscode',
      label: 'the extension, in depth',
    },
    doors: [
      { label: 'the boundary the chips draw', href: '/boundary' },
      { label: 'the language it highlights', href: '/language' },
    ],
    external: [{ label: 'Open VSX', href: 'https://open-vsx.org/extension/supernovae/nika-lang' }],
    kit: AGENT_KIT,
  },
  {
    id: 'vscode',
    kind: 'client',
    name: 'VS Code · Windsurf · VSCodium',
    title: 'Nika for VS Code · the extension (Cursor and Windsurf too)',
    repo: 'https://github.com/supernovae-st/nika-vscode',
    license: 'MIT',
    what: 'A .nika.yaml file becomes a live graph: prompts on the cards, wires carrying named data, permits as chips. See the DAG before you run it.',
    how: 'Syntax, diagnostics and the DAG view ride the served contract: files validate against the same workflow.schema.json this site serves, via the yaml-language-server line the extension writes for you. Local traces, your models — the extension never phones home.',
    install: [
      { text: 'From the CLI', code: 'code --install-extension supernovae.nika-lang' },
      { text: 'Cursor, Windsurf and VSCodium install the same id from Open VSX.' },
    ],
    also: {
      text: 'Running an agent in the terminal next to it? Hand it the plugin kit.',
      href: '/integrations/claude-code',
      label: 'the agent pack',
    },
    doors: [
      { label: 'the served schema, word by word', href: '/language' },
      { label: 'the boundary it draws', href: '/boundary' },
    ],
    external: [
      { label: 'VS Code Marketplace', href: 'https://marketplace.visualstudio.com/items?itemName=supernovae.nika-lang' },
      { label: 'Open VSX', href: 'https://open-vsx.org/extension/supernovae/nika-lang' },
    ],
  },
  {
    id: 'hermes',
    kind: 'client',
    name: 'Hermes · skills.sh clients',
    title: 'Nika for Hermes · a skill that delegates',
    repo: AGENTS_REPO,
    license: 'MIT',
    what: 'The Hermes-facing skill teaches the delegation idiom: Hermes orchestrates, Nika executes — repeatable work leaves the chat and becomes a checkable file.',
    how: 'The skill ships in the agentskills.io shape, so any skills.sh-compatible client can install it. The agent keeps the conversation; the workflow file keeps the work — checked before it runs, traced after, reusable forever.',
    install: [
      { text: 'Tap the marketplace', code: 'hermes skills tap add supernovae-st/nika-agents' },
      { text: 'Any skills.sh client', code: 'npx skills add supernovae-st/nika-agents' },
    ],
    doors: [
      { label: 'the skeletons it reaches for', href: '/templates' },
      { label: 'the cost line it respects', href: '/boundary' },
    ],
    external: [{ label: 'skills.sh listing', href: 'https://skills.sh/supernovae-st/nika-agents' }],
  },
  {
    id: 'mcp',
    kind: 'client',
    name: 'any MCP client',
    title: 'The Nika MCP server · read-only, in the binary',
    repo: 'https://github.com/supernovae-st/nika',
    license: 'AGPL-3.0-or-later',
    what: 'The binary IS the MCP server: `nika mcp` serves 9 read-only tools — check, inspect, explain, schema, examples, template, canon, catalog, tools.',
    how: 'No separate server to install or trust: the same binary that runs workflows answers the oracle, read-only by construction. Zed, Warp and friends wire in one command with `nika wire <client>`; anything else takes the plain config line: command `nika`, args `["mcp"]`.',
    install: [
      { text: 'Wire a known client', code: 'nika wire cursor' },
      { text: 'Any other client', code: '{"command": "nika", "args": ["mcp"]}' },
    ],
    doors: [
      { label: 'the nine tools, one room each', href: '/mcp/nika_check' },
      { label: 'the proof surfaces', href: '/proof' },
    ],
  },

  /* ── the surfaces · the public repos behind the doors ────────────────── */
  {
    id: 'engine',
    kind: 'surface',
    name: 'the engine',
    title: 'The Nika engine · one binary: check, run, trace',
    repo: 'https://github.com/supernovae-st/nika',
    license: 'AGPL-3.0-or-later',
    what: 'The reference engine: one Rust binary that checks, prices, runs and traces workflow files.',
    how: 'A file goes through `nika check` before anything runs: conformance, the DAG, model resolution, the cost envelope, secrets flow, permits. `nika run` executes with the boundary enforced by the process and writes a hash-chained trace; `nika trace verify` recomputes the chain. Everything the site claims is re-proven against this binary.',
    install: [
      { text: 'One line', code: 'curl -fsSL https://nika.sh/install.sh | sh' },
      { text: 'or Homebrew', code: 'brew install supernovae-st/tap/nika' },
      { text: 'then prove the seat', code: 'nika doctor' },
    ],
    doors: [
      { label: 'install, walked through', href: '/install' },
      { label: 'the four verbs', href: '/verbs' },
      { label: 'the proof surfaces', href: '/proof' },
    ],
    external: [{ label: 'releases', href: 'https://github.com/supernovae-st/nika/releases' }],
  },
  {
    id: 'spec',
    kind: 'surface',
    name: 'the spec',
    title: 'The Nika spec · the contract everything derives from',
    repo: 'https://github.com/supernovae-st/nika-spec',
    license: 'Apache-2.0',
    what: 'The language specification: nine chapters, the JSON Schema, the canon counts, the template pack, the conformance suite.',
    how: 'The envelope line is locked at v1 forever and evolves additively (the SQL / Dockerfile contract model); the reference engine versions separately. Everything countable on this site derives from the spec’s canon.yaml — never hand-typed — and every skeleton is conformance-gated upstream on every spec push.',
    install: [
      { text: 'Read it where it lives', code: 'git clone https://github.com/supernovae-st/nika-spec' },
      { text: 'or walk the served projections below.' },
    ],
    doors: [
      { label: 'the spec at a glance', href: '/spec' },
      { label: 'every language word', href: '/language' },
      { label: 'how the site tells the truth', href: '/sources' },
    ],
  },
  {
    id: 'registry',
    kind: 'surface',
    name: 'the registry',
    title: 'The Nika registry · share workflows, nothing on faith',
    repo: 'https://github.com/supernovae-st/nika-registry',
    license: 'Apache-2.0',
    what: 'The npm-of-workflows: share workflow files as verified, content-pinned entries.',
    how: 'Every entry is pinned to an exact source revision and re-proven by CI: hash, conformance oracle, engine certificate, advisories. The binary pulls with `nika run registry:owner/name` — cached, offline-capable, and the workflow’s own permits never govern the fetch. Never install an LLM-suggested name without resolving it there first.',
    install: [
      { text: 'Audit it first, always', code: 'nika check registry:owner/name@version' },
      { text: 'Then run it', code: 'nika run registry:owner/name@version' },
    ],
    doors: [
      { label: 'the chain of custody, taught', href: '/proof' },
      { label: 'the boundary that holds', href: '/boundary' },
    ],
    external: [
      { label: 'the machine index', href: 'https://raw.githubusercontent.com/supernovae-st/nika-registry/main/index.json' },
    ],
  },
  {
    id: 'client-sdk',
    kind: 'surface',
    name: 'the TypeScript client',
    title: 'The Nika TS client · typed, zero-dependency, honest',
    repo: 'https://github.com/supernovae-st/nika-client',
    license: 'MIT',
    what: 'A typed, zero-dependency TS client: drive the shipped binary today, target the future serve API without pretending.',
    how: 'The /local module works TODAY against the binary: `check --json`, the `run --json` event stream, the dry-run plan object, `test`, `trace verify` — typed end to end. The root module targets the future `nika serve` HTTP API and says so plainly.',
    install: [{ text: 'Install', code: 'npm install @supernovae-st/nika-client' }],
    doors: [
      { label: 'the machine catalogs it mirrors', href: '/map' },
      { label: 'the error codes it types', href: '/errors' },
    ],
  },
  {
    id: 'audit-workflow',
    kind: 'surface',
    name: 'the site-audit flagship',
    title: 'nika-site-audit · a full SEO audit as one file',
    repo: 'https://github.com/supernovae-st/nika-site-audit',
    license: 'Apache-2.0',
    what: 'A full SEO + GEO site audit as ONE workflow file: discover, crawl bounded, score deterministically, one narrated verdict.',
    how: 'Ten tasks, five waves — and the diagram in its README is generated by `nika inspect --format mermaid`, not drawn by hand. The whole audit is checked before a single request leaves your machine; artifacts land as receipts. The pattern for real work: a repo whose product IS a workflow file.',
    install: [
      { text: 'Offline verdict first (mock model)', code: 'nika run site-audit.nika.yaml' },
      { text: 'then point it at a site and a real model.' },
    ],
    doors: [
      { label: 'the same patterns, taught', href: '/use-cases' },
      { label: 'the skeletons it grew from', href: '/templates' },
    ],
  },
  {
    id: 'docs',
    kind: 'surface',
    name: 'the docs',
    title: 'docs.nika.sh · the hand-held path',
    repo: 'https://github.com/supernovae-st/nika-docs',
    license: 'MIT',
    what: 'The task-oriented documentation, built by Mintlify from a public source repo.',
    how: 'A docs.json navigation plus .mdx pages; every merge to main deploys. The repo runs its own drift gate in CI so the docs never silently disagree with the shipped engine. This site is the reference register; the docs are the hand-held path.',
    install: [{ text: 'Nothing to install — read it live.' }],
    doors: [
      { label: 'learn, the short path', href: '/learn' },
      { label: 'this site’s own map', href: '/map' },
    ],
    external: [{ label: 'docs.nika.sh', href: 'https://docs.nika.sh' }],
  },
  {
    id: 'homebrew',
    kind: 'surface',
    name: 'the tap',
    title: 'The Homebrew tap · one command, one binary',
    repo: 'https://github.com/supernovae-st/homebrew-tap',
    license: 'MIT',
    what: 'The official Homebrew tap, tracking the latest tagged release.',
    how: 'The formula pins the exact release and its checksums; `brew upgrade` follows the tags. The pin lives in Formula/nika.rb — never repeated in prose, because a repeated number is a number that rots.',
    install: [{ text: 'Install', code: 'brew install supernovae-st/tap/nika' }],
    doors: [{ label: 'every install path', href: '/install' }],
  },
  {
    id: 'website',
    kind: 'surface',
    name: 'this site',
    title: 'nika.sh · the reference register, re-proven in CI',
    repo: 'https://github.com/supernovae-st/nika.sh',
    license: 'MIT',
    what: 'nika.sh itself: every page a projection of pinned sources, every count derived, every claim re-proven in CI.',
    how: 'The atlas compiles one graph of the whole language and the coverage gates hold the site to it: every citable element owns a room, every register links its rooms, the machine twins (catalogs · schema · ontology · llms.txt) serve the same facts the pages render. The page that teaches the machinery also names what it does not cover yet.',
    install: [{ text: 'You are here. Machines start at', code: 'https://nika.sh/llms.txt' }],
    doors: [
      { label: 'how this site tells the truth', href: '/sources' },
      { label: 'every page, one graph', href: '/map' },
    ],
  },
]

export const INTEGRATION_INDEX: Record<string, IntegrationEntry> = Object.fromEntries(
  INTEGRATIONS.map((e) => [e.id, e]),
)

export const INTEGRATION_CLIENTS = INTEGRATIONS.filter((e) => e.kind === 'client')
export const INTEGRATION_SURFACES = INTEGRATIONS.filter((e) => e.kind === 'surface')

/** the full kit — the composite ritual for someone with all three lanes */
export const FULL_KIT: { text: string; code: string }[] = [
  { text: 'the binary', code: 'curl -fsSL https://nika.sh/install.sh | sh' },
  { text: 'the editor', code: 'code --install-extension supernovae.nika-lang' },
  {
    text: 'the agent',
    code: 'claude plugin marketplace add supernovae-st/nika-agents && claude plugin install nika@nika',
  },
]
