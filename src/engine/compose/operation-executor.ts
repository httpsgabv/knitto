import type { FileSystem } from '@adapters/fs/file-system'
import type { FileOperation } from '@core/generation/file-operation'
import type { VariableRenderer } from './variable-renderer'
import type { PackageJsonMerger } from '@engine/merge/package-json-merger'
import type { EnvMerger } from '../merge/env-merger'
import type { ReadmeMerger } from '../merge/readme-merger'
import { createHandlers } from './handlers/create-handlers'

export class OperationExecutor {
  constructor(
    private readonly fileSystem: FileSystem,
    private readonly variableRenderer: VariableRenderer,
    private readonly packageJsonMerger: PackageJsonMerger,
    private readonly envMerger: EnvMerger,
    private readonly readmeMerger: ReadmeMerger
  ) {}

  async execute(operation: FileOperation, variables: Record<string, string>) {
    const context = {
      fileSystem: this.fileSystem,
      variableRenderer: this.variableRenderer,
      packageJsonMerger: this.packageJsonMerger,
      envMerger: this.envMerger,
      readmeMerger: this.readmeMerger,
      variables,
    }

    const handler = createHandlers().get(operation.type)
    if (!handler) {
      throw new Error(
        `No handler registered for operation type: ${operation.type}`
      )
    }

    await handler.execute(operation, context)
  }
}
