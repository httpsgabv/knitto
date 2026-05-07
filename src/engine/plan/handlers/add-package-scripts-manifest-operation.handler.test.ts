import type { AddPackageScriptsManifestOperation } from '@core/manifest/manifest-operation'
import { describe, expect, it } from 'vitest'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import { AddPackageScriptsManifestOperationHandler } from './add-package-scripts-manifest-operation.handler'

describe('AddPackageScriptsManifestOperationHandler', () => {
  it('builds an add-package-scripts operation', () => {
    const handler = new AddPackageScriptsManifestOperationHandler()
    const result = handler.build(
      createBuildContext({
        type: 'add-package-scripts',
        target: 'package.json',
        scripts: {
          'db:generate': 'prisma generate',
          'db:studio': 'prisma studio',
        },
      })
    )

    expect(handler.type).toBe('add-package-scripts')
    expect(result.id).toMatch(/^add-package-scripts-\d+$/)
    expect(result).toMatchObject({
      type: 'add-package-scripts',
      target: '/target/package.json',
      scripts: {
        'db:generate': 'prisma generate',
        'db:studio': 'prisma studio',
      },
      origin: { type: 'feature', slug: 'auth' },
      description: 'build add-package-scripts',
    })
  })
})

function createBuildContext(
  operation: AddPackageScriptsManifestOperation
): ManifestOperationBuildContext<AddPackageScriptsManifestOperation> {
  return {
    operation,
    templateDir: '/template',
    targetDir: '/target',
    origin: { type: 'feature', slug: 'auth' },
    description: `build ${operation.type}`,
    resolveSource: (source) => `/template/${source}`,
    resolveTarget: (target) => `/target/${target}`,
  }
}
