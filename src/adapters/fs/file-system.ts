export interface FileSystem {
  pathExists(path: string): Promise<boolean>
}
