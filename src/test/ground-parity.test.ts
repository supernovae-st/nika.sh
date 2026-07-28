import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/* ── le sol · une source, deux surfaces, zéro copie ───────────────────────────
   Le site charge src/styles/ground.css ; le banc inline le même bloc dans sa
   page hors-ligne. Deux fichiers qui se ressemblent ne sont pas le même sol :
   ce sont deux sols qui divergeront le jour où quelqu'un touche l'un et pas
   l'autre — la dette exacte que cet arc passe son temps à payer.

   Ce gate refuse la ressemblance et exige l'identité. */

const ROOT = join(__dirname, '../..')

describe('le sol · une source, deux émissions', () => {
  const css = readFileSync(join(ROOT, 'src/styles/ground.css'), 'utf8')
  const bench = readFileSync(join(ROOT, 'design/bench.html'), 'utf8')

  it('le CSS du site est exactement ce que le générateur émet', () => {
    execFileSync('node', [join(ROOT, 'design/build-ground.mjs')], { stdio: 'pipe' })
    expect(readFileSync(join(ROOT, 'src/styles/ground.css'), 'utf8')).toBe(css)
  })

  it('le banc inline ce même bloc, à l’octet près', () => {
    expect(
      bench.includes(css.trim()),
      'le banc et le site ne partagent plus le même sol — relancer node design/bench.mjs',
    ).toBe(true)
  })

  /* les quantités viennent du SSOT, jamais du CSS : si quelqu'un retape une
     valeur dans la feuille au lieu de la bouger dans la spec, le rendu et la
     source cessent de dire la même chose sans que rien ne casse */
  it('chaque quantité du sol vient de la projection', () => {
    const tokens = readFileSync(join(ROOT, 'src/design-tokens.generated.ts'), 'utf8')
    const lit = tokens.match(/export const NIKA_MATERIAL = (\{.*\}) as const/)?.[1]
    expect(lit, 'NIKA_MATERIAL a disparu de la projection').toBeTruthy()
    const mat = JSON.parse(
      (lit as string).replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":').replace(/'/g, '"'),
    )
    const g = mat.ground
    expect(css, 'la maille de la trame n’est pas celle du SSOT')
      .toContain(`background-size: ${g.grid.cell_px}px ${g.grid.cell_px}px`)
    expect(css, 'le rayon du spot n’est pas celui du SSOT')
      .toContain(`${g.spot.radius_px}px circle`)
    expect(css, 'la teinte du spot n’est pas celle du SSOT')
      .toContain(`rgb(${g.spot.hue} / ${g.spot.alpha})`)
  })

  /* la trame est de la PROFONDEUR, pas de l'information · en contraste forcé
     elle doit sortir plutôt que manger le contraste du contenu */
  it('la trame et la vignette sortent en contraste forcé', () => {
    const forced = css.slice(css.indexOf('forced-colors'))
    expect(forced).toContain('background-image: none')
    expect(forced).toContain('display: none')
  })
})
