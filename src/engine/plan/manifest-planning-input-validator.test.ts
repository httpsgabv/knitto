import path from 'node:path'
import type { Feature } from '@core/catalog/feature'
import type { Kit } from '@core/catalog/kit'
import { Errors } from '@core/errors/errors'
import type { FeatureManifest, KitManifest } from '@core/manifest/manifest'
import type { Template } from '@core/template/template'
import { normalizeSystemPath } from '@shared/paths'
import { describe, expect, it } from 'vitest'
import { ManifestPlanningInputValidator } from './manifest-planning-input-validator'
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
  operations: [],
}

function createInput(overrides: Partial<PlanInput> = {}): PlanInput {
  return {
    projectName: 'demo-app',
    targetDir: '/projects/demo-app',
    packageManager: 'pnpm',
    kit: kitFixture,
    features: [featureFixture],
    kitTemplate,
    featureTemplates: [featureTemplate],
    kitManifest,
    featureManifests: [featureManifest],
    ...overrides,
  }
}

describe('ManifestPlanningInputValidator', () => {
  const validator = new ManifestPlanningInputValidator()
  const manifestPathFor = (templateRoot: string) =>
    normalizeSystemPath(path.join(templateRoot, 'knitto.json'))

  it('returns validated manifests when inputs are aligned', () => {
    expect(validator.validate(createInput())).toEqual({
      kitManifest,
      featureManifests: [featureManifest],
    })
  })

  it('fails when the kit manifest is missing', () => {
    expect(() => validator.validate(createInput({ kitManifest: null }))).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.MISSING_TEMPLATE_MANIFEST,
        message: `Template manifest missing for kit "base-kit": ${manifestPathFor('/templates/base-kit')}`,
      })
    )
  })

  it('normalizes windows kit missing-manifest paths', () => {
    expect(() =>
      validator.validate(
        createInput({
          kitTemplate: { rootPath: 'C:\\templates\\base-kit' },
          kitManifest: null,
        })
      )
    ).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.MISSING_TEMPLATE_MANIFEST,
        message:
          'Template manifest missing for kit "base-kit": C:/templates/base-kit/knitto.json',
      })
    )
  })

  it('fails when feature manifest order does not match selected features', () => {
    expect(() =>
      validator.validate(
        createInput({
          featureManifests: [{ ...featureManifest, slug: 'billing' }],
        })
      )
    ).toThrow('Feature manifest order does not match selected features')
  })

  it('fails when feature templates do not align with selected features', () => {
    expect(() => validator.validate(createInput({ featureTemplates: [] }))).toThrow(
      'Feature templates must align with selected features'
    )
  })

  it('fails when feature manifest count does not align with selected features', () => {
    expect(() => validator.validate(createInput({ featureManifests: [] }))).toThrow(
      'Feature manifests must align with selected features'
    )
  })

  it('fails when a feature manifest entry is missing from an aligned array', () => {
    const featureManifests = new Array<FeatureManifest | null>(1)

    expect(() => validator.validate(createInput({ featureManifests }))).toThrow(
      'Feature manifests must align with selected features'
    )
  })

  it('fails when requiring feature manifests and an aligned slot is undefined', () => {
    const featureManifests = new Array<FeatureManifest | null>(1)
    const requireFeatureManifests = (
      validator as never as {
        requireFeatureManifests(input: PlanInput): FeatureManifest[]
      }
    ).requireFeatureManifests.bind(validator)

    expect(() => requireFeatureManifests(createInput({ featureManifests }))).toThrow(
      'Feature manifests must align with selected features'
    )
  })

  it('uses an empty template root when a missing feature manifest has no template entry', () => {
    const requireFeatureManifests = (
      validator as never as {
        requireFeatureManifests(input: PlanInput): FeatureManifest[]
      }
    ).requireFeatureManifests.bind(validator)

    expect(() =>
      requireFeatureManifests(
        createInput({
          featureTemplates: [],
          featureManifests: [null],
        })
      )
    ).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.MISSING_TEMPLATE_MANIFEST,
        message: 'Template manifest missing for feature "auth": knitto.json',
      })
    )
  })
})
