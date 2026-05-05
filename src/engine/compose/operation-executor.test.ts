import { describe, expect, it, vi } from 'vitest'
import type { GenerationOperation } from '@core/generation/operation'
import type { OperationContext } from './operation-context'
import { OperationExecutor } from './operation-executor'

describe('OperationExecutor', () => {
  it('uses the provided handler registry and base context dependencies', async () => {
    const execute = vi.fn().mockResolvedValue(undefined)
    const handler = {
      type: 'skip-file' as const,
      execute,
    }
    const registry = {
      get: vi.fn().mockReturnValue(handler),
    }
    const baseContext = createBaseContext()
    const executor = new OperationExecutor(registry as never, baseContext)
    const operation: GenerationOperation = {
      id: 'op-1',
      type: 'skip-file',
      origin: { type: 'feature', slug: 'config' },
      description: 'skip file',
      source: '/template/.env',
      reason: 'already exists',
    }

    await executor.execute(operation, { name: 'Knitto' })

    expect(registry.get).toHaveBeenCalledWith('skip-file')
    expect(execute).toHaveBeenCalledWith(operation, {
      ...baseContext,
      variables: { name: 'Knitto' },
    })
  })

  it('throws when the operation type is unregistered', async () => {
    const registry = {
      get: vi.fn().mockReturnValue(undefined),
    }
    const executor = new OperationExecutor(registry as never, createBaseContext())
    const operation = {
      id: 'op-1',
      type: 'skip-file',
      origin: { type: 'feature', slug: 'config' },
      description: 'skip file',
      source: '/template/.env',
      reason: 'already exists',
    } satisfies GenerationOperation

    await expect(executor.execute(operation, {})).rejects.toThrow(
      'No handler registered for operation type: skip-file'
    )
    expect(registry.get).toHaveBeenCalledWith('skip-file')
  })
})

function createBaseContext(): Omit<OperationContext, 'variables'> {
  return {
    fileSystem: {} as never,
    variableRenderer: {} as never,
    packageJsonMerger: {} as never,
    envMerger: {} as never,
    readmeMerger: {} as never,
    sourceFileEditor: {} as never,
    importEditor: {} as never,
    nestModuleEditor: {} as never,
    nestBootstrapEditor: {} as never,
  }
}
