/* ─── codefile-tips · the smart-hover resolver (wave O · pure, no DOM) ────────
   Maps a hovered syntax span (its token class + raw text) to the plain-words
   glossary line the tooltip speaks. One vocabulary source (plain-words.ts —
   shared with the 3D slab tips and the mini-DAG caption), so no surface can
   ever explain the same key differently.

   Curated on purpose: keys/verbs/${{ refs }} only — strings, paths, numbers
   and schema plumbing return null (a tooltip on every token is noise). */

import {
  KEY_WORDS,
  TREF_WORDS,
  VERB_WORDS,
} from '../sections/morph/plain-words'
import { NIKA_VERBS, type NikaVerb } from './codefile-highlight'

export interface CodeTip {
  /** the term the tip names (the key · the verb · `${{ … }}`) */
  term: string
  /** the anyone-register explanation */
  words: string
  /** the verb, when the term is one (the tip tints its term in the verb hue) */
  verb?: NikaVerb
}

/**
 * Resolve the tip for a hovered token span.
 * `kind` is the span's token class surface: 'key' | 'verb' | 'tref'
 * (anything else is not a tip target). `text` is the span's raw text —
 * a verb span's text may carry its leading glyph; a tref its full `${{ … }}`.
 */
export function tipFor(kind: string, text: string): CodeTip | null {
  if (kind === 'tref') {
    // anchors/aliases (&x · *x) share the class but not the wiring story
    if (!text.includes('${{')) return null
    return { term: '${{ … }}', words: TREF_WORDS }
  }
  if (kind === 'verb') {
    const verb = text.replace(/[^a-z_]/g, '') // strip the glyph + spaces
    if (!(NIKA_VERBS as readonly string[]).includes(verb)) return null
    return { term: verb, words: VERB_WORDS[verb as NikaVerb], verb: verb as NikaVerb }
  }
  if (kind === 'key') {
    const key = text.trim()
    const words = KEY_WORDS[key]
    return words ? { term: key, words } : null
  }
  return null
}
