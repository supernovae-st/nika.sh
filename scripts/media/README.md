# run-explains media pipeline

The « the run explains itself » section assets. Every terminal pixel on
the site traces back to a raw pty capture of the real `nika` binary in
this directory — no fake commands, no fake output, no hand-edited
transcripts.

```
capture-terminal.py   real pty (100x34) → raw/*.ansi (bytes, untouched)
raw/                  the captures + manifest.json (binary · commands · exit codes)
fixtures/             the workflows the captures ran (each dir is runnable in place)
ansi2html.mjs         mechanical ANSI→HTML (the CLI's own SGR roles, 1:1)
gen-scenes.mjs        raw + manifest → scenes/*.html (GENERATED — never hand-edit)
render-scenes.mjs     headless Chrome frame-stepping + ffmpeg → ../../public/media/
validate-media.sh     the honesty + budget gate
```

## The capture set

| capture | fixture | what it shows |
|---|---|---|
| `check` | signature-demo | the pre-flight audit ladder (rc=0 · 1 hint) |
| `inspect` | signature-demo | static anatomy: waves · parallelism · pinch · blast |
| `run` | signature-demo | the live run (30 DEC-2026 frames) + epilogue |
| `trace-outputs` | signature-demo | per-task outputs from the flight recorder |
| `trace-flow` | signature-demo | the data waterfall (plan bindings × trace sizes) |
| `kill-session` + `kill-forensics` | signature-paced | `--json` run SIGKILLed mid-fanout (exit 137) · what the trace banked |
| `resume` | signature-paced | `--resume` re-run: 4 ↷ cache hits · 4 ran live |
| `gate-pause` + `gate-note` | signature-gated | `nika:prompt` pauses the run durably (exit 4) |
| `gate-resume` | signature-gated | `--resume --answer approve=true` re-arms · 5 ↷ |

The two variants are the signature workflow plus exactly one teaching
device each: `signature-paced` adds a `nika:wait` pace fan-out so a kill
lands mid-flight; `signature-gated` adds one `nika:prompt` before
publish. Both run fully offline on `mock/echo`. The committed
`run.ndjson` / `gate.ndjson` are the real traces those panels resume
from — `nika run --resume` on them reproduces the ↷ story.

## Re-capture

From a fixture dir, with the release `nika` on PATH:

```sh
python3 ../../capture-terminal.py ../../raw/check.ansi -- nika check signature-demo.nika.yaml
python3 ../../capture-terminal.py ../../raw/run.ansi   -- nika run signature-demo.nika.yaml
# the kill (writes the trace the resume panel reads):
python3 ../../capture-terminal.py ../../raw/kill-session.ansi -- \
  zsh -fc 'nika run signature-paced.nika.yaml --json > run.ndjson &
sleep 2.5; kill -KILL $!
wait $!; echo "exit=$?"'
```

Update `raw/manifest.json` with the printed row + the exact command
list, then:

```sh
node gen-scenes.mjs        # scenes/*.html
node render-scenes.mjs     # → public/media/{posters,videos,gifs}
bash validate-media.sh     # the gate
```

`npm install` here (playwright-core only) if node_modules is absent;
rendering drives the system Chrome, no browser download.

## Honesty rules

- A capture is a byte stream from a real pty — commit it untouched.
- The scene generator only converts SGR roles to CSS classes and restates
  the manifest's command lines as `$` prompts. Adding, dropping or
  re-wording a line is forbidden (the regeneration gate catches drift).
- Presentation that is NOT capture-truth must say so on the plate: the
  hero replays real frames « at reading pace »; the variants name their
  teaching device.
- OSC-8 hyperlink URL payloads (machine-local `file://` targets) are
  dropped at conversion; the visible link text stays byte-identical and
  keeps a dotted underline.
