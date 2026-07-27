#!/usr/bin/env node
/* nika node bench · the design system, projected into a page you can open.
 *
 *   node design/bench.mjs          write design/bench.html
 *   node design/bench.mjs --check  verify it matches the SSOT (CI gate)
 *
 * WHY THIS IS GENERATED AND NOT DRAWN. A design system documented by hand
 * drifts from the system the day someone edits one and not the other, and then
 * the page that was supposed to be the reference becomes the least reliable
 * surface in the repo. So the bench is a PROJECTION: the palette comes from
 * design-tokens.generated.ts (itself projected from nika-spec design/tokens.yaml),
 * the layer hues from design.generated.css, and the node's own anatomy from the
 * CANON table below — the one place it is written down.
 *
 * WHY IT IS ONE SELF-CONTAINED FILE. It opens with a double-click, offline,
 * from a checkout, forever. No server, no build step, no network, no account.
 * A design reference you cannot open is not a reference.
 *
 * THE ANATOMY TABLE IS A DRAFT CANON. It was recovered by reading the shipped
 * canvas (vscode dag.ts · 9373 lines, dag.css · 7097 lines, and the anatomy
 * assertions in verbAnatomies.test.ts). It lives here until it earns its place
 * in nika-spec design/nodes.yaml — at which point this script reads it from
 * there and stops holding it. */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = `${ROOT}design/bench.html`

/* ── the palette, read out of the projections ─────────────────────────────── */
const tokensTs = readFileSync(`${ROOT}src/design-tokens.generated.ts`, 'utf8')
const designCss = readFileSync(`${ROOT}src/design.generated.css`, 'utf8')

