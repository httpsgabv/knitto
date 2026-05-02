import type { Feature } from '@core/catalog/feature'
import type { Kit } from '@core/catalog/kit'
import { Errors } from '@core/errors/errors'
import type { AstOperation } from '@core/generation/ast-operation'
import type { CopyFileOperation } from '@core/generation/file-operation'
import type { FeatureManifest, KitManifest } from '@core/manifest/manifest'
import type { Template } from '@core/template/template'
import type { TemplateFile } from '@core/template/template-file'
import { describe, expect, it } from 'vitest'
import { FastGlobTemplateFileMatcher } from '@adapters/template-file-matcher/fast-glob-template-file-matcher'
import { ConflictDetector } from './conflict-detector'
import { GenerationPlanner } from './generation-planner'
import { createManifestOperationHandlers } from './handlers/create-manifest-operation-handlers'
import { ManifestFileFilter } from '../manifest/manifest-file-filter'
import { ManifestOperationBuilder } from './manifest-operation-builder'
import { ManifestOperationPathResolver } from './manifest-operation-path-resolver'
import { ManifestOperationsExpander } from './manifest-operations-expander'
import { ManifestPlanningInputValidator } from './manifest-planning-input-validator'
import { OperationSorter } from './operation-sorter'

class InMemoryTemplateScanner {
  constructor(private readonly filesByTemplateRoot: Record<string, TemplateFile[]>) {}

  async scan(template: Template): Promise<TemplateFile[]> {
    return this.filesByTemplateRoot[template.rootPath] ?? []
  }
}

const kitFixture: Kit = {
  name: 'Base Kit',
  slug: 'base-kit',
  description: 'Base kit fixture',
  source: {
    type: 'github',
    repo: 'knitto/base-kit',
    name: 'base-kit',
    path: '.',
  },
  compatibleFeatures: [],
}

const featureFixture: Feature = {
  name: 'Authentication',
  slug: 'auth',
  description: 'Auth feature fixture',
  source: {
    type: 'github',
    repo: 'knitto/auth',
    name: 'auth',
    path: '.',
  },
  supports: [],
  requires: [],
  conflictsWith: [],
}

const kitTemplate: Template = { rootPath: '/templates/base-kit' }
const featureTemplate: Template = { rootPath: '/templates/auth' }

function createPlanner(filesByTemplateRoot: Record<string, TemplateFile[]>) {
  return new GenerationPlanner(
    new InMemoryTemplateScanner(filesByTemplateRoot) as never,
    new OperationSorter(),
    new ConflictDetector(),
    new ManifestFileFilter(new FastGlobTemplateFileMatcher()),
    new ManifestPlanningInputValidator(),
    new ManifestOperationsExpander(
      new ManifestOperationBuilder(
        createManifestOperationHandlers(),
        new ManifestOperationPathResolver()
      )
    )
  )
}

