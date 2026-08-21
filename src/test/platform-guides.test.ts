import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ENGINE_VERSION } from '../content'
import { ARM64_RELEASE_ASSETS, PLATFORM_GUIDES } from '../content/platform-guides'
import { INSTALL_GUIDE_PATHS } from '../../site.config'

interface ReleaseCatalog {
  releases: { tag: string; assets: { name: string }[] }[]
}

describe('platform guides', () => {
  it('keeps one unique route per authored guide', () => {
    expect(new Set(INSTALL_GUIDE_PATHS).size).toBe(INSTALL_GUIDE_PATHS.length)
    expect(INSTALL_GUIDE_PATHS).toEqual(PLATFORM_GUIDES.map((guide) => `/install/${guide.id}`))
  })

  it('prints only ARM64 assets present in the current release record', () => {
    const catalog = JSON.parse(
      readFileSync(join(__dirname, '../../public/releases/catalog.json'), 'utf8'),
    ) as ReleaseCatalog
    const release = catalog.releases.find((entry) => entry.tag === ENGINE_VERSION)
    expect(release, `${ENGINE_VERSION} must exist in the release record`).toBeDefined()
    const names = new Set(release?.assets.map((asset) => asset.name))
    for (const asset of ARM64_RELEASE_ASSETS) expect(names.has(asset), asset).toBe(true)
  })
})
