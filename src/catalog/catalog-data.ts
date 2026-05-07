import type { CatalogSchema } from '@core/catalog/catalog.schema'

export type CatalogData = ReturnType<typeof CatalogSchema.parse>
