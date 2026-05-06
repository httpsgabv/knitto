import { describe, expect, it, vi } from 'vitest'
import type { AstNestAddBootstrapVariableOperation } from '@core/generation/ast-operation'
import { AstNestAddBootstrapVariableHandler } from './ast-nest-add-bootstrap-variable.handler'

type TestContext = {
  sourceFileEditor: {
    edit: ReturnType<typeof vi.fn>
  }
  nestBootstrapEditor: {
    ensureBootstrapVariable: ReturnType<typeof vi.fn>
  }
}

describe('AstNestAddBootstrapVariableHandler', () => {
  it('edits the target file and ensures the bootstrap variable', async () => {
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
      context.nestBootstrapEditor.ensureBootstrapVariable
    ).toHaveBeenCalledTimes(1)
    expect(
      context.nestBootstrapEditor.ensureBootstrapVariable
    ).toHaveBeenCalledWith({
      sourceFile,
      declarationKind: operation.declarationKind,
      name: operation.name,
      initializer: operation.initializer,
    })
  })
})

function createHandler() {
  return new AstNestAddBootstrapVariableHandler()
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
      ensureBootstrapVariable: vi.fn(),
    },
    variables: {},
  } as never as TestContext
}

function createOperation(target: string): AstNestAddBootstrapVariableOperation {
  return {
    id: 'op-1',
    type: 'ast.nest.add-bootstrap-variable',
    origin: { type: 'feature', slug: 'logger' },
    description: 'add bootstrap logger variable',
    target,
    declarationKind: 'const',
    name: 'logger',
    initializer: {
      kind: 'call',
      callee: {
        kind: 'identifier',
        name: 'createLogger',
      },
      arguments: [{ kind: 'identifier', name: 'config' }],
    },
  }
}
