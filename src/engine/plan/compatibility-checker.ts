import type { CompatibilityCheckInput } from '../../core/catalog/compatiblity'
import { Errors } from '../../core/errors/errors'
import { KnittoError } from '../../core/errors/knitto-error'

export class CompatibilityChecker {
  check(input: CompatibilityCheckInput) {
    const selectedSlugs = new Set(input.features.map((feature) => feature.slug))
    const compatibleFeatures = new Set(input.kit.compatibleFeatures)

    for (const feature of input.features) {
      if (
        !compatibleFeatures.has(feature.slug) ||
        !feature.supports.includes(input.kit.slug)
      ) {
        throw new KnittoError(
          `Feature "${feature.slug}" is not compatible with kit "${input.kit.slug}"`,
          Errors.INCOMPATIBLE_FEATURE
        )
      }

      for (const requiredSlug of feature.requires) {
        if (!selectedSlugs.has(requiredSlug)) {
          throw new KnittoError(
            `Feature "${feature.slug}" requires "${requiredSlug}"`,
            Errors.MISSING_REQUIRED_FEATURE
          )
        }
      }

      for (const conflictSlug of feature.conflictsWith) {
        if (selectedSlugs.has(conflictSlug)) {
          throw new KnittoError(
            `Feature "${feature.slug}" conflicts with "${conflictSlug}"`,
            Errors.CONFLICTING_FEATURES
          )
        }
      }
    }
  }
}
