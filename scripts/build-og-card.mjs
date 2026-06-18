// build-og-card.mjs — generate the on-brand OG social card for nika.sh (v4).
//
// Renders a 1200×630 PNG `public/og.png` that matches the v4 "sovereign
// engineering / blueprint" register: near-black #0a0b0d, real Martian
// Grotesk display + Martian Mono register, 1px hairlines, a faint perspective
// depth-grid, the EdgeAurora cyan→violet ring at the frame (the lone colour),
// and the nika butterfly mark. The control pitch is the headline.
//
// Pipeline (dependency-free):
//   1. this script inlines the real woff2 fonts + the nika mark into a
//      self-contained scripts/og-card.html (committed, inspectable)
//   2. headless Chrome screenshots it at 2400×1260 (DSF 2 for crisp type)
//   3. ImageMagick downscales to 1200×630, pngquant quantises (< 150 KB)
//
// Usage: node scripts/build-og-card.mjs   (run from the repo root)

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const pub = resolve(root, 'public');

// ── inline the real fonts so the card paints in the brand type ──────────────
const b64 = (p) => readFileSync(p).toString('base64');
const grotesk = b64(resolve(pub, 'fonts/martian-grotesk-variable.woff2'));
const mono = b64(resolve(pub, 'fonts/martian-mono-variable.woff2'));

// ── the nika butterfly path (recoloured to ink for the monochrome register) ─
const nikaSvg = readFileSync(resolve(pub, 'nika.svg'), 'utf8');
const nikaPath = nikaSvg.match(/<path d="([^"]+)"/)[1];

// ── the card template ───────────────────────────────────────────────────────
const html = `<!doctype html>
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
    opacity: 0.26;
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

  /* top register row — mark + wordmark · left; FIG 0.0 · right */
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
    font-size: 72px;
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
</style>
</head>
<body>
  <div class="aurora"></div>
  <div class="depth"><div class="depth-plane"></div></div>
  <div class="bezel"></div>
  <span class="tick tl"></span><span class="tick tr"></span>
  <span class="tick bl"></span><span class="tick br"></span>

  <div class="card">
    <div class="top">
      <div class="brand">
        <svg viewBox="0 0 1100 1100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="${nikaPath}" fill="#f4f5f7" />
        </svg>
        <span class="wordmark">nika</span>
      </div>
      <div class="fig"><span class="rule"></span>FIG 0.0</div>
    </div>

    <h1 class="headline">See what your AI will do.<br><span class="b">Before it does it.</span></h1>
    <p class="sub">The control layer for AI agents&nbsp;— a reviewable, enforceable plan before it acts.</p>
    <p class="permits"><span class="arrow">▸</span><span><b>permits:</b> everything it can touch&nbsp;— and nothing&nbsp;else.</span></p>

    <div class="foot">
      <span class="domain">nika.sh</span>
      <span class="stack">AGPL<span class="dot"></span>Rust<span class="dot"></span>local-first</span>
    </div>
  </div>
</body>
</html>`;

const htmlOut = resolve(__dirname, 'og-card.html');
writeFileSync(htmlOut, html);
console.log(`wrote ${htmlOut} (${(html.length / 1024).toFixed(0)} KB self-contained)`);

// ── render → downscale → quantise ────────────────────────────────────────────
// Headless Chrome screenshots at DSF 2 (2400×1260) for crisp glyph edges, then
// ImageMagick downscales to 1200×630, then pngquant quantises (256-color palette
// keeps the soft cyan→violet aurora gradient banding-free while staying small).
const sh = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
const CHROME =
  process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const raw = '/tmp/og-raw.png';
const down = '/tmp/og-down.png';
const out = resolve(pub, 'og.png');

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
