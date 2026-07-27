#!/usr/bin/env node
/* nika design bench · the system, projected into a workshop you can open.
 *
 *   node design/bench.mjs          write design/bench.html
 *   node design/bench.mjs --check  verify it matches the SSOT (CI gate)
 *
 * WHY THIS IS GENERATED AND NOT DRAWN. A design system documented by hand
 * drifts from the system the day someone edits one and not the other, and then
 * the page that was supposed to be the reference becomes the least reliable
 * surface in the repo. So the bench is a PROJECTION: the palette comes from
 * design-tokens.generated.ts (itself projected from nika-spec design/tokens.yaml),
 * the layer hues from design.generated.css, the motion from the site's own
 * tokens.css, and the node's anatomy from the CANON table below — the one place
 * it is written down.
 *
 * WHY IT IS ONE SELF-CONTAINED FILE. It opens with a double-click, offline,
 * from a checkout, forever. No server, no build step, no network, no account.
 * A design reference you cannot open is not a reference.
 *
 * WHY IT IS A WORKSHOP AND NOT A GALLERY. A page that only SHOWS the system
 * cannot tell you whether the system is any good. This one lets you move the
 * five values every surface shares, watch every specimen answer at once, read
 * what the change did to text contrast — and then hands you the diff, per file,
 * ready to paste. The knobs are the design conversation; the diff is the
 * commit. (Locked 2026-07-27: precise ground, one signature — the register is
 * Linear/Raycast restraint everywhere, and the one bold moment is the node
 * taking itself apart.)
 *
 * THE ANATOMY TABLE IS A DRAFT CANON. It was recovered by reading the shipped
 * canvas (vscode dag.ts · 9373 lines, dag.css · 7097 lines, and the anatomy
 * assertions in verbAnatomies.test.ts). It lives here until it earns its place
 * in nika-spec design/tokens.yaml — at which point this script reads it from
 * there and stops holding it. The same is true of every knob marked « spec ». */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = `${ROOT}design/bench.html`

/* ── the palette, read out of the projections ─────────────────────────────── */
const tokensTs = readFileSync(`${ROOT}src/design-tokens.generated.ts`, 'utf8')
const designCss = readFileSync(`${ROOT}src/design.generated.css`, 'utf8')
const siteCss = readFileSync(`${ROOT}src/styles/tokens.css`, 'utf8')

