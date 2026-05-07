import { describe, expect, it, vi } from 'vitest'
import type { AppendLinesOperation } from '@core/generation/file-operation'
import { AppendLinesHandler } from './append-lines.handler'

describe('AppendLinesHandler', () => {
  it('delegates to lineAppender.appendMissing with the target and lines', async () => {
    const lineAppender = {
      appendMissing: vi.fn().mockResolvedValue(undefined),
    }
    const handler = new AppendLinesHandler()
    const operation: AppendLinesOperation = {
      id: 'op-1',
      type: 'append-lines',
      origin: { type: 'feature', slug: 'prisma' },
      description: 'append ignore lines',
      target: '/project/.gitignore',
      lines: ['/src/generated/prisma', '.env'],
    }

    await handler.execute(operation, {
      lineAppender,
    } as never)

    expect(lineAppender.appendMissing).toHaveBeenCalledWith(
      '/project/.gitignore',
      ['/src/generated/prisma', '.env']
    )
    expect(lineAppender.appendMissing).toHaveBeenCalledTimes(1)
  })
})
