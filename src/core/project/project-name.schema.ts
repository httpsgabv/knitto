import { z } from 'zod'

export const ProjectNameSchema = z
  .string()
  .trim()
  .min(1, 'Project name is required')
  .max(50, 'Project name must be 50 characters or fewer')
  .regex(
    /^[a-z0-9][a-z0-9_-]*$/,
    'Project name must use lowercase letters, numbers, hyphens, or underscores, and start with a letter or number'
  )
