import z from 'zod'
import { ProjectNameSchema } from '@core/project/project-name.schema'

export const CreateProjectInputSchema = z.object({
  projectName: ProjectNameSchema,
  kitSlug: z.string().trim().min(1, 'Kit is required'),
  featureSlugs: z.array(z.string().trim().min(1)).default([]),
  packageManager: z.enum(['npm', 'yarn', 'pnpm', 'bun']).default('pnpm'),
  targetDir: z.string().trim().min(1).optional(),
  dryRun: z.boolean().default(false),
  installDependencies: z.boolean().default(true),
  initializeGit: z.boolean().default(true),
})

export type CreateProjectInputData = z.infer<typeof CreateProjectInputSchema>
