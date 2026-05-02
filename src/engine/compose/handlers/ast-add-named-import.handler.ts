import type { AstAddNamedImportOperation } from '@core/generation/ast-operation'
import type { OperationHandler } from '../operation-handler'

export class AstAddNamedImportHandler
  implements OperationHandler<AstAddNamedImportOperation>
{
  readonly type = 'ast.add-named-import' as const

  async execute(
    operation: AstAddNamedImportOperation,
    { sourceFileEditor, importEditor }: Parameters<
      OperationHandler<AstAddNamedImportOperation>['execute']
    >[1]
  ) {
    await sourceFileEditor.edit(operation.target, (sourceFile) => {
      importEditor.ensureNamedImport(sourceFile, operation.named, operation.from)
    })
  }
}
