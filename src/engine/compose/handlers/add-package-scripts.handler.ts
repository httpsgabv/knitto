import type { AddPackageScriptsOperation } from '@core/generation/file-operation'
import type { OperationHandler } from '../operation-handler'

export class AddPackageScriptsHandler implements OperationHandler<AddPackageScriptsOperation> {
  readonly type = 'add-package-scripts' as const

  async execute(
    operation: AddPackageScriptsOperation,
    {
      packageJsonMerger,
    }: Parameters<OperationHandler<AddPackageScriptsOperation>['execute']>[1]
  ) {
    await packageJsonMerger.addScripts(operation.target, operation.scripts)
  }
}
