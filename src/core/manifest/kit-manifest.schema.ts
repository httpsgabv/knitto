import z from 'zod'
import { BaseManifestSchema } from './manifest.schema'

export const KitManifestSchema = BaseManifestSchema.extend({
  type: z.literal('kit'),
})
