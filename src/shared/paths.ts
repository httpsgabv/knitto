export function normalizeSlashes(value: string) {
  return value.replace(/\\+/g, '/')
}
