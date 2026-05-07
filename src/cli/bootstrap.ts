import { GithubCatalogManifestClient } from '@adapters/github-catalog/github-catalog-manifest-client'
import { printer } from './output/printer'
import { loadCatalog } from '@catalog/load-catalog'
import type { Catalog } from '@core/catalog/catalog'
import { createEngine } from '@engine/create-engine'
import type { CreateProjectUseCase } from '@engine/create-project/create-project.use-case'

export type App = {
  catalog: Catalog
  createProjectUseCase: CreateProjectUseCase
}

export async function createApp(): Promise<App> {
  const catalog =
    (await loadCatalog({
      remoteCatalogClient: new GithubCatalogManifestClient(fetch),
      onFallback: () => {
        printer.info(
          'Using bundled catalog snapshot because remote catalog could not be loaded.'
        )
      },
    }))

  const engine = createEngine(catalog)

  return {
    catalog,
    createProjectUseCase: engine.createProjectUseCase,
  }
}
