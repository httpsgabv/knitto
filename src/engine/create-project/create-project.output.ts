import type { GenerationPlan } from '../../core/generation/generation-plan'

export type CreateProjectOutput = {
  projectName: string
  targetDir: string
  plan: GenerationPlan
  executed: boolean
}
