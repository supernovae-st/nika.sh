/* ─── the pipeline diagram · intent → four verbs → result ───────────────────
   Paper-legible animated explainer for the light zone: one file flows through
   the four verbs and lands as a saved result. Pure CSS motion (dash-flow
   arrows + verb pulse) — calm, loopable, readable. */

const VERBS = [
  { v: 'infer', c: '#5b8cff', d: 'think' },
  { v: 'exec', c: '#ff7a3c', d: 'run code' },
  { v: 'invoke', c: '#22d3ee', d: 'use tools' },
  { v: 'agent', c: '#b07bff', d: 'delegate' },
]

export default function MethodDiagram() {
  return (
    <div className="rv md-diagram mb-16" aria-hidden>
      <div className="md-node">
        <span className="md-k">weekly-radar.nika.yaml</span>
        <em>your intent · one file</em>
      </div>
      <div className="md-arrow" />
      <div className="md-verbs">
        {VERBS.map((x, i) => (
          <div
            key={x.v}
            className="md-verb"
            style={{ ['--vc' as string]: x.c, animationDelay: `${i * 0.45}s` }}
          >
            <span className="md-k">{x.v}</span>
            <em>{x.d}</em>
          </div>
        ))}
      </div>
      <div className="md-arrow" />
      <div className="md-node md-out">
        <span className="md-k">✓ result saved</span>
        <em>same outcome · every run</em>
      </div>
    </div>
  )
}
