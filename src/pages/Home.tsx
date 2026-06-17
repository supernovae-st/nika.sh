import { Suspense, lazy, useEffect, useState } from 'react'
import { useHead } from '@unhead/react'
import Hero from '../sections/Hero'
import LivingFile from '../sections/living/LivingFile'
import Verbs from '../sections/Verbs'
import BeyondChat from '../sections/BeyondChat'
import OwnWorkflows from '../sections/OwnWorkflows'
import Toolbelt from '../sections/Toolbelt'
import UseCasesV4 from '../sections/UseCasesV4'
import ChangelogPreview from '../sections/ChangelogPreview'
import Proof from '../sections/Proof'
import FinalCTA from '../sections/FinalCTA'

/* ─── / · the v4 trust landing ───────────────────────────────────────────────
   Renders PURELY the v4 sections (design doc §6), in order:
     Hero → LivingFile → Verbs → BeyondChat → OwnWorkflows → Toolbelt →
     UseCasesV4 → ChangelogPreview → Proof → FinalCTA (→ footer in FinalCTA).
   Zero WebGL on first load — the hero is prerendered DOM, instant + crawlable.

   The whole v3 cinematic (the butterfly→supernova intro film + the Galaxy3D
   r3f canvas + the old below-the-fold sections) was removed from the default
   render and now lives behind the « enter the galaxy » easter egg (design doc
   §10): typing « nika » lazy-loads <GalaxyEgg/> as a fullscreen overlay. Their
   component files (`src/scene/*`, ScrollStory, MethodDiagram, Transform, the v3
   Hero/UseCases/etc.) are kept in the repo, just unmounted here. */

/* lazy chunk · the entire three.js scene + intro film loads ONLY on the egg
   trigger, so it never enters the default home bundle (design doc §8). */
const GalaxyEgg = lazy(() => import('../scene/GalaxyEgg'))

export function Component() {
  const [eggOpen, setEggOpen] = useState(false)

  /* per-route <head> · prerendered into dist/index.html by @unhead/react */
  useHead({
    title: 'Nika · Intent as Code',
    meta: [
      {
        name: 'description',
        content:
          'Open language for AI workflows. Write what you want in one file: Nika fetches, thinks, runs commands and saves the result. Four verbs, one Rust binary, any model, no cloud. Free and AGPL forever.',
      },
      { property: 'og:title', content: 'Nika · Intent as Code' },
      {
        property: 'og:description',
        content: 'Open language for AI workflows. One file, four verbs, one binary.',
      },
      { name: 'twitter:title', content: 'Nika · Intent as Code' },
      {
        name: 'twitter:description',
        content: 'Open language for AI workflows. One file, four verbs, one binary.',
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
      <main className="relative">
        {/* FIG 0.0 · the hero — DOM-first · instant · the calm first screen */}
        <Hero />

        {/* FIG 1.0 · « The Living File » — the file becomes a running DAG with
             real CLI/NDJSON logs and a concrete result (THE wow, dosed) */}
        <LivingFile />

        {/* FIG 2.0–4.0 · clarity → the acid moment → sovereignty */}
        <Verbs />
        <BeyondChat />
        <OwnWorkflows />

        {/* FIG 5.0 · Toolbelt — the capability ledger (counts from CANON) */}
        <Toolbelt />

        {/* FIG 6.0 · Use cases — the editorial gallery (real spec workflows) */}
        <UseCasesV4 />

        {/* FIG 7.0 · Changelog — the ship log (latest milestones) */}
        <ChangelogPreview />

        {/* FIG 8.0 · Proof — authority by the numbers + sovereignty guarantees */}
        <Proof />

        {/* FIG 9.0 · Final CTA + SUPERNOVAE footer (kept intact) */}
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
