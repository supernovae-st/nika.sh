/* ─── changelog · the ship log (home preview FIG 8.0 · /changelog page FIG C) ─
   A SEED changelog of REAL project milestones — honest, no invented features,
   no fabricated metrics. Each entry is a dated, tagged, one-line record of
   something that actually happened (the spec license, the four-verb lock, the
   stdlib surface, the provider catalog, this very site). Numbers that appear in
   the copy come from CANON (the spec single source of truth), never hand-typed.

   Exported as a flat, newest-first list so BOTH surfaces reuse it:
     · the HOME section <ChangelogPreview/> shows the latest few (FIG 8.0)
     · the /changelog page (Phase 4) renders the full register.

   DATE HONESTY: `release` entries carry the REAL GitHub release dates
   (github.com/supernovae-st/nika/releases) and render day-true. Everything
   else is a public MILESTONE — its ISO date orders the register, but only the
   month is recorded fact, so milestones RENDER at month precision (entryDate /
   entryDateTime below) and never claim a day we did not log. Tags are a small
   closed vocabulary so the register reads like a real ship log, not marketing. */

import { CANON } from '../canon.generated'

export type ChangelogTag =
  | 'release'
  | 'spec'
  | 'language'
  | 'stdlib'
  | 'providers'
  | 'security'
  | 'tooling'
  | 'site'

export interface ChangelogEntry {
  /** ISO date · used for the <time> + the displayed register date. */
  date: string
  /** the short register tag (a closed vocabulary · drives the mono label). */
  tag: ChangelogTag
  /** the headline · one line, honest, no invented feature claims. */
  title: string
  /** the one-line description · the body register line. */
  body: string
  /** the GitHub release URL — release-tagged entries carry their notes (one voice) */
  gh?: string
}

