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

export type AppendLinesOperation = BaseOperation & {
  type: 'append-lines'
  target: string
  lines: string[]
}

export type AddPackageScriptsOperation = BaseOperation & {
  type: 'add-package-scripts'
  target: string
  scripts: Record<string, string>
}

export type MergeJsonOperation = BaseOperation & {
  type: 'merge-json'
  source: string
  target: string
  strategy: 'deep-merge'
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
  | AppendLinesOperation
  | AddPackageScriptsOperation
  | MergeJsonOperation
  | AppendReadmeOperation
  | SkipFileOperation
