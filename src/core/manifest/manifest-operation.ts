import type z from 'zod'
import {
  AddAllManifestOperationSchema,
  AppendEnvManifestOperationSchema,
  AppendReadmeManifestOperationSchema,
  AstAddNamedImportManifestOperationSchema,
  AstNestAddModuleImportManifestOperationSchema,
  CopyFileManifestOperationSchema,
  ManifestOperationSchema,
  MergePackageJsonManifestOperationSchema,
} from './manifest-operation.schema'

export type AddAllManifestOperation = z.infer<typeof AddAllManifestOperationSchema>

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

export type AstNestAddModuleImportManifestOperation = z.infer<
  typeof AstNestAddModuleImportManifestOperationSchema
>

export type ManifestOperation = z.infer<typeof ManifestOperationSchema>
