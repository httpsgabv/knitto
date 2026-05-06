import path from 'node:path'

export function normalizeSlashes(value: string) {
  return value.replace(/\\/g, '/')
}

export function normalizeSystemPath(value: string) {
  return normalizeSlashes(value)
}

export function resolveSystemPath(...segments: string[]) {
  return normalizeSystemPath(selectPathModule(...segments).resolve(...segments))
}

export function joinSystemPath(...segments: string[]) {
  return normalizeSystemPath(selectPathModule(...segments).join(...segments))
}

export function relativeSystemPath(from: string, to: string) {
  return normalizeSystemPath(selectPathModule(from, to).relative(from, to))
}

export function isSystemAbsolutePath(value: string) {
  return selectPathModule(value).isAbsolute(value)
}

export function normalizeRelativePath(value: string) {
  return normalizeSlashes(value).replace(/^\//, '')
}

function selectPathModule(...values: string[]) {
  return values.some(isWindowsLikeAbsolutePath) ? path.win32 : path
}

function isWindowsLikeAbsolutePath(value: string) {
  return /^[A-Za-z]:[\\/]/.test(value) || /^([\\/]{2})[^\\/]+[\\/][^\\/]+/.test(value)
}
