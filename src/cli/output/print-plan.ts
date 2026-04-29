import type { GenerationPlan } from '../../core/generation/generation-plan'
import { log } from './log'

export function printPlan(plan: GenerationPlan) {
  log.section('Generation Plan')
  log.table([
    { label: 'Project', value: plan.project.name },
    { label: 'Target', value: plan.project.targetDir },
    { label: 'Package Manager', value: plan.project.packageManager },
  ])

  log.section('Operations')
  for (const operation of plan.operations) {
    log.muted(
      `- [${operation.origin.slug}] ${operation.type} :: ${operation.description}`
    )
  }

  if (plan.conflicts.length > 0) {
    log.section('Conflicts')
    for (const conflict of plan.conflicts) {
      log.warning(`- ${conflict.message}`)
    }
  }
}
