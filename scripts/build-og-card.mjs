// build-og-card.mjs — generate the on-brand OG social cards for nika.sh (v4).
//
// Renders the 1200×630 PNG share cards that match the v4 "sovereign
// engineering / blueprint" register: near-black #0a0b0d, real Martian
// Grotesk display + Martian Mono register, 1px hairlines, a faint perspective
// depth-grid, the EdgeAurora cyan→violet ring at the frame (the lone colour),
// and the nika butterfly mark. Each route carries THAT page's message.
//
// Cards (one card spec → one PNG · all in CARDS below):
//   public/og.png            home      "See what your AI will do."          (control)
//   public/og-spec.png       /spec     "The contract an agent must satisfy…" (reference)
//   public/og-use-cases.png  /use-cases "Real plans you'd review."           (gallery)
//   public/og-manifesto.png  /manifesto "The drum of liberation."           (sovereignty)
//
// Pipeline (dependency-free), per card:
//   1. this script inlines the real woff2 fonts + the nika mark into a
//      self-contained scripts/og-card.html (committed, inspectable — the LAST
//      card rendered stays on disk so the template is always reviewable)
//   2. headless Chrome screenshots it at 2400×1260 (DSF 2 for crisp type)
//   3. ImageMagick downscales to 1200×630, pngquant quantises (< 100 KB)
//
// Reproducible: `node scripts/build-og-card.mjs` regenerates ALL cards.
// Single card while iterating: `node scripts/build-og-card.mjs spec`.

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const pub = resolve(root, 'public');

// ── inline the real fonts so the card paints in the brand type ──────────────
const b64 = (p) => readFileSync(p).toString('base64');
// THE SHIP watermark · the /spec hero elevation, extracted from the SSG dist
// (dist/spec/index.html · the same drawing the page ships — never hand-drawn).
// Strata forced lit: the card shows the assembled contract.
let SHIP_ART = '';
try {
  const specHtml = readFileSync(resolve(__dirname, '../dist/spec/index.html'), 'utf8');
  const m = specHtml.match(/<svg[^>]*class="spec-schematic[^"]*"[\s\S]*?<\/svg>/);
  if (m) {
    SHIP_ART = `<div class="art">${m[0].replaceAll(
      'class="sms-stratum"',
      'class="sms-stratum" data-lit=""',
    )}</div>`;
  } else {
    console.warn('og-spec: no elevation svg found in dist/spec/index.html — card ships without the ship');
  }
} catch {
  console.warn('og-spec: dist/spec/index.html unreadable (build first) — card ships without the ship');
}

const grotesk = b64(resolve(pub, 'fonts/martian-grotesk-variable.woff2'));
const mono = b64(resolve(pub, 'fonts/martian-mono-variable.woff2'));

// ── the nika butterfly path (recoloured to ink for the monochrome register) ─
const nikaSvg = readFileSync(resolve(pub, 'nika.svg'), 'utf8');
const nikaPath = nikaSvg.match(/<path d="([^"]+)"/)[1];

