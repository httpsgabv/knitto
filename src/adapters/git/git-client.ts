export interface GitClient {
  init(cwd: string): Promise<void>
}