const constObject = (name) => {
  const body = tokensTs.match(new RegExp(`export const ${name} = \\{([^}]*)\\}`))?.[1]
  if (!body) throw new Error(`bench: ${name} not found in design-tokens.generated.ts`)
  return Object.fromEntries(
    [...body.matchAll(/(\w+):\s*'([^']+)'/g)].map((m) => [m[1], m[2]]),
  )
}
const cssVar = (name) => designCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`))?.[1] ?? null

const VERB_HEX = constObject('NIKA_VERB_HEX')
const VERB_TEXT = constObject('NIKA_VERB_TEXT')
const VERB_GLYPH = constObject('NIKA_VERB_GLYPH')
const SEVERITY = constObject('NIKA_SEVERITY')
const STATUS = constObject('NIKA_STATUS')
const ROLE_WORDS = constObject('NIKA_ROLE_WORDS')

const LAYERS = ['shape', 'flow', 'acts', 'reach', 'boundary', 'refusals', 'proof']
const LAYER_HEX = Object.fromEntries(LAYERS.map((l) => [l, cssVar(`layer-${l}`)]))
for (const [l, hex] of Object.entries(LAYER_HEX)) {
  if (!hex) throw new Error(`bench: no --layer-${l} in design.generated.css`)
}

const brand = {
  bg: tokensTs.match(/bg:\s*'(#[0-9a-fA-F]{6})'/)?.[1] ?? '#08090b',
  surface: '#101217',
  raised: '#1c1d21',
  ink: '#e8ecf4',
  dim: '#8891a3',
  faint: '#5b6373',
  line: '#23262e',
  lineStrong: '#333845',
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

/* every state a node can wear. `form` names what carries it BESIDES colour —
   a state that only exists as a hue dies in forced-colors and in colour-blind
   eyes, so each one owes a second signal. */
const STATES = [
  { id: 'idle', label: 'au repos', form: 'rien · le repos est l’absence de signal', tone: 'faint' },
  { id: 'running', label: 'en cours', form: 'pastille qui pulse', tone: 'running' },
  { id: 'ok', label: 'réussi', form: 'bordure teintée', tone: 'ok' },
  { id: 'failed', label: 'refusé', form: 'bordure teintée + code', tone: 'fail' },
  { id: 'retrying', label: 'nouvel essai', form: 'compteur d’essai', tone: 'exec' },
  { id: 'skipped', label: 'sauté', form: 'opacité 52 %', tone: 'muted' },
  { id: 'stale', label: 'trace périmée', form: 'trait pointillé', tone: 'faint' },
  { id: 'developing', label: 'en écriture', form: 'trait pointillé + teinte shape', tone: 'shape' },
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
  ['hues des 7 couches', 'design.generated.css', false, 'site seulement'],
  ['anatomie du nœud', 'dag.ts · 9 373 lignes', false, 'vscode seulement'],
  ['les atomes du nœud', 'dag.css · 7 097 lignes', false, 'vscode seulement'],
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
  const part = {
    head: `<div class="nc-head"><span class="nc-glyph">${VERB_GLYPH[verb]}</span><span class="nc-id">${s.id}</span><span class="nc-verb">${verb}</span></div>`,
    sub: `<div class="nc-sub"><span class="nc-k">${s.sub[0]}</span> ${esc(s.sub[1])}</div>`,
    body: `<div class="nc-body${s.bodyKind === 'cmd' ? ' nc-body--cmd' : ''}">${esc(s.body)}</div>`,
    band: s.band
      ? `<div class="nc-band"><span>${s.band.loop}</span><span class="nc-meter"><i style="width:${s.band.pct}%"></i></span><span class="nc-tk">${s.band.tk}</span></div>`
      : '',
    why: `<div class="nc-why">${s.why.map(([t, layer]) => `<span class="nc-chip"${layer ? ` style="--chip:var(--nk-${layer})"` : ''}>${esc(t)}</span>`).join('')}</div>`,
  }
  return `<article class="nc" data-verb="${verb}" data-state="${state}">${anatomy.map((p) => part[p]).join('')}</article>`
}

const stateNode = (st) => `        <div class="cell">
          <span class="cell-k">${st.id}</span>
          <article class="nc" data-verb="exec" data-state="${st.id}">
            <div class="nc-head"><span class="nc-glyph">${VERB_GLYPH.exec}</span><span class="nc-id">build</span><span class="nc-verb">exec</span></div>
            <div class="nc-why"><span class="nc-st nc-st--${st.id}">${esc(st.label)}</span></div>
          </article>
          <span class="cell-note">${esc(st.form)}</span>
        </div>`

const atomBlock = (a) => `        <div class="cell">
          <span class="cell-k">${esc(a.title)} · <em>${a.cls}</em></span>
          <div class="chiprow">${a.chips.map(([t, l]) => `<span class="nc-chip" style="--chip:var(--nk-${l})">${esc(t)}</span>`).join('')}</div>
          <span class="cell-note">${esc(a.note)}</span>
        </div>`

const html = `<title>Nika · le banc du nœud</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<!--
  GENERATED by design/bench.mjs — do not edit.
  Regenerate: node design/bench.mjs · Gate: node design/bench.mjs --check
  Opens offline, from a checkout, with a double-click. That is the point.
