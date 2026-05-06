import { describe, expect, it, vi } from 'vitest'
import type { AstNestAddBootstrapMethodCallOperation } from '@core/generation/ast-operation'
import { AstNestAddBootstrapMethodCallHandler } from './ast-nest-add-bootstrap-method-call.handler'

type TestContext = {
  sourceFileEditor: {
    edit: ReturnType<typeof vi.fn>
  }
  nestBootstrapEditor: {
    ensureBootstrapMethodCall: ReturnType<typeof vi.fn>
  }
}

describe('AstNestAddBootstrapMethodCallHandler', () => {
  it('edits the target file and ensures the bootstrap method call', async () => {
    const sourceFile = {} as never
    const context = createContext()
    const operation = createOperation('/project/main.ts')

    await createHandler().execute(operation, context as never)

    expect(context.sourceFileEditor.edit).toHaveBeenCalledTimes(1)
    expect(context.sourceFileEditor.edit).toHaveBeenCalledWith(
      operation.target,
      expect.any(Function)
    )

    const editCallback = vi.mocked(context.sourceFileEditor.edit).mock
      .calls[0]?.[1]

    expect(editCallback).toBeTypeOf('function')

    await editCallback?.(sourceFile)

    expect(
      context.nestBootstrapEditor.ensureBootstrapMethodCall
    ).toHaveBeenCalledTimes(1)
    expect(
      context.nestBootstrapEditor.ensureBootstrapMethodCall
    ).toHaveBeenCalledWith({
      sourceFile,
      receiver: operation.receiver,
      method: operation.method,
      arguments: operation.arguments,
    })
  })
})

function createHandler() {
  return new AstNestAddBootstrapMethodCallHandler()
}

function createContext(): TestContext {
  return {
    fileSystem: {} as never,
    variableRenderer: {} as never,
    packageJsonMerger: {} as never,
    envMerger: {} as never,
    readmeMerger: {} as never,
    sourceFileEditor: {
      edit: vi.fn(),
    },
    importEditor: {} as never,
    nestModuleEditor: {} as never,
    nestBootstrapEditor: {
      ensureBootstrapMethodCall: vi.fn(),
    },
    variables: {},
  } as never as TestContext
}

function createOperation(
  target: string
): AstNestAddBootstrapMethodCallOperation {
  return {
    id: 'op-1',
    type: 'ast.nest.add-bootstrap-method-call',
    origin: { type: 'feature', slug: 'shutdown-hooks' },
    description: 'add bootstrap shutdown hook call',
    target,
    receiver: {
      kind: 'identifier',
      name: 'app',
    },
    method: 'enableShutdownHooks',
    arguments: [
      {
        kind: 'call',
        callee: {
          kind: 'member',
          object: 'signalStore',
          property: 'getSignals',
        },
        arguments: [],
      },
    ],
  }
}
