import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'
import type { FeatureManifest, KitManifest } from '@core/manifest/manifest'
import { normalizeSystemPath } from '@shared/paths'
import path from 'node:path'
import type { PlanInput } from './plan-input'

export class ManifestPlanningInputValidator {
  validate(input: PlanInput): {
    kitManifest: KitManifest
    featureManifests: FeatureManifest[]
  } {
    this.assertAlignedFeatureInputs(input)

    return {
      kitManifest: this.requireKitManifest(input),
      featureManifests: this.requireFeatureManifests(input),
    }
  }

  private assertAlignedFeatureInputs(input: PlanInput): void {
    if (input.featureTemplates.length !== input.features.length) {
      throw new Error('Feature templates must align with selected features')
    }

    if (input.featureManifests.length !== input.features.length) {
      throw new Error('Feature manifests must align with selected features')
    }

    for (const [index, feature] of input.features.entries()) {
      const manifest = input.featureManifests[index]

      if (manifest === undefined) {
        throw new Error('Feature manifests must align with selected features')
      }

      if (manifest !== null && manifest.slug !== feature.slug) {
        throw new Error('Feature manifest order does not match selected features')
      }
    }
  }

  private requireKitManifest(input: PlanInput): KitManifest {
    if (input.kitManifest !== null) {
      return input.kitManifest
    }

    throw this.createMissingManifestError(
      'kit',
      input.kit.slug,
      input.kitTemplate.rootPath
    )
  }

  private requireFeatureManifests(input: PlanInput): FeatureManifest[] {
    return input.features.map((feature, index) => {
      const manifest = input.featureManifests[index]

      if (manifest === undefined) {
        throw new Error('Feature manifests must align with selected features')
      }

      if (manifest !== null) {
        return manifest
      }

      const template = input.featureTemplates[index]

      throw this.createMissingManifestError(
        'feature',
        feature.slug,
        template?.rootPath ?? ''
      )
    })
  }

  private createMissingManifestError(
    type: 'feature' | 'kit',
    slug: string,
    templateRoot: string
  ): KnittoError {
    const manifestPath = normalizeSystemPath(
      path.join(templateRoot, 'knitto.json')
    )

    return new KnittoError(
      `Template manifest missing for ${type} "${slug}": ${manifestPath}`,
      Errors.MISSING_TEMPLATE_MANIFEST,
      { type, slug, manifestPath }
    )
  }
}
