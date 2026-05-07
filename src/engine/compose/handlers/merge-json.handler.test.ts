import { describe, expect, it, vi } from 'vitest'
import type { MergeJsonOperation } from '@core/generation/file-operation'
import { MergeJsonHandler } from './merge-json.handler'

describe('MergeJsonHandler', () => {
  it('delegates to jsonFileMerger.merge with the source and target', async () => {
    const jsonFileMerger = {
      merge: vi.fn().mockResolvedValue(undefined),
    }
    const handler = new MergeJsonHandler()
    const operation: MergeJsonOperation = {
      id: 'op-1',
      type: 'merge-json',
      origin: { type: 'feature', slug: 'prisma' },
      description: 'merge json patch',
      source: '/template/tsconfig.patch.json',
      target: '/project/tsconfig.json',
      strategy: 'deep-merge',
    }

    await handler.execute(operation, {
      jsonFileMerger,
    } as never)

    expect(jsonFileMerger.merge).toHaveBeenCalledWith(
      '/template/tsconfig.patch.json',
      '/project/tsconfig.json'
    )
    expect(jsonFileMerger.merge).toHaveBeenCalledTimes(1)
  })
})
