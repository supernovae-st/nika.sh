#!/usr/bin/env node
/* render-scenes.mjs — deterministic renderer for the run-explains scenes.
 *
 * Same contract as the engine media pipeline: each scene exposes
 * window.__scene {name,duration,fps,width,height,posterAt} + __seek(ms);
 * headless system Chrome steps the timeline frame by frame; ffmpeg
 * assembles MP4 + WebM + optimized GIF + poster.
 *
 * Static scenes (duration ≤ 100ms) export the poster PNG only.
 *
 *   node render-scenes.mjs                    # all scenes
 *   node render-scenes.mjs run-live           # one scene
 *   node render-scenes.mjs run-live --frame 9000   # one frame → stdout path
 */
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const MEDIA = path.join(ROOT, "public", "media");

const args = process.argv.slice(2);
const optValues = new Set(args.filter((a, i) => i > 0 && args[i - 1] === "--frame"));
let scenes = args.filter((a) => !a.startsWith("--") && !optValues.has(a));
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
};
if (scenes.length === 0) {
  scenes = fs
    .readdirSync(path.join(HERE, "scenes"))
    .filter((f) => f.endsWith(".html"))
    .map((f) => f.replace(/\.html$/, ""));
}

const ff = (fargs) =>
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...fargs], { stdio: "inherit" });
const mb = (p) => (fs.statSync(p).size / 1024 / 1024).toFixed(2);

const browser = await chromium.launch({ channel: "chrome", headless: true });

for (const scene of scenes) {
  const htmlPath = path.join(HERE, "scenes", `${scene}.html`);
  if (!fs.existsSync(htmlPath)) {
    console.error(`no such scene: ${htmlPath}`);
    process.exitCode = 1;
    continue;
  }

  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`file://${htmlPath}?render=1`);
  await page.waitForFunction(() => window.__scene && window.__seek);
  await page.waitForTimeout(300); // fonts settle
  const meta = await page.evaluate(() => window.__scene);
  const clip = { x: 0, y: 0, width: meta.width, height: meta.height };
  await page.setViewportSize({ width: meta.width, height: meta.height });

  fs.mkdirSync(path.join(MEDIA, "posters"), { recursive: true });
  const poster = path.join(MEDIA, "posters", `${scene}.png`);

  // single-frame inspection mode
  const frameAt = opt("frame");
  if (frameAt !== null) {
    await page.evaluate((t) => window.__seek(Number(t)), frameAt);
    const out = path.join(os.tmpdir(), `${scene}-${frameAt}.png`);
    await page.screenshot({ path: out, clip });
    console.log(out);
    await page.close();
    continue;
  }

  // static scene → poster only
  if (meta.duration <= 100) {
    await page.evaluate((t) => window.__seek(Number(t)), meta.posterAt ?? 0);
    await page.screenshot({ path: poster, clip });
    console.log(`▸ ${scene} · static · poster ${mb(poster)}MB`);
    await page.close();
    continue;
  }

  const fps = Number(meta.fps ?? 30);
  const frames = Math.ceil((meta.duration / 1000) * fps);
  const framesDir = path.join(os.tmpdir(), "nika-scene-frames", scene);
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  process.stdout.write(`▸ ${scene} · ${meta.duration}ms · ${frames} frames @ ${fps}fps `);
  const t0 = Date.now();
  for (let f = 0; f <= frames; f++) {
    await page.evaluate((t) => window.__seek(Number(t)), (f * 1000) / fps);
    await page.screenshot({ path: path.join(framesDir, `f${String(f).padStart(5, "0")}.png`), clip });
    if (f % Math.ceil(frames / 10) === 0) process.stdout.write(".");
  }
  console.log(` ${((Date.now() - t0) / 1000) | 0}s`);

  for (const d of ["videos", "gifs"]) fs.mkdirSync(path.join(MEDIA, d), { recursive: true });
  const input = ["-framerate", String(fps), "-i", path.join(framesDir, "f%05d.png")];
  const mp4 = path.join(MEDIA, "videos", `${scene}.mp4`);
  const webm = path.join(MEDIA, "videos", `${scene}.webm`);
  const gif = path.join(MEDIA, "gifs", `${scene}.optimized.gif`);

  ff(["-y", ...input, "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4]);
  ff(["-y", ...input, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "40", "-row-mt", "1", "-an", webm]);
  ff(["-y", "-i", mp4, "-vf",
    "fps=16,scale=1280:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=192[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4",
    gif]);

  // poster = the exact posterAt frame
  await page.evaluate((t) => window.__seek(Number(t)), meta.posterAt ?? 0);
  await page.screenshot({ path: poster, clip });

  console.log(`  mp4 ${mb(mp4)}MB · webm ${mb(webm)}MB · gif ${mb(gif)}MB · poster ${mb(poster)}MB`);
  if (!flag("keep-frames")) fs.rmSync(framesDir, { recursive: true, force: true });
  await page.close();
}

await browser.close();
