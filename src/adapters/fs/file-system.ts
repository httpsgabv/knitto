export interface FileSystem {
  pathExists(path: string): Promise<boolean>
  ensureDir(path: string): Promise<void>
}
