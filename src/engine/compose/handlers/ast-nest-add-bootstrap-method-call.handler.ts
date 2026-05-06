import type { AstNestAddBootstrapMethodCallOperation } from '@core/generation/ast-operation'
import type { OperationHandler } from '../operation-handler'

export class AstNestAddBootstrapMethodCallHandler
  implements OperationHandler<AstNestAddBootstrapMethodCallOperation>
{
  readonly type = 'ast.nest.add-bootstrap-method-call' as const

  async execute(
    operation: AstNestAddBootstrapMethodCallOperation,
    { sourceFileEditor, nestBootstrapEditor }: Parameters<
      OperationHandler<AstNestAddBootstrapMethodCallOperation>['execute']
    >[1]
  ) {
    await sourceFileEditor.edit(operation.target, (sourceFile) => {
      nestBootstrapEditor.ensureBootstrapMethodCall({
        sourceFile,
        receiver: operation.receiver,
        method: operation.method,
        arguments: operation.arguments,
      })
    })
  }
}
