/* ─── run-gates · every local gate, one honest verdict ────────────────────────
   The ad-hoc way to run the gates before a PR is a `&&` chain with each gate
   piped through `tail` to keep the output short — and a pipe's exit code is
   the LAST command's, so a crashed gate reads as green and the chain commits
   on a failure it never saw (the piped-verdict trap; it shipped a broken
   verdict twice in one day before this runner existed).

   This runner is the structural fix: gates run in sequence, output is
   CAPTURED (silent while green — one ✓ line per gate), a failing gate prints
   its full tail and stops the run, and the exit code is the gate's own.
   No pipes anywhere near a verdict.

   Slow is not stuck (the second incident): a captured gate is silent for as
   long as it runs, and a 33-minute a11y sweep under load reads exactly like
   a hang — a healthy gate got killed at 95% on that misread. So the runner
   is never mute: captured gates print a heartbeat (`… name 60s`) each minute,
   and --only (the debugging mode — you asked for ONE gate to watch) streams
   the gate's own output live. Both still carry the gate's own exit code.

   Run:  node scripts/run-gates.mjs            (the pre-PR belt: fast → slow)
         node scripts/run-gates.mjs --fast     (stop after unit tests)
         node scripts/run-gates.mjs --only e2e (one gate, streamed live)

   The build gate runs before goldens/e2e/a11y because all three drive dist/. */
import { spawn } from 'node:child_process'

const GATES = [
  { name: 'check', cmd: ['pnpm', 'check'] },
  { name: 'lint', cmd: ['pnpm', 'lint'] },
  { name: 'test', cmd: ['pnpm', 'test'] },
  { name: 'build', cmd: ['pnpm', 'build'], slow: true },
  { name: 'goldens', cmd: ['node', 'scripts/visual-regress.mjs'], slow: true },
  { name: 'e2e', cmd: ['node', 'scripts/e2e-sweep.mjs'], slow: true },
  { name: 'a11y', cmd: ['node', 'scripts/a11y-sweep.mjs'], slow: true },
]

const argv = process.argv.slice(2)
const fast = argv.includes('--fast')
const onlyAt = argv.indexOf('--only')
const only = onlyAt >= 0 ? argv[onlyAt + 1] : null
if (only && !GATES.some((g) => g.name === only)) {
  console.error(`unknown gate "${only}" · gates: ${GATES.map((g) => g.name).join(' · ')}`)
  process.exit(2)
}

/* one gate · captured (heartbeat each minute) or streamed (--only) — the
   exit code is read from the child itself either way, never from a pipe */
const runGate = (gate, stream) =>
  new Promise((resolve) => {
    const child = spawn(gate.cmd[0], gate.cmd.slice(1), { stdio: ['ignore', 'pipe', 'pipe'] })
    const chunks = []
    const tg = Date.now()
    const beat = stream
      ? null
      : setInterval(() => {
          console.log(`  … ${gate.name.padEnd(8)} ${((Date.now() - tg) / 1000).toFixed(0)}s`)
        }, 60_000)
    for (const src of [child.stdout, child.stderr]) {
      src.setEncoding('utf8')
      src.on('data', (d) => {
        chunks.push(d)
        if (stream) process.stdout.write(d)
      })
    }
    child.on('close', (status, signal) => {
      if (beat) clearInterval(beat)
      resolve({ status, signal, out: chunks.join(''), secs: ((Date.now() - tg) / 1000).toFixed(0) })
    })
  })

const t0 = Date.now()
for (const gate of GATES) {
  if (only && gate.name !== only) continue
  if (!only && fast && gate.slow) continue
  const r = await runGate(gate, Boolean(only))
  if (r.status === 0) {
    console.log(`  ✓ ${gate.name.padEnd(8)} ${r.secs}s`)
    continue
  }
  /* the honest red: name the gate, print its real tail, carry ITS code */
  const out = r.out.split('\n').filter((l) => l.trim())
  console.error(`\n  ✗ ${gate.name} failed (exit ${r.status ?? 'signal ' + r.signal}) — last output:\n`)
  for (const line of out.slice(-25)) console.error(`    ${line}`)
  process.exit(r.status ?? 1)
}
console.log(`\nGATES PASS · ${((Date.now() - t0) / 1000).toFixed(0)}s total`)
