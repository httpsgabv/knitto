import { CatalogSchema, type CatalogData } from '@core/catalog/catalog.schema'
import type { RemoteCatalogClient } from './remote-catalog-client'

export class GithubCatalogManifestClient implements RemoteCatalogClient {
  constructor(private readonly fetchFn: typeof fetch) {}

  async load(repo: string): Promise<CatalogData> {
    const response = await this.fetchFn(
      `https://api.github.com/repos/${repo}/contents/knitto-catalog.json`
    )

    if (!response.ok) {
      throw new Error(`Failed to load remote catalog: HTTP ${response.status}`)
    }

    const payload = (await response.json()) as {
      content?: string
      encoding?: string
    }

    if (!payload.content || payload.encoding !== 'base64') {
      throw new Error('Failed to load remote catalog: invalid GitHub payload')
    }

    const decoded = Buffer.from(payload.content, 'base64').toString('utf8')
    return CatalogSchema.parse(JSON.parse(decoded))
  }
}
