import type { ReactNode } from 'react'

/* ─── SectionHead · the ONE section masthead (index plate + title + lede) ─────
   The v4sec-fig / v4sec-title / v4sec-lede triple with its 0/60/120ms rise
   stagger used to be pasted per section; this component is the single source
   so the masthead register can never drift again. The plate GRAMMAR (NN
   two-digit stamps in reading order · NN.m sub-plates · word mastheads on
   routed pages) is documented at the .v4fig block in src/shell/shell.css.

   `children` is the lede paragraph content. Sections with a bespoke masthead
   register (OwnWorkflows' statement · FinalCTA's centered close) keep their
   own markup on purpose — this is the standard head only. */
export function SectionHead({
  fig,
  id,
  title,
  children,
}: {
  /** the mono plate, e.g. "07" */
  fig: string
  /** the heading id (the section's aria-labelledby target) */
  id: string
  /** the section title (rendered inside the h2) */
  title: ReactNode
  /** the lede paragraph content */
  children: ReactNode
}) {
  return (
    <>
      <p className="v4sec-fig" data-rise>
        {fig}
      </p>
      <h2
        id={id}
        className="v4sec-title"
        data-rise
        style={{ ['--rise-delay' as string]: '60ms' }}
      >
        {title}
      </h2>
      <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
        {children}
      </p>
    </>
  )
}
