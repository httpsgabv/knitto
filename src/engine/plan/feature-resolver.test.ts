import type { Catalog } from '@core/catalog/catalog'
import type { Feature } from '@core/catalog/feature'
import type { Kit } from '@core/catalog/kit'
import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'
import { describe, expect, it } from 'vitest'
import { FeatureResolver } from './feature-resolver'

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
  compatibleFeatures: ['auth', 'database'],
}

function createFeature(overrides: Partial<Feature> & Pick<Feature, 'slug'>): Feature {
  const { slug, ...rest } = overrides

  return {
    name: slug,
    slug,
    description: `${slug} fixture`,
    source: {
      type: 'github',
      repo: `knitto/${slug}`,
      name: slug,
      path: '.',
    },
    supports: [kitFixture.slug],
    requires: [],
    conflictsWith: [],
    ...rest,
  }
}

class FakeCatalog implements Catalog {
  constructor(
    private readonly features: Feature[],
    private readonly failures: Map<string, Error> = new Map()
  ) {}

  listKits(): Kit[] {
    return [kitFixture]
  }

  listFeatures(): Feature[] {
    return [...this.features]
  }

  getKit(): Kit {
    return kitFixture
  }

  getFeature(slug: string): Feature {
    const failure = this.failures.get(slug)
    if (failure) {
      throw failure
    }

    const feature = this.features.find((entry) => entry.slug === slug)
    if (!feature) {
      throw new KnittoError(`Unknown feature: ${slug}`, Errors.FEATURE_NOT_FOUND)
    }

    return feature
  }
}

describe('FeatureResolver', () => {
  it('resolves unique requested features and their dependencies', () => {
    const catalog = new FakeCatalog([
      createFeature({ slug: 'auth', requires: ['database'] }),
      createFeature({ slug: 'database' }),
    ])
    const resolver = new FeatureResolver(catalog)

    const resolved = resolver.resolve({
      kit: kitFixture,
      featureSlugs: ['auth', 'auth', 'database'],
    })

    expect(resolved.map((feature) => feature.slug)).toEqual(['auth', 'database'])
  })

  it('propagates unknown feature errors from the catalog', () => {
    const resolver = new FeatureResolver(new FakeCatalog([]))

    expect(() =>
      resolver.resolve({
        kit: kitFixture,
        featureSlugs: ['unknown-feature'],
      })
    ).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.FEATURE_NOT_FOUND,
        message: 'Unknown feature: unknown-feature',
      })
    )
  })

  it('propagates unsupported feature errors from the catalog', () => {
    const unsupportedError = new KnittoError(
      'Feature "legacy-auth" is unsupported',
      Errors.INVALID_CREATE_PROJECT_INPUT
    )
    const resolver = new FeatureResolver(
      new FakeCatalog([], new Map([['legacy-auth', unsupportedError]]))
    )

    expect(() =>
      resolver.resolve({
        kit: kitFixture,
        featureSlugs: ['legacy-auth'],
      })
    ).toThrowError(unsupportedError)
  })

  it('fails when a feature requires itself', () => {
    const resolver = new FeatureResolver(
      new FakeCatalog([createFeature({ slug: 'auth', requires: ['auth'] })])
    )

    expect(() =>
      resolver.resolve({
        kit: kitFixture,
        featureSlugs: ['auth'],
      })
    ).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.INVALID_FEATURE_REQUIREMENT,
        message: 'Feature "auth" cannot require itself',
      })
    )
  })
})
