#!/usr/bin/env node
/* ansi2html.mjs — honest ANSI→HTML converter for the run-explains scenes.
 *
 * Input: a raw TTY capture (script(1)) of the real nika binary. Output:
 * JSON the scene templates consume. Two modes:
 *
 *   node ansi2html.mjs static  <in.ansi> <out.json>   # one final block
 *   node ansi2html.mjs frames  <in.ansi> <out.json>   # DEC-2026 frame seq
 *
 * The converter is mechanical: it maps the CLI's own SGR vocabulary
 * (ANSI-16 roles + the truecolor heat ramp) to CSS classes and NOTHING
 * else — no line is added, dropped, re-worded or re-ordered. OSC-8
 * hyperlink URL payloads are dropped (machine-local file:// targets);
 * the visible link TEXT stays byte-identical and keeps a .lnk marker.
 *
 * Frame reconstruction follows the sink's own repaint protocol
 * (nika-cli · display sink): first paint appends bare lines; every
 * REDRAW rides inside a DEC-2026 synchronized frame as
 *   ESC[?2026h  ESC[{n}A  ESC[0J  <lines>  ESC[?2026l
 * so a frame replaces the last n lines of the screen. Trailing output
 * after the final frame (the epilogue) appends normally.
 */
import fs from "node:fs";
import { pathToFileURL } from "node:url";

/* ── tokenizer ─────────────────────────────────────────────────────────── */
const ESC = "\x1b";

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* SGR state → css classes/style. The CLI's closed vocabulary:
 * 1 strong · 2 dim · 31 err · 32 ok · 33 warn · 36 acc · 38;2 heat. */
function spanFor(state, text) {
  if (text === "") return "";
  const cls = [];
  if (state.bold) cls.push("b");
  if (state.dim) cls.push("dim");
  if (state.fg === 31) cls.push("err");
  else if (state.fg === 32) cls.push("ok");
  else if (state.fg === 33) cls.push("warn");
  else if (state.fg === 36) cls.push("acc");
  else if (state.fg === 34) cls.push("acc");
  else if (state.fg === 35) cls.push("acc");
  if (state.link) cls.push("lnk");
  let style = "";
  if (state.rgb) style = ` style="color:rgb(${state.rgb.join(" ")})"`;
  if (cls.length === 0 && !style) return esc(text);
  return `<span${cls.length ? ` class="${cls.join(" ")}"` : ""}${style}>${esc(text)}</span>`;
}

/* Convert ONE logical line's raw bytes (SGR + OSC-8 inline) to HTML. */
function lineToHtml(line) {
  let out = "";
  let buf = "";
  const state = { bold: false, dim: false, fg: null, rgb: null, link: false };
  const flush = () => {
    out += spanFor(state, buf);
    buf = "";
  };
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === ESC) {
      const rest = line.slice(i);
      // OSC-8 open/close: ESC]8;params;url ST   (ST = ESC\)
      const osc = rest.match(/^\x1b\]8;([^;]*);([^\x1b\x07]*)(?:\x1b\\|\x07)/);
      if (osc) {
        flush();
        state.link = osc[2] !== ""; // empty url = link close
        i += osc[0].length;
        continue;
      }
      // CSI sequence
      const csi = rest.match(/^\x1b\[([0-9;?]*)([A-Za-z])/);
      if (csi) {
        const [, params, final] = csi;
        if (final === "m") {
          flush();
          const parts = params === "" ? ["0"] : params.split(";");
          for (let p = 0; p < parts.length; p++) {
            const n = Number(parts[p]);
            if (n === 0) {
              state.bold = state.dim = false;
              state.fg = null;
              state.rgb = null;
            } else if (n === 1) state.bold = true;
            else if (n === 2) state.dim = true;
            else if (n === 22) state.bold = state.dim = false;
            else if (n === 38 && parts[p + 1] === "2") {
              state.rgb = [Number(parts[p + 2]), Number(parts[p + 3]), Number(parts[p + 4])];
              state.fg = null;
              p += 4;
            } else if (n === 39) {
              state.fg = null;
              state.rgb = null;
            } else if (n >= 30 && n <= 37) {
              state.fg = n;
              state.rgb = null;
            } else if (n >= 90 && n <= 97) {
              state.fg = n - 60;
              state.rgb = null;
            }
          }
        }
        // every other CSI (cursor, clear, mode) is protocol, not content
        i += csi[0].length;
        continue;
      }
      // lone ESC or unknown escape — skip the ESC byte
      i += 1;
      continue;
    }
    buf += ch;
    i += 1;
  }
  flush();
  return out;
}

