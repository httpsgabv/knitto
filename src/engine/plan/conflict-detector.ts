import type { GenerationOperation } from '@core/generation/operation'
import type { PlanConflict } from '@core/generation/plan-conflict'

export class ConflictDetector {
  detect(operations: GenerationOperation[]): PlanConflict[] {
    const operationsByTarget = new Map<string, GenerationOperation[]>()

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

      const destructiveCollision = this.findDestructiveCopyCollision(group)

      if (destructiveCollision !== undefined) {
        conflicts.push({
          code: 'DUPLICATE_UNSAFE_WRITE',
          message: `Copy operation would overwrite generated content at ${target}`,
          target,
          operationIds: destructiveCollision,
        })
      }
    }

    return conflicts
  }

  private isMergeOrAppendOperation(operation: GenerationOperation): boolean {
    return (
      operation.type === 'merge-package-json' ||
      operation.type === 'merge-json' ||
      operation.type === 'add-package-scripts' ||
      operation.type === 'append-env' ||
      operation.type === 'upsert-env' ||
      operation.type === 'append-lines' ||
      operation.type === 'append-readme'
    )
  }

  private findDestructiveCopyCollision(
    operations: GenerationOperation[]
  ): string[] | undefined {
    for (let index = 0; index < operations.length; index += 1) {
      const operation = operations[index]

      if (operation === undefined) {
        continue
      }

      if (!this.isMergeOrAppendOperation(operation)) {
        continue
      }

      for (const laterOperation of operations.slice(index + 1)) {
        if (laterOperation.type === 'copy-file') {
          return [operation.id, laterOperation.id]
        }
      }
    }

    return undefined
  }
}
