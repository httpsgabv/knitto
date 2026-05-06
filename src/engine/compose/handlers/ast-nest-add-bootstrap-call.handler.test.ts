import { describe, expect, it, vi } from 'vitest'
import type { AstNestAddBootstrapCallOperation } from '@core/generation/ast-operation'
import { AstNestAddBootstrapCallHandler } from './ast-nest-add-bootstrap-call.handler'

type TestContext = {
  sourceFileEditor: {
    edit: ReturnType<typeof vi.fn>
  }
  nestBootstrapEditor: {
    ensureBootstrapCall: ReturnType<typeof vi.fn>
  }
}

describe('AstNestAddBootstrapCallHandler', () => {
  it('edits the target file and ensures the bootstrap call', async () => {
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
      context.nestBootstrapEditor.ensureBootstrapCall
    ).toHaveBeenCalledTimes(1)
    expect(
      context.nestBootstrapEditor.ensureBootstrapCall
    ).toHaveBeenCalledWith({
      sourceFile,
      appVar: operation.appVar,
      call: operation.call,
    })
  })
})

function createHandler() {
  return new AstNestAddBootstrapCallHandler()
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
      ensureBootstrapCall: vi.fn(),
    },
    variables: {},
  } as never as TestContext
}

function createOperation(target: string): AstNestAddBootstrapCallOperation {
  return {
    id: 'op-1',
    type: 'ast.nest.add-bootstrap-call',
    origin: { type: 'feature', slug: 'logger' },
    description: 'add bootstrap logger call',
    target,
    appVar: 'app',
    call: {
      method: 'useLogger',
      arguments: [
        {
          kind: 'call',
          callee: {
            kind: 'member',
            object: 'app',
            property: 'get',
          },
          arguments: [{ kind: 'identifier', name: 'Logger' }],
        },
      ],
    },
  }
}