-->
<style>
  @property --nk-verb { syntax: '<color>'; inherits: true; initial-value: #5b8cff; }

  :root {
    --room-bg: #f7f8fa; --room-panel: #fff; --room-ink: #16181d; --room-dim: #5a6070;
    --room-faint: #8b91a1; --room-line: #e2e5ec; --room-strong: #c9cedb; --room-accent: #2f6bff;
    --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --room-bg: #0a0b0d; --room-panel: #101216; --room-ink: #e9ecf2; --room-dim: #9aa2b4;
      --room-faint: #666e80; --room-line: #1e222a; --room-strong: #2c313c; --room-accent: #8db4ff;
    }
  }
  :root[data-room="light"] { --room-bg:#f7f8fa; --room-panel:#fff; --room-ink:#16181d; --room-dim:#5a6070; --room-faint:#8b91a1; --room-line:#e2e5ec; --room-strong:#c9cedb; --room-accent:#2f6bff; }
  :root[data-room="dark"] { --room-bg:#0a0b0d; --room-panel:#101216; --room-ink:#e9ecf2; --room-dim:#9aa2b4; --room-faint:#666e80; --room-line:#1e222a; --room-strong:#2c313c; --room-accent:#8db4ff; }

  /* the stage palette · every specimen draws from these and nothing else */
  .stage {
    --nk-bg:${brand.bg}; --nk-surface:${brand.surface}; --nk-raised:${brand.raised};
    --nk-ink:${brand.ink}; --nk-dim:${brand.dim}; --nk-faint:${brand.faint};
    --nk-line:${brand.line}; --nk-strong:${brand.lineStrong};
${Object.entries(VERB_HEX).map(([k, v]) => `    --nk-${k}:${v};`).join('\n')}
${Object.entries(VERB_TEXT).map(([k, v]) => `    --nk-${k}-text:${v};`).join('\n')}
    --nk-ok:${SEVERITY.ok}; --nk-fail:${SEVERITY.fail}; --nk-fail-text:${SEVERITY.fail_text ?? '#ff9791'};
    --nk-running:${STATUS.running}; --nk-muted:${STATUS.muted};
${Object.entries(LAYER_HEX).map(([k, v]) => `    --nk-${k}:${v};`).join('\n')}
    --nk-radius: 7px;
    transition: background-color .28s cubic-bezier(.2,.8,.2,1);
  }
  .stage[data-skin="theme"] {
    --nk-bg:${theme.bg}; --nk-surface:${theme.surface}; --nk-raised:${theme.raised};
    --nk-ink:${theme.ink}; --nk-dim:${theme.dim}; --nk-faint:${theme.faint};
    --nk-line:${theme.line}; --nk-strong:${theme.lineStrong};
${Object.entries(theme.verb).map(([k, v]) => `    --nk-${k}:${v};`).join('\n')}
${Object.entries(theme.verbText).map(([k, v]) => `    --nk-${k}-text:${v};`).join('\n')}
    --nk-ok:${theme.ok}; --nk-fail:${theme.fail}; --nk-fail-text:${theme.failText};
    --nk-running:${theme.verb.infer}; --nk-muted:${theme.faint};
${Object.entries(theme.layer).map(([k, v]) => `    --nk-${k}:${v};`).join('\n')}
  }

  *{box-sizing:border-box}
  body{margin:0;background:var(--room-bg);color:var(--room-ink);font:15px/1.55 var(--sans);-webkit-font-smoothing:antialiased}
  .wrap{max-width:1140px;margin:0 auto;padding:38px 22px 90px}
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

  .stage{background:var(--nk-bg);color:var(--nk-ink);border:1px solid var(--room-strong);border-radius:12px;padding:24px;overflow-x:auto}
  .rack{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start}
  .cell{display:grid;gap:8px;max-width:268px}
  .cell-k{font:500 10px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--nk-faint)}
  .cell-k em{font-style:normal;color:var(--nk-dim)}
  .cell-note{font:11px/1.45 var(--sans);color:var(--nk-faint)}
  .chiprow{display:flex;flex-wrap:wrap;gap:6px}

  .nc{width:252px;background:var(--nk-surface);border:1px solid var(--nk-line);border-radius:var(--nk-radius);overflow:hidden;font-family:var(--mono)}
  .nc-head{display:flex;align-items:center;gap:7px;padding:8px 10px;border-bottom:1px solid var(--nk-line);background:color-mix(in oklch,var(--nk-verb,var(--nk-ink)) 8%,transparent)}
  .nc-glyph{color:var(--nk-verb,var(--nk-ink));font-size:12px;line-height:1}
  .nc-id{font-size:12.5px;font-weight:600;letter-spacing:-.01em}
  .nc-verb{margin-left:auto;font-size:10px;letter-spacing:.07em;color:var(--nk-verb-text,var(--nk-dim))}
  .nc-sub,.nc-body,.nc-why{padding:7px 10px;font-size:11.5px}
  .nc-sub{color:var(--nk-dim);border-bottom:1px dashed var(--nk-line)}
  .nc-k{color:var(--nk-faint)}
  .nc-body{line-height:1.45}
  .nc-body--cmd{color:var(--nk-exec-text)}
  .nc-why{border-top:1px solid var(--nk-line);display:flex;flex-wrap:wrap;gap:5px;align-items:center}
  .nc-chip{display:inline-flex;align-items:center;padding:1px 6px;border-radius:999px;
    border:1px solid color-mix(in oklch,var(--chip,var(--nk-strong)) 44%,transparent);
    background:color-mix(in oklch,var(--chip,var(--nk-ink)) 10%,transparent);
    color:var(--chip,var(--nk-dim));font-size:10px;letter-spacing:.03em;white-space:nowrap}
  .nc-band{display:flex;align-items:center;gap:8px;padding:6px 10px;border-top:1px solid var(--nk-line);
    background:color-mix(in oklch,var(--nk-agent) 9%,transparent);font-size:10px;color:var(--nk-agent-text)}
  .nc-meter{flex:1;height:3px;border-radius:2px;background:color-mix(in oklch,var(--nk-agent) 22%,transparent);overflow:hidden}
  .nc-meter i{display:block;height:100%;background:var(--nk-agent)}
  .nc-tk{font-variant-numeric:tabular-nums}

${Object.keys(VERB_HEX).map((v) => `  .nc[data-verb="${v}"]{--nk-verb:var(--nk-${v});--nk-verb-text:var(--nk-${v}-text)}`).join('\n')}
  .nc[data-state=ok]{border-color:color-mix(in oklch,var(--nk-ok) 46%,var(--nk-line))}
  .nc[data-state=failed]{border-color:color-mix(in oklch,var(--nk-fail) 54%,var(--nk-line))}
  .nc[data-state=running]{border-color:color-mix(in oklch,var(--nk-running) 50%,var(--nk-line))}
  .nc[data-state=retrying]{border-color:color-mix(in oklch,var(--nk-exec) 44%,var(--nk-line))}
  .nc[data-state=skipped]{opacity:.52}
  .nc[data-state=stale]{border-style:dashed;opacity:.78}
  .nc[data-state=developing]{border-color:color-mix(in oklch,var(--nk-shape) 40%,var(--nk-line));border-style:dashed}

  .nc-st{display:inline-flex;align-items:center;gap:5px;font-size:10px;letter-spacing:.05em}
  .nc-st::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
  .nc-st--idle,.nc-st--stale{color:var(--nk-faint)}
  .nc-st--running{color:var(--nk-running)}
  .nc-st--ok{color:var(--nk-ok)}
  .nc-st--failed{color:var(--nk-fail)}
  .nc-st--retrying{color:var(--nk-exec-text)}
  .nc-st--skipped{color:var(--nk-muted)}
  .nc-st--developing{color:var(--nk-shape)}
  .nc-st--running::before{animation:p 1.6s ease-in-out infinite}
  @keyframes p{0%,100%{opacity:1}50%{opacity:.28}}
  @media (prefers-reduced-motion:reduce){.nc-st--running::before{animation:none}.stage{transition:none}}

  .sw{display:grid;gap:5px}
  .sw i{height:40px;border-radius:6px;border:1px solid color-mix(in oklch,var(--nk-ink) 12%,transparent)}
  .sw b{font:500 10px/1 var(--mono);letter-spacing:.04em;color:var(--nk-dim)}
  .sw span{font:10px/1 var(--mono);color:var(--nk-faint);font-variant-numeric:tabular-nums}
  .swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px}

  .tw{overflow-x:auto;border:1px solid var(--room-line);border-radius:10px}
  table{width:100%;border-collapse:collapse;font-size:13.5px}
  th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--room-line)}
  th{font:500 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--room-faint)}
  td:first-child{font-family:var(--mono);font-size:12px;white-space:nowrap}
  .yes{color:#1f8a5c;font-weight:600}.no{color:#c2410c;font-weight:600}
  @media (prefers-color-scheme:dark){.yes{color:#34d399}.no{color:#ff9a6f}}
  footer{margin-top:56px;padding-top:20px;border-top:1px solid var(--room-line);color:var(--room-faint);font-size:13px}
</style>

<div class="wrap">
  <header>
    <p class="kicker">nika · design system · banc d’essai · généré</p>
    <h1>Le nœud, toutes ses variantes, sous une lumière qu’on peut changer</h1>
    <p class="lede">
      Cette page est une <b>projection</b>, pas un dessin : la palette vient de
      <code>design-tokens.generated.ts</code>, les couches de <code>design.generated.css</code>,
      l’anatomie de la table de canon dans <code>design/bench.mjs</code>. Elle s’ouvre
      hors-ligne, depuis un checkout, sans serveur. Une référence qu’on ne peut pas ouvrir
      n’est pas une référence.
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
    <span class="console-note"><kbd>T</kbd> bascule le plateau · ce qui ne bouge pas est codé en dur</span>
  </div>

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
    <div class="sec-head"><h2>Les quatre voix</h2><span class="sec-n">1 seule inversion</span></div>
    <p class="sec-note">
      L’ordre est une décision : <b>tête · mécanisme · essence · pourquoi</b>, sauf
      <code>invoke</code> dont l’essence — l’outil appelé — précède le mécanisme, parce que
      c’est elle qu’on lit en premier. La bande d’agent se glisse entre la paire et le pourquoi.
    </p>
    <div class="stage" data-stage>
      <div class="rack">
${Object.keys(ANATOMY).map((v) => `        <div class="cell"><span class="cell-k">${v} · ${ANATOMY[v].join(' · ')}</span>${renderNode(v, { state: v === 'agent' ? 'running' : 'idle' })}</div>`).join('\n')}
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
    <div class="sec-head"><h2>Ce qui est partagé, ce qui ne l’est pas</h2><span class="sec-n">${LEDGER.filter((r) => r[2]).length} sur ${LEDGER.length}</span></div>
    <p class="sec-note">Le tableau que ce banc existe pour vider. Chaque « non » est un endroit où les surfaces peuvent diverger sans que rien ne l’empêche.</p>
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
      la dérive est gatée par <code>--check</code>. L’anatomie est un canon de travail, relevé
      sur le canvas livré ; elle rejoindra <code>nika-spec design/nodes.yaml</code> quand elle
      aura fait ses preuves ici.
    </p>
  </footer>
</div>

<script>
  const stages = document.querySelectorAll('[data-stage]')
  const setSkin = (skin) => {
    stages.forEach((s) => { if (skin === 'brand') s.removeAttribute('data-skin'); else s.dataset.skin = skin })
    document.querySelectorAll('[data-skin]').forEach((b) => {
      if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(b.dataset.skin === skin))
    })
  }
  const setRoom = (room) => {
    if (room === 'auto') document.documentElement.removeAttribute('data-room')
    else document.documentElement.dataset.room = room
    document.querySelectorAll('[data-room]').forEach((b) => {
      if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(b.dataset.room === room))
    })
  }
  document.querySelectorAll('button[data-skin]').forEach((b) => b.addEventListener('click', () => setSkin(b.dataset.skin)))
  document.querySelectorAll('button[data-room]').forEach((b) => b.addEventListener('click', () => setRoom(b.dataset.room)))
  let skin = 'brand'
  addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 't' || e.metaKey || e.ctrlKey || e.altKey) return
    if (/^(input|textarea|select)$/i.test(document.activeElement?.tagName ?? '')) return
    skin = skin === 'brand' ? 'theme' : 'brand'
    setSkin(skin)
  })
</script>
`

if (process.argv.includes('--check')) {
  let have = ''
  try { have = readFileSync(OUT, 'utf8') } catch { /* first run */ }
  if (have !== html) {
    console.error('bench: DRIFT · run node design/bench.mjs')
    process.exit(1)
  }
  console.log(`✓ bench in sync · ${Object.keys(ANATOMY).length} verbs · ${STATES.length} states · ${LEDGER.filter((r) => r[2]).length}/${LEDGER.length} shared`)
} else {
  writeFileSync(OUT, html)
  console.log(`wrote design/bench.html · ${Object.keys(ANATOMY).length} verbs · ${STATES.length} states · ${LEDGER.filter((r) => r[2]).length}/${LEDGER.length} shared`)
}
