import type { Catalog } from '../../core/catalog/catalog'
import type { Feature } from '../../core/catalog/feature'
import type { Kit } from '../../core/catalog/kit'
import { Errors } from '../../core/errors/errors'
import { KnittoError } from '../../core/errors/knitto-error'
import { unique } from '../../shared/array'

export type ResolveFeaturesInput = {
  kit: Kit
  featureSlugs: string[]
}

export class FeatureResolver {
  constructor(private readonly catalog: Catalog) {}

  resolve(input: ResolveFeaturesInput): Feature[] {
    const requestedSlugs = unique(input.featureSlugs)
    const resolved = new Map<string, Feature>()

    for (const slug of requestedSlugs) {
      this.addFeature(slug, resolved)
    }

    return Array.from(resolved.values())
  }

  private addFeature(slug: string, resolved: Map<string, Feature>) {
    if (resolved.has(slug)) {
      return
    }

    const feature = this.catalog.getFeature(slug)
    resolved.set(slug, feature)

    for (const dependencySlug of feature.requires) {
      if (dependencySlug === slug) {
        throw new KnittoError(
          `Feature "${slug}" cannot require itself`,
          Errors.INVALID_FEATURE_REQUIREMENT
        )
      }

      this.addFeature(dependencySlug, resolved)
    }
  }
}
