import type { Feature } from '@core/catalog/feature'
import type { Kit } from '@core/catalog/kit'
import { Errors } from '@core/errors/errors'
import { describe, expect, it } from 'vitest'
import { CompatibilityChecker } from './compatibility-checker'

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
  compatibleFeatures: ['auth', 'database', 'notifications'],
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

describe('CompatibilityChecker', () => {
  const checker = new CompatibilityChecker()

  it('accepts features when they are compatible, supported, and satisfy requirements', () => {
    const auth = createFeature({
      slug: 'auth',
      requires: ['database'],
      conflictsWith: ['notifications'],
    })
    const database = createFeature({ slug: 'database' })

    expect(() => checker.check({ kit: kitFixture, features: [auth, database] })).not.toThrow()
  })

  it('fails when a feature is not listed as compatible for the kit', () => {
    const payments = createFeature({ slug: 'payments' })

    expect(() => checker.check({ kit: kitFixture, features: [payments] })).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.INCOMPATIBLE_FEATURE,
        message: 'Feature "payments" is not compatible with kit "base-kit"',
      })
    )
  })

  it('fails when a feature does not support the selected kit', () => {
    const auth = createFeature({ slug: 'auth', supports: ['other-kit'] })

    expect(() => checker.check({ kit: kitFixture, features: [auth] })).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.INCOMPATIBLE_FEATURE,
        message: 'Feature "auth" is not compatible with kit "base-kit"',
      })
    )
  })

  it('fails when a required feature is missing from the selection', () => {
    const auth = createFeature({ slug: 'auth', requires: ['database'] })

    expect(() => checker.check({ kit: kitFixture, features: [auth] })).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.MISSING_REQUIRED_FEATURE,
        message: 'Feature "auth" requires "database"',
      })
    )
  })

  it('fails when selected features conflict with each other', () => {
    const auth = createFeature({ slug: 'auth', conflictsWith: ['notifications'] })
    const notifications = createFeature({ slug: 'notifications' })

    expect(() =>
      checker.check({ kit: kitFixture, features: [auth, notifications] })
    ).toThrowError(
      expect.objectContaining({
        name: 'KnittoError',
        code: Errors.CONFLICTING_FEATURES,
        message: 'Feature "auth" conflicts with "notifications"',
      })
    )
  })
})