// ─────────────────────────────────────────────────────────────────────────────
// The card specs. Each one drives the SAME v4 instrument template, carrying the
// route's own message. `headline` may carry one <span class="b"> dim emphasis;
// `detail` is the blueprint hint row (mono); `aurora` lets the manifesto echo
// the cosmic register a touch stronger. All cards stay dark for share
// legibility. Footer holds the licence/stack ticks (the studio signature).
// ─────────────────────────────────────────────────────────────────────────────
const CARDS = [
  {
    // HOME — the control pitch (UNCHANGED · the existing card, byte-identical).
    out: 'og.png',
    fig: 'FIG 0.0',
    headline: 'See what your AI will do.<br><span class="b">Before it does it.</span>',
    sub: 'The control layer for AI agents&nbsp;— a reviewable, enforceable plan before it acts.',
    detail:
      '<span class="arrow">▸</span><span><b>permits:</b> everything it can touch&nbsp;— and nothing&nbsp;else.</span>',
  },
  {
    // /spec — the language reference. The contract a plan must satisfy.
    out: 'og-spec.png',
    fig: 'FIG S.0',
    ship: true, // the vessel elevation watermark (extracted from the SSG dist)
    size: 62, // a longer headline · a touch smaller so 3 lines clear the brand row
    headline:
      'The contract an agent<br>must satisfy<br><span class="b">before it acts.</span>',
    sub: 'The nika language reference&nbsp;— the envelope, the four verbs, the task shape, the standard&nbsp;library.',
    detail:
      '<span class="arrow">▸</span><span><b>permits:</b> &nbsp;infer&nbsp;<span class="sep">·</span>&nbsp;exec&nbsp;<span class="sep">·</span>&nbsp;invoke&nbsp;<span class="sep">·</span>&nbsp;agent</span>',
  },
  {
    // /use-cases — the gallery. Real plans you'd actually review.
    out: 'og-use-cases.png',
    fig: 'FIG 6.0',
    headline: 'Real plans<br><span class="b">you&rsquo;d review.</span>',
    sub: 'The full showcase&nbsp;— every métier, every workflow, each with the exact spec-valid YAML that runs&nbsp;it.',
    detail:
      '<span class="arrow">▸</span><span><b>builders</b><span class="sep">·</span>research<span class="sep">·</span>content<span class="sep">·</span>ops<span class="sep">·</span>business</span>',
  },
  {
    // /manifesto — the sovereignty line. Echo the cosmic register a touch.
    out: 'og-manifesto.png',
    fig: 'FIG ∞',
    cosmic: true, // a touch more aurora · the manifesto's cosmic register
    headline: 'The drum<br><span class="b">of liberation.</span>',
    sub: 'Sovereign AI workflows that run on your machine, with any model, and are never switched off by anyone but&nbsp;you.',
    detail:
      '<span class="arrow">▸</span><span>any&nbsp;model<span class="sep">·</span>your&nbsp;memory<span class="sep">·</span><b>owned&nbsp;by&nbsp;you</b></span>',
  },
  {
    // /play — the flagship demo. The page's own claim, verbatim register.
    out: 'og-play.png',
    fig: 'FIG P.0',
    headline: 'Write Nika,<br><span class="b">checked live.</span>',
    sub: 'Real Nika, validated as you type&nbsp;— the same NIKA codes the engine raises. Everything runs in your tab; nothing is sent&nbsp;anywhere.',
    detail:
      '<span class="arrow">▸</span><span>edit<span class="sep">·</span>watch&nbsp;the&nbsp;plan<span class="sep">·</span><b>simulate&nbsp;the&nbsp;order</b></span>',
  },
  {
    // /install — one binary, your machine. Step 1 of the funnel.
    out: 'og-install.png',
    fig: 'FIG 1.0',
    headline: 'One binary.<br><span class="b">Your machine.</span>',
    sub: 'No daemon, no account, no cloud required. Two minutes to your first run with a free local&nbsp;model.',
    detail:
      '<span class="arrow">▸</span><span><b>brew</b>&nbsp;install&nbsp;supernovae-st/tap/nika</span>',
  },
  {
    // /learn — fluency in one file. The reading path.
    out: 'og-learn.png',
    fig: 'FIG L.0',
    headline: 'One file,<br><span class="b">line by line.</span>',
    sub: 'A workflow is a file you can read&nbsp;— nine small ideas make you fluent. Every fragment is real, spec-correct&nbsp;YAML.',
    detail:
      '<span class="arrow">▸</span><span>read<span class="sep">·</span>hover<span class="sep">·</span><b>run&nbsp;it&nbsp;in&nbsp;the&nbsp;playground</b></span>',
  },
  {
    // /brand — the design system, shown by the system itself.
    out: 'og-brand.png',
    fig: 'FIG D.0',
    headline: 'One mark,<br><span class="b">one ontology.</span>',
    sub: 'Every verb, builtin, feature and run-state carries a canonical glyph, hue and motion&nbsp;— declared once, projected everywhere, machine-readable.',
    detail:
      '<span class="arrow">▸</span><span>icons.json<span class="sep">·</span>icons.ttl<span class="sep">·</span><b>hue&nbsp;=&nbsp;alive</b></span>',
  },
  {
    // /blog — the long-form pedagogy shelf.
    out: 'og-blog.png',
    fig: 'FIG B.0',
    headline: 'Notes from<br><span class="b">the source.</span>',
    sub: 'Long-form pedagogy on Intent as Code&nbsp;— why useful AI work belongs in a file, and what local-first actually buys&nbsp;you.',
    detail:
      '<span class="arrow">▸</span><span>intent&nbsp;as&nbsp;code<span class="sep">·</span>four&nbsp;verbs<span class="sep">·</span><b>local-first</b></span>',
  },
  {
    // /changelog — trust by moving, dated and tagged.
    out: 'og-changelog.png',
    fig: 'FIG C.0',
    headline: 'Moving,<br><span class="b">without breaking.</span>',
    sub: 'Every public milestone, dated and tagged&nbsp;— the spec opened, the verbs locked, the boundary&nbsp;shipped.',
    detail:
      '<span class="arrow">▸</span><span>dated<span class="sep">·</span>tagged<span class="sep">·</span><b>what&nbsp;you&nbsp;wrote&nbsp;still&nbsp;runs</b></span>',
  },
  {
    // /providers — the provider register; local first, keys yours, no lock-in.
    out: 'og-providers.png',
    fig: 'FIG P.0',
    headline: 'Local first,<br><span class="b">keys stay yours.</span>',
    sub: 'One <span style="white-space:nowrap">provider:</span> line moves a workflow between models&nbsp;— laptop Ollama to a frontier API is a one-word diff. Keys ride env vars, never a config&nbsp;file.',
    detail:
      '<span class="arrow">▸</span><span>local&nbsp;default<span class="sep">·</span>model&nbsp;pins<span class="sep">·</span><b>no&nbsp;inference&nbsp;lock-in</b></span>',
  },
  {
    // /sitemap — the human map; the coverage gate keeps it exhaustive.
    out: 'og-sitemap.png',
    fig: 'FIG M.0',
    headline: 'Every page,<br><span class="b">one map.</span>',
    sub: 'The whole territory on one labeled page&nbsp;— the registers, the writing, the machine twins&nbsp;— and CI fails when a page ships without joining&nbsp;it.',
    detail:
      '<span class="arrow">▸</span><span>coverage-gated<span class="sep">·</span>both&nbsp;directions<span class="sep">·</span><b>crawlers&nbsp;get&nbsp;sitemap.xml</b></span>',
  },
  {
    // /templates — the skeleton register; instantiate, never invent.
    out: 'og-templates.png',
    fig: 'FIG T.1',
    headline: 'Instantiate,<br><span class="b">never invent.</span>',
    sub: 'Ten complete, valid skeletons with <span style="white-space:nowrap"># SLOT:</span> markers at every decision point&nbsp;— route your intent, copy, fill, check. The path to a correct file is&nbsp;mechanical.',
    detail:
      '<span class="arrow">▸</span><span>route<span class="sep">·</span>copy<span class="sep">·</span>fill<span class="sep">·</span><b>check&nbsp;repairs&nbsp;the&nbsp;rest</b></span>',
  },
  {
    // /verbs — the four rooms; a verb is a distinct native execution model.
    out: 'og-verbs.png',
    fig: 'FIG V.0',
    headline: 'Four verbs,<br><span class="b">locked forever.</span>',
    sub: 'A verb is a distinct native execution model&nbsp;— <span style="white-space:nowrap">infer · exec · invoke · agent</span>. Every task speaks exactly one; everything callable is a tool, ordering is the DAG&rsquo;s&nbsp;job.',
    detail:
      '<span class="arrow">▸</span><span>think<span class="sep">·</span>run<span class="sep">·</span>use&nbsp;a&nbsp;tool<span class="sep">·</span><b>delegate&nbsp;on&nbsp;a&nbsp;leash</b></span>',
  },
  {
    // /language — the keyword register; every schema-declared key, one row.
    out: 'og-language.png',
    fig: 'FIG L.0',
    headline: 'Every word,<br><span class="b">one register.</span>',
    sub: 'Every key a <span style="white-space:nowrap">.nika.yaml</span> can carry, projected from the served schema&nbsp;— its scopes, its types, its required flags. Descriptions are the contract&rsquo;s own, never&nbsp;prose.',
    detail:
      '<span class="arrow">▸</span><span>schema-projected<span class="sep">·</span>scope-mapped<span class="sep">·</span><b>check&nbsp;teaches&nbsp;a&nbsp;miss</b></span>',
  },
  {
    // /tools — the standard library register; one closed namespace, spec-versioned.
    out: 'og-tools.png',
    fig: 'FIG T.0',
    headline: 'One namespace,<br><span class="b">no plugin store.</span>',
    sub: 'Every <span style="white-space:nowrap">nika:</span> builtin the engine ships&nbsp;— files, data, network, media&nbsp;— versioned with the spec and reviewed like the rest of your&nbsp;file.',
    detail:
      '<span class="arrow">▸</span><span>invoke-gated<span class="sep">·</span>permit-bound<span class="sep">·</span><b>check&nbsp;teaches&nbsp;the&nbsp;args</b></span>',
  },
  {
    // /blog/the-run-becomes-evidence — hash-chained journal; verify names the first broken link.
    out: 'og-blog-the-run-becomes-evidence.png',
    fig: 'FIG B.26',
    size: 60,
    headline: 'The run<br><span class="b">becomes evidence.</span>',
    sub: 'Every journal line carries a hash chain — <span style="white-space:nowrap">nika trace verify</span> names the first broken link, reproduce classifies every task, and the journal attests which engine wrote it.',
    detail:
      '<span class="arrow">▸</span><span>hash&nbsp;chain<span class="sep">·</span>first&nbsp;break&nbsp;named<span class="sep">·</span><b>engine&nbsp;attested</b></span>',
  },
  {
    // /blog/media-are-workflow-citizens — image/speech builtins under the same discipline as text.
    out: 'og-blog-media-are-workflow-citizens.png',
    fig: 'FIG B.25',
    size: 60,
    headline: 'Media are<br><span class="b">workflow citizens.</span>',
    sub: 'Images and speech render inside workflows under the same discipline as everything else: permit-gated saves, sha256 provenance, honest warnings, real cost on the ledger — the sovereign path first.',
    detail:
      '<span class="arrow">▸</span><span>permit-gated<span class="sep">·</span>sha256&nbsp;provenance<span class="sep">·</span><b>sovereign&nbsp;path&nbsp;first</b></span>',
  },
  {
    // /blog/the-credentials-your-pipeline-breaks — C2PA signatures survive the pipeline now.
    out: 'og-blog-the-credentials-your-pipeline-breaks.png',
    fig: 'FIG B.24',
    size: 60,
    headline: 'The credentials your<br><span class="b">pipeline was breaking.</span>',
    sub: 'OpenAI and Google sign the images their APIs return. Almost every pipeline that touches those files silently converts the signature into evidence of tampering — including, until this week, ours.',
    detail:
      '<span class="arrow">▸</span><span>C2PA&nbsp;signed<span class="sep">·</span>bytes&nbsp;preserved<span class="sep">·</span><b>provenance&nbsp;survives</b></span>',
  },
  {
    // /blog/the-editor-tells-the-truth — the extension audited against the engine; the badge is a fact now.
    out: 'og-blog-the-editor-tells-the-truth.png',
    fig: 'FIG B.23',
    size: 60,
    headline: 'The editor<br><span class="b">tells the truth.</span>',
    sub: 'A green badge is a claim. We audited the editor extension against the engine the way you&#8217;d audit a client against a server — and found the badge lying. The contract keeps it honest now.',
    detail:
      '<span class="arrow">▸</span><span>audited&nbsp;vs&nbsp;engine<span class="sep">·</span>same&nbsp;verdicts<span class="sep">·</span><b>the&nbsp;badge&nbsp;is&nbsp;a&nbsp;fact</b></span>',
  },
  {
    // /blog/time-travel-for-real — the past is a file; stepping backward is free.
    out: 'og-blog-time-travel-for-real.png',
    fig: 'FIG B.22',
    size: 60,
    headline: 'Time travel,<br><span class="b">for real.</span>',
    sub: 'Every debugger replays the past by re-running it. Nika&#8217;s past is a file — so stepping backward is free, breakpoints live in your YAML, and F5 debugs a run that already happened.',
    detail:
      '<span class="arrow">▸</span><span>step&nbsp;back&nbsp;free<span class="sep">·</span>breakpoints&nbsp;in&nbsp;YAML<span class="sep">·</span><b>replay,&nbsp;never&nbsp;re-run</b></span>',
  },
  {
    // /blog/one-wire-five-servers — the self-hosted media world standardized on one wire shape.
    out: 'og-blog-one-wire-five-servers.png',
    fig: 'FIG B.21',
    size: 60,
    headline: 'One wire,<br><span class="b">five servers.</span>',
    sub: 'The self-hosted media world quietly standardized on OpenAI&#8217;s wire shapes. That accident of history is the best sovereignty news in years — and Nika&#8217;s media builtins are built on it.',
    detail:
      '<span class="arrow">▸</span><span>one&nbsp;shape<span class="sep">·</span>five&nbsp;sovereign&nbsp;hosts<span class="sep">·</span><b>zero&nbsp;lock-in</b></span>',
  },
  {
    // /blog/the-generative-workflow — inputs · a model step · effects you can point to; provenance built in.
    out: 'og-blog-the-generative-workflow.png',
    fig: 'FIG B.23',
    size: 60,
    headline: 'Generative workflow,<br><span class="b">minus the mystery.</span>',
    sub: 'Inputs you name, a model step, effects you can point to — declared in one file. Rehearsed offline on the mock provider; every asset lands with its sha256 and a provenance manifest.',
    detail:
      '<span class="arrow">▸</span><span>declared&nbsp;triple<span class="sep">·</span>offline&nbsp;rehearsal<span class="sep">·</span><b>assets&nbsp;carry&nbsp;provenance</b></span>',
  },
  {
    // /blog/the-agent-workflow-spectrum — declared graph ↔ free loop; the agent verb contains the dynamic end.
    out: 'og-blog-the-agent-workflow-spectrum.png',
    fig: 'FIG B.22',
    size: 60,
    headline: 'The agent workflow<br><span class="b">spectrum.</span>',
    sub: 'Every ai agent workflow sits between a declared graph and a free loop. In a file it&#8217;s a per-task verb: infer when you know the step&#8217;s shape, agent — leashed — when you don&#8217;t.',
    detail:
      '<span class="arrow">▸</span><span>tools&nbsp;default-deny<span class="sep">·</span>turns&nbsp;+&nbsp;tokens&nbsp;bounded<span class="sep">·</span><b>prose&nbsp;is&nbsp;not&nbsp;a&nbsp;contract</b></span>',
  },
  {
    // /blog/the-pipeline-is-a-file — an llm pipeline is a declared graph, not framework glue.
    out: 'og-blog-the-pipeline-is-a-file.png',
    fig: 'FIG B.21',
    size: 60,
    headline: 'An llm pipeline<br><span class="b">is a file.</span>',
    sub: 'Model calls + tools + processes, wired by data dependencies — a graph you declare, not glue you program. Forty lines of YAML; the engine derives the schedule, the cost, the audit.',
    detail:
      '<span class="arrow">▸</span><span>one&nbsp;graph<span class="sep">·</span>zero&nbsp;glue<span class="sep">·</span><b>diff&nbsp;·&nbsp;audit&nbsp;·&nbsp;replay</b></span>',
  },
  {
    // /blog/the-mcp-server-you-didnt-build — nika mcp: the in-binary read-only oracle, 8 tools, two jobs.
    out: 'og-blog-the-mcp-server-you-didnt-build.png',
    fig: 'FIG B.20',
    size: 60,
    headline: 'The MCP server<br><span class="b">you didn&#8217;t build.</span>',
    sub: 'The nika binary already serves MCP: eight read-only tools — the agent audits any plan and learns the language from the thing that enforces it. No run tool, by design.',
    detail:
      '<span class="arrow">▸</span><span>one&nbsp;wiring&nbsp;line<span class="sep">·</span>validate&nbsp;+&nbsp;learn<span class="sep">·</span><b>knows,&nbsp;never&nbsp;acts</b></span>',
  },
  {
    // /blog/the-chain-of-custody — trace verify recomputes the hash chain; one edited word breaks history.
    out: 'og-blog-the-chain-of-custody.png',
    fig: 'FIG B.19',
    size: 60,
    headline: 'History,<br><span class="b">re-derivable.</span>',
    sub: 'A recorded run is a text file — editable. <span style="white-space:nowrap">nika trace verify</span> recomputes the hash chain: one changed word breaks every line after it, and the run&#8217;s printed head closes the loop.',
    detail:
      '<span class="arrow">▸</span><span>tamper-evident<span class="sep">·</span>exact&nbsp;line&nbsp;named<span class="sep">·</span><b>exit&nbsp;2&nbsp;gates&nbsp;CI</b></span>',
  },
  {
    // /blog/the-local-forecast — duration/cost priors from your own traces; never a model call, never the network.
    out: 'og-blog-the-local-forecast.png',
    fig: 'FIG B.18',
    size: 60,
    headline: 'Your history,<br><span class="b">your forecast.</span>',
    sub: '<span style="white-space:nowrap">explain --forecast</span> prices the next run from your own recorded traces: honest ranges at two runs, percentiles at five, local models honestly unpriced.',
    detail:
      '<span class="arrow">▸</span><span>stats&nbsp;over&nbsp;your&nbsp;traces<span class="sep">·</span>never&nbsp;a&nbsp;model&nbsp;call<span class="sep">·</span><b>never&nbsp;the&nbsp;network</b></span>',
  },
  {
    // /blog/written-by-agents — the agent writes the plan; the audit gates it; you review a two-line diff.
    out: 'og-blog-written-by-agents.png',
    fig: 'FIG B.17',
    size: 60,
    headline: 'Written by agents,<br><span class="b">reviewed by you.</span>',
    sub: 'nika init teaches the language to whatever agent you run. The agent writes the workflow, <span style="white-space:nowrap">nika check</span> refuses the invented one before anything executes, and the human review is a two-line diff.',
    detail:
      '<span class="arrow">▸</span><span>agent&nbsp;writes<span class="sep">·</span>audit&nbsp;gates<span class="sep">·</span><b>you&nbsp;review&nbsp;the&nbsp;diff</b></span>',
  },
  {
    // /blog/the-one-task-rerun — --task scopes fresh runs; --from re-rolls the recorded past.
    out: 'og-blog-the-one-task-rerun.png',
    fig: 'FIG B.16',
    size: 60,
    headline: 'One block,<br><span class="b">not the world.</span>',
    sub: '<span style="white-space:nowrap">--task</span> runs a task and its upstream, nothing else; <span style="white-space:nowrap">--from</span> re-rolls a recorded run, downstream only. The DAG is the blast radius of your doubt.',
    detail:
      '<span class="arrow">▸</span><span>--task&nbsp;=&nbsp;ancestors<span class="sep">·</span>--from&nbsp;=&nbsp;downstream<span class="sep">·</span><b>finished&nbsp;work&nbsp;never&nbsp;twice</b></span>',
  },
  {
    // /blog/the-run-that-waits — the approval gate is a task; the answer rides the resume.
    out: 'og-blog-the-run-that-waits.png',
    fig: 'FIG B.15',
    size: 60,
    headline: 'The run that<br><span class="b">waits for you.</span>',
    sub: 'The approval gate is a task in the file: headless it fails closed with the question on record — the human&rsquo;s answer rides the resume.',
    detail:
      '<span class="arrow">▸</span><span>fails&nbsp;closed<span class="sep">·</span>--answer&nbsp;rides&nbsp;--resume<span class="sep">·</span><b>a&nbsp;no&nbsp;is&nbsp;not&nbsp;a&nbsp;failure</b></span>',
  },
  {
    // /blog/the-resume-story — kill -9 survived by the journal; resume skips done work.
    out: 'og-blog-the-resume-story.png',
    fig: 'FIG B.14',
    size: 60,
    headline: 'Finished work<br><span class="b">never runs twice.</span>',
    sub: 'kill -9 a run mid-flight: the journal already holds every settled task — resume skips them by name and only the interrupted work runs.',
    detail:
      '<span class="arrow">▸</span><span>↷&nbsp;cache&nbsp;hit&nbsp;(resume)<span class="sep">·</span>append-only&nbsp;journal<span class="sep">·</span><b>2&nbsp;skipped&nbsp;·&nbsp;2&nbsp;ran&nbsp;live</b></span>',
  },
  {
    // /blog/injection-goes-nowhere — the fixed plan + the checked boundary.
    out: 'og-blog-injection-goes-nowhere.png',
    fig: 'FIG B.13',
    size: 60,
    headline: 'The injection<br><span class="b">that goes nowhere.</span>',
    sub: 'The plan is authored before the model runs, so a hostile note becomes data, never a new action — and the boundary is checked before a token.',
    detail:
      '<span class="arrow">▸</span><span>data,&nbsp;not&nbsp;capability<span class="sep">·</span>refused&nbsp;before&nbsp;the&nbsp;effect<span class="sep">·</span><b>NIKA&nbsp;·&nbsp;PERMITS</b></span>',
  },
  {
    // /blog/prompts-are-code — prompt versioning is just git, plus a witness.
    out: 'og-blog-prompts-are-code.png',
    fig: 'FIG B.12',
    size: 62,
    headline: 'Prompts are<br><span class="b">code now.</span>',
    sub: 'The prompt lives in the workflow file: git diffs it, a PR reviews it, and the engine names an edited prompt between two&nbsp;runs.',
    detail:
      '<span class="arrow">▸</span><span>one-line&nbsp;diff<span class="sep">·</span>replayable<span class="sep">·</span><b>AUTHORED&nbsp;·&nbsp;the&nbsp;task&nbsp;changed</b></span>',
  },
  {
    // /blog/starting-over-on-purpose — the rebuild decision.
    out: 'og-blog-starting-over-on-purpose.png',
    fig: 'FIG 0.3',
    size: 62,
    headline: 'Starting over,<br><span class="b">on purpose.</span>',
    sub: 'We had a working prototype. We rebuilt from scratch anyway: craft, not extraction, one gate at a&nbsp;time.',
    detail:
      '<span class="arrow">▸</span><span>spec&nbsp;first<span class="sep">·</span>gates<span class="sep">·</span><b>the&nbsp;draft&nbsp;is&nbsp;not&nbsp;the&nbsp;product</b></span>',
  },
  {
    // /blog/the-secrets-line — information-flow, audited before it flows.
    out: 'og-blog-the-secrets-line.png',
    fig: 'FIG B.11',
    size: 62,
    headline: 'The secrets<br><span class="b">line.</span>',
    sub: 'Information-flow, audited before it flows: the checker proves a secret cannot leak into a prompt, a file, or a&nbsp;host.',
    detail:
      '<span class="arrow">▸</span><span>flow&nbsp;policy<span class="sep">·</span>taint&nbsp;traced<span class="sep">·</span><b>proven&nbsp;before&nbsp;it&nbsp;flows</b></span>',
  },
  {
    // /blog/the-cost-line — the bill you can read first.
    out: 'og-blog-the-cost-line.png',
    fig: 'FIG B.10',
    size: 62,
    headline: 'The cost<br><span class="b">line.</span>',
    sub: 'The audit prices every token before it is spent: ceilings on generations, budgets on loops, and a $0.00 that means&nbsp;it.',
    detail:
      '<span class="arrow">▸</span><span>worst-case&nbsp;ceiling<span class="sep">·</span>per&nbsp;task<span class="sep">·</span><b>before&nbsp;a&nbsp;token&nbsp;moves</b></span>',
  },
  {
    // /blog/anatomy-of-a-verb — the four execution models, dissected.
    out: 'og-blog-anatomy-of-a-verb.png',
    fig: 'FIG B.9',
    size: 62,
    headline: 'Anatomy<br><span class="b">of a verb.</span>',
    sub: 'What makes infer, exec, invoke and agent genuinely different execution models&nbsp;— in the engine\'s own verdicts.',
    detail:
      '<span class="arrow">▸</span><span>four&nbsp;verbs<span class="sep">·</span>four&nbsp;budgets<span class="sep">·</span><b>four&nbsp;blast&nbsp;radii</b></span>',
  },
  {
    // /blog/the-trace-you-can-replay — the flight recorder.
    out: 'og-blog-the-trace-you-can-replay.png',
    fig: 'FIG B.8',
    size: 62,
    headline: 'The trace<br><span class="b">you can replay.</span>',
    sub: 'Every run leaves a flight recorder: a deterministic audit trail you replay like a film, never re-execute by&nbsp;accident.',
    detail:
      '<span class="arrow">▸</span><span>run&nbsp;--json<span class="sep">·</span>trace&nbsp;replay<span class="sep">·</span><b>re-render,&nbsp;never&nbsp;re-execute</b></span>',
  },
  {
    // /blog/the-note-that-started-it — the origin note (Oct 2025).
    out: 'og-blog-the-note-that-started-it.png',
    fig: 'FIG 0.1',
    size: 62,
    headline: 'The note<br><span class="b">that started it.</span>',
    sub: 'October 2025, one evening note: the best AI work of the month had just disappeared&nbsp;— write it down, own it forever.',
    detail:
      '<span class="arrow">▸</span><span>the&nbsp;work&nbsp;is&nbsp;real<span class="sep">·</span><b>the&nbsp;container&nbsp;is&nbsp;fake</b></span>',
  },
  {
    // /blog/naming-the-drum — the name and the lore.
    out: 'og-blog-naming-the-drum.png',
    fig: 'FIG 0.2',
    headline: 'Naming<br><span class="b">the drum.</span>',
    sub: 'Why a workflow engine carries the name of a liberation god&nbsp;— and a butterfly on every&nbsp;commit.',
    detail:
      '<span class="arrow">▸</span><span>the&nbsp;sun&nbsp;god<span class="sep">·</span>the&nbsp;beat<span class="sep">·</span><b>the&nbsp;butterfly</b></span>',
  },
  {
    // /blog/intent-as-code — the founding post's own card.
    out: 'og-blog-intent-as-code.png',
    fig: 'FIG B.1',
    size: 62,
    headline: 'Intent as Code:<br><span class="b">your AI work, as a file.</span>',
    sub: 'Chats evaporate, files compound&nbsp;— the case for writing AI work down as source you&nbsp;own.',
    detail:
      '<span class="arrow">▸</span><span>write&nbsp;it&nbsp;down<span class="sep">·</span>diff&nbsp;it<span class="sep">·</span><b>own&nbsp;it&nbsp;forever</b></span>',
  },
  {
    // /blog/four-verbs — the language post's own card.
    out: 'og-blog-four-verbs.png',
    fig: 'FIG B.2',
    headline: 'Four verbs<br><span class="b">are enough.</span>',
    sub: 'A verb is a distinct execution model, not a feature&nbsp;— why the language locks at four, forever.',
    detail:
      '<span class="arrow">▸</span><span>infer<span class="sep">·</span>exec<span class="sep">·</span>invoke<span class="sep">·</span>agent<span class="sep">·</span><b>no&nbsp;fifth,&nbsp;ever</b></span>',
  },
  {
    // /blog/open-spec-copyleft-engine — the licensing argument.
    out: 'og-blog-open-spec-copyleft-engine.png',
    fig: 'FIG B.3',
    size: 62,
    headline: 'An open spec,<br><span class="b">a copyleft engine.</span>',
    sub: 'Apache-2.0 spec anyone can build on. AGPL engine nobody can take closed. The exit is cp&nbsp;-r.',
    detail:
      '<span class="arrow">▸</span><span>spec&nbsp;Apache-2.0<span class="sep">·</span>engine&nbsp;AGPL-3.0<span class="sep">·</span><b>files&nbsp;yours</b></span>',
  },
  {
    // /blog/standard-library-not-plugin-store — the stdlib argument.
    out: 'og-blog-standard-library-not-plugin-store.png',
    fig: 'FIG B.4',
    size: 62,
    headline: 'A standard library,<br><span class="b">not a plugin store.</span>',
    sub: '23 builtins in the binary, allow-listed, nothing to install&nbsp;— the library grows, the language holds&nbsp;still.',
    detail:
      '<span class="arrow">▸</span><span>files<span class="sep">·</span>data<span class="sep">·</span>web<span class="sep">·</span>flow<span class="sep">·</span><b>nothing&nbsp;to&nbsp;install</b></span>',
  },
  {
    // /blog/blast-radius-in-the-file — the permits argument.
    out: 'og-blog-blast-radius-in-the-file.png',
    fig: 'FIG B.5',
    size: 62,
    headline: 'The blast radius<br><span class="b">is part of the file.</span>',
    sub: 'permits: is the whole list&nbsp;— everything not on it is denied before it runs, with a named&nbsp;error.',
    detail:
      '<span class="arrow">▸</span><span><b>permits:</b>&nbsp;default-deny<span class="sep">·</span>NIKA-SEC-004<span class="sep">·</span>before&nbsp;it&nbsp;runs</span>',
  },
  {
    // /blog/dag-for-free — the plan argument.
    out: 'og-blog-dag-for-free.png',
    fig: 'FIG B.6',
    headline: 'The plan<br><span class="b">you get for free.</span>',
    sub: 'with: is all you write&nbsp;— the binding IS the edge. Parallelism and ordering fall out of the graph, drawn before anything&nbsp;runs.',
    detail:
      '<span class="arrow">▸</span><span><b>with:</b><span class="sep">·</span>waves<span class="sep">·</span>max&nbsp;parallelism,&nbsp;computed</span>',
  },
  {
    // /blog/own-your-stack — the local-first argument.
    out: 'og-blog-own-your-stack.png',
    fig: 'FIG B.7',
    headline: 'No cloud<br><span class="b">needed.</span>',
    sub: 'One Rust binary, your models, your files&nbsp;— 5 of the 16 providers run fully&nbsp;local.',
    detail:
      '<span class="arrow">▸</span><span>ollama<span class="sep">·</span>lm&nbsp;studio<span class="sep">·</span>llama.cpp<span class="sep">·</span>localai<span class="sep">·</span>vllm</span>',
  },
  {
    // /convert — the exchange. Your repeated task becomes a file you own.
    out: 'og-convert.png',
    fig: 'FIG →',
    headline: 'Send us<br><span class="b">a workflow.</span>',
    sub: 'Describe one AI task you repeat&nbsp;— we convert the best into runnable .nika.yaml examples, credited to&nbsp;you.',
    detail:
      '<span class="arrow">▸</span><span>your&nbsp;task<span class="sep">·</span>a&nbsp;file&nbsp;you&nbsp;<b>own</b></span>',
  },
];

