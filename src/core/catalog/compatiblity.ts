import type { Feature } from './feature'
import type { Kit } from './kit'

export type CompatibilityCheckInput = {
  kit: Kit
  features: Feature[]
}
