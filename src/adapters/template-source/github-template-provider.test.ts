import { describe, it, expect, beforeEach } from 'vitest'
import { GithubTemplateProvider } from './github-template-provider'
import { FakeFileSystem } from '../../../test/adapters/fs/fake-file-system'
import { FakeTemplateSourceResolver } from '../../../test/adapters/template-source/fake-template-source-resolver'
import type { TemplateSource } from '@core/catalog/template-source'

describe('GithubTemplateProvider', () => {
  let fakeFileSystem: FakeFileSystem
  let fakeTemplateSourceResolver: FakeTemplateSourceResolver
  let provider: GithubTemplateProvider

  beforeEach(() => {
    fakeFileSystem = new FakeFileSystem()
    fakeTemplateSourceResolver = new FakeTemplateSourceResolver()
    provider = new GithubTemplateProvider(
      fakeFileSystem,
      fakeTemplateSourceResolver
    )
  })

  describe('fetch', () => {
    it('should throw error for invalid github repo reference', async () => {
      const invalidSource: TemplateSource = {
        type: 'github',
        repo: 'invalid-repo',
        name: 'template',
        path: '/templates/',
      }

      await expect(provider.fetch(invalidSource)).rejects.toThrow(
        'Invalid GitHub repo reference: invalid-repo'
      )
    })

    it('should call fileSystem.ensureDir with temp path', async () => {
      const source: TemplateSource = {
        type: 'github',
        repo: 'owner/repo',
        name: 'my-template',
        path: '/templates/',
      }

      await provider.fetch(source)

      const ensureDirCalls = fakeFileSystem.getCallsByMethod('ensureDir')
      expect(ensureDirCalls.length).toBeGreaterThan(0)
    })

    it('should call templateSourceResolver.resolve with correct arguments', async () => {
      const source: TemplateSource = {
        type: 'github',
        repo: 'owner/repo',
        name: 'my-template',
        path: '/templates/',
      }

      await provider.fetch(source)

      const calls = fakeTemplateSourceResolver.getCalls()
      expect(calls.length).toBe(1)
      expect(calls[0]?.source).toEqual(source)
      expect(calls[0]?.targetPath).toContain('knitto-repo-my-template-')
    })

    it('should return template with root path after successful clone', async () => {
      const source: TemplateSource = {
        type: 'github',
        repo: 'owner/repo',
        name: 'my-template',
        path: '/templates/',
      }

      const template = await provider.fetch(source)

      expect(template.rootPath).toContain('knitto-repo-my-template-')
    })

    it('should throw error when template path does not exist after clone', async () => {
      const source: TemplateSource = {
        type: 'github',
        repo: 'owner/repo',
        name: '/not-exist-after-clone/',
        path: '/templates/',
      }

      await expect(provider.fetch(source)).rejects.toThrow(
        'Failed to download template from /templates/'
      )
    })
  })

  describe('fetchMany', () => {
    it('should fetch multiple sources', async () => {
      const sources: TemplateSource[] = [
        {
          type: 'github',
          repo: 'owner/repo1',
          name: 'template1',
          path: '/templates/',
        },
        {
          type: 'github',
          repo: 'owner/repo2',
          name: 'template2',
          path: '/templates/',
        },
      ]

      const templates = await provider.fetchMany(sources)

      expect(templates).toHaveLength(2)
      expect(templates[0]?.rootPath).toContain('knitto-repo1-template1-')
      expect(templates[1]?.rootPath).toContain('knitto-repo2-template2-')
    })
  })
})