/* ── stream → logical lines / frames ───────────────────────────────────── */

/* Strip protocol noise that never affects content reconstruction. */
function preclean(s) {
  return s
    .replace(/\x1b\[\?25[lh]/g, "") // cursor hide/show
    .replace(/\x1b\[\?1049[lh]/g, "") // alt-screen (defensive)
    .replace(/\r\n/g, "\n"); // pty CRLF → LF
}

function splitFrames(stream) {
  // screen model: array of raw lines (with inline SGR/OSC bytes kept)
  let screen = [];
  const snapshots = [];
  let pending = ""; // partial last line

  const OPEN = "\x1b[?2026h";
  const CLOSE = "\x1b[?2026l";

  const appendChunk = (chunk) => {
    const parts = (pending + chunk).split("\n");
    pending = parts.pop() ?? "";
    for (const p of parts) screen.push(p);
  };

  let rem = preclean(stream);
  // The initial paint (everything before the first OPEN) appends.
  while (rem.length > 0) {
    const at = rem.indexOf(OPEN);
    if (at === -1) {
      appendChunk(rem);
      rem = "";
      break;
    }
    appendChunk(rem.slice(0, at));
    if (screen.length > 0 || pending !== "") {
      snapshots.push([...screen, ...(pending ? [pending] : [])]);
    }
    rem = rem.slice(at + OPEN.length);
    // redraw header: ESC[{n}A ESC[0J
    const up = rem.match(/^\x1b\[(\d+)A\x1b\[0J/);
    if (!up) throw new Error("frame open without cursor-up+clear header");
    const n = Number(up[1]);
    rem = rem.slice(up[0].length);
    // frame body runs until CLOSE
    const end = rem.indexOf(CLOSE);
    if (end === -1) throw new Error("unclosed DEC-2026 frame");
    const body = rem.slice(0, end);
    rem = rem.slice(end + CLOSE.length);
    // replace the last n screen lines (cursor-up n + clear-down)
    if (pending) {
      screen.push(pending);
      pending = "";
    }
    screen = screen.slice(0, Math.max(0, screen.length - n));
    const bodyLines = body.split("\n");
    const tail = bodyLines.pop(); // trailing "" when body ends with \n
    for (const b of bodyLines) screen.push(b);
    if (tail) pending = tail;
    snapshots.push([...screen, ...(pending ? [pending] : [])]);
  }
  if (pending) screen.push(pending);
  snapshots.push([...screen]);
  return snapshots;
}

const stripTrailingBlank = (lines) => {
  const out = [...lines];
  while (out.length && out[out.length - 1].replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "").trim() === "")
    out.pop();
  return out;
};

/* ── public surface ────────────────────────────────────────────────────── */

/* One final block of HTML lines (the whole capture as final content). */
export function convertStatic(raw) {
  return stripTrailingBlank(preclean(raw).split("\n")).map(lineToHtml);
}

/* The DEC-2026 frame sequence as HTML lines per frame, tick-repaints
 * deduped (consecutive identical frames collapse to one). */
export function convertFrames(raw) {
  const frames = splitFrames(raw).map((f) => stripTrailingBlank(f).map(lineToHtml));
  const dedup = [];
  for (const f of frames) {
    const key = f.join(" ");
    if (dedup.length === 0 || dedup[dedup.length - 1].join(" ") !== key) dedup.push(f);
  }
  return dedup;
}

/* ── CLI (kept for spot inspection) ────────────────────────────────────── */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , mode, inPath, outPath] = process.argv;
  if (!mode || !inPath || !outPath) {
    console.error("usage: node ansi2html.mjs <static|frames> <in.ansi> <out.json>");
    process.exit(1);
  }
  /* utf8, not latin1: the capture is a UTF-8 byte stream (🦋 · ◆ · ─ are
   * multibyte) and every escape-sequence pattern below is pure ASCII, so
   * decoding first is loss-free — latin1 shipped mojibake into the JSON. */
  const raw = fs.readFileSync(inPath, "utf8");
  if (mode === "static") {
    const lines = convertStatic(raw);
    fs.writeFileSync(outPath, JSON.stringify({ mode: "static", lines }, null, 1));
    console.log(`${outPath}: ${lines.length} lines`);
  } else if (mode === "frames") {
    const frames = convertFrames(raw);
    fs.writeFileSync(outPath, JSON.stringify({ mode: "frames", frames }, null, 0));
    console.log(`${outPath}: ${frames.length} frames`);
  } else {
    console.error(`unknown mode: ${mode}`);
    process.exit(1);
  }
}
