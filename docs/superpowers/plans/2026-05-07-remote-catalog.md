# Remote Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load kits and features from a repo-level `knitto-catalog.json` in `httpsgabv/knitto-templates`, while falling back to the bundled catalog snapshot when the remote manifest cannot be loaded.

**Architecture:** Add a small GitHub catalog client that downloads and validates `knitto-catalog.json`, then wrap it in a loader that returns an `OfficialCatalog` using remote data on success and bundled data on failure. Make CLI bootstrap asynchronous so the resolved catalog is loaded once and reused by prompts, list commands, feature resolution, and project creation.

**Tech Stack:** TypeScript, Vitest, Zod, Commander, Node built-in `fetch`

---

## File Structure

- Create: `src/core/catalog/catalog-data.ts`
- Create: `src/adapters/catalog/github-catalog-manifest-client.ts`
- Create: `src/adapters/catalog/github-catalog-manifest-client.test.ts`
- Create: `src/catalog/load-catalog.ts`
- Create: `src/catalog/load-catalog.test.ts`
- Modify: `src/cli/bootstrap.ts`
- Modify: `src/cli/bootstrap.test.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/cli/index.test.ts`
- Modify: `README.md`
- Create in templates repo: `knitto-templates/knitto-catalog.json`

### Task 1: Add the remote catalog payload type and GitHub manifest client

**Files:**

- Create: `src/core/catalog/catalog-data.ts`
- Create: `src/adapters/catalog/github-catalog-manifest-client.ts`
- Test: `src/adapters/catalog/github-catalog-manifest-client.test.ts`

- [ ] **Step 1: Write the failing client tests**

```ts
import { describe, expect, it, vi } from 'vitest'
import { GithubCatalogManifestClient } from './github-catalog-manifest-client'

const encodedCatalog = Buffer.from(
  JSON.stringify({
    kits: [
      {
        slug: 'nestjs',
        name: 'NestJS',
        description: 'A NestJS starter for building modular APIs.',
        source: {
          type: 'github',
          repo: 'httpsgabv/knitto-templates',
          path: '/kits/',
          name: 'nest-api',
        },
        compatibleFeatures: ['pino-logging'],
      },
    ],
    features: [
      {
        slug: 'pino-logging',
        name: 'Pino Logging',
        description: 'Add a basic Pino logging setup.',
        source: {
          type: 'github',
          repo: 'httpsgabv/knitto-templates',
          path: '/features/',
          name: 'feature-pino',
        },
        supports: ['nestjs'],
        requires: [],
        conflictsWith: [],
      },
    ],
  })
).toString('base64')

describe('GithubCatalogManifestClient', () => {
  it('loads and validates knitto-catalog.json from the GitHub contents API', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        content: encodedCatalog,
        encoding: 'base64',
      }),
    })
    const client = new GithubCatalogManifestClient(fetchFn as typeof fetch)

    const result = await client.load('httpsgabv/knitto-templates')

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.github.com/repos/httpsgabv/knitto-templates/contents/knitto-catalog.json'
    )
    expect(result.kits[0]?.slug).toBe('nestjs')
    expect(result.features[0]?.slug).toBe('pino-logging')
  })

  it('throws when GitHub returns a non-success response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    const client = new GithubCatalogManifestClient(fetchFn as typeof fetch)

    await expect(client.load('httpsgabv/knitto-templates')).rejects.toThrow(
      'Failed to load remote catalog: HTTP 404'
    )
  })
})
```

- [ ] **Step 2: Run the targeted tests and verify they fail**

Run: `pnpm vitest run src/adapters/catalog/github-catalog-manifest-client.test.ts`
Expected: FAIL with module-not-found errors for `github-catalog-manifest-client` and `catalog-data`

- [ ] **Step 3: Implement the shared payload type and GitHub client**

```ts
// src/core/catalog/catalog-data.ts
import { CatalogSchema } from './catalog.schema'

export type CatalogData = ReturnType<typeof CatalogSchema.parse>
```

```ts
// src/adapters/catalog/github-catalog-manifest-client.ts
import { CatalogSchema } from '@core/catalog/catalog.schema'
import type { CatalogData } from '@core/catalog/catalog-data'

export class GithubCatalogManifestClient {
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
```

