import z from 'zod'

export const TemplateSourceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('github'),
    repo: z.string().min(1),
    name: z.string().min(1),
    path: z.string().min(1),
  }),
])

export type TemplateSource = z.infer<typeof TemplateSourceSchema>