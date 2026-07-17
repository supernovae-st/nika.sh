#!/usr/bin/env node
/* ── build-shipped-spec.mjs · vendor the BINARY's embedded spec identity ─────
   The two-clocks doctrine at the grammar layer. The site serves TWO spec
   surfaces:

     public/spec/v1/       the RATIFIED clock — the public nika-spec at the
                           resync PIN (resync-owned · never written here)
     public/spec/shipped/  the SHIPPED clock — what the released binary
                           actually embeds (`nika spec --schema/--canon`),
                           vendored HERE (this script · deliberate manual run)

   Why both exist: the 0.104 release ships the W2 grammar (workflow scalar ·
   tasks sequence) while the public spec still teaches W1. A visitor lives in
   the shipped world (`brew install nika`); the on-page corpus and its gate
   (onpage-yaml.test) therefore validate against the SHIPPED schema, while
   /sources renders the ratified↔shipped drift. When the public spec ratifies
   the flip and the PIN advances past it, the two clocks agree again and the
   gate can walk back to the pin.

   Vendored-catalog law (same as build-tools/build-providers): the build NEVER
   probes the binary — refresh is a deliberate manual run:
     node scripts/build-shipped-spec.mjs
   Binary resolution: NIKA_BIN, else `nika` on PATH. */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'spec', 'shipped')
const bin = process.env.NIKA_BIN || 'nika'

const run = (args) => execFileSync(bin, args, { encoding: 'utf8', timeout: 15000 })

const version = run(['--version']).trim().replace(/^nika\s+/, '')
const schema = JSON.parse(run(['spec', '--schema']))
const canon = run(['spec', '--canon'])

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'workflow.schema.json'), `${JSON.stringify(schema, null, 2)}\n`)
writeFileSync(join(OUT, 'canon.yaml'), canon.endsWith('\n') ? canon : `${canon}\n`)
writeFileSync(
  join(OUT, 'PROVENANCE.json'),
  `${JSON.stringify({ engine_version: version, source: 'nika spec --schema / --canon' }, null, 2)}\n`,
)
console.log(`wrote public/spec/shipped/{workflow.schema.json,canon.yaml,PROVENANCE.json} (engine ${version})`)
