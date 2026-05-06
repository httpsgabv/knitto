import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'
import {
  isSystemAbsolutePath,
  normalizeRelativePath,
  normalizeSystemPath,
  relativeSystemPath,
  resolveSystemPath,
} from '@shared/paths'

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
    const resolvedPath = resolveSystemPath(
      normalizedRootDir,
      normalizedManifestPath
    )
    const relativePath = normalizeRelativePath(
      relativeSystemPath(normalizedRootDir, resolvedPath)
    )

    if (
      relativePath === '' ||
      (!relativePath.startsWith('..') && !isSystemAbsolutePath(relativePath))
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
