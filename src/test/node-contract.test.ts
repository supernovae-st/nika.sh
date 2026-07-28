import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  NIKA_NODE_CLASSES,
  NIKA_NODE_STATUS,
  NIKA_NODE_ANATOMY,
  nikaNodeClass,
} from '../design-tokens.generated'
import pin from './canvas-contract.pin.json'
import { readdirSync, existsSync } from 'node:fs'

/* ── LA CARTE · un objet, trois surfaces ──────────────────────────────────────
   Le canvas VS Code, le site et le banc dessinent la même carte de nœud. Avant
   ce gate, chacun épelait sa chaîne de classes à la main, et deux des trois se
   trompaient de la MÊME façon : ils accrochaient l'état à la CARTE. Il pend au
   WRAPPER — `.dag-node.status-running` enveloppe `.nc`, qui n'en porte aucun.

   Le canvas vit dans un autre dépôt : le lire directement rendrait ce gate
   inerte en CI, là où il compte. Alors il est ÉPINGLÉ ici avec son SHA
   (design/pin-canvas-contract.mjs), et la CI juge l'épingle. Quand le canvas
   bouge, la dérive devient un diff daté au lieu d'un silence.

   Et on LIT sa fonction, on ne l'exécute pas : évaluer du code venu d'un autre
   dépôt pour prouver une égalité de chaînes, c'est payer bien trop cher une
   comparaison de mots. */

/* la source, SANS ses commentaires : un gate qui ne distingue pas le code de la
   prose ÉCRITE SUR le code finit par interdire d'expliquer ses propres
   trouvailles — celui-ci a flaggé le commentaire qui citait `.nc--running`
   comme l'erreur corrigée. */
