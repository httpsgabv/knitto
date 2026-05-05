import type { AstNestAddBootstrapCallOperation } from '@core/generation/ast-operation'
import type { OperationHandler } from '../operation-handler'

export class AstNestAddBootstrapCallHandler
  implements OperationHandler<AstNestAddBootstrapCallOperation>
{
  readonly type = 'ast.nest.add-bootstrap-call' as const

  async execute(
    operation: AstNestAddBootstrapCallOperation,
    { sourceFileEditor, nestBootstrapEditor }: Parameters<
      OperationHandler<AstNestAddBootstrapCallOperation>['execute']
    >[1]
  ) {
    await sourceFileEditor.edit(operation.target, (sourceFile) => {
      nestBootstrapEditor.ensureBootstrapCall({
        sourceFile,
        appVar: operation.appVar,
        call: operation.call,
      })
    })
  }
}
