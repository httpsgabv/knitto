import type { FileSystem } from '@adapters/fs/file-system'
import type { ImportEditor } from '@engine/ast/import-editor'
import type { NestBootstrapEditor } from '@engine/ast/nest-bootstrap-editor'
import type { NestModuleEditor } from '@engine/ast/nest-module-editor'
import type { SourceFileEditor } from '@engine/ast/source-file-editor'
import type { PackageJsonMerger } from '@engine/merge/package-json-merger'
import type { EnvMerger } from '../merge/env-merger'
import type { LineAppender } from '../merge/line-appender'
import type { ReadmeMerger } from '../merge/readme-merger'
import type { VariableRenderer } from './variable-renderer'

export type OperationContext = {
  fileSystem: FileSystem
  variableRenderer: VariableRenderer
  packageJsonMerger: PackageJsonMerger
  envMerger: EnvMerger
  lineAppender: LineAppender
  readmeMerger: ReadmeMerger
  sourceFileEditor: SourceFileEditor
  importEditor: ImportEditor
  nestModuleEditor: NestModuleEditor
  nestBootstrapEditor: NestBootstrapEditor
  variables: Record<string, string>
}

export type OperationBaseContext = Omit<OperationContext, 'variables'>
