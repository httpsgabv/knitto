import type { CatalogData } from "@core/catalog/catalog.schema";

export interface RemoteCatalogClient {
  load(repo: string): Promise<CatalogData>
}
