import { describe, expect, it, vi } from 'vitest'
import type { AstNestAddModuleImportOperation } from '@core/generation/ast-operation'
import { AstNestAddModuleImportHandler } from './ast-nest-add-module-import.handler'

type TestContext = {
  sourceFileEditor: {
    edit: ReturnType<typeof vi.fn>
  }
  nestModuleEditor: {
    ensureModuleImport: ReturnType<typeof vi.fn>
  }
}

describe('AstNestAddModuleImportHandler', () => {
  it('edits the target file and ensures the module import', async () => {
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

    expect(context.nestModuleEditor.ensureModuleImport).toHaveBeenCalledTimes(1)
    expect(context.nestModuleEditor.ensureModuleImport).toHaveBeenCalledWith({
      sourceFile,
      namedImport: operation.namedImport,
      moduleName: operation.moduleName,
    })
  })
})

function createHandler() {
  return new AstNestAddModuleImportHandler()
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
    nestModuleEditor: {
      ensureModuleImport: vi.fn(),
    },
    nestBootstrapEditor: {} as never,
    variables: {},
  } as never as TestContext
}

function createOperation(target: string): AstNestAddModuleImportOperation {
  return {
    id: 'op-1',
    type: 'ast.nest.add-module-import',
    origin: { type: 'feature', slug: 'config' },
    description: 'add ConfigModule to AppModule imports',
    target,
    namedImport: {
      name: 'ConfigModule',
      from: '@nestjs/config',
    },
    moduleName: 'ConfigModule',
  }
}
