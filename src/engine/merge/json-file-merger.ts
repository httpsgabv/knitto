import type { FileSystem } from '@adapters/fs/file-system'
import { Errors } from '@core/errors/errors'
import { KnittoError } from '@core/errors/knitto-error'

type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject
type JsonObject = { [key: string]: JsonValue }

export class JsonFileMerger {
  constructor(private readonly fileSystem: FileSystem) {}

  async merge(source: string, target: string) {
    const sourceJson =
      (await this.fileSystem.readJson<JsonObject>(source)) ?? {}
    const targetJson = (await this.fileSystem.pathExists(target))
      ? ((await this.fileSystem.readJson<JsonObject>(target)) ?? {})
      : {}

    const merged = this.mergeValue(targetJson, sourceJson, '')

    await this.fileSystem.writeFile(
      target,
      `${JSON.stringify(merged, null, 2)}\n`
    )
  }

  private mergeValue(
    target: JsonValue,
    source: JsonValue,
    path: string
  ): JsonValue {
    if (Array.isArray(target) && Array.isArray(source)) {
      return this.mergeArrays(target, source)
    }

    if (this.isPlainObject(target) && this.isPlainObject(source)) {
      return this.mergeObjects(target, source, path)
    }

    if (target === source) {
      return target
    }

    throw new KnittoError(
      `JSON value conflict at ${path || '<root>'}.`,
      Errors.JSON_MERGE_CONFLICT
    )
  }

  private mergeObjects(
    target: JsonObject,
    source: JsonObject,
    path: string
  ): JsonObject {
    const result: JsonObject = { ...target }

    for (const [key, sourceValue] of Object.entries(source)) {
      const nextPath = path ? `${path}.${key}` : key
      const targetValue = result[key]

      if (targetValue === undefined) {
        result[key] = sourceValue
        continue
      }

      result[key] = this.mergeValue(targetValue, sourceValue, nextPath)
    }

    return result
  }

  private mergeArrays(target: JsonValue[], source: JsonValue[]): JsonValue[] {
    const result = [...target]

    for (const value of source) {
      if (!result.some((entry) => this.isEqual(entry, value))) {
        result.push(value)
      }
    }

    return result
  }

  private isPlainObject(value: JsonValue): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  private isEqual(left: JsonValue, right: JsonValue): boolean {
    return JSON.stringify(left) === JSON.stringify(right)
  }
}
