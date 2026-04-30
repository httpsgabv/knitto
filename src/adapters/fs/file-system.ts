export interface FileSystem {
  pathExists(path: string): Promise<boolean>
  ensureDir(path: string): Promise<void>
  readFile(path: string, encoding: BufferEncoding): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  readJson<T>(path: string): Promise<T>
  writeJson(path: string, value: unknown): Promise<void>
  listFiles(root: string): Promise<string[]>
}
