import { describe, expect, it, vi } from 'vitest'
import type { Manifest } from '@core/manifest/manifest'
import type { TemplateFile } from '@core/template/template-file'
import type { TemplateFileMatcher } from '../../adapters/template-file-matcher/template-file-matcher'
import { ManifestFileFilter } from './manifest-file-filter'

describe('ManifestFileFilter', () => {
  const files: TemplateFile[] = [
    {
      absolutePath: '/templates/base/knitto.json',
      relativePath: 'knitto.json',
    },
    {
      absolutePath: '/templates/base/src/index.ts',
      relativePath: 'src/index.ts',
    },
    {
      absolutePath: '/templates/base/package.json',
      relativePath: 'package.json',
    },
  ]

  it('keeps files unchanged when manifest is null except knitto.json', () => {
    const { matcher, matchMock } = createMatcher(new Set())
    const filter = new ManifestFileFilter(matcher)

    expect(filter.filter(files, null)).toEqual([
      {
        absolutePath: '/templates/base/src/index.ts',
        relativePath: 'src/index.ts',
      },
      {
        absolutePath: '/templates/base/package.json',
        relativePath: 'package.json',
      },
    ])
    expect(matchMock).toHaveBeenCalledTimes(0)
  })

  it('delegates manifest file rules to the matcher after excluding knitto.json', () => {
    const { matcher, matchMock } = createMatcher(new Set(['src/index.ts']))
    const filter = new ManifestFileFilter(matcher)
    const manifest: Manifest = {
      schemaVersion: 1,
      type: 'kit',
      slug: 'base',
      name: 'Base',
      description: 'Base template.',
      supports: [],
      requires: [],
      conflictsWith: [],
      files: {
        include: ['src/**', 'knitto.json'],
        exclude: ['src/**/*.test.ts'],
      },
      operations: [],
    }

    expect(filter.filter(files, manifest)).toEqual([
      {
        absolutePath: '/templates/base/src/index.ts',
        relativePath: 'src/index.ts',
      },
    ])
    expect(matchMock).toHaveBeenCalledWith({
      files: [
        {
          absolutePath: '/templates/base/src/index.ts',
          relativePath: 'src/index.ts',
        },
        {
          absolutePath: '/templates/base/package.json',
          relativePath: 'package.json',
        },
      ],
      include: ['src/**', 'knitto.json'],
      exclude: ['src/**/*.test.ts'],
    })
  })
})

function createMatcher(result: Set<string>): {
  matcher: TemplateFileMatcher
  matchMock: ReturnType<typeof vi.fn>
} {
  const matchMock = vi.fn().mockReturnValue(result)

  return {
    matcher: {
      match: matchMock,
    },
    matchMock,
  }
}
