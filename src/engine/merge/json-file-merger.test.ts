import { Errors } from '@core/errors/errors'
import { describe, expect, it } from 'vitest'
import { FakeFileSystem } from '../../../test/adapters/fs/fake-file-system'
import { JsonFileMerger } from './json-file-merger'

describe('JsonFileMerger', () => {
  it('creates the target json file when it does not exist', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new JsonFileMerger(fileSystem)

    fileSystem.addFile(
      '/template/tsconfig.patch.json',
      JSON.stringify({
        compilerOptions: {
          strict: true,
        },
      })
    )

    await merger.merge(
      '/template/tsconfig.patch.json',
      '/project/tsconfig.json'
    )

    expect(await fileSystem.readFile('/project/tsconfig.json', 'utf8')).toBe(
      '{\n  "compilerOptions": {\n    "strict": true\n  }\n}\n'
    )
  })

  it('deep merges objects and unique-appends arrays', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new JsonFileMerger(fileSystem)

    fileSystem.addFile(
      '/template/tsconfig.patch.json',
      JSON.stringify({
        compilerOptions: {
          paths: ['b', 'c'],
          strict: true,
        },
      })
    )
    fileSystem.addFile(
      '/project/tsconfig.json',
      JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: ['a', 'b'],
        },
      })
    )

    await merger.merge(
      '/template/tsconfig.patch.json',
      '/project/tsconfig.json'
    )

    expect(await fileSystem.readFile('/project/tsconfig.json', 'utf8')).toBe(
      [
        '{',
        '  "compilerOptions": {',
        '    "baseUrl": ".",',
        '    "paths": [',
        '      "a",',
        '      "b",',
        '      "c"',
        '    ],',
        '    "strict": true',
        '  }',
        '}',
        '',
      ].join('\n')
    )
  })

  it('throws when a primitive value conflicts', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new JsonFileMerger(fileSystem)

    fileSystem.addFile(
      '/template/tsconfig.patch.json',
      JSON.stringify({
        extends: './tsconfig.base.json',
      })
    )
    fileSystem.addFile(
      '/project/tsconfig.json',
      JSON.stringify({
        extends: './tsconfig.app.json',
      })
    )

    await expect(
      merger.merge('/template/tsconfig.patch.json', '/project/tsconfig.json')
    ).rejects.toMatchObject({
      name: 'KnittoError',
      code: Errors.JSON_MERGE_CONFLICT,
    })
  })
})
