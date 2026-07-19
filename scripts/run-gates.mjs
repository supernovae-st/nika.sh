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
import { execFileSync, spawn } from 'node:child_process'
import { readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

/* the SingletonLock law, structural (2026-07-19 · the rooms-sweep autopsy):
   a KILLED battery leaves its Chrome profile dirs under the tmpdir with a
   live SingletonLock — the NEXT battery's Chrome sees the lock, queues on
   the dead owner and never comes up (CPU 0 · same page forever · the belt
   reads as a 20-minute hang). Every Chrome-driving leg now purges the
   stale profiles FIRST — a fresh battery can never inherit a dead lock.
   Profiles only, never processes (a parallel LIVE battery keeps its own
   dirs open; rm on an open dir is safe on POSIX, and CI runners are
   single-battery by construction). */
const chromeProfileSweep = () => {
  for (const base of ['/tmp', tmpdir()]) {
    let entries = []
    try {
      entries = readdirSync(base)
    } catch {
      continue
    }
    for (const name of entries) {
      if (/^(e2e-sweep-|e2e-smoke-|a11y-sweep-|visual-regress-|lh-spot-)/.test(name)) {
        try {
          rmSync(join(base, name), { recursive: true, force: true })
        } catch {
          /* an open profile of a LIVE battery may refuse — that one is not stale */
        }
      }
    }
  }
}

/* the EADDRINUSE law, structural (the SingletonLock's sister): a HUNG
   battery from a killed run keeps its http/CDP listener alive, and the
   next battery's fixed port is taken (a11y 9251 hit twice in one arc).
   Before each Chrome leg, free the KNOWN fixed gate ports — but only
   from a holder that is (a) one of OUR sweep scripts AND (b) older than
   15 minutes: a live leg never runs that long (the hang autopsy read 20),
   so a parallel session's HEALTHY battery is never touched, and an
   unknown process on the port is never ours to kill (the gate then fails
   honestly on EADDRINUSE, naming the squatter). e2e derives its ports
   from the pid and needs none of this. */
const GATE_PORTS = [9251, 9252, 9242, 4519, 9280, 9281]
const SWEEP_CMD = /a11y-sweep|visual-regress|lighthouse-spot|probe-hydration|e2e-sweep/
const etimeSec = (raw) => {
  const m = raw.trim().match(/^(?:(\d+)-)?(?:(\d+):)?(\d+):(\d+)$/)
  if (!m) return 0
  return (Number(m[1] ?? 0) * 24 + Number(m[2] ?? 0)) * 3600 + Number(m[3]) * 60 + Number(m[4])
}
const portSweep = () => {
  for (const port of GATE_PORTS) {
    let pids = []
    try {
      pids = execFileSync('lsof', ['-ti', `tcp:${port}`], { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .split('\n')
        .filter(Boolean)
    } catch {
      continue /* free port (or no lsof) — nothing to do */
    }
    for (const pid of pids) {
      try {
        const cmd = execFileSync('ps', ['-o', 'command=', '-p', pid]).toString()
        const age = etimeSec(execFileSync('ps', ['-o', 'etime=', '-p', pid]).toString())
        if (SWEEP_CMD.test(cmd) && age > 900) {
          process.kill(Number(pid), 'SIGKILL')
          console.log(`  ↻ port ${port}: killed stale sweep pid ${pid} (${Math.round(age / 60)}min)`)
        }
      } catch {
        /* raced away — fine */
      }
    }
  }
}

const GATES = [
  { name: 'check', cmd: ['pnpm', 'check'] },
  { name: 'lint', cmd: ['pnpm', 'lint'] },
  { name: 'test', cmd: ['pnpm', 'test'] },
  { name: 'build', cmd: ['pnpm', 'build'], slow: true },
  { name: 'goldens', cmd: ['node', 'scripts/visual-regress.mjs'], slow: true, chrome: true },
  /* PID-derived ports: the sweep's defaults (4523/9285) belong to whoever ran
     it bare — a parallel session's live belt, a zombie. EADDRINUSE cost a full
     gate run; the runner now always brings its own pair, unique per process. */
  { name: 'e2e', cmd: ['node', 'scripts/e2e-sweep.mjs', '--port', String(4600 + (process.pid % 97)), '--cdp', String(9400 + (process.pid % 97))], slow: true, chrome: true },
  { name: 'a11y', cmd: ['node', 'scripts/a11y-sweep.mjs'], slow: true, chrome: true },
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
    if (gate.chrome) {
      chromeProfileSweep()
      portSweep()
    }
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
