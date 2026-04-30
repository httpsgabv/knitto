import { ZodError } from 'zod'
import type { Catalog } from '@core/catalog/catalog'
import { CatalogSchema } from '@core/catalog/catalog.schema'
import type { Kit } from '@core/catalog/kit'
import { officialKits } from './kits'
import { KnittoError } from '@core/errors/knitto-error'
import { Errors } from '@core/errors/errors'
import type { Feature } from '@core/catalog/feature'
import { officialFeatures } from './features'

export class OfficialCatalog implements Catalog {
  private readonly kits: Kit[]
  private readonly features: Feature[]

  constructor() {
    try {
      const parsed = CatalogSchema.parse({
        kits: officialKits,
        features: officialFeatures,
      })

      this.kits = parsed.kits
      this.features = parsed.features
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

  listFeatures(): Feature[] {
    return [...this.features]
  }

  getKit(slug: string): Kit {
    const kit = this.kits.find((kit) => kit.slug === slug)
    if (!kit) {
      throw new KnittoError(`Unknown kit: ${slug}`, Errors.KIT_NOT_FOUND)
    }

    return kit
  }

  getFeature(slug: string): Feature {
    const feature = this.features.find((feature) => feature.slug === slug)
    if (!feature) {
      throw new KnittoError(
        `Unknown feature: ${slug}`,
        Errors.FEATURE_NOT_FOUND
      )
    }

    return feature
  }
}
