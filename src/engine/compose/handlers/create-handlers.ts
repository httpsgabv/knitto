import type { FileOperation } from '@core/generation/file-operation'
import type { OperationHandler } from '../operation-handler'
import { AppendEnvHandler } from './append-env.handler'
import { AppendReadmeHandler } from './append-readme.handler'
import { CopyFileHandler } from './copy-file.handler'
import { MergePackageJsonHandler } from './merge-package-json.handler'
import { SkipFileHandler } from './skip-file.handler'

type HandlerMap = Map<FileOperation['type'], OperationHandler<FileOperation>>
type OperationHandlerRegistry = {
  [K in FileOperation['type']]: OperationHandler<
    Extract<FileOperation, { type: K }>
  >
}

export function createHandlers(): HandlerMap {
  const handlers: OperationHandlerRegistry = {
    'copy-file': new CopyFileHandler(),
    'merge-package-json': new MergePackageJsonHandler(),
    'append-env': new AppendEnvHandler(),
    'append-readme': new AppendReadmeHandler(),
    'skip-file': new SkipFileHandler(),
  }

  return new Map(
    Object.values(handlers).map((handler) => [
      handler.type,
      handler as OperationHandler<FileOperation>,
    ])
  )
}
