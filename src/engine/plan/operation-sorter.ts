import type { FileOperation } from '../../core/generation/file-operation'

export class OperationSorter {
  sort(operations: FileOperation[]): FileOperation[] {
    return [...operations].sort(
      (left, right) => this.rank(left) - this.rank(right)
    )
  }

  private rank(operation: FileOperation): number {
    if (operation.type === 'copy-file' && operation.origin.type === 'kit') {
      return 1
    }
    if (operation.type === 'merge-package-json') {
      return 2
    }
    if (operation.type === 'append-env') {
      return 3
    }
    if (operation.type === 'append-readme') {
      return 4
    }

    return 5
  }
}