// ── the card template (a function of one card spec) ─────────────────────────
const cardHtml = (c) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'Martian Grotesk';
    src: url(data:font/woff2;base64,${grotesk}) format('woff2');
    font-weight: 100 900;
  }
  @font-face {
    font-family: 'Martian Mono';
    src: url(data:font/woff2;base64,${mono}) format('woff2');
    font-weight: 100 800;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  :root {
    --bg: #0a0b0d;
    --ink: #f4f5f7;
    --dim: #8a8f98;
    --faint: #6c727c;
    --line: rgba(255,255,255,0.09);
    --cyan: #22d3ee;
    --violet: #b07bff;
  }
  body {
    position: relative;
    background: var(--bg);
    color: var(--ink);
    font-family: 'Martian Grotesk', sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }

  /* ── the EdgeAurora — the v4 signature · the LONE colour ──────────────────
     a blurred conic cyan→violet ring hugging the frame, masked transparent at
     the centre so the card stays black & readable. */
  .aurora {
    position: absolute;
    inset: -22%;
    background: conic-gradient(from 200deg,
      #22d3ee 0%, #b07bff 25%, #22d3ee 50%, #b07bff 75%, #22d3ee 100%);
    -webkit-mask: radial-gradient(ellipse 70% 76% at 50% 50%,
      transparent 50%, #000 92%);
    filter: blur(86px);
    opacity: ${c.cosmic ? 0.34 : 0.26};
  }
  /* a hard 1px inner frame line over the aurora — the instrument bezel */
  .bezel {
    position: absolute;
    inset: 40px;
    border: 1px solid var(--line);
  }
  /* corner registration ticks on the bezel (engineering-manual register) */
  .tick { position: absolute; width: 14px; height: 14px; }
  .tick::before, .tick::after {
    content: ''; position: absolute; background: rgba(255,255,255,0.22);
  }
  .tick::before { width: 14px; height: 1px; top: 0; left: 0; }
  .tick::after  { width: 1px; height: 14px; top: 0; left: 0; }
  .tick.tl { top: 40px;  left: 40px; }
  .tick.tr { top: 40px;  right: 40px; transform: scaleX(-1); }
  .tick.bl { bottom: 40px; left: 40px; transform: scaleY(-1); }
  .tick.br { bottom: 40px; right: 40px; transform: scale(-1,-1); }

  /* ── faint perspective depth grid receding into the floor (hero echo) ──── */
  .depth {
    position: absolute;
    left: 0; right: 0; bottom: 0; height: 62%;
    perspective: 540px;
    perspective-origin: 50% 0%;
    -webkit-mask-image: linear-gradient(to top, #000 0%, #000 24%, transparent 88%);
    overflow: hidden;
  }
  .depth-plane {
    position: absolute;
    inset: -60% -40% -40% -40%;
    transform-origin: 50% 100%;
    transform: rotateX(66deg);
    background-image:
      repeating-linear-gradient(to right, #f4f5f7 0, #f4f5f7 1px, transparent 1px, transparent 52px),
      repeating-linear-gradient(to bottom, #f4f5f7 0, #f4f5f7 1px, transparent 1px, transparent 52px);
    opacity: 0.05;
    -webkit-mask-image: radial-gradient(120% 88% at 50% 100%, #000 0%, rgba(0,0,0,0.5) 42%, transparent 78%);
  }

  /* ── content ───────────────────────────────────────────────────────────── */
  .card {
    position: relative;
    z-index: 2;
    height: 100%;
    padding: 92px 100px;
    display: flex;
    flex-direction: column;
  }

  /* top register row — mark + wordmark · left; FIG · right */
  .top { display: flex; align-items: center; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 20px; }
  .brand svg { width: 56px; height: 56px; display: block; }
  .wordmark {
    font-size: 38px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink);
  }
  .fig {
    font-family: 'Martian Mono', monospace;
    font-size: 13px; letter-spacing: 0.34em; text-transform: uppercase;
    color: var(--dim); font-variant-numeric: tabular-nums;
    display: flex; align-items: center; gap: 14px;
  }
  .fig .rule { display: inline-block; width: 46px; height: 1px; background: var(--line); }

  /* the control headline — the pitch */
  .headline {
    margin-top: auto;
    font-family: 'Martian Grotesk', sans-serif;
    font-weight: 600;
    font-size: ${c.size ?? 72}px;
    line-height: 1.0;
    letter-spacing: -0.03em;
    color: var(--ink);
    max-width: 22ch;
    text-wrap: balance;
  }
  .headline .b { color: var(--dim); }

  .sub {
    margin-top: 30px;
    font-size: 24px;
    line-height: 1.45;
    color: var(--dim);
    max-width: 40ch;
  }

  /* the permits: register hint — a blueprint detail, mono */
  .permits {
    margin-top: 34px;
    font-family: 'Martian Mono', monospace;
    font-size: 16px;
    letter-spacing: 0.01em;
    color: var(--faint);
    display: flex; align-items: baseline; gap: 14px;
  }
  .permits b { color: var(--ink); font-weight: 600; }
  .permits .arrow { color: var(--dim); }
  .permits .sep { color: var(--faint); padding: 0 10px; }

  /* footer ticks — domain · stack */
  .foot {
    margin-top: auto;
    padding-top: 30px;
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid var(--line);
  }
  .domain {
    font-family: 'Martian Mono', monospace;
    font-size: 19px; letter-spacing: 0.04em; color: var(--ink);
  }
  .stack {
    font-family: 'Martian Mono', monospace;
    font-size: 14px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--faint);
    display: flex; align-items: center; gap: 16px;
  }
  .stack .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--faint); display: inline-block; }
  /* THE SHIP watermark · wireframe-lit elevation, fading in from the left so
     the headline column stays clean (spec card only) */
  .card { position: relative; z-index: 1; }
  .art {
    position: absolute; right: -70px; bottom: 26px; width: 780px; z-index: 0;
    opacity: 0.46;
    -webkit-mask-image: linear-gradient(to right, transparent 0, #000 320px);
    mask-image: linear-gradient(to right, transparent 0, #000 320px);
  }
  .art svg { width: 100%; height: auto; display: block; }
  .art [class^='sms'], .art [class*=' sms'] { stroke: #4f86ff; fill: none; }
  .art [data-stratum='frame'] * { stroke: #8db4ff; }
  .art [data-stratum='permits'] * { stroke: #ff7a3c; }
  .art [data-stratum='stdlib'] *, .art [data-stratum='extract'] * { stroke: #22d3ee; }
  .art [data-stratum='providers'] * { stroke: #5b8cff; }
  .art [data-stratum='errors'] * { stroke: #b07bff; }
  .art .sms-port-tip { fill: #22d3ee; stroke: none; }
  .art .sms-keel--req, .art .sms-tick--fetch { stroke-width: 1.7; }
</style>
</head>
<body>
  <div class="aurora"></div>
  <div class="depth"><div class="depth-plane"></div></div>
  <div class="bezel"></div>
  <span class="tick tl"></span><span class="tick tr"></span>
  <span class="tick bl"></span><span class="tick br"></span>

  ${c.ship ? SHIP_ART : ''}
  <div class="card">
    <div class="top">
      <div class="brand">
        <svg viewBox="0 0 1100 1100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="${nikaPath}" fill="#f4f5f7" />
        </svg>
        <span class="wordmark">nika</span>
      </div>
      <div class="fig"><span class="rule"></span>${c.fig}</div>
    </div>

    <h1 class="headline">${c.headline}</h1>
    <p class="sub">${c.sub}</p>
    <p class="permits">${c.detail}</p>

    <div class="foot">
      <span class="domain">nika.sh</span>
      <span class="stack">AGPL<span class="dot"></span>Rust<span class="dot"></span>local-first</span>
    </div>
  </div>
</body>
</html>`;

// ── render → downscale → quantise (per card) ─────────────────────────────────
// Headless Chrome screenshots at DSF 2 (2400×1260) for crisp glyph edges, then
// ImageMagick downscales to 1200×630, then pngquant quantises (256-color palette
// keeps the soft cyan→violet aurora gradient banding-free while staying small).
const sh = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
const CHROME =
  process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const htmlOut = resolve(__dirname, 'og-card.html');
const raw = '/tmp/og-raw.png';
const down = '/tmp/og-down.png';

// optional single-card filter: `node build-og-card.mjs spec` matches og-spec.png
const only = process.argv[2];
const cards = only
  ? CARDS.filter((c) => c.out === `og-${only}.png` || c.out === `${only}.png`)
  : CARDS;
if (cards.length === 0) {
  console.error(`no card matches "${only}" — known: ${CARDS.map((c) => c.out).join(', ')}`);
  process.exit(1);
}

for (const c of cards) {
  const html = cardHtml(c);
  // the committed, inspectable template stays the last card rendered on disk
  writeFileSync(htmlOut, html);

  const out = resolve(pub, c.out);
  sh(CHROME, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=2',
    '--default-background-color=00000000',
    `--screenshot=${raw}`,
    '--window-size=1200,630',
    `file://${htmlOut}`,
  ]);
  sh('magick', [raw, '-resize', '1200x630', '-strip', down]);
  sh('pngquant', [
    '--force',
    '--quality=80-100',
    '--strip',
    '--speed',
    '1',
    '--output',
    out,
    '256',
    down,
  ]);

  const kb = (statSync(out).size / 1024).toFixed(0);
  console.log(`wrote ${out} (${kb} KB · 1200×630)`);
}

console.log(`template on disk: ${htmlOut} (${(cardHtml(cards[cards.length - 1]).length / 1024).toFixed(0)} KB self-contained · last card)`);
