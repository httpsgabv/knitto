import { describe, expect, it, vi } from 'vitest'
import type { AppendReadmeOperation } from '@core/generation/file-operation'
import { AppendReadmeHandler } from './append-readme.handler'

describe('AppendReadmeHandler', () => {
  it('delegates to readmeMerger.merge with the heading', async () => {
    const readmeMerger = {
      merge: vi.fn().mockResolvedValue(undefined),
    }
    const handler = new AppendReadmeHandler()
    const operation: AppendReadmeOperation = {
      id: 'op-1',
      type: 'append-readme',
      origin: { type: 'feature', slug: 'docs' },
      description: 'append readme section',
      source: '/template/README.md',
      target: '/project/README.md',
      heading: 'Getting Started',
    }

    await handler.execute(operation, {
      readmeMerger,
    } as never)

    expect(readmeMerger.merge).toHaveBeenCalledWith(
      '/template/README.md',
      '/project/README.md',
      'Getting Started'
    )
    expect(readmeMerger.merge).toHaveBeenCalledTimes(1)
  })
})
