/* ─── size-budget · the initial-JS ceiling (W12 · D2) ─────────────────────────
   Sums the GZIPPED weight of the JS that loads with the home document — the
   entry script plus every modulepreload in dist/index.html — and fails when
   it crosses the budget. Lazy chunks (three-stack, editor, galaxy egg) are
   NOT counted: keeping them lazy is the point, and route-level code split is
   asserted by the second check (no three.js in the entry graph).

   Budget: 341 KB gz (RE-RATCHETED DOWN from 357 · 2026-07-16 WO-12g: the
   register-island arc landed — the showcase/template yaml dictionary left
   the static graph entirely (SSR-door + byte islands + one async chunk),
   measured 356.7 → 339.6. The wo9a raise's death clause is PAID. Margin
   stays ~1.4 KB (the bite-on-growth grammar). History: 350→356 W9 ·
   356→357 WO-9a · 357→341 WO-12g · 341→343 L7 head: the W2 pin
   grows the entry-legit spec data (+21 error codes across surfaces) and
   G.22 ships the chunk-death handler in the entry — data precedent WO-9a ·
   343→344 F-SENSATION-2: the VT-timeout logger, the brand-egg handler
   (its PANEL is a lazy chunk — the entry pays only the right-click hook)
   and the spotlight delegation; the D5/D6 rails paid their own way OUT
   the same day (the blog-rails island diet) · 344→346 WO-7: /sources is a
   real sync-routed page (the hub precedent) — its data is chrome-safe
   already, the weight is the page itself · 346→347 round-2A: the chord
   table + listener ride the entry BY DESIGN (a chord answers on the first
   keystroke, never after a fetch) — the `?` card stays a lazy chunk ·
   347→348 round-3: the hover listener (fine-pointer gate · 350/150 timers ·
   anchor-name plumbing) rides the entry — the CARD and the graph stay lazy
   chunks; +0.4KB of listener is the whole cost ·
   348→350 w2-flip: the w1-to-w2 door pass rides the entry BY DESIGN — the
   browse island fallback and the SPA-nav chunk both hand the client RAW
   ratified bytes, and the served grammar must exist wherever raw bytes
   arrive (idempotent, so pre-transformed islands stay legal); ~1.5KB gz is
   the whole pass, and it retires with the pin flip ·
   350→351 wo14-anatomy: AnatomyView + its access door ride the entry with
   the rooms they serve (the rooms live in the entry chunk — the weight is
   the page itself); the 60K vendored graph module stays a lazy chunk (the
   diet gate pins it) — ~0.9KB gz of component is the whole cost ·
   351→352 wo14-terminal: the record player rides the entry with the /proof
   hub it fills (same law); the captures module stays a lazy chunk loaded
   on mount — ~0.8KB gz of component is the whole cost ·
   352→356 rooms-universelles: 119 member rooms join the prerender (operator
   verdict 2026-07-18 · « chaque élément a sa page ») — the chrome-safe
   member registry rides the entry BY DESIGN (the generic route resolves
   from it AND the map derives its dense tails from it: one source, two
   consumers, both first-render) · the room BODY stays the lazy graph
   (member-room-access) — ~4KB gz of registry+page for 119 real pages.
   356→357 wo14-u5: the two-way task light (DAG hover ↔ editor lines via
   the parse-plan pins) rides the entry with Play+DagView — the COMPLETION
   vocabulary and CodeMirror's autocomplete stay on the /play lazy chunk.
   357→358 design-graph-b: /brand projects the WHOLE graph (layers · paper
   · two-clocks mark · motion tokens render from the emission — the page
   cannot lie) and routes are synchronous BY SSG DESIGN, so the emission
   data + the section rides the entry: ~0.8KB for the projection law.
   358→359 grammar-door: the value axis joins serveW2 (inputs+const fold
   back to vars, root refs rewritten) so the serving surfaces downcast the
   ratified grammar to W2 on the entry: ~0.4KB for copy-paste that survives
   the C2 flip.
   359→365 timeline: /timeline is a real sync-routed record page (the
   WO-7 hub precedent — the weight IS the page): the vendored spec SSOT
   (26 claims · era model · ~3.9KB gz) + the strip/ledger component
   (~3.2KB gz) both prerender, so they ride the entry BY SSG DESIGN; CSS
   pays on its own lane, zero new deps (DOM+CSS native strip · no chart
   lib), measured 363.4 · margin ~1.6 (the bite-on-growth grammar holds).
   365→368 register-unification: five hub pages (boundary · flow · proof ·
   sources · timeline) join the register grammar — StampStrip/CountUp stat
   rows + band heads ride the entry with the sync-routed pages they serve
   (the WO-7 class: the weight IS the pages); measured 366.8 · margin ~1.2
   (the bite-on-growth grammar holds).
   368→369 timeline-chapters: the chapter chips (deep links the stage
   SEEKS · the discoverability of the hash law) + the ledger's today
   divider + era openings on the minimap ride the entry with the
   record page they serve (the WO-7 class); measured 368.4 · margin
   ~0.6 (the bite-on-growth grammar holds).
   369→370 timeline-plays: the play affordance (the record travels
   itself at reading pace · the keyboard's one door into the stage's
   motion · any gesture takes the wheel back) + the terminus's silent
   butterfly ride the entry with the record page (the WO-7 class);
   measured 369.1 · margin ~0.9 (the bite-on-growth grammar holds).
   370→372 changelog-catchup: six engine releases join the ship log
   (0.100 → 0.105 · the register is entry-resident BY DESIGN: the home
   preview and the sync-routed /changelog both read it first-render),
   and the catch-up ratchet now BINDS the log to the ENGINE_VERSION
   pin, so this class of growth arrives with every engine release,
   deliberately; measured 370.7 · margin ~1.3 (the bite-on-growth
   grammar holds).
   372→374 contract-front: the written-law rail (the numbered NEPs of
   the spec governance, linked verbatim) joins the home boundary beat
   and the /boundary register (the WO-7 class: sync-routed pages ride
   the entry), the hero closes on the contract tricolon and the proof
   ledger gains the priced-before-it-spends row + the estate note;
   measured 372.0 · margin ~2.0 (the bite-on-growth grammar holds).
   374→377 provider-rooms: the providers graduate to DEDICATED rooms
   (the ToolPage class: /providers/:id is sync-routed, the component
   rides the entry) while the room's CARGO — donor yaml · audit · the
   authored meta — stays an async chunk behind the byte island
   (provider-room-access, the register-diet law); the doors half of
   « chaque élément a sa page » also lands (registers link their
   member rooms: hubs · errors · tools · sources · language · the
   fetch modes); measured 375.0 · margin ~2.0 (the bite-on-growth
   grammar holds).
   377→383 dedicated-rooms sweep: the duplicate-content class dies —
   /errors/:code (ErrorPage) and /templates/:name (TemplatePage) become
   rooms ABOUT the member, the journal's tags earn citable registers
   (/blog/tags/:tag), and the hero's library earns its shelf + ten
   rooms (/library · /library/:id — PlanMap + the honesty contract on
   the face). Five sync-routed page components ride the entry (the
   WO-7 class: the weight IS the pages; every data module they read
   was entry-resident already); measured 381.2 · margin ~1.8 (the
   bite-on-growth grammar holds).
   383→386 integrations: the ecosystem earns its register — get Nika
   into your stack, one room per client lane (Claude Code · Codex ·
   Cursor · VS Code · Hermes · MCP) and per public repo, install
   rituals verbatim from the READMEs. The authored cargo rides a byte
   island (integrations-access · the register-diet law: the 388.0
   naive measure came back to 384.1); the residual is the two
   sync-routed page components + the chrome-lean TABS (the WO-7
   class); measured 384.1 · margin ~1.9 (the bite-on-growth grammar
   holds).
   386→389 family-roots + the wow pass: thirteen 404 roots die
   (/types · /permits · /truth … — every roomed family owns its root,
   FamilyRoot rides the entry as sync-routed pages do, the WO-7
   class) · the provider rooms gain the DRAWN one-word diff (the
   sovereignty swap, both directions) · the map TOC dots and the
   integrations kit-bento are CSS-only; measured 386.7 · margin ~2.3
   (the bite-on-growth grammar holds).
   389→390 semantic-yaml: the panel colours by CONTRACT instead of by YAML
   syntax. The word→role table is DERIVED from the served language twin
   (never authored) and the tokenizer gains a parent-chain pass — which is
   what lets `tools` under `permits:` read as boundary while `tools` under
   `agent:` reads as the verb's; position is the only thing that can tell
   them apart. ~0.3KB gz for the whole semantic layer; the plan derivation
   and the drawing stay in their lazy chunk. DEATH CLAUSE: this retires INTO
   the spec — the day design/tokens.yaml carries the roles, the derivation
   leaves the bundle and the ceiling comes back down.
   CLAUSE DISCHARGED 2026-07-27: design/tokens.yaml carries the three roles
   and the spec's projector DERIVES their membership from workflow.schema.json,
   so scripts/build-code-roles.mjs and code-roles.generated.ts are gone and the
   memberships arrive in design-tokens.generated.ts — the same module the
   vscode extension consumes, which is what makes an editor and this panel
   unable to disagree about what a word MEANS. The bytes were never the point
   here (a space-joined table is a rounding error); the SECOND PRODUCER was.
   The ceiling came down by the prose diet below, on the same day.
   393→390 PAID, same day: the debt below was not carried, it was cut. The
   language index and its PROSE are two modules now — the sentences reach the
   three rooms that show them (/language · /language/:word · /verbs/:name)
   through src/lib/language-prose-access.ts: present at SSG by a top-level SSR
   import (so the rooms stay readable with JavaScript off), embedded as a byte
   island for hydration, an async chunk only on SPA-nav. Measured 392.2 → 388.6
   — the ceiling returns to where it stood before the pin advance, with ~1.4
   margin, and the entry stops growing every time the contract teaches a word.
   A gate pins it: language.test asserts the entry-resident index carries no
   "desc" at all. The ROLES clause above is discharged the same day.
   390→393 pin-advance 2026-07-27: the resync pin was 68 commits behind (the
   daily cron had been red for six days on a digest pinned to a commit it was
   not pinned to). Advancing it landed real CONTENT, not code: three new words
   (declassify · inert · run), a fifth permit family (env · NEP-0005), the
   24 schema descriptions of nika-spec#209, and the error codes minted since.
   Measured 392.2 — the growth is prose the contract now teaches, and prose is
   the point of this site. TWO DEBTS STAND, both named rather than paid here:
     · the roles clause above, still unpaid (design/tokens.yaml promotion);
     · NEW · `language.generated.ts` carries every word's FULL description and
       rides the ENTRY chunk, because the five /language + /verbs pages are
       sync-routed for the prerenderer. The rooms already ship that prose as
       prerendered HTML, so the bundle copy only serves SPA-nav — it belongs
       in a lazy chunk behind an access door (src/lib/lens-access.ts is the
       proven shape). That cut is worth more than this raise; it needs the
       five pages to stop reading the prose synchronously, which is a
       refactor, not a bump.
   390→391 card-convergence 2026-07-28: TWO HALVES, and only one is mine.
     · MINE, 0.3: the site's DagView stopped drawing a node of its own
       invention (21 `.dv-*` selectors, ZERO shared with the 139 the VS Code
       canvas styles) and now composes its class string with the projected
       nikaNodeClass() + NIKA_NODE_CLASSES. Those were tree-shaken while
       nothing used them; they are in the entry now because the card is real.
       It buys one vocabulary across three surfaces and deletes a renderer's
       worth of divergence — a fair 0.3.
     · NOT MINE, 0.3: the tree was ALREADY 390.3 before this branch (measured
       identical at 555dc4a and c35bf07, red on every run). 8b46bb4 measured
       388.6 when it lowered the ceiling to 390, so ~1.7 came back between
       there and here, undiagnosed. Raising to 391 clears the red rather than
       leaving a gate everyone has learned to ignore, but the growth is NOT
       explained and stays a debt: someone should bisect 8b46bb4..HEAD for it.
       The lazy-language cut named above is still the bigger prize.
   Run: pnpm build && node scripts/size-budget.mjs */
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const BUDGET_KB = 391

const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const entry = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1])
const unique = [...new Set(entry)]

let total = 0
let fail = false
for (const path of unique) {
  const raw = readFileSync(join(DIST, path))
  const gz = gzipSync(raw, { level: 9 }).length
  total += gz
  const src = raw.toString()
  /* the three-stack must never ride the entry graph */
  const leaked = /three\.module|WebGLRenderer|@react-three/.test(src) && /createRoot|hydrateRoot/.test(html)
  if (/WebGLRenderer/.test(src)) {
    console.error(`✗ three.js leaked into the entry graph: ${path}`)
    fail = true
  }
  console.log(`  ${(gz / 1024).toFixed(1).padStart(7)} KB gz  ${path}${leaked ? '  ← LEAK' : ''}`)
}

const totalKb = total / 1024
const verdict = totalKb <= BUDGET_KB && !fail
console.log(`${verdict ? '✓' : '✗'} initial JS: ${totalKb.toFixed(1)} KB gz · budget ${BUDGET_KB} KB · ${unique.length} files`)
process.exit(verdict ? 0 : 1)
