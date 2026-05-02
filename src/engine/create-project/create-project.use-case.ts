import type { CreateProjectInput } from './create-project.input'
import type { CreateProjectInputValidator } from './create-project-input.validator'
import type { CreateProjectOutput } from './create-project.output'
import type { FeatureManifest, KitManifest } from '@core/manifest/manifest'
import path from 'node:path'
import type { FileSystem } from '@adapters/fs/file-system'
import { KnittoError } from '@core/errors/knitto-error'
import { Errors } from '@core/errors/errors'
import type { TemplateSourceProvider } from '@adapters/template-source/template-source-provider'
import type { Catalog } from '@core/catalog/catalog'
import type { GenerationPlanner } from '../plan/generation-planner'
import type { FeatureResolver } from '../plan/feature-resolver'
import type { CompatibilityChecker } from '../plan/compatibility-checker'
import type { TemplateComposer } from '../compose/template-composer'
import type { ManifestLoader } from '../manifest/manifest-loader'
import type { PackageManagerResolver } from '@adapters/package-manager/package-manager-resolver'
import type { GitClient } from '@adapters/git/git-client'
import { printer } from '@cli/output/printer'

export class CreateProjectUseCase {
  constructor(
    private readonly inputValidator: CreateProjectInputValidator,
    private readonly catalog: Catalog,
    private readonly featureResolver: FeatureResolver,
    private readonly compatibilityChecker: CompatibilityChecker,
    private readonly templateProvider: TemplateSourceProvider,
    private readonly manifestLoader: ManifestLoader,
    private readonly generationPlanner: GenerationPlanner,
    private readonly templateComposer: TemplateComposer,
    private readonly packageManagerResolver: PackageManagerResolver,
    private readonly gitClient: GitClient,
    private readonly fileSystem: FileSystem
  ) {}

  async execute(input: CreateProjectInput): Promise<CreateProjectOutput> {
    const data = this.inputValidator.validate(input)
    const targetDir = path.resolve(data.targetDir ?? data.projectName)

    if (await this.fileSystem.pathExists(targetDir)) {
      throw new KnittoError(
        `Target directory already exists: ${targetDir}`,
        Errors.TARGET_DIR_EXISTS
      )
    }

    const kit = this.catalog.getKit(data.kitSlug)
    const features = this.featureResolver.resolve({
      kit,
      featureSlugs: data.featureSlugs,
    })

    this.compatibilityChecker.check({
      kit,
      features,
    })

    const kitTemplate = await this.templateProvider.fetch(kit.source)
    const featureTemplates = await this.templateProvider.fetchMany(
      features.map((feature) => feature.source)
    )
    const kitManifest = (await this.manifestLoader.load(kitTemplate.rootPath, {
      type: 'kit',
      slug: kit.slug,
    })) as KitManifest | null
    const featureManifests = (await this.manifestLoader.loadMany(
      features.map((feature, index) => {
        const template = featureTemplates[index]

        if (template === undefined) {
          throw new Error('Feature templates must align with selected features')
        }

        return {
          templateRoot: template.rootPath,
          expectedOrigin: {
            type: 'feature' as const,
            slug: feature.slug,
          },
        }
      })
    )) as Array<FeatureManifest | null>

    const plan = await this.generationPlanner.plan({
      projectName: data.projectName,
      targetDir,
      packageManager: data.packageManager,
      kit,
      features,
      kitTemplate,
      featureTemplates,
      kitManifest,
      featureManifests,
    })

    printer.muted(JSON.stringify(plan, null, 2))

    if (plan.conflicts.length > 0) {
      throw new KnittoError(
        'Generation plan contains conflicts',
        Errors.PLAN_HAS_CONFLICTS,
        plan.conflicts
      )
    }

    if (data.dryRun) {
      return {
        projectName: data.projectName,
        targetDir,
        plan,
        executed: false,
      }
    }

    await this.templateComposer.compose(plan)

    if (data.installDependencies) {
      const packageManager = this.packageManagerResolver.resolve(
        data.packageManager
      )
      await packageManager.install(targetDir)
    }

    if (data.initializeGit) {
      await this.gitClient.init(targetDir)
    }

    return {
      projectName: data.projectName,
      targetDir,
      plan,
      executed: true,
    }
  }
}
