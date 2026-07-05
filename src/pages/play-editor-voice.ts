import {
  Decoration,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view'
import { HighlightStyle } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

/* ─── /play · the editor's yaml voice (loop T6 · one-voice law) ──────────────
   The live editor must speak the SAME dialect as the static CodeFile
   (components/codefile.css): the exact --cf-* token hues, the 4 verb keys in
   their canonical colours, ${{ refs }} in teal live-wiring. Two layers:

   1. cfHighlight — a HighlightStyle over the lezer-yaml tags. lezer tags every
      plain scalar as `content` (no number/bool distinction), which matches the
      CodeFile tokenizer's own rule: bare scalars read as strings (sage).
   2. nikaMarks — one MatchDecorator for the three signatures the grammar can't
      see: verb KEYS, ${{ refs }}, and bare number/bool values. Same rules as
      the CodeFile tokenizer (verbs only in key position; bools cover the YAML
      1.1 forms). PlayEditor's theme colours the mark classes — editor-scoped
      selectors, so the marks win over single-class highlight spans. */

export const CF_BG = '#0d0e12'
export const CF_LINE = 'rgb(255 255 255 / 0.07)'
export const CF_GUTTER_INK = '#555b67'
export const CF_REF = '#5fd3d1' /* the teal live-wiring accent (= --cf-ref) */
export const CF_KEY = '#e7eaf0'
export const CF_STR = '#9bd29a'
export const CF_NUM = '#e6b873'
export const CF_BOOL = '#c79bf2'
export const CF_COMMENT = '#757c8a'
export const CF_PUNCT = '#78808e'
export const CF_PLAIN = '#aab0bb'

/* the token voice · mirrors src/styles/tokens.css --cf-* (keys brightest ink,
   strings sage, structure receding). lezer-yaml maps: Key/* → definition(
   propertyName) · QuotedLiteral → string · Literal/BlockLiteralContent →
   content · Anchor/Alias → labelName · Tag → typeName · ":-," → separator. */
export const cfHighlight = HighlightStyle.define([
  { tag: t.definition(t.propertyName), color: CF_KEY, fontWeight: '500' },
  { tag: [t.string, t.content], color: CF_STR },
  { tag: t.special(t.string), color: CF_PUNCT } /* block headers · | and > */,
  { tag: t.number, color: CF_NUM },
  { tag: [t.bool, t.null], color: CF_BOOL, fontWeight: '500' },
  { tag: [t.labelName, t.typeName], color: CF_REF } /* &anchors · *aliases · !!tags */,
  { tag: [t.comment, t.lineComment], color: CF_COMMENT },
  { tag: [t.separator, t.punctuation, t.brace, t.squareBracket, t.meta], color: CF_PUNCT },
  { tag: t.keyword, color: CF_BOOL } /* %YAML directive names */,
])

/* the three grammar-blind signatures, one line-scan:
   group 2 → a verb KEY (indent · optional "- " · verb · lookahead ":")
   group 3 → a ${{ … }} ref (anywhere, incl. inside quoted strings)
   group 5 → a bare number/bool/null VALUE ("key: 3" · "- true"), nothing else
             before line end but an optional trailing comment */
export const NIKA_MARK_RE =
  /^(\s*(?:-\s+)?)(agent|exec|infer|invoke)(?=:)|(\$\{\{[^}]*\}\})|(:\s+|^\s*-\s+)(-?\d+(?:\.\d+)?|true|false|null|~|yes|no|on|off)(?=\s*(?:#.*)?$)/g

const verbMark: Record<string, Decoration> = Object.fromEntries(
  ['agent', 'exec', 'infer', 'invoke'].map((v) => [
    v,
    Decoration.mark({ class: `cm-nika-verb cm-nika-verb--${v}` }),
  ]),
)
const refMark = Decoration.mark({ class: 'cm-nika-ref' })
const numMark = Decoration.mark({ class: 'cm-nika-num' })
const boolMark = Decoration.mark({ class: 'cm-nika-bool' })

const nikaMatcher = new MatchDecorator({
  regexp: NIKA_MARK_RE,
  decorate(add, from, _to, m) {
    if (m[2]) {
      const s = from + m[1].length
      add(s, s + m[2].length, verbMark[m[2]])
    } else if (m[3]) {
      add(from, from + m[0].length, refMark)
    } else if (m[5]) {
      const s = from + m[4].length
      add(s, s + m[5].length, /^[-\d]/.test(m[5]) ? numMark : boolMark)
    }
  },
})

export const nikaMarks = ViewPlugin.fromClass(
  class {
    deco: DecorationSet
    constructor(view: EditorView) {
      this.deco = nikaMatcher.createDeco(view)
    }
    update(u: ViewUpdate) {
      this.deco = nikaMatcher.updateDeco(u, this.deco)
    }
  },
  { decorations: (v) => v.deco },
)
