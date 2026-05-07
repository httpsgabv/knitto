import z from 'zod'
import { KitSchema } from './kit'
import { FeatureSchema } from './feature'

export const CatalogSchema = z.object({
  kits: z.array(KitSchema),
  features: z.array(FeatureSchema),
})

export type CatalogData = z.infer<typeof CatalogSchema>