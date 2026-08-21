import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/* The signed NDJSON files stay verbatim evidence. The home replay consumes
   only these wire fields, so this Vite/Vitest plugin projects them at build
   time instead of shipping hashes, UUIDs, outputs and receipts in initial JS. */
export function flagshipTraceReplay() {
  const replayFields = new Set(['task', 'note', 'detail', 'duration_ms', 'tokens'])
  const virtualPrefix = '\0flagship-trace-replay:'
  return {
    name: 'flagship-trace-replay',
    enforce: 'pre' as const,
    resolveId(id: string, importer?: string) {
      if (!id.endsWith('.ndjson?replay')) return null
      const source = id.slice(0, -'?replay'.length)
      const file = importer ? resolve(dirname(importer), source) : resolve(source)
      return `${virtualPrefix}${file}`
    },
    load(id: string) {
      if (!id.startsWith(virtualPrefix)) return null
      const source = readFileSync(id.slice(virtualPrefix.length), 'utf8')
      const replay = source
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => {
          const event = JSON.parse(line) as {
            timestamp: number
            kind: string
            fields: { key: string; value: unknown }[]
          }
          return JSON.stringify({
            timestamp: event.timestamp,
            kind: event.kind,
            fields: event.fields.filter(({ key }) => replayFields.has(key)),
          })
        })
        .join('\n')
      return `export default ${JSON.stringify(replay)}`
    },
  }
}
