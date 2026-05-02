import z from 'zod'
import { BaseManifestSchema } from './manifest.schema'

export const FeatureManifestSchema = BaseManifestSchema.extend({
  type: z.literal('feature'),
  supports: z.array(z.string()).min(1),
})
