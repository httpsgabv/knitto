import { describe, expect, it } from 'vitest'
import { FakeFileSystem } from '../../../test/adapters/fs/fake-file-system'
import { EnvMerger } from './env-merger'

describe('EnvMerger', () => {
  it('creates the target env file when it does not exist', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new EnvMerger(fileSystem)

    fileSystem.addFile(
      '/template/.env',
      [
        '# Base settings',
        '',
        'API_URL=https://api.example.com',
        'PORT=3000',
      ].join('\n')
    )

    await merger.merge('/template/.env', '/project/.env')

    expect(await fileSystem.readFile('/project/.env', 'utf8')).toBe(
      ['API_URL=https://api.example.com', 'PORT=3000', ''].join('\n')
    )
  })

  it('appends only missing env keys to an existing target file', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new EnvMerger(fileSystem)

    fileSystem.addFile(
      '/template/.env',
      [
        '# Feature defaults',
        'API_URL=https://new.example.com',
        'FEATURE_FLAG=true',
        ' SPACED_VALUE = yes ',
        'INVALID LINE',
        ' =ignored',
        '',
        'FEATURE_FLAG=false',
      ].join('\n')
    )
    fileSystem.addFile(
      '/project/.env',
      ['API_URL=https://api.example.com', ''].join('\n')
    )

    await merger.merge('/template/.env', '/project/.env')

    expect(await fileSystem.readFile('/project/.env', 'utf8')).toBe(
      [
        'API_URL=https://api.example.com',
        '',
        'FEATURE_FLAG=true',
        ' SPACED_VALUE = yes ',
        '',
      ].join('\n')
    )
  })

  it('does not write when all source env keys already exist in the target', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new EnvMerger(fileSystem)

    fileSystem.addFile(
      '/template/.env',
      [
        '# Existing keys only',
        'API_URL=https://new.example.com',
        ' PORT = 4000 ',
      ].join('\n')
    )
    fileSystem.addFile(
      '/project/.env',
      ['API_URL=https://api.example.com', 'PORT=3000', ''].join('\n')
    )

    await merger.merge('/template/.env', '/project/.env')

    expect(await fileSystem.readFile('/project/.env', 'utf8')).toBe(
      ['API_URL=https://api.example.com', 'PORT=3000', ''].join('\n')
    )
    expect(fileSystem.getCallsByMethod('writeFile')).toHaveLength(0)
  })

  it('creates a target env file from provided values when it does not exist', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new EnvMerger(fileSystem)

    await merger.upsert('/project/.env', {
      DATABASE_URL: 'postgresql://localhost:5432/app',
      POSTGRES_USER: 'postgres',
    })

    expect(await fileSystem.readFile('/project/.env', 'utf8')).toBe(
      [
        'DATABASE_URL=postgresql://localhost:5432/app',
        'POSTGRES_USER=postgres',
        '',
      ].join('\n')
    )
  })

  it('replaces existing keys and appends missing keys while preserving comments', async () => {
    const fileSystem = new FakeFileSystem()
    const merger = new EnvMerger(fileSystem)

    fileSystem.addFile(
      '/project/.env',
      [
        '# Existing settings',
        'DATABASE_URL=postgresql://localhost:5432/old',
        'PORT=3000',
        '',
      ].join('\n')
    )

    await merger.upsert('/project/.env', {
      DATABASE_URL: 'postgresql://localhost:5432/new',
      POSTGRES_USER: 'postgres',
    })

    expect(await fileSystem.readFile('/project/.env', 'utf8')).toBe(
      [
        '# Existing settings',
        'DATABASE_URL=postgresql://localhost:5432/new',
        'PORT=3000',
        '',
        'POSTGRES_USER=postgres',
        '',
      ].join('\n')
    )
  })
})
