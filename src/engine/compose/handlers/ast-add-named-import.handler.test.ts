import { describe, expect, it, vi } from 'vitest'
import type { AstAddNamedImportOperation } from '@core/generation/ast-operation'
import { AstAddNamedImportHandler } from './ast-add-named-import.handler'

type TestContext = {
  sourceFileEditor: {
    edit: ReturnType<typeof vi.fn>
  }
  importEditor: {
    ensureNamedImport: ReturnType<typeof vi.fn>
  }
}

describe('AstAddNamedImportHandler', () => {
  it('edits the target file and ensures the named import', async () => {
    const sourceFile = {} as never
    const context = createContext()
    const operation = createOperation('/project/app.module.ts')

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

    expect(context.importEditor.ensureNamedImport).toHaveBeenCalledTimes(1)
    expect(context.importEditor.ensureNamedImport).toHaveBeenCalledWith(
      sourceFile,
      operation.named,
      operation.from
    )
  })
})

function createHandler() {
  return new AstAddNamedImportHandler()
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
    importEditor: {
      ensureNamedImport: vi.fn(),
    },
    nestModuleEditor: {} as never,
    nestBootstrapEditor: {} as never,
    variables: {},
  } as never as TestContext
}

function createOperation(target: string): AstAddNamedImportOperation {
  return {
    id: 'op-1',
    type: 'ast.add-named-import',
    origin: { type: 'feature', slug: 'config' },
    description: 'add ConfigModule import',
    target,
    named: 'ConfigModule',
    from: '@nestjs/config',
  }
}