- [ ] **Step 4: Run the targeted tests and verify they pass**

Run: `pnpm vitest run src/adapters/catalog/github-catalog-manifest-client.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the client work**

```bash
git add src/core/catalog/catalog-data.ts src/adapters/catalog/github-catalog-manifest-client.ts src/adapters/catalog/github-catalog-manifest-client.test.ts
git commit -m "feat: add remote catalog manifest client"
```

### Task 2: Add the catalog loader with bundled fallback

**Files:**

- Create: `src/catalog/load-catalog.ts`
- Test: `src/catalog/load-catalog.test.ts`
- Reuse: `src/catalog/kits.ts`
- Reuse: `src/catalog/features.ts`
- Reuse: `src/catalog/official-catalog.ts`

- [ ] **Step 1: Write the failing loader tests for remote success and fallback paths**

```ts
import { describe, expect, it, vi } from 'vitest'
import { loadCatalog } from './load-catalog'

const remoteData = {
  kits: [
    {
      slug: 'nestjs',
      name: 'NestJS',
      description: 'Remote kit',
      source: {
        type: 'github',
        repo: 'httpsgabv/knitto-templates',
        path: '/kits/',
        name: 'nest-api',
      },
      compatibleFeatures: ['pino-logging'],
    },
  ],
  features: [
    {
      slug: 'pino-logging',
      name: 'Pino Logging',
      description: 'Remote feature',
      source: {
        type: 'github',
        repo: 'httpsgabv/knitto-templates',
        path: '/features/',
        name: 'feature-pino',
      },
      supports: ['nestjs'],
      requires: [],
      conflictsWith: [],
    },
  ],
}

describe('loadCatalog', () => {
  it('returns an OfficialCatalog built from remote data when the fetch succeeds', async () => {
    const catalog = await loadCatalog({
      remoteCatalogClient: { load: vi.fn().mockResolvedValue(remoteData) },
    })

    expect(catalog.getKit('nestjs').description).toBe('Remote kit')
    expect(catalog.getFeature('pino-logging').description).toBe(
      'Remote feature'
    )
  })

  it('falls back to bundled data and reports the reason when the fetch fails', async () => {
    const onFallback = vi.fn()
    const catalog = await loadCatalog({
      remoteCatalogClient: {
        load: vi.fn().mockRejectedValue(new Error('HTTP 404')),
      },
      onFallback,
    })

    expect(onFallback).toHaveBeenCalledWith(expect.any(Error))
    expect(catalog.listKits().length).toBeGreaterThan(0)
    expect(catalog.listFeatures().length).toBeGreaterThan(0)
  })

  it('falls back when the remote payload is invalid for CatalogSchema', async () => {
    const onFallback = vi.fn()

    const catalog = await loadCatalog({
      remoteCatalogClient: {
        load: vi.fn().mockRejectedValue(new Error('invalid remote catalog')),
      },
      onFallback,
    })

    expect(onFallback).toHaveBeenCalledTimes(1)
    expect(catalog.listKits().map((kit) => kit.slug)).toContain('nestjs')
  })
})
```

- [ ] **Step 2: Run the targeted tests and verify they fail**

Run: `pnpm vitest run src/catalog/load-catalog.test.ts`
Expected: FAIL with module-not-found errors for `load-catalog`

- [ ] **Step 3: Implement the fallback loader**

```ts
// src/catalog/load-catalog.ts
import { officialFeatures } from './features'
import { officialKits } from './kits'
import { OfficialCatalog } from './official-catalog'
import type { CatalogData } from '@core/catalog/catalog-data'

type RemoteCatalogClient = {
  load(repo: string): Promise<CatalogData>
}

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
    deps.onFallback?.(error as Error)
    return new OfficialCatalog(officialKits, officialFeatures)
  }
}
```

- [ ] **Step 4: Run the targeted tests and verify they pass**

Run: `pnpm vitest run src/catalog/load-catalog.test.ts src/catalog/official-catalog.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the loader work**

```bash
git add src/catalog/load-catalog.ts src/catalog/load-catalog.test.ts
git commit -m "feat: load remote catalog with fallback"
```

