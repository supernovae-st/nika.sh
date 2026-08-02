import { describe, expect, it } from 'vitest'
import { appLd, articleLd, codeLd, crumbLd, ldScript, termLd } from '../lib/ld'
import { SITE } from '../content'
import { PATHS } from '../../site.config'

/* ─── the machine layer · a room says WHAT it is ─────────────────────────────
   246 of the 715 served rooms carried only the site-wide Organization +
   WebSite on 2026-08-02: every model, every MCP server, every spec chapter,
   every teaching step, and the two families born that day. A crawler learned
   a page existed and nothing else.

   These laws hold the shapes. The rendered proof lives in the build (the
   e2e belt walks dist and the ld+json must parse); what CANNOT be checked
   there is the thing that rots silently: an @id pointing at a url the site
   no longer serves. That is checked here, on every builder. */

describe('the machine layer', () => {
  it('anchors every entity at a SERVED url', () => {
    const served = new Set(PATHS)
    const blocks = [
      termLd({
        path: '/catalog/models/gpt-4o',
        name: 'openai/gpt-4o',
        description: 'a model',
        setName: 'The Nika model catalog',
        setPath: '/catalog/models',
      }),
      appLd({ path: '/integrations/opencode', name: 'OpenCode', description: 'a client' }),
      articleLd({
        path: '/language/spec/verbs',
        name: 'Verbs',
        description: 'a chapter',
        partOfName: 'The spec',
        partOfPath: '/language/spec',
      }),
      codeLd({ path: '/workflows/path/01-hello', name: '01-hello.nika.yaml', description: 'a step' }),
    ]
    for (const b of blocks) {
      const id = (b as { '@id': string })['@id']
      expect(id.startsWith(SITE), `${id} is not on this site`).toBe(true)
      expect(served.has(id.slice(SITE.length)), `${id} is not a served route`).toBe(true)
    }
  })

  it('points a vocabulary term at the register that holds it', () => {
    const t = termLd({
      path: '/catalog/providers/ai21',
      name: 'AI21',
      description: 'a vendor',
      setName: 'The Nika provider catalog',
      setPath: '/catalog/providers',
    }) as { inDefinedTermSet: { url: string } }
    expect(new Set(PATHS).has(t.inDefinedTermSet.url.slice(SITE.length))).toBe(true)
  })

  it('walks the crumb to a served room at every step but the last', () => {
    const served = new Set(PATHS)
    const c = crumbLd([
      { name: 'The catalog', path: '/catalog' },
      { name: 'Models', path: '/catalog/models' },
      { name: 'openai/gpt-4o' },
    ]) as { itemListElement: { position: number; item?: string; name: string }[] }
    expect(c.itemListElement.map((x) => x.position)).toEqual([1, 2, 3])
    /* the room itself carries no item: a crumb that links to where you
       already stand is a loop a crawler follows */
    expect(c.itemListElement[2].item).toBeUndefined()
    for (const step of c.itemListElement.filter((x) => x.item)) {
      expect(served.has(step.item!.slice(SITE.length)), `${step.item} is not served`).toBe(true)
    }
  })

  it('hands unhead JSON it will not escape', () => {
    const s = ldScript([crumbLd([{ name: 'Home', path: '/' }])])
    expect(s.type).toBe('application/ld+json')
    /* processTemplateParams:false is what keeps the payload valid JSON —
       without it unhead HTML-escapes the quotes and every block on the site
       becomes &quot;-soup that no parser reads */
    expect(s.processTemplateParams).toBe(false)
    expect(() => JSON.parse(s.innerHTML)).not.toThrow()
  })
})
