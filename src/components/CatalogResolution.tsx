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
        <span className="ch-machine-id" id="ch-machine-title">
          <i aria-hidden />
          catalog resolution
        </span>
        <span className="ch-machine-status">
          <b aria-hidden />
          {props.release} · digest verified
        </span>
      </div>
      <div className="ch-machine-body">
        <div className="ch-clock ch-clock--standard">
          <span className="ch-clock-index mono" aria-hidden>01</span>
          <span className="ch-clock-k mono">standard clock</span>
          <strong><span>{props.canonicalProviders}</span></strong>
          <span className="ch-clock-unit">canonical providers</span>
          <p>The stable seats the language names. This set changes with the specification.</p>
        </div>
        <div className="ch-resolver" aria-hidden="true">
          <div className="ch-resolver-grid" />
          <span className="ch-orbit ch-orbit--outer" />
          <span className="ch-orbit ch-orbit--inner" />
          <span className="ch-orbit-node ch-orbit-node--a" />
          <span className="ch-orbit-node ch-orbit-node--b" />
          <span className="ch-orbit-node ch-orbit-node--c" />
          <span className="ch-resolver-line ch-resolver-line--in">
            <i /><i /><i />
          </span>
          <span className="ch-resolver-core mono">
            <small>resolve</small>
            model string
          </span>
          <span className="ch-resolver-line ch-resolver-line--out">
            <i /><i /><i />
          </span>
          <span className="ch-resolver-axis mono ch-resolver-axis--top">standard</span>
          <span className="ch-resolver-axis mono ch-resolver-axis--bottom">release</span>
        </div>
        <div className="ch-clock ch-clock--release">
          <span className="ch-clock-index mono" aria-hidden>02</span>
          <span className="ch-clock-k mono">release clock</span>
          <strong><span>{props.marketProviders}</span></strong>
          <span className="ch-clock-unit">market provider seats</span>
          <p>The concrete seats, models, price rules and energy rows the installed binary knows.</p>
        </div>
      </div>
      <div className="ch-machine-foot mono">
        <span><b>01</b>{props.models} models</span>
        <span><b>02</b>{props.pricingRules} price rules</span>
        <span><b>03</b>{props.energyRows} energy rows</span>
        <span><b>04</b>{props.mcpServers} MCP servers</span>
      </div>
    </section>
  )
}
