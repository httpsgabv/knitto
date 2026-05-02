import type z from 'zod'
import { FeatureManifestSchema } from './feature-manifest.schema'
import { KitManifestSchema } from './kit-manifest.schema'
import { ManifestSchema } from './manifest.schema'

export type KitManifest = z.infer<typeof KitManifestSchema>
export type FeatureManifest = z.infer<typeof FeatureManifestSchema>
export type Manifest = z.infer<typeof ManifestSchema>
