import z from 'zod'

export const projectNameSchema = z.string().min(1, 'Project name is required.')

export type ProjectName = z.infer<typeof projectNameSchema>
