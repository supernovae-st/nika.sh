export interface CatalogResolutionProps {
  release: string
  canonicalProviders: number
  marketProviders: number
  models: number
  pricingRules: number
  energyRows: number
  mcpServers: number
}

export default function CatalogResolution(props: CatalogResolutionProps) {
  return (
    <section className="ch-machine" aria-labelledby="ch-machine-title">
      <div className="ch-machine-bar mono">
        <span id="ch-machine-title">catalog resolution</span>
        <span>{props.release} · digest verified</span>
      </div>
      <div className="ch-machine-body">
        <div className="ch-clock ch-clock--standard">
          <span className="ch-clock-k mono">01 · standard clock</span>
          <strong>{props.canonicalProviders}</strong>
          <span>canonical providers</span>
          <p>The stable seats the language names. This set changes with the specification.</p>
        </div>
        <div className="ch-resolver" aria-hidden>
          <span className="ch-resolver-line" />
          <span className="ch-resolver-core mono">model string</span>
          <span className="ch-resolver-line" />
        </div>
        <div className="ch-clock ch-clock--release">
          <span className="ch-clock-k mono">02 · release clock</span>
          <strong>{props.marketProviders}</strong>
          <span>market provider seats</span>
          <p>The concrete seats, models, price rules and energy rows the installed binary knows.</p>
        </div>
      </div>
      <div className="ch-machine-foot mono">
        <span>{props.models} models</span>
        <span>{props.pricingRules} price rules</span>
        <span>{props.energyRows} energy rows</span>
        <span>{props.mcpServers} MCP servers</span>
      </div>
    </section>
  )
}