const BENCH = readFileSync(join(__dirname, '../../design/bench.mjs'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
/* la page BÂTIE · c'est elle que l'œil voit, donc c'est elle qu'on juge */
const HTML = readFileSync(join(__dirname, '../../design/bench.html'), 'utf8')

/** les fragments de classe que `nodeClassOf()` écrit, DANS SON ORDRE. */
function canvasTokens(): string[] {
  const src = pin.nodeClassOf
  const out: string[] = []
  /* le socle est un template literal : `dag-node status-${…} verb-${…}` */
  const base = src.match(/`([^`]*)`/)
  expect(base, 'le socle template de nodeClassOf a disparu · le canvas a changé de forme').toBeTruthy()
  for (const part of (base as RegExpMatchArray)[1].split(/\s+/)) {
    out.push(part.replace(/\$\{[^}]*\}/g, ''))
  }
  /* puis les marques, une par ternaire, chacune un littéral entre quotes.
     Le délimiteur se ferme sur LUI-MÊME et pas sur n'importe quel guillemet :
     ` has-audit audit-${node.auditWorst ?? 'error'}` en contient un à
     l'intérieur, et une classe qui exclut les trois coupe au mauvais endroit.
     (Payé trois fois dans cet arc — esc/escAttr, un backtick en commentaire,
     celui-ci.) */
  for (const m of src.matchAll(/\?\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)\s*:/g)) {
    /* dépouiller AVANT de découper : `${node.auditWorst ?? 'error'}` porte des
       espaces, et couper d'abord en fait trois mots là où il n'y en a qu'un */
    const lit = (m[1] ?? m[2] ?? m[3] ?? '').replace(/\$\{[^}]*\}/g, '')
    for (const w of lit.trim().split(/\s+/).filter(Boolean)) out.push(w)
  }
  return out
}

describe('la carte du nœud · le contrat de classes', () => {
  it('chaque classe du contrat porte au moins une règle dans le canvas', () => {
    const naked = Object.entries(pin.styled).filter(([, n]) => n === 0).map(([c]) => c)
    expect(naked, `classes projetées sans aucune peau dans dag.css · canvas ${pin.sha}`).toEqual([])
    expect(Object.keys(pin.styled).length).toBeGreaterThanOrEqual(
      NIKA_NODE_STATUS.length + Object.keys(NIKA_NODE_CLASSES.mark).length,
    )
  })

  it('la projection écrit les mêmes mots, dans le même ordre, que le canvas', () => {
    const tok = canvasTokens()
    const c = NIKA_NODE_CLASSES
    /* le socle · wrapper puis les deux préfixes */
    expect(tok.slice(0, 3), 'le socle du canvas n’est plus wrapper + status- + verb-')
      .toEqual([c.wrapper, c.status_prefix, c.verb_prefix])
    /* les marques · même liste, même ORDRE, la sévérité collée à son marqueur */
    const projected = Object.entries(c.mark).flatMap(([, cls]) =>
      cls === c.mark.audit ? [cls, c.audit_prefix] : [cls])
    expect(tok.slice(3), 'les marques du canvas et celles de la spec ont divergé').toEqual(projected)
  })

  it('la fonction projetée compose une chaîne exacte, cas par cas', () => {
    const c = NIKA_NODE_CLASSES
    const verbs = Object.keys(NIKA_NODE_ANATOMY) as (keyof typeof NIKA_NODE_ANATOMY)[]
    const ALL = Object.keys(c.mark) as (keyof typeof c.mark)[]
    let n = 0
    for (const status of NIKA_NODE_STATUS) {
      for (const verb of verbs) {
        expect(nikaNodeClass({ status, verb }))
          .toBe(`${c.wrapper} ${c.status_prefix}${status} ${c.verb_prefix}${verb}`)
        n++
      }
    }
    /* toutes les marques ensemble · un nœud PEUT être success ET périmé ET
       en cache : trois faits, pas trois états concurrents */
    expect(nikaNodeClass({ status: 'success', verb: 'agent', marks: ALL, auditWorst: 'warning' }))
      .toBe([c.wrapper, `${c.status_prefix}success`, `${c.verb_prefix}agent`,
        c.mark.stale, c.mark.stale_up, c.mark.cached, c.mark.recovered,
        c.mark.audit, `${c.audit_prefix}warning`, c.mark.dead_gate, c.mark.asking].join(' '))
    expect(n).toBe(NIKA_NODE_STATUS.length * verbs.length)
  })

  it('le banc n’invente aucun mot du vocabulaire de la carte', () => {
    /* LA MOITIÉ INGAGNABLE. Le banc peut ne montrer qu'une PARTIE du canvas —
       mais tout ce qu'il montre doit porter le nom que le canvas lui donne.
       Sinon on documente une carte qui n'existe nulle part.

       ON JUGE LE HTML SERVI, PAS LA SOURCE. La première version lisait
       bench.mjs et cherchait un point : elle a laissé passer `class="nc-${name}"`,
       qui fabriquait `nc-why` 37 fois et `nc-band` 9 fois. Une classe assemblée
       n'a pas de point, donc elle était invisible pour exactement le défaut que
       ce gate existe pour attraper. */
    const known = new Set<string>(pin.families)
    /* UN PRÉFIXE N'EST PAS UNE CLASSE. `.nc-cat-${cat}` laisse `nc-cat-` dans la
       source : c'est une FAMILLE, vivante si le canvas en style un membre. Le
       même artefact de concaténation faussait l'audit du canvas — 6 de mes 15
       « classes mortes » étaient des fragments. Le scan du HTML SERVI, lui,
       reste strict : là, les classes sont assemblées et sans excuse. */
    const alive = (cls: string) => known.has(cls)
      || (cls.endsWith('-') && [...known].some((k) => k.startsWith(cls)))
    const written = [...new Set([...BENCH.matchAll(/\.(nc[a-z0-9-]*)/g)].map((m) => m[1]))]
      .filter((cls) => !alive(cls))
    const served = [...new Set(
      [...HTML.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter((c) => /^nc(-|$)/.test(c)),
    )]
    const invented = [...new Set([...written, ...served.filter((c) => !known.has(c))])].sort()
    expect(invented,
      `le banc emploie des classes absentes du canvas ${pin.sha} — chacune est une carte qui n’existe que sur le banc`)
      .toEqual([])
    /* et le HTML doit réellement en porter : un gate qui juge une page vide
       est vert par absence */
    expect(served.length, 'la page bâtie ne porte aucune classe de carte').toBeGreaterThan(10)
  })

  it('chaque carte servie porte son enveloppe, et l’enveloppe seule porte l’état', () => {
    const naked = [...HTML.matchAll(/<article class="(nc[^"]*)"/g)].map((m) => m[1])
    expect(naked, 'des cartes sans enveloppe · l’état n’aurait rien à quoi s’accrocher').toEqual([])
    const wrapped = [...HTML.matchAll(/<article class="([^"]*\bdag-node\b[^"]*)"/g)].map((m) => m[1])
    expect(wrapped.length, 'plus aucune carte enveloppée dans la page bâtie').toBeGreaterThan(20)
    for (const cls of wrapped) {
      expect(cls, `une enveloppe sans état · ${cls}`).toMatch(/\bstatus-[a-z]+/)
      expect(cls, `une enveloppe sans verbe · ${cls}`).toMatch(/\bverb-[a-z]+/)
    }
  })

  it('l’état pend au wrapper, jamais à la carte', () => {
    expect(nikaNodeClass({ status: 'running', verb: 'infer' }).split(' ')[0]).toBe(NIKA_NODE_CLASSES.wrapper)
    /* un modificateur d'état sur .nc serait une seconde grammaire pour la même
       idée — c'est exactement l'erreur que le banc avait faite */
    const onCard = [...BENCH.matchAll(/\.nc--[a-z-]+/g)].map((m) => m[0])
    expect(onCard, 'le banc accroche un état à la carte au lieu du wrapper').toEqual([])
  })
})

/* ── LA CARTE PROJETÉE · la géométrie que les trois surfaces reçoivent ────────
   node.generated.css ne porte AUCUNE couleur : chaque surface branche ses
   propres teintes. Ce qui se partage, c'est la forme. */
const NODE_CSS_PATH = join(__dirname, '../styles/node.generated.css')
const NODE_CSS = readFileSync(NODE_CSS_PATH, 'utf8')

/** les déclarations d'une règle, la couleur retirée */
function geometryOf(body: string): string[] {
  const COLOUR = /^(background|background-color|color|box-shadow|opacity)$/
  return body.split(';').map((d) => d.trim()).filter(Boolean)
    .filter((d) => !COLOUR.test(d.split(':')[0].trim()))
    /* une valeur `none` ou `currentColor` ne dessine rien de distinctif */
    .filter((d) => !/:\s*(none|currentColor|transparent)\s*$/.test(d))
    .sort()
}

describe('la carte projetée · une géométrie, trois surfaces', () => {
  it('le fichier est PROJETÉ, jamais écrit ici', () => {
    expect(NODE_CSS.slice(0, 200)).toContain('AUTO-GENERATED by nika-spec design-projector')
  })

  it('elle ne porte aucune couleur · chaque surface branche la sienne', () => {
    /* un hex ou un rgb() en dur ici, et la carte cesserait de pouvoir porter
       la plaque bleue du site ET la carte plate de l'éditeur */
    const hex = NODE_CSS.match(/#[0-9a-f]{3,8}\b/gi) ?? []
    const rgb = NODE_CSS.match(/\brgba?\(/g) ?? []
    expect([...hex, ...rgb], 'une couleur en dur dans la géométrie partagée').toEqual([])
  })

  it('les sept états se distinguent PAR LA SEULE GÉOMÉTRIE', () => {
    /* LA LEÇON, EN TEST. Le premier jet dessinait les anneaux avec un
       box-shadow interne — et forced-colors SUPPRIME box-shadow : running,
       retrying et success s'effondraient en trois disques identiques,
       exactement dans la condition où le second signal doit servir. */
    const shapes = new Map<string, string>()
    /* LA FORME VIT DANS LA RÈGLE DE GÉOMÉTRIE, pas dans celle de couleur. Les
       deux moitiés ont des sélecteurs opposés depuis nika-spec#227 — la
       géométrie à (0,2,0) pour battre la base `.nc-dot`, la couleur à (0,0,0)
       pour toujours perdre contre l'hôte. Un gate qui lisait encore la règle
       unique d'avant aurait rapporté sept états sans forme. */
    for (const m of NODE_CSS.matchAll(/\.dag-node\.status-([a-z]+) :where\(\.nc-dot\) \{([^}]*)\}/g)) {
      shapes.set(m[1], geometryOf(m[2]).join(' · '))
    }
    expect(shapes.size, 'des statuts sans forme projetée').toBe(NIKA_NODE_STATUS.length)
    const seen = new Map<string, string>()
    for (const [st, geo] of shapes) {
      expect(geo, `${st} n’a aucune géométrie · il ne serait qu’une teinte`).not.toBe('')
      const twin = seen.get(geo)
      expect(twin, `${st} et ${twin} dessinent la même forme · l’un des deux est muet`).toBeUndefined()
      seen.set(geo, st)
    }
  })

  it('le site le CONSOMME · un composant applique vraiment la carte', () => {
    /* la clause qu’on oublie toujours : un fichier importé que rien
       n’applique, c’est zéro surface (la leçon du gate du sol) */
    const walk = (dir: string): string[] => existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name))
          : /\.tsx?$/.test(e.name) ? [readFileSync(join(dir, e.name), 'utf8')] : [])
      : []
    const src = walk(join(__dirname, '../components')).concat(walk(join(__dirname, '../pages')))
    const importers = src.filter((t) => t.includes('node.generated.css')).length
    const appliers = src.filter((t) => /className="nc"|nikaNodeClass\(/.test(t)).length
    expect(importers, 'personne n’importe la carte projetée').toBeGreaterThan(0)
    expect(appliers, 'la carte est importée mais aucun composant ne la pose').toBeGreaterThan(0)
  })

  it('le site n’invente aucun mot de la carte non plus', () => {
    const known = new Set<string>(pin.families)
    const walk = (dir: string): string[] => existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name))
          : /\.(tsx?|css)$/.test(e.name) && !e.name.endsWith('.generated.css')
            ? [readFileSync(join(dir, e.name), 'utf8')] : [])
      : []
    const used = new Set<string>()
    for (const t of walk(join(__dirname, '../components')).concat(walk(join(__dirname, '../pages')))) {
      for (const m of t.matchAll(/\bnc-[a-z0-9-]+/g)) used.add(m[0])
      for (const m of t.matchAll(/className="(nc)"/g)) used.add(m[1])
    }
    expect([...used].filter((c) => !known.has(c)).sort(),
      `le site emploie des classes de carte absentes du canvas ${pin.sha}`).toEqual([])
  })
})

/* ── LA MATRICE DE SYNCHRONISATION · la page qui juge doit être jugée ─────────
   Une matrice qui se dégrade en silence est pire que pas de matrice : elle
   affiche « tout va bien » avec les mêmes pixels qu'une mesure réelle. Ces
   quatre clauses la tiennent honnête. */
describe('la matrice de synchronisation · mesurée, pas déclarée', () => {
  const HTML_M = readFileSync(join(__dirname, '../../design/bench.html'), 'utf8')
  const cells = [...HTML_M.matchAll(/class="mx-c mx-(\w+)"/g)].map((m) => m[1])

  it('l’épingle porte ce que le canvas REÇOIT, pas seulement ce qu’il style', () => {
    expect(pin.receives, 'l’épingle ne mesure plus la livraison · la colonne canvas serait inventée')
      .toBeTruthy()
    expect(Object.keys(pin.symbols ?? {}).length,
      'aucun symbole projeté relevé chez le canvas').toBeGreaterThan(5)
  })

  it('elle porte réellement des cases, et de plusieurs états', () => {
    expect(cells.length, 'la matrice est vide · elle passerait pour verte').toBeGreaterThan(40)
    expect(new Set(cells).size, 'un seul état partout · l’instrument est cassé, pas la synchro')
      .toBeGreaterThan(2)
  })

  it('elle ne cache pas les trous · le compte des manques suit l’épingle', () => {
    const gaps = cells.filter((c) => c === 'gap').length
    /* l'épingle est un JSON figé : TypeScript en infère les clés littérales,
       donc on l'indexe par une vue élargie plutôt qu'en forçant chaque nom */
    const receives = pin.receives as Record<string, { state: string } | undefined>
    const missing = ['ground.generated.css', 'node.generated.css']
      .filter((f) => receives[f]?.state !== 'reçoit').length
    /* chaque fichier jamais livré vaut une case rouge, et il y a en plus les
       symboles absents du module du canvas — donc au moins autant */
    expect(gaps, 'la matrice affiche moins de trous que l’épingle n’en constate')
      .toBeGreaterThanOrEqual(missing)
  })

  it('le verdict cite le SHA de l’épingle · une mesure sans date ne vaut rien', () => {
    expect(HTML_M).toContain(pin.sha)
  })
})
