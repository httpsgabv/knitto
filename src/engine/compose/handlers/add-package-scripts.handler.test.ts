import { describe, expect, it, vi } from 'vitest'
import type { AddPackageScriptsOperation } from '@core/generation/file-operation'
import { AddPackageScriptsHandler } from './add-package-scripts.handler'

describe('AddPackageScriptsHandler', () => {
  it('delegates to packageJsonMerger.addScripts with the target and scripts', async () => {
    const packageJsonMerger = {
      addScripts: vi.fn().mockResolvedValue(undefined),
    }
    const handler = new AddPackageScriptsHandler()
    const operation: AddPackageScriptsOperation = {
      id: 'op-1',
      type: 'add-package-scripts',
      origin: { type: 'feature', slug: 'prisma' },
      description: 'add package scripts',
      target: '/project/package.json',
      scripts: {
        'db:generate': 'prisma generate',
        'db:studio': 'prisma studio',
      },
    }

    await handler.execute(operation, {
      packageJsonMerger,
    } as never)

    expect(packageJsonMerger.addScripts).toHaveBeenCalledWith(
      '/project/package.json',
      {
        'db:generate': 'prisma generate',
        'db:studio': 'prisma studio',
      }
    )
    expect(packageJsonMerger.addScripts).toHaveBeenCalledTimes(1)
  })
})
