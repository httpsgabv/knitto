import type z from 'zod'
import {
  AddAllManifestOperationSchema,
  AppendEnvManifestOperationSchema,
  AppendLinesManifestOperationSchema,
  AddPackageScriptsManifestOperationSchema,
  MergeJsonManifestOperationSchema,
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
  UpsertEnvManifestOperationSchema,
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

export type UpsertEnvManifestOperation = z.infer<
  typeof UpsertEnvManifestOperationSchema
>

export type AppendLinesManifestOperation = z.infer<
  typeof AppendLinesManifestOperationSchema
>

export type AddPackageScriptsManifestOperation = z.infer<
  typeof AddPackageScriptsManifestOperationSchema
>

export type MergeJsonManifestOperation = z.infer<
  typeof MergeJsonManifestOperationSchema
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