/* newest-first. LIVE counts interpolate from CANON so they can never drift
   from the spec; DATED milestones never carry live counts (they'd rewrite
   their own history — twice caught, now law). */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-07-12',
    tag: 'site',
    title: 'nika.sh v4.15 · every word gets its room, every room its machine',
    body: 'The vocabulary completes. Every builtin opens its own room — the arg contract in the binary’s own words, the tool inside a real file (a verbatim skeleton excerpt at its true line numbers, or a crafted workflow that passes check — the drift gates re-prove both on every test run), the skeletons that ship it, the check gates that name it, the family walk. The four verbs get rooms of their own, and every key the schema declares gets its register row — 51 words projected from the served contract, never prose, with an honest miss for anything else. THE PIN DRUM plays the standard library on /tools: one row per builtin, one pin per real argument — bright means required — six family blades, a fixed comb; walking prev/next between rooms turns one persistent machine exactly one notch. Then the parts catalog: every room berths its OWN machine in the ship’s ink — six family archetypes (the file cabinet’s required drawers sit pulled out at you), four verb emblems (infer’s halo carries one spoke per provider), no two parts share a silhouette, every count a catalog count, and a 2D engineering drawing of the same instance tables stands in wherever GL never mounts. The ship links back — every spec section head opens its organ’s page — and ⌘K answers the whole vocabulary now, builtins, verbs and keywords alike. The spec voyage earns its grace: the floating plate dies into the rail — one 42px machined strip whose read segment expands to speak its organ and the chapter keys, titles never break (an overflowing tail fades under a machined window; at narrow berths resting titles fold whole and hover peeks them back) — hull plates stand down when the prose column would cut them, and the opening flight flies like a vessel at last: the yaw follower under a hard velocity ceiling, the hull banking into its turns, the pointer’s hand on the wheel only at rest. The sitemap learns class-aware tiers, the nav opens the new doors, and every room speaks schema.org.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.15.0',
  },
  {
    date: '2026-07-11',
    tag: 'site',
    title: 'nika.sh v4.14 · the site names its doors',
    body: 'Two new registers open. The skeleton templates get eleven landings \u2014 instantiate, never invent: every SLOT-marked skeleton with its one-command instantiation, deep-linkable, and a deep link lands instantly now (a smooth-scroll hijack had it travelling; the same sweep then made every arrival on the site land instant). The hero names its two moments \u2014 audited before a token is spent, a verifiable receipt after every run \u2014 and the get-started close names the doors plain: Claude Code, Codex, Cursor, VS Code, Hermes, OpenCode, Zed, GitHub Actions, MCP, one link to the full integrations map. The spec vessel learns to navigate: the position plate grows prev/next chevrons and finally says the chapter keys exist, neighbour stations keep a ghost label on the hull, and the ship sails with the reading \u2014 scroll velocity swells the engine wash and pitches the bow into the travel. The DAG becomes a component library (one card, one vocabulary, gated by test), the use-case cards speak it calmer, and the home film\u2019s 3D morph lies down for good \u2014 the flat register is the one truth. Post bodies leave the initial bundle (354 \u2192 304 KB gz). Two posts land: the agent workflow spectrum, and the generative AI workflow minus the mystery. And the belts keep pace: the registers get their pins (the first catch shipped fixed), the ship log proves its own truth \u2014 this very entry rides the gate it shipped \u2014 and the spec pick bus answers a trusted spiral that listens for the cursor.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.14.0',
  },
  {
    date: '2026-07-11',
    tag: 'site',
    title: 'nika.sh v4.13 · the reading wires to the ship',
    body: 'The spec voyage keeps its colours: the hull no longer drops to shadow-blue at the dock \u2014 every station keeps a floor of its own hue through the whole read, the stratum being read stands under a spotlight while its siblings recede, and a block drifting too near the camera dissolves through an ordered screen-door instead of printing a black mass over the read. Three stations reframe their shots (the reactor reads against space, the bridge clears the ring, the extract fan opens from below). The floating labels and the cursor-chasing tooltip die; in their place, the umbilical \u2014 one gradient wire from the section you are reading to its station, and on every ignition a spark rides it into the hull on the same clock as the station\u2019s swell. The column reads in order now: index first, glance second, reference third, the protocol plate closing the file beside the license invariants. Site-wide, the poster law generalizes \u2014 every mono-section hero paints at first paint, animations earn their start from the first gesture \u2014 and the transport drag is 1:1 again (a smooth-scroll hijack had lagged every seek since the rail shipped). Posts stop hiding their article: LCP 4.8s \u2192 2.7s. The standard library gets its register (28 tool landings), providers and a human sitemap join, the trace family becomes a reading path, four graduated showcases join the explorer, and a details pass makes every surface answer the hand. Four posts land from live proof sessions: the local forecast, the chain of custody, the MCP server you didn\u2019t have to build, the pipeline is a file. And the belts reach where nothing looked \u2014 the spec voyage itself (stage, ignition, helm, chapter keys), share cards, feeds, the 390px battery \u2014 under one honest local gate runner.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.13.0',
  },
  {
    date: '2026-07-11',
    tag: 'site',
    title: 'nika.sh v4.12 · the machined frame',
    body: 'The device frame is rebuilt from zero. Ten rounds of accretion \u2014 five stacked layers, per-section tints, hue journeys, a small state machine of moods \u2014 collapse into one machined element: a flat near-black slab, one gasket, one recess, one static edge-light in the site\u2019s struck blue, byte-deterministic on every display. The one thing that still moves is the drum: while a run replays, a hairline ring draws around the screen with the recorded progress, beats brighter as each task starts, completes on the verdict \u2014 and holds the danger red through a failure. The playground joins that grammar: /play\u2019s run-order simulate now beats the same ring the home film does, and leaving the page mid-run aborts it \u2014 the ring never outlives its run, and a belt navigates away mid-sim to prove it. One danger red everywhere: the frame\u2019s flash was a stray coral; it now speaks the same red as the failing verdict and the denied permits row, pinned across files by test. The spec vessel\u2019s opening becomes a full-bleed poster with a precisely measured approach, prose terms wire live to their stations and the gauge becomes a transport of nine real links; the nine steps of /learn feed the wayfinding rail; cargo binstall and nix join the install paths.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.12.0',
  },
  {
    date: '2026-07-10',
    tag: 'site',
    title: 'nika.sh v4.11 · the ship wears its colours',
    body: 'The spec vessel becomes the voyage it promised. It arrives whole and coloured — the permits ring in boundary orange, the standard-library hold and extract array in tool cyan, the provider engines in model blue, the error shield in agent violet, the envelope keel in the struck blue — turning on its own against a swept starfield, no labels, just the shape. The reading docks it deck by deck; past the last section the finale hands it the whole width, every stratum lit, every station labelled from its plate slot. The wheel never fights the page (zoom moved to ctrl+wheel), a flick of the drag now coasts with real weight, and the exploded drawing pulls the camera back so it always fits. The share card and the phone poster carry the same coloured elevation, extracted from the page itself. And the home\u2019s wayfinding rail goes site-wide: every page with sections gets its ruler, the spec\u2019s S-blocks included.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.11.0',
  },
  {
    date: '2026-07-10',
    tag: 'site',
    title: 'nika.sh v4.10 · one plan language',
    body: 'The film taught the grammar; now every plan on the site speaks it. A shared PlanMap carries the film’s flat map verbatim — the slab card with its verb-hued inset, the wave captions in the film’s own words, the hairline chevron on every wire — and /use-cases, the home gallery and /play’s live plan all draw the same object the film flattens into. Plans that outgrow their column scroll inside their own well, keyboard included, on every surface. The journal earns its register filter: deep-linkable, counts derived from the posts themselves, issue numbers absolute under any view. Two engine-truth posts land from live proof sessions: kill -9 a run and resume it (finished work never runs twice), and the approval gate as a task — fails closed headless, the human’s answer rides the resume, a refusal is a run that worked. And a long-lived ghost dies on the way out: the hero’s background field could lose its GL init for a whole session and composite blank — a watchdog now remounts it until the first frame paints, on the site and in the golden harness both.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.10.0',
  },
  {
    date: '2026-07-10',
    tag: 'site',
    title: 'nika.sh v4.9 · the spec ship',
    body: 'The spec machine becomes a vessel. The strata leave the disc and take stations along a spine, read bow to stern: the bridge (the plan), the reactor core (four verbs), one great habitat ring braced by four spokes (the permits boundary every outbound run crosses), the hold (the standard library in five family arcs), the antenna array (nine extract ports off fetch), the engine block (five local nozzles docked on the spine, ten cloud outboard, one mock dim) and the shield skirt (fourteen typed-error plates) — and the keel is the envelope itself, its ten keys the spine segments everything mounts on. The drum of liberation lends its heartbeat: a 2.4-second breath sails the hull bow to stern while the reading ignites each station in turn, one exact revolution from opening frame to lit close. The page becomes its engineering plate: the ship rides beside the title from the first paint, labelled by leader lines that carry real counts, over a protocol plate, an honest family microchart and a nine-chip index that tracks the reading. And it answers the hand now: drag to orbit (it springs home), wheel to zoom, one button to explode the drawing apart along the spine — the wires stretch, still connected.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.9.0',
  },
  {
    date: '2026-07-10',
    tag: 'site',
    title: 'nika.sh v4.8 · the spec machine',
    body: 'The language reference becomes an instrument you read with. /spec splits into a measured ledger and a sticky rail where the whole language stands as one concentric machine: the four-verb core, the plan ring, the gate collar, the tool belt, the fetch manifold, the provider halo, the containment shell — every block derived from the spec canon, spoken in the site’s wire-blue ink. The reading assembles it: each section you cross ignites its stratum, the TOC ticks fill, and the HUD keeps the tally until the whole contract stands lit, one full revolution later. Every node answers the pointer — hover reads it out, click lands on its row — and every chip, stamp cell and TOC pill lights its block back. Phones, reduced motion and no-WebGL keep a designed 2D floor plan of the same machine, lit by the same reading. The optional envelope keys and task controls fold behind native disclosures, and a counted drift dies: chart and image_fx take their real families, the family count derives forever.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.8.0',
  },
  {
    date: '2026-07-10',
    tag: 'release',
    title: 'v0.99.0 · the audit tells the whole truth, the run narrates its own',
    body: 'The check ladder earns its MODELS rung: every model: must resolve in THIS binary — a bare id or an undriveable provider is a finding with the fix taught in-line, pricing refuses to conjure what it cannot resolve, and the MCP nika_check lane obeys the same law. Two media builtins graduate: nika:image_fx (15 deterministic op families over a hand-rolled PNG codec, recipe in the tEXt chunk) and nika:chart (five chart types compiled to byte-identical SVG, parity proven across architectures) — both zero-dep, both sha256-chained into the trace. Egress to outputs closes the one documented gap: the workflow boundary gets its own sink-only declassification valve, and every embedded template now passes its own audit. explain --forecast computes duration/cost/risk priors from YOUR local traces (p50/p90 earned at n ≥ 5, never a model call); wire covers opencode and hermes (8 targets); and the release tarball itself is funnel-gated — a stranger’s broken first run never uploads.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.99.0',
  },
  {
    date: '2026-07-10',
    tag: 'site',
    title: 'nika.sh v4.7 · the manifesto learns to prove itself',
    body: 'The poem gets a proof layer: THE RECORD, a two-strand timeline of who controls access to intelligence — the cage in grey, the drum in light — every entry dated and carrying its primary source, probed weekly by CI so a dead link fails the build. The founding Friday is pinned (the letter, the switch-off, the tap reopening nineteen days later) and the hero stamp deep-links straight to it. On desktop the record becomes a stage: vertical scroll plays the track left to right through a fixed playhead — drum above the baseline, cage below, the live card lit, a big tabular year turning, a minimap riding the score — while mobile and reduced motion keep the vertical truth. The five promises now carry receipts, the statements ignite as they reveal, and the section frame speaks eight languages.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.7.0',
  },
  {
    date: '2026-07-09',
    tag: 'site',
    title: 'nika.sh v4.6 · the black frame, and the page learns its colour law',
    body: 'The device contour is rebuilt around one rule: the material is black, the colour is light. A near-black frame carries a static edge-light whose hue and richness read the section under it (blue over the hero, coral at the close, calm on reading pages), the screen recesses into the frame on all four edges, and the ambient loop that breathes the iridescence is finally alive at rest — a mount-order race had silenced it since the frame was born. The home composition gains the same clarity: dark is the stage, every light or blue chapter is a sheet laid on it. And a dark-only site learns to print: white paper, black ink, whole code panels.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.6.0',
  },
  {
    date: '2026-07-08',
    tag: 'site',
    title: 'nika.sh v4.5 · the film becomes an instrument',
    body: 'The home film gains a real transport: a docked run monitor with live timecode, seek from any surface (a DAG node, a log line, the file itself), and an ending that lands on the $0.00 · local punchline — then hands the exact file you watched to the playground, one click from editable. The whole site now lives inside a living device frame: a dark skeuomorphic contour whose colour, depth and light read the section and route you are on, igniting while a run plays.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.5.0',
  },
  {
    date: '2026-07-08',
    tag: 'release',
    title: 'v0.98.0 · native answers, one lexer',
    body: 'Structured output rides each provider\u2019s own grammar (Anthropic output_config, Gemini responseJsonSchema, OpenAI strict-mode honesty) with a coercion ladder that repairs before any paid retry; the checker closes run-fail gaps (the block-sequence bomb dies as NIKA-PARSE-001, env: binds at run exactly as checked); the ${{ }} scanner becomes one shared crate for checker AND runtime — parity by construction; and the first 30 seconds learn to speak: nika welcome mirrors your machine, nika explain narrates a file, init briefs six agent surfaces, --max-cost-usd refuses to start past the static floor.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.98.0',
  },
  {
    date: '2026-07-07',
    tag: 'release',
    title: 'v0.97.0 · the run becomes evidence',
    body: 'Every journal line carries a hash chain — trace verify walks it and names the first broken link; trace reproduce says whether a run is reproducible and WHY not; the journal attests which engine on which platform wrote it. Models are priced before the first run (602 rules from models.dev — the VS Code preflight shows $/1M on this tag); check IS the dry-run (the plan names what dispatches when); doctor speaks JSON; bare init/new converse; and the drift warn tells a re-encode from an edit.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.97.0',
  },
  {
    date: '2026-07-06',
    tag: 'release',
    title: 'v0.96.0 · the run becomes a place',
    body: 'nika dap brings time-travel replay debugging over the run journal (breakpoints in your YAML, step forward AND backward — the VS Code F5 integration lights up on this tag); trace export projects any journal to OTLP for Jaeger/Grafana/Langfuse; check --json states the caller contract (requirements: models, keys, secrets, env) before any token; a typo\'d field teaches (did you mean `infer`?); runs record their source sha and skips say why.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.96.0',
  },
  {
    date: '2026-07-06',
    tag: 'release',
    title: 'v0.95.0 · the catalog practices local-first',
    body: 'The 5 local servers (Ollama, LM Studio, llama.cpp, LocalAI, vLLM) join the catalog with descriptions, tags and seed models — keyless by construction, sovereign models stay unpriced, never « free ». A bare nika suggests the next command; write honors create_dirs: false loudly, date resolves timezones from the bundled db, log neutralizes control sequences, and the MCP stdio transport bounds its reads.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.95.0',
  },
  {
    date: '2026-07-06',
    tag: 'release',
    title: 'v0.94.0 · the media suite · every run leaves a journal',
    body: 'Two media builtins take the stdlib to 25 — image generation and editing plus speech synthesis, sovereign-first with provenance manifests; every run now writes .nika/traces by default, --task scopes execution to one cone, the catalog rides the wire (catalog/tools --json + an 8-tool MCP oracle on 2026-07-28), cost_usd never lies, and doctor --ping actually probes the local ports.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.94.0',
  },
  {
    date: '2026-07-05',
    tag: 'providers',
    title: `${CANON.providers} model providers · Hugging Face and NVIDIA join`,
    body: `Two more ways to bring your own model: Hugging Face and NVIDIA endpoints join the catalog (${CANON.providersLocal} local runtimes unchanged — the sovereign path stays the default).`,
  },
  {
    date: '2026-07-05',
    tag: 'release',
    title: 'v0.93.1 · the pack teaches 2026 models',
    body: 'The embedded teaching pack vendors the current spec cascade, so nika init hands a 2026 local model the language on day one; the README gains the daily-commands loop.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.93.1',
  },
  {
    date: '2026-07-05',
    tag: 'release',
    title: 'v0.93.0 · the run becomes durable',
    body: 'Kill a run mid-flight and --resume banks the finished work as visible cache hits; a nika:prompt gate pauses durably for a human answer; nika test joins the CLI and local models get honest timeouts.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.93.0',
  },
  {
    date: '2026-07-05',
    tag: 'site',
    title: 'The blog is a folder',
    body: 'content/blog in the site repo IS the blog: PR-able markdown compiled to real pages with the product’s editor panels. The archive backfills the journey, one post per milestone, at its real date.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.3.0',
  },
  {
    date: '2026-07-04',
    tag: 'tooling',
    title: 'The playground draws the plan',
    body: 'nika.sh/play renders the live DAG of your file as you type, simulates the run order over the real topology (no fabricated timings), and reads the declared blast radius back to you.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.2.0',
  },
  {
    date: '2026-07-03',
    tag: 'release',
    title: 'v0.92.0 · the agent-native release',
    body: 'Agents learn the language from the binary: MCP tools serve the schema, examples and canon; nika init scaffolds AGENTS.md; nika wire reaches Codex and the Claude Code plugin marketplace. macOS binaries ship signed and notarized.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.92.0',
  },
  {
    /* a dated entry NEVER carries the live version variable — this one once
       interpolated ENGINE_VERSION and silently rewrote itself at each bump. */
    date: '2026-06-25',
    tag: 'release',
    title: 'v0.91.0 · smoother first fifteen minutes',
    body: 'nika examples run --model previews any embedded workflow offline: no key, no model server; nika init and nika wire handle onboarding; headless Linux builds compile clean.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.91.0',
  },
  {
    date: '2026-06-21',
    tag: 'release',
    title: 'v0.90.0 · first public release',
    body: `One brew-installable binary for macOS and Linux: the ${CANON.verbs} verbs end to end, the nika check static audit, and an embedded examples pack.`,
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.90.0',
  },
  {
    date: '2026-06-17',
    tag: 'site',
    title: 'nika.sh v4 · Intent as Code',
    body: 'The site rebuilt around one idea: a real .nika.yaml file, instant and crawlable, with the spec as the single source of truth.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.0.0',
  },
  {
    date: '2026-06-12',
    tag: 'tooling',
    title: 'The playground · validate Nika in the browser',
    body: 'Edit a real workflow at nika.sh/play and watch it check as you type, with the engine’s own NIKA error codes. No install to try it.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v3-playground',
  },
  {
    date: '2026-06-02',
    tag: 'security',
    title: 'permits: · the declared blast radius',
    body: 'Every plan can state exactly what it may touch: files, hosts, programs, tools. Once permits: is present, every category is default-deny.',
  },
  {
    date: '2026-05-28',
    tag: 'security',
    title: 'Enforced before it runs · NIKA-SEC codes',
    body: 'Out-of-bounds is denied, not logged after the fact: an effect past the permits: boundary fails with NIKA-SEC-004 before the action happens.',
  },
  {
    /* count-free on purpose: this DATED milestone once interpolated the live
       CANON counts and silently rewrote itself at every catalog change (the
       same self-rewriting class as the ENGINE_VERSION entry, fixed 2026-07-04).
       The catalog's CURRENT size lives in dated entries of its own. */
    date: '2026-05-22',
    tag: 'providers',
    title: 'The provider catalog goes local-first',
    body: 'One verb, any model: five local runtimes (Ollama, LM Studio, llama.cpp, LocalAI, vLLM) and a cloud catalog led by open-weight. Your machine, your choice.',
  },
  {
    date: '2026-05-22',
    tag: 'language',
    title: 'Four verbs, locked forever',
    body: 'infer · exec · invoke · agent: a verb is a distinct native execution model. No fifth verb, ever (D-2026-05-22-N18).',
  },
  {
    date: '2026-05-18',
    tag: 'tooling',
    title: 'MCP, native · any server through invoke',
    body: 'Reach a Model Context Protocol server the same way as a builtin: invoke a mcp: tool id. Default-deny: the file whitelists what an agent may call.',
  },
  {
    date: '2026-05-14',
    tag: 'stdlib',
    title: `fetch · ${CANON.extractModes} extract modes`,
    body: `One builtin turns a page into typed output ${CANON.extractModes} ways: article, markdown, text, links, metadata, selector, sitemap, feed and jq. Read-only by design.`,
  },
  {
    date: '2026-05-10',
    tag: 'stdlib',
    title: `Standard library v0.1 · ${CANON.builtins} builtins`,
    body: `${CANON.builtins} builtin tools across files, data, web and flow, all reached the same way, with invoke:. Nothing to install.`,
  },
  {
    date: '2026-05-04',
    tag: 'spec',
    title: `The error catalog · ${CANON.errorCodes} typed codes`,
    body: `Every failure has a stable NIKA-* code across ${CANON.errorNamespaces} namespaces: published, machine-readable, the same in a CLI run and the validator.`,
  },
  {
    date: '2026-05-01',
    tag: 'spec',
    title: 'The JSON Schema · one workflow contract',
    body: 'workflow.json describes a valid plan end to end: the nika: v1 envelope, the four verbs, the permits: block. Your editor checks it as you write.',
  },
  {
    date: '2026-04-29',
    tag: 'spec',
    title: 'The spec, released under Apache-2.0',
    body: 'nika-spec is open and runtime-agnostic: the envelope, the verbs, the JSON schema and the conformance suite, free to adopt.',
  },
]

/* the closed tag vocabulary, in legend order. The rendered chip label IS the
   tag id (the old TAG_LABEL was an identity map — a dead abstraction). */
export const TAGS: readonly ChangelogTag[] = [
  'release',
  'spec',
  'language',
  'stdlib',
  'providers',
  'security',
  'tooling',
  'site',
]

/* format an ISO date as a compact register date (e.g. "2026 · 06 · 17"),
   tabular and locale-stable (no Intl drift between SSR + client). */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${y} · ${m} · ${d}`
}

/* a release ships on a day; a milestone is honest at month precision. Both
   surfaces (home preview + /changelog) render through these two so the
   register can never over-claim a date. */
export const isRelease = (e: ChangelogEntry): boolean => e.tag === 'release'

export function entryDate(e: ChangelogEntry): string {
  if (isRelease(e)) return fmtDate(e.date)
  const [y, m] = e.date.split('-')
  return `${y} · ${m}`
}

/** the <time dateTime> value · YYYY-MM-DD for releases, YYYY-MM for milestones */
export function entryDateTime(e: ChangelogEntry): string {
  return isRelease(e) ? e.date : e.date.slice(0, 7)
}

