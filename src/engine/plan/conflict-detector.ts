import type { FileOperation } from '@core/generation/file-operation'
import type { PlanConflict } from '@core/generation/plan-conflict'

export class ConflictDetector {
  detect(operations: FileOperation[]): PlanConflict[] {
    const operationsByTarget = new Map<string, FileOperation[]>()

    for (const operation of operations) {
      if (!('target' in operation)) {
        continue
      }

      const list = operationsByTarget.get(operation.target) ?? []
      list.push(operation)
      operationsByTarget.set(operation.target, list)
    }

    const conflicts: PlanConflict[] = []

    for (const [target, group] of operationsByTarget) {
      const copyOperations = group.filter(
        (operation) => operation.type === 'copy-file'
      )

      if (
        copyOperations.length > 1 &&
        copyOperations.some((operation) => !operation.overwrite)
      ) {
        conflicts.push({
          code: 'DUPLICATE_UNSAFE_WRITE',
          message: `Multiple feature files target ${target}`,
          target,
          operationIds: copyOperations.map((operation) => operation.id),
        })
      }
    }

    return conflicts
  }
}
