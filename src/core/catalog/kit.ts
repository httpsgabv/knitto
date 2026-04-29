import z from 'zod'
import { TemplateSourceSchema, type TemplateSource } from './template-source'

export const KitSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  source: TemplateSourceSchema,
  description: z.string().min(1),
})

export type Kit = {
  name: string
  slug: string
  source: TemplateSource
  description: string
}
