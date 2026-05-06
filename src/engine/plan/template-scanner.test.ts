import type { Template } from '@core/template/template'
import { describe, expect, it } from 'vitest'
import { FakeFileSystem } from '@test/adapters/fs/fake-file-system'
import { TemplateScanner } from './template-scanner'

describe('TemplateScanner', () => {
  it('lists template files and maps them to absolute paths', async () => {
    const fileSystem = new FakeFileSystem()
    const template: Template = { rootPath: '/templates/auth' }

    fileSystem.addFile('/templates/auth/package.json', '{}')
    fileSystem.addFile('/templates/auth/src/auth.ts', 'export const auth = true')

    const scanner = new TemplateScanner(fileSystem)

    await expect(scanner.scan(template)).resolves.toEqual([
      {
        absolutePath: '/templates/auth/package.json',
        relativePath: 'package.json',
      },
      {
        absolutePath: '/templates/auth/src/auth.ts',
        relativePath: 'src/auth.ts',
      },
    ])

    expect(fileSystem.getCallsByMethod('listFiles')).toEqual([
      {
        method: 'listFiles',
        args: ['/templates/auth'],
      },
    ])
  })

  it('preserves UNC roots for absolute template paths', async () => {
    const fileSystem = new FakeFileSystem()
    const template: Template = { rootPath: '\\\\server\\share\\auth' }

    fileSystem.addFile('//server/share/auth/src/auth.ts', 'export const auth = true')

    const scanner = new TemplateScanner(fileSystem)

    await expect(scanner.scan(template)).resolves.toEqual([
      {
        absolutePath: '//server/share/auth/src/auth.ts',
        relativePath: 'src/auth.ts',
      },
    ])
  })
})
