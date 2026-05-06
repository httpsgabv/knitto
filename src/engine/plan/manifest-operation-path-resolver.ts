import path from 'node:path'
import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'
import { normalizeRelativePath, normalizeSystemPath } from '@shared/paths'

export class ManifestOperationPathResolver {
  resolveSource(rootDir: string, manifestPath: string): string {
    return this.resolveContainedPath(rootDir, manifestPath, 'source')
  }

  resolveTarget(rootDir: string, manifestPath: string): string {
    return this.resolveContainedPath(rootDir, manifestPath, 'target')
  }

  private resolveContainedPath(
    rootDir: string,
    manifestPath: string,
    label: 'source' | 'target'
  ): string {
    const normalizedRootDir = normalizeSystemPath(rootDir)
    const normalizedManifestPath = normalizeRelativePath(manifestPath)
    const resolvedPath = normalizeSystemPath(
      path.resolve(normalizedRootDir, normalizedManifestPath)
    )
    const relativePath = normalizeRelativePath(
      path.relative(normalizedRootDir, resolvedPath)
    )

    if (
      relativePath === '' ||
      (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
    ) {
      return resolvedPath
    }

    throw new KnittoError(
      `Manifest operation ${label} escapes ${label === 'source' ? 'template root' : 'target directory'}: ${manifestPath}`,
      Errors.INVALID_MANIFEST_OPERATION_PATH,
      {
        label,
        manifestPath,
        rootDir: normalizedRootDir,
        resolvedPath,
      }
    )
  }
}
