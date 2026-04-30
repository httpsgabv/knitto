import type { Shell } from "../shell/shell.js"
import type { GitClient } from "./git-client.js"

export class NodeGitClient implements GitClient {
  constructor(private readonly shell: Shell) {}

  async init(cwd: string): Promise<void> {
    await this.shell.run("git", ["init"], { cwd })
  }
}
