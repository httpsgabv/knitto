import type { FileSystem } from '@adapters/fs/file-system'
import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'
import { joinSystemPath } from '@shared/paths'

export class ManifestReader {
  constructor(private readonly fileSystem: FileSystem) {}

  async read(templateRoot: string): Promise<null | Record<string, unknown>> {
    const manifestPath = joinSystemPath(templateRoot, 'knitto.json')

    if (!(await this.fileSystem.pathExists(manifestPath))) {
      return null
    }

    try {
      return await this.fileSystem.readJson<Record<string, unknown>>(manifestPath)
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new KnittoError(
          'Invalid template manifest',
          Errors.INVALID_TEMPLATE_MANIFEST,
          error
        )
      }

      throw error
    }
  }
}
