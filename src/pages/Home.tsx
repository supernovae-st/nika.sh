import { Suspense, lazy, useEffect, useState } from 'react'
import { useHead } from '@unhead/react'
import { routeHead, REPO, SITE } from '../content'
import Hero from '../sections/Hero'
import LivingFile from '../sections/living/LivingFile'
import Verbs from '../sections/Verbs'
import BeyondChat from '../sections/BeyondChat'
import Permits from '../sections/Permits'
import WhereItFits from '../sections/WhereItFits'
import HumanInTheLoop from '../sections/HumanInTheLoop'
import OwnWorkflows from '../sections/OwnWorkflows'
import Toolbelt from '../sections/Toolbelt'
import UseCasesV4 from '../sections/UseCasesV4'
import GetStarted from '../sections/GetStarted'
import ChangelogPreview from '../sections/ChangelogPreview'
import Proof from '../sections/Proof'
import Faq from '../sections/Faq'
import { FAQ_ITEMS } from '../sections/faq-data'
import FinalCTA from '../sections/FinalCTA'

/* ─── / · the v4 trust landing ───────────────────────────────────────────────
   Renders PURELY the v4 sections (design doc §6), in order:
     Hero → LivingFile → Verbs → BeyondChat → OwnWorkflows → Toolbelt →
     UseCasesV4 → ChangelogPreview → Proof → FinalCTA (→ footer in FinalCTA).
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

/* the full-bleed depth tunnel · FIXED full-screen behind the WHOLE page (z-0) ·
   the camera dives as you scroll, then it fades out so the opaque sections take
   over. Lazy + client-only (the prerendered DOM paints first). */
const DepthTunnel = lazy(() => import('../scene/DepthTunnel'))

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
        'The control layer for AI agents. Nika makes an agent write its plan as a readable file first — every step, tool and permission. You review it, the runtime enforces it, then it runs: traced and replayable. One Rust binary, any model, AGPL forever.',
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
          'The control layer for AI agents. Nika makes an agent write its plan as a readable file first — every step, tool and permission. You review it, the runtime enforces it, then it runs: traced and replayable. One Rust binary, any model, AGPL forever.',
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
      {/* the full-bleed depth tunnel · fixed behind the whole page (z-0). The
          transparent hero reveals it; the opaque sections below cover it as you
          scroll past. The camera dives with the page scroll (DepthTunnel.tsx). */}
      <Suspense fallback={null}>
        <DepthTunnel />
      </Suspense>
      <main className="relative z-[1]">
        {/* FIG 0.0 · the hero — DOM-first · instant · the calm first screen */}
        <Hero />

        {/* FIG 1.0 · « The Living File » — the file becomes a running DAG with
             real CLI/NDJSON logs and a concrete result (THE wow, dosed) */}
        <LivingFile />

        {/* FIG 2.0 · clarity — what an agent can do, declared not hidden */}
        <Verbs />

        {/* FIG 3.0 · the acid moment — beyond the black box (file vs chat/API) */}
        <BeyondChat />

        {/* FIG 3.5 · the seatbelt — what it's ALLOWED to do (permits:) */}
        <Permits />

        {/* FIG 3.6 · where Nika fits — the orthogonal layer underneath (light) */}
        <WhereItFits />

        {/* FIG 4.0 · be the human in the loop — the interactive permits demo:
             review the plan, toggle what it can touch, watch the runtime obey
             (a real NIKA-SEC-004 denial when a load-bearing permit is removed) */}
        <HumanInTheLoop />

        {/* FIG 5.0 · sovereignty — the procedure is yours (theme-light) */}
        <OwnWorkflows />

        {/* FIG 6.0 · Toolbelt — what an agent can be permitted to use (CANON) */}
        <Toolbelt />

        {/* FIG 7.0 · Use cases — the editorial gallery (real spec workflows) */}
        <UseCasesV4 />

        {/* FIG 7.5 · Get started — install · write a file · run it (the on-ramp) */}
        <GetStarted />

        {/* FIG 8.0 · Changelog — the ship log (latest milestones) */}
        <ChangelogPreview />

        {/* FIG 9.0 · Proof — the control guarantees + CANON counts */}
        <Proof />

        {/* FIG 9.5 · FAQ — disarm the real objections (honest, light) */}
        <Faq />

        {/* FIG 10.0 · Final CTA + SUPERNOVAE footer (kept intact) */}
        <FinalCTA />
      </main>

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
