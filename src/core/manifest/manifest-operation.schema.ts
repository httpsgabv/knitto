import z from 'zod'

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

export const ManifestOperationSchema = z.discriminatedUnion('type', [
  AddAllManifestOperationSchema,
  CopyFileManifestOperationSchema,
  MergePackageJsonManifestOperationSchema,
  AppendEnvManifestOperationSchema,
  AppendReadmeManifestOperationSchema,
  AstAddNamedImportManifestOperationSchema,
  AstNestAddModuleImportManifestOperationSchema,
])
