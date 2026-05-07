import path from 'node:path'
import type { CopyFileOperation } from '@core/generation/file-operation'
import type { OperationHandler } from '../operation-handler'

export class CopyFileHandler implements OperationHandler<CopyFileOperation> {
  readonly type = 'copy-file' as const

  async execute(
    operation: CopyFileOperation,
    {
      fileSystem,
      variableRenderer,
      variables,
    }: Parameters<OperationHandler<CopyFileOperation>['execute']>[1]
  ) {
    if (
      !operation.overwrite &&
      (await fileSystem.pathExists(operation.target))
    ) {
      return
    }

    const content = await fileSystem.readFile(operation.source, 'utf-8')
    const rendered = operation.renderVariables
      ? variableRenderer.render(operation.source, content, variables)
      : content

    await fileSystem.ensureDir(path.dirname(operation.target))
    await fileSystem.writeFile(operation.target, rendered)
  }
}
