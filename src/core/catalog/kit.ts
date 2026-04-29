import z from 'zod'

export const KitSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
})

export type Kit = {
  name: string
  slug: string
  description: string
}
