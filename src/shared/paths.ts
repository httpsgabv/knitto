export function normalizeSlashes(value: string) {
  return value.replace(/\\+/g, '/')
}

export function normalizeSystemPath(value: string) {
  return normalizeSlashes(value)
}

export function normalizeRelativePath(value: string) {
  return normalizeSlashes(value).replace(/^\//, '')
}
