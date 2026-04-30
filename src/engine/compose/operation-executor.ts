import path from 'node:path'
import type { FileSystem } from '../../adapters/fs/file-system'
import type { FileOperation } from '../../core/generation/file-operation'
import type { VariableRenderer } from './variable-renderer'
import type { PackageJsonMerger } from '../merge/package-json-merger'
import type { EnvMerger } from '../merge/env-merger'
import type { ReadmeMerger } from '../merge/readme-merger'

export class OperationExecutor {
  constructor(
    private readonly fileSystem: FileSystem,
    private readonly variableRenderer: VariableRenderer,
    private readonly packageJsonMerger: PackageJsonMerger,
    private readonly envMerger: EnvMerger,
    private readonly readmeMerger: ReadmeMerger
  ) {}

  async execute(operation: FileOperation, variables: Record<string, string>) {
    switch (operation.type) {
      case 'copy-file': {
        const content = await this.fileSystem.readFile(
          operation.source,
          'utf-8'
        )
        const rendered = operation.renderVariables
          ? this.variableRenderer.render(operation.source, content, variables)
          : content

        await this.fileSystem.ensureDir(path.dirname(operation.target))
        await this.fileSystem.writeFile(operation.target, rendered)
        return
      }

      case 'merge-package-json':
        await this.packageJsonMerger.merge(operation.source, operation.target)
        return
      case 'append-env':
        await this.envMerger.merge(operation.source, operation.target)
        return
      case 'append-readme':
        await this.readmeMerger.merge(
          operation.source,
          operation.target,
          operation.heading
        )
        return
      case 'skip-file':
        return
    }
  }
}
