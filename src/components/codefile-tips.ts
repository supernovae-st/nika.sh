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
import { WORD_OPENER } from '../content/word-openers.generated'

export interface CodeTip {
  /** the term the tip names (the key · the verb · `${{ … }}`) */
  term: string
  /** the anyone-register explanation */
  words: string
  /** the verb, when the term is one (the tip tints its term in the verb hue) */
  verb?: NikaVerb
}

/* ── where each concept is SPECIFIED on this site (wave P) ────────────────────
   A tip card links to the /spec block that owns its term — a real anchor on
   the prerendered /spec page, never a guessed deep URL into the external repo.

   ONE ENTRY LEFT, AND THAT IS THE POINT. This map held 28 hand-kept anchors.
   Then the contract gave every declared word a teaching sentence, so every one
   of them earned a room, and `tipHref` reaches for the room FIRST — which
   quietly made 27 of these unreachable. Dead code that still looks alive is
   worse than none, so they are gone, and the gate in the sibling test
   re-derives reachability rather than trusting this comment.

   What survives is the concept that is a BLOCK rather than a word: `${{ … }}`
   is grammar the schema never declares as a key, so no room can own it. */
const SPEC_AT: Record<string, string> = {
  '${{ … }}': '/spec#s0',
}

/** the spec anchor for a tip term — null when the term has no owned block */
/* EVERY DECLARED WORD OWNS A ROOM, and the room is the better door: it
   carries the word's full opener, its chapters, the verbs that accept it and
   the skeletons that use it. */
export function tipHref(term: string): string | null {
  if (WORD_OPENER[term] || KEY_WORDS[term] || (NIKA_VERBS as readonly string[]).includes(term)) {
    return `/language/${term}`
  }
  return SPEC_AT[term] ?? null
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
    /* the curated line FIRST — it is written in the anyone register, where
       the contract's opener is written in the spec register. The opener is
       the fallback that takes coverage from 21 words to 40. */
    const words = KEY_WORDS[key] ?? WORD_OPENER[key]
    return words ? { term: key, words } : null
  }
  return null
}
