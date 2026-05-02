import type { OperationOrigin } from '@core/generation/file-operation'
import type { ManifestOperation } from '@core/manifest/manifest-operation'

export type ConcreteManifestOperation = Exclude<
  ManifestOperation,
  { type: 'add-all' }
>

export interface ManifestOperationBuildContext<
  T extends ConcreteManifestOperation = ConcreteManifestOperation,
> {
  operation: T
  templateDir: string
  targetDir: string
  origin: OperationOrigin
  description: string
  resolveSource: (source: string) => string
  resolveTarget: (target: string) => string
}
