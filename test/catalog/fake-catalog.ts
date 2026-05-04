import type { Catalog } from '@core/catalog/catalog'
import type { Feature } from '@core/catalog/feature'
import type { Kit } from '@core/catalog/kit'

export class FakeCatalog implements Catalog {
  private kits: Kit[] = []
  private features: Feature[] = []

  listKits(): Kit[] {
    return this.kits
  }

  listFeatures(): Feature[] {
    return this.features
  }

  getKit(slug: string): Kit {
    const kit = this.kits.find((candidate) => candidate.slug === slug)

    if (kit === undefined) {
      throw new Error(`Unknown kit: ${slug}`)
    }

    return kit
  }

  getFeature(slug: string): Feature {
    const feature = this.features.find((candidate) => candidate.slug === slug)

    if (feature === undefined) {
      throw new Error(`Unknown feature: ${slug}`)
    }

    return feature
  }

  addKit(kit: Kit): void {
    this.kits.push(kit)
  }

  addFeature(feature: Feature): void {
    this.features.push(feature)
  }

  setKits(kits: Kit[]): void {
    this.kits = kits
  }

  setFeatures(features: Feature[]): void {
    this.features = features
  }
}
