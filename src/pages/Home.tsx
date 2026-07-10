import { Suspense, lazy, useEffect, useState } from 'react'
import { useHead } from '@unhead/react'
import { routeHead, REPO, SITE } from '../content'
import Hero from '../sections/Hero'
import { FLAGSHIP_ENTRIES } from '../flagships'
import { LIBRARY } from '../flagships/library'
import ScrollMorph from '../sections/morph/ScrollMorph'
import TheBoundary from '../sections/boundary/TheBoundary'
import ProofStrip from '../sections/ProofStrip'
import Wedge from '../sections/Wedge'
import RunExplains from '../sections/run-explains/RunExplains'
import Verbs from '../sections/Verbs'
import WhereItFits from '../sections/WhereItFits'
import Toolbelt from '../sections/Toolbelt'
import UseCasesV4 from '../sections/UseCasesV4'
import EditorCanvas from '../sections/EditorCanvas'
import GetStarted from '../sections/GetStarted'
import ChangelogPreview from '../sections/ChangelogPreview'
import Proof from '../sections/Proof'
import Faq from '../sections/Faq'
import { FAQ_ITEMS } from '../sections/faq-data'
import FinalCTA from '../sections/FinalCTA'

/* ─── / · the v4 trust landing ───────────────────────────────────────────────
   Renders PURELY the v4 sections (design doc §6), stamped 01→14 in reading
   order (the Q1 renum lock · no holes, no decimals on the armed page):
     Hero → 01 film → 02 boundary → 03 wedge(+ledger) → 04 run-explains →
     05 verbs → 06 toolbelt → 07 where-it-fits → 08 gallery → 09 editor →
     10 changelog → 11 proof → 12 get-started → 13 faq → 14 close (→ footer).
   (BeyondChat was absorbed into the wedge — one anti-chat chapter.)
   Zero WebGL on first load — the hero is prerendered DOM, instant + crawlable.

   The whole v3 cinematic (the butterfly→supernova intro film + the Galaxy3D
   r3f canvas) was removed from the default render and now lives behind the
   « enter the galaxy » easter egg (design doc §10): typing « nika » lazy-loads
   <GalaxyEgg/> as a fullscreen overlay (`src/scene/GalaxyEgg → Galaxy`). The old
   v3 below-the-fold sections (ScrollStory, MethodDiagram, Transform, UseCases,
   RunSim) were unmounted in the v4 migration and have now been deleted. */

/* lazy chunk · the entire three.js scene + intro film loads ONLY on the egg
   trigger, so it never enters the default home bundle (design doc §8). */
const GalaxyEgg = lazy(() => import('../scene/GalaxyEgg'))

/* the full-bleed dither field · FIXED full-screen behind the WHOLE page (z-0) ·
   the Bayer-dithered blue-on-black field (square-tunnel motif) dives as you
   scroll, then fades out so the opaque sections take over. Lazy + client-only
   (the prerendered DOM paints first). */
const DitherField = lazy(() => import('../scene/DitherField'))

/* ─── home structured data · SoftwareApplication + SoftwareSourceCode ─────────
   Honest only — describes what ships (free, AGPL, one binary, any model). NO
   softwareVersion (the live count is on the README; not fabricated here). The
   @graph links the app to its AGPL source by @id. @unhead/react flushes this
   into dist/index.html at prerender (zero runtime cost). */
const HOME_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE}/#nika`,
      name: 'Nika',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'macOS, Linux, Windows',
      url: SITE,
      downloadUrl: `${SITE}/install.sh`,
      license: 'https://www.gnu.org/licenses/agpl-3.0.html',
      description:
        'The control layer for AI agents. Nika makes an agent write its plan as a readable file first: every step, tool and permission. You review it, the runtime enforces it, then it runs: traced and replayable. One Rust binary, any model, AGPL forever.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      isAccessibleForFree: true,
      author: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'SoftwareSourceCode',
      '@id': `${REPO}#sourcecode`,
      name: 'Nika',
      codeRepository: REPO,
      programmingLanguage: 'Rust',
      license: 'https://www.gnu.org/licenses/agpl-3.0.html',
      about: { '@id': `${SITE}/#nika` },
    },
    /* the FAQ · structured-data eligible (rich result). The Q&A text comes
       VERBATIM from the FAQ section's FAQ_ITEMS export (the single source of
       truth) so the structured data can never drift from the rendered page. */
    {
      '@type': 'FAQPage',
      '@id': `${SITE}/#faq`,
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ],
}

