import { describe, expect, it } from 'vitest'
import type { SkipFileOperation } from '@core/generation/file-operation'
import { SkipFileHandler } from './skip-file.handler'

describe('SkipFileHandler', () => {
  it('resolves without reading from the operation context', async () => {
    const context = new Proxy(
      {},
      {
        get(property) {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          throw new Error(`Unexpected context access: ${String(property)}`)
        },
      }
    )
    const handler = new SkipFileHandler()
    const operation: SkipFileOperation = {
      id: 'op-1',
      type: 'skip-file',
      origin: { type: 'feature', slug: 'config' },
      description: 'skip existing file',
      source: '/template/.env',
      reason: 'already exists',
    }

    await expect(
      handler.execute(operation, context as never)
    ).resolves.toBeUndefined()
  })
})
