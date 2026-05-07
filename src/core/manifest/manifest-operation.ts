import type z from 'zod'
import {
  AddAllManifestOperationSchema,
  AppendEnvManifestOperationSchema,
  AppendReadmeManifestOperationSchema,
  AstAddNamedImportManifestOperationSchema,
  AstBootstrapExpressionSchema,
  AstNestAddBootstrapCallManifestOperationSchema,
  AstNestAddBootstrapMethodCallManifestOperationSchema,
  AstNestAddBootstrapVariableManifestOperationSchema,
  AstNestAddModuleImportManifestOperationSchema,
  CopyFileManifestOperationSchema,
  ManifestOperationSchema,
  MergePackageJsonManifestOperationSchema,
  AstAddSideEffectImportManifestOperationSchema,
} from './manifest-operation.schema'

export type AddAllManifestOperation = z.infer<
  typeof AddAllManifestOperationSchema
>

export type CopyFileManifestOperation = z.infer<
  typeof CopyFileManifestOperationSchema
>

export type MergePackageJsonManifestOperation = z.infer<
  typeof MergePackageJsonManifestOperationSchema
>

export type AppendEnvManifestOperation = z.infer<
  typeof AppendEnvManifestOperationSchema
>

export type AppendReadmeManifestOperation = z.infer<
  typeof AppendReadmeManifestOperationSchema
>

export type AstAddNamedImportManifestOperation = z.infer<
  typeof AstAddNamedImportManifestOperationSchema
>

export type AstAddSideEffectImportManifestOperation = z.infer<
  typeof AstAddSideEffectImportManifestOperationSchema
>

export type AstBootstrapExpression = z.infer<
  typeof AstBootstrapExpressionSchema
>

export type AstNestAddModuleImportManifestOperation = z.infer<
  typeof AstNestAddModuleImportManifestOperationSchema
>

export type AstNestAddBootstrapCallManifestOperation = z.infer<
  typeof AstNestAddBootstrapCallManifestOperationSchema
>

export type AstNestAddBootstrapVariableManifestOperation = z.infer<
  typeof AstNestAddBootstrapVariableManifestOperationSchema
>

export type AstNestAddBootstrapMethodCallManifestOperation = z.infer<
  typeof AstNestAddBootstrapMethodCallManifestOperationSchema
>

export type ManifestOperation = z.infer<typeof ManifestOperationSchema>
