export type OperationOrigin = {
  type: 'kit' | 'feature'
  slug: string
}

export type BaseFileOperation = {
  id: string
  origin: OperationOrigin
  description: string
}

export type CopyFileOperation = BaseFileOperation & {
  type: 'copy-file'
  source: string
  target: string
  renderVariables: boolean
  overwrite: boolean
}

export type MergePackageJsonOperation = BaseFileOperation & {
  type: 'merge-package-json'
  source: string
  target: string
  strategy: 'safe-merge'
}

export type AppendEnvOperation = BaseFileOperation & {
  type: 'append-env'
  source: string
  target: string
  strategy: 'append-missing'
}

export type AppendReadmeOperation = BaseFileOperation & {
  type: 'append-readme'
  source: string
  target: string
  heading: string
}

export type SkipFileOperation = BaseFileOperation & {
  type: 'skip-file'
  source: string
  reason: string
}

export type FileOperation =
  | CopyFileOperation
  | MergePackageJsonOperation
  | AppendEnvOperation
  | AppendReadmeOperation
  | SkipFileOperation
