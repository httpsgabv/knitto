import { describe, it, expect, vi } from 'vitest'
import { CatalogSchema } from '@core/catalog/catalog.schema'
import { Errors } from '@core/errors/errors'
import type { Kit } from '@core/catalog/kit'
import type { Feature } from '@core/catalog/feature'
import { OfficialCatalog } from './official-catalog'
import { KnittoError } from '@core/errors/knitto-error'

const fakeKits: Kit[] = [
  {
    slug: 'test-kit',
    name: 'Test Kit',
    source: { type: 'github', repo: 'test/repo', name: 'test', path: '/' },
    description: 'A test kit',
    compatibleFeatures: ['test-feature'],
  },
]

const fakeFeatures: Feature[] = [
  {
    slug: 'test-feature',
    name: 'Test Feature',
    description: 'A test feature',
    source: { type: 'github', repo: 'test/repo', name: 'test', path: '/' },
    supports: ['test-kit'],
    requires: [],
    conflictsWith: [],
  },
]

describe('OfficialCatalog', () => {
  const catalog = new OfficialCatalog(fakeKits, fakeFeatures)

  describe('listKits', () => {
    it('should return all kits', () => {
      const kits = catalog.listKits()

      expect(kits).toHaveLength(1)
      expect(kits[0]?.slug).toBe('test-kit')
    })

    it('should return a copy of kits array', () => {
      const kits1 = catalog.listKits()
      const kits2 = catalog.listKits()

      expect(kits1).not.toBe(kits2)
    })
  })

  describe('listFeatures', () => {
    it('should return all features', () => {
      const features = catalog.listFeatures()

      expect(features).toHaveLength(1)
      expect(features[0]?.slug).toBe('test-feature')
    })

    it('should return a copy of features array', () => {
      const features1 = catalog.listFeatures()
      const features2 = catalog.listFeatures()

      expect(features1).not.toBe(features2)
    })
  })

  describe('getKit', () => {
    it('should return kit by slug', () => {
      const kit = catalog.getKit('test-kit')

      expect(kit.slug).toBe('test-kit')
      expect(kit.name).toBe('Test Kit')
    })

    it('should throw KnittoError for unknown kit', () => {
      expect(() => catalog.getKit('unknown-kit')).toThrow(
        'Unknown kit: unknown-kit'
      )
    })
  })

  describe('getFeature', () => {
    it('should return feature by slug', () => {
      const feature = catalog.getFeature('test-feature')

      expect(feature.slug).toBe('test-feature')
      expect(feature.name).toBe('Test Feature')
    })

    it('should throw KnittoError for unknown feature', () => {
      expect(() => catalog.getFeature('unknown-feature')).toThrow(
        'Unknown feature: unknown-feature'
      )
    })
  })

  describe('constructor error handling', () => {
    it('should throw KnittoError with INVALID_CATALOG_CONFIGURATION when ZodError occurs', () => {
      const invalidKits = [{ slug: 123 }] as never
      const invalidFeatures = [] as Feature[]

      expect(() => new OfficialCatalog(invalidKits, invalidFeatures)).toThrow(
        KnittoError
      )
      try {
        new OfficialCatalog(invalidKits, invalidFeatures)
      } catch (error) {
        expect(error).toBeInstanceOf(KnittoError)
        expect((error as KnittoError).code).toBe(
          Errors.INVALID_CATALOG_CONFIGURATION
        )
      }
    })

    it('should rethrow non-ZodError as-is', () => {
      const originalError = new Error('Some unexpected error')
      vi.spyOn(CatalogSchema, 'parse').mockImplementation(() => {
        throw originalError
      })

      expect(() => new OfficialCatalog(fakeKits, fakeFeatures)).toThrow(
        'Some unexpected error'
      )

      vi.restoreAllMocks()
    })
  })
})
