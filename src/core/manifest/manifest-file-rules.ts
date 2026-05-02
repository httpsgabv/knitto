import type z from 'zod'
import { ManifestFileRulesSchema } from './manifest.schema'

export type ManifestFileRules = z.infer<typeof ManifestFileRulesSchema>
