import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { TemplateFile } from '@core/template/template-file'
import { FastGlobTemplateFileMatcher } from './fast-glob-template-file-matcher'

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

  it('exposes file-system stats and dirent helpers for fast-glob', () => {
    const typedMatcher = matcher as unknown as {
      createFileSystemAdapter: (
        files: TemplateFile[],
        root: string
      ) => {
        statSync: (entryPath: string) => {
          isBlockDevice: () => boolean
          isCharacterDevice: () => boolean
          isDirectory: () => boolean
          isFIFO: () => boolean
          isFile: () => boolean
          isSocket: () => boolean
          isSymbolicLink: () => boolean
        }
        lstatSync: (entryPath: string) => {
          isDirectory: () => boolean
          isFile: () => boolean
        }
        readdirSync: (directoryPath: string) => Array<{
          name: string
          isDirectory: () => boolean
          isFile: () => boolean
          isSymbolicLink: () => boolean
        }>
      }
    }
    const adapter = typedMatcher.createFileSystemAdapter(
      files,
      '/templates/base'
    )

    const fileStats = adapter.statSync('/templates/base/src/index.ts')
    const directoryStats = adapter.lstatSync('/templates/base/src')
    const entries = adapter.readdirSync('/templates/base/src')
    const testEntry = entries.find((entry) => entry.name === 'index.test.ts')

    expect(fileStats.isFile()).toBe(true)
    expect(fileStats.isDirectory()).toBe(false)
    expect(fileStats.isBlockDevice()).toBe(false)
    expect(fileStats.isCharacterDevice()).toBe(false)
    expect(fileStats.isFIFO()).toBe(false)
    expect(fileStats.isSocket()).toBe(false)
    expect(fileStats.isSymbolicLink()).toBe(false)
    expect(directoryStats.isDirectory()).toBe(true)
    expect(directoryStats.isFile()).toBe(false)
    expect(testEntry?.isFile()).toBe(true)
    expect(testEntry?.isDirectory()).toBe(false)
    expect(testEntry?.isSymbolicLink()).toBe(false)
  })

  it('creates directory entries when addEntry receives a missing directory bucket', () => {
    const typedMatcher = matcher as unknown as {
      addEntry: (
        directories: Map<string, Set<string>>,
        directoryPath: string,
        entryName: string
      ) => void
    }
    const directories = new Map<string, Set<string>>()

    typedMatcher.addEntry(directories, '/templates/base/src', 'index.ts')

    expect(directories.get('/templates/base/src')).toEqual(
      new Set(['index.ts'])
    )
  })

  it('skips adding a file entry when segment splitting yields no file name', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalSplit = String.prototype.split
    const split = vi.spyOn(String.prototype, 'split')

    split.mockImplementation(function (
      this: string,
      separator: unknown,
      limit?: number
    ) {
      if (this.toString() === '__EMPTY_SEGMENTS__' && separator === '/') {
        return []
      }

      return originalSplit.call(this.toString(), separator as never, limit)
    } as never)

    const typedMatcher = matcher as unknown as {
      createFileSystemAdapter: (
        files: TemplateFile[],
        root: string
      ) => {
        readdirSync: (directoryPath: string) => Array<{ name: string }>
      }
    }
    const adapter = typedMatcher.createFileSystemAdapter(
      [
        {
          absolutePath: '/templates/base/__EMPTY_SEGMENTS__',
          relativePath: '__EMPTY_SEGMENTS__',
        },
      ],
      '/templates/base'
    )

    expect(adapter.readdirSync('/templates/base')).toEqual([])

    split.mockRestore()
  })
})
