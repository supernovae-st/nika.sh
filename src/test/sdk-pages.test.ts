import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { PATHS, SDK_GUIDE_PATHS, SDK_SECTION_PATHS } from '../../site.config'
import { SDK_GUIDE_NAV, SDK_SECTIONS } from '../content/sdk-nav'
import { SDK_GUIDES, SDK_GUIDE_INDEX } from '../content/sdk'

describe('SDK documentation · one registry, honest horizons', () => {
  it('the route manifest, hub cards and guide bodies share one id set', () => {
    expect(SDK_GUIDE_PATHS).toEqual(SDK_GUIDE_NAV.map((guide) => `/sdk/${guide.id}`))
    expect(SDK_SECTION_PATHS).toEqual(SDK_SECTIONS.map((section) => `/sdk/${section.id}`))
    expect(SDK_GUIDES.map((guide) => guide.id)).toEqual(SDK_GUIDE_NAV.map((guide) => guide.id))
    expect(new Set(SDK_GUIDE_PATHS).size).toBe(SDK_GUIDE_PATHS.length)
    expect(SDK_GUIDE_NAV.length).toBeGreaterThanOrEqual(30)
    expect(PATHS).toEqual(expect.arrayContaining([...SDK_SECTION_PATHS, ...SDK_GUIDE_PATHS]))
  })

  it('the remote client never presents as a shipped server', () => {
    const remote = SDK_GUIDE_INDEX['remote/client']
    expect(remote.status).toBe('preview')
    expect(`${remote.description} ${remote.promise}`).toMatch(/not shipped/i)
    expect(remote.sections.map((section) => section.body).join(' ')).toMatch(/current nika serve/i)
  })

  it('the local driver is the live first path', () => {
    expect(SDK_GUIDE_INDEX['start/quickstart'].status).toBe('live')
    expect(SDK_GUIDE_INDEX['local/client'].status).toBe('live')
    expect(SDK_GUIDE_INDEX['start/quickstart'].sections.map((section) => section.code ?? '').join('\n'))
      .toContain("@supernovae-st/nika-client/local")
  })

  it('treats the project file and resident firer as live first-class surfaces', () => {
    const project = SDK_GUIDE_INDEX['project/nika-yaml']
    expect(project.status).toBe('live')
    expect(project.sections.map((section) => section.code ?? '').join('\n'))
      .toContain('arm:')
    for (const section of project.sections) {
      if (!section.code || section.language !== 'yaml') continue
      expect(section.code.includes('arm:') && section.code.includes('traces:')).toBe(false)
      expect(section.code.includes('arm:') && section.code.includes('registry:')).toBe(false)
    }
    expect(SDK_GUIDE_INDEX['project/cwd-and-monorepos'].facts).toContainEqual({
      label: 'direct traces',
      value: 'cwd/.nika/traces',
    })
    expect(SDK_GUIDE_INDEX['operations/resident-server'].status).toBe('live')
    expect(SDK_GUIDE_INDEX['operations/server-runbook'].status).toBe('live')
    expect(SDK_GUIDE_INDEX['operations/server-surfaces'].status).toBe('mixed')
  })

  it('keeps every nika.yaml panel inside the released closed grammar', () => {
    const projectKeys = new Set(['nika', 'ceiling', 'arm', 'traces', 'registry'])
    const armKeys = new Set([
      'workflow', 'cadence', 'où', 'plafond', 'manqué', 'chevauchement',
      'après_saut', 'actif', 'raison', 'jusqu_au', 'tolérance', 'décalage', 'par',
    ])
    const samples = SDK_GUIDES.flatMap((guide) =>
      guide.sections.filter((section) => section.language === 'yaml' && section.filename === 'nika.yaml'),
    )

    expect(samples.length).toBeGreaterThanOrEqual(4)
    for (const sample of samples) {
      const project = parse(sample.code ?? '') as Record<string, unknown>
      expect(project.nika, sample.title).toBe('v1')
      expect(Object.keys(project).filter((key) => !projectKeys.has(key)), sample.title).toEqual([])
      expect('arm' in project && ('traces' in project || 'registry' in project), sample.title).toBe(false)

      if (project.arm !== undefined) {
        expect(Array.isArray(project.arm), sample.title).toBe(true)
        for (const value of project.arm as unknown[]) {
          const beat = value as Record<string, unknown>
          expect(Object.keys(beat).filter((key) => !armKeys.has(key)), sample.title).toEqual([])
          for (const required of ['workflow', 'cadence', 'plafond', 'manqué']) {
            expect(Object.hasOwn(beat, required), `${sample.title}: ${required}`).toBe(true)
          }
        }
      }

      if (project.traces !== undefined) {
        expect(Object.keys(project.traces as Record<string, unknown>), sample.title).toEqual(['keep'])
      }
      if (project.registry !== undefined) {
        expect(Object.keys(project.registry as Record<string, unknown>), sample.title).toEqual(['floor'])
      }
    }
  })

  it('every guide links into its section and the deep manual', () => {
    for (const section of SDK_SECTIONS) {
      expect(section.guides.length).toBeGreaterThan(1)
      for (const guide of section.guides) {
        expect(guide.id).toBe(`${section.id}/${guide.slug}`)
        expect(guide.docsPath).toBe(`https://docs.nika.sh/sdk/${guide.id}`)
        expect(SDK_GUIDE_INDEX[guide.id].related.length).toBeGreaterThanOrEqual(4)
      }
    }
  })

  it('keeps the full tutorial cargo out of the initial browser graph', () => {
    const page = readFileSync(join(__dirname, '../pages/Sdk.tsx'), 'utf8')
    const room = readFileSync(join(__dirname, '../components/SdkGuidePageBody.tsx'), 'utf8')
    const access = readFileSync(join(__dirname, '../lib/sdk-access.ts'), 'utf8')
    expect(page).not.toContain("from '../content/sdk'")
    expect(room).toContain("import type { SdkGuide } from '../content/sdk'")
    expect(access).toContain("await import('../content/sdk')")
    expect(access).toContain("import('../content/sdk')")
  })

  it('the public SDK copy keeps the site voice', () => {
    for (const guide of SDK_GUIDES) {
      const text = [
        guide.label,
        guide.eyebrow,
        guide.title,
        guide.description,
        guide.promise,
        ...guide.sections.flatMap((section) => [section.title, section.body, section.note ?? '']),
      ].join(' ')
      expect(text).not.toContain('—')
      expect(text).not.toMatch(/\b(seamless|powerful|robust|blazingly|cutting-edge)\b/i)
    }
  })
})
