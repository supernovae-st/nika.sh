import { PROVIDERS } from '../content/providers.generated'
import { useLamp } from '../lib/use-lamp'

/* ─── the reach axis · what each model can hold ───────────────────────────────
   THE AXIS THIS PAGE WANTED WAS PRICE, and it cannot have one. The usage
   projection carries a pricing shape — input_per_million, output_per_million,
   pinned from models.dev — and every one of its rows is null across all
   seventeen donors. Drawing a price axis would mean inventing the numbers,
   which is the one thing a site whose thesis is "every claim derives from the
   spec" may not do. So the axis is the fact the data actually holds.

   AND IT IS THE BETTER AXIS ANYWAY. The question a reader brings here is not
   "what is cheapest" — it is "can this model take my file, and do I have to
   hand someone a key to find out". Twenty-nine models from 32k to 1,048,576
   tokens, a log scale because the range is five doublings wide, and the
   key-free ones marked because that is the fact this project exists over.

   Everything derives from providers.generated (context_window_tokens ·
   requires_key · kind · capabilities). Nothing is authored here. */

const MODELS = PROVIDERS.flatMap((p) =>
  (p.models ?? [])
    .filter((m) => m.context_window_tokens)
    .map((m) => ({
      provider: p.id,
      kind: p.kind,
      keyless: !p.requires_key,
      /* a bare `default` is the provider's own placeholder, not a name a
         reader can act on — qualify it with whose default it is */
      model: m.model === 'default' ? `${p.id}/default` : m.model,
      ctx: m.context_window_tokens as number,
      reasons: Boolean(m.capabilities?.reasoning),
      sees: Boolean(m.capabilities?.vision),
    })),
).sort((a, b) => a.ctx - b.ctx)

const LO = Math.min(...MODELS.map((m) => m.ctx))
const HI = Math.max(...MODELS.map((m) => m.ctx))
const at = (n: number) => ((Math.log(n) - Math.log(LO)) / (Math.log(HI) - Math.log(LO))) * 100

/* the ticks the eye already knows */
const TICKS = [32_000, 128_000, 256_000, 1_048_576].filter((t) => t >= LO && t <= HI)
const label = (n: number) => `${Math.round(n / 1000)}k`

export function ModelAxis() {
  const { ref: lampRef, props: lampProps } = useLamp<HTMLDivElement>()
  const keyless = MODELS.filter((m) => m.keyless).length

  return (
    <div className="mx" ref={lampRef} {...lampProps}>
      <p className="mx-head">
        <b>{MODELS.length} models</b> the catalog knows, from {label(LO)} to {label(HI)} tokens of
        context. <b>{keyless}</b> of them want no key at all.
      </p>

      <div className="mx-plot cabinet">
        <div className="mx-ticks" aria-hidden>
          {TICKS.map((t) => (
            <span key={t} className="mx-tick" style={{ ['--at' as string]: `${at(t)}%` }}>
              {label(t)}
            </span>
          ))}
        </div>

        <ul className="mx-rows">
          {MODELS.map((m) => (
            <li key={`${m.provider}-${m.model}`} className="mx-row" data-keyless={m.keyless ? '' : undefined}>
              <span className="mx-name">{m.model}</span>
              <span className="mx-track">
                <span className="mx-bar" style={{ ['--w' as string]: `${Math.max(at(m.ctx), 1.5)}%` }} />
                <span className="mx-dot" style={{ ['--at' as string]: `${at(m.ctx)}%` }} />
              </span>
              <span className="mx-ctx">{label(m.ctx)}</span>
              <span className="mx-marks" aria-hidden>
                {m.keyless ? '○' : '●'}
                {m.reasons ? ' ◇' : ''}
                {m.sees ? ' ◆' : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mx-legend">
        <b>○</b> no key needed · <b>●</b> a key, held by you · <b>◇</b> declared reasoning ·{' '}
        <b>◆</b> takes images. A log scale, because the range is five doublings wide. Context and
        capabilities derive from the catalog the engine ships; the pricing rows it carries are
        empty today, so this page does not draw a price it does not have.
      </p>
    </div>
  )
}
