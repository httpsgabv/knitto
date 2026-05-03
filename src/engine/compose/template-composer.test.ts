import { describe, expect, it, vi } from 'vitest'
import { Errors } from '@core/errors/errors'
import type { GenerationPlan } from '@core/generation/generation-plan'
import type { GenerationOperation } from '@core/generation/operation'
import { TemplateComposer } from './template-composer'

describe('TemplateComposer', () => {
  it('rejects plans with conflicts before executing any operations', async () => {
    const operationExecutor = {
      execute: vi.fn().mockResolvedValue(undefined),
    }
    const composer = new TemplateComposer(operationExecutor as never)
    const conflicts = [
      {
        code: 'TARGET_EXISTS',
        message: 'target already exists',
        target: '/project/package.json',
        operationIds: ['op-1'],
      },
    ]

    await expect(
      composer.compose(
        createPlan({
          conflicts,
          operations: [createSkipFileOperation('op-1')],
        })
      )
    ).rejects.toMatchObject({
      name: 'KnittoError',
      message: 'Cannot compose project with plan conflicts',
      code: Errors.PLAN_HAS_CONFLICTS,
      details: conflicts,
    })

    expect(operationExecutor.execute).not.toHaveBeenCalled()
  })

  it('executes each operation in order with the plan variables', async () => {
    const operationExecutor = {
      execute: vi.fn().mockResolvedValue(undefined),
    }
    const composer = new TemplateComposer(operationExecutor as never)
    const variables = { name: 'Knitto', packageManager: 'pnpm' }
    const operations = [
      createSkipFileOperation('op-1'),
      {
        id: 'op-2',
        type: 'append-readme',
        origin: { type: 'feature', slug: 'docs' },
        description: 'append docs section',
        source: '/template/README.md',
        target: '/project/README.md',
        heading: 'Docs',
      } satisfies GenerationOperation,
    ]

    await composer.compose(createPlan({ operations, variables }))

    expect(operationExecutor.execute).toHaveBeenNthCalledWith(
      1,
      operations[0],
      variables
    )
    expect(operationExecutor.execute).toHaveBeenNthCalledWith(
      2,
      operations[1],
      variables
    )
    expect(operationExecutor.execute).toHaveBeenCalledTimes(2)
  })
})

function createPlan(overrides: Partial<GenerationPlan> = {}): GenerationPlan {
  return {
    project: {
      name: 'knitto-app',
      targetDir: '/project',
      packageManager: 'pnpm',
    },
    sources: [],
    variables: {},
    operations: [],
    warnings: [],
    conflicts: [],
    ...overrides,
  }
}

function createSkipFileOperation(id: string): GenerationOperation {
  return {
    id,
    type: 'skip-file',
    origin: { type: 'feature', slug: 'config' },
    description: 'skip existing file',
    source: `/template/${id}.env`,
    reason: 'already exists',
  }
}
