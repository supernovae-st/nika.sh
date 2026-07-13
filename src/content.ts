import { CANON } from './canon.generated'

/* ─── all copy + code on the page · verified against nika-spec (spec/02-verbs.md ·
       spec/01-envelope.md · stdlib/builtins-v0.1.md) — never invent YAML ─── */

export const REPO = 'https://github.com/supernovae-st/nika'
export const SPEC = 'https://github.com/supernovae-st/nika-spec'
export const DOCS = 'https://docs.nika.sh'

/* the CURRENT engine release · the ONE hand-maintained version string on the
   site (hero plate · FAQ · changelog head · /spec invariant all interpolate it).
   TODO: CI-refresh — canon.generated.ts carries spec counts, not the engine
   version; bump this ONE const with each release until a version projection
   exists. public/llms.txt is static — update it in the same commit. */
export const ENGINE_VERSION = 'v0.103.0'

/* the canonical site origin (matches react-ssg.config.ts `origin`). */
export const SITE = 'https://nika.sh'

/* Per-route <head> canonical + og:url. The base index.html declares the HOME
   canonical/og:url; without this every prerendered route would inherit
   `https://nika.sh/` (telling crawlers each page IS the homepage). useHead's
   `link` + `meta` are flushed into each route's static HTML by
   vite-plugin-react-ssg, so the canonical/og:url ship correct per route.
   Pass the route path (e.g. '/spec'); '/' yields the bare origin + trailing slash. */
export function routeHead(path: string): {
  link: { rel: 'canonical'; href: string }[]
  meta: { property: 'og:url'; content: string }[]
} {
  const url = path === '/' ? `${SITE}/` : `${SITE}${path}`
  return {
    link: [{ rel: 'canonical', href: url }],
    meta: [{ property: 'og:url', content: url }],
  }
}

/* §2 · the four verbs — snippets are verbatim spec shapes (02-verbs.md) */
export const VERBS: { verb: string; tagline: string; body: string; code: string }[] = [
  {
    verb: 'infer',
    tagline: 'Call a model',
    body: `Any of ${CANON.providers} providers: Ollama, Mistral, Anthropic, OpenAI and more. You pick, per task or per file.`,
    code: `- id: research
  infer:
    prompt: "Research \${{ vars.topic }}"`,
  },
  {
    verb: 'exec',
    tagline: 'Run a process',
    body: 'A real command on your machine. stdout becomes the task output, exit codes become errors.',
    code: `- id: build
  exec:
    command: ["cargo", "build", "--release"]`,
  },
  {
    verb: 'invoke',
    tagline: 'Call a tool',
    body: `${CANON.builtins} nika: builtins (read, write, fetch, jq) plus any mcp: server you already use.`,
    code: `- id: read_config
  invoke:
    tool: "nika:read"
    args:
      path: ./config.yaml`,
  },
  {
    verb: 'agent',
    tagline: 'Drive a loop',
    body: 'An autonomous tool-use loop. Tools are default-deny. The whitelist is in the file, reviewable.',
    code: `- id: research
  agent:
    prompt: "Research \${{ vars.topic }}"
    tools: ["nika:fetch"]`,
  },
]

/* §3 · the method — the two-tier wedge */

/* ─── §use-cases · concrete workflows anyone can picture ───────────────────
   Each card: what it does in plain words + the verbs it uses. The site-audit
   one is REAL (supernovae-st/nika-site-audit ships today). */
/* ─── §versus · why a file beats the alternatives (direct, no jargon) ─── */
export interface Versus {
  them: string
  fate: string
  themLines: string[]
  nika: string
  nikaLines: string[]
}

export const VERSUS: Versus[] = [
  {
    them: 'Chat sessions',
    fate: 'evaporates',
    themLines: ['Great for exploring', 'Gone when the tab closes', 'Different answer every time'],
    nika: 'A file you keep',
    nikaLines: ['Runs again tomorrow', 'Same steps, same order', 'Diff it like code'],
  },
  {
    them: 'Glue scripts',
    fate: 'rots',
    themLines: ['200 lines of Python + retries', 'One person understands it', 'Breaks when an API changes'],
    nika: 'Four verbs',
    nikaLines: ['The YAML is the logic', 'Anyone can read it', 'Engine handles retries & order'],
  },
  {
    them: 'Cloud automations',
    fate: 'metered',
    themLines: ['Runs on their servers', 'Per-seat, per-run pricing', 'Your data leaves the building'],
    nika: 'Your machine',
    nikaLines: ['One binary, runs local', 'Free, AGPL forever', 'Nothing leaves unless you say so'],
  },
]
