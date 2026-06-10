/* tiny zero-dep YAML highlighter — tuned for Nika workflows */
const RE =
  /(\$\{\{[^}]*\}\})|(#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(^\s*-?\s*[\w.-]+:)|\b(v1)\b/

const VERBS = new Set(['infer', 'exec', 'invoke', 'agent'])

function tint(line: string, key: number, lit: boolean) {
  const out: React.ReactNode[] = []
  let rest = line
  let i = 0
  while (rest.length) {
    const m = rest.match(RE)
    if (!m || m.index === undefined) {
      out.push(rest)
      break
    }
    if (m.index > 0) out.push(rest.slice(0, m.index))
    const [full, bind, comment, str, keyTok, ver] = m
    if (bind) out.push(<span key={i++} className="t-bind">{full}</span>)
    else if (comment) out.push(<span key={i++} className="t-dim">{full}</span>)
    else if (str) out.push(<span key={i++} className="t-str">{full}</span>)
    else if (keyTok) {
      const word = keyTok.replace(/[\s:-]/g, '')
      out.push(
        <span key={i++} className={VERBS.has(word) ? 't-verb' : 't-key'}>
          {full}
        </span>,
      )
    } else if (ver) out.push(<span key={i++} className="t-accent">{full}</span>)
    rest = rest.slice(m.index + full.length)
  }
  return (
    <span key={key} className={lit ? 'block hl-line' : 'block'}>
      {out}
      {'\n'}
    </span>
  )
}

export default function Code({
  code,
  highlight,
}: {
  code: string
  /** 0-based inclusive line range to light up (the run-sim active task) */
  highlight?: [number, number] | null
}) {
  const lines = code.replace(/\n$/, '').split('\n')
  const [h0, h1] = highlight ?? [-1, -2]
  return (
    <pre className="code">
      <code>{lines.map((l, i) => tint(l, i, i >= h0 && i <= h1))}</code>
    </pre>
  )
}
