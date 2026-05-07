import type { AstAddSideEffectImportOperation } from '@core/generation/ast-operation'
import type { OperationHandler } from '../operation-handler'

export class AstAddSideEffectImportHandler implements OperationHandler<AstAddSideEffectImportOperation> {
  readonly type = 'ast.add-side-effect-import' as const

  async execute(
    operation: AstAddSideEffectImportOperation,
    {
      sourceFileEditor,
      importEditor,
    }: Parameters<
      OperationHandler<AstAddSideEffectImportOperation>['execute']
    >[1]
  ) {
    await sourceFileEditor.edit(operation.target, (sourceFile) => {
      importEditor.ensureSideEffectImport(
        sourceFile,
        operation.from,
        operation.position
      )
    })
  }
}
