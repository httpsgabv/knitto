import type { BaseOperation } from './file-operation'

export type AstAddNamedImportOperation = BaseOperation & {
  type: 'ast.add-named-import'
  target: string
  named: string
  from: string
}

export type AstNestAddModuleImportOperation = BaseOperation & {
  type: 'ast.nest.add-module-import'
  target: string
  namedImport: {
    name: string
    from: string
  }
  moduleName: string
}

export type AstOperation =
  | AstAddNamedImportOperation
  | AstNestAddModuleImportOperation
