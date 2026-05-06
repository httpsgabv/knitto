import { describe, expect, it, beforeEach } from 'vitest'
import type { TemplateFile } from '@core/template/template-file'
import { FastGlobTemplateFileMatcher } from './fast-glob-template-file-matcher'
import { isNotWindows } from '@test/shared/os'

describe('FastGlobTemplateFileMatcher', () => {
  let matcher: FastGlobTemplateFileMatcher

  beforeEach(() => {
    matcher = new FastGlobTemplateFileMatcher()
  })

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
      absolutePath: '/templates/base/src/index.test.ts',
      relativePath: 'src/index.test.ts',
    },
    {
      absolutePath: '/templates/base/src/page1.ts',
      relativePath: 'src/page1.ts',
    },
    {
      absolutePath: '/templates/base/src/page10.ts',
      relativePath: 'src/page10.ts',
    },
    {
      absolutePath: '/templates/base/src/app.tsx',
      relativePath: 'src/app.tsx',
    },
    {
      absolutePath: '/templates/base/package.json',
      relativePath: 'package.json',
    },
  ]

  it('matches include and exclude rules against template files', () => {
    expect(
      matcher.match({
        files,
        include: ['src/**', 'package.json', 'knitto.json'],
        exclude: ['src/**/*.test.ts'],
      })
    ).toEqual(
      new Set([
        'src/index.ts',
        'src/page1.ts',
        'src/page10.ts',
        'src/app.tsx',
        'package.json',
        'knitto.json',
      ])
    )
  })

  it('supports default include behavior when include is empty', () => {
    expect(
      matcher.match({
        files,
        include: [],
        exclude: ['src/**/*.test.ts', 'package.json'],
      })
    ).toEqual(
      new Set([
        'knitto.json',
        'src/index.ts',
        'src/page1.ts',
        'src/page10.ts',
        'src/app.tsx',
      ])
    )
  })

  it('supports brace patterns', () => {
    expect(
      matcher.match({
        files,
        include: ['src/**/*.{ts,tsx}'],
        exclude: [],
      })
    ).toEqual(
      new Set([
        'src/index.ts',
        'src/index.test.ts',
        'src/page1.ts',
        'src/page10.ts',
        'src/app.tsx',
      ])
    )
  })

  it('supports question mark patterns', () => {
    expect(
      matcher.match({
        files,
        include: ['src/page?.ts'],
        exclude: [],
      })
    ).toEqual(new Set(['src/page1.ts']))
  })

  it('returns no matches when the template has no files', () => {
    expect(
      matcher.match({
        files: [],
        include: ['**/*'],
        exclude: [],
      })
    ).toEqual(new Set())
  })

  it('matches a template rooted at a directory path', () => {
    expect(
      matcher.match({
        files: [
          {
            absolutePath: '/templates/base',
            relativePath: '',
          },
          {
            absolutePath: '/templates/base/src/main.ts',
            relativePath: 'src/main.ts',
          },
        ],
        include: ['src/**/*.ts'],
        exclude: [],
      })
    ).toEqual(new Set(['src/main.ts']))
  })

  it('matches files when the computed root does not end with a slash', () => {
    expect(
      matcher.match({
        files: [
          {
            absolutePath: '/virtual-root/src/index.ts',
            relativePath: '/src/index.ts',
          },
        ],
        include: ['**/*.ts'],
        exclude: [],
      })
    ).toEqual(new Set(['src/index.ts']))
  })

  it.skipIf(isNotWindows)(
    'matches files when absolute and relative template paths use windows separators',
    () => {
      expect(
        matcher.match({
          files: [
            {
              absolutePath: 'C:\\templates\\base\\src\\main.ts',
              relativePath: 'src\\main.ts',
            },
            {
              absolutePath: 'C:\\templates\\base\\src\\main.test.ts',
              relativePath: 'src\\main.test.ts',
            },
          ],
          include: ['src/**/*.ts'],
          exclude: ['src/**/*.test.ts'],
        })
      ).toEqual(new Set(['src/main.ts']))
    }
  )
})
