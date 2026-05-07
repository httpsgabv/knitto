import z from 'zod'
import { TemplateSourceSchema } from './template-source'

export const KitSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  source: TemplateSourceSchema,
  description: z.string().min(1),
  compatibleFeatures: z.array(z.string()).default([]),
})

export type Kit = z.infer<typeof KitSchema>