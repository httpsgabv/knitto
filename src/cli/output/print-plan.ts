import type { GenerationPlan } from '@core/generation/generation-plan'
import { printer } from './printer'

export function printPlan(plan: GenerationPlan) {
  printer.section('Generation Plan')
  printer.table([
    { label: 'Project', value: plan.project.name },
    { label: 'Target', value: plan.project.targetDir },
    { label: 'Package Manager', value: plan.project.packageManager },
  ])

  printer.section('Operations')
  for (const operation of plan.operations) {
    printer.muted(
      `- [${operation.origin.slug}] ${operation.type} :: ${operation.description}`
    )
  }

  if (plan.conflicts.length > 0) {
    printer.section('Conflicts')
    for (const conflict of plan.conflicts) {
      printer.warning(`- ${conflict.message}`)
    }
  }
}
