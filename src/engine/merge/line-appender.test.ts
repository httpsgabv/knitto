import { describe, expect, it } from 'vitest'
import { FakeFileSystem } from '../../../test/adapters/fs/fake-file-system'
import { LineAppender } from './line-appender'

describe('LineAppender', () => {
  it('creates the target file when it does not exist', async () => {
    const fileSystem = new FakeFileSystem()
    const appender = new LineAppender(fileSystem)

    await appender.appendMissing('/project/.gitignore', [
      '/src/generated/prisma',
      '.env',
    ])

    expect(await fileSystem.readFile('/project/.gitignore', 'utf8')).toBe(
      ['/src/generated/prisma', '.env', ''].join('\n')
    )
  })

  it('appends only missing lines and preserves existing content', async () => {
    const fileSystem = new FakeFileSystem()
    const appender = new LineAppender(fileSystem)

    fileSystem.addFile(
      '/project/.gitignore',
      ['node_modules', '.env', ''].join('\n')
    )

    await appender.appendMissing('/project/.gitignore', [
      '.env',
      '/src/generated/prisma',
    ])

    expect(await fileSystem.readFile('/project/.gitignore', 'utf8')).toBe(
      ['node_modules', '.env', '', '/src/generated/prisma', ''].join('\n')
    )
  })
})
