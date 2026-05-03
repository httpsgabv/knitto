import { describe, expect, it, vi } from 'vitest'
import type { MergePackageJsonOperation } from '@core/generation/file-operation'
import { MergePackageJsonHandler } from './merge-package-json.handler'

describe('MergePackageJsonHandler', () => {
  it('delegates to packageJsonMerger.merge with the source and target', async () => {
    const packageJsonMerger = {
      merge: vi.fn().mockResolvedValue(undefined),
    }
    const handler = new MergePackageJsonHandler()
    const operation: MergePackageJsonOperation = {
      id: 'op-1',
      type: 'merge-package-json',
      origin: { type: 'kit', slug: 'base' },
      description: 'merge package.json',
      source: '/template/package.json',
      target: '/project/package.json',
      strategy: 'safe-merge',
    }

    await handler.execute(operation, {
      packageJsonMerger,
    } as never)

    expect(packageJsonMerger.merge).toHaveBeenCalledWith(
      '/template/package.json',
      '/project/package.json'
    )
    expect(packageJsonMerger.merge).toHaveBeenCalledTimes(1)
  })
})
