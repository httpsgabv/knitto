import { ZodError } from 'zod'
import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'
import type { Manifest } from '@core/manifest/manifest'
import { ManifestSchema } from '@core/manifest/manifest.schema'

export class ManifestValidator {
  validate(input: unknown): Manifest {
    try {
      console.log(input)
      return ManifestSchema.parse(input)
    } catch (error) {
      if (error instanceof ZodError) {
        throw new KnittoError(
          error.issues[0]?.message ?? 'Invalid template manifest',
          Errors.INVALID_TEMPLATE_MANIFEST,
          error.issues
        )
      }

      throw error
    }
  }
}
