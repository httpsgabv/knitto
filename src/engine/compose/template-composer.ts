import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'
import type { GenerationPlan } from '@core/generation/generation-plan'
import type { OperationExecutor } from './operation-executor'

export class TemplateComposer {
  constructor(private readonly operationExecutor: OperationExecutor) {}

  async compose(plan: GenerationPlan) {
    if (plan.conflicts.length > 0) {
      throw new KnittoError(
        'Cannot compose project with plan conflicts',
        Errors.PLAN_HAS_CONFLICTS,
        plan.conflicts
      )
    }

    for (const operation of plan.operations) {
      await this.operationExecutor.execute(operation, plan.variables)
    }
  }
}
