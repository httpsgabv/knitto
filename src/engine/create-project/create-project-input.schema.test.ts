import { describe, expect, it } from 'vitest'
import { CreateProjectInputSchema } from './create-project-input.schema'

describe('CreateProjectInputSchema', () => {
  it('parses valid create-project input', () => {
    const result = CreateProjectInputSchema.parse({
      projectName: 'demo-app',
      kitSlug: 'next-base',
      featureSlugs: ['auth'],
      packageManager: 'npm',
      targetDir: ' apps/demo-app ',
      dryRun: true,
      installDependencies: false,
      initializeGit: false,
    })

    expect(result).toEqual({
      projectName: 'demo-app',
      kitSlug: 'next-base',
      featureSlugs: ['auth'],
      packageManager: 'npm',
      targetDir: 'apps/demo-app',
      dryRun: true,
      installDependencies: false,
      initializeGit: false,
    })
  })

  it('applies defaults for omitted optional fields', () => {
    const result = CreateProjectInputSchema.parse({
      projectName: 'demo-app',
      kitSlug: 'next-base',
    })

    expect(result).toEqual({
      projectName: 'demo-app',
      kitSlug: 'next-base',
      featureSlugs: [],
      packageManager: 'pnpm',
      dryRun: false,
      installDependencies: true,
      initializeGit: true,
    })
  })

  it('rejects an invalid project name', () => {
    const result = CreateProjectInputSchema.safeParse({
      projectName: 'Demo App',
      kitSlug: 'next-base',
      featureSlugs: ['auth'],
      packageManager: 'pnpm',
      targetDir: 'apps/demo-app',
      dryRun: true,
      installDependencies: false,
      initializeGit: false,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['projectName'])
  })

  it('rejects a blank kit slug', () => {
    const result = CreateProjectInputSchema.safeParse({
      projectName: 'demo-app',
      kitSlug: '   ',
      featureSlugs: ['auth'],
      packageManager: 'pnpm',
      targetDir: 'apps/demo-app',
      dryRun: true,
      installDependencies: false,
      initializeGit: false,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['kitSlug'])
  })

  it('rejects blank feature slugs', () => {
    const result = CreateProjectInputSchema.safeParse({
      projectName: 'demo-app',
      kitSlug: 'next-base',
      featureSlugs: ['auth', ''],
      packageManager: 'pnpm',
      targetDir: 'apps/demo-app',
      dryRun: true,
      installDependencies: false,
      initializeGit: false,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['featureSlugs', 1])
  })

  it('rejects an unsupported package manager', () => {
    const result = CreateProjectInputSchema.safeParse({
      projectName: 'demo-app',
      kitSlug: 'next-base',
      featureSlugs: ['auth'],
      packageManager: 'pip',
      targetDir: 'apps/demo-app',
      dryRun: true,
      installDependencies: false,
      initializeGit: false,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['packageManager'])
  })

  it('rejects an empty target directory', () => {
    const result = CreateProjectInputSchema.safeParse({
      projectName: 'demo-app',
      kitSlug: 'next-base',
      featureSlugs: ['auth'],
      packageManager: 'pnpm',
      targetDir: '',
      dryRun: true,
      installDependencies: false,
      initializeGit: false,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['targetDir'])
  })

  it('rejects a non-boolean dryRun value', () => {
    const result = CreateProjectInputSchema.safeParse({
      projectName: 'demo-app',
      kitSlug: 'next-base',
      featureSlugs: ['auth'],
      packageManager: 'pnpm',
      targetDir: 'apps/demo-app',
      dryRun: 'yes',
      installDependencies: false,
      initializeGit: false,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['dryRun'])
  })

  it('rejects a non-boolean installDependencies value', () => {
    const result = CreateProjectInputSchema.safeParse({
      projectName: 'demo-app',
      kitSlug: 'next-base',
      featureSlugs: ['auth'],
      packageManager: 'pnpm',
      targetDir: 'apps/demo-app',
      dryRun: true,
      installDependencies: 'no',
      initializeGit: false,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['installDependencies'])
  })

  it('rejects a non-boolean initializeGit value', () => {
    const result = CreateProjectInputSchema.safeParse({
      projectName: 'demo-app',
      kitSlug: 'next-base',
      featureSlugs: ['auth'],
      packageManager: 'pnpm',
      targetDir: 'apps/demo-app',
      dryRun: true,
      installDependencies: false,
      initializeGit: 0,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['initializeGit'])
  })
})
