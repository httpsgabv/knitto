import { describe, expect, it, vi } from 'vitest'
import type { UpsertEnvOperation } from '@core/generation/file-operation'
import { UpsertEnvHandler } from './upsert-env.handler'

describe('UpsertEnvHandler', () => {
  it('delegates to envMerger.upsert with the target and values', async () => {
    const envMerger = {
      upsert: vi.fn().mockResolvedValue(undefined),
    }
    const handler = new UpsertEnvHandler()
    const operation: UpsertEnvOperation = {
      id: 'op-1',
      type: 'upsert-env',
      origin: { type: 'feature', slug: 'env' },
      description: 'upsert env vars',
      target: '/project/.env',
      values: {
        DATABASE_URL: 'postgresql://localhost:5432/app',
        POSTGRES_USER: 'postgres',
      },
    }

    await handler.execute(operation, {
      envMerger,
    } as never)

    expect(envMerger.upsert).toHaveBeenCalledWith('/project/.env', {
      DATABASE_URL: 'postgresql://localhost:5432/app',
      POSTGRES_USER: 'postgres',
    })
    expect(envMerger.upsert).toHaveBeenCalledTimes(1)
  })
})
