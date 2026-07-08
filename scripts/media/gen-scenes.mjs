#!/usr/bin/env node
/* gen-scenes.mjs — builds the run-explains scene HTMLs from the raw
 * TTY captures. scenes/*.html are GENERATED: edit this file (or re-capture
 * raw/*.ansi), never the scene HTML.
 *
 *   node gen-scenes.mjs            # writes scenes/*.html
 *
 * Honesty contract: every terminal line in a scene is the mechanical
 * ANSI→HTML conversion (ansi2html.mjs) of a raw capture of the real nika
 * binary (raw/manifest.json carries binary · fixture · pty geometry ·
 * exit codes). The `$` prompt lines restate the captured commands from
 * the manifest verbatim. Nothing is added, dropped or re-worded;
 * over-length lines soft-wrap (the 100-col pty wrapped them too).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { convertStatic, convertFrames } from "./ansi2html.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(HERE, "raw");
const OUT = path.join(HERE, "scenes");
fs.mkdirSync(OUT, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(RAW, "manifest.json"), "utf8"));
const readRaw = (slug) => fs.readFileSync(path.join(RAW, `${slug}.ansi`), "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* prompt line(s) for a capture: the manifest's command list, verbatim */
const cmdLines = (slug) =>
  manifest.captures[slug].commands.map(
    (c) => `<span class="ln"><span class="prompt">$ </span><span class="cmd">${esc(c)}</span></span>`,
  );

const outLines = (slug) => convertStatic(readRaw(slug)).map((l) => `<span class="ln">${l}</span>`);
const gap = () => `<span class="ln"> </span>`;

/* ── scene table ───────────────────────────────────────────────────────── */
/* block: string[] of .ln HTML. A panel = header + blocks. */
const PLATE_BASE = "nika 0.93.1 · real cli output · mock model · offline · 100-col pty";

const SCENES = [
  {
    name: "check-audit",
    kicker: "nika check · the pre-flight audit",
    headline: "Audited before a single token.",
    panels: [
      {
        title: "signature-demo.nika.yaml",
        badge: { cls: "ok", text: "rc=0 · 1 hint" },
        lines: [...cmdLines("check"), ...outLines("check")],
      },
    ],
    plate: PLATE_BASE,
  },
  {
    name: "inspect-anatomy",
    kicker: "nika inspect · static anatomy",
    headline: "The shape of the run, before the run.",
    panels: [
      {
        title: "signature-demo.nika.yaml",
        badge: { cls: "ok", text: "9 tasks · 8 waves" },
        lines: [...cmdLines("inspect"), ...outLines("inspect")],
      },
    ],
    plate: PLATE_BASE,
  },
  {
    name: "run-live",
    /* kicker-only (operator lock · detail wave): the section H2 says
       « The run explains itself. » — the card must not repeat it */
    kicker: "nika run · recorded live",
    motion: { capture: "run", cmd: "nika run signature-demo.nika.yaml" },
    panels: [
      {
        title: "signature-demo.nika.yaml",
        badge: { cls: "ok", text: "9/9 · rc=0" },
        lines: [], // motion scenes inject frames at runtime (see template)
      },
    ],
    plate: `${PLATE_BASE} · replayed at reading pace`,
  },
  {
    name: "run-epilogue",
    kicker: "the epilogue",
    headline: "Every run ends with its proof.",
    panels: [
      {
        title: "signature-demo.nika.yaml",
        badge: { cls: "ok", text: "922 tok · $0.00" },
        lines: [...cmdLines("run"), ...finalFrame("run")],
      },
    ],
    plate: PLATE_BASE,
  },
  {
    name: "trace-outputs",
    kicker: "nika trace outputs · the flight recorder",
    headline: "Every task's output, browsable.",
    panels: [
      {
        title: "run.ndjson",
        badge: { cls: "ok", text: "9 tasks" },
        lines: [...cmdLines("trace-outputs"), ...outLines("trace-outputs")],
      },
    ],
    plate: PLATE_BASE,
  },
  {
    name: "trace-flow",
    kicker: "nika trace flow · the data waterfall",
    headline: "Which output fed which task.",
    panels: [
      {
        title: "run.ndjson × signature-demo.nika.yaml",
        badge: { cls: "ok", text: "11 edges" },
        lines: [...cmdLines("trace-flow"), ...outLines("trace-flow")],
      },
    ],
    plate: PLATE_BASE,
  },
  {
    name: "kill-resume",
    kicker: "kill -9 · nika run --resume",
    headline: "Finished work never runs twice.",
    twoPanel: true,
    panels: [
      {
        title: "the kill · mid-fanout",
        badge: { cls: "fail", text: "exit 137" },
        lines: [
          ...cmdLines("kill-session"),
          ...outLines("kill-session"),
          gap(),
          ...cmdLines("kill-forensics"),
          ...outLines("kill-forensics"),
        ],
      },
      {
        title: "the resume · from the trace",
        badge: { cls: "ok", text: "↷ 4 banked · rc=0" },
        lines: [...cmdLines("resume"), ...finalFrame("resume")],
      },
    ],
    plate: `${PLATE_BASE} · paced variant (nika:wait) so the kill lands mid-fanout`,
  },
  {
    name: "gate-consent",
    kicker: "nika:prompt · the human gate",
    headline: "It pauses for a human. Durably.",
    twoPanel: true,
    panels: [
      {
        title: "the gate · run pauses",
        badge: { cls: "warn", text: "exit 4 · paused" },
        lines: [
          ...cmdLines("gate-pause"),
          ...outLines("gate-pause"),
          gap(),
          ...cmdLines("gate-note"),
          ...outLines("gate-note"),
        ],
      },
      {
        title: "the re-arm · --answer approve=true",
        badge: { cls: "ok", text: "↷ 5 banked · rc=0" },
        lines: [...cmdLines("gate-resume"), ...finalFrame("gate-resume")],
      },
    ],
    plate: `${PLATE_BASE} · gated variant (one nika:prompt before publish)`,
  },
];

