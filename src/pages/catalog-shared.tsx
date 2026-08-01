/* ─── catalog-shared · the /catalog world's common grammar ───────────────────
   One room contract for every catalog page (the design-RAMS law): the same
   page shell, the same section kit, ONE provenance line · every page says
   what it derives from (the engine pin · D1: the catalogue the site shows IS
   the catalogue of the downloadable binary). No new visual vocabulary: the
   classes here are the register grammar the rest of the site already speaks
   (v4sec · tp-list/tp-row · td-chips · truth-line). */
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useRevealOnce } from '../sections/use-reveal-once'
import { CATALOG_ENGINE } from '../content/catalog-paths.generated'

/** the one provenance line · loi 2 (provenance-first) on every catalog page */
export function EngineTruthLine() {
  return (
    <p className="truth-line">
      <span>
        Vendored from the released binary · {CATALOG_ENGINE.provenance} · digest-verified, re-derived
        at build, gated in CI
      </span>
    </p>
  )
}

export function CatalogShell({
  fig,
  title,
  lede,
  crumb,
  children,
}: {
  fig: string
  title: ReactNode
  lede: ReactNode
  /** the way back up · every room knows its hub (design-RAMS: one pattern) */
  crumb?: { to: string; label: string }
  children: ReactNode
}) {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  return (
    <main className="theme-dark tp-page td-page">
      <section className="v4sec v4-in" ref={ref}>
        <div className="v4sec-wrap">
          {crumb && (
            <nav className="td-crumb" aria-label="Breadcrumb">
              <Link className="td-crumb-link" to={crumb.to}>
                {crumb.label}
              </Link>
            </nav>
          )}
          <p className="v4sec-fig">{fig}</p>
          <h1 className="v4sec-title tp-title">{title}</h1>
          <p className="v4sec-lede">{lede}</p>
          <EngineTruthLine />
          {children}
        </div>
      </section>
    </main>
  )
}

export function CatalogSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="td-sec" id={id} aria-labelledby={`${id}-h`}>
      <h2 className="td-h2" id={`${id}-h`}>
        {title}
      </h2>
      {children}
    </section>
  )
}
