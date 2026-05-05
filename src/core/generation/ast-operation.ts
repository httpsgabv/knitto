import type { BaseOperation } from './file-operation'

export type AstBootstrapExpression =
  | {
      kind: 'identifier'
      name: string
    }
  | {
      kind: 'string'
      value: string
    }
  | {
      kind: 'number'
      value: number
    }
  | {
      kind: 'boolean'
      value: boolean
    }
  | {
      kind: 'null'
    }
  | {
      kind: 'array'
      items: AstBootstrapExpression[]
    }
  | {
      kind: 'object'
      properties: Array<{
        key: string
        value: AstBootstrapExpression
      }>
    }
  | {
      kind: 'member'
      object: string
      property: string
    }
  | {
      kind: 'call'
      callee:
        | {
            kind: 'identifier'
            name: string
          }
        | {
            kind: 'member'
            object: string
            property: string
          }
      arguments: AstBootstrapExpression[]
    }
  | {
      kind: 'new'
      constructor:
        | {
            kind: 'identifier'
            name: string
          }
        | {
            kind: 'member'
            object: string
            property: string
          }
      arguments: AstBootstrapExpression[]
    }

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

export type AstNestAddBootstrapCallOperation = BaseOperation & {
  type: 'ast.nest.add-bootstrap-call'
  target: string
  appVar: string
  call: {
    method: string
    arguments: AstBootstrapExpression[]
  }
}

export type AstOperation =
  | AstAddNamedImportOperation
  | AstNestAddModuleImportOperation
  | AstNestAddBootstrapCallOperation
