import z from 'zod'

const IdentifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/
const IdentifierSchema = z.string().regex(IdentifierPattern)

type AstBootstrapIdentifierExpression = {
  kind: 'identifier'
  name: string
}

type AstBootstrapStringExpression = {
  kind: 'string'
  value: string
}

type AstBootstrapNumberExpression = {
  kind: 'number'
  value: number
}

type AstBootstrapBooleanExpression = {
  kind: 'boolean'
  value: boolean
}

type AstBootstrapNullExpression = {
  kind: 'null'
}

type AstBootstrapMemberExpression = {
  kind: 'member'
  object: string
  property: string
}

type AstBootstrapCallCalleeExpression =
  | AstBootstrapIdentifierExpression
  | AstBootstrapMemberExpression

export type AstBootstrapExpression =
  | AstBootstrapIdentifierExpression
  | AstBootstrapStringExpression
  | AstBootstrapNumberExpression
  | AstBootstrapBooleanExpression
  | AstBootstrapNullExpression
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
  | AstBootstrapMemberExpression
  | {
      kind: 'call'
      callee: AstBootstrapCallCalleeExpression
      arguments: AstBootstrapExpression[]
    }
  | {
      kind: 'new'
      constructor: AstBootstrapCallCalleeExpression
      arguments: AstBootstrapExpression[]
    }

const AstBootstrapIdentifierExpressionSchema = z.object({
  kind: z.literal('identifier'),
  name: IdentifierSchema,
})

const AstBootstrapStringExpressionSchema = z.object({
  kind: z.literal('string'),
  value: z.string(),
})

const AstBootstrapNumberExpressionSchema = z.object({
  kind: z.literal('number'),
  value: z.number(),
})

const AstBootstrapBooleanExpressionSchema = z.object({
  kind: z.literal('boolean'),
  value: z.boolean(),
})

const AstBootstrapNullExpressionSchema = z.object({
  kind: z.literal('null'),
})

const AstBootstrapMemberExpressionSchema = z.object({
  kind: z.literal('member'),
  object: IdentifierSchema,
  property: IdentifierSchema,
})

const AstBootstrapMethodReceiverSchema = z.discriminatedUnion('kind', [
  AstBootstrapIdentifierExpressionSchema,
  AstBootstrapMemberExpressionSchema,
])

const AstBootstrapCalleeExpressionSchema = z.discriminatedUnion('kind', [
  AstBootstrapIdentifierExpressionSchema,
  AstBootstrapMemberExpressionSchema,
])

export const AstBootstrapExpressionSchema: z.ZodType<AstBootstrapExpression> =
  z.lazy(() =>
    z.discriminatedUnion('kind', [
      AstBootstrapIdentifierExpressionSchema,
      AstBootstrapStringExpressionSchema,
      AstBootstrapNumberExpressionSchema,
      AstBootstrapBooleanExpressionSchema,
      AstBootstrapNullExpressionSchema,
      z.object({
        kind: z.literal('array'),
        items: z.array(AstBootstrapExpressionSchema),
      }),
      z.object({
        kind: z.literal('object'),
        properties: z.array(
          z.object({
            key: z.string().min(1),
            value: AstBootstrapExpressionSchema,
          })
        ),
      }),
      AstBootstrapMemberExpressionSchema,
      z.object({
        kind: z.literal('call'),
        callee: AstBootstrapCalleeExpressionSchema,
        arguments: z.array(AstBootstrapExpressionSchema),
      }),
      z.object({
        kind: z.literal('new'),
        constructor: AstBootstrapCalleeExpressionSchema,
        arguments: z.array(AstBootstrapExpressionSchema),
      }),
    ])
  )

export const AddAllManifestOperationSchema = z.object({
  type: z.literal('add-all'),
})

export const CopyFileManifestOperationSchema = z.object({
  type: z.literal('copy-file'),
  source: z.string().min(1),
  target: z.string().min(1),
  overwrite: z.boolean(),
  renderVariables: z.boolean().default(true),
})

export const MergePackageJsonManifestOperationSchema = z.object({
  type: z.literal('merge-package-json'),
  source: z.string().min(1),
  target: z.string().min(1).default('package.json'),
  strategy: z.literal('safe-merge').default('safe-merge'),
})

export const AppendEnvManifestOperationSchema = z.object({
  type: z.literal('append-env'),
  source: z.string().min(1),
  target: z.string().min(1).default('.env.example'),
  strategy: z.literal('append-missing').default('append-missing'),
})

export const AppendReadmeManifestOperationSchema = z.object({
  type: z.literal('append-readme'),
  source: z.string().min(1),
  target: z.string().min(1).default('README.md'),
  heading: z.string().min(1),
})

export const AstAddNamedImportManifestOperationSchema = z.object({
  type: z.literal('ast.add-named-import'),
  target: z.string().min(1),
  named: z.string().min(1),
  from: z.string().min(1),
})

export const AstNestAddModuleImportManifestOperationSchema = z.object({
  type: z.literal('ast.nest.add-module-import'),
  target: z.string().min(1),
  import: z.object({
    named: z.string().min(1),
    from: z.string().min(1),
  }),
  moduleName: z.string().min(1),
})

export const AstNestAddBootstrapCallManifestOperationSchema = z.object({
  type: z.literal('ast.nest.add-bootstrap-call'),
  target: z.string().min(1),
  appVar: IdentifierSchema,
  call: z.object({
    method: IdentifierSchema,
    arguments: z.array(AstBootstrapExpressionSchema),
  }),
})

export const AstNestAddBootstrapVariableManifestOperationSchema = z.object({
  type: z.literal('ast.nest.add-bootstrap-variable'),
  target: z.string().min(1),
  declarationKind: z.enum(['const', 'let']),
  name: IdentifierSchema,
  initializer: AstBootstrapExpressionSchema,
})

export const AstNestAddBootstrapMethodCallManifestOperationSchema = z.object({
  type: z.literal('ast.nest.add-bootstrap-method-call'),
  target: z.string().min(1),
  receiver: AstBootstrapMethodReceiverSchema,
  method: IdentifierSchema,
  arguments: z.array(AstBootstrapExpressionSchema),
})

export const ManifestOperationSchema = z.discriminatedUnion('type', [
  AddAllManifestOperationSchema,
  CopyFileManifestOperationSchema,
  MergePackageJsonManifestOperationSchema,
  AppendEnvManifestOperationSchema,
  AppendReadmeManifestOperationSchema,
  AstAddNamedImportManifestOperationSchema,
  AstNestAddModuleImportManifestOperationSchema,
  AstNestAddBootstrapCallManifestOperationSchema,
  AstNestAddBootstrapVariableManifestOperationSchema,
  AstNestAddBootstrapMethodCallManifestOperationSchema,
])
