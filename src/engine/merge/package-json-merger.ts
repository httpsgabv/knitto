import type { FileSystem } from '@adapters/fs/file-system'
import { sortObjectKeys } from '@shared/json'
import { JsonMerger } from './json-merger'

type PackageJsonShape = Record<string, unknown> & {
  name?: string | undefined
  version?: string | undefined
  scripts?: Record<string, string> | undefined
  dependencies?: Record<string, string> | undefined
  devDependencies?: Record<string, string> | undefined
  peerDependencies?: Record<string, string> | undefined
  optionalDependencies?: Record<string, string> | undefined
}

export class PackageJsonMerger extends JsonMerger {
  constructor(private readonly fileSystem: FileSystem) {
    super()
  }

  async merge(source: string, target: string) {
    const targetJson = (await this.fileSystem.pathExists(target))
      ? ((await this.fileSystem.readJson<PackageJsonShape>(target)) ?? {})
      : {}
    const sourceJson =
      (await this.fileSystem.readJson<PackageJsonShape>(source)) ?? {}

    const mergedScripts = { ...(targetJson.scripts ?? {}) }

    for (const [name, value] of Object.entries(sourceJson.scripts ?? {})) {
      if (!(name in mergedScripts)) {
        mergedScripts[name] = value
      }
    }

    const result: PackageJsonShape = {
      ...targetJson,
      ...sourceJson,
      name: targetJson.name ?? sourceJson.name,
      version: targetJson.version ?? sourceJson.version,
      scripts: sortObjectKeys(mergedScripts),
      dependencies: sortObjectKeys(
        this.mergeRecords(targetJson.dependencies, sourceJson.dependencies)
      ),
      devDependencies: sortObjectKeys(
        this.mergeRecords(
          targetJson.devDependencies,
          sourceJson.devDependencies
        )
      ),
      peerDependencies: sortObjectKeys(
        this.mergeRecords(
          targetJson.peerDependencies,
          sourceJson.peerDependencies
        )
      ),
      optionalDependencies: sortObjectKeys(
        this.mergeRecords(
          targetJson.optionalDependencies,
          sourceJson.optionalDependencies
        )
      ),
    }

    await this.fileSystem.writeJson(target, result)
  }
}
