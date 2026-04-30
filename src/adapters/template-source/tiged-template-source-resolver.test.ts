import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TigedTemplateSourceResolver } from './tiged-template-source-resolver'
import type { TemplateSource } from '@core/catalog/template-source'

vi.mock('tiged')

describe('TigedTemplateSourceResolver', () => {
  let resolver: TigedTemplateSourceResolver

  beforeEach(() => {
    resolver = new TigedTemplateSourceResolver()
    vi.clearAllMocks()
  })

  describe('resolve', () => {
    it('should call tiged with correct github path', async () => {
      const tiged = await import('tiged')
      const mockClone = vi.fn().mockResolvedValue(undefined)
      vi.mocked(tiged.default).mockReturnValue({
        clone: mockClone,
      } as never)

      const source: TemplateSource = {
        type: 'github',
        repo: 'owner/repo',
        name: 'my-template',
        path: '/templates/',
      } as Extract<TemplateSource, { type: 'github' }>

      await resolver.resolve('/target/path', source)

      expect(tiged.default).toHaveBeenCalledWith(
        'owner/repo/templates/my-template',
        {
          disableCache: true,
          force: true,
          verbose: true,
        }
      )
    })

    it('should call emitter.clone with target path', async () => {
      const tiged = await import('tiged')
      const mockClone = vi.fn().mockResolvedValue(undefined)
      vi.mocked(tiged.default).mockReturnValue({
        clone: mockClone,
      } as never)

      const source: TemplateSource = {
        type: 'github',
        repo: 'owner/repo',
        name: 'my-template',
        path: '/templates/',
      } as Extract<TemplateSource, { type: 'github' }>

      await resolver.resolve('/target/path', source)

      expect(mockClone).toHaveBeenCalledWith('/target/path')
    })

    it('should construct correct github path from source', async () => {
      const tiged = await import('tiged')
      const mockClone = vi.fn().mockResolvedValue(undefined)
      vi.mocked(tiged.default).mockReturnValue({
        clone: mockClone,
      } as never)

      const source: TemplateSource = {
        type: 'github',
        repo: 'myorg/myrepo',
        name: 'starter',
        path: '/kits/',
      } as Extract<TemplateSource, { type: 'github' }>

      await resolver.resolve('/some/path', source)

      expect(tiged.default).toHaveBeenCalledWith(
        'myorg/myrepo/kits/starter',
        expect.any(Object)
      )
    })
  })
})