const constObject = (name) => {
  const body = tokensTs.match(new RegExp(`export const ${name} = \\{([^}]*)\\}`))?.[1]
  if (!body) throw new Error(`bench: ${name} not found in design-tokens.generated.ts`)
  return Object.fromEntries([...body.matchAll(/(\w+):\s*'([^']+)'/g)].map((m) => [m[1], m[2]]))
}
const cssVar = (name) => designCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`))?.[1] ?? null
/* the site's own non-colour tokens · the motion knob's default is DERIVED from
   what the site actually ships, never retyped here */
const siteVar = (name) => {
  const v = siteCss.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim()
  if (!v) throw new Error(`bench: no --${name} in src/styles/tokens.css`)
  return v
}

const VERB_HEX = constObject('NIKA_VERB_HEX')
const VERB_TEXT = constObject('NIKA_VERB_TEXT')
const VERB_GLYPH = constObject('NIKA_VERB_GLYPH')
const VERB_CODICON = constObject('NIKA_VERB_CODICON')
const SEVERITY = constObject('NIKA_SEVERITY')
const SEVERITY_TEXT = constObject('NIKA_SEVERITY_TEXT')
const STATUS = constObject('NIKA_STATUS')
const ROLE_WORDS = constObject('NIKA_ROLE_WORDS')
const ROLE_MARK = constObject('NIKA_ROLE_MARK')
const ROLE_CODICON = constObject('NIKA_ROLE_CODICON')
const ROLE_WEB = constObject('NIKA_ROLE_WEB_TOKEN')
const ROLE_VSCODE = constObject('NIKA_ROLE_VSCODE')

const DUR_UI = siteVar('dur-ui') /* '140ms' today */
const EASE_UI = siteVar('ease-ui')
const DUR_MS = Number(DUR_UI.match(/([\d.]+)ms/)?.[1] ?? 0)
if (!DUR_MS) throw new Error(`bench: --dur-ui is not in ms (${DUR_UI})`)

const LAYERS = ['shape', 'flow', 'acts', 'reach', 'boundary', 'refusals', 'proof']
const LAYER_HEX = Object.fromEntries(LAYERS.map((l) => [l, cssVar(`layer-${l}`)]))
for (const [l, hex] of Object.entries(LAYER_HEX)) {
  if (!hex) throw new Error(`bench: no --layer-${l} in design.generated.css`)
}

/* THE BRAND SKIN IS THE CANVAS'S OWN, NOT AN APPROXIMATION OF IT. These are
   the values `body[data-nk-theme='nika']` sets in the shipped canvas source
   (nika-vscode src/webview/dag.css, the brand block) — recovered 2026-07-27
   after the bench's first draft was caught modelling them by eye. Only
   `--nk-card` had been guessed right; surface, ink and dim were all off, and
   the LINES were the real surprise: the canvas draws them as WHITE AT LOW
   ALPHA over whatever is beneath, not as opaque greys. A border that is a
   fraction of the light is a different design decision from a border that is
   a colour, and modelling it wrong made every contrast reading downstream a
   reading of the wrong system.

   They are transcribed here rather than read across repos on purpose: this
   script runs in the website's CI, where no vscode checkout exists. That is
   precisely the gap the ledger's « pas encore projeté » row names — the day
   these live in nika-spec design/tokens.yaml, this block deletes itself. */
const brand = {
  bg: '#0d0d0e', /* --nk-page */
  surface: '#17171a', /* --nk-surface */
  raised: '#1c1d21', /* --nk-card · the one the first draft got right */
  ink: '#f4f5f7', /* --nk-ink */
  dim: '#8a8f98', /* --nk-ink-dim */
  faint: STATUS.muted, /* --nk-st-muted · projected, and the canvas agrees */
  line: 'rgb(255 255 255 / 0.09)', /* --nk-border */
  lineStrong: 'rgb(255 255 255 / 0.2)', /* --nk-border-strong */
}

/* the theme skin · what a webview inherits under `nika.canvas.skin = "theme"`.
   VS Code Light+ chart colours and greys, so the bench can prove the system
   survives a palette it does not own. */
const theme = {
  bg: '#ffffff', surface: '#f3f3f3', raised: '#ffffff',
  ink: '#1f1f1f', dim: '#616161', faint: '#8c8c8c',
  line: '#e5e5e5', lineStrong: '#cecece',
  verb: { infer: '#1a85ff', exec: '#d18616', invoke: '#0598bc', agent: '#9068c4' },
  verbText: { infer: '#1a5fb4', exec: '#a35f00', invoke: '#06697f', agent: '#6c4a99' },
  ok: '#388a34', fail: '#e51400', failText: '#b31200',
  layer: { shape: '#1a85ff', flow: '#1a85ff', acts: '#9068c4', reach: '#0598bc',
    boundary: '#d18616', refusals: '#e51400', proof: '#388a34' },
}

/* ── THE KNOBS · the five values every surface shares ─────────────────────────
   Each one names WHERE ITS DIFF GOES, because that is the question a designer
   cannot answer from a swatch: does this knob travel? A radius travels — the
   VS Code canvas draws the same node. A page rhythm does not — VS Code has no
   sections. Marking the destination is what keeps the shared system shared and
   stops the site's private opinions from leaking into the spec. */
const KNOBS = [
  { id: 'radius', label: 'rayon du nœud', css: '--nk-radius', min: 0, max: 14, step: 1,
    unit: 'px', def: 7, home: 'spec', key: 'node.radius',
    note: 'le coin · le réglage le plus visible, et il voyage tel quel vers VS Code' },
  { id: 'pad', label: 'densité', css: '--nk-pad', min: 3, max: 14, step: 0.5,
    unit: 'px', def: 7, home: 'spec', key: 'node.pad',
    note: 'l’air dans chaque rangée · c’est lui qui décide combien de nœuds tiennent à l’écran' },
  { id: 'fs', label: 'corps du texte', css: '--nk-fs', min: 9.5, max: 14, step: 0.5,
    unit: 'px', def: 11.5, home: 'spec', key: 'node.font_size',
    note: 'la base · tout le reste du nœud se calcule à partir d’elle' },
  { id: 'edge', label: 'force du trait', css: '--nk-line-boost', min: 0, max: 100, step: 5,
    unit: '', def: 0, home: 'spec', key: 'node.edge_boost',
    note: 'de la ligne discrète vers la ligne franche · monte-le et regarde le contrôle plus bas' },
  { id: 'dur', label: 'durée', css: '--nk-dur', min: 0, max: 400, step: 10,
    unit: 'ms', def: DUR_MS, home: 'site', key: '--dur-ui',
    note: `lu dans tokens.css (${DUR_UI}) · le site le possède aujourd’hui, les deux surfaces en auraient besoin` },
]
const HOMES = {
  spec: { path: 'nika-spec · design/tokens.yaml', hint: 'partagé · projeté vers les trois surfaces' },
  site: { path: 'nika.sh · src/styles/tokens.css', hint: 'site seulement · aucune projection à ce jour' },
}

/* ── THE NODE CANON · draft, recovered from the shipped canvas ────────────── */

/* the build order per verb. `invoke` is the ONE reorder: its essence — the tool
   it calls — leads the mechanism, because that is what a reader looks for
   first. Everything else puts the mechanism (the verdict-bearing row) before
   the essence. The agent band rides between the ordered pair and the why. */
const ANATOMY = {
  infer: ['head', 'sub', 'body', 'why'],
  exec: ['head', 'sub', 'body', 'why'],
  invoke: ['head', 'body', 'sub', 'why'],
  agent: ['head', 'sub', 'body', 'band', 'why'],
}
const PART_NAME = {
  head: 'tête · qui et quel verbe',
  sub: 'mécanisme · comment',
  body: 'essence · ce qu’il fait',
  band: 'bande · où il en est',
  why: 'pourquoi · ce qui l’autorise',
}

/* every state a node can wear. `form` names what carries it BESIDES colour —
   a state that only exists as a hue dies in forced-colors and in colour-blind
   eyes, so each one owes a second signal. */
const STATES = [
  { id: 'idle', label: 'au repos', form: 'rien · le repos est l’absence de signal' },
  { id: 'running', label: 'en cours', form: 'pastille qui pulse' },
  { id: 'ok', label: 'réussi', form: 'bordure teintée' },
  { id: 'failed', label: 'refusé', form: 'bordure teintée + code' },
  { id: 'retrying', label: 'nouvel essai', form: 'compteur d’essai' },
  { id: 'skipped', label: 'sauté', form: 'opacité 52 %' },
  { id: 'stale', label: 'trace périmée', form: 'trait pointillé' },
  { id: 'developing', label: 'en écriture', form: 'trait pointillé + teinte shape' },
]

/* the atom families · what the node is made of, isolated so each can be judged
   on its own before it is judged in a crowd */
const ATOMS = [
  {
    id: 'pol', title: 'puces de politique', cls: 'nc-pol-*',
    note: 'ce que la tâche promet quand ça tourne mal, ou en parallèle',
    chips: [
      ['on_error · recover', 'refusals'], ['retry ×5', 'refusals'], ['fail_fast', 'refusals'],
      ['on_finally', 'refusals'], ['parallel ×3', 'flow'], ['per-item', 'flow'],
      ['typed', 'shape'], ['thinking', 'acts'], ['vision', 'acts'],
    ],
  },
  {
    id: 'cat', title: 'catégories d’outils', cls: 'nc-cat-*',
    note: 'la famille du builtin appelé · toutes de la couche reach',
    chips: [['core', 'reach'], ['file', 'reach'], ['data', 'reach'], ['network', 'reach'],
      ['media', 'reach'], ['introspection', 'reach']],
  },
]

/* the coherence ledger · what the three surfaces actually share today. This is
   the table the bench exists to empty; every « non » is a place the surfaces
   may drift with nothing to stop them. */
const LEDGER = [
  ['hues des verbes', 'design/tokens.yaml → 3 cibles', true, 'partagé'],
  ['sévérité · statuts', 'design/tokens.yaml → 3 cibles', true, 'partagé'],
  ['rôles sémantiques', 'design/tokens.yaml (2026-07-27)', true, 'partagé'],
  ['glyphes · codicons', 'design/tokens.yaml → 3 cibles', true, 'partagé'],
  ['hues des 7 couches', 'design.generated.css', false, 'site seulement'],
  ['rayon · densité · corps', 'design/bench.mjs (canon de travail)', false, 'ici, pas encore projeté'],
  ['durée · courbe', 'src/styles/tokens.css', false, 'site seulement'],
  ['anatomie du nœud', 'dag.ts · 9 373 lignes', false, 'vscode seulement'],
  ['les 84 jetons --nk-*', 'vscode src/webview/dag.css', false, 'existent · projetés de rien'],
  ['les gris de la peau marque', "body[data-nk-theme='nika']", false, 'transcrits ici · à promouvoir'],
  ['géométrie · placement', 'elkClient · mini-dag-layout', false, 'écrit deux fois'],
  ['rendu du DAG', 'dag.ts · DagView · MiniDag', false, 'écrit trois fois'],
  ['rendu du YAML', 'codefile-highlight · TextMate', false, 'deux grammaires'],
]

/* ── the page ─────────────────────────────────────────────────────────────── */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const swatch = (k, v) => `        <div class="sw"><i style="background:${v}"></i><b>${k}</b><span>${v}</span></div>`

const NODE_SPECIMENS = {
  infer: {
    id: 'triage', sub: ['model', 'anthropic/claude-haiku-4-5'],
    body: '« Flag what is urgent: ${{ with.inbox }} »',
    why: [['with · inbox', 'flow'], ['max_tokens 300', null]],
  },
  exec: {
    id: 'tally', sub: ['capture', 'stdout · decode text'], body: 'wc -l', bodyKind: 'cmd',
    why: [['permits · exec', 'boundary'], ['stdin ${{ }}', null]],
  },
  invoke: {
    id: 'calendar', sub: ['args', 'path ./notes/calendar.md'], body: 'nika:read',
    why: [['core', 'reach'], ['permits · tools', 'boundary']],
  },
  agent: {
    id: 'research', sub: ['tools', 'fetch · write · done'],
    body: '« Research plan · ${{ with.plan_queries }} »',
    band: { loop: 'tour 7 / 25', pct: 41, tk: '61 400 / 150 000' },
    why: [['en cours', null]],
  },
}

const renderNode = (verb, { state = 'idle', anatomy = ANATOMY[verb] } = {}) => {
  const s = NODE_SPECIMENS[verb]
  const p = (name, i, inner, extra = '') =>
    `<div class="nc-${name}${extra}" data-part="${esc(PART_NAME[name])}" style="--i:${i}">${inner}</div>`
  const part = {
    head: (i) => p('head', i, `<span class="nc-glyph">${VERB_GLYPH[verb]}</span><span class="nc-id">${s.id}</span><span class="nc-verb">${verb}</span>`),
    sub: (i) => p('sub', i, `<span class="nc-k">${s.sub[0]}</span> ${esc(s.sub[1])}`),
    body: (i) => p('body', i, esc(s.body), s.bodyKind === 'cmd' ? ' nc-body--cmd' : ''),
    band: (i) => (s.band
      ? p('band', i, `<span>${s.band.loop}</span><span class="nc-meter"><i style="width:${s.band.pct}%"></i></span><span class="nc-tk">${s.band.tk}</span>`)
      : ''),
    why: (i) => p('why', i, s.why.map(([t, layer]) => `<span class="nc-chip"${layer ? ` style="--chip:var(--nk-${layer})"` : ''}>${esc(t)}</span>`).join('')),
  }
  return `<article class="nc" data-verb="${verb}" data-state="${state}">${anatomy.map((name, i) => part[name](i)).join('')}</article>`
}

const stateNode = (st) => `        <div class="cell">
          <span class="cell-k">${st.id}</span>
          <article class="nc" data-verb="exec" data-state="${st.id}">
            <div class="nc-head" data-part="tête" style="--i:0"><span class="nc-glyph">${VERB_GLYPH.exec}</span><span class="nc-id">build</span><span class="nc-verb">exec</span></div>
            <div class="nc-why" data-part="pourquoi" style="--i:1"><span class="nc-st nc-st--${st.id}">${esc(st.label)}</span></div>
          </article>
          <span class="cell-note">${esc(st.form)}</span>
        </div>`

const atomBlock = (a) => `        <div class="cell">
          <span class="cell-k">${esc(a.title)} · <em>${a.cls}</em></span>
          <div class="chiprow">${a.chips.map(([t, l]) => `<span class="nc-chip" style="--chip:var(--nk-${l})">${esc(t)}</span>`).join('')}</div>
          <span class="cell-note">${esc(a.note)}</span>
        </div>`

/* the cross-surface bindings, shown as what they are: one meaning, three
   spellings. This is the family the old bench never showed, and it is the one
   that proves the system is shared rather than merely coordinated. */
const bindingRow = (name, glyph, codicon, extra) =>
  `        <tr><td><span class="bind-g" style="color:var(--nk-${name},var(--room-ink))">${glyph}</span> ${esc(name)}</td><td><code>${esc(codicon)}</code></td><td>${extra}</td></tr>`

const knobRow = (k) => `      <label class="knob" for="k-${k.id}">
        <span class="knob-head">
          <span class="knob-l">${esc(k.label)}</span>
          <output id="o-${k.id}" for="k-${k.id}">${k.def}${k.unit}</output>
        </span>
        <input type="range" id="k-${k.id}" data-knob="${k.id}" min="${k.min}" max="${k.max}" step="${k.step}" value="${k.def}">
        <span class="knob-note"><b class="home home--${k.home}">${k.home === 'spec' ? 'partagé' : 'site'}</b> ${esc(k.note)}</span>
      </label>`

const html = `<title>Nika · l’atelier du design system</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<!--
  GENERATED by design/bench.mjs — do not edit.
  Regenerate: node design/bench.mjs · Gate: node design/bench.mjs --check
  Opens offline, from a checkout, with a double-click. That is the point.
-->
<style>
  @property --nk-verb { syntax: '<color>'; inherits: true; initial-value: #5b8cff; }
  @property --nk-line-boost { syntax: '<number>'; inherits: true; initial-value: 0; }

  :root {
    --room-bg: #f7f8fa; --room-panel: #fff; --room-ink: #16181d; --room-dim: #5a6070;
    --room-faint: #8b91a1; --room-line: #e2e5ec; --room-strong: #c9cedb; --room-accent: #2f6bff;
    --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --ease: ${EASE_UI};
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --room-bg: #0a0b0d; --room-panel: #101216; --room-ink: #e9ecf2; --room-dim: #9aa2b4;
      --room-faint: #666e80; --room-line: #1e222a; --room-strong: #2c313c; --room-accent: #8db4ff;
    }
  }
  :root[data-room="light"] { --room-bg:#f7f8fa; --room-panel:#fff; --room-ink:#16181d; --room-dim:#5a6070; --room-faint:#8b91a1; --room-line:#e2e5ec; --room-strong:#c9cedb; --room-accent:#2f6bff; }
  :root[data-room="dark"] { --room-bg:#0a0b0d; --room-panel:#101216; --room-ink:#e9ecf2; --room-dim:#9aa2b4; --room-faint:#666e80; --room-line:#1e222a; --room-strong:#2c313c; --room-accent:#8db4ff; }

  /* the stage palette · every specimen draws from these and nothing else.
     The five knobbed values sit here too, so one assignment moves every
     specimen on the page at once — which is the whole point of a workshop. */
  .stage {
    --nk-bg:${brand.bg}; --nk-surface:${brand.surface}; --nk-raised:${brand.raised};
    --nk-ink:${brand.ink}; --nk-dim:${brand.dim}; --nk-faint:${brand.faint};
    --nk-line:${brand.line}; --nk-strong:${brand.lineStrong};
${Object.entries(VERB_HEX).map(([k, v]) => `    --nk-${k}:${v};`).join('\n')}
${Object.entries(VERB_TEXT).map(([k, v]) => `    --nk-${k}-text:${v};`).join('\n')}
    --nk-ok:${SEVERITY.ok}; --nk-fail:${SEVERITY.fail}; --nk-fail-text:${SEVERITY_TEXT.fail};
${Object.entries(STATUS).map(([k, v]) => `    --nk-st-${k}:${v};`).join('\n')}
${Object.entries(LAYER_HEX).map(([k, v]) => `    --nk-${k}:${v};`).join('\n')}
${KNOBS.map((k) => `    ${k.css}:${k.def}${k.unit};`).join('\n')}
    --nk-edge: color-mix(in oklch, var(--nk-line), var(--nk-strong) calc(var(--nk-line-boost) * 1%));
    /* the BENCH's own captions · derived from the canvas ink so they move
       with it, and set high enough that the control below clears them. The
       first draft used --nk-st-muted and read Lc 20 — the page that judges
       contrast was failing its own bar. */
    --nk-caption: color-mix(in oklch, var(--nk-ink) 80%, var(--nk-bg));
    transition: background-color calc(var(--nk-dur) * 2) var(--ease);
  }
  .stage[data-skin="theme"] {
    --nk-bg:${theme.bg}; --nk-surface:${theme.surface}; --nk-raised:${theme.raised};
    --nk-ink:${theme.ink}; --nk-dim:${theme.dim}; --nk-faint:${theme.faint};
    --nk-line:${theme.line}; --nk-strong:${theme.lineStrong};
${Object.entries(theme.verb).map(([k, v]) => `    --nk-${k}:${v};`).join('\n')}
${Object.entries(theme.verbText).map(([k, v]) => `    --nk-${k}-text:${v};`).join('\n')}
    --nk-ok:${theme.ok}; --nk-fail:${theme.fail}; --nk-fail-text:${theme.failText};
    --nk-st-running:${theme.verb.infer}; --nk-st-done:${theme.ok}; --nk-st-failed:${theme.fail};
    --nk-st-retrying:${theme.verb.exec}; --nk-st-muted:${theme.faint};
${Object.entries(theme.layer).map(([k, v]) => `    --nk-${k}:${v};`).join('\n')}
  }

  *{box-sizing:border-box}
  body{margin:0;background:var(--room-bg);color:var(--room-ink);font:15px/1.55 var(--sans);-webkit-font-smoothing:antialiased}
  .wrap{max-width:1180px;margin:0 auto;padding:38px 22px 90px}
  .kicker{margin:0;font:500 11px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--room-faint)}
  h1{margin:12px 0 10px;font-size:clamp(25px,4vw,36px);line-height:1.12;letter-spacing:-.022em;text-wrap:balance}
  .lede{margin:0;max-width:66ch;color:var(--room-dim)}
  .lede b{color:var(--room-ink);font-weight:600}
  code{font-family:var(--mono);font-size:.9em;background:var(--room-line);padding:1px 5px;border-radius:4px}

  .console{position:sticky;top:0;z-index:20;display:flex;flex-wrap:wrap;align-items:center;gap:12px;
    margin:24px 0 0;padding:11px 14px;background:color-mix(in oklch,var(--room-panel) 90%,transparent);
    backdrop-filter:blur(10px);border:1px solid var(--room-line);border-radius:10px}
  .console-k{font:500 11px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--room-faint)}
  .seg{display:inline-flex;gap:2px;padding:2px;background:var(--room-bg);border:1px solid var(--room-line);border-radius:8px}
  .seg button{font:500 12px/1 var(--mono);letter-spacing:.03em;padding:7px 12px;border:0;border-radius:6px;cursor:pointer;background:transparent;color:var(--room-dim)}
  .seg button[aria-pressed=true]{background:var(--room-accent);color:#fff}
  .seg button:focus-visible{outline:2px solid var(--room-accent);outline-offset:2px}
  kbd{font:500 10px/1 var(--mono);padding:3px 5px;border:1px solid var(--room-strong);border-bottom-width:2px;border-radius:4px;color:var(--room-dim)}
  .console-note{margin-left:auto;font-size:13px;color:var(--room-dim)}

  section{margin-top:48px}
  .sec-head{display:flex;align-items:baseline;gap:11px;margin-bottom:5px}
  h2{margin:0;font-size:18px;letter-spacing:-.012em}
  .sec-n{font:11px/1 var(--mono);color:var(--room-faint);font-variant-numeric:tabular-nums}
  .sec-note{margin:0 0 18px;max-width:70ch;color:var(--room-dim);font-size:14px}

  /* ── the workshop ───────────────────────────────────────────────────────── */
  .shop{display:grid;grid-template-columns:minmax(280px,340px) 1fr;gap:18px;align-items:start}
  @media (max-width:860px){.shop{grid-template-columns:1fr}}
  .desk{display:grid;gap:16px;padding:18px;background:var(--room-panel);border:1px solid var(--room-line);border-radius:12px}
  .knob{display:grid;gap:6px}
  .knob-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
  .knob-l{font-size:13.5px;font-weight:550}
  .knob output{font:500 12px/1 var(--mono);color:var(--room-ink);font-variant-numeric:tabular-nums;
    padding:3px 6px;background:var(--room-bg);border:1px solid var(--room-line);border-radius:5px}
  .knob input[type=range]{width:100%;accent-color:var(--room-accent);cursor:ew-resize}
  .knob input:focus-visible{outline:2px solid var(--room-accent);outline-offset:3px}
  .knob-note{font-size:11.5px;line-height:1.45;color:var(--room-faint)}
  .home{display:inline-block;font:500 9.5px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;
    padding:2.5px 5px;border-radius:4px;vertical-align:1px;margin-right:4px}
  .home--spec{background:color-mix(in oklch,var(--room-accent) 16%,transparent);color:var(--room-accent)}
  .home--site{background:color-mix(in oklch,var(--room-faint) 20%,transparent);color:var(--room-dim)}
  .desk-foot{display:flex;align-items:center;gap:8px;padding-top:4px;border-top:1px solid var(--room-line)}
  .btn{font:500 12px/1 var(--mono);padding:7px 11px;background:var(--room-bg);color:var(--room-dim);
    border:1px solid var(--room-line);border-radius:7px;cursor:pointer}
  .btn:hover{color:var(--room-ink);border-color:var(--room-strong)}
  .btn:focus-visible{outline:2px solid var(--room-accent);outline-offset:2px}

  .diff{margin-top:18px;border:1px solid var(--room-line);border-radius:10px;overflow:hidden}
  .diff-head{display:flex;align-items:center;gap:10px;padding:9px 13px;background:var(--room-panel);border-bottom:1px solid var(--room-line)}
  .diff-head b{font:500 11px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--room-faint);font-weight:500}
  .diff-head .btn{margin-left:auto;padding:5px 9px}
  .diff pre{margin:0;padding:13px;font:12.5px/1.6 var(--mono);white-space:pre-wrap;overflow-x:auto;color:var(--room-dim)}
  .diff .add{color:#1f8a5c}.diff .del{color:#c2410c}.diff .file{color:var(--room-ink);font-weight:600}
  @media (prefers-color-scheme:dark){.diff .add{color:#34d399}.diff .del{color:#ff9a6f}}

  .stage{background:var(--nk-bg);color:var(--nk-ink);border:1px solid var(--room-strong);border-radius:12px;padding:24px;overflow-x:auto}
  .rack{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start}
  .cell{display:grid;gap:8px;max-width:268px}
  .cell-k{font:500 10px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--nk-caption)}
  .cell-k em{font-style:normal;color:var(--nk-dim)}
  .cell-note{font:11px/1.45 var(--sans);color:var(--nk-caption)}
  .chiprow{display:flex;flex-wrap:wrap;gap:6px}

  .nc{width:252px;background:var(--nk-surface);border:1px solid var(--nk-edge);border-radius:var(--nk-radius);
    overflow:hidden;font-family:var(--mono);font-size:var(--nk-fs);
    transition:border-radius var(--nk-dur) var(--ease), border-color var(--nk-dur) var(--ease)}
  .nc-head{display:flex;align-items:center;gap:7px;padding:calc(var(--nk-pad) * 1.14) calc(var(--nk-pad) * 1.42);
    border-bottom:1px solid var(--nk-edge);background:color-mix(in oklch,var(--nk-verb,var(--nk-ink)) 8%,transparent)}
  .nc-glyph{color:var(--nk-verb,var(--nk-ink));font-size:calc(var(--nk-fs) + .5px);line-height:1}
  .nc-id{font-size:calc(var(--nk-fs) + 1px);font-weight:600;letter-spacing:-.01em}
  .nc-verb{margin-left:auto;font-size:calc(var(--nk-fs) - 1.5px);letter-spacing:.07em;color:var(--nk-verb-text,var(--nk-dim))}
  .nc-sub,.nc-body,.nc-why{padding:var(--nk-pad) calc(var(--nk-pad) * 1.42)}
  .nc-sub{color:var(--nk-dim);border-bottom:1px dashed var(--nk-edge)}
  .nc-k{color:var(--nk-faint)}
  .nc-body{line-height:1.45}
  .nc-body--cmd{color:var(--nk-exec-text)}
  .nc-why{border-top:1px solid var(--nk-edge);display:flex;flex-wrap:wrap;gap:5px;align-items:center}
  .nc-chip{display:inline-flex;align-items:center;padding:1px 6px;border-radius:999px;
    border:1px solid color-mix(in oklch,var(--chip,var(--nk-strong)) 44%,transparent);
    background:color-mix(in oklch,var(--chip,var(--nk-ink)) 10%,transparent);
    color:var(--chip,var(--nk-dim));font-size:calc(var(--nk-fs) - 1.5px);letter-spacing:.03em;white-space:nowrap}
  .nc-band{display:flex;align-items:center;gap:8px;padding:calc(var(--nk-pad) * .86) calc(var(--nk-pad) * 1.42);
    border-top:1px solid var(--nk-edge);background:color-mix(in oklch,var(--nk-agent) 9%,transparent);
    font-size:calc(var(--nk-fs) - 1.5px);color:var(--nk-agent-text)}
  .nc-meter{flex:1;height:3px;border-radius:2px;background:color-mix(in oklch,var(--nk-agent) 22%,transparent);overflow:hidden}
  .nc-meter i{display:block;height:100%;background:var(--nk-agent)}
  .nc-tk{font-variant-numeric:tabular-nums}

${Object.keys(VERB_HEX).map((v) => `  .nc[data-verb="${v}"]{--nk-verb:var(--nk-${v});--nk-verb-text:var(--nk-${v}-text)}`).join('\n')}
  .nc[data-state=ok]{border-color:color-mix(in oklch,var(--nk-ok) 46%,var(--nk-edge))}
  .nc[data-state=failed]{border-color:color-mix(in oklch,var(--nk-fail) 54%,var(--nk-edge))}
  .nc[data-state=running]{border-color:color-mix(in oklch,var(--nk-st-running) 50%,var(--nk-edge))}
  .nc[data-state=retrying]{border-color:color-mix(in oklch,var(--nk-st-retrying) 44%,var(--nk-edge))}
  .nc[data-state=skipped]{opacity:.52}
  .nc[data-state=stale]{border-style:dashed;opacity:.78}
  .nc[data-state=developing]{border-color:color-mix(in oklch,var(--nk-shape) 40%,var(--nk-edge));border-style:dashed}

  .nc-st{display:inline-flex;align-items:center;gap:5px;font-size:calc(var(--nk-fs) - 1.5px);letter-spacing:.05em}
  .nc-st::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
  .nc-st--idle,.nc-st--stale{color:var(--nk-faint)}
  .nc-st--running{color:var(--nk-st-running)}
  .nc-st--ok{color:var(--nk-st-done)}
  .nc-st--failed{color:var(--nk-fail-text)}
  .nc-st--retrying{color:var(--nk-st-retrying)}
  .nc-st--skipped{color:var(--nk-st-muted)}
  .nc-st--developing{color:var(--nk-shape)}
  .nc-st--running::before{animation:p 1.6s ease-in-out infinite}
  @keyframes p{0%,100%{opacity:1}50%{opacity:.28}}

  /* ── THE ONE BOLD MOMENT · the node takes itself apart ───────────────────
     Everything else on this page is quiet on purpose. This is where the
     restraint is spent: press X and each specimen separates into its named
     parts, so the anatomy stops being a caption and becomes the thing you are
     looking at. It teaches — which is why it survives reduced motion (the
     travel goes, the separation and the labels stay). */
  .stage[data-explode] .nc{background:transparent;border-color:transparent;overflow:visible;width:290px}
  .stage[data-explode] .nc > *{
    position:relative;border:1px dashed var(--nk-strong);border-radius:calc(var(--nk-radius) * .6);
    margin-bottom:26px;background:var(--nk-surface);
    transform:translateX(calc(var(--i) * 7px));
    transition:transform .46s var(--ease) calc(var(--i) * 45ms)}
  .stage[data-explode] .nc > *:last-child{margin-bottom:0}
  .stage[data-explode] .nc > *::after{
    content:attr(data-part);position:absolute;left:2px;top:calc(100% + 6px);
    font:10px/1.3 var(--mono);letter-spacing:.05em;color:var(--nk-faint);white-space:nowrap}
  .stage[data-explode] .nc-head{border-bottom-style:dashed}
  @media (prefers-reduced-motion:reduce){
    .nc-st--running::before{animation:none}
    .stage,.nc,.stage[data-explode] .nc > *{transition:none}
    .stage[data-explode] .nc > *{transform:none}
  }

  .sw{display:grid;gap:5px}
  .sw i{height:40px;border-radius:calc(var(--nk-radius) * .85);border:1px solid color-mix(in oklch,var(--nk-ink) 12%,transparent)}
  .sw b{font:500 10px/1 var(--mono);letter-spacing:.04em;color:var(--nk-dim)}
  .sw span{font:10px/1 var(--mono);color:var(--nk-faint);font-variant-numeric:tabular-nums}
  .swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px}

  .tw{overflow-x:auto;border:1px solid var(--room-line);border-radius:10px}
  table{width:100%;border-collapse:collapse;font-size:13.5px}
  th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--room-line)}
  th{font:500 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--room-faint)}
  td:first-child{font-family:var(--mono);font-size:12px;white-space:nowrap}
  td code{font-size:11.5px}
  .bind-g{display:inline-block;width:1.1em;text-align:center}
  .yes{color:#1f8a5c;font-weight:600}.no{color:#c2410c;font-weight:600}
  @media (prefers-color-scheme:dark){.yes{color:#34d399}.no{color:#ff9a6f}}

  /* the control · what the light does to the text */
  .apca{width:100%;border-collapse:collapse;font-size:13px}
  .apca td{padding:7px 12px;border-bottom:1px solid var(--room-line)}
  .apca .lc{font-family:var(--mono);font-variant-numeric:tabular-nums;text-align:right;width:5.5em}
  .apca .need{font-family:var(--mono);font-size:11.5px;color:var(--room-faint);text-align:right;width:6em}
  .apca .v{width:9em;font:500 11px/1 var(--mono);letter-spacing:.05em}
  .apca .v[data-ok="1"]{color:#1f8a5c}.apca .v[data-ok="0"]{color:#c2410c}
  @media (prefers-color-scheme:dark){.apca .v[data-ok="1"]{color:#34d399}.apca .v[data-ok="0"]{color:#ff9a6f}}
  .apca-sub{font-size:11.5px;color:var(--room-faint)}
  footer{margin-top:56px;padding-top:20px;border-top:1px solid var(--room-line);color:var(--room-faint);font-size:13px}
  footer p{max-width:78ch}
</style>

<div class="wrap">
  <header>
    <p class="kicker">nika · design system · atelier · généré</p>
    <h1>Le système, sous une lumière qu’on peut changer et des mesures qu’on peut bouger</h1>
    <p class="lede">
      Cette page est une <b>projection</b>, pas un dessin : la palette vient de
      <code>design-tokens.generated.ts</code>, les couches de <code>design.generated.css</code>,
      la durée de <code>tokens.css</code>, l’anatomie de la table de canon dans
      <code>design/bench.mjs</code>. Elle s’ouvre hors-ligne, depuis un checkout, sans serveur.
      Les curseurs bougent tous les spécimens à la fois, le contrôle dit ce que ça coûte
      aux textes, et le diff en bas dit quoi coller — <b>et dans quel fichier</b>.
    </p>
  </header>

  <div class="console">
    <span class="console-k">plateau</span>
    <span class="seg" role="group" aria-label="Palette du plateau">
      <button type="button" data-skin="brand" aria-pressed="true">marque</button>
      <button type="button" data-skin="theme" aria-pressed="false">thème IDE</button>
    </span>
    <span class="console-k">salle</span>
    <span class="seg" role="group" aria-label="Thème de la page">
      <button type="button" data-room="auto" aria-pressed="true">auto</button>
      <button type="button" data-room="light" aria-pressed="false">clair</button>
      <button type="button" data-room="dark" aria-pressed="false">sombre</button>
    </span>
    <button type="button" class="btn" id="explode" aria-pressed="false">démonter</button>
    <span class="console-note"><kbd>T</kbd> plateau · <kbd>X</kbd> démonter · <kbd>0</kbd> réinitialiser</span>
  </div>

  <section>
    <div class="sec-head"><h2>L’atelier</h2><span class="sec-n">${KNOBS.length} mesures · ${KNOBS.filter((k) => k.home === 'spec').length} partagées</span></div>
    <p class="sec-note">
      Les cinq valeurs que toutes les surfaces se partagent — ou devraient. Chacune dit
      <b>où va son diff</b> : c’est la question qu’un nuancier ne sait pas répondre. Un rayon
      voyage, VS Code dessine le même nœud ; un rythme de page ne voyage pas, VS Code n’a pas
      de sections. Marquer la destination, c’est ce qui garde le partagé partagé.
    </p>
    <div class="shop">
      <div class="desk">
${KNOBS.map(knobRow).join('\n')}
        <div class="desk-foot">
          <button type="button" class="btn" id="reset">réinitialiser</button>
          <span class="apca-sub" id="dirty">rien n’a bougé</span>
        </div>
      </div>
      <div class="stage" data-stage><div class="rack">
${Object.keys(ANATOMY).map((v) => `        <div class="cell"><span class="cell-k">${v} · ${ANATOMY[v].join(' · ')}</span>${renderNode(v, { state: v === 'agent' ? 'running' : 'idle' })}</div>`).join('\n')}
      </div></div>
    </div>
    <div class="diff">
      <div class="diff-head"><b>le diff</b><button type="button" class="btn" id="copy">copier</button></div>
      <pre id="diffout">Bouge un curseur : le diff s’écrit ici, groupé par fichier.</pre>
    </div>
  </section>

  <section>
    <div class="sec-head"><h2>Les jetons</h2><span class="sec-n">${Object.keys(VERB_HEX).length} verbes · ${LAYERS.length} couches · ${Object.keys(ROLE_WORDS).length} rôles</span></div>
    <p class="sec-note">Valeurs lues dans les projections, jamais retapées. Le reste de la page ne connaît que ces noms.</p>
    <div class="stage" data-stage>
      <div class="swatches">
${Object.entries(VERB_HEX).map(([k, v]) => swatch(k, v)).join('\n')}
${swatch('ok', SEVERITY.ok)}
${swatch('fail', SEVERITY.fail)}
${Object.entries(LAYER_HEX).map(([k, v]) => swatch(k, v)).join('\n')}
      </div>
    </div>
  </section>

  <section>
    <div class="sec-head"><h2>Les états</h2><span class="sec-n">${STATES.length} · la forme dit l’état, pas seulement la couleur</span></div>
    <p class="sec-note">
      Un état porté par la seule teinte meurt en contraste forcé et sous un œil daltonien.
      Chacun doit un second signal — c’est ce que dit la légende sous chaque spécimen.
    </p>
    <div class="stage" data-stage><div class="rack">
${STATES.map(stateNode).join('\n')}
    </div></div>
  </section>

  <section>
    <div class="sec-head"><h2>Les atomes</h2><span class="sec-n">les pièces, isolées</span></div>
    <p class="sec-note">Chaque pièce doit tenir seule avant de tenir dans un nœud. C’est là que la bascule de palette est la plus cruelle.</p>
    <div class="stage" data-stage><div class="rack">
${ATOMS.map(atomBlock).join('\n')}
    </div></div>
  </section>

  <section>
    <div class="sec-head"><h2>Les liaisons</h2><span class="sec-n">un sens · trois orthographes</span></div>
    <p class="sec-note">
      La famille qui prouve que le système est <b>partagé</b> et pas seulement coordonné :
      chaque sens porte un glyphe pour nous, un codicon pour VS Code, un jeton pour le web.
      Ces trois colonnes sortent du même <code>design/tokens.yaml</code> — les changer d’un
      côté seulement est impossible par construction.
    </p>
    <div class="tw"><table>
      <thead><tr><th>le sens</th><th>codicon · vscode</th><th>et sur le web</th></tr></thead>
      <tbody>
${Object.keys(VERB_HEX).map((v) => bindingRow(v, VERB_GLYPH[v], VERB_CODICON[v], `<code>--nk-${v}</code> · <span style="color:var(--nk-${v})">■</span> ${VERB_HEX[v]}`)).join('\n')}
${Object.keys(ROLE_WORDS).map((r) => bindingRow(r, '·', ROLE_CODICON[r], `<code>${esc(ROLE_WEB[r])}</code> · marque <code>${esc(ROLE_MARK[r])}</code> · <code>${esc(ROLE_VSCODE[r])}</code>`)).join('\n')}
      </tbody>
    </table></div>
  </section>

  <section>
    <div class="sec-head"><h2>Le contrôle</h2><span class="sec-n">APCA · mesuré sur le rendu, pas sur les jetons</span></div>
    <p class="sec-note">
      Ce que la lumière fait aux textes. Chaque ligne compose réellement les fonds
      semi-transparents empilés sous le texte, puis calcule le <b>Lc</b> APCA et le compare
      au minimum que sa propre taille exige. Bascule le plateau sur <b>thème IDE</b>, ou monte
      <b>la force du trait</b>, et regarde qui tombe. C’est le gate visuel qu’on n’a pas encore
      en CI.
    </p>
    <div class="tw"><table class="apca"><tbody id="apcaout"></tbody></table></div>
    <p class="sec-note" style="margin:14px 0 0">
      Au réglage d’usine, sept lignes sont sous leur plancher et ce sont toutes des questions
      posées au canvas, pas au banc. Trois valent une décision : la <b>rangée mécanisme</b>
      (Lc 41 · elle porte le modèle, la capture, les arguments — ça se lit), le <b>corps de
      commande</b> (Lc 61 pour une ligne de shell qu’il faut lire à la lettre), et la pastille
      <b>sauté</b>, qui tombe à Lc 0 une fois l’opacité 0,52 de sa carte comptée — invisible,
      pas discrète. Les deux marginales (verbe · compteur, Lc 59,8 et 59,4) tiennent à la
      teinte de fond de la tête ; elles passent la barre en montant
      <b>la force du trait</b>, ce qui est exactement ce à quoi sert le curseur.
    </p>
  </section>

  <section>
    <div class="sec-head"><h2>Ce qui est partagé, ce qui ne l’est pas</h2><span class="sec-n">${LEDGER.filter((r) => r[2]).length} sur ${LEDGER.length}</span></div>
    <p class="sec-note">Le tableau que cet atelier existe pour vider. Chaque « non » est un endroit où les surfaces peuvent diverger sans que rien ne l’empêche.</p>
    <div class="tw"><table>
      <thead><tr><th>ce que c’est</th><th>où ça vit</th><th>dans le SSOT ?</th></tr></thead>
      <tbody>
${LEDGER.map(([what, where, ok, verdict]) => `        <tr><td>${esc(what)}</td><td>${esc(where)}</td><td class="${ok ? 'yes' : 'no'}">${esc(verdict)}</td></tr>`).join('\n')}
      </tbody>
    </table></div>
  </section>

  <footer>
    <p>
      Généré par <code>design/bench.mjs</code> · régénérer <code>node design/bench.mjs</code> ·
      la dérive est gatée par <code>--check</code>. L’anatomie et les trois mesures marquées
      « ici, pas encore projeté » sont un canon de travail, relevé sur le canvas livré ; elles
      rejoindront <code>nika-spec design/tokens.yaml</code> quand elles auront fait leurs preuves
      ici. Les réglages restent dans ce navigateur — rien ne part nulle part.
    </p>
    <p>
      Le contrôle APCA implémente la formule 0.1.9. Chaque sonde déclare ce qu’elle est :
      <b>corps</b> (lu en continu · table des tailles · 36 px → 45 · 24 px ou 16 px gras → 60 ·
      14 px → 75 · plus petit → 90), <b>ponctuel</b> (lu d’un coup d’œil · Lc 60) ou
      <b>effacé</b> (volontairement en retrait · Lc 30, le seuil de discernabilité). Sans cette
      distinction le premier jet criait au loup — dix échecs sur douze, dont neuf faux. C’est une
      aide au jugement, pas une certification.
    </p>
  </footer>
</div>

<script>
  var KNOBS = ${JSON.stringify(KNOBS.map(({ id, css, unit, def, home, key }) => ({ id, css, unit, def, home, key })))};
  var HOMES = ${JSON.stringify(HOMES)};
  var STORE = 'nika-bench-v2';
  var stages = document.querySelectorAll('[data-stage]');
  var state = { skin: 'brand', room: 'auto', explode: false, knobs: {} };

  /* ── persistence · your session survives a reload, and never leaves here ── */
  try {
    var saved = JSON.parse(localStorage.getItem(STORE) || '{}');
    if (saved && typeof saved === 'object') state = Object.assign(state, saved);
  } catch (e) { /* a corrupt store is not worth a broken page */ }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  /* small DOM helpers · this page builds nodes, it never assigns markup */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ── APCA 0.1.9 · the readout that turns this page into an instrument ───── */
  function sRGBtoY(rgb) {
    var f = function (c) { return Math.pow(c / 255, 2.4); };
    return 0.2126729 * f(rgb[0]) + 0.7151522 * f(rgb[1]) + 0.0721750 * f(rgb[2]);
  }
  function apca(Ytxt, Ybg) {
    var clamp = function (Y) { return Y > 0.022 ? Y : Y + Math.pow(0.022 - Y, 1.414); };
    Ytxt = clamp(Ytxt); Ybg = clamp(Ybg);
    if (Math.abs(Ybg - Ytxt) < 0.0005) return 0;
    var out;
    if (Ybg > Ytxt) {
      out = (Math.pow(Ybg, 0.56) - Math.pow(Ytxt, 0.57)) * 1.14;
      out = out < 0.1 ? 0 : out - 0.027;
    } else {
      out = (Math.pow(Ybg, 0.65) - Math.pow(Ytxt, 0.62)) * 1.14;
      out = out > -0.1 ? 0 : out + 0.027;
    }
    return out * 100;
  }
  /* RESOLVE ANY CSS COLOUR, NOT JUST rgb(). The first draft read the computed
     string with a regex, which silently skipped every element painted with
     color-mix() or oklch() — Chrome computes those to their own space
     ("oklch(0.759 0.0027 none)"), the regex found two numbers, and the probe
     was dropped without a word. That is the worst failure mode an instrument
     has: not a wrong number, a missing row. And it was not a rare case — the
     node head's background IS a color-mix, so the readings that did appear
     were measured against the wrong ground.

     So the browser converts, not us: paint the colour over black and over
     white, and solve. The difference between the two grounds is (1 - alpha),
     which recovers translucency exactly, in whatever space the author wrote. */
  var swatch = document.createElement('canvas');
  swatch.width = swatch.height = 1;
  var sctx = swatch.getContext('2d', { willReadFrequently: true });
  function parseRgb(css) {
    if (!css || css === 'transparent' || css === 'none') return [0, 0, 0, 0];
    var on = function (ground) {
      sctx.globalCompositeOperation = 'copy';
      sctx.fillStyle = ground;
      sctx.fillRect(0, 0, 1, 1);
      sctx.globalCompositeOperation = 'source-over';
      sctx.fillStyle = ground; /* a colour canvas cannot parse leaves this set */
      sctx.fillStyle = css;
      sctx.fillRect(0, 0, 1, 1);
      return sctx.getImageData(0, 0, 1, 1).data;
    };
    var b = on('#000000'), w = on('#ffffff');
    var a = 1 - (w[0] - b[0]) / 255;
    if (a <= 0.0001) return [0, 0, 0, 0];
    return [b[0] / a, b[1] / a, b[2] / a, a];
  }
  /* element opacity is NOT colour alpha, and the node system uses it: a
     skipped card fades its whole subtree. Ignoring it flattered exactly the
     states that most need watching, so the cumulative factor rides along. */
  function opacityOf(node) {
    var o = 1, n = node;
    while (n && n.nodeType === 1) {
      var v = parseFloat(getComputedStyle(n).opacity);
      if (!isNaN(v)) o *= v;
      n = n.parentElement;
    }
    return o;
  }
  /* composite every semi-transparent layer under the element, bottom-up. Our
     chips sit on color-mix backgrounds over a surface over the stage — taking
     the first opaque ancestor would have lied about exactly the atoms that
     matter most. */
  function bgUnder(node) {
    var stack = [], n = node;
    while (n && n.nodeType === 1) {
      var c = parseRgb(getComputedStyle(n).backgroundColor);
      if (c && c[3] > 0) { stack.push(c); if (c[3] >= 0.999) break; }
      n = n.parentElement;
    }
    var out = [255, 255, 255];
    for (var i = stack.length - 1; i >= 0; i--) {
      var l = stack[i], a = l[3];
      out = [l[0] * a + out[0] * (1 - a), l[1] * a + out[1] * (1 - a), l[2] * a + out[2] * (1 - a)];
    }
    return out;
  }
  function needFor(px, weight) {
    var bold = weight >= 600;
    if (px >= 36 || (px >= 24 && bold)) return 45;
    if (px >= 24 || (px >= 16 && bold)) return 60;
    if (px >= 14) return 75;
    return 90;
  }
  /* WHAT EACH TEXT OWES, BY WHAT IT IS FOR. The first draft of this readout
     held every string to the body-copy bar and reported ten failures out of
     twelve — which is not a finding, it is an instrument crying wolf, and a
     readout nobody believes is worse than none. APCA's own guidance separates
     prose you READ from text you GLANCE AT from marks that are meant to
     recede, so the probes declare which they are:
       body  · read continuously → the size/weight table
       spot  · read at a glance (labels, chips, counters, pills) → Lc 60
       muted · deliberately receded (skipped, idle) → Lc 30, discernibility */
  var BARS = { spot: 60, muted: 30 };
  var PROBES = [
    ['.nc-id', 'le nom de la tâche', 'body'],
    ['.nc-body', 'le corps', 'body'],
    ['.nc-body--cmd', 'un corps de commande', 'body'],
    ['.nc-sub', 'la rangée mécanisme', 'spot'],
    ['.nc-verb', 'le verbe, dans la tête', 'spot'],
    ['.nc-chip', 'une puce de permis', 'spot'],
    ['.nc-tk', 'le compteur de jetons', 'spot'],
    ['.nc-st--ok', 'l’état réussi', 'spot'],
    ['.nc-st--failed', 'l’état refusé', 'spot'],
    ['.cell-k', 'l’étiquette d’un plateau', 'spot'],
    ['.cell-note', 'la légende sous un spécimen', 'spot'],
    ['.nc-st--skipped', 'l’état sauté', 'muted'],
    ['.nc-st--idle', 'l’état au repos', 'muted']
  ];
  function control() {
    var rows = [];
    for (var i = 0; i < PROBES.length; i++) {
      var probe = document.querySelector('.stage ' + PROBES[i][0]);
      if (!probe) continue;
      var cs = getComputedStyle(probe);
      var fg = parseRgb(cs.color);
      if (!fg) continue;
      var bg = bgUnder(probe.parentElement || probe);
      var a = fg[3] * opacityOf(probe);
      if (a < 1) fg = [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a)];
      var lc = apca(sRGBtoY(fg), sRGBtoY(bg));
      var px = parseFloat(cs.fontSize) || 12;
      var kind = PROBES[i][2];
      rows.push({
        what: PROBES[i][1], sel: PROBES[i][0], lc: lc, px: px, kind: kind,
        need: BARS[kind] || needFor(px, parseInt(cs.fontWeight, 10) || 400)
      });
    }
    rows.sort(function (a, b) { return (Math.abs(a.lc) - a.need) - (Math.abs(b.lc) - b.need); });
    var body = document.getElementById('apcaout');
    body.replaceChildren();
    for (var j = 0; j < rows.length; j++) {
      var r = rows[j], ok = Math.abs(r.lc) >= r.need;
      var tr = el('tr');
      var td = el('td', null, r.what + ' ');
      td.append(el('span', 'apca-sub', r.sel + ' · ' + r.px.toFixed(1) + 'px · ' + r.kind));
      tr.append(td);
      tr.append(el('td', 'lc', 'Lc ' + Math.abs(r.lc).toFixed(1)));
      tr.append(el('td', 'need', 'min ' + r.need));
      var v = el('td', 'v', ok ? 'tient' : 'sous le plancher');
      v.dataset.ok = ok ? '1' : '0';
      tr.append(v);
      body.append(tr);
    }
  }

  /* ── the knobs ──────────────────────────────────────────────────────────── */
  function moved() {
    var out = [];
    for (var i = 0; i < KNOBS.length; i++) {
      var k = KNOBS[i], v = state.knobs[k.id];
      if (v != null && Number(v) !== Number(k.def)) out.push([k, v]);
    }
    return out;
  }
  function applyKnobs() {
    for (var i = 0; i < KNOBS.length; i++) {
      var k = KNOBS[i];
      var v = state.knobs[k.id];
      if (v == null) v = k.def;
      var input = document.getElementById('k-' + k.id);
      if (input) input.value = v;
      var out = document.getElementById('o-' + k.id);
      if (out) out.textContent = v + k.unit;
      var value = v + k.unit;
      stages.forEach(function (s) { s.style.setProperty(k.css, value); });
    }
    var n = moved().length;
    document.getElementById('dirty').textContent = n
      ? (n === 1 ? '1 mesure déplacée' : n + ' mesures déplacées')
      : 'rien n’a bougé';
    diff();
    control();
  }
  function groupByHome() {
    var byHome = {}, list = moved();
    for (var i = 0; i < list.length; i++) {
      var home = list[i][0].home;
      (byHome[home] = byHome[home] || []).push(list[i]);
    }
    return byHome;
  }
  function diff() {
    var out = document.getElementById('diffout');
    var byHome = groupByHome();
    var homes = Object.keys(byHome);
    out.replaceChildren();
    if (!homes.length) {
      out.textContent = 'Bouge un curseur : le diff s’écrit ici, groupé par fichier.';
      return;
    }
    for (var h = 0; h < homes.length; h++) {
      var home = HOMES[homes[h]];
      out.append(el('span', 'file', home.path));
      out.append(document.createTextNode('  '));
      out.append(el('span', 'apca-sub', home.hint));
      out.append(document.createTextNode('\\n'));
      var list = byHome[homes[h]];
      for (var j = 0; j < list.length; j++) {
        var k = list[j][0], v = list[j][1];
        out.append(el('span', 'del', '-   ' + k.key + ': ' + k.def + k.unit));
        out.append(document.createTextNode('\\n'));
        out.append(el('span', 'add', '+   ' + k.key + ': ' + v + k.unit));
        out.append(document.createTextNode('\\n'));
      }
      if (h < homes.length - 1) out.append(document.createTextNode('\\n'));
    }
  }
  function plainDiff() {
    var lines = [], byHome = groupByHome(), homes = Object.keys(byHome);
    for (var h = 0; h < homes.length; h++) {
      lines.push(HOMES[homes[h]].path);
      var list = byHome[homes[h]];
      for (var j = 0; j < list.length; j++) {
        var k = list[j][0], v = list[j][1];
        lines.push('-   ' + k.key + ': ' + k.def + k.unit);
        lines.push('+   ' + k.key + ': ' + v + k.unit);
      }
      lines.push('');
    }
    return lines.join('\\n').trim();
  }

  /* ── the switches ───────────────────────────────────────────────────────── */
  function setSkin(skin) {
    state.skin = skin; save();
    stages.forEach(function (s) { if (skin === 'brand') s.removeAttribute('data-skin'); else s.dataset.skin = skin; });
    document.querySelectorAll('button[data-skin]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.skin === skin));
    });
    control();
  }
  function setRoom(room) {
    state.room = room; save();
    if (room === 'auto') document.documentElement.removeAttribute('data-room');
    else document.documentElement.dataset.room = room;
    document.querySelectorAll('button[data-room]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.room === room));
    });
  }
  function setExplode(on) {
    state.explode = on; save();
    stages.forEach(function (s) { if (on) s.dataset.explode = ''; else s.removeAttribute('data-explode'); });
    document.getElementById('explode').setAttribute('aria-pressed', String(on));
  }

  document.querySelectorAll('button[data-skin]').forEach(function (b) {
    b.addEventListener('click', function () { setSkin(b.dataset.skin); });
  });
  document.querySelectorAll('button[data-room]').forEach(function (b) {
    b.addEventListener('click', function () { setRoom(b.dataset.room); });
  });
  document.querySelectorAll('input[data-knob]').forEach(function (input) {
    input.addEventListener('input', function () {
      state.knobs[input.dataset.knob] = Number(input.value);
      save(); applyKnobs();
    });
  });
  document.getElementById('explode').addEventListener('click', function () { setExplode(!state.explode); });
  document.getElementById('reset').addEventListener('click', function () {
    state.knobs = {}; save(); applyKnobs();
  });
  document.getElementById('copy').addEventListener('click', function (e) {
    var txt = plainDiff();
    if (!txt || !navigator.clipboard) return;
    var btn = e.currentTarget;
    navigator.clipboard.writeText(txt).then(function () {
      btn.textContent = 'copié';
      setTimeout(function () { btn.textContent = 'copier'; }, 1200);
    });
  });
  addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var active = document.activeElement;
    if (active && /^(input|textarea|select)$/i.test(active.tagName)) return;
    var k = e.key.toLowerCase();
    if (k === 't') setSkin(state.skin === 'brand' ? 'theme' : 'brand');
    else if (k === 'x') setExplode(!state.explode);
    else if (k === '0') { state.knobs = {}; save(); applyKnobs(); }
  });

  setSkin(state.skin); setRoom(state.room); setExplode(state.explode); applyKnobs();
  addEventListener('resize', control);
</script>
`

if (process.argv.includes('--check')) {
  let have = ''
  try { have = readFileSync(OUT, 'utf8') } catch { /* first run */ }
  if (have !== html) {
    console.error('bench: DRIFT · run node design/bench.mjs')
    process.exit(1)
  }
  console.log(`✓ bench in sync · ${Object.keys(ANATOMY).length} verbs · ${STATES.length} states · ${KNOBS.length} knobs · ${LEDGER.filter((r) => r[2]).length}/${LEDGER.length} shared`)
} else {
  writeFileSync(OUT, html)
  console.log(`wrote design/bench.html · ${Object.keys(ANATOMY).length} verbs · ${STATES.length} states · ${KNOBS.length} knobs · ${LEDGER.filter((r) => r[2]).length}/${LEDGER.length} shared`)
}
