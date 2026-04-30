import { describe, it, expect, beforeEach } from 'vitest'
import { PackageManagerResolver } from './package-manager-resolver'
import { FakeShell } from '@test/adapters/git/shell/fake-shell'
import { NpmPackageManager } from './npm-package-manager'
import { PnpmPackageManager } from './pnpm-package-manager'
import { YarnPackageManager } from './yarn-package-manager'
import { BunPackageManager } from './bun-package-manager'

describe('PackageManagerResolver', () => {
  let fakeShell: FakeShell
  let resolver: PackageManagerResolver

  beforeEach(() => {
    fakeShell = new FakeShell()
    resolver = new PackageManagerResolver(fakeShell)
  })

  describe('resolve', () => {
    it('should return PnpmPackageManager for pnpm', () => {
      const result = resolver.resolve('pnpm')
      expect(result).toBeInstanceOf(PnpmPackageManager)
    })

    it('should return YarnPackageManager for yarn', () => {
      const result = resolver.resolve('yarn')
      expect(result).toBeInstanceOf(YarnPackageManager)
    })

    it('should return NpmPackageManager for npm', () => {
      const result = resolver.resolve('npm')
      expect(result).toBeInstanceOf(NpmPackageManager)
    })

    it('should return BunPackageManager for bun', () => {
      const result = resolver.resolve('bun')
      expect(result).toBeInstanceOf(BunPackageManager)
    })

    it('should throw KnittoError for unsupported package manager', () => {
      expect(() => resolver.resolve('unknown' as never)).toThrow()
    })
  })
})
