import z from 'zod'
import { ManifestOperationSchema } from './manifest-operation.schema'

export const ManifestFileRulesSchema = z.object({
  include: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
})

export const BaseManifestSchema = z.object({
  schemaVersion: z.literal(1),
  type: z.enum(['kit', 'feature']),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  supports: z.array(z.string()),
  requires: z.array(z.string()),
  conflictsWith: z.array(z.string()),
  files: ManifestFileRulesSchema.optional(),
  operations: z.array(ManifestOperationSchema).default([]),
})

export const ManifestSchema = z.discriminatedUnion('type', [
  BaseManifestSchema.extend({
    type: z.literal('kit'),
  }),
  BaseManifestSchema.extend({
    type: z.literal('feature'),
    supports: z.array(z.string()).min(1),
  }),
])
