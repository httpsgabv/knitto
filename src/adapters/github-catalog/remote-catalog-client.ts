import type { CatalogData } from '@catalog/catalog-data'

export interface RemoteCatalogClient {
  load(repo: string): Promise<CatalogData>
}