### Task 3: Make bootstrap asynchronous and wire the loader through the CLI

**Files:**

- Modify: `src/cli/bootstrap.ts`
- Modify: `src/cli/bootstrap.test.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/cli/index.test.ts`
- Test: `src/cli/bootstrap.test.ts`
- Test: `src/cli/index.test.ts`

- [ ] **Step 1: Write the failing bootstrap and CLI tests for async app creation**

```ts
import { describe, expect, it, vi } from 'vitest'
import { OfficialCatalog } from '@catalog/official-catalog'
import { createApp } from './bootstrap'

describe('createApp', () => {
  it('awaits the catalog loader and wires the same catalog into the app services', async () => {
    const catalog = new OfficialCatalog(
      [
        {
          slug: 'remote-kit',
          name: 'Remote Kit',
          description: 'Loaded remotely',
          source: {
            type: 'github',
            repo: 'httpsgabv/knitto-templates',
            path: '/kits/',
            name: 'remote-kit',
          },
          compatibleFeatures: [],
        },
      ],
      []
    )

    const app = await createApp({
      loadCatalog: vi.fn().mockResolvedValue(catalog),
    })

    expect(app.catalog).toBe(catalog)
    expect(app.catalog.getKit('remote-kit').description).toBe('Loaded remotely')
  })
})
```

```ts
// src/cli/index.test.ts excerpt
createApp.mockResolvedValue(app)

const { main } = await import('./index')

await main()

expect(createApp).toHaveBeenCalledTimes(1)
expect(makeCreateFlow).toHaveBeenCalledWith({
  catalog: app.catalog,
  createProjectUseCase: app.createProjectUseCase,
})
```

- [ ] **Step 2: Run the targeted tests and verify they fail**

Run: `pnpm vitest run src/cli/bootstrap.test.ts src/cli/index.test.ts`
Expected: FAIL because `createApp()` is still synchronous and `index.ts` does not await it

- [ ] **Step 3: Implement async bootstrap, fallback notice, and CLI await points**

```ts
// src/cli/bootstrap.ts
import { GithubCatalogManifestClient } from '@adapters/catalog/github-catalog-manifest-client'
import { loadCatalog } from '@catalog/load-catalog'
import { printer } from '@cli/output/printer'

export async function createApp(
  options: {
    loadCatalog?: () => Promise<Catalog>
  } = {}
): Promise<App> {
  const catalog =
    (await options.loadCatalog?.()) ??
    (await loadCatalog({
      remoteCatalogClient: new GithubCatalogManifestClient(fetch),
      onFallback: () => {
        printer.info(
          'Using bundled catalog snapshot because remote catalog could not be loaded.'
        )
      },
    }))

  // keep the rest of the current wiring unchanged
}
```

```ts
// src/cli/index.ts
export async function main(): Promise<void> {
  const app = await createApp()

  const runCreateFlow = makeCreateFlow({
    catalog: app.catalog,
    createProjectUseCase: app.createProjectUseCase,
  })

  // keep command registration unchanged
}
```

- [ ] **Step 4: Run the targeted tests and verify they pass**

Run: `pnpm vitest run src/cli/bootstrap.test.ts src/cli/index.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the bootstrap work**

```bash
git add src/cli/bootstrap.ts src/cli/bootstrap.test.ts src/cli/index.ts src/cli/index.test.ts
git commit -m "feat: wire remote catalog into cli bootstrap"
```

### Task 4: Add user-facing verification and documentation for the new catalog source

**Files:**

- Modify: `README.md`
- Test: `src/catalog/load-catalog.test.ts`
- Test: `src/cli/prompts/create-project.prompt.test.ts`

- [ ] **Step 1: Write the prompt compatibility test for dynamically loaded catalog data**

```ts
import { describe, expect, it, vi } from 'vitest'
import { checkbox } from '@inquirer/prompts'
import { OfficialCatalog } from '@catalog/official-catalog'
import { createProjectPrompt } from './create-project.prompt'

