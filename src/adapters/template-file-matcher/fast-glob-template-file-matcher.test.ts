import { describe, expect, it } from 'vitest'
import type { TemplateFile } from '@core/template/template-file'
import { FastGlobTemplateFileMatcher } from './fast-glob-template-file-matcher'

describe('FastGlobTemplateFileMatcher', () => {
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
    const matcher = new FastGlobTemplateFileMatcher()

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
    const matcher = new FastGlobTemplateFileMatcher()

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
    const matcher = new FastGlobTemplateFileMatcher()

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
    const matcher = new FastGlobTemplateFileMatcher()

    expect(
      matcher.match({
        files,
        include: ['src/page?.ts'],
        exclude: [],
      })
    ).toEqual(new Set(['src/page1.ts']))
  })
})
