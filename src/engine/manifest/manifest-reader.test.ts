import { describe, expect, it } from 'vitest'
import type { FileSystem } from '@adapters/fs/file-system'
import { Errors } from '@core/errors/errors'
import { FakeFileSystem } from '@test/adapters/fs/fake-file-system'
import { ManifestReader } from './manifest-reader'

describe('ManifestReader', () => {
  it('returns null when knitto.json does not exist', async () => {
    const reader = new ManifestReader(new FakeFileSystem())

    await expect(reader.read('/templates/base')).resolves.toBeNull()
  })

  it('reads and returns the manifest json', async () => {
    const fileSystem = new FakeFileSystem()
    fileSystem.addFile(
      '/templates/base/knitto.json',
      JSON.stringify({ schemaVersion: 1, type: 'kit', slug: 'base' })
    )
    const reader = new ManifestReader(fileSystem)

    await expect(reader.read('/templates/base')).resolves.toEqual({
      schemaVersion: 1,
      type: 'kit',
      slug: 'base',
    })
  })

  it('reads manifests from UNC template roots', async () => {
    const fileSystem = new FakeFileSystem()
    fileSystem.addFile(
      '//server/share/base/knitto.json',
      JSON.stringify({ schemaVersion: 1, type: 'kit', slug: 'base' })
    )
    const reader = new ManifestReader(fileSystem)

    await expect(reader.read('\\\\server\\share\\base')).resolves.toEqual({
      schemaVersion: 1,
      type: 'kit',
      slug: 'base',
    })
  })

  it('translates malformed json into a KnittoError', async () => {
    const fileSystem = new FakeFileSystem()
    fileSystem.addFile('/templates/base/knitto.json', '{ invalid json')
    const reader = new ManifestReader(fileSystem)

    await expect(reader.read('/templates/base')).rejects.toMatchObject({
      name: 'KnittoError',
      code: Errors.INVALID_TEMPLATE_MANIFEST,
      message: 'Invalid template manifest',
      details: expect.any(SyntaxError),
    })
  })

  it('rethrows unreadable file errors that are not syntax errors', async () => {
    const unreadableError = new Error('permission denied')
    const fileSystem: FileSystem = {
      pathExists: async () => true,
      ensureDir: async () => undefined,
      readFile: async () => '',
      writeFile: async () => undefined,
      readJson: async () => {
        throw unreadableError
      },
      writeJson: async () => undefined,
      listFiles: async () => [],
    }
    const reader = new ManifestReader(fileSystem)

    await expect(reader.read('/templates/base')).rejects.toBe(unreadableError)
  })
})
