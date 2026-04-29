import { ZodError } from 'zod'
import type { Catalog } from '../core/catalog/catalog'
import { CatalogSchema } from '../core/catalog/catalog.schema'
import type { Kit } from '../core/catalog/kit'
import { officialKits } from './kits'
import { KnittoError } from '../core/errors/knitto-error'
import { Errors } from '../core/errors/errors'

export class OfficialCatalog implements Catalog {
  private readonly kits: Kit[]

  constructor() {
    try {
      const parsed = CatalogSchema.parse({
        kits: officialKits,
      })

      this.kits = parsed.kits
    } catch (error) {
      if (error instanceof ZodError) {
        throw new KnittoError(
          error.issues[0]?.message ?? 'Invalid catalog configuration',
          Errors.INVALID_CATALOG_CONFIGURATION,
          error.issues
        )
      }

      throw error
    }
  }

  listKits(): Kit[] {
    return [...this.kits]
  }

  getKit(slug: string): Kit {
    const kit = this.kits.find((kit) => kit.slug === slug)
    if (!kit) {
      throw new KnittoError(`Unknown kit: ${slug}`, Errors.KIT_NOT_FOUND)
    }

    return kit
  }
}
