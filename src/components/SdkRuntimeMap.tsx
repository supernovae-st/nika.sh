import { useRef } from 'react'
import { Link } from 'react-router'
import { useScrollWellTab } from '../lib/use-scroll-well'

function Arrow({ id }: { id: string }) {
  const markerId = `sdk-map-head-${id}`
  return (
    <svg className="sdk-map-wire" viewBox="0 0 62 12" aria-hidden preserveAspectRatio="none">
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 8 8"
          refX="6.8"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path className="sdk-map-wire-head" d="M0.8 0.8 L6.8 4 L0.8 7.2" />
        </marker>
      </defs>
      <path className="sdk-map-wire-line" d="M1 6 H58" markerEnd={`url(#${markerId})`} />
    </svg>
  )
}

function Node({ label, detail, state }: { label: string; detail: string; state?: 'live' | 'preview' }) {
  return (
    <div className="sdk-map-node" data-state={state}>
      <span className="sdk-map-node-label">{label}</span>
      <span className="sdk-map-node-detail">{detail}</span>
    </div>
  )
}

export function SdkRuntimeMap() {
  const wellRef = useRef<HTMLDivElement>(null)
  useScrollWellTab(wellRef, 'SDK runtime topology')

  return (
    <figure className="sdk-runtime-map">
      <div className="sdk-runtime-head">
        <span>runtime topology</span>
        <span>truth at the transport</span>
      </div>
      <div ref={wellRef} className="sdk-runtime-body">
        <div className="sdk-map-row" data-lane="live">
          <p className="sdk-map-lane">
            <span>live</span>
            project control
          </p>
          <Node label="nika.yaml" detail="ceiling · arm" state="live" />
          <Arrow id="project-policy" />
          <Node label="project root" detail="git-style discovery" />
          <Arrow id="project-firer" />
          <Node label="serve / OS" detail="one firer" state="live" />
          <Arrow id="project-state" />
          <Node label=".nika/" detail="traces · arm ledger" state="live" />
        </div>
        <div className="sdk-map-row" data-lane="live">
          <p className="sdk-map-lane">
            <span>live</span>
            local process
          </p>
          <Node label="*.nika.yaml" detail="workflow contract" />
          <Arrow id="local-contract" />
          <Node label="LocalNika" detail="argv · no shell" state="live" />
          <Arrow id="local-driver" />
          <Node label="nika" detail="check · run" state="live" />
          <Arrow id="local-runtime" />
          <Node label="events + trace" detail="NDJSON · receipt" state="live" />
        </div>
        <div className="sdk-map-row" data-lane="preview">
          <p className="sdk-map-lane">
            <span>preview</span>
            remote process
          </p>
          <Node label="application" detail="typed inputs" />
          <Arrow id="remote-app" />
          <Node label="Nika client" detail="HTTP · retries" state="preview" />
          <Arrow id="remote-client" />
          <Node label="workflow API" detail="not shipped" state="preview" />
          <Arrow id="remote-api" />
          <Node label="SSE + artifacts" detail="target contract" state="preview" />
        </div>
      </div>
      <figcaption>
        One workflow language, two transports. Start with the live lane.{' '}
        <Link to="/sdk/operations/server-surfaces">See what each server-shaped command does.</Link>
      </figcaption>
    </figure>
  )
}