describe('GenerationPlanner', () => {
  it('fails when the kit template is missing knitto.json', async () => {
    const planner = createPlanner({
      [kitTemplate.rootPath]: [
        {
          absolutePath: '/templates/base-kit/src/main.ts',
          relativePath: 'src/main.ts',
        },
      ],
      [featureTemplate.rootPath]: [],
    })

    await expect(
      planner.plan({
        projectName: 'demo-app',
        targetDir: '/projects/demo-app',
        packageManager: 'pnpm',
        kit: kitFixture,
        features: [],
        kitTemplate,
        featureTemplates: [],
        kitManifest: null,
        featureManifests: [],
      } as never)
    ).rejects.toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.MISSING_TEMPLATE_MANIFEST,
        message: 'Template manifest missing for kit "base-kit": /templates/base-kit/knitto.json',
      })
    )
  })

  it('fails when a feature template is missing knitto.json', async () => {
    const planner = createPlanner({
      [kitTemplate.rootPath]: [],
      [featureTemplate.rootPath]: [
        {
          absolutePath: '/templates/auth/src/auth.ts',
          relativePath: 'src/auth.ts',
        },
      ],
    })

    const kitManifest: KitManifest = {
      schemaVersion: 1,
      type: 'kit',
      slug: 'base-kit',
      name: 'Base Kit',
      description: 'Base kit fixture',
      supports: [],
      requires: [],
      conflictsWith: [],
      operations: [],
    }

    await expect(
      planner.plan({
        projectName: 'demo-app',
        targetDir: '/projects/demo-app',
        packageManager: 'pnpm',
        kit: kitFixture,
        features: [featureFixture],
        kitTemplate,
        featureTemplates: [featureTemplate],
        kitManifest,
        featureManifests: [null],
      } as never)
    ).rejects.toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.MISSING_TEMPLATE_MANIFEST,
        message: 'Template manifest missing for feature "auth": /templates/auth/knitto.json',
      })
    )
  })

  it('plans only manifest operations', async () => {
    const planner = createPlanner({
      [kitTemplate.rootPath]: [
        {
          absolutePath: '/templates/base-kit/src/main.ts',
          relativePath: 'src/main.ts',
        },
      ],
      [featureTemplate.rootPath]: [
        {
          absolutePath: '/templates/auth/src/auth.ts',
          relativePath: 'src/auth.ts',
        },
      ],
    })

    const kitManifest: KitManifest = {
      schemaVersion: 1,
      type: 'kit',
      slug: 'base-kit',
      name: 'Base Kit',
      description: 'Base kit fixture',
      supports: [],
      requires: [],
      conflictsWith: [],
      operations: [
        {
          type: 'copy-file',
          source: 'src/main.ts',
          target: 'src/main.ts',
          overwrite: true,
          renderVariables: true,
        },
      ],
    }

    const featureManifest: FeatureManifest = {
      schemaVersion: 1,
      type: 'feature',
      slug: 'auth',
      name: 'Authentication',
      description: 'Auth feature fixture',
      supports: ['node'],
      requires: [],
      conflictsWith: [],
      operations: [
        {
          type: 'ast.add-named-import',
          target: 'src/main.ts',
          named: 'setupAuth',
          from: './auth/setup-auth',
        },
      ],
    }

    const plan = await planner.plan({
      projectName: 'demo-app',
      targetDir: '/projects/demo-app',
      packageManager: 'pnpm',
      kit: kitFixture,
      features: [featureFixture],
      kitTemplate,
      featureTemplates: [featureTemplate],
      kitManifest,
      featureManifests: [featureManifest],
    } as never)

    expect(plan.operations).toEqual([
      expect.objectContaining({
        type: 'copy-file',
        source: '/templates/base-kit/src/main.ts',
        target: '/projects/demo-app/src/main.ts',
        origin: { type: 'kit', slug: 'base-kit' },
      }),
      expect.objectContaining({
        type: 'ast.add-named-import',
        target: '/projects/demo-app/src/main.ts',
        named: 'setupAuth',
        from: './auth/setup-auth',
        origin: { type: 'feature', slug: 'auth' },
      }),
    ])
    expect(plan.operations).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'copy-file',
          source: '/templates/auth/src/auth.ts',
          target: '/projects/demo-app/src/auth.ts',
        }),
      ])
    )
  })

  it('excludes knitto.json from manifest-planned operations', async () => {
    const planner = createPlanner({
      [kitTemplate.rootPath]: [
        {
          absolutePath: '/templates/base-kit/knitto.json',
          relativePath: 'knitto.json',
        },
        {
          absolutePath: '/templates/base-kit/src/main.ts',
          relativePath: 'src/main.ts',
        },
      ],
      [featureTemplate.rootPath]: [],
    })

    const kitManifest: KitManifest = {
      schemaVersion: 1,
      type: 'kit',
      slug: 'base-kit',
      name: 'Base Kit',
      description: 'Base kit fixture',
      supports: [],
      requires: [],
      conflictsWith: [],
      operations: [
        {
          type: 'copy-file',
          source: 'src/main.ts',
          target: 'src/main.ts',
          overwrite: true,
          renderVariables: true,
        },
      ],
    }

    const plan = await planner.plan({
      projectName: 'demo-app',
      targetDir: '/projects/demo-app',
      packageManager: 'pnpm',
      kit: kitFixture,
      features: [],
      kitTemplate,
      featureTemplates: [],
      kitManifest,
      featureManifests: [],
    } as never)

    expect(plan.operations).toEqual([
      expect.objectContaining({
        type: 'copy-file',
        source: '/templates/base-kit/src/main.ts',
        target: '/projects/demo-app/src/main.ts',
      }),
    ])
  })

  it('expands add-all over manifest-filtered template files', async () => {
    const planner = createPlanner({
      [featureTemplate.rootPath]: [
        {
          absolutePath: '/templates/auth/knitto.json',
          relativePath: 'knitto.json',
        },
        {
          absolutePath: '/templates/auth/package.json',
          relativePath: 'package.json',
        },
        {
          absolutePath: '/templates/auth/.env.example',
          relativePath: '.env.example',
        },
        {
          absolutePath: '/templates/auth/README.knitto.md',
          relativePath: 'README.knitto.md',
        },
        {
          absolutePath: '/templates/auth/src/auth.ts',
          relativePath: 'src/auth.ts',
        },
      ],
      [kitTemplate.rootPath]: [],
    })

    const kitManifest: KitManifest = {
      schemaVersion: 1,
      type: 'kit',
      slug: 'base-kit',
      name: 'Base Kit',
      description: 'Base kit fixture',
      supports: [],
      requires: [],
      conflictsWith: [],
      operations: [],
    }

    const featureManifest: FeatureManifest = {
      schemaVersion: 1,
      type: 'feature',
      slug: 'auth',
      name: 'Authentication',
      description: 'Auth feature fixture',
      supports: ['node'],
      requires: [],
      conflictsWith: [],
      operations: [{ type: 'add-all' }],
    }

    const plan = await planner.plan({
      projectName: 'demo-app',
      targetDir: '/projects/demo-app',
      packageManager: 'pnpm',
      kit: kitFixture,
      features: [featureFixture],
      kitTemplate,
      featureTemplates: [featureTemplate],
      kitManifest,
      featureManifests: [featureManifest],
    } as never)

    expect(plan.operations).toEqual([
      expect.objectContaining({
        type: 'merge-package-json',
        source: '/templates/auth/package.json',
        target: '/projects/demo-app/package.json',
      }),
      expect.objectContaining({
        type: 'append-env',
        source: '/templates/auth/.env.example',
        target: '/projects/demo-app/.env.example',
      }),
      expect.objectContaining({
        type: 'append-readme',
        source: '/templates/auth/README.knitto.md',
        target: '/projects/demo-app/README.md',
        heading: 'Authentication',
      }),
      expect.objectContaining({
        type: 'copy-file',
        source: '/templates/auth/src/auth.ts',
        target: '/projects/demo-app/src/auth.ts',
      }),
    ])
  })

  it('lets explicit operations override add-all for the same source file', async () => {
    const planner = createPlanner({
      [featureTemplate.rootPath]: [
        {
          absolutePath: '/templates/auth/package.json',
          relativePath: 'package.json',
        },
        {
          absolutePath: '/templates/auth/src/auth.ts',
          relativePath: 'src/auth.ts',
        },
      ],
      [kitTemplate.rootPath]: [],
    })

    const kitManifest: KitManifest = {
      schemaVersion: 1,
      type: 'kit',
      slug: 'base-kit',
      name: 'Base Kit',
      description: 'Base kit fixture',
      supports: [],
      requires: [],
      conflictsWith: [],
      operations: [],
    }

    const featureManifest: FeatureManifest = {
      schemaVersion: 1,
      type: 'feature',
      slug: 'auth',
      name: 'Authentication',
      description: 'Auth feature fixture',
      supports: ['node'],
      requires: [],
      conflictsWith: [],
      operations: [
        { type: 'add-all' },
        {
          type: 'copy-file',
          source: 'src/auth.ts',
          target: 'src/custom-auth.ts',
          overwrite: false,
          renderVariables: true,
        },
      ],
    }

    const plan = await planner.plan({
      projectName: 'demo-app',
      targetDir: '/projects/demo-app',
      packageManager: 'pnpm',
      kit: kitFixture,
      features: [featureFixture],
      kitTemplate,
      featureTemplates: [featureTemplate],
      kitManifest,
      featureManifests: [featureManifest],
    } as never)

    expect(plan.operations).toEqual([
      expect.objectContaining({
        type: 'merge-package-json',
        source: '/templates/auth/package.json',
        target: '/projects/demo-app/package.json',
      }),
      expect.objectContaining({
        type: 'copy-file',
        source: '/templates/auth/src/auth.ts',
        target: '/projects/demo-app/src/custom-auth.ts',
      }),
    ])
  })

  it('keeps AST ordering for manifest-only operations', async () => {
    const planner = createPlanner({
      [kitTemplate.rootPath]: [
        {
          absolutePath: '/templates/base-kit/src/main.ts',
          relativePath: 'src/main.ts',
        },
      ],
      [featureTemplate.rootPath]: [],
    })

    const kitManifest: KitManifest = {
      schemaVersion: 1,
      type: 'kit',
      slug: 'base-kit',
      name: 'Base Kit',
      description: 'Base kit fixture',
      supports: [],
      requires: [],
      conflictsWith: [],
      operations: [
        {
          type: 'ast.add-named-import',
          target: 'src/main.ts',
          named: 'bootstrapApp',
          from: './bootstrap',
        },
        {
          type: 'copy-file',
          source: 'src/main.ts',
          target: 'src/main.ts',
          overwrite: true,
          renderVariables: true,
        },
      ],
    }

    const plan = await planner.plan({
      projectName: 'demo-app',
      targetDir: '/projects/demo-app',
      packageManager: 'pnpm',
      kit: kitFixture,
      features: [],
      kitTemplate,
      featureTemplates: [],
      kitManifest,
      featureManifests: [],
    } as never)

    expect(plan.operations.map((operation) => operation.type)).toEqual([
      'copy-file',
      'ast.add-named-import',
    ])
  })

  it('detects duplicate manifest operations on the same target', async () => {
    const planner = createPlanner({
      [kitTemplate.rootPath]: [],
      [featureTemplate.rootPath]: [],
    })

    const kitManifest: KitManifest = {
      schemaVersion: 1,
      type: 'kit',
      slug: 'base-kit',
      name: 'Base Kit',
      description: 'Base kit fixture',
      supports: [],
      requires: [],
      conflictsWith: [],
      operations: [
        {
          type: 'copy-file',
          source: 'src/auth.ts',
          target: 'src/auth.ts',
          overwrite: true,
          renderVariables: true,
        },
      ],
    }

    const featureManifest: FeatureManifest = {
      schemaVersion: 1,
      type: 'feature',
      slug: 'auth',
      name: 'Authentication',
      description: 'Auth feature fixture',
      supports: ['node'],
      requires: [],
      conflictsWith: [],
      operations: [
        {
          type: 'copy-file',
          source: 'src/auth.ts',
          target: 'src/auth.ts',
          overwrite: false,
          renderVariables: true,
        },
      ],
    }

    const plan = await planner.plan({
      projectName: 'demo-app',
      targetDir: '/projects/demo-app',
      packageManager: 'pnpm',
      kit: kitFixture,
      features: [featureFixture],
      kitTemplate,
      featureTemplates: [featureTemplate],
      kitManifest,
      featureManifests: [featureManifest],
    } as never)

    expect(plan.conflicts).toEqual([
      expect.objectContaining({
        code: 'DUPLICATE_UNSAFE_WRITE',
        target: '/projects/demo-app/src/auth.ts',
      }),
    ])
  })

  it('fails fast when feature manifests are misaligned with features', async () => {
    const planner = createPlanner({
      [kitTemplate.rootPath]: [],
      [featureTemplate.rootPath]: [],
    })

    const misalignedManifest: FeatureManifest = {
      schemaVersion: 1,
      type: 'feature',
      slug: 'billing',
      name: 'Billing',
      description: 'Billing feature fixture',
      supports: ['node'],
      requires: [],
      conflictsWith: [],
      operations: [],
    }

    await expect(
      planner.plan({
        projectName: 'demo-app',
        targetDir: '/projects/demo-app',
        packageManager: 'pnpm',
        kit: kitFixture,
        features: [featureFixture],
        kitTemplate,
        featureTemplates: [featureTemplate],
        featureManifests: [misalignedManifest],
      } as never)
    ).rejects.toThrow('Feature manifest order does not match selected features')
  })
})

