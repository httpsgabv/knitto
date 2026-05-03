import { describe, expect, it } from 'vitest'
import { ProjectNameSchema } from './project-name.schema'

describe('ProjectNameSchema', () => {
  it('parses a valid project name', () => {
    const result = ProjectNameSchema.parse(' demo_app-1 ')

    expect(result).toBe('demo_app-1')
  })

  it('rejects an invalid project name', () => {
    const result = ProjectNameSchema.safeParse('Demo App')

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      'Project name must use lowercase letters, numbers, hyphens, or underscores, and start with a letter or number'
    )
  })

  it('rejects an empty project name after trimming', () => {
    const result = ProjectNameSchema.safeParse('   ')

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Project name is required')
  })

  it('rejects a project name longer than 50 characters', () => {
    const result = ProjectNameSchema.safeParse('a'.repeat(51))

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      'Project name must be 50 characters or fewer'
    )
  })

  it('rejects a project name that does not start with a letter or number', () => {
    const result = ProjectNameSchema.safeParse('-demo-app')

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      'Project name must use lowercase letters, numbers, hyphens, or underscores, and start with a letter or number'
    )
  })
})