export function Component() {
  const [eggOpen, setEggOpen] = useState(false)
  /* V5 law #1 · ONE story, ONE file — the SELECTED one. The hero picks from
     the LIBRARY (wave K: 5 tabs + the picker); the run replay, the plan and
     the boundary all re-render from the selection's RECORDED flagship. A
     browse-only pick (no trace) keeps the story on the last recorded file —
     the hero affordance says so honestly (never a fabricated replay). */
  const [libIdx, setLibIdx] = useState(0)
  const [storyIdx, setStoryIdx] = useState(0)
  const item = LIBRARY[libIdx]
  const flagship = FLAGSHIP_ENTRIES[storyIdx]
  const onPick = (i: number) => {
    setLibIdx(i)
    const rec = LIBRARY[i].flagship
    if (rec) setStoryIdx(FLAGSHIP_ENTRIES.indexOf(rec))
  }
  /* idle-mount the dither field · React.lazy alone still FETCHES the chunk at
     hydration, and its three/r3f dependency chain (~880 kB pre-gzip) would
     compete with the text-LCP window. Deferring the mount to the first idle
     period keeps first paint pure DOM; the 2s timeout guarantees the field
     still arrives on busy devices. The hero is transparent over the page base
     either way, so the late canvas is a fade-in, never a layout shift. */
  const [fieldReady, setFieldReady] = useState(false)

  /* per-route <head> · prerendered into dist/index.html by @unhead/react */
  useHead({
    title: 'Nika · Intent as Code',
    link: routeHead('/').link,
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(HOME_JSONLD),
        processTemplateParams: false,
      },
    ],
    meta: [
      ...routeHead('/').meta,
      {
        name: 'description',
        content:
          'The control layer for AI agents: the plan is a file you review before it runs, permissions enforced, every run replayable. One binary, any model, AGPL.',
      },
      { property: 'og:title', content: 'Nika · Intent as Code' },
      {
        property: 'og:description',
        content:
          'The control layer for AI agents. Review the plan before it acts, enforce its permissions, replay the trace. One file, four verbs, one binary.',
      },
      { name: 'twitter:title', content: 'Nika · Intent as Code' },
      {
        name: 'twitter:description',
        content:
          'The control layer for AI agents. Review before it acts, enforce its permissions, replay the trace.',
      },
    ],
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setFieldReady(true), { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    const t = setTimeout(() => setFieldReady(true), 350) // Safari fallback
    return () => clearTimeout(t)
  }, [])

  /* easter egg · console lore + type « nika » → enter the galaxy (the v3
     cinematic). The keystroke buffer matches the last 4 keys; on « nika » we
     flip eggOpen, which lazy-loads + mounts <GalaxyEgg/> (the heavy chunk). */
  useEffect(() => {
    console.log(
      '%c\n   ⊱ ✦ ⊰\n  nika 🦋\n\n' +
        'you found the source.\n' +
        'the butterfly answers its name. try typing it.\n' +
        'https://github.com/supernovae-st/nika\n',
      'color:#7fe9ff;font-family:monospace;font-size:12px',
    )
    let buf = ''
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return
      buf = (buf + e.key.toLowerCase()).slice(-4)
      if (buf === 'nika') {
        buf = ''
        setEggOpen((open) => {
          if (!open) console.log('%c🦋 she heard you.', 'color:#7fe9ff;font-family:monospace')
          return true
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* lock body scroll while the galaxy overlay owns the screen */
  useEffect(() => {
    if (!eggOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [eggOpen])

  /* entrance choreography — sections rise + fade as they cross into view. */
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.rv')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add('in')
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <>
      {/* F1 · the header field · the quantized blue→black radial + survey grid,
          ANCHORED LEFT (the Maxime register). Pure CSS — it IS the first paint
          and the no-WebGL fallback; the opaque canvas below mounts ABOVE it in
          paint order and takes over the animated version (same family → no
          visible seam at the fade-in). */}
      <div className="v5-header-field" aria-hidden />
      {/* the full-bleed dither field · fixed behind the whole page (z-0). The
          transparent hero reveals it; the opaque sections below cover it as you
          scroll past. The header glow eases out with scroll (DitherField.tsx). */}
      {fieldReady && (
        <Suspense fallback={null}>
          <DitherField />
        </Suspense>
      )}
      <main className="relative z-[1]">
        {/* FIG 0.0 · the hero — DOM-first · instant · the calm first screen */}
        <Hero item={item} index={libIdx} onSelect={onPick} flagship={flagship} />

        {/* FIG 1.0 · THE MORPH — ONE continuous scroll-linked scene at every
             width (W20): the selected file travels, BURSTS into its DAG, then
             the recorded run chains through it while the terminal narrates
             (F2). Un-armed phones (reduced-motion · no-JS) get the vertical
             story instead — ScrollMorph owns both variants and mounts exactly
             one. The wrapper owns the #the-run anchor so the hero CTA lands
             on whichever variant renders. */}
        <div id="the-run" className="scroll-mt-24" data-aurora="film">
          <ScrollMorph flagship={flagship} />
        </div>

        {/* 02 · THE BOUNDARY — the same file's permits: read as the
             consumer feature + the denial beat (one card, one flash) */}
        <TheBoundary flagship={flagship} />

        {/* — · Proof strip — the honest mono numbers band (CANON counts) */}
        <ProofStrip />

        {/* 03 · THE WEDGE — the ONE anti-chat chapter: the capture split
             (emotion) + the black-box ledger (evidence · absorbed from the
             retired BeyondChat section per the Q1 fusion lock) */}
        <Wedge flagship={flagship} />

        {/* 04 · THE RUN EXPLAINS ITSELF — the observability chapter:
             real terminal captures of the signature workflow (check · inspect ·
             the live run · trace · kill→resume · the human gate) */}
        <RunExplains />

        {/* 05 · verb chapters — what an agent can do, declared not hidden */}
        <Verbs />

        {/* 06 · Toolbelt — the language's reach: what those verbs may use */}
        <Toolbelt />

        {/* 07 · where Nika fits — the orthogonal layer underneath (light) */}
        <WhereItFits />

        {/* 08 · Use cases — the gallery (here plurality is the point) */}
        <UseCasesV4 />

        {/* 09 · In your editor — the file becomes a canvas (the
             extension beat: content-first cards · live run · audit-before-
             run, with the two store CTAs) */}
        <EditorCanvas />

        {/* FIG 10 · Changelog — the ship log (latest milestones) */}
        <ChangelogPreview />

        {/* FIG 11 · Proof — the control guarantees + CANON counts (the ONE
             sovereignty section — OwnWorkflows said the same claims with the
             same numbers two sections apart and left Home in the W15 re-arc) */}
        <Proof />

        {/* FIG 12 · Get started — the on-ramp, AFTER the case is made (the
             hero already carries the early CTA; the ask belongs post-proof) */}
        <GetStarted flagship={flagship} />

        {/* FIG 13 · FAQ — disarm the real objections (honest, light) */}
        <Faq />

        {/* FIG 14 · Final CTA + SUPERNOVAE footer (kept intact) */}
        <FinalCTA />
      </main>

      {/* the wayfinding rail (W10b) · scroll-spy ticks + FIG readout + page
           progress — wide desktop only, discovered from the sections above */}

      {/* ─── the easter egg · « enter the galaxy » · lazy chunk, on trigger only.
           Esc / the close button unmounts it → frees the WebGL context. ─── */}
      {eggOpen && (
        <Suspense fallback={null}>
          <GalaxyEgg onClose={() => setEggOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
