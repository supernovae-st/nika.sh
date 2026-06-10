/* ─── §transform · the showpiece data ────────────────────────────────────────
   A REAL workflow (spec-correct · 02-verbs.md + stdlib/builtins-v0.1.md):
   5 tasks · diamond DAG · two parallel branches that merge into an agent.
   Each line carries optional events: spawn a node · draw an edge. */

/** section progress 0..1 · written by the Transform section's rAF,
    read every frame by the DAG scene (module-mutable · zero re-renders) */
export const tw = { t: 0 }

export type Verb = 'infer' | 'exec' | 'invoke' | 'agent'

export const VERB_COLOR: Record<Verb, string> = {
  infer: '#5b8cff', // brand blue — call a model
  exec: '#ff7a3c', // ember — run a process
  invoke: '#22d3ee', // cyan — call a tool
  agent: '#b07bff', // violet — drive a loop
}

export interface DagNode {
  id: string
  verb: Verb
  /** diagram-local position */
  x: number
  y: number
  /** topological depth (drives the run wave) */
  depth: number
}

export const DAG_NODES: DagNode[] = [
  { id: 'fetch_news', verb: 'invoke', x: -2.7, y: 1.05, depth: 0 },
  { id: 'repo_log', verb: 'exec', x: -2.7, y: -1.05, depth: 0 },
  { id: 'digest', verb: 'infer', x: -0.15, y: 1.05, depth: 1 },
  { id: 'changelog', verb: 'infer', x: -0.15, y: -1.05, depth: 1 },
  { id: 'brief', verb: 'agent', x: 2.45, y: 0, depth: 2 },
]

export interface DagEdge {
  from: string
  to: string
}

export const DAG_EDGES: DagEdge[] = [
  { from: 'fetch_news', to: 'digest' },
  { from: 'repo_log', to: 'changelog' },
  { from: 'digest', to: 'brief' },
  { from: 'changelog', to: 'brief' },
]

export interface WfLine {
  text: string
  /** node id revealed by this line */
  spawn?: string
  /** edge(s) revealed by this line */
  edges?: number[]
}

/* the file, line by line — the typewriter reveals these in order */
export const WF_LINES: WfLine[] = [
  { text: 'nika: v1' },
  { text: 'workflow: weekly-radar' },
  { text: '' },
  { text: 'model: anthropic/claude-sonnet-4-6' },
  { text: 'vars:' },
  { text: '  topic:' },
  { text: '    type: string' },
  { text: '    required: true' },
  { text: '' },
  { text: 'tasks:' },
  { text: '  - id: fetch_news', spawn: 'fetch_news' },
  { text: '    invoke:' },
  { text: '      tool: nika:fetch' },
  { text: '      args:' },
  { text: '        url: "https://hn.algolia.com/api/v1/search?query=${{ vars.topic }}"' },
  { text: '        mode: jq' },
  { text: '        jq: ".hits[].title"' },
  { text: '' },
  { text: '  - id: repo_log', spawn: 'repo_log' },
  { text: '    exec:' },
  { text: '      command: "git log --oneline -20"' },
  { text: '' },
  { text: '  - id: digest', spawn: 'digest' },
  { text: '    depends_on: [fetch_news]', edges: [0] },
  { text: '    infer:' },
  { text: '      prompt: "Digest the signal: ${{ tasks.fetch_news.output }}"' },
  { text: '' },
  { text: '  - id: changelog', spawn: 'changelog' },
  { text: '    depends_on: [repo_log]', edges: [1] },
  { text: '    infer:' },
  { text: '      prompt: "Release notes from: ${{ tasks.repo_log.output }}"' },
  { text: '' },
  { text: '  - id: brief', spawn: 'brief' },
  { text: '    depends_on: [digest, changelog]', edges: [2, 3] },
  { text: '    agent:' },
  { text: '      prompt: "Merge both into one weekly brief"' },
  { text: '      tools: ["nika:write"]' },
  { text: '' },
  { text: 'outputs:' },
  { text: '  radar: ${{ tasks.brief.output }}' },
]

/* ── the t-timeline (section progress 0..1) ──
   0.00→0.58  typewriter reveals the lines (nodes spawn · edges draw)
   0.58→0.74  beat — the graph breathes, you read it
   0.74→1.00  RUN — the wave crosses the DAG in topological order */
export const T_TYPE_END = 0.58
export const T_RUN_START = 0.74

/** reveal time (in t) of line i */
export const lineT = (i: number) => ((i + 1) / WF_LINES.length) * T_TYPE_END

/* per-node spawn t + per-edge draw t, derived from line metadata */
export const NODE_T: Record<string, number> = {}
export const EDGE_T: number[] = new Array(DAG_EDGES.length).fill(1)
WF_LINES.forEach((l, i) => {
  if (l.spawn) NODE_T[l.spawn] = lineT(i)
  l.edges?.forEach((e) => (EDGE_T[e] = lineT(i)))
})

/* the pedagogy rail — 4 beats */
export const STEPS = [
  {
    at: 0.02,
    title: 'You write intent',
    body: 'Plain YAML. Four verbs: infer, exec, invoke, agent. A human reads it; a machine runs it.',
  },
  {
    at: 0.27,
    title: 'Bindings wire the data',
    body: '${{ tasks.x.output }} threads one task into the next. No glue code. The file IS the plumbing.',
  },
  {
    at: 0.5,
    title: 'The DAG falls out',
    body: 'depends_on declares order. Independent branches? They run in parallel, for free.',
  },
  {
    at: 0.74,
    title: 'One binary runs it',
    body: 'nika run executes the graph locally, on your models, with your files. Same file, same truth.',
  },
]
