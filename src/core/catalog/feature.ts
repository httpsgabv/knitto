import z from 'zod'
import { TemplateSourceSchema } from './template-source'

export const FeatureSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  source: TemplateSourceSchema,
  supports: z.array(z.string()).default([]),
  requires: z.array(z.string()).default([]),
  conflictsWith: z.array(z.string()).default([]),
})

export type Feature = z.infer<typeof FeatureSchema>