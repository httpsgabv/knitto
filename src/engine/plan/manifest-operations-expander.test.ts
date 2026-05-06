import path from 'node:path'
import type { Feature } from '@core/catalog/feature'
import type { Kit } from '@core/catalog/kit'
import type { FeatureManifest, KitManifest } from '@core/manifest/manifest'
import type { Template } from '@core/template/template'
import type { TemplateFile } from '@core/template/template-file'
import { normalizeSystemPath } from '@shared/paths'
import { describe, expect, it } from 'vitest'
import { createManifestOperationHandlers } from './handlers/create-manifest-operation-handlers'
import { ManifestOperationBuilder } from './manifest-operation-builder'
import { ManifestOperationPathResolver } from './manifest-operation-path-resolver'
import { ManifestOperationsExpander } from './manifest-operations-expander'
import type { PlanInput } from './plan-input'

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

const basePlanInput: PlanInput = {
  projectName: 'demo-app',
  targetDir: '/projects/demo-app',
  packageManager: 'pnpm',
  kit: kitFixture,
  features: [featureFixture],
  kitTemplate,
  featureTemplates: [featureTemplate],
  kitManifest: null,
  featureManifests: [],
}

describe('ManifestOperationsExpander', () => {
  const resolveFrom = (rootDir: string, manifestPath: string) =>
    normalizeSystemPath(path.resolve(rootDir, manifestPath))

  const expander = new ManifestOperationsExpander(
    new ManifestOperationBuilder(
      createManifestOperationHandlers(),
      new ManifestOperationPathResolver()
    )
  )

  it('expands manifest operations for kit and feature templates', () => {
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

    const operations = expander.expand({
      planInput: basePlanInput,
      kitManifest,
      featureManifests: [featureManifest],
      kitFiles: [
        {
          absolutePath: '/templates/base-kit/src/main.ts',
          relativePath: 'src/main.ts',
        },
      ],
      featureFiles: [
        [
          {
            absolutePath: '/templates/auth/package.json',
            relativePath: 'package.json',
          },
          {
            absolutePath: '/templates/auth/src/auth.ts',
            relativePath: 'src/auth.ts',
          },
        ],
      ],
    })

    expect(operations).toEqual([
      expect.objectContaining({
        type: 'copy-file',
        source: resolveFrom('/templates/base-kit', 'src/main.ts'),
        target: resolveFrom('/projects/demo-app', 'src/main.ts'),
        origin: { type: 'kit', slug: 'base-kit' },
      }),
      expect.objectContaining({
        type: 'merge-package-json',
        source: resolveFrom('/templates/auth', 'package.json'),
        target: resolveFrom('/projects/demo-app', 'package.json'),
        origin: { type: 'feature', slug: 'auth' },
      }),
      expect.objectContaining({
        type: 'copy-file',
        source: resolveFrom('/templates/auth', 'src/auth.ts'),
        target: resolveFrom('/projects/demo-app', 'src/custom-auth.ts'),
        origin: { type: 'feature', slug: 'auth' },
      }),
    ])
  })

  it('uses an empty template root when a feature template is missing', () => {
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

    const operations = expander.expand({
      planInput: {
        ...basePlanInput,
        featureTemplates: [],
      },
      kitManifest: {
        schemaVersion: 1,
        type: 'kit',
        slug: 'base-kit',
        name: 'Base Kit',
        description: 'Base kit fixture',
        supports: [],
        requires: [],
        conflictsWith: [],
        operations: [],
      },
      featureManifests: [featureManifest],
      kitFiles: [],
      featureFiles: [
        [
          {
            absolutePath: '/templates/auth/src/auth.ts',
            relativePath: 'src/auth.ts',
          } satisfies TemplateFile,
        ],
      ],
    })

    expect(operations).toEqual([
      expect.objectContaining({
        type: 'copy-file',
        source: expect.stringMatching(/src\/auth\.ts$/),
        target: resolveFrom('/projects/demo-app', 'src/auth.ts'),
      }),
    ])
  })

  it('fails when feature manifests are not aligned with selected features', () => {
    expect(() =>
      expander.expand({
        planInput: basePlanInput,
        kitManifest: {
          schemaVersion: 1,
          type: 'kit',
          slug: 'base-kit',
          name: 'Base Kit',
          description: 'Base kit fixture',
          supports: [],
          requires: [],
          conflictsWith: [],
          operations: [],
        },
        featureManifests: [],
        kitFiles: [],
        featureFiles: [[]],
      })
    ).toThrow('Feature manifests must align with selected features')
  })

  it('uses an empty feature file list when a feature file entry is missing', () => {
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

    const operations = expander.expand({
      planInput: basePlanInput,
      kitManifest: {
        schemaVersion: 1,
        type: 'kit',
        slug: 'base-kit',
        name: 'Base Kit',
        description: 'Base kit fixture',
        supports: [],
        requires: [],
        conflictsWith: [],
        operations: [],
      },
      featureManifests: [featureManifest],
      kitFiles: [],
      featureFiles: [],
    })

    expect(operations).toEqual([])
  })

  it('ignores slash style when excluding explicit sources from add-all', () => {
    const operations = expander.expand({
      planInput: {
        ...basePlanInput,
        featureTemplates: [{ rootPath: 'C:/templates/auth' }],
        targetDir: 'C:/projects/demo-app',
      },
      kitManifest: {
        schemaVersion: 1,
        type: 'kit',
        slug: 'base-kit',
        name: 'Base Kit',
        description: 'Base kit fixture',
        supports: [],
        requires: [],
        conflictsWith: [],
        operations: [],
      },
      featureManifests: [
        {
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
        },
      ],
      kitFiles: [],
      featureFiles: [
        [
          {
            absolutePath: 'C:/templates/auth/src/auth.ts',
            relativePath: 'src\\auth.ts',
          },
        ],
      ],
    })

    expect(operations).toEqual([
      expect.objectContaining({
        type: 'copy-file',
        source: 'C:/templates/auth/src/auth.ts',
        target: 'C:/projects/demo-app/src/custom-auth.ts',
        origin: { type: 'feature', slug: 'auth' },
      }),
    ])
  })
})
