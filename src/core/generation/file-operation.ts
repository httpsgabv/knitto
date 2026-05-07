export type OperationOrigin = {
  type: 'kit' | 'feature'
  slug: string
}

export type BaseOperation = {
  id: string
  origin: OperationOrigin
  description: string
}

export type CopyFileOperation = BaseOperation & {
  type: 'copy-file'
  source: string
  target: string
  renderVariables: boolean
  overwrite: boolean
}

export type MergePackageJsonOperation = BaseOperation & {
  type: 'merge-package-json'
  source: string
  target: string
  strategy: 'safe-merge'
}

export type AppendEnvOperation = BaseOperation & {
  type: 'append-env'
  source: string
  target: string
  strategy: 'append-missing'
}

export type UpsertEnvOperation = BaseOperation & {
  type: 'upsert-env'
  target: string
  values: Record<string, string>
}

export type AppendReadmeOperation = BaseOperation & {
  type: 'append-readme'
  source: string
  target: string
  heading: string
}

export type SkipFileOperation = BaseOperation & {
  type: 'skip-file'
  source: string
  reason: string
}

export type FileOperation =
  | CopyFileOperation
  | MergePackageJsonOperation
  | AppendEnvOperation
  | UpsertEnvOperation
  | AppendReadmeOperation
  | SkipFileOperation
