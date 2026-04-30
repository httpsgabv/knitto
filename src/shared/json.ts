export function sortObjectKeys<T extends Record<string, string>>(
  value: T | undefined
): T | undefined {
  if (!value) {
    return value
  }

  const sortedEntries = Object.entries(value).sort(([left], [right]) =>
    left.localeCompare(right)
  )
  return Object.fromEntries(sortedEntries) as T
}
