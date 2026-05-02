import type { AstNestAddModuleImportOperation } from '@core/generation/ast-operation'
import type { OperationHandler } from '../operation-handler'

export class AstNestAddModuleImportHandler
  implements OperationHandler<AstNestAddModuleImportOperation>
{
  readonly type = 'ast.nest.add-module-import' as const

  async execute(
    operation: AstNestAddModuleImportOperation,
    { sourceFileEditor, nestModuleEditor }: Parameters<
      OperationHandler<AstNestAddModuleImportOperation>['execute']
    >[1]
  ) {
    await sourceFileEditor.edit(operation.target, (sourceFile) => {
      nestModuleEditor.ensureModuleImport({
        sourceFile,
        namedImport: operation.namedImport,
        moduleName: operation.moduleName,
      })
    })
  }
}
