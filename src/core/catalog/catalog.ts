import type { Feature } from './feature'
import type { Kit } from './kit'

export interface Catalog {
  listKits(): Kit[]
  listFeatures(): Feature[]
  getKit(slug: string): Kit
  getFeature(slug: string): Feature
}
