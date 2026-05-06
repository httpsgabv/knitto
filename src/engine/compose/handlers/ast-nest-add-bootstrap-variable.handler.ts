import type { AstNestAddBootstrapVariableOperation } from '@core/generation/ast-operation'
import type { OperationHandler } from '../operation-handler'

export class AstNestAddBootstrapVariableHandler
  implements OperationHandler<AstNestAddBootstrapVariableOperation>
{
  readonly type = 'ast.nest.add-bootstrap-variable' as const

  async execute(
    operation: AstNestAddBootstrapVariableOperation,
    { sourceFileEditor, nestBootstrapEditor }: Parameters<
      OperationHandler<AstNestAddBootstrapVariableOperation>['execute']
    >[1]
  ) {
    await sourceFileEditor.edit(operation.target, (sourceFile) => {
      nestBootstrapEditor.ensureBootstrapVariable({
        sourceFile,
        declarationKind: operation.declarationKind,
        name: operation.name,
        initializer: operation.initializer,
      })
    })
  }
}
