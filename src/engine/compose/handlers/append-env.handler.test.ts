import { describe, expect, it, vi } from 'vitest'
import type { AppendEnvOperation } from '@core/generation/file-operation'
import { AppendEnvHandler } from './append-env.handler'

describe('AppendEnvHandler', () => {
  it('delegates to envMerger.merge with the source and target', async () => {
    const envMerger = {
      merge: vi.fn().mockResolvedValue(undefined),
    }
    const handler = new AppendEnvHandler()
    const operation: AppendEnvOperation = {
      id: 'op-1',
      type: 'append-env',
      origin: { type: 'feature', slug: 'env' },
      description: 'append missing env vars',
      source: '/template/.env',
      target: '/project/.env',
      strategy: 'append-missing',
    }

    await handler.execute(operation, {
      envMerger,
    } as never)

    expect(envMerger.merge).toHaveBeenCalledWith('/template/.env', '/project/.env')
    expect(envMerger.merge).toHaveBeenCalledTimes(1)
  })
})
