#!/usr/bin/env bash
# validate-media.sh — the run-explains media honesty + budget gate.
#
# 1. Every fixture shown in an asset passes `nika check` exactly as shown.
# 2. The committed traces carry the story the assets claim (4 tasks banked
#    before the kill · a workflow_paused tail on the gated run).
# 3. scenes/*.html regenerate byte-identical from raw/ (no hand edits).
# 4. Every export exists; GIFs ≤ 8 MB; posters ≤ 1 MB.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
cd "$ROOT"

FIX="scripts/media/fixtures"
fail=0
say() { printf ' %s\n' "$*"; }

# ── claim checks (need the nika binary) ─────────────────────────────────
if command -v nika >/dev/null; then
  for wf in "$FIX/signature-demo/signature-demo.nika.yaml" \
    "$FIX/signature-paced/signature-paced.nika.yaml" \
    "$FIX/signature-gated/signature-gated.nika.yaml"; do
    if (cd "$(dirname "$wf")" && nika check "$(basename "$wf")" >/dev/null 2>&1); then
      say "✔ $(basename "$wf") clean (as shown)"
    else
      say "✖ $(basename "$wf") FAILS check but is shown as clean"
      fail=1
    fi
  done
else
  say "○ nika binary not on PATH — skipping the check claims"
fi

# ── trace-shape checks (offline · jq) ───────────────────────────────────
banked=$(grep -c '"kind":"task_completed"' "$FIX/signature-paced/run.ndjson")
if [ "$banked" = "4" ]; then
  say "✔ killed trace banks exactly 4 tasks (as the kill panel shows)"
else
  say "✖ killed trace banks $banked tasks, the asset says 4"
  fail=1
fi

if tail -1 "$FIX/signature-gated/gate.ndjson" | grep -q '"kind":"workflow_paused"'; then
  say "✔ gated trace ends paused (as the gate panel shows)"
else
  say "✖ gated trace does not end on workflow_paused"
  fail=1
fi

# ── regeneration drift ──────────────────────────────────────────────────
(cd "$HERE" && node gen-scenes.mjs >/dev/null)
if git -C "$ROOT" diff --quiet -- scripts/media/scenes; then
  say "✔ scenes regenerate byte-identical from raw/"
else
  say "✖ scenes/*.html drifted from raw/ (hand edit? re-run gen-scenes.mjs and commit)"
  fail=1
fi

# ── existence + budgets ─────────────────────────────────────────────────
required=(
  public/media/posters/check-audit.png
  public/media/posters/inspect-anatomy.png
  public/media/posters/run-live.png
  public/media/posters/run-epilogue.png
  public/media/posters/trace-outputs.png
  public/media/posters/trace-flow.png
  public/media/posters/kill-resume.png
  public/media/posters/gate-consent.png
  public/media/videos/run-live.mp4
  public/media/videos/run-live.webm
  public/media/gifs/run-live.optimized.gif
)
for f in "${required[@]}"; do
  if [ ! -f "$f" ]; then
    say "✖ missing export: $f"
    fail=1
  fi
done

budget() { # path max_bytes label
  if [ -f "$1" ]; then
    sz=$(stat -f%z "$1" 2>/dev/null || stat -c%s "$1")
    if [ "$sz" -gt "$2" ]; then
      say "✖ $1 over budget ($sz > $2)"
      fail=1
    fi
  fi
}
budget public/media/gifs/run-live.optimized.gif $((8 * 1024 * 1024))
for p in public/media/posters/*.png; do budget "$p" $((1024 * 1024)); done

[ "$fail" = 0 ] && say "media gate: GREEN" || say "media gate: RED"
exit "$fail"