describe('OperationSorter', () => {
  it('sorts ast operations after copy operations', () => {
    const sorter = new OperationSorter()
    const astOperation: AstOperation = {
      id: 'ast-1',
      type: 'ast.add-named-import',
      target: '/projects/demo-app/src/main.ts',
      named: 'setupAuth',
      from: './auth/setup-auth',
      origin: { type: 'feature', slug: 'auth' },
      description: 'Apply ast.add-named-import from auth',
    }
    const copyOperation: CopyFileOperation = {
      id: 'copy-1',
      type: 'copy-file',
      source: '/templates/base-kit/src/main.ts',
      target: '/projects/demo-app/src/main.ts',
      renderVariables: true,
      overwrite: true,
      origin: { type: 'kit', slug: 'base-kit' },
      description: 'Copy src/main.ts from base-kit',
    }

    const operations = sorter.sort([astOperation, copyOperation])

    expect(operations.map((operation) => operation.type)).toEqual([
      'copy-file',
      'ast.add-named-import',
    ])
  })
})

describe('ConflictDetector', () => {
  it('allows multiple ast operations against the same target', () => {
    const detector = new ConflictDetector()
    const conflicts = detector.detect([
      {
        id: 'ast-1',
        type: 'ast.add-named-import',
        target: '/projects/demo-app/src/main.ts',
        named: 'setupAuth',
        from: './auth/setup-auth',
        origin: { type: 'feature', slug: 'auth' },
        description: 'Apply ast.add-named-import from auth',
      },
      {
        id: 'ast-2',
        type: 'ast.nest.add-module-import',
        target: '/projects/demo-app/src/main.ts',
        namedImport: {
          name: 'AuthModule',
          from: './auth/auth.module',
        },
        moduleName: 'AppModule',
        origin: { type: 'feature', slug: 'auth' },
        description: 'Apply ast.nest.add-module-import from auth',
      },
    ])

    expect(conflicts).toEqual([])
  })

  it('detects copy-file collisions with append and merge targets', () => {
    const detector = new ConflictDetector()
    const conflicts = detector.detect([
      {
        id: 'append-env-1',
        type: 'append-env',
        source: '/templates/auth/.env.example',
        target: '/projects/demo-app/.env.example',
        strategy: 'append-missing',
        origin: { type: 'feature', slug: 'auth' },
        description: 'Append env entries from auth',
      },
      {
        id: 'copy-1',
        type: 'copy-file',
        source: '/templates/auth/files/.env.example',
        target: '/projects/demo-app/.env.example',
        overwrite: true,
        renderVariables: true,
        origin: { type: 'feature', slug: 'auth' },
        description: 'Apply copy-file from auth',
      },
    ])

    expect(conflicts).toEqual([
      expect.objectContaining({
        code: 'DUPLICATE_UNSAFE_WRITE',
        target: '/projects/demo-app/.env.example',
        operationIds: ['append-env-1', 'copy-1'],
      }),
    ])
  })

  it('allows multiple merge and append operations on the same target', () => {
    const detector = new ConflictDetector()
    const conflicts = detector.detect([
      {
        id: 'merge-package-json-1',
        type: 'merge-package-json',
        source: '/templates/auth/package.json',
        target: '/projects/demo-app/package.json',
        strategy: 'safe-merge',
        origin: { type: 'feature', slug: 'auth' },
        description: 'Merge package.json from auth',
      },
      {
        id: 'merge-package-json-2',
        type: 'merge-package-json',
        source: '/templates/billing/package.json',
        target: '/projects/demo-app/package.json',
        strategy: 'safe-merge',
        origin: { type: 'feature', slug: 'billing' },
        description: 'Merge package.json from billing',
      },
      {
        id: 'append-env-1',
        type: 'append-env',
        source: '/templates/auth/.env.example',
        target: '/projects/demo-app/.env.example',
        strategy: 'append-missing',
        origin: { type: 'feature', slug: 'auth' },
        description: 'Append env entries from auth',
      },
      {
        id: 'append-env-2',
        type: 'append-env',
        source: '/templates/billing/.env.example',
        target: '/projects/demo-app/.env.example',
        strategy: 'append-missing',
        origin: { type: 'feature', slug: 'billing' },
        description: 'Append env entries from billing',
      },
      {
        id: 'append-readme-1',
        type: 'append-readme',
        source: '/templates/auth/README.knitto.md',
        target: '/projects/demo-app/README.md',
        heading: 'Authentication',
        origin: { type: 'feature', slug: 'auth' },
        description: 'Append README notes from auth',
      },
      {
        id: 'append-readme-2',
        type: 'append-readme',
        source: '/templates/billing/README.knitto.md',
        target: '/projects/demo-app/README.md',
        heading: 'Billing',
        origin: { type: 'feature', slug: 'billing' },
        description: 'Append README notes from billing',
      },
    ])

    expect(conflicts).toEqual([])
  })

  it('detects later copy-file collisions even when overwrite is false', () => {
    const detector = new ConflictDetector()
    const conflicts = detector.detect([
      {
        id: 'append-env-1',
        type: 'append-env',
        source: '/templates/auth/.env.example',
        target: '/projects/demo-app/.env.example',
        strategy: 'append-missing',
        origin: { type: 'feature', slug: 'auth' },
        description: 'Append env entries from auth',
      },
      {
        id: 'copy-2',
        type: 'copy-file',
        source: '/templates/auth/files/.env.example',
        target: '/projects/demo-app/.env.example',
        overwrite: false,
        renderVariables: true,
        origin: { type: 'feature', slug: 'auth' },
        description: 'Apply copy-file from auth',
      },
    ])

    expect(conflicts).toEqual([
      expect.objectContaining({
        code: 'DUPLICATE_UNSAFE_WRITE',
        target: '/projects/demo-app/.env.example',
        operationIds: ['append-env-1', 'copy-2'],
      }),
    ])
  })

  it('allows kit copy-file before feature merge-package-json on the same target', () => {
    const detector = new ConflictDetector()
    const conflicts = detector.detect([
      {
        id: 'copy-1',
        type: 'copy-file',
        source: '/templates/base-kit/package.json',
        target: '/projects/demo-app/package.json',
        overwrite: true,
        renderVariables: true,
        origin: { type: 'kit', slug: 'base-kit' },
        description: 'Copy package.json from base-kit',
      },
      {
        id: 'merge-package-json-1',
        type: 'merge-package-json',
        source: '/templates/auth/package.json',
        target: '/projects/demo-app/package.json',
        strategy: 'safe-merge',
        origin: { type: 'feature', slug: 'auth' },
        description: 'Merge package.json from auth',
      },
    ])

    expect(conflicts).toEqual([])
  })
})
