import z from 'zod'
import { TemplateSourceSchema, type TemplateSource } from './template-source'

export const FeatureSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  source: TemplateSourceSchema,
  supports: z.array(z.string()).default([]),
  requires: z.array(z.string()).default([]),
  conflictsWith: z.array(z.string()).default([]),
})

export type Feature = {
  slug: string
  name: string
  description: string
  source: TemplateSource
  supports: string[]
  requires: string[]
  conflictsWith: string[]
}