/* the last DEC-2026 frame of a live capture = the complete final screen */
function finalFrame(slug) {
  const frames = convertFrames(readRaw(slug));
  return frames[frames.length - 1].map((l) => `<span class="ln">${l}</span>`);
}

/* ── geometry ──────────────────────────────────────────────────────────── */
const STAGE = { w: 1600, h: 900 };
const CARD_TOP = 176;
const CARD_BOTTOM = 830;
const CHROME = 46; /* card header */
const PAD_V = 36; /* term padding top+bottom */
const LH = 1.45;
const ADV = 0.625; /* Martian Mono advance ≈ 0.625em */
const PTY_COLS = 100; /* capture geometry — lines longer than this wrapped on the real TTY too */

function fontFor(lines, heightPx, widthPx, maxCols) {
  const byH = (heightPx - CHROME - PAD_V) / (lines * LH);
  /* size the card to AT MOST the pty's column count: anything longer
   * soft-wraps here just as it wrapped on the real 100-col terminal */
  const byW = (widthPx - 52) / (Math.min(maxCols, PTY_COLS) * ADV);
  return Math.max(11, Math.min(19, Math.floor(Math.min(byH, byW) * 2) / 2));
}

/* card height that fits the content exactly (wrapped lines counted) */
function fitHeight(lines, font, widthPx, maxHeight) {
  const colsFit = Math.floor((widthPx - 52) / (font * ADV));
  let rows = 0;
  for (const l of lines) {
    const len = visibleLen(l);
    rows += Math.max(1, Math.ceil(len / colsFit));
  }
  return Math.min(maxHeight, Math.ceil(rows * LH * font) + CHROME + PAD_V + 6);
}

const visibleLen = (l) => l.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "x").length;
const visibleCols = (lines) => Math.max(...lines.map(visibleLen), 40);

/* ── template ──────────────────────────────────────────────────────────── */
function panelHtml(p, id, geom, font) {
  return `
  <div class="card panel" id="${id}" style="left:${geom.left}px;top:${geom.top}px;width:${geom.width}px;height:${geom.height}px">
    <div class="card-header">
      <div class="dots"><i></i><i></i><i></i></div>
      <span class="title">${esc(p.title)}</span>
      <span class="badge ${p.badge.cls}">${esc(p.badge.text)}</span>
    </div>
    <div class="t" style="font-size:${font}px">
${p.lines.join("\n")}
    </div>
  </div>`;
}

