export interface Shell {
  run(command: string, args: string[], options: { cwd?: string }): Promise<void>
}
