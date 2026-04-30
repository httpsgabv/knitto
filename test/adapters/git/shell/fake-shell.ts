import type { Shell } from '@adapters/shell/shell'

export interface FakeShellCall {
  command: string
  args: string[]
  options: { cwd: string }
}

export class FakeShell implements Shell {
  private calls: FakeShellCall[] = []

  async run(
    command: string,
    args: string[],
    options: { cwd: string }
  ): Promise<void> {
    this.calls.push({ command, args, options })

    await Promise.resolve()
  }

  getCalls(): FakeShellCall[] {
    return [...this.calls]
  }

  getCallsByCommand(command: string): FakeShellCall[] {
    return this.calls.filter((call) => call.command === command)
  }

  clearCalls(): void {
    this.calls = []
  }
}
