import { Errors } from '@core/errors/errors'
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

  it('merges into an existing package.json without overriding target identity or scripts', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new PackageJsonMerger(fileSystem)

    fileSystem.addFile(
      '/template/package.json',
      JSON.stringify({
        name: 'feature-package',
        version: '2.0.0',
        scripts: {
          build: 'feature-build',
          lint: 'eslint .',
        },
        dependencies: {
          zod: '^4.0.0',
          chalk: '^5.0.0',
        },
        devDependencies: {
          vitest: '^4.0.0',
        },
        peerDependencies: {
          react: '^19.0.0',
        },
      })
    )
    fileSystem.addFile(
      '/project/package.json',
      JSON.stringify({
        name: 'app-project',
        version: '1.0.0',
        scripts: {
          test: 'vitest run',
          build: 'app-build',
        },
        dependencies: {
          chalk: '^4.0.0',
          axios: '^1.0.0',
        },
        optionalDependencies: {
          fsevents: '^2.0.0',
        },
      })
    )

    await merger.merge('/template/package.json', '/project/package.json')

    const written = await fileSystem.readJson<Record<string, unknown>>(
      '/project/package.json'
    )

    expect(written).toEqual({
      name: 'app-project',
      version: '1.0.0',
      scripts: {
        build: 'app-build',
        lint: 'eslint .',
        test: 'vitest run',
      },
      dependencies: {
        axios: '^1.0.0',
        chalk: '^5.0.0',
        zod: '^4.0.0',
      },
      devDependencies: {
        vitest: '^4.0.0',
      },
      peerDependencies: {
        react: '^19.0.0',
      },
      optionalDependencies: {
        fsevents: '^2.0.0',
      },
    })
  })

  it('normalizes null package json inputs to empty objects', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new PackageJsonMerger(fileSystem)

    fileSystem.addFile('/template/package.json', 'null')
    fileSystem.addFile('/project/package.json', 'null')

    await merger.merge('/template/package.json', '/project/package.json')

    expect(await fileSystem.readJson('/project/package.json')).toEqual({
      scripts: {},
    })
  })

  it('adds scripts to an existing package.json without overwriting different values', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new PackageJsonMerger(fileSystem)

    fileSystem.addFile(
      '/project/package.json',
      JSON.stringify({
        name: 'app-project',
        scripts: {
          dev: 'vite',
        },
      })
    )

    await merger.addScripts('/project/package.json', {
      'db:generate': 'prisma generate',
      dev: 'vite',
    })

    expect(await fileSystem.readJson('/project/package.json')).toEqual({
      name: 'app-project',
      scripts: {
        'db:generate': 'prisma generate',
        dev: 'vite',
      },
    })
  })

  it('throws when adding a script that already exists with a different value', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new PackageJsonMerger(fileSystem)

    fileSystem.addFile(
      '/project/package.json',
      JSON.stringify({
        scripts: {
          dev: 'vite',
        },
      })
    )

    await expect(
      merger.addScripts('/project/package.json', {
        dev: 'next dev',
      })
    ).rejects.toMatchObject({
      name: 'KnittoError',
      code: Errors.PACKAGE_JSON_SCRIPT_CONFLICT,
    })
  })
})