describe('createProjectPrompt with loaded catalog data', () => {
  it('offers a remotely loaded feature when it is compatible with the selected kit', async () => {
    const catalog = new OfficialCatalog(
      [
        {
          slug: 'nestjs',
          name: 'NestJS',
          description: 'Remote kit',
          source: {
            type: 'github',
            repo: 'httpsgabv/knitto-templates',
            path: '/kits/',
            name: 'nest-api',
          },
          compatibleFeatures: ['pino-logging'],
        },
      ],
      [
        {
          slug: 'pino-logging',
          name: 'Pino Logging',
          description: 'Remote feature',
          source: {
            type: 'github',
            repo: 'httpsgabv/knitto-templates',
            path: '/features/',
            name: 'feature-pino',
          },
          supports: ['nestjs'],
          requires: [],
          conflictsWith: [],
        },
      ]
    )

    vi.mocked(checkbox).mockResolvedValue(['pino-logging'])

    const answers = await createProjectPrompt(catalog, {
      projectName: 'demo-app',
      kitSlug: 'nestjs',
      packageManager: 'pnpm',
      installDependencies: false,
      initializeGit: false,
    })

    expect(answers.featureSlugs).toEqual(['pino-logging'])
  })
})
```

- [ ] **Step 2: Run the targeted tests and confirm the prompt still works with loaded catalog data**

Run: `pnpm vitest run src/catalog/load-catalog.test.ts src/cli/prompts/create-project.prompt.test.ts`
Expected: PASS

- [ ] **Step 3: Document the new source of truth and fallback behavior**

```md
## Catalog Source

`knitto` now discovers kits and features from `knitto-catalog.json` in `httpsgabv/knitto-templates`.

- Add new kits or features in the templates repo by:
  1. adding the template directory and its local `knitto.json`
  2. adding the entry to `knitto-catalog.json`
- If the remote catalog cannot be loaded, `knitto` falls back to the bundled catalog snapshot included in this package.
```

- [ ] **Step 4: Run the targeted tests and sanity checks**

Run: `pnpm vitest run src/catalog/load-catalog.test.ts src/cli/prompts/create-project.prompt.test.ts && pnpm format:check`
Expected: PASS

- [ ] **Step 5: Commit the verification and docs work**

```bash
git add README.md src/catalog/load-catalog.test.ts src/cli/prompts/create-project.prompt.test.ts
git commit -m "docs: explain remote catalog source"
```

### Task 5: Publish the root catalog manifest in `knitto-templates`

**Files:**

- Create in templates repo: `knitto-templates/knitto-catalog.json`

- [ ] **Step 1: Create the repo-level manifest with the current bundled entries**

```json
{
  "kits": [
    {
      "slug": "nestjs",
      "name": "NestJS",
      "description": "A NestJS starter for building modular APIs.",
      "source": {
        "type": "github",
        "repo": "httpsgabv/knitto-templates",
        "name": "nest-api",
        "path": "/kits/"
      },
      "compatibleFeatures": [
        "pino-logging",
        "sentry-nest",
        "scalar-nest",
        "helmet-nest",
        "throttler-nest",
        "husky-git-hooks"
      ]
    }
  ],
  "features": [
    {
      "slug": "pino-logging",
      "name": "Pino Logging",
      "description": "Add a basic Pino logging setup.",
      "source": {
        "type": "github",
        "repo": "httpsgabv/knitto-templates",
        "name": "feature-pino",
        "path": "/features/"
      },
      "supports": ["nestjs"],
      "requires": [],
      "conflictsWith": []
    }
  ]
}
```

- [ ] **Step 2: Verify the manifest is reachable through the GitHub contents API**

Run: `gh api repos/httpsgabv/knitto-templates/contents/knitto-catalog.json`
Expected: JSON payload with `encoding: "base64"` and the file content present

- [ ] **Step 3: Verify the CLI can consume the published manifest**

Run: `pnpm vitest run src/adapters/catalog/github-catalog-manifest-client.test.ts src/catalog/load-catalog.test.ts src/cli/bootstrap.test.ts src/cli/index.test.ts`
Expected: PASS

- [ ] **Step 4: Run the final verification suite**

Run: `pnpm test && pnpm typecheck && pnpm build`
Expected: PASS

- [ ] **Step 5: Commit the templates repo manifest**

```bash
git -C ../knitto-templates add knitto-catalog.json
git -C ../knitto-templates commit -m "feat: add root catalog manifest"
```
