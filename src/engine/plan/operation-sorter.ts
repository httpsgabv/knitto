import type { GenerationOperation } from '@core/generation/operation'

export class OperationSorter {
  sort(operations: GenerationOperation[]): GenerationOperation[] {
    return [...operations].sort(
      (left, right) => this.rank(left) - this.rank(right)
    )
  }

  private rank(operation: GenerationOperation): number {
    if (operation.type === 'copy-file' && operation.origin.type === 'kit') {
      return 1
    }
    if (operation.type === 'merge-package-json') {
      return 2
    }
    if (operation.type === 'add-package-scripts') {
      return 3
    }
    if (operation.type === 'merge-json') {
      return 4
    }
    if (operation.type === 'append-env') {
      return 5
    }
    if (operation.type === 'upsert-env') {
      return 6
    }
    if (operation.type === 'append-lines') {
      return 7
    }
    if (operation.type === 'append-readme') {
      return 8
    }
    if (operation.type === 'copy-file') {
      return 9
    }
    if (operation.type.startsWith('ast.')) {
      return 10
    }

    return 11
  }
}
