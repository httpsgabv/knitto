import { createId } from '@shared/ids'
import type { AddPackageScriptsManifestOperation } from '@core/manifest/manifest-operation'
import type { ManifestOperationBuildContext } from '../manifest-operation-build-context'
import type { ManifestOperationHandler } from '../manifest-operation-handler'

export class AddPackageScriptsManifestOperationHandler implements ManifestOperationHandler<AddPackageScriptsManifestOperation> {
  readonly type = 'add-package-scripts'

  build({
    operation,
    description,
    origin,
    resolveTarget,
  }: ManifestOperationBuildContext<AddPackageScriptsManifestOperation>) {
    return {
      id: createId('add-package-scripts'),
      type: 'add-package-scripts' as const,
      target: resolveTarget(operation.target),
      scripts: operation.scripts,
      origin,
      description,
    }
  }
}
