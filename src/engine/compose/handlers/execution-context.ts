import type { FileSystem } from '@adapters/fs/file-system'
import type { PackageJsonMerger } from '@engine/merge/package-json-merger'
import type { EnvMerger } from '@engine/merge/env-merger'
import type { ReadmeMerger } from '@engine/merge/readme-merger'
import type { VariableRenderer } from '../variable-renderer'

export type ExecutionContext = {
  fileSystem: FileSystem
  variableRenderer: VariableRenderer
  packageJsonMerger: PackageJsonMerger
  envMerger: EnvMerger
  readmeMerger: ReadmeMerger
  variables: Record<string, string>
}