function sceneHtml(s) {
  /* headline is optional (kicker-only scenes · the run-live card must not
     repeat the section H2 it sits under) */
  const head = `
  <div class="head">
    <div class="kicker">${esc(s.kicker)}</div>${s.headline ? `\n    <div class="headline">${esc(s.headline)}</div>` : ''}
  </div>`;

  let body = "";
  let script = "";

  if (s.motion) {
    /* frame-stepped live run: all frames stacked, __seek picks one */
    const frames = convertFrames(readRaw(s.motion.capture));
    const last = frames[frames.length - 1];
    const w = STAGE.w - 96;
    const maxH = CARD_BOTTOM - 156;
    const font = fontFor(last.length + 1, maxH, w, visibleCols(last));
    const geom = {
      left: 48, top: 156, width: w,
      height: fitHeight([`<span>$ ${s.motion.cmd}</span>`, ...last], font, w, maxH),
    };
    const frameDivs = frames
      .map(
        (f, i) =>
          `<div class="fr" data-i="${i}">${f.map((l) => `<span class="ln">${l}</span>`).join("\n")}</div>`,
      )
      .join("\n");
    body = `
  <div class="card panel" id="card" style="left:${geom.left}px;top:${geom.top}px;width:${geom.width}px;height:${geom.height}px;opacity:0">
    <div class="card-header">
      <div class="dots"><i></i><i></i><i></i></div>
      <span class="title">${esc(s.panels[0].title)}</span>
      <span class="badge ok" id="badge" style="opacity:0">${esc(s.panels[0].badge.text)}</span>
    </div>
    <div class="t" style="font-size:${font}px">
      <span class="ln"><span class="prompt">$ </span><span class="cmd" id="cmd"></span><span class="caret" id="caret"></span></span>
      <div id="frames">${frameDivs}</div>
    </div>
  </div>`;
    const N = frames.length;
    const TYPE_AT = 500, TYPE_DUR = 1100, RUN_AT = TYPE_AT + TYPE_DUR + 350;
    const STEP = 260, HOLD = 3400, CLOSE = 500;
    const DUR = RUN_AT + N * STEP + HOLD + CLOSE;
    script = `
<script>
(function () {
  const CMD = ${JSON.stringify(s.motion.cmd)};
  const frames = [...document.querySelectorAll('#frames .fr')];
  const card = document.getElementById('card');
  const badge = document.getElementById('badge');
  const cmd = document.getElementById('cmd');
  const caret = document.getElementById('caret');
  const N = ${N}, TYPE_AT = ${TYPE_AT}, TYPE_DUR = ${TYPE_DUR}, RUN_AT = ${RUN_AT}, STEP = ${STEP};
  window.__scene = { name: ${JSON.stringify(s.name)}, duration: ${DUR}, fps: 30, width: ${STAGE.w}, height: ${STAGE.h}, posterAt: ${DUR - CLOSE - 800} };
  window.__seek = (ms) => {
    card.style.opacity = String(Math.min(1, Math.max(0, (ms - 120) / 400)));
    const tp = Math.min(1, Math.max(0, (ms - TYPE_AT) / TYPE_DUR));
    cmd.textContent = CMD.slice(0, Math.round(CMD.length * tp));
    caret.classList.toggle('on', ms >= TYPE_AT && tp < 1);
    const idx = ms < RUN_AT ? -1 : Math.min(N - 1, Math.floor((ms - RUN_AT) / STEP));
    frames.forEach((f, i) => { f.style.display = i === idx ? 'block' : 'none'; });
    badge.style.opacity = idx === N - 1 ? '1' : '0';
  };
  window.__seek(0);
  if (!new URLSearchParams(location.search).has('render')) {
    const t0 = performance.now();
    const loop = () => {
      window.__seek((performance.now() - t0) % (${DUR} + 1000));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
})();
</script>`;
  } else if (s.twoPanel) {
    const [a, b] = s.panels;
    const half = (STAGE.w - 96 - 28) / 2;
    const maxH = CARD_BOTTOM - CARD_TOP;
    const font = Math.min(
      fontFor(a.lines.length, maxH, half, visibleCols(a.lines)),
      fontFor(b.lines.length, maxH, half, visibleCols(b.lines)),
    );
    const geomA = { left: 48, top: CARD_TOP, width: half, height: fitHeight(a.lines, font, half, maxH) };
    const geomB = { left: 48 + half + 28, top: CARD_TOP, width: half, height: fitHeight(b.lines, font, half, maxH) };
    body = panelHtml(a, "panel-a", geomA, font) + panelHtml(b, "panel-b", geomB, font);
    script = staticScript(s.name);
  } else {
    const p = s.panels[0];
    const w = STAGE.w - 96;
    const maxH = CARD_BOTTOM - CARD_TOP;
    const font = fontFor(p.lines.length, maxH, w, visibleCols(p.lines));
    const geom = { left: 48, top: CARD_TOP, width: w, height: fitHeight(p.lines, font, w, maxH) };
    body = panelHtml(p, "panel", geom, font);
    script = staticScript(s.name);
  }

  return `<!doctype html>
<meta charset="utf-8">
<title>nika · ${s.name}</title>
<!-- GENERATED by gen-scenes.mjs from raw/*.ansi — do not edit by hand -->
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="terminal.css">

<div class="stage">
${head}
${body}
  <div class="plate">
    <span>${esc(s.plate)}</span>
    <span class="mark">nika.sh 🦋</span>
  </div>
  <div class="grain"></div>
</div>
${script}
`;
}

/* static scenes fulfil the same __scene/__seek contract: 1 frame */
const staticScript = (name) => `
<script>
window.__scene = { name: ${JSON.stringify(name)}, duration: 100, fps: 1, width: ${STAGE.w}, height: ${STAGE.h}, posterAt: 0 };
window.__seek = () => {};
</script>`;

for (const s of SCENES) {
  const html = sceneHtml(s);
  const file = path.join(OUT, `${s.name}.html`);
  fs.writeFileSync(file, html);
  console.log(`${path.relative(process.cwd(), file)} written`);
}
