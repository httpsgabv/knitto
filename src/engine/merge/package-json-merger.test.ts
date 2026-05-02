import { describe, expect, it } from 'vitest'
import { FakeFileSystem } from '../../../test/adapters/fs/fake-file-system'
import { PackageJsonMerger } from './package-json-merger'

describe('PackageJsonMerger', () => {
  it('creates the target package.json when it does not exist', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new PackageJsonMerger(fileSystem)

    fileSystem.addFile(
      '/template/package.json',
      JSON.stringify({
        name: 'feature-package',
        version: '1.0.0',
        dependencies: {
          pino: '^9.0.0',
        },
      })
    )

    await merger.merge('/template/package.json', '/project/package.json')

    const written = await fileSystem.readJson<{
      name: string
      version: string
      dependencies: Record<string, string>
    }>('/project/package.json')

    expect(written).toEqual({
      name: 'feature-package',
      version: '1.0.0',
      dependencies: {
        pino: '^9.0.0',
      },
      scripts: {},
    })
  })
})
