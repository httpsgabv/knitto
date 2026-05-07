import type { RemoteCatalogClient } from '@adapters/github-catalog/remote-catalog-client'
import { OfficialCatalog } from './official-catalog'
import { officialKits } from './kits'
import { officialFeatures } from './features'

export async function loadCatalog(deps: {
  remoteCatalogClient: RemoteCatalogClient
  onFallback?: (error: Error) => void
}): Promise<OfficialCatalog> {
  try {
    const data = await deps.remoteCatalogClient.load(
      'httpsgabv/knitto-templates'
    )
    return new OfficialCatalog(data.kits, data.features)
  } catch (error) {
    deps.onFallback(error as Error)
    return new OfficialCatalog(officialKits, officialFeatures)
  }
}
