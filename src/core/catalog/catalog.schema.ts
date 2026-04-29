import z from 'zod'
import { KitSchema } from './kit'

export const CatalogSchema = z.object({
  kits: z.array(KitSchema),
})
