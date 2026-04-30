export class JsonMerger {
  protected mergeRecords(
    target: Record<string, string> | undefined,
    source: Record<string, string> | undefined
  ): Record<string, string> | undefined {
    if (!target && !source) {
      return undefined
    }

    return {
      ...(target ?? {}),
      ...(source ?? {}),
    }
  }
}
